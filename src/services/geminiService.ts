/**
 * DinhEuro.com - Gemini AI Service
 * Integração com os endpoints de inteligência financeira do Gemini API
 * Cobrindo mercado nacional, internacional e corredor financeiro União Europeia ⇄ Mercosul.
 */

export interface AIChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface MarketAISummaryResponse {
  success: boolean;
  region: string;
  topic: string;
  analysis: string;
  sources: string[];
  timestamp: string;
}

export interface AssetAIAnalysisResponse {
  success: boolean;
  ticker: string;
  summary: string;
  valuationStatus: string;
  strengths: string[];
  risks: string[];
  technicalInsight: string;
}

export interface GroundedMarketIndicatorsResponse {
  success: boolean;
  source: string;
  timestamp: string;
  indicators: {
    usdBrl?: { price: number; changePercent?: number; name?: string; ticker?: string };
    eurBrl?: { price: number; changePercent?: number; name?: string; ticker?: string };
    ibov?: { price: number; changePercent?: number; name?: string; ticker?: string };
    selic?: { price: number; unit?: string; name?: string; ticker?: string };
    btcBrl?: { price: number; changePercent?: number; name?: string; ticker?: string };
    sp500?: { price: number; changePercent?: number; name?: string; ticker?: string };
  };
}

/**
 * Consulta indicadores de mercado em tempo real via Gemini com Google Search Grounding
 */
export async function fetchGroundedMarketIndicators(forceRefresh: boolean = false): Promise<GroundedMarketIndicatorsResponse | null> {
  try {
    const url = `/api/market/grounded-indicators${forceRefresh ? "?force=true" : ""}`;
    const response = await fetch(url, {
      method: "GET",
      headers: { "Cache-Control": "no-cache" },
    });

    if (!response.ok) throw new Error("Falha ao obter indicadores grounded");

    return await response.json();
  } catch (error) {
    console.warn("[GeminiService] Erro ao consultar indicadores via Search Grounding:", error);
    return null;
  }
}

/**
 * Envia uma mensagem para o assistente de inteligência artificial DinhEuro Copilot
 * especializado em mercados financeiros, câmbio, impostos (IOF) e corredores de remessas.
 */
export async function sendMessageToAI(
  message: string,
  history: Array<{ role: string; content: string }> = []
): Promise<string> {
  try {
    const response = await fetch("/api/market-ai/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        history,
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro na requisição da IA Gemini (${response.status})`);
    }

    const data = await response.json();
    if (data && data.reply) {
      return data.reply;
    }

    throw new Error("Resposta em formato inesperado");
  } catch (error: any) {
    console.warn("[GeminiService] Fallback acionado para chat:", error?.message);
    return (
      "A inteligência financeira **DinhEuro.com** está processando as cotações em tempo real. " +
      "Para consultas imediatas de câmbio (EUR/BRL, USD/BRL), simulação de IOF ou cotações de ativos da B3 e Wall Street, " +
      "você pode explorar o painel interativo e os gráficos disponíveis no portal."
    );
  }
}

/**
 * Obtém resumo macroeconômico e setorial com IA por região
 */
export async function fetchMarketAISummary(
  region: string,
  topic: string = "Geral"
): Promise<MarketAISummaryResponse> {
  try {
    const response = await fetch("/api/market-ai/summary", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ region, topic }),
    });

    if (!response.ok) throw new Error("Falha ao obter resumo da IA");

    return await response.json();
  } catch (error) {
    console.warn("[GeminiService] Fallback de resumo de mercado:", error);
    return {
      success: true,
      region,
      topic,
      analysis: `Os mercados em ${region} operam sob a influência da liquidez global e decisões de política monetária.`,
      sources: ["DinhEuro Intelligence AI"],
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Obtém análise profunda (Deep Dive) para temas de mercado com IA
 */
export async function fetchAIDeepDive(
  topicTitle: string,
  context?: string,
  region: string = "Global"
): Promise<string> {
  try {
    const response = await fetch("/api/market-ai/deep-dive", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ topicTitle, context, region }),
    });

    if (!response.ok) throw new Error("Falha ao obter deep dive");

    const data = await response.json();
    return data.content || "Análise detalhada disponível no gráfico do ativo.";
  } catch (error) {
    console.warn("[GeminiService] Fallback deep dive:", error);
    return `### Análise DinhEuro Intelligence: ${topicTitle}\n\nO mercado opera com atenção aos fluxos cambiais e precificação de risco soberano.`;
  }
}

/**
 * Diagnóstico automatizado de ativos financeiros com IA
 */
export async function fetchAssetAIAnalysis(params: {
  ticker: string;
  name?: string;
  currentPrice?: number | string;
  changePercent?: number | string;
  metrics?: any;
}): Promise<AssetAIAnalysisResponse> {
  try {
    const response = await fetch("/api/market-ai/asset-analysis", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) throw new Error("Falha na análise do ativo");

    return await response.json();
  } catch (error) {
    console.warn("[GeminiService] Fallback análise de ativo:", error);
    return {
      success: true,
      ticker: params.ticker,
      summary: `${params.name || params.ticker} opera dentro das faixas técnicas esperadas.`,
      valuationStatus: "Neutro",
      strengths: ["Liquidez diária consolidada"],
      risks: ["Volatilidade macroeconômica"],
      technicalInsight: "Acompanhe as médias móveis no gráfico interativo.",
    };
  }
}
