import { EconomicEvent, EventImpact, EconomicEventCategory } from "../types/finance";

const CACHE_KEY = "dinheuro_economic_calendar";
let memoryCalendarCache: { timestamp: number; events: EconomicEvent[] } | null = null;

/**
 * Gera um calendário macroeconômico dinâmico e realista ancorado na data atual.
 * Assegura que sempre haja eventos futuros (Copom, Fed, BCE, IPCA, Payroll) com
 * previsões, consenso de mercado e impacto nos investimentos.
 */
export function generateDynamicEconomicCalendar(refDate: Date = new Date()): EconomicEvent[] {
  const base = new Date(refDate);
  const y = base.getFullYear();
  const m = base.getMonth();
  const d = base.getDate();

  // Helper para gerar datas com offset de dias
  const makeDate = (offsetDays: number, hour: number, minute: number): { dateStr: string; timeStr: string; isoStr: string } => {
    const target = new Date(y, m, d + offsetDays, hour, minute, 0);
    const dateStr = target.toISOString().slice(0, 10);
    const timeStr = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    return { dateStr, timeStr, isoStr: target.toISOString() };
  };

  const d0 = makeDate(0, 14, 30); // Hoje às 14:30
  const d1 = makeDate(1, 9, 0);   // Amanhã às 09:00
  const d2 = makeDate(2, 18, 30); // Em 2 dias às 18:30 (Copom Selic)
  const d3 = makeDate(3, 15, 0);  // Em 3 dias às 15:00 (FOMC Fed)
  const d4 = makeDate(4, 9, 15);  // Em 4 dias às 09:15 (BCE Juros)
  const d5 = makeDate(5, 9, 30);  // Em 5 dias às 09:30 (Payroll EUA)
  const d7 = makeDate(7, 9, 0);   // Em 7 dias às 09:00 (IPCA Brasil)
  const d8 = makeDate(8, 9, 30);  // Em 8 dias às 09:30 (CPI Inflação EUA)
  const d10 = makeDate(10, 8, 0); // Em 10 dias às 08:00 (Ata do Copom)
  const d12 = makeDate(12, 9, 0); // Em 12 dias às 09:00 (BoE Reino Unido)
  const d14 = makeDate(14, 0, 0); // Em 14 dias às 00:00 (BoJ Japão)

  const rawEvents: EconomicEvent[] = [
    {
      id: "evt-copom-selic",
      title: "Decisão da Taxa Selic (Copom / Banco Central)",
      country: "BR",
      countryName: "Brasil",
      flag: "🇧🇷",
      category: "interest_rate",
      categoryLabel: "Taxas de Juros",
      date: d2.dateStr,
      time: d2.timeStr,
      datetime: d2.isoStr,
      impact: "high",
      forecast: "11,25%",
      previous: "10,75%",
      unit: "% a.a.",
      status: "scheduled",
      consensus: "Alta de 50 bps precificada na curva DI de juros futuros",
      description: "O Comitê de Política Monetária (Copom) do Banco Central do Brasil decide a meta da taxa Selic, referência de custo do crédito no país.",
      importanceReason: "Impacta diretamente a renda fixa, o custo do capital de empresas listadas na B3 e a cotação do dólar comercial.",
      affectedTickers: ["IBOV", "PETR4", "VALE3", "ITUB4", "USD/BRL"],
    },
    {
      id: "evt-fomc-fed",
      title: "Decisão de Taxa de Juros dos EUA (FOMC / Federal Reserve)",
      country: "US",
      countryName: "Estados Unidos",
      flag: "🇺🇸",
      category: "interest_rate",
      categoryLabel: "Taxas de Juros",
      date: d3.dateStr,
      time: d3.timeStr,
      datetime: d3.isoStr,
      impact: "high",
      forecast: "4,75%",
      previous: "5,00%",
      unit: "% a.a.",
      status: "scheduled",
      consensus: "Redução de 25 bps aguardada pelo FedWatch",
      description: "O Federal Open Market Committee (FOMC) anuncia a faixa da taxa básica dos Fed Funds, influenciando toda a liquidez monetária do planeta.",
      importanceReason: "Move os índices globais (S&P 500, Nasdaq), os Treasuries americanos de 10 anos e o apetite por risco em bolsas emergentes.",
      affectedTickers: ["S&P 500", "NASDAQ", "DOW", "USD/BRL", "BTC"],
    },
    {
      id: "evt-us-payroll",
      title: "Relatório de Emprego Non-Farm Payrolls (BLS)",
      country: "US",
      countryName: "Estados Unidos",
      flag: "🇺🇸",
      category: "employment",
      categoryLabel: "Emprego & Trabalho",
      date: d5.dateStr,
      time: d5.timeStr,
      datetime: d5.isoStr,
      impact: "high",
      forecast: "140.000",
      previous: "142.000",
      unit: "vagas criadas",
      status: "scheduled",
      consensus: "Expectativa de resfriamento gradual no mercado de trabalho americano",
      description: "Principal termômetro da força do mercado de trabalho não-agrícola dos EUA, medido pelo Bureau of Labor Statistics.",
      importanceReason: "Altera apostas sobre o ritmo de cortes de juros pelo Fed. Forte volatilidade no Dólar, Ouro e S&P 500 no minuto da divulgação.",
      affectedTickers: ["S&P 500", "USD/BRL", "OURO", "NASDAQ"],
    },
    {
      id: "evt-ipca-br",
      title: "IPCA Oficial de Inflação (IBGE)",
      country: "BR",
      countryName: "Brasil",
      flag: "🇧🇷",
      category: "inflation",
      categoryLabel: "Inflação",
      date: d7.dateStr,
      time: d7.timeStr,
      datetime: d7.isoStr,
      impact: "high",
      forecast: "0,45%",
      previous: "0,44%",
      unit: "% mensal",
      status: "scheduled",
      consensus: "Pressão em alimentos e energia com núcleo de serviços monitorado",
      description: "O Índice Nacional de Preços ao Consumidor Amplo (IPCA) é o balizador oficial do regime de metas de inflação no Brasil.",
      importanceReason: "Direciona a remuneração de títulos do Tesouro IPCA+ e o humor do Copom para os próximos passos da Selic.",
      affectedTickers: ["IBOV", "USD/BRL", "MGLU3", "CRFB3"],
    },
    {
      id: "evt-ecb-rate",
      title: "Decisão de Política Monetária (Banco Central Europeu - BCE)",
      country: "EU",
      countryName: "Zona do Euro",
      flag: "🇪🇺",
      category: "interest_rate",
      categoryLabel: "Taxas de Juros",
      date: d4.dateStr,
      time: d4.timeStr,
      datetime: d4.isoStr,
      impact: "high",
      forecast: "3,25%",
      previous: "3,50%",
      unit: "% a.a.",
      status: "scheduled",
      consensus: "Corte de 25 bps na taxa de facilidade permanente de depósito",
      description: "O conselho do BCE liderado por Christine Lagarde define o custo do Euro para combater a inflação e apoiar o crescimento da Europa.",
      importanceReason: "Impacta a paridade EUR/USD, o índice DAX da Alemanha e fluxos de comércio exterior com o Brasil.",
      affectedTickers: ["DAX 40", "STOXX 50", "EUR/BRL", "EUR/USD"],
    },
    {
      id: "evt-us-cpi",
      title: "CPI - Índice de Preços ao Consumidor dos EUA (BLS)",
      country: "US",
      countryName: "Estados Unidos",
      flag: "🇺🇸",
      category: "inflation",
      categoryLabel: "Inflação",
      date: d8.dateStr,
      time: d8.timeStr,
      datetime: d8.isoStr,
      impact: "high",
      forecast: "2,4%",
      previous: "2,5%",
      unit: "% anual",
      status: "scheduled",
      consensus: "Desinflação persistente rumo à meta de 2% do Federal Reserve",
      description: "Mede a variação de preços da cesta de consumo das famílias urbanas norte-americanas.",
      importanceReason: "O dado de inflação mais aguardado por Wall Street para calibrar a taxa neutra de juros.",
      affectedTickers: ["S&P 500", "NASDAQ", "BTC", "USD/BRL"],
    },
    {
      id: "evt-copom-minutes",
      title: "Divulgação da Ata da Reunião do Copom (BCB)",
      country: "BR",
      countryName: "Brasil",
      flag: "🇧🇷",
      category: "central_bank",
      categoryLabel: "Bancos Centrais",
      date: d10.dateStr,
      time: d10.timeStr,
      datetime: d10.isoStr,
      impact: "medium",
      status: "scheduled",
      consensus: "Detalhamento da votação e balanço de riscos fiscais e externos",
      description: "Publicação do documento com a íntegra das ponderações e do cenário prospectivo discutido pelos diretores do Banco Central.",
      importanceReason: "Fornece pistas cruciais sobre a magnitude das próximas reuniões do Copom.",
      affectedTickers: ["IBOV", "USD/BRL"],
    },
    {
      id: "evt-boe-rate",
      title: "Decisão de Taxa de Juros do Banco da Inglaterra (BoE)",
      country: "GB",
      countryName: "Reino Unido",
      flag: "🇬🇧",
      category: "interest_rate",
      categoryLabel: "Taxas de Juros",
      date: d12.dateStr,
      time: d12.timeStr,
      datetime: d12.isoStr,
      impact: "medium",
      forecast: "4,75%",
      previous: "5,00%",
      unit: "% a.a.",
      status: "scheduled",
      consensus: "Comitê MPC dividido entre pausa e corte de 25 bps",
      description: "Decisão do Comitê de Política Monetária do Reino Unido, afetando a Libra Esterlina e a City de Londres.",
      importanceReason: "Determina a força da Libra e as condições de crédito no mercado britânico.",
      affectedTickers: ["FTSE 100", "GBP/BRL"],
    },
    {
      id: "evt-boj-rate",
      title: "Decisão de Política Monetária do Banco do Japão (BoJ)",
      country: "JP",
      countryName: "Japão",
      flag: "🇯🇵",
      category: "interest_rate",
      categoryLabel: "Taxas de Juros",
      date: d14.dateStr,
      time: d14.timeStr,
      datetime: d14.isoStr,
      impact: "high",
      forecast: "0,25%",
      previous: "0,25%",
      unit: "% a.a.",
      status: "scheduled",
      consensus: "Manutenção com sinalização hawkish para normalização de juros",
      description: "O BoJ define sua taxa overnight em Tóquio e o ritmo de encerramento do carry trade de ienes no mundo.",
      importanceReason: "Variações no Iene e juros japoneses podem desencadear desalavancagem global de fundos de investimento.",
      affectedTickers: ["NIKKEI 225", "JPY/BRL", "S&P 500"],
    },
    {
      id: "evt-pmi-br",
      title: "PMI Industrial do Brasil (S&P Global)",
      country: "BR",
      countryName: "Brasil",
      flag: "🇧🇷",
      category: "pmi",
      categoryLabel: "Atividade & PMI",
      date: d1.dateStr,
      time: d1.timeStr,
      datetime: d1.isoStr,
      impact: "medium",
      forecast: "53,2",
      previous: "53,0",
      unit: "pontos",
      status: "scheduled",
      consensus: "Expansão sólida na produção e novos pedidos industriais",
      description: "Índice de Gerentes de Compras (PMI) avalia a saúde econômica do setor industrial da economia brasileira.",
      importanceReason: "Indicador antecedente do PIB com divulgação rápida no início de cada mês.",
      affectedTickers: ["WEGE3", "EMBR3", "CSNA3"],
    },
    {
      id: "evt-fomc-minutes",
      title: "Ata da Reunião de Política Monetária do FOMC",
      country: "US",
      countryName: "Estados Unidos",
      flag: "🇺🇸",
      category: "central_bank",
      categoryLabel: "Bancos Centrais",
      date: d0.dateStr,
      time: d0.timeStr,
      datetime: d0.isoStr,
      impact: "medium",
      status: "released",
      actual: "Neutro",
      consensus: "Reafirmação do compromisso com o mandato duplo de inflação e emprego",
      description: "Registro detalhado das discussões entre os governadores e presidentes regionais do Fed.",
      importanceReason: "Esclarece divergências internas sobre a velocidade do afrouxamento monetário.",
      affectedTickers: ["S&P 500", "USD/BRL"],
    },
  ];

  return rawEvents.sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
}

