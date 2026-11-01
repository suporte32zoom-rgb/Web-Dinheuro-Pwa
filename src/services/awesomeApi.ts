/**
 * DinhEuro.com - AwesomeAPI Global Economy Service
 * Serviço universal para consumo da economia geral (moedas globais, bolsas,
 * índices, criptos e taxas) via AwesomeAPI pública.
 */

const BASE_URL =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_AWESOME_ECONOMY_URL) ||
  "https://economia.awesomeapi.com.br";

export interface AwesomeEconomyQuote {
  code: string;
  codein: string;
  name: string;
  high: string;
  low: string;
  varBid: string;
  pctChange: string;
  bid: string;
  ask: string;
  timestamp: string;
  create_date: string;
}

export type AwesomeEconomyResponse = Record<string, AwesomeEconomyQuote>;

/**
 * Busca qualquer conjunto de ativos, índices ou moedas dinamicamente
 * @param query 'all' para todas as moedas ou combinações separadas por vírgula (ex: 'USD-BRL,EUR-BRL,BTC-BRL')
 */
export const fetchEconomyData = async (
  query: string = "all"
): Promise<AwesomeEconomyResponse | null> => {
  try {
    const cleanBase = BASE_URL.replace(/\/+$/, "");
    const url =
      query === "all"
        ? `${cleanBase}/json/all`
        : `${cleanBase}/last/${query}`;

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ao obter dados econômicos (HTTP ${response.status})`);
    }

    const data = await response.json();
    return data as AwesomeEconomyResponse;
  } catch (error: any) {
    console.warn("Falha no serviço de economia geral:", error?.message || error);
    return null;
  }
};
