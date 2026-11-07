/**
 * DinhEuro.com - Universal Multicurrency (USD & BRL) Conversion Engine
 * 
 * Regra de Padronização Multimoeda:
 * 1. Ativos cotados em Dólar (USD), como ações americanas (AAPL, NVDA, MSFT),
 *    commodities e criptoativos: exibe o valor original em USD e a conversão em tempo real para BRL (Reais).
 * 2. Ativos cotados em Reais (BRL), como ações da B3 (PETR4, VALE3, ITUB4) e IBOV:
 *    exibe o valor original em BRL e a conversão em tempo real para USD (Dólares).
 * 3. Moedas globais (EUR, GBP, JPY, etc.): exibe o par cambial oficial e os equivalentes em USD e BRL.
 */

import React from "react";
import { formatAssetDisplayPrice } from "./formatters";

export interface ExchangeRates {
  usdBrl: number;
  eurBrl: number;
  gbpBrl: number;
  lastUpdated: number;
}

// Taxas cambiais padrão dinamicamente atualizadas via WebSocket, AwesomeAPI, Finnhub ou HG Brasil
let currentRates: ExchangeRates = {
  usdBrl: 5.4397,
  eurBrl: 6.0679,
  gbpBrl: 7.2827,
  lastUpdated: Date.now(),
};

const rateListeners = new Set<(rates: ExchangeRates) => void>();

/**
 * Obtém o snapshot das taxas de câmbio em tempo real
 */
export function getLiveExchangeRates(): ExchangeRates {
  return { ...currentRates };
}

/**
 * Atualiza as taxas cambiais globais em tempo real
 */
export function setGlobalExchangeRates(newRates: Partial<ExchangeRates>): void {
  currentRates = {
    ...currentRates,
    ...newRates,
    lastUpdated: Date.now(),
  };
  rateListeners.forEach((listener) => {
    try {
      listener(currentRates);
    } catch {
      // Ignora falhas em listeners individuais
    }
  });
}

/**
 * Obtém a taxa USD/BRL atual em tempo real
 */
export function getCurrentUsdBrlRate(): number {
  return currentRates.usdBrl > 0 ? currentRates.usdBrl : 5.4397;
}

/**
 * Obtém a taxa EUR/BRL atual em tempo real
 */
export function getCurrentEurBrlRate(): number {
  return currentRates.eurBrl > 0 ? currentRates.eurBrl : 6.0679;
}

/**
 * Assina atualizações em tempo real das taxas cambiais
 */
export function subscribeToExchangeRates(listener: (rates: ExchangeRates) => void): () => void {
  rateListeners.add(listener);
  listener(currentRates);
  return () => {
    rateListeners.delete(listener);
  };
}

export interface DualCurrencyResult {
  originalFormatted: string;
  originalCurrency: string;
  originalPrice: number;
  convertedFormatted: string;
  convertedCurrency: string;
  convertedPrice: number;
  rateUsed: number;
  rateLabel: string;
}

/**
 * Calcula a visualização dupla (USD e BRL) para qualquer ativo financeiro
 */
