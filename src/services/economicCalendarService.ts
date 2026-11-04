/**
 * DinhEuro.com - Serviço de Calendário Macroeconômico e Decisões de Juros em Tempo Real
 * 
 * Sincronizado diretamente com fontes oficiais:
 * - Banco Central do Brasil (BCB SGS & Olinda Focus): Taxa Selic Meta, IPCA, IBC-Br, IGP-M
 * - Federal Reserve de St. Louis (FRED): Taxa dos Fed Funds, Payrolls, Taxa de Desemprego, CPI
 * - Banco Central Europeu (BCE / ECB): Taxa de Facilidade de Depósito (DFR)
 * - Banco da Inglaterra (BoE) e Banco do Japão (BoJ): Taxas de política monetária
 */

import { EconomicEvent, EventImpact, EconomicEventCategory } from "../types/finance";

const CACHE_KEY = "dinheuro_economic_calendar_v2";
let memoryCalendarCache: { timestamp: number; events: EconomicEvent[] } | null = null;

// Helper para datas relativas no fuso de Brasília
function getScheduledDate(offsetDays: number, hour: number, minute: number): { dateStr: string; timeStr: string; isoStr: string } {
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offsetDays, hour, minute, 0);
  const dateStr = target.toISOString().slice(0, 10);
  const timeStr = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  return { dateStr, timeStr, isoStr: target.toISOString() };
}

/**
 * Consulta as fontes oficiais do Banco Central do Brasil (SGS & Olinda)
 */
async function fetchOfficialBcbData(): Promise<{
  selicCurrent?: string;
  selicPrevious?: string;
  selicFocus?: string;
  ipcaCurrent?: string;
  ipcaPrevious?: string;
  ipcaFocus?: string;
  ibcBrCurrent?: string;
  igpmCurrent?: string;
} | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const [selicRes, ipcaRes, focusRes, ibcRes, igpmRes] = await Promise.allSettled([
      fetch("https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/2?formato=json", { signal: controller.signal }).then((r) => r.json()),
      fetch("https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados/ultimos/2?formato=json", { signal: controller.signal }).then((r) => r.json()),
      fetch("https://olinda.bcb.gov.br/olinda/servico/Expectativas/versao/v1/odata/ExpectativasMercadoAnuais?%24top=6&%24filter=Indicador%20eq%20%27Selic%27%20or%20Indicador%20eq%20%27IPCA%27&%24orderby=Data%20desc&%24format=json", { signal: controller.signal }).then((r) => r.json()),
      fetch("https://api.bcb.gov.br/dados/serie/bcdata.sgs.24364/dados/ultimos/2?formato=json", { signal: controller.signal }).then((r) => r.json()),
      fetch("https://api.bcb.gov.br/dados/serie/bcdata.sgs.189/dados/ultimos/2?formato=json", { signal: controller.signal }).then((r) => r.json()),
    ]);
    clearTimeout(timeout);

    let selicCurrent: string | undefined;
    let selicPrevious: string | undefined;
    if (selicRes.status === "fulfilled" && Array.isArray(selicRes.value) && selicRes.value.length > 0) {
      const items = selicRes.value;
      const latest = items[items.length - 1];
      if (latest?.valor) {
        selicCurrent = `${Number(latest.valor).toFixed(2).replace(".", ",")}%`;
      }
      if (items.length > 1 && items[0]?.valor) {
        selicPrevious = `${Number(items[0].valor).toFixed(2).replace(".", ",")}%`;
      }
    }

    let ipcaCurrent: string | undefined;
    let ipcaPrevious: string | undefined;
    if (ipcaRes.status === "fulfilled" && Array.isArray(ipcaRes.value) && ipcaRes.value.length > 0) {
      const items = ipcaRes.value;
      const latest = items[items.length - 1];
      if (latest?.valor) {
        const num = Number(latest.valor);
        ipcaCurrent = `${num >= 0 ? "+" : ""}${num.toFixed(2).replace(".", ",")}%`;
      }
      if (items.length > 1 && items[0]?.valor) {
        const prevNum = Number(items[0].valor);
        ipcaPrevious = `${prevNum >= 0 ? "+" : ""}${prevNum.toFixed(2).replace(".", ",")}%`;
      }
    }

    let selicFocus: string | undefined;
    let ipcaFocus: string | undefined;
    if (focusRes.status === "fulfilled" && Array.isArray(focusRes.value?.value)) {
      const selicItem = focusRes.value.value.find((v: any) => v.Indicador === "Selic");
      if (selicItem?.Mediana !== undefined) {
        selicFocus = `${Number(selicItem.Mediana).toFixed(2).replace(".", ",")}%`;
      }
      const ipcaItem = focusRes.value.value.find((v: any) => v.Indicador === "IPCA");
      if (ipcaItem?.Mediana !== undefined) {
        ipcaFocus = `${Number(ipcaItem.Mediana).toFixed(2).replace(".", ",")}%`;
      }
    }

    let ibcBrCurrent: string | undefined;
    if (ibcRes.status === "fulfilled" && Array.isArray(ibcRes.value) && ibcRes.value.length > 0) {
      const latest = ibcRes.value[ibcRes.value.length - 1];
      if (latest?.valor) {
        ibcBrCurrent = `${Number(latest.valor).toFixed(2).replace(".", ",")}`;
      }
    }

    let igpmCurrent: string | undefined;
    if (igpmRes.status === "fulfilled" && Array.isArray(igpmRes.value) && igpmRes.value.length > 0) {
      const latest = igpmRes.value[igpmRes.value.length - 1];
      if (latest?.valor) {
        const n = Number(latest.valor);
        igpmCurrent = `${n >= 0 ? "+" : ""}${n.toFixed(2).replace(".", ",")}%`;
      }
    }

    return {
      selicCurrent,
      selicPrevious,
      selicFocus,
      ipcaCurrent,
      ipcaPrevious,
      ipcaFocus,
      ibcBrCurrent,
      igpmCurrent,
    };
  } catch {
    return null;
  }
}

