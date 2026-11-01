// DinhEuro Push Notifications Service
// Suporte a Alertas em Tempo Real (Desktop e Mobile) via PWA Service Worker & Notification API

import { Asset } from "../types/finance";

export interface AssetPriceAlert {
  id: string;
  ticker: string;
  name: string;
  category: string;
  basePrice: number;
  currentPrice?: number;
  thresholdPercent: number; // e.g. 1.0, 2.0, 5.0
  direction: "any" | "above" | "below";
  enabled: boolean;
  createdAt: number;
  lastNotifiedPrice?: number;
  lastNotifiedAt?: number;
}

export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  vibrate: boolean;
  breakingNews: boolean;
  marketEvents: {
    copom: boolean;
    fed: boolean;
    ecb: boolean;
    circuitBreaker: boolean;
  };
  assetAlerts: AssetPriceAlert[];
}

const STORAGE_KEY = "dinheuro_notification_settings_v1";

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: false,
  sound: true,
  vibrate: true,
  breakingNews: true,
  marketEvents: {
    copom: true,
    fed: true,
    ecb: true,
    circuitBreaker: true,
  },
  assetAlerts: [
    {
      id: "alert-petr4",
      ticker: "PETR4",
      name: "Petrobras PN",
      category: "América Latina",
      basePrice: 47.99,
      thresholdPercent: 2.0,
      direction: "any",
      enabled: true,
      createdAt: Date.now() - 3600000,
    },
    {
      id: "alert-usdBrl",
      ticker: "USD/BRL",
      name: "Dólar Comercial",
      category: "Câmbio",
      basePrice: 5.18,
      thresholdPercent: 1.0,
      direction: "any",
      enabled: true,
      createdAt: Date.now() - 7200000,
    },
    {
      id: "alert-ibov",
      ticker: "IBOV",
      name: "Índice Bovespa",
      category: "América Latina",
      basePrice: 183477,
      thresholdPercent: 1.5,
      direction: "any",
      enabled: true,
      createdAt: Date.now() - 10800000,
    },
    {
      id: "alert-btc",
      ticker: "BTC",
      name: "Bitcoin",
      category: "Criptoativos",
      basePrice: 83430,
      thresholdPercent: 3.0,
      direction: "any",
      enabled: true,
      createdAt: Date.now() - 14400000,
    },
  ],
};

class NotificationService {
  private settings: NotificationSettings;
  private listeners: Array<(settings: NotificationSettings) => void> = [];
  private lastAlertTimes: Record<string, number> = {};

  constructor() {
    this.settings = this.loadSettings();
  }

  // Detect device environment
  public getDeviceType(): "mobile" | "desktop" {
    if (typeof window === "undefined" || !navigator) return "desktop";
    const ua = navigator.userAgent.toLowerCase();
    if (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
      return "mobile";
    }
    return "desktop";
  }

  // Check if browser supports Notifications
  public isSupported(): boolean {
    if (typeof window === "undefined") return false;
    return "Notification" in window && "serviceWorker" in navigator;
  }

  // Get current browser permission
  public getPermission(): NotificationPermission | "unsupported" {
    if (!this.isSupported()) return "unsupported";
    return Notification.permission;
  }

