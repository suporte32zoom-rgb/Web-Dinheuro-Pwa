import { Asset, AssetSector } from "../types/finance";

export interface SectorDefinition {
  id: string;
  name: string;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  iconName: string;
  description: string;
}

export const SECTOR_DEFINITIONS: Record<string, SectorDefinition> = {
  all: {
    id: "all",
    name: "Todos",
    label: "Todos os Setores",
    color: "#e6edf3",
    bgColor: "rgba(255, 255, 255, 0.06)",
    borderColor: "rgba(255, 255, 255, 0.12)",
    iconName: "Layers",
    description: "Visualização consolidada de todos os ativos do mercado",
  },
  Tech: {
    id: "Tech",
    name: "Tecnologia",
    label: "Tecnologia & Inovação",
    color: "#58a6ff",
    bgColor: "rgba(88, 166, 255, 0.12)",
    borderColor: "rgba(88, 166, 255, 0.3)",
    iconName: "Cpu",
    description: "Big Techs, semicondutores, inteligência artificial, nuvem e software",
  },
  Energy: {
    id: "Energy",
    name: "Energia",
    label: "Energia & Petróleo",
    color: "#ff9800",
    bgColor: "rgba(255, 152, 0, 0.12)",
    borderColor: "rgba(255, 152, 0, 0.3)",
    iconName: "Flame",
    description: "Petróleo, gás, refino, energia fóssil e combustíveis",
  },
  Crypto: {
    id: "Crypto",
    name: "Cripto",
    label: "Criptomoedas & Web3",
    color: "#f7931a",
    bgColor: "rgba(247, 147, 26, 0.12)",
    borderColor: "rgba(247, 147, 26, 0.3)",
    iconName: "Coins",
    description: "Ativos digitais descentralizados, blockchains e smart contracts 24/7",
  },
  Finance: {
    id: "Finance",
    name: "Financeiro",
    label: "Financeiro & Bancos",
    color: "#2ea043",
    bgColor: "rgba(46, 160, 67, 0.12)",
    borderColor: "rgba(46, 160, 67, 0.3)",
    iconName: "Landmark",
    description: "Grandes bancos múltiplos, bolsas de valores, seguros e crédito",
  },
  Materials: {
    id: "Materials",
    name: "Materiais",
    label: "Materiais & Mineração",
    color: "#a371f7",
    bgColor: "rgba(163, 113, 247, 0.12)",
    borderColor: "rgba(163, 113, 247, 0.3)",
    iconName: "Gem",
    description: "Minério de ferro, siderurgia, celulose e insumos industriais",
  },
  Industry: {
    id: "Industry",
    name: "Indústria",
    label: "Indústria & Aeroespacial",
    color: "#79c0ff",
    bgColor: "rgba(121, 192, 255, 0.12)",
    borderColor: "rgba(121, 192, 255, 0.3)",
    iconName: "Factory",
    description: "Bens de capital, motores elétricos, aeronaves e transporte",
  },
  Consumer: {
    id: "Consumer",
    name: "Consumo",
    label: "Consumo & Varejo",
    color: "#ec6547",
    bgColor: "rgba(236, 101, 71, 0.12)",
    borderColor: "rgba(236, 101, 71, 0.3)",
    iconName: "ShoppingBag",
    description: "Varejo físico, e-commerce, supermercados e bens de consumo",
  },
  Utilities: {
    id: "Utilities",
    name: "Utilidades",
    label: "Serviços Básicos",
    color: "#3fb950",
    bgColor: "rgba(63, 185, 80, 0.12)",
    borderColor: "rgba(63, 185, 80, 0.3)",
    iconName: "Zap",
    description: "Geração e transmissão elétrica, saneamento e concessões públicas",
  },
  Commodities: {
    id: "Commodities",
    name: "Commodities",
    label: "Commodities & Agro",
    color: "#e3b341",
    bgColor: "rgba(227, 179, 65, 0.12)",
    borderColor: "rgba(227, 179, 65, 0.3)",
    iconName: "Wheat",
    description: "Soja, milho, ouro, contratos agrícolas e metais preciosos",
  },
  Forex: {
    id: "Forex",
    name: "Câmbio",
    label: "Moedas & Câmbio",
    color: "#56d364",
    bgColor: "rgba(86, 211, 100, 0.12)",
    borderColor: "rgba(86, 211, 100, 0.3)",
    iconName: "DollarSign",
    description: "Pares de moedas globais, taxas de câmbio PTAX e reservas",
  },
  Indices: {
    id: "Indices",
    name: "Índices",
    label: "Índices & Benchmarks",
    color: "#388bfd",
    bgColor: "rgba(56, 139, 253, 0.12)",
    borderColor: "rgba(56, 139, 253, 0.3)",
    iconName: "TrendingUp",
    description: "Principais índices bolsistas globais, ETFs e indicadores de mercado",
  },
};

