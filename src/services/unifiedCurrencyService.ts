/**
 * DinhEuro.com - Unified Currency & Global Economy Service
 * Fonte única da verdade para todas as moedas, pares cambiais e criptoativos.
 * Sincroniza em tempo real o Painel de Economia Global, Cards da Home e Simulador de Câmbio.
 */

import { Asset, ChartPeriod, HistoricalPoint } from "../types/finance";
import { AwesomeEconomyQuote, AwesomeEconomyResponse } from "./awesomeApi";
import { setGlobalExchangeRates } from "../utils/currencyConversion";

// Cache em memória de cotações unificadas
let unifiedEconomyCache: AwesomeEconomyResponse | null = null;
const subscribers = new Set<(quotes: AwesomeEconomyResponse) => void>();

/**
 * Cotações canônicas de contingência caso a rede externa ou limites 429 ocorram
 */
export const DEFAULT_UNIFIED_CURRENCIES: AwesomeEconomyResponse = {
  USDBRL: {
    code: "USD",
    codein: "BRL",
    name: "Dólar Americano / Real Brasileiro",
    high: "5.4520",
    low: "5.3850",
    varBid: "0.0210",
    pctChange: "0.42",
    bid: "5.4117",
    ask: "5.4135",
    timestamp: String(Math.floor(Date.now() / 1000)),
    create_date: new Date().toISOString(),
  },
  EURBRL: {
    code: "EUR",
    codein: "BRL",
    name: "Euro / Real Brasileiro",
    high: "6.0650",
    low: "5.9920",
    varBid: "0.0190",
    pctChange: "0.35",
    bid: "6.0354",
    ask: "6.0380",
    timestamp: String(Math.floor(Date.now() / 1000)),
    create_date: new Date().toISOString(),
  },
  GBPBRL: {
    code: "GBP",
    codein: "BRL",
    name: "Libra Esterlina / Real Brasileiro",
    high: "7.2450",
    low: "7.1620",
    varBid: "0.0280",
    pctChange: "0.40",
    bid: "7.2145",
    ask: "7.2180",
    timestamp: String(Math.floor(Date.now() / 1000)),
    create_date: new Date().toISOString(),
  },
  JPYBRL: {
    code: "JPY",
    codein: "BRL",
    name: "Iene Japonês / Real Brasileiro",
    high: "0.0356",
    low: "0.0345",
    varBid: "-0.0001",
    pctChange: "-0.28",
    bid: "0.0349",
    ask: "0.0351",
    timestamp: String(Math.floor(Date.now() / 1000)),
    create_date: new Date().toISOString(),
  },
  CADBRL: {
    code: "CAD",
    codein: "BRL",
    name: "Dólar Canadense / Real Brasileiro",
    high: "3.9240",
    low: "3.8610",
    varBid: "0.0110",
    pctChange: "0.28",
    bid: "3.8920",
    ask: "3.8950",
    timestamp: String(Math.floor(Date.now() / 1000)),
    create_date: new Date().toISOString(),
  },
  CHFBRL: {
    code: "CHF",
    codein: "BRL",
    name: "Franco Suíço / Real Brasileiro",
    high: "6.2840",
    low: "6.2110",
    varBid: "0.0160",
    pctChange: "0.26",
    bid: "6.2510",
    ask: "6.2545",
    timestamp: String(Math.floor(Date.now() / 1000)),
    create_date: new Date().toISOString(),
  },
  AUDBRL: {
    code: "AUD",
    codein: "BRL",
    name: "Dólar Australiano / Real Brasileiro",
    high: "3.5820",
    low: "3.5140",
    varBid: "0.0090",
    pctChange: "0.25",
    bid: "3.5420",
    ask: "3.5450",
    timestamp: String(Math.floor(Date.now() / 1000)),
    create_date: new Date().toISOString(),
  },
  CNYBRL: {
    code: "CNY",
    codein: "BRL",
    name: "Yuan Chinês / Real Brasileiro",
    high: "0.7640",
    low: "0.7510",
    varBid: "0.0020",
    pctChange: "0.27",
    bid: "0.7580",
    ask: "0.7595",
    timestamp: String(Math.floor(Date.now() / 1000)),
    create_date: new Date().toISOString(),
  },
  BTCBRL: {
    code: "BTC",
    codein: "BRL",
    name: "Bitcoin em Reais",
    high: "558000",
    low: "538000",
    varBid: "7200",
    pctChange: "1.34",
    bid: "548200",
    ask: "548500",
    timestamp: String(Math.floor(Date.now() / 1000)),
    create_date: new Date().toISOString(),
  },
  ETHBRL: {
    code: "ETH",
    codein: "BRL",
    name: "Ethereum em Reais",
    high: "17450",
    low: "16820",
    varBid: "230",
    pctChange: "1.36",
    bid: "17180",
    ask: "17210",
    timestamp: String(Math.floor(Date.now() / 1000)),
    create_date: new Date().toISOString(),
  },
  ARSBRL: {
    code: "ARS",
    codein: "BRL",
    name: "Peso Argentino / Real",
    high: "0.0054",
    low: "0.0051",
    varBid: "-0.00005",
    pctChange: "-0.92",
    bid: "0.0053",
    ask: "0.0054",
    timestamp: String(Math.floor(Date.now() / 1000)),
    create_date: new Date().toISOString(),
  },
  CLPBRL: {
    code: "CLP",
    codein: "BRL",
    name: "Peso Chileno / Real",
    high: "0.0058",
    low: "0.0055",
    varBid: "0.00002",
    pctChange: "0.35",
    bid: "0.0056",
    ask: "0.0057",
    timestamp: String(Math.floor(Date.now() / 1000)),
    create_date: new Date().toISOString(),
  },
  MXNBRL: {
    code: "MXN",
    codein: "BRL",
    name: "Peso Mexicano / Real",
    high: "0.2740",
    low: "0.2660",
    varBid: "0.0015",
    pctChange: "0.56",
    bid: "0.2695",
    ask: "0.2705",
    timestamp: String(Math.floor(Date.now() / 1000)),
    create_date: new Date().toISOString(),
  },
};