export function computeDualCurrency(
  price: number,
  currency: string = "USD",
  customUsdBrl?: number
): DualCurrencyResult {
  const usdBrl = customUsdBrl && customUsdBrl > 0 ? customUsdBrl : getCurrentUsdBrlRate();
  const eurBrl = getCurrentEurBrlRate();
  const cleanCurrency = (currency || "USD").trim().toUpperCase();

  // Caso 1: Ativo cotado em Dólar (USD) -> Converte para BRL
  if (
    cleanCurrency === "USD" ||
    cleanCurrency === "US$" ||
    cleanCurrency === "$"
  ) {
    const convertedBrl = price * usdBrl;
    return {
      originalFormatted: formatAssetDisplayPrice(price, "USD"),
      originalCurrency: "USD",
      originalPrice: price,
      convertedFormatted: formatAssetDisplayPrice(convertedBrl, "BRL"),
      convertedCurrency: "BRL",
      convertedPrice: convertedBrl,
      rateUsed: usdBrl,
      rateLabel: `1 USD = R$ ${usdBrl.toFixed(4)}`,
    };
  }

  // Caso 2: Ativo cotado em Reais (BRL) -> Converte para USD
  if (
    cleanCurrency === "BRL" ||
    cleanCurrency === "R$"
  ) {
    const convertedUsd = usdBrl > 0 ? price / usdBrl : price / 5.4397;
    return {
      originalFormatted: formatAssetDisplayPrice(price, "BRL"),
      originalCurrency: "BRL",
      originalPrice: price,
      convertedFormatted: formatAssetDisplayPrice(convertedUsd, "USD"),
      convertedCurrency: "USD",
      convertedPrice: convertedUsd,
      rateUsed: usdBrl,
      rateLabel: `1 USD = R$ ${usdBrl.toFixed(4)}`,
    };
  }

  // Caso: Índices cotados em Pontos (ex: IBOVESPA, WIN$)
  if (cleanCurrency === "PTS" || cleanCurrency === "PONTOS") {
    const convertedUsd = usdBrl > 0 ? price / usdBrl : price / 5.4397;
    return {
      originalFormatted: `${price.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} pts`,
      originalCurrency: "PTS",
      originalPrice: price,
      convertedFormatted: formatAssetDisplayPrice(convertedUsd, "USD"),
      convertedCurrency: "USD",
      convertedPrice: convertedUsd,
      rateUsed: usdBrl,
      rateLabel: `1 USD = R$ ${usdBrl.toFixed(4)}`,
    };
  }

  // Caso 3: Ativo cotado em Euro (EUR) -> Exibe em BRL e USD
  if (cleanCurrency === "EUR" || cleanCurrency === "€") {
    const convertedBrl = price * eurBrl;
    const convertedUsd = usdBrl > 0 ? convertedBrl / usdBrl : price * 1.11;
    return {
      originalFormatted: formatAssetDisplayPrice(price, "EUR"),
      originalCurrency: "EUR",
      originalPrice: price,
      convertedFormatted: `${formatAssetDisplayPrice(convertedBrl, "BRL")} (${formatAssetDisplayPrice(convertedUsd, "USD")})`,
      convertedCurrency: "BRL",
      convertedPrice: convertedBrl,
      rateUsed: eurBrl,
      rateLabel: `1 EUR = R$ ${eurBrl.toFixed(4)}`,
    };
  }

  // Caso 4: Criptomoedas com código nativo (BTC, ETH, SOL, etc.)
  if (["BTC", "ETH", "SOL", "XRP", "DOGE"].includes(cleanCurrency)) {
    // Se a cotação armazenada estiver na ordem de grandeza de USD (ex: BTC ~ 70.000 a 100.000)
    // Se o preço for > 150.000, já está em BRL
    if (price > 180000 && cleanCurrency === "BTC") {
      const convertedUsd = price / usdBrl;
      return {
        originalFormatted: formatAssetDisplayPrice(price, "BRL"),
        originalCurrency: "BRL",
        originalPrice: price,
        convertedFormatted: formatAssetDisplayPrice(convertedUsd, "USD"),
        convertedCurrency: "USD",
        convertedPrice: convertedUsd,
        rateUsed: usdBrl,
        rateLabel: `1 USD = R$ ${usdBrl.toFixed(4)}`,
      };
    }

    const convertedBrl = price * usdBrl;
    return {
      originalFormatted: formatAssetDisplayPrice(price, "USD"),
      originalCurrency: "USD",
      originalPrice: price,
      convertedFormatted: formatAssetDisplayPrice(convertedBrl, "BRL"),
      convertedCurrency: "BRL",
      convertedPrice: convertedBrl,
      rateUsed: usdBrl,
      rateLabel: `1 USD = R$ ${usdBrl.toFixed(4)}`,
    };
  }

  // Outras moedas (GBP, JPY, etc.): fallback convertendo via BRL
  const convertedBrl = price * (cleanCurrency === "GBP" ? currentRates.gbpBrl : usdBrl);
  return {
    originalFormatted: formatAssetDisplayPrice(price, cleanCurrency),
    originalCurrency: cleanCurrency,
    originalPrice: price,
    convertedFormatted: formatAssetDisplayPrice(convertedBrl, "BRL"),
    convertedCurrency: "BRL",
    convertedPrice: convertedBrl,
    rateUsed: usdBrl,
    rateLabel: `1 USD = R$ ${usdBrl.toFixed(4)}`,
  };
}

/**
 * Componente React reutilizável para exibição elegante de Preço Duplo (USD & BRL)
 */
export interface DualPriceDisplayProps {
  price: number;
  currency?: string;
  customUsdBrl?: number;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  align?: "left" | "right" | "center";
  layout?: "stacked" | "inline";
  className?: string;
  showRateTooltip?: boolean;
}

export const DualPriceDisplay: React.FC<DualPriceDisplayProps> = ({
  price,
  currency = "USD",
  customUsdBrl,
  size = "md",
  align = "left",
  layout = "stacked",
  className = "",
  showRateTooltip = true,
}) => {
  const result = computeDualCurrency(price, currency, customUsdBrl);

  const sizeClasses = {
    xs: {
      primary: "text-xs font-bold",
      secondary: "text-[10px] font-medium",
    },
    sm: {
      primary: "text-sm font-bold",
      secondary: "text-[11px] font-medium",
    },
    md: {
      primary: "text-base font-bold",
      secondary: "text-xs font-semibold",
    },
    lg: {
      primary: "text-xl sm:text-2xl font-black",
      secondary: "text-xs sm:text-sm font-semibold",
    },
    xl: {
      primary: "text-3xl sm:text-4xl font-black",
      secondary: "text-sm sm:text-base font-bold",
    },
  }[size];

  const alignClasses = {
    left: "text-left items-start",
    right: "text-right items-end",
    center: "text-center items-center",
  }[align];

  if (layout === "inline") {
    return (
      <div
        className={`flex items-baseline gap-1.5 flex-wrap ${className}`}
        title={showRateTooltip ? `Câmbio em tempo real: ${result.rateLabel}` : undefined}
      >
        <span className={`font-mono text-[#e6edf3] ${sizeClasses.primary}`}>
          {result.originalFormatted}
        </span>
        <span className={`font-mono text-[#58a6ff] opacity-90 ${sizeClasses.secondary}`}>
          ≈ {result.convertedFormatted}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col ${alignClasses} ${className}`}
      title={showRateTooltip ? `Câmbio em tempo real: ${result.rateLabel}` : undefined}
    >
      <div className={`font-mono text-[#e6edf3] tracking-tight leading-none ${sizeClasses.primary}`}>
        {result.originalFormatted}
      </div>
      <div
        className={`font-mono text-[#58a6ff] hover:text-[#79c0ff] transition-colors mt-1 flex items-center gap-1 ${sizeClasses.secondary}`}
      >
        <span className="text-[10px] px-1 py-0.2 rounded bg-[#1f6feb]/20 text-[#58a6ff] border border-[#58a6ff]/30 font-sans uppercase">
          {result.convertedCurrency}
        </span>
        <span>≈ {result.convertedFormatted}</span>
      </div>
    </div>
  );
};