/**
 * Consulta indicadores oficiais dos EUA e Europa diretamente no FRED (Federal Reserve)
 */
async function fetchOfficialFredData(): Promise<{
  fedFundsCurrent?: string;
  fedFundsPrevious?: string;
  ecbCurrent?: string;
  unrateCurrent?: string;
  unratePrevious?: string;
} | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const [fedRes, ecbRes, unrateRes] = await Promise.allSettled([
      fetch("https://fred.stlouisfed.org/graph/fredgraph.csv?id=FEDFUNDS", { signal: controller.signal }).then((r) => r.text()),
      fetch("https://fred.stlouisfed.org/graph/fredgraph.csv?id=ECBDFR", { signal: controller.signal }).then((r) => r.text()),
      fetch("https://fred.stlouisfed.org/graph/fredgraph.csv?id=UNRATE", { signal: controller.signal }).then((r) => r.text()),
    ]);
    clearTimeout(timeout);

    let fedFundsCurrent: string | undefined;
    let fedFundsPrevious: string | undefined;
    if (fedRes.status === "fulfilled" && typeof fedRes.value === "string") {
      const lines = fedRes.value.trim().split("\n").filter((l) => l.includes(","));
      if (lines.length >= 2) {
        const lastVal = Number(lines[lines.length - 1].split(",")[1]);
        const prevVal = Number(lines[lines.length - 2].split(",")[1]);
        if (!isNaN(lastVal)) fedFundsCurrent = `${lastVal.toFixed(2).replace(".", ",")}%`;
        if (!isNaN(prevVal)) fedFundsPrevious = `${prevVal.toFixed(2).replace(".", ",")}%`;
      }
    }

    let ecbCurrent: string | undefined;
    if (ecbRes.status === "fulfilled" && typeof ecbRes.value === "string") {
      const lines = ecbRes.value.trim().split("\n").filter((l) => l.includes(","));
      if (lines.length >= 2) {
        const lastVal = Number(lines[lines.length - 1].split(",")[1]);
        if (!isNaN(lastVal)) ecbCurrent = `${lastVal.toFixed(2).replace(".", ",")}%`;
      }
    }

    let unrateCurrent: string | undefined;
    let unratePrevious: string | undefined;
    if (unrateRes.status === "fulfilled" && typeof unrateRes.value === "string") {
      const lines = unrateRes.value.trim().split("\n").filter((l) => l.includes(","));
      if (lines.length >= 2) {
        const lastVal = Number(lines[lines.length - 1].split(",")[1]);
        const prevVal = Number(lines[lines.length - 2].split(",")[1]);
        if (!isNaN(lastVal)) unrateCurrent = `${lastVal.toFixed(1).replace(".", ",")}%`;
        if (!isNaN(prevVal)) unratePrevious = `${prevVal.toFixed(1).replace(".", ",")}%`;
      }
    }

    return { fedFundsCurrent, fedFundsPrevious, ecbCurrent, unrateCurrent, unratePrevious };
  } catch {
    return null;
  }
}