/**
 * Mapeamento determinístico de setores para cada ticker conhecido
 */
const TICKER_SECTOR_MAP: Record<string, { sector: AssetSector; tags: string[] }> = {
  // Tech
  AAPL: { sector: "Tech", tags: ["Hardware", "MegaCap", "AI", "Mobile", "Global"] },
  NVDA: { sector: "Tech", tags: ["Semiconductors", "AI", "Chips", "MegaCap", "Global"] },
  MSFT: { sector: "Tech", tags: ["Software", "Cloud", "AI", "MegaCap", "Global"] },
  AMZN: { sector: "Tech", tags: ["Cloud", "E-Commerce", "AI", "Global"] },
  GOOGL: { sector: "Tech", tags: ["Search", "Cloud", "AI", "Advertising", "Global"] },
  TSLA: { sector: "Tech", tags: ["EV", "Automotive", "CleanEnergy", "Autonomous", "Global"] },
  META: { sector: "Tech", tags: ["SocialMedia", "AI", "Metaverse", "Global"] },
  TOTS3: { sector: "Tech", tags: ["ERP", "SaaS", "Software", "B3"] },
  NASDAQ: { sector: "Tech", tags: ["Benchmark", "TechIndex", "WallStreet"] },
  ".IXIC": { sector: "Tech", tags: ["Benchmark", "TechIndex"] },

  // Energy
  PETR4: { sector: "Energy", tags: ["Petróleo", "Estatal", "Dividendos", "B3"] },
  PRIO3: { sector: "Energy", tags: ["Petróleo", "JuniorOil", "B3"] },
  BRENT: { sector: "Energy", tags: ["Petróleo", "Futuros", "ICE"] },
  "GÁS NAT": { sector: "Energy", tags: ["GásNatural", "Commodities", "NYMEX"] },

  // Crypto
  "BTC/BRL": { sector: "Crypto", tags: ["Bitcoin", "Halving", "StoreOfValue", "24/7"] },
  "ETH/BRL": { sector: "Crypto", tags: ["Ethereum", "SmartContracts", "DeFi", "24/7"] },
  "SOL/BRL": { sector: "Crypto", tags: ["Solana", "HighSpeed", "DeFi", "24/7"] },
  "XRP/BRL": { sector: "Crypto", tags: ["Ripple", "Payments", "Liquidity", "24/7"] },
  "DOGE/BRL": { sector: "Crypto", tags: ["MemeCoin", "Community", "Payment", "24/7"] },
  BTC: { sector: "Crypto", tags: ["Bitcoin", "Global", "DigitalGold"] },
  ETH: { sector: "Crypto", tags: ["Ethereum", "Global", "EVM"] },
  SOL: { sector: "Crypto", tags: ["Solana", "Global"] },
  XRP: { sector: "Crypto", tags: ["Ripple", "Global"] },
  DOGE: { sector: "Crypto", tags: ["Dogecoin", "Global"] },

  // Finance
  ITUB4: { sector: "Finance", tags: ["Bancos", "Privado", "Dividendos", "B3"] },
  BBAS3: { sector: "Finance", tags: ["Bancos", "Estatal", "Agronegócio", "B3"] },
  B3SA3: { sector: "Finance", tags: ["Bolsa", "Infraestrutura", "Dividendos", "B3"] },
  ".DJI": { sector: "Finance", tags: ["DowJones", "BlueChips", "NYSE"] },

  // Materials
  VALE3: { sector: "Materials", tags: ["Mineração", "Exportação", "Dividendos", "B3"] },
  CMIN3: { sector: "Materials", tags: ["Mineração", "CSN", "B3"] },
  CSNA3: { sector: "Materials", tags: ["Siderurgia", "Aço", "B3"] },
  OURO: { sector: "Materials", tags: ["Ouro", "ReservaDeValor", "COMEX"] },

  // Industry
  WEGE3: { sector: "Industry", tags: ["Motores", "Automação", "Multinacional", "B3"] },
  EMBR3: { sector: "Industry", tags: ["Aeronáutica", "Defesa", "Exportação", "B3"] },
  AZUL4: { sector: "Industry", tags: ["Aviação", "Transporte", "B3"] },

  // Consumer
  MGLU3: { sector: "Consumer", tags: ["Varejo", "E-Commerce", "B3"] },
  CRFB3: { sector: "Consumer", tags: ["Supermercados", "VarejoAlimentar", "B3"] },

  // Utilities
  EQTL3: { sector: "Utilities", tags: ["EnergiaElétrica", "Defensivo", "Concessões", "B3"] },

  // Commodities
  SOJA: { sector: "Commodities", tags: ["Agro", "Grãos", "Chicago", "CBOT"] },

  // Forex
  "USD/BRL": { sector: "Forex", tags: ["Dólar", "Câmbio", "PTAX"] },
  "EUR/BRL": { sector: "Forex", tags: ["Euro", "Câmbio", "PTAX"] },
  "GBP/BRL": { sector: "Forex", tags: ["Libra", "Câmbio", "PTAX"] },
  "JPY/BRL": { sector: "Forex", tags: ["Iene", "Câmbio", "PTAX"] },
  "EUR/USD": { sector: "Forex", tags: ["MajorPair", "ForexGlobal"] },

  // Indices
  IBOV: { sector: "Indices", tags: ["Brasil", "B3", "Benchmark"] },
  "S&P 500": { sector: "Indices", tags: ["EUA", "WallStreet", "MegaCap"] },
  "DAX 40": { sector: "Indices", tags: ["Alemanha", "Europa", "Frankfurt"] },
  "FTSE 100": { sector: "Indices", tags: ["ReinoUnido", "Londres", "Europa"] },
  "CAC 40": { sector: "Indices", tags: ["França", "Paris", "Europa"] },
  "IBEX 35": { sector: "Indices", tags: ["Espanha", "Madri", "Europa"] },
  "STOXX 50": { sector: "Indices", tags: ["ZonaDoEuro", "Europa"] },
  "NIKKEI 225": { sector: "Indices", tags: ["Japão", "Tóquio", "Ásia"] },
  "SSE COMP": { sector: "Indices", tags: ["China", "Xangai", "Ásia"] },
  "HANG SENG": { sector: "Indices", tags: ["HongKong", "Ásia"] },
  SENSEX: { sector: "Indices", tags: ["Índia", "Mumbai", "Ásia"] },
  KOSPI: { sector: "Indices", tags: ["CoreiadoSul", "Seul", "Ásia"] },
  "S&P LATAM": { sector: "Indices", tags: ["AméricaLatina", "MercadosEmergentes"] },
  IGCX: { sector: "Indices", tags: ["GovernançaCorporativa", "B3"] },
  IBRA: { sector: "Indices", tags: ["BrasilAmplo", "B3"] },
  "S&P FUT": { sector: "Indices", tags: ["Derivativos", "CME"] },
  RUSSELL: { sector: "Indices", tags: ["SmallCaps", "EUA"] },
  VIX: { sector: "Indices", tags: ["Volatilidade", "ÍndiceDoMedo"] },
};