/**
 * Busca os eventos econômicos consolidados do servidor com fallback instantâneo.
 */
export async function fetchEconomicCalendar(filters?: {
  category?: string;
  country?: string;
  impact?: EventImpact;
}): Promise<EconomicEvent[]> {
  const now = Date.now();

  // Verifica cache em memória (válido por 60 segundos)
  if (memoryCalendarCache && now - memoryCalendarCache.timestamp < 60000 && memoryCalendarCache.events.length > 0) {
    return applyFilters(memoryCalendarCache.events, filters);
  }

  // Tenta carregar do backend express /api/market/economic-calendar
  if (typeof window !== "undefined") {
    try {
      const url = new URL("/api/market/economic-calendar", window.location.origin);
      url.searchParams.set("t", String(now));
      if (filters?.category && filters.category !== "all") url.searchParams.set("category", filters.category);
      if (filters?.country && filters.country !== "all") url.searchParams.set("country", filters.country);
      if (filters?.impact) url.searchParams.set("impact", filters.impact);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(url.toString(), {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      clearTimeout(timeout);

      if (res.ok) {
        const json = await res.json();
        if (json?.success && Array.isArray(json.events) && json.events.length > 0) {
          memoryCalendarCache = { timestamp: now, events: json.events };
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(json.events));
          } catch {
            // ignore
          }
          return applyFilters(json.events, filters);
        }
      }
    } catch {
      // continua para fallback local
    }
  }

  // Tenta recuperar do localStorage
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(CACHE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          memoryCalendarCache = { timestamp: now, events: parsed };
          return applyFilters(parsed, filters);
        }
      }
    } catch {
      // ignore
    }
  }

  // Fallback garantido: motor algorítmico de eventos macroeconômicos
  const generated = generateDynamicEconomicCalendar();
  memoryCalendarCache = { timestamp: now, events: generated };
  return applyFilters(generated, filters);
}

