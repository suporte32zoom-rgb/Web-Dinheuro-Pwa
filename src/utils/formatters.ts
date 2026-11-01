/**
 * DinhEuro.com - Formatters Utilities
 * Funções de formatação para moedas, porcentagens, volumes, datas e indicadores financeiros.
 */

/**
 * Formata um valor numérico em Real Brasileiro (BRL)
 */
export function formatCurrencyBRL(
  value: number,
  options?: { minimumFractionDigits?: number; maximumFractionDigits?: number }
): string {
  if (isNaN(value) || value === null || value === undefined) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: options?.minimumFractionDigits ?? 2,
    maximumFractionDigits: options?.maximumFractionDigits ?? 2,
  }).format(value);
}

/**
 * Formata um valor numérico em Euro (EUR)
 */
export function formatCurrencyEUR(
  value: number,
  options?: { minimumFractionDigits?: number; maximumFractionDigits?: number }
): string {
  if (isNaN(value) || value === null || value === undefined) return "€ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: options?.minimumFractionDigits ?? 2,
    maximumFractionDigits: options?.maximumFractionDigits ?? 2,
  }).format(value);
}

/**
 * Formata um valor numérico em Dólar Americano (USD)
 */
export function formatCurrencyUSD(
  value: number,
  options?: { minimumFractionDigits?: number; maximumFractionDigits?: number }
): string {
  if (isNaN(value) || value === null || value === undefined) return "$ 0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: options?.minimumFractionDigits ?? 2,
    maximumFractionDigits: options?.maximumFractionDigits ?? 2,
  }).format(value);
}

/**
 * Formatação de moeda genérica por código ISO (BRL, USD, EUR, GBP, JPY, BTC, etc.)
 */
export function formatCurrency(
  value: number,
  currency: string = "BRL",
  locale: string = "pt-BR"
): string {
  if (isNaN(value) || value === null || value === undefined) return "0,00";

  // Criptomoedas ou moedas sem suporte padrão no Intl
  if (currency === "BTC") return `₿ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`;
  if (currency === "ETH") return `Ξ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
  if (currency === "SOL") return `◎ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

/**
 * Formata o preço de exibição de um ativo financeiro com base na sua moeda
 * Garante R$ para ativos nacionais B3 e US$ para ativos internacionais
 */
export function formatAssetDisplayPrice(price: number, currency: string = "BRL"): string {
  if (isNaN(price) || price === null || price === undefined) return "0,00";

  const raw = (currency || "BRL").trim().toUpperCase();
  const curr =
    raw === "R$" || raw === "BRL"
      ? "BRL"
      : raw === "US$" || raw === "$" || raw === "USD"
      ? "USD"
      : raw === "€" || raw === "EUR"
      ? "EUR"
      : raw === "£" || raw === "GBP"
      ? "GBP"
      : raw === "¥" || raw === "JPY"
      ? "JPY"
      : raw;

  // Precisão dinâmica: até 4 casas decimais para taxas cambiais e ativos abaixo de 10 unidades com frações relevantes
  const hasExtraDecimals = price < 10 && price > 0 && Math.abs(price - Math.round(price * 100) / 100) > 0.0001;
  const decimals = hasExtraDecimals ? 4 : 2;

  if (curr === "BRL") {
    return `R$ ${price.toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  }
  if (curr === "USD") {
    return `US$ ${price.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  }
  if (curr === "EUR") {
    return `€ ${price.toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  }
  if (curr === "GBP") {
    return `£ ${price.toLocaleString("en-GB", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  }
  if (curr === "JPY") {
    return `¥ ${price.toLocaleString("ja-JP", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`;
  }
  if (curr === "CNY") {
    return `¥ ${price.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (curr === "HKD") {
    return `HK$ ${price.toLocaleString("zh-HK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (curr === "INR") {
    return `₹ ${price.toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`;
  }
  if (curr === "KRW") {
    return `₩ ${price.toLocaleString("ko-KR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
  if (curr === "BTC") {
    return `₿ ${price.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`;
  }
  if (curr === "ETH") {
    return `Ξ ${price.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
  }
  if (curr === "SOL") {
    return `◎ ${price.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  return formatCurrency(price, curr);
}

// Aliases para compatibilidade
export const formatPrice = formatAssetDisplayPrice;
export const formatAssetPrice = formatAssetDisplayPrice;

/**
 * Formata percentuais com sinal positivo explícito (+0.00%)
 */
export function formatPercent(value: number, includeSign: boolean = true): string {
  if (isNaN(value) || value === null || value === undefined) return "0,00%";
  const sign = includeSign && value > 0 ? "+" : "";
  return `${sign}${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
}

/**
 * Formata volumes financeiros com sufixos K, M, B, T
 */
export function formatVolumeCompact(value: number): string {
  if (isNaN(value) || value === null || value === undefined || value === 0) return "0";
  const abs = Math.abs(value);

  if (abs >= 1_000_000_000_000) {
    return `${(value / 1_000_000_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} T`;
  }
  if (abs >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} B`;
  }
  if (abs >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} M`;
  }
  if (abs >= 1_000) {
    return `${(value / 1_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} K`;
  }
  return value.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
}

/**
 * Formata data e hora no padrão brasileiro
 */
export function formatDateTime(date: Date | string | number): string {
  try {
    const d = new Date(date);
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return "Data indisponível";
  }
}

/**
 * Formata tempo relativo em português (ex: "Há 5 min", "Há 2 horas")
 */
export function formatRelativeTime(dateStr: string | number | Date): string {
  try {
    const pub = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - pub.getTime();
    const diffMin = Math.floor(diffMs / (1000 * 60));

    if (diffMin < 1) return "Agora mesmo";
    if (diffMin < 60) return `Há ${diffMin} min`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `Há ${diffHours} ${diffHours === 1 ? "hora" : "horas"}`;
    const diffDays = Math.floor(diffHours / 24);
    return `Há ${diffDays} ${diffDays === 1 ? "dia" : "dias"}`;
  } catch {
    return "Recente";
  }
}