  // Request native permission
  public async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      return "denied";
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        this.updateSettings({ enabled: true });
        this.registerPushSubscription();
      } else {
        this.updateSettings({ enabled: false });
      }
      return permission;
    } catch (err) {
      console.error("[NotificationService] Erro ao solicitar permissão:", err);
      return "denied";
    }
  }

  // Register push endpoint with backend (if active)
  private async registerPushSubscription() {
    try {
      if (!("serviceWorker" in navigator)) return;
      const reg = await navigator.serviceWorker.ready;
      let subscription = await reg.pushManager.getSubscription();

      // Send to server to register client
      await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceType: this.getDeviceType(),
          permission: Notification.permission,
          userAgent: navigator.userAgent,
          subscription: subscription || null,
          settings: this.settings,
        }),
      }).catch(() => {
        // Safe silence if offline
      });
    } catch (e) {
      console.warn("[NotificationService] Push registration note:", e);
    }
  }

  // Load settings from localStorage
  private loadSettings(): NotificationSettings {
    if (typeof window === "undefined") return DEFAULT_SETTINGS;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          marketEvents: { ...DEFAULT_SETTINGS.marketEvents, ...parsed.marketEvents },
          assetAlerts: parsed.assetAlerts || DEFAULT_SETTINGS.assetAlerts,
        };
      }
    } catch (e) {
      console.warn("[NotificationService] Erro ao ler configurações locais:", e);
    }
    return DEFAULT_SETTINGS;
  }

  // Save settings to localStorage
  private saveSettings() {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
      this.notifyListeners();
      this.registerPushSubscription();
    } catch (e) {
      console.error("[NotificationService] Erro ao salvar configurações:", e);
    }
  }

  public getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  public updateSettings(partial: Partial<NotificationSettings>) {
    this.settings = { ...this.settings, ...partial };
    this.saveSettings();
  }

  public subscribe(callback: (settings: NotificationSettings) => void): () => void {
    this.listeners.push(callback);
    callback(this.settings);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notifyListeners() {
    for (const listener of this.listeners) {
      listener(this.settings);
    }
  }

  // Add or update an asset price alert
  public addAssetAlert(alert: Omit<AssetPriceAlert, "id" | "createdAt"> & { id?: string }) {
    const id = alert.id || `alert-${Date.now()}`;
    const newAlert: AssetPriceAlert = {
      ...alert,
      id,
      createdAt: Date.now(),
    };

    // Replace if exists, or append
    const existingIndex = this.settings.assetAlerts.findIndex(
      (a) => a.ticker.toUpperCase() === alert.ticker.toUpperCase()
    );

    let updatedAlerts = [...this.settings.assetAlerts];
    if (existingIndex >= 0) {
      updatedAlerts[existingIndex] = { ...updatedAlerts[existingIndex], ...newAlert };
    } else {
      updatedAlerts.push(newAlert);
    }

    this.updateSettings({ assetAlerts: updatedAlerts });
    return newAlert;
  }

  public removeAssetAlert(id: string) {
    const filtered = this.settings.assetAlerts.filter((a) => a.id !== id);
    this.updateSettings({ assetAlerts: filtered });
  }

  public toggleAssetAlert(id: string) {
    const updated = this.settings.assetAlerts.map((a) =>
      a.id === id ? { ...a, enabled: !a.enabled } : a
    );
    this.updateSettings({ assetAlerts: updated });
  }

  // Play gentle fintech alert sound (Web Audio API)
  public playAlertSound() {
    if (!this.settings.sound || typeof window === "undefined") return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc2.type = "triangle";

      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc1.frequency.exponentialRampToValueAtTime(880.0, ctx.currentTime + 0.12); // A5

      osc2.frequency.setValueAtTime(440.0, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.35);
      osc2.stop(ctx.currentTime + 0.35);
    } catch {
      // Audio context may require user interaction
    }
  }

  // Send a real notification (via ServiceWorker showNotification or window Notification)
  public async sendNotification(
    title: string,
    options: {
      body: string;
      icon?: string;
      badge?: string;
      tag?: string;
      data?: any;
      actions?: Array<{ action: string; title: string }>;
    }
  ): Promise<boolean> {
    if (!this.isSupported() || Notification.permission !== "granted") {
      return false;
    }

    this.playAlertSound();

    const notifOptions: NotificationOptions = {
      body: options.body,
      icon: options.icon || "/icon-192.png",
      badge: options.badge || "/icon-192.png",
      tag: options.tag || "dinheuro-alert",
      vibrate: this.settings.vibrate ? [120, 60, 120, 60, 200] : undefined,
      renotify: true,
      timestamp: Date.now(),
      data: options.data || { url: "/" },
      actions: options.actions || [
        { action: "open", title: "📈 Abrir DinhEuro" },
        { action: "close", title: "Fechar" },
      ],
    } as any;

    try {
      // Strategy 1: ServiceWorker Registration (Best for Desktop & Mobile background)
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration && "showNotification" in registration) {
          await registration.showNotification(title, notifOptions);
          return true;
        }
      }

      // Strategy 2: Direct Window Notification API
      const notif = new Notification(title, notifOptions);
      notif.onclick = () => {
        window.focus();
        if (options.data && options.data.url) {
          window.location.href = options.data.url;
        }
        notif.close();
      };
      return true;
    } catch (err) {
      console.warn("[NotificationService] Fallback to Window Notification:", err);
      try {
        const fallback = new Notification(title, {
          body: options.body,
          icon: "/icon-192.png",
        });
        fallback.onclick = () => window.focus();
        return true;
      } catch (e) {
        console.error("[NotificationService] Erro final ao exibir notificação:", e);
        return false;
      }
    }
  }

  // Immediate Test Notification for User Validation
  public async triggerTestNotification(type: "asset" | "news" | "market"): Promise<boolean> {
    const isGranted = Notification.permission === "granted";
    if (!isGranted) {
      const perm = await this.requestPermission();
      if (perm !== "granted") return false;
    }

    const device = this.getDeviceType() === "mobile" ? "Dispositivo Móvel" : "Desktop";

    if (type === "asset") {
      return this.sendNotification("🔔 DinhEuro • Alerta de Cotação", {
        body: `PETR4 valorizou +3,24% e atingiu R$ 49,55. Notificação entregue com sucesso em seu ${device}!`,
        tag: "test-asset-alert",
        data: { url: "/?asset=petr4", assetId: "petr4" },
        actions: [
          { action: "view_petr4", title: "Ver PETR4" },
          { action: "close", title: "Dispensar" },
        ],
      });
    }

    if (type === "news") {
      return this.sendNotification("⚡ DinhEuro • Plantão de Notícias B3", {
        body: "URGENTE: Ibovespa atinge novo recorde histórico impulsionado por fluxo estrangeiro e commodities.",
        tag: "test-news-alert",
        data: { url: "/?tab=América+Latina" },
        actions: [
          { action: "read_news", title: "Ler Notícia" },
          { action: "close", title: "Dispensar" },
        ],
      });
    }

    // Market / Central Banks
    return this.sendNotification("🏛️ DinhEuro • Decisão de Política Monetária", {
      body: "COPOM / SELIC: Banco Central do Brasil anuncia manutenção da taxa Selic em 10,75% a.a. com comunicado favorável.",
      tag: "test-macro-alert",
      data: { url: "/?tab=América+Latina" },
      actions: [
        { action: "view_macro", title: "Ver Análise" },
        { action: "close", title: "Dispensar" },
      ],
    });
  }

  // Real-time price evaluator: triggers alert if price exceeds threshold
  public evaluateAssetPrices(liveAssets: Asset[]) {
    if (!this.settings.enabled || Notification.permission !== "granted") {
      return;
    }

    const now = Date.now();
    const COOLDOWN_MS = 3 * 60 * 1000; // 3 minutes cooldown per asset alert

    for (const alert of this.settings.assetAlerts) {
      if (!alert.enabled) continue;

      const liveAsset = liveAssets.find(
        (a) =>
          a.ticker.toUpperCase() === alert.ticker.toUpperCase() ||
          a.id.toLowerCase() === alert.id.replace("alert-", "").toLowerCase()
      );

      if (!liveAsset || !liveAsset.price || liveAsset.price <= 0) continue;

      const base = alert.basePrice || liveAsset.price;
      const current = liveAsset.price;
      const pctChange = ((current - base) / base) * 100;
      const absChange = Math.abs(pctChange);

      const lastAlertTime = this.lastAlertTimes[alert.id] || 0;
      if (now - lastAlertTime < COOLDOWN_MS) continue;

      let shouldTrigger = false;
      let reason = "";

      if (alert.direction === "any" && absChange >= alert.thresholdPercent) {
        shouldTrigger = true;
        reason = pctChange >= 0 ? `subiu +${pctChange.toFixed(2)}%` : `caiu ${pctChange.toFixed(2)}%`;
      } else if (alert.direction === "above" && pctChange >= alert.thresholdPercent) {
        shouldTrigger = true;
        reason = `ultrapassou a meta de alta (+${pctChange.toFixed(2)}%)`;
      } else if (alert.direction === "below" && pctChange <= -alert.thresholdPercent) {
        shouldTrigger = true;
        reason = `recuou além do limite (${pctChange.toFixed(2)}%)`;
      }

      if (shouldTrigger) {
        this.lastAlertTimes[alert.id] = now;
        const currencySymbol = liveAsset.currency === "BRL" ? "R$" : "$";
        this.sendNotification(`📈 Alerta DinhEuro: ${alert.ticker}`, {
          body: `${alert.name} (${alert.ticker}) ${reason}, cotado a ${currencySymbol} ${current.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`,
          tag: `price-alert-${alert.ticker}`,
          data: { url: `/?asset=${liveAsset.id}`, assetId: liveAsset.id },
        });
      }
    }
  }
}

export const notificationService = new NotificationService();