/**
 * Retorna o setor do ativo com inferência automática se não preenchido
 */
export function getAssetSector(asset: Partial<Asset>): AssetSector {
  if (asset.sector) return asset.sector;

  const ticker = (asset.ticker || "").toUpperCase();
  if (TICKER_SECTOR_MAP[ticker]) {
    return TICKER_SECTOR_MAP[ticker].sector;
  }

  // Inferência por categoria
  if (asset.category === "Criptomoedas") return "Crypto";
  if (asset.category === "Moedas") return "Forex";
  if (asset.category === "Contratos futuros") {
    if (ticker.includes("PETR") || ticker.includes("BRENT") || ticker.includes("GÁS")) return "Energy";
    if (ticker.includes("OURO")) return "Materials";
    if (ticker.includes("SOJA")) return "Commodities";
    return "Indices";
  }

  // Inferência pelo perfil institucional
  const profileSector = asset.profile?.sector?.toLowerCase() || "";
  if (profileSector.includes("tecnologia") || profileSector.includes("software")) return "Tech";
  if (profileSector.includes("petróleo") || profileSector.includes("energia")) return "Energy";
  if (profileSector.includes("financeiro") || profileSector.includes("banco")) return "Finance";
  if (profileSector.includes("mineração") || profileSector.includes("siderurgia")) return "Materials";
  if (profileSector.includes("indústria") || profileSector.includes("aeroespacial")) return "Industry";
  if (profileSector.includes("consumo") || profileSector.includes("varejo")) return "Consumer";
  if (profileSector.includes("serviços básicos") || profileSector.includes("elétrica")) return "Utilities";
  if (profileSector.includes("índice") || profileSector.includes("benchmark")) return "Indices";

  return "Indices";
}