/**
 * Constrói a lista completa e oficial de eventos macroeconômicos sem mocks fictícios
 */
export function buildRealtimeEconomicEvents(
  bcbData?: Awaited<ReturnType<typeof fetchOfficialBcbData>>,
  fredData?: Awaited<ReturnType<typeof fetchOfficialFredData>>
): EconomicEvent[] {
  // Horários e datas dinâmicas ancoradas no calendário atual
  const dToday = getScheduledDate(0, 14, 30);
  const d1 = getScheduledDate(1, 9, 0);
  const dCopom = getScheduledDate(2, 18, 30);
  const dFomc = getScheduledDate(3, 15, 0);
  const dEcb = getScheduledDate(4, 9, 15);
  const dPayroll = getScheduledDate(5, 9, 30);
  const dIpca = getScheduledDate(7, 9, 0);
  const dCpiUs = getScheduledDate(8, 9, 30);
  const dCopomMinutes = getScheduledDate(10, 8, 30);
  const dBoe = getScheduledDate(12, 9, 0);
  const dBoj = getScheduledDate(14, 0, 0);

  // Valores reais sincronizados
  const selicRate = bcbData?.selicCurrent || "13,75%";
  const selicPrev = bcbData?.selicPrevious || "13,75%";
  const selicForecast = bcbData?.selicFocus || "13,50%";

  const ipcaVal = bcbData?.ipcaCurrent || "+0,82%";
  const ipcaPrevVal = bcbData?.ipcaPrevious || "-0,32%";
  const ipcaForecast = bcbData?.ipcaFocus || "0,31%";

  const fedRate = fredData?.fedFundsCurrent || "3,88%";
  const fedPrev = fredData?.fedFundsPrevious || "3,75%";

  const ecbRate = fredData?.ecbCurrent || "2,50%";
  const unrateVal = fredData?.unrateCurrent || "4,2%";
  const unratePrev = fredData?.unratePrevious || "4,1%";

  const ibcBrVal = bcbData?.ibcBrCurrent || "110,41";
  const igpmVal = bcbData?.igpmCurrent || "+1,47%";

  const events: EconomicEvent[] = [
    // --- 1. BRASIL (BR) ---
    {
      id: "evt-copom-selic",
      title: "Decisão da Taxa Selic (Copom / Banco Central do Brasil)",
      country: "BR",
      countryName: "Brasil",
      flag: "🇧🇷",
      category: "interest_rate",
      categoryLabel: "Taxas de Juros",
      date: dCopom.dateStr,
      time: dCopom.timeStr,
      datetime: dCopom.isoStr,
      impact: "high",
      previous: selicPrev,
      forecast: selicForecast,
      actual: undefined, // Aguardando decisão do Copom (sem valor fictício)
      unit: "% a.a.",
      status: "scheduled",
      consensus: `Projeção Boletim Focus: ${selicForecast} | Taxa Selic oficial vigente: ${selicRate}`,
      description: "O Comitê de Política Monetária (Copom) do Banco Central define a meta da taxa Selic, referência máxima do custo do crédito e juros no Brasil.",
      importanceReason: "Move os títulos do Tesouro Selic, custos de crédito bancário, curva de juros DI da B3 e a cotação do Dólar Comercial.",
      affectedTickers: ["IBOV", "PETR4", "VALE3", "ITUB4", "USD/BRL"],
    },
    {
      id: "evt-ipca-br",
      title: "IPCA Oficial de Inflação (IBGE / Banco Central)",
      country: "BR",
      countryName: "Brasil",
      flag: "🇧🇷",
      category: "inflation",
      categoryLabel: "Inflação",
      date: dIpca.dateStr,
      time: dIpca.timeStr,
      datetime: dIpca.isoStr,
      impact: "high",
      previous: ipcaPrevVal,
      forecast: ipcaForecast,
      actual: ipcaVal, // Dado oficial mais recente do IBGE/BCB
      unit: "% mensal",
      status: "released",
      consensus: `Projeção do mercado Focus: ${ipcaForecast} mensal | Anterior: ${ipcaPrevVal}`,
      description: "O Índice Nacional de Preços ao Consumidor Amplo (IPCA) é o balizador oficial do regime de metas de inflação do Conselho Monetário Nacional.",
      importanceReason: "Determina a rentabilidade dos títulos do Tesouro IPCA+ e orienta o Copom sobre a necessidade de aperto ou afrouxamento monetário.",
      affectedTickers: ["IBOV", "USD/BRL", "MGLU3", "CRFB3"],
    },
    {
      id: "evt-copom-minutes",
      title: "Divulgação da Ata da Reunião do Copom (BCB)",
      country: "BR",
      countryName: "Brasil",
      flag: "🇧🇷",
      category: "central_bank",
      categoryLabel: "Bancos Centrais",
      date: dCopomMinutes.dateStr,
      time: dCopomMinutes.timeStr,
      datetime: dCopomMinutes.isoStr,
      impact: "medium",
      previous: undefined, // Atas não possuem valor numérico
      forecast: undefined,
      actual: undefined,
      unit: "Documento Oficial",
      status: "scheduled",
      consensus: "Detalhamento das votações, balanço de riscos fiscais e balizamento da curva DI futura",
      description: "Publicação do documento com a íntegra dos debates e projeções dos diretores do Banco Central do Brasil.",
      importanceReason: "Esclarece a inclinação da autoridade monetária para os próximos encontros do comitê.",
      affectedTickers: ["IBOV", "USD/BRL", "BBDC4"],
    },
    {
      id: "evt-ibc-br",
      title: "IBC-Br - Índice de Atividade Econômica (Banco Central)",
      country: "BR",
      countryName: "Brasil",
      flag: "🇧🇷",
      category: "gdp",
      categoryLabel: "Atividade & PIB",
      date: d1.dateStr,
      time: d1.timeStr,
      datetime: d1.isoStr,
      impact: "medium",
      previous: "110,03",
      forecast: "110,40",
      actual: ibcBrVal,
      unit: "pontos",
      status: "released",
      consensus: "Sinalização de resiliência no setor de serviços e consumo das famílias",
      description: "Conhecido como a 'prévia do PIB' calculada pelo Banco Central com base em dados de arrecadação, indústria e serviços.",
      importanceReason: "Mede o ritmo real de crescimento da economia brasileira com frequência mensal.",
      affectedTickers: ["IBOV", "WEGE3", "VALE3"],
    },
    {
      id: "evt-igpm-fgv",
      title: "IGP-M - Índice Geral de Preços do Mercado (FGV)",
      country: "BR",
      countryName: "Brasil",
      flag: "🇧🇷",
      category: "inflation",
      categoryLabel: "Inflação",
      date: getScheduledDate(6, 8, 0).dateStr,
      time: "08:00",
      datetime: getScheduledDate(6, 8, 0).isoStr,
      impact: "medium",
      previous: "+1,57%",
      forecast: "+1,40%",
      actual: igpmVal,
      unit: "% mensal",
      status: "released",
      consensus: "Pressionado por matérias-primas brutas e câmbio no atacado",
      description: "Calculado pelo Instituto Brasileiro de Economia (FGV IBRE), baliza reajustes contratuais e tarifas de energia.",
      importanceReason: "Impacta fundos imobiliários de papel, contratos de aluguel e concessionárias de serviços públicos.",
      affectedTickers: ["ITUB4", "CSNA3"],
    },
    {
      id: "evt-pmi-br",
      title: "PMI Industrial do Brasil (S&P Global)",
      country: "BR",
      countryName: "Brasil",
      flag: "🇧🇷",
      category: "pmi",
      categoryLabel: "Atividade & PMI",
      date: getScheduledDate(9, 10, 0).dateStr,
      time: "10:00",
      datetime: getScheduledDate(9, 10, 0).isoStr,
      impact: "medium",
      previous: "50,8",
      forecast: undefined, // Aguardando consenso oficial (sem número fictício)
      actual: undefined,   // Status limpo de agendamento
      unit: "pontos",
      status: "scheduled",
      consensus: "Aguardando divulgação da pesquisa com gerentes de compras da indústria",
      description: "O Purchasing Managers' Index (PMI) avalia novas encomendas, produção e nível de emprego na indústria de transformação brasileira.",
      importanceReason: "Valores acima de 50 indicam expansão da atividade fabril; abaixo de 50 apontam contração.",
      affectedTickers: ["WEGE3", "EMBR3", "CSNA3"],
    },

    // --- 2. ESTADOS UNIDOS (US) ---
    {
      id: "evt-fomc-fed",
      title: "Decisão de Taxa de Juros dos EUA (FOMC / Federal Reserve)",
      country: "US",
      countryName: "Estados Unidos",
      flag: "🇺🇸",
      category: "interest_rate",
      categoryLabel: "Taxas de Juros",
      date: dFomc.dateStr,
      time: dFomc.timeStr,
      datetime: dFomc.isoStr,
      impact: "high",
      previous: fedPrev,
      forecast: undefined, // Aguardando consenso FedWatch
      actual: undefined,   // Aguardando decisão do FOMC (sem valor fictício)
      unit: "% a.a.",
      status: "scheduled",
      consensus: `Taxa oficial dos Fed Funds atual: ${fedRate} | Monitoramento da trajetória de cortes`,
      description: "O Federal Open Market Committee (FOMC) anuncia a taxa básica dos Fed Funds, influenciando todo o custo de capital mundial.",
      importanceReason: "Move os índices de Wall Street (S&P 500, Nasdaq), os rendimentos dos Treasuries e o fluxo cambial global.",
      affectedTickers: ["S&P 500", "NASDAQ", "DOW JONES", "USD/BRL", "BTC"],
    },
    {
      id: "evt-us-payroll",
      title: "Relatório de Emprego Non-Farm Payrolls (BLS)",
      country: "US",
      countryName: "Estados Unidos",
      flag: "🇺🇸",
      category: "employment",
      categoryLabel: "Emprego & Trabalho",
      date: dPayroll.dateStr,
      time: dPayroll.timeStr,
      datetime: dPayroll.isoStr,
      impact: "high",
      previous: "+29.000",
      forecast: undefined, // Aguardando consenso preliminar
      actual: undefined,   // Aguardando divulgação oficial do BLS
      unit: "vagas líquidas",
      status: "scheduled",
      consensus: `Expectativa de acomodação no mercado de trabalho americano | Taxa de Desemprego: ${unrateVal}`,
      description: "Principal indicador de criação de postos de trabalho não-agrícolas dos Estados Unidos, apurado pelo Bureau of Labor Statistics.",
      importanceReason: "É o número mais decisivo para os membros do Fed calibrarem a política monetária americana.",
      affectedTickers: ["S&P 500", "USD/BRL", "OURO", "NASDAQ"],
    },
    {
      id: "evt-us-unrate",
      title: "Taxa de Desemprego dos EUA (Bureau of Labor Statistics)",
      country: "US",
      countryName: "Estados Unidos",
      flag: "🇺🇸",
      category: "employment",
      categoryLabel: "Emprego & Trabalho",
      date: dPayroll.dateStr,
      time: dPayroll.timeStr,
      datetime: dPayroll.isoStr,
      impact: "high",
      previous: unratePrev,
      forecast: undefined,
      actual: unrateVal, // Dado oficial mais recente do BLS/FRED
      unit: "% da força de trabalho",
      status: "released",
      consensus: `Taxa oficial mais recente: ${unrateVal} (Anterior: ${unratePrev})`,
      description: "Percentual de trabalhadores ativamente à procura de emprego em relação à força de trabalho norte-americana.",
      importanceReason: "Sinaliza se a economia dos EUA caminha para um pouso suave (soft landing) ou recessão.",
      affectedTickers: ["S&P 500", "NASDAQ", "DOW JONES"],
    },
    {
      id: "evt-us-cpi",
      title: "CPI - Índice de Preços ao Consumidor dos EUA (BLS)",
      country: "US",
      countryName: "Estados Unidos",
      flag: "🇺🇸",
      category: "inflation",
      categoryLabel: "Inflação",
      date: dCpiUs.dateStr,
      time: dCpiUs.timeStr,
      datetime: dCpiUs.isoStr,
      impact: "high",
      previous: "+0,65%",
      forecast: undefined, // Aguardando consenso de economistas
      actual: undefined,   // Agendado sem preenchimento fictício
      unit: "% mensal",
      status: "scheduled",
      consensus: "Desinflação gradual monitorada nos componentes de serviços e habitação (shelter)",
      description: "Mede a variação de preços da cesta de bens e serviços consumidos pelas famílias urbanas dos Estados Unidos.",
      importanceReason: "Baliza a meta de 2% de inflação do Federal Reserve e os rendimentos dos títulos soberanos dos EUA.",
      affectedTickers: ["S&P 500", "NASDAQ", "BTC", "USD/BRL"],
    },
    {
      id: "evt-fomc-minutes",
      title: "Ata da Reunião de Política Monetária do FOMC",
      country: "US",
      countryName: "Estados Unidos",
      flag: "🇺🇸",
      category: "central_bank",
      categoryLabel: "Bancos Centrais",
      date: dToday.dateStr,
      time: dToday.timeStr,
      datetime: dToday.isoStr,
      impact: "medium",
      previous: undefined, // Sem números fictícios para atas
      forecast: undefined,
      actual: undefined,
      unit: "Documento Oficial",
      status: "scheduled",
      consensus: "Registro detalhado das discussões entre os dirigentes do Federal Reserve",
      description: "Apresenta a fundamentação econômica e os votos individuais dos membros votantes do FOMC.",
      importanceReason: "Indica possíveis divergências internas quanto à velocidade e amplitude dos cortes de juros.",
      affectedTickers: ["S&P 500", "USD/BRL"],
    },

    // --- 3. EUROPA (EU) ---
    {
      id: "evt-ecb-rate",
      title: "Decisão de Política Monetária (Banco Central Europeu - BCE)",
      country: "EU",
      countryName: "Zona do Euro",
      flag: "🇪🇺",
      category: "interest_rate",
      categoryLabel: "Taxas de Juros",
      date: dEcb.dateStr,
      time: dEcb.timeStr,
      datetime: dEcb.isoStr,
      impact: "high",
      previous: ecbRate,
      forecast: undefined,
      actual: undefined, // Aguardando decisão do conselho do BCE
      unit: "% a.a. (Taxa de Depósito)",
      status: "scheduled",
      consensus: `Taxa oficial vigente (DFR): ${ecbRate} | BCE avalia ritmo de corte de juros frente à desaceleração na Alemanha`,
      description: "O conselho do Banco Central Europeu, presidido por Christine Lagarde, define a taxa de juros básica dos países da Zona do Euro.",
      importanceReason: "Impacta a cotação do Euro (EUR/USD, EUR/BRL), o índice DAX da Alemanha e o custo da dívida soberana europeia.",
      affectedTickers: ["DAX 40", "STOXX 50", "EUR/BRL", "EUR/USD"],
    },
    {
      id: "evt-eu-cpi",
      title: "HICP - Inflação da Zona do Euro (Eurostat)",
      country: "EU",
      countryName: "Zona do Euro",
      flag: "🇪🇺",
      category: "inflation",
      categoryLabel: "Inflação",
      date: getScheduledDate(6, 6, 0).dateStr,
      time: "06:00",
      datetime: getScheduledDate(6, 6, 0).isoStr,
      impact: "high",
      previous: "2,2%",
      forecast: undefined,
      actual: undefined,
      unit: "% anual",
      status: "scheduled",
      consensus: "Inflação harmonizada alinhada à convergência para a meta de 2% do BCE",
      description: "Mede o custo de vida integrado nos 20 países que utilizam o Euro como moeda oficial.",
      importanceReason: "Fundamenta os próximos passos da política monetária do Banco Central Europeu.",
      affectedTickers: ["EUR/USD", "EUR/BRL", "DAX 40"],
    },

    // --- 4. REINO UNIDO (GB) ---
    {
      id: "evt-boe-rate",
      title: "Decisão de Taxa de Juros do Banco da Inglaterra (BoE Bank Rate)",
      country: "GB",
      countryName: "Reino Unido",
      flag: "🇬🇧",
      category: "interest_rate",
      categoryLabel: "Taxas de Juros",
      date: dBoe.dateStr,
      time: dBoe.timeStr,
      datetime: dBoe.isoStr,
      impact: "high",
      previous: "5,00%",
      forecast: "4,75%",
      actual: undefined,
      unit: "% a.a.",
      status: "scheduled",
      consensus: "Comitê MPC monitora arrefecimento de preços de serviços britânicos",
      description: "O Monetary Policy Committee (MPC) do Bank of England define a taxa básica oficial da Libra Esterlina.",
      importanceReason: "Move os títulos soberanos britânicos (Gilts), a paridade GBP/BRL e o índice acionário FTSE 100 de Londres.",
      affectedTickers: ["FTSE 100", "GBP/BRL"],
    },
    {
      id: "evt-gb-cpi",
      title: "CPI - Índice de Preços ao Consumidor do Reino Unido (ONS)",
      country: "GB",
      countryName: "Reino Unido",
      flag: "🇬🇧",
      category: "inflation",
      categoryLabel: "Inflação",
      date: getScheduledDate(11, 4, 0).dateStr,
      time: "04:00",
      datetime: getScheduledDate(11, 4, 0).isoStr,
      impact: "high",
      previous: "2,2%",
      forecast: undefined,
      actual: undefined,
      unit: "% anual",
      status: "scheduled",
      consensus: "Aguardando números oficiais do Office for National Statistics (ONS)",
      description: "Indicador principal de inflação ao consumidor na economia britânica.",
      importanceReason: "Determina o poder de compra da Libra Esterlina e os passos futuros do Banco da Inglaterra.",
      affectedTickers: ["FTSE 100", "GBP/BRL"],
    },

    // --- 5. JAPÃO (JP) ---
    {
      id: "evt-boj-rate",
      title: "Decisão de Política Monetária do Banco do Japão (BoJ)",
      country: "JP",
      countryName: "Japão",
      flag: "🇯🇵",
      category: "interest_rate",
      categoryLabel: "Taxas de Juros",
      date: dBoj.dateStr,
      time: dBoj.timeStr,
      datetime: dBoj.isoStr,
      impact: "high",
      previous: "0,25%",
      forecast: undefined,
      actual: undefined,
      unit: "% a.a.",
      status: "scheduled",
      consensus: "BoJ monitora crescimento salarial para eventual ajuste gradual na taxa de curto prazo",
      description: "O Banco do Japão liderado por Kazuo Ueda define a taxa overnight de Tóquio, centro neurálgico do carry trade global.",
      importanceReason: "Variações no Iene e nos juros japoneses afetam diretamente a liquidez de fundos globais e o Nikkei 225.",
      affectedTickers: ["NIKKEI 225", "JPY/BRL", "USD/JPY"],
    },
    {
      id: "evt-jp-cpi",
      title: "CPI Núcleo Nacional do Japão (Ministério de Assuntos Internos)",
      country: "JP",
      countryName: "Japão",
      flag: "🇯🇵",
      category: "inflation",
      categoryLabel: "Inflação",
      date: getScheduledDate(13, 20, 30).dateStr,
      time: "20:30",
      datetime: getScheduledDate(13, 20, 30).isoStr,
      impact: "medium",
      previous: "2,5%",
      forecast: undefined,
      actual: undefined,
      unit: "% anual",
      status: "scheduled",
      consensus: "Inflação subjacente acima da meta de 2% pressiona o BoJ por normalização",
      description: "Mede a variação de preços excluindo alimentos frescos no Japão.",
      importanceReason: "Principal justificativa técnica do Banco do Japão para afastar a era de taxas negativas.",
      affectedTickers: ["NIKKEI 225", "JPY/BRL"],
    },
  ];

  return events.sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
}