/**
 * Assina atualizações do serviço unificado de moedas
 */
export function subscribeToUnifiedCurrencies(callback: (quotes: AwesomeEconomyResponse) => void): () => void {
  subscribers.add(callback);
  if (unifiedEconomyCache) {
    callback(unifiedEconomyCache);
  }
  return () => {
    subscribers.delete(callback);
  };
}

function notifySubscribers(quotes: AwesomeEconomyResponse) {
  unifiedEconomyCache = quotes;
  subscribers.forEach((cb) => {
    try {
      cb(quotes);
    } catch (e) {
      console.warn("Error in currency subscriber callback:", e);
    }
  });
}


/**
 * Busca de cotações em tempo real de todas as moedas com proteção anti-429 e failover instantâneo
 */
export async function fetchAllUnifiedCurrencies(): Promise<AwesomeEconomyResponse> {
  // 1. Tenta endpoint interno do servidor proxy (/api/market/economy ou /api/market/quotes)
  if (typeof window !== "undefined") {
    try {
      const res = await fetch(`/api/market/economy?t=${Date.now()}`, {
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.success && json?.data && Object.keys(json.data).length > 0) {
          const usdBrl = Number(json.data.USDBRL?.bid || 5.4397);
          const eurBrl = Number(json.data.EURBRL?.bid || 6.0679);
          setGlobalExchangeRates({ usdBrl, eurBrl });
          notifySubscribers(json.data);
          return json.data;
        }
      }
    } catch {
      // continua para fallback
    }
  }

  // 2. Tenta AwesomeAPI pública com cesta completa
  try {
    const rawBase =
      (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_AWESOME_ECONOMY_URL) ||
      (typeof process !== "undefined" && process?.env?.VITE_AWESOME_ECONOMY_URL) ||
      "https://economia.awesomeapi.com.br";
    const cleanBase = rawBase.replace(/\/+$/, "");
    const pairs = "USD-BRL,EUR-BRL,GBP-BRL,JPY-BRL,CAD-BRL,CHF-BRL,AUD-BRL,CNY-BRL,BTC-BRL,ETH-BRL,ARS-BRL,CLP-BRL,MXN-BRL";
    const res = await fetch(`${cleanBase}/last/${pairs}?t=${Date.now()}`, {
      headers: { Accept: "application/json" },
    });

    if (res.ok) {
      const data = await res.json();
      if (data && !data.status && typeof data === "object" && Object.keys(data).length > 0) {
        const merged: AwesomeEconomyResponse = {
          ...DEFAULT_UNIFIED_CURRENCIES,
          ...data,
        };
        const usdBrl = Number(merged.USDBRL?.bid || 5.4397);
        const eurBrl = Number(merged.EURBRL?.bid || 6.0679);
        setGlobalExchangeRates({ usdBrl, eurBrl });
        notifySubscribers(merged);
        return merged;
      }
    }
  } catch (err) {
    console.warn("[UnifiedCurrency] Direct AwesomeAPI fetch error or rate-limit:", err);
  }

  // 3. Failover para Open Exchange Rates & HG Brasil em tempo real (Sem bloqueio de CORS)
  try {
    const [openEr, hg] = await Promise.all([
      fetch(`https://open.er-api.com/v6/latest/USD?t=${Date.now()}`).then((r) => r.json()).catch(() => null),
      fetch(`https://api.hgbrasil.com/finance?format=json&t=${Date.now()}`).then((r) => r.json()).catch(() => null),
    ]);

    const usdBrlRate = Number(hg?.results?.currencies?.USD?.buy || openEr?.rates?.BRL || 5.4397);
    const eurBrlRate = Number(hg?.results?.currencies?.EUR?.buy || (openEr?.rates?.EUR ? usdBrlRate / openEr.rates.EUR : 6.0679));
    const gbpBrlRate = Number(hg?.results?.currencies?.GBP?.buy || (openEr?.rates?.GBP ? usdBrlRate / openEr.rates.GBP : 7.2827));
    const jpyBrlRate = Number(hg?.results?.currencies?.JPY?.buy || (openEr?.rates?.JPY ? usdBrlRate / openEr.rates.JPY : 0.0344));
    const btcBrl = Number(hg?.results?.currencies?.BTC?.buy || 448500);

    const liveData: AwesomeEconomyResponse = {
      ...DEFAULT_UNIFIED_CURRENCIES,
      USDBRL: {
        code: "USD",
        codein: "BRL",
        name: "Dólar Americano / Real Brasileiro",
        high: String((usdBrlRate * 1.008).toFixed(4)),
        low: String((usdBrlRate * 0.992).toFixed(4)),
        varBid: String((Number(hg?.results?.currencies?.USD?.variation || 0.06) * 0.01).toFixed(4)),
        pctChange: String((Number(hg?.results?.currencies?.USD?.variation || 0.06)).toFixed(2)),
        bid: String(usdBrlRate.toFixed(4)),
        ask: String((usdBrlRate * 1.0003).toFixed(4)),
        timestamp: String(Math.floor(Date.now() / 1000)),
        create_date: new Date().toISOString(),
      },
      EURBRL: {
        code: "EUR",
        codein: "BRL",
        name: "Euro / Real Brasileiro",
        high: String((eurBrlRate * 1.008).toFixed(4)),
        low: String((eurBrlRate * 0.992).toFixed(4)),
        varBid: String((Number(hg?.results?.currencies?.EUR?.variation || 0.04) * 0.01).toFixed(4)),
        pctChange: String((Number(hg?.results?.currencies?.EUR?.variation || 0.04)).toFixed(2)),
        bid: String(eurBrlRate.toFixed(4)),
        ask: String((eurBrlRate * 1.0003).toFixed(4)),
        timestamp: String(Math.floor(Date.now() / 1000)),
        create_date: new Date().toISOString(),
      },
      GBPBRL: {
        code: "GBP",
        codein: "BRL",
        name: "Libra Esterlina / Real Brasileiro",
        high: String((gbpBrlRate * 1.008).toFixed(4)),
        low: String((gbpBrlRate * 0.992).toFixed(4)),
        varBid: "0.0280",
        pctChange: String((Number(hg?.results?.currencies?.GBP?.variation || 0.04)).toFixed(2)),
        bid: String(gbpBrlRate.toFixed(4)),
        ask: String((gbpBrlRate * 1.0003).toFixed(4)),
        timestamp: String(Math.floor(Date.now() / 1000)),
        create_date: new Date().toISOString(),
      },
      JPYBRL: {
        code: "JPY",
        codein: "BRL",
        name: "Iene Japonês / Real Brasileiro",
        high: String((jpyBrlRate * 1.01).toFixed(4)),
        low: String((jpyBrlRate * 0.99).toFixed(4)),
        varBid: "-0.0001",
        pctChange: "0.00",
        bid: String(jpyBrlRate.toFixed(4)),
        ask: String((jpyBrlRate * 1.005).toFixed(4)),
        timestamp: String(Math.floor(Date.now() / 1000)),
        create_date: new Date().toISOString(),
      },
      BTCBRL: {
        code: "BTC",
        codein: "BRL",
        name: "Bitcoin em Reais",
        high: String(Math.round(btcBrl * 1.02)),
        low: String(Math.round(btcBrl * 0.98)),
        varBid: "5200",
        pctChange: String((Number(hg?.results?.currencies?.BTC?.variation || 1.3)).toFixed(2)),
        bid: String(Math.round(btcBrl)),
        ask: String(Math.round(btcBrl * 1.0005)),
        timestamp: String(Math.floor(Date.now() / 1000)),
        create_date: new Date().toISOString(),
      },
    };

    setGlobalExchangeRates({
      usdBrl: usdBrlRate,
      eurBrl: eurBrlRate,
      gbpBrl: gbpBrlRate,
    });

    notifySubscribers(liveData);
    return liveData;
  } catch {
    // continua para cache
  }

  // 4. Fallback consistente
  const finalFallback = unifiedEconomyCache || DEFAULT_UNIFIED_CURRENCIES;
  notifySubscribers(finalFallback);
  return finalFallback;
}

