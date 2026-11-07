/**
 * DinhEuro Finanças - Serviço de Streaming Push em Tempo Real (Server-Sent Events)
 * Conecta diretamente ao listener de Webhook e WebSocket do Finnhub no servidor DinhEuro,
 * eliminando a necessidade de polling constante a cada 15 segundos.
 */

import { LiveQuotePayload } from "./marketDataService";

type PriceUpdateListener = (quotes: LiveQuotePayload[]) => void;
type StatusListener = (connected: boolean, details?: { webhookActive?: boolean; lastPush?: number }) => void;

class MarketStreamService {
  private eventSource: EventSource | null = null;
  private isStreamConnected = false;
  private listeners: Set<PriceUpdateListener> = new Set();
  private statusListeners: Set<StatusListener> = new Set();
  private reconnectTimeoutId: any = null;
  private pushCount = 0;
  private lastPushTimestamp: number | null = null;
  private isWebhookActive = false;

  constructor() {
    // Inicialização sob demanda
  }

  /**
   * Inicia a conexão SSE com o backend do DinhEuro
   */
  public connect(): void {
    if (typeof window === "undefined" || typeof EventSource === "undefined") {
      return;
    }

    if (this.eventSource) {
      if (this.eventSource.readyState === EventSource.OPEN) return;
      this.disconnect();
    }

    try {
      const streamUrl = `/api/market/stream`;
      const es = new EventSource(streamUrl);
      this.eventSource = es;

      es.addEventListener("open", () => {
        this.isStreamConnected = true;
        this.notifyStatus(true);
      });

      es.addEventListener("connected", (event: MessageEvent) => {
        this.isStreamConnected = true;
        try {
          const data = JSON.parse(event.data);
          this.isWebhookActive = Boolean(data.webhookActive);
        } catch {
          this.isWebhookActive = true;
        }
        this.notifyStatus(true);
      });

      es.addEventListener("snapshot", (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          if (Array.isArray(data?.quotes) && data.quotes.length > 0) {
            this.pushCount += data.quotes.length;
            this.lastPushTimestamp = Date.now();
            this.notifyQuotes(data.quotes);
          }
        } catch (e) {
          console.warn("[MarketStream] Falha ao processar snapshot inicial:", e);
        }
      });

      es.addEventListener("price_update", (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          if (Array.isArray(data?.quotes) && data.quotes.length > 0) {
            this.pushCount += data.quotes.length;
            this.lastPushTimestamp = Date.now();
            this.notifyQuotes(data.quotes);
            this.notifyStatus(true);
          }
        } catch (e) {
          console.warn("[MarketStream] Falha ao processar atualização push de preço:", e);
        }
      });

      es.addEventListener("error", () => {
        this.isStreamConnected = false;
        this.notifyStatus(false);
        this.eventSource?.close();
        this.eventSource = null;

        // Tenta reconexão em 5 segundos
        if (!this.reconnectTimeoutId) {
          this.reconnectTimeoutId = setTimeout(() => {
            this.reconnectTimeoutId = null;
            this.connect();
          }, 5000);
        }
      });
    } catch (err) {
      console.warn("[MarketStream] Não foi possível abrir o EventSource:", err);
      this.isStreamConnected = false;
      this.notifyStatus(false);
    }
  }

  /**
   * Encerra a conexão SSE
   */
  public disconnect(): void {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.isStreamConnected = false;
    this.notifyStatus(false);
  }

  /**
   * Inscreve um ouvinte para receber atualizações instantâneas de preço push
   */
  public subscribePriceUpdates(callback: PriceUpdateListener): () => void {
    this.listeners.add(callback);
    // Conecta automaticamente se for o primeiro ouvinte registrado
    if (this.listeners.size === 1 && !this.eventSource) {
      this.connect();
    }
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Inscreve um ouvinte para monitorar o status da conexão push/webhook
   */
  public subscribeStatus(callback: StatusListener): () => void {
    this.statusListeners.add(callback);
    callback(this.isStreamConnected, {
      webhookActive: this.isWebhookActive,
      lastPush: this.lastPushTimestamp || undefined,
    });
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  private notifyQuotes(quotes: LiveQuotePayload[]): void {
    for (const listener of this.listeners) {
      try {
        listener(quotes);
      } catch (err) {
        console.error("[MarketStream] Erro no ouvinte de cotações:", err);
      }
    }
  }

  private notifyStatus(connected: boolean): void {
    for (const listener of this.statusListeners) {
      try {
        listener(connected, {
          webhookActive: this.isWebhookActive,
          lastPush: this.lastPushTimestamp || undefined,
        });
      } catch {}
    }
  }

  public isConnected(): boolean {
    return this.isStreamConnected;
  }

  public getPushCount(): number {
    return this.pushCount;
  }

  public getLastPushTime(): number | null {
    return this.lastPushTimestamp;
  }

  public isWebhookEnabled(): boolean {
    return this.isWebhookActive;
  }
}

export const marketStreamService = new MarketStreamService();