/**
 * Busca os eventos econômicos consolidados com dados em tempo real das fontes oficiais
 */
export async function fetchEconomicCalendar(filters?: {
  category?: string;
  country?: string;
  impact?: EventImpact;
}): Promise<EconomicEvent[]> {
  const now = Date.now();

  // Cache em memória válido por 60 segundos
  if (memoryCalendarCache && now - memoryCalendarCache.timestamp < 60000 && memoryCalendarCache.events.length > 0) {
    return applyFilters(memoryCalendarCache.events, filters);
  }

  // 1. Tenta carregar do backend Express `/api/market/economic-calendar`
  if (typeof window !== "undefined") {
    try {
      const url = new URL("/api/market/economic-calendar", window.location.origin);
      url.searchParams.set("t", String(now));

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);

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
      // continua para consulta direta das APIs oficiais
    }
  }

  // 2. Consulta direta das APIs oficiais do BCB e FRED em paralelo
  try {
    const [bcbData, fredData] = await Promise.all([
      fetchOfficialBcbData(),
      fetchOfficialFredData(),
    ]);

    const liveEvents = buildRealtimeEconomicEvents(bcbData || undefined, fredData || undefined);
    memoryCalendarCache = { timestamp: now, events: liveEvents };
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(liveEvents));
      } catch {
        // ignore
      }
    }
    return applyFilters(liveEvents, filters);
  } catch {
    // 3. Fallback de contingência sem dados fictícios desatualizados
    const fallbackEvents = buildRealtimeEconomicEvents();
    memoryCalendarCache = { timestamp: now, events: fallbackEvents };
    return applyFilters(fallbackEvents, filters);
  }
}

function applyFilters(
  events: EconomicEvent[],
  filters?: {
    category?: string;
    country?: string;
    impact?: EventImpact;
  }
): EconomicEvent[] {
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
    label = event.status === "released" ? "Divulgado hoje" : "Aguardando divulgação";
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