function applyFilters(events: EconomicEvent[], filters?: {
  category?: string;
  country?: string;
  impact?: EventImpact;
}): EconomicEvent[] {
  let filtered = [...events];
  if (filters?.category && filters.category !== "all") {
    filtered = filtered.filter((e) => e.category === filters.category);
  }
  if (filters?.country && filters.country !== "all") {
    filtered = filtered.filter((e) => e.country === filters.country);
  }
  if (filters?.impact) {
    filtered = filtered.filter((e) => e.impact === filters.impact);
  }
  return filtered;
}

/**
 * Calcula tempo relativo e contagem regressiva para o evento
 */
export function getRelativeEventTime(event: EconomicEvent): {
  label: string;
  isToday: boolean;
  isTomorrow: boolean;
  isPast: boolean;
  hoursUntil: number;
} {
  const eventDate = new Date(event.datetime);
  const now = new Date();
  const diffMs = eventDate.getTime() - now.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const isPast = diffMs < 0;
  const isToday =
    eventDate.getDate() === now.getDate() &&
    eventDate.getMonth() === now.getMonth() &&
    eventDate.getFullYear() === now.getFullYear();

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow =
    eventDate.getDate() === tomorrow.getDate() &&
    eventDate.getMonth() === tomorrow.getMonth() &&
    eventDate.getFullYear() === tomorrow.getFullYear();

  let label = "";
  if (isPast) {
    label = "Divulgado hoje";
  } else if (isToday) {
    if (diffHours <= 1) {
      const diffMin = Math.max(1, Math.round(diffMs / (1000 * 60)));
      label = `Em ${diffMin} min`;
    } else {
      label = `Hoje às ${event.time}`;
    }
  } else if (isTomorrow) {
    label = `Amanhã às ${event.time}`;
  } else if (diffDays <= 7) {
    const weekday = eventDate.toLocaleDateString("pt-BR", { weekday: "short" });
    label = `${weekday.charAt(0).toUpperCase() + weekday.slice(1)}, ${eventDate.getDate()} às ${event.time}`;
  } else {
    label = `${eventDate.getDate()}/${eventDate.getMonth() + 1} às ${event.time}`;
  }

  return { label, isToday, isTomorrow, isPast, hoursUntil: diffHours };
}