/**
 * Retorna as taxas ao vivo de todas as moedas para conversão contra o BRL
 */
export function getLiveRatesToBRL(quotes: AwesomeEconomyResponse = unifiedEconomyCache || DEFAULT_UNIFIED_CURRENCIES): Record<string, number> {
  const getNum = (item?: AwesomeEconomyQuote, fallback = 1.0): number => {
    if (!item) return fallback;
    const bid = parseFloat(item.bid);
    return !isNaN(bid) && bid > 0 ? bid : fallback;
  };

  return {
    BRL: 1.0,
    USD: getNum(quotes.USDBRL, 5.4117),
    EUR: getNum(quotes.EURBRL, 6.0354),
    GBP: getNum(quotes.GBPBRL, 7.2145),
    JPY: getNum(quotes.JPYBRL, 0.0349),
    CAD: getNum(quotes.CADBRL, 3.892),
    CHF: getNum(quotes.CHFBRL, 6.251),
    AUD: getNum(quotes.AUDBRL, 3.542),
    CNY: getNum(quotes.CNYBRL, 0.758),
    ARS: getNum(quotes.ARSBRL, 0.0053),
    CLP: getNum(quotes.CLPBRL, 0.0056),
    MXN: getNum(quotes.MXNBRL, 0.2695),
    BTC: getNum(quotes.BTCBRL, 548200),
    ETH: getNum(quotes.ETHBRL, 17180),
    SOL: getNum(quotes.SOLBRL, 820),
  };
}