/**
 * Retorna as tags associadas ao ativo
 */
export function getAssetTags(asset: Partial<Asset>): string[] {
  if (asset.tags && asset.tags.length > 0) return asset.tags;

  const ticker = (asset.ticker || "").toUpperCase();
  if (TICKER_SECTOR_MAP[ticker]) {
    return TICKER_SECTOR_MAP[ticker].tags;
  }

  const tags: string[] = [];
  if (asset.category) tags.push(asset.category);
  const sector = getAssetSector(asset);
  if (sector && !tags.includes(sector)) tags.push(sector);
  if (asset.exchange) tags.push(asset.exchange.split(" ")[0]);

  return tags;
}

/**
 * Agrupa ativos por setor
 */
export function groupAssetsBySector(assets: Asset[]): Record<string, Asset[]> {
  const grouped: Record<string, Asset[]> = {};

  for (const asset of assets) {
    const sector = getAssetSector(asset);
    if (!grouped[sector]) {
      grouped[sector] = [];
    }
    grouped[sector].push(asset);
  }

  return grouped;
}

/**
 * Filtra ativos por setor e/ou termo de busca por tag
 */
export function filterAssetsBySectorAndTag(
  assets: Asset[],
  selectedSector: string,
  searchTag: string = ""
): Asset[] {
  return assets.filter((asset) => {
    // Filtro de setor
    if (selectedSector !== "all") {
      const sector = getAssetSector(asset);
      if (sector.toLowerCase() !== selectedSector.toLowerCase()) {
        return false;
      }
    }

    // Filtro por tag ou busca textual
    if (searchTag.trim()) {
      const query = searchTag.trim().toLowerCase();
      const tags = getAssetTags(asset).map((t) => t.toLowerCase());
      const matchesTag = tags.some((t) => t.includes(query));
      const matchesTicker = asset.ticker.toLowerCase().includes(query);
      const matchesName = asset.name.toLowerCase().includes(query);
      if (!matchesTag && !matchesTicker && !matchesName) {
        return false;
      }
    }

    return true;
  });
}
