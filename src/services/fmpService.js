const DEFAULT_FMP_KEY = "GJaGtHdggEtpz6erXjYrSNchdFk8FJwm";

export const FMP_API_KEY =
  (typeof process !== "undefined" && process?.env?.FMP_API_KEY) ||
  (typeof import.meta !== "undefined" && import.meta?.env?.VITE_FMP_API_KEY) ||
  DEFAULT_FMP_KEY;

export const FMP_BASE_URL = "https://financialmodelingprep.com/stable";

// In-memory cache to prevent redundant network requests and avoid HTTP 429
const clientQuoteCache = new Map();
const clientProfileCache = new Map();
const clientFinancialsCache = new Map();
let clientCooldownUntil = 0;

/**
 * 1. Busca cotação em tempo real com resiliência, cache e proteção contra HTTP 429
 */
export async function obterCotacaoFMP(symbol) {
  if (!symbol) return null;
  const cleanSymbol = symbol.trim().toUpperCase();
  const now = Date.now();

  // Retorna do cache se válido por 60s
  const cached = clientQuoteCache.get(cleanSymbol);
  if (cached && now - cached.timestamp < 60000) {
    return cached.data;
  }

  // Se estiver em período de cooldown (rate limit 429), retorna cache ou null silenciosamente
  if (now < clientCooldownUntil) {
    return cached?.data || null;
  }

  // No navegador, prioriza o proxy backend seguro com cache
  if (typeof window !== "undefined") {
    try {
      const res = await fetch(`/api/fmp/quote?symbol=${encodeURIComponent(cleanSymbol)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.price === "number") {
          clientQuoteCache.set(cleanSymbol, { data, timestamp: now });
          return data;
        }
      } else if (res.status === 429) {
        clientCooldownUntil = now + 120000;
        return cached?.data || null;
      }
    } catch {
      // continua para fallback silencioso
    }
  }

  // Fallback direto com detecção segura de 429 e sem console.error
  const url = `${FMP_BASE_URL}/quote?symbol=${encodeURIComponent(cleanSymbol)}&apikey=${FMP_API_KEY}`;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (res.status === 429) {
      clientCooldownUntil = now + 120000; // 2 min cooldown
      console.warn(`[FMP] Limite de requisições atingido para ${cleanSymbol}. Operando em modo resiliente.`);
      return cached?.data || null;
    }

    if (!res.ok) {
      return cached?.data || null;
    }

    const data = await res.json();
    const quote = Array.isArray(data) && data.length > 0 ? data[0] : null;
    if (quote) {
      clientQuoteCache.set(cleanSymbol, { data: quote, timestamp: now });
    }
    return quote;
  } catch (error) {
    console.warn(`[FMP] Conexão resiliente acionada para ${cleanSymbol}`);
    return cached?.data || null;
  }
}

/**
 * 2. Busca perfil corporativo com resiliência e cache
 */
export async function obterPerfilFMP(symbol) {
  if (!symbol) return null;
  const cleanSymbol = symbol.trim().toUpperCase();
  const now = Date.now();

  const cached = clientProfileCache.get(cleanSymbol);
  if (cached && now - cached.timestamp < 300000) {
    return cached.data;
  }

  if (now < clientCooldownUntil) {
    return cached?.data || null;
  }

  if (typeof window !== "undefined") {
    try {
      const res = await fetch(`/api/fmp/profile?symbol=${encodeURIComponent(cleanSymbol)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.companyName) {
          clientProfileCache.set(cleanSymbol, { data, timestamp: now });
          return data;
        }
      }
    } catch {
      // continua para fallback
    }
  }

  const url = `${FMP_BASE_URL}/profile?symbol=${encodeURIComponent(cleanSymbol)}&apikey=${FMP_API_KEY}`;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (res.status === 429) {
      clientCooldownUntil = now + 120000;
      return cached?.data || null;
    }

    if (!res.ok) return cached?.data || null;

    const data = await res.json();
    const profile = Array.isArray(data) && data.length > 0 ? data[0] : null;
    if (profile) {
      clientProfileCache.set(cleanSymbol, { data: profile, timestamp: now });
    }
    return profile;
  } catch {
    return cached?.data || null;
  }
}

/**
 * 3. Busca demonstração de resultados (DRE) com resiliência e cache
 */
export async function obterDemonstracaoResultadosFMP(symbol) {
  if (!symbol) return null;
  const cleanSymbol = symbol.trim().toUpperCase();
  const now = Date.now();

  const cached = clientFinancialsCache.get(cleanSymbol);
  if (cached && now - cached.timestamp < 300000) {
    return cached.data;
  }

  if (now < clientCooldownUntil) {
    return cached?.data || null;
  }

  if (typeof window !== "undefined") {
    try {
      const res = await fetch(`/api/fmp/financials?symbol=${encodeURIComponent(cleanSymbol)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          clientFinancialsCache.set(cleanSymbol, { data, timestamp: now });
          return data;
        }
      }
    } catch {
      // continua para fallback
    }
  }

  const url = `${FMP_BASE_URL}/income-statement?symbol=${encodeURIComponent(cleanSymbol)}&apikey=${FMP_API_KEY}`;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (res.status === 429) {
      clientCooldownUntil = now + 120000;
      return cached?.data || null;
    }

    if (!res.ok) return cached?.data || null;

    const data = await res.json();
    const financials = Array.isArray(data) ? data : null;
    if (financials) {
      clientFinancialsCache.set(cleanSymbol, { data: financials, timestamp: now });
    }
    return financials;
  } catch {
    return cached?.data || null;
  }
}

export default {
  obterCotacaoFMP,
  obterPerfilFMP,
  obterDemonstracaoResultadosFMP,
};