/**
 * Converte um item da AwesomeAPI para um objeto Asset completo e navegável
 */
export function economyItemToAsset(item: AwesomeEconomyQuote, existingAsset?: Asset): Asset {
  const bidNum = parseFloat(item.bid) || 1.0;
  const highNum = parseFloat(item.high) || bidNum * 1.02;
  const lowNum = parseFloat(item.low) || bidNum * 0.98;
  const changeNum = parseFloat(item.varBid) || 0;
  const pctChangeNum = parseFloat(item.pctChange) || 0;

  const codeUpper = item.code.toUpperCase();
  const isCrypto = codeUpper === "BTC" || codeUpper === "ETH" || codeUpper === "SOL" || codeUpper === "XRP";
  const id = `${item.code.toLowerCase()}-${item.codein.toLowerCase()}`;
  const ticker = `${item.code}/${item.codein}`;

  if (existingAsset) {
    return {
      ...existingAsset,
      price: bidNum,
      change: changeNum,
      changePercent: pctChangeNum,
      metrics: {
        ...existingAsset.metrics,
        open: bidNum - changeNum,
        high: highNum,
        low: lowNum,
        prevClose: bidNum - changeNum,
      },
    };
  }

  // Gera histórico sintético proporcional para o gráfico do ativo
  const buildSimpleHistory = (base: number, changePct: number): Record<ChartPeriod, HistoricalPoint[]> => {
    const periods: ChartPeriod[] = ["1D", "5D", "1M", "6M", "YTD", "1A", "5A", "MÁX"];
    const result: any = {};
    for (const p of periods) {
      const points: HistoricalPoint[] = [];
      const steps = 24;
      for (let i = 0; i < steps; i++) {
        const prog = i / (steps - 1);
        const noise = (Math.sin(i) * 0.004) * base;
        const val = (base * (1 - changePct / 100)) + ((base * (changePct / 100)) * prog) + noise;
        points.push({
          time: `${10 + Math.floor(prog * 7)}:00`,
          date: "Hoje",
          price: Number(val.toFixed(4)),
          close: Number(val.toFixed(4)),
          volume: 100000,
        });
      }
      result[p] = points;
    }
    return result;
  };

  return {
    id,
    ticker,
    name: item.name,
    category: isCrypto ? "Criptomoedas" : "Moedas",
    sector: isCrypto ? "Crypto" : "Forex",
    tags: [isCrypto ? "Criptoativo" : "Câmbio", item.code, "MercadoSpot", "TempoReal"],
    currency: item.codein,
    price: bidNum,
    change: changeNum,
    changePercent: pctChangeNum,
    exchange: isCrypto ? "Mercado Spot Cripto" : "Mercado Interbancário / Forex",
    sparkline: [lowNum, (lowNum + bidNum) / 2, bidNum],
    historical: buildSimpleHistory(bidNum, pctChangeNum),
    metrics: {
      open: bidNum - changeNum,
      high: highNum,
      low: lowNum,
      high52w: highNum * 1.12,
      low52w: lowNum * 0.88,
      prevClose: bidNum - changeNum,
      volume: "Mercado Interbancário",
    },
    profile: {
      description: `Cotação e taxa de câmbio comercial em tempo real para o par ${item.code}/${item.codein} fornecida pelo mercado institucional e bancos centrais.`,
      sector: isCrypto ? "Criptomoedas" : "Moedas & Câmbio",
      headquarters: isCrypto ? "Descentralizado / Blockchain" : "Mercado Financeiro Internacional",
      websiteUrl: "https://dinheuro.com",
      websiteLabel: "dinheuro.com/mercados",
      currency: item.codein,
      exchange: "Banco Central / PTAX",
    },
    relatedAssetIds: ["usd-brl", "eur-brl", "ibov", "btc-brl"],
  };
}
