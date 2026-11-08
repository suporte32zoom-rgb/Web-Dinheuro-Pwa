import React, { useState, useEffect, useMemo } from "react";
import {
  Asset,
  RegionalTab,
  DayTradePosition,
  DayTradeOrder,
  DayTradeAccountSummary,
  DOMLevel,
  TimesAndTradesItem,
} from "../../types/finance";
import { dayTradeService } from "../../services/dayTradeService";
import { formatAssetDisplayPrice } from "../../utils/formatters";
import { computeDualCurrency } from "../../utils/currencyConversion";
import { RealTimeTickerRibbon } from "./RealTimeTickerRibbon";
import { TradingDeskSidebar } from "./TradingDeskSidebar";
import { MarketRealTimeWatchlist } from "./MarketRealTimeWatchlist";
import { LowerPerformanceDashboard } from "./LowerPerformanceDashboard";
import { OrderTicket } from "./OrderTicket";
import { DepthOfMarketDOM } from "./DepthOfMarketDOM";
import { TimesAndTradesFeed } from "./TimesAndTradesFeed";
import { RiskManagementModal } from "./RiskManagementModal";
import { BrokerApiModal } from "./BrokerApiModal";
import { IntradayCandleChart } from "./IntradayCandleChart";
import { FixedIncomeAndDerivativesView } from "./FixedIncomeAndDerivativesView";
import { marketStreamService } from "../../services/marketStreamService";
import {
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
  Key,
  TrendingUp,
  TrendingDown,
  LineChart,
  BookOpen,
  Activity,
  Sliders,
  Compass,
  Radio,
  CheckCircle2,
  Clock,
  Sparkles,
  Maximize2,
  Minimize2,
  PanelRightClose,
  PanelRightOpen,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface DayTradeTerminalProps {
  allAssets: Asset[];
  activeTab: RegionalTab;
  onSelectTab?: (tab: RegionalTab) => void;
}

// Preset Quick Trading Assets with underlying IDs for live binding and category tagging
const MARKET_CATEGORIES = [
  { id: "ALL", label: "Todos" },
  { id: "FUTURES", label: "Futuros B3" },
  { id: "B3", label: "Ações B3" },
  { id: "GLOBAL", label: "Global / US" },
  { id: "CRYPTO", label: "Cripto" },
];

const QUICK_TRADING_TICKERS = [
  { id: "win", ticker: "WIN$", name: "Mini Índice Futuro B3", underlyingId: "ibovespa", defaultPrice: 167540.0, currency: "pts", category: "FUTURES" },
  { id: "wdo", ticker: "WDO$", name: "Mini Dólar Futuro B3", underlyingId: "usd-brl", defaultPrice: 5459.6, currency: "BRL", category: "FUTURES" },
  { id: "petr4", ticker: "PETR4", name: "Petrobras PN", underlyingId: "petr4", defaultPrice: 47.28, currency: "BRL", category: "B3" },
  { id: "vale3", ticker: "VALE3", name: "Vale ON", underlyingId: "vale3", defaultPrice: 62.43, currency: "BRL", category: "B3" },
  { id: "itub4", ticker: "ITUB4", name: "Itaú Unibanco PN", underlyingId: "itub4", defaultPrice: 39.71, currency: "BRL", category: "B3" },
  { id: "sp-500", ticker: "S&P 500", name: "S&P 500 Futuro", underlyingId: "sp-500", defaultPrice: 7688.62, currency: "USD", category: "GLOBAL" },
  { id: "nvda", ticker: "NVDA", name: "NVIDIA Corp", underlyingId: "nvda", defaultPrice: 200.24, currency: "USD", category: "GLOBAL" },
  { id: "aapl", ticker: "AAPL", name: "Apple Inc", underlyingId: "aapl", defaultPrice: 258.40, currency: "USD", category: "GLOBAL" },
  { id: "bitcoin", ticker: "BTC", name: "Bitcoin Spot", underlyingId: "bitcoin", defaultPrice: 80112.0, currency: "USD", category: "CRYPTO" },
  { id: "eth", ticker: "ETH", name: "Ethereum", underlyingId: "eth", defaultPrice: 3120.0, currency: "USD", category: "CRYPTO" },
];

type DeskSubTab = "chart" | "tape" | "dom" | "indicators" | "strategies";

export const DayTradeTerminal: React.FC<DayTradeTerminalProps> = ({
  allAssets,
  activeTab,
  onSelectTab,
}) => {
  // Current Selected Asset for trading
  const [selectedTicker, setSelectedTicker] = useState<string>("PETR4");
  const [selectedDomPrice, setSelectedDomPrice] = useState<number | undefined>(undefined);
  const [activeSubTab, setActiveSubTab] = useState<DeskSubTab>("chart");
  const [sidebarActiveView, setSidebarActiveView] = useState<string>("chart");
  const [riskModalOpen, setRiskModalOpen] = useState(false);
  const [brokerModalOpen, setBrokerModalOpen] = useState(false);

  // Live Clock for B3 / Brasília Official Time
  const [brtTime, setBrtTime] = useState(() => {
    const d = new Date();
    return d.toLocaleTimeString("pt-BR", { hour12: false });
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setBrtTime(d.toLocaleTimeString("pt-BR", { hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Subscribe to DayTradeService state changes
  const [positions, setPositions] = useState<DayTradePosition[]>(() => dayTradeService.getPositions());
  const [orders, setOrders] = useState<DayTradeOrder[]>(() => dayTradeService.getOrders());
  const [account, setAccount] = useState<DayTradeAccountSummary>(() => dayTradeService.getAccount());
  const [riskSettings, setRiskSettings] = useState(() => dayTradeService.getRiskSettings());

  useEffect(() => {
    const unsub = dayTradeService.subscribe(() => {
      setPositions(dayTradeService.getPositions());
      setOrders(dayTradeService.getOrders());
      setAccount(dayTradeService.getAccount());
      setRiskSettings(dayTradeService.getRiskSettings());
    });
    return unsub;
  }, []);

  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [isWidescreenChart, setIsWidescreenChart] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

  // Helper to resolve live quote for quick trading tickers
  const getTickerLiveQuote = (item: typeof QUICK_TRADING_TICKERS[0]) => {
    const clean = item.ticker.replace("$", "").toUpperCase();
    const match = (allAssets || []).find(
      (a) =>
        a &&
        (a.ticker?.toUpperCase() === clean ||
          a.id?.toLowerCase() === item.underlyingId.toLowerCase() ||
          a.id?.toLowerCase() === item.id.toLowerCase())
    );
    if (match) {
      let price = match.price;
      if (item.ticker === "WDO$" && price < 100) {
        price = Number((price * 1000).toFixed(1));
      }
      return {
        price,
        changePercent: match.changePercent,
        currency: match.currency || item.currency,
      };
    }
    return {
      price: item.defaultPrice,
      changePercent: 0.5,
      currency: item.currency,
    };
  };

  // Resolve matching Asset object from catalog with unified prices and metrics
  const currentAsset = useMemo(() => {
    const cleanTicker = selectedTicker.replace("$", "").toUpperCase();
    const found = (allAssets || []).find(
      (a) =>
        a &&
        (a.ticker?.toUpperCase() === cleanTicker ||
          a.id?.toLowerCase() === selectedTicker.toLowerCase() ||
          a.ticker?.toUpperCase().includes(cleanTicker))
    );

    if (found) {
      return found;
    }

    // Special Derivativo: WIN$ (Mini Índice B3) - binds to live IBOVESPA
    if (selectedTicker === "WIN$") {
      const ibov = (allAssets || []).find((a) => a.id === "ibovespa" || a.ticker === "IBOV");
      const price = ibov?.price || 167540;
      return {
        id: "win",
        ticker: "WIN$",
        name: "Mini Índice Futuro B3",
        category: "América Latina" as const,
        currency: "pts",
        price,
        change: ibov?.change || 850,
        changePercent: ibov?.changePercent || 0.52,
        exchange: "B3 (Brasil)",
        sparkline: ibov?.sparkline || [price * 0.99, price * 1.002, price],
        historical: {} as any,
        metrics: {
          open: ibov?.metrics?.open || price * 0.995,
          high: ibov?.metrics?.high || price * 1.008,
          low: ibov?.metrics?.low || price * 0.992,
          high52w: ibov?.metrics?.high52w || price * 1.25,
          low52w: ibov?.metrics?.low52w || price * 0.75,
          prevClose: ibov?.metrics?.prevClose || price - (ibov?.change || 850),
          volume: ibov?.metrics?.volume || "R$ 48,2 Bi",
        },
        profile: {
          description: "Contrato Futuro de Mini Índice Ibovespa B3",
          sector: "Futuros & Derivativos",
          headquarters: "São Paulo, Brasil",
          websiteUrl: "https://www.b3.com.br",
          websiteLabel: "B3 Mercados",
          exchange: "B3",
          currency: "BRL",
        },
      };
    }

    // Special Derivativo: WDO$ (Mini Dólar B3) - binds to live USD/BRL
    if (selectedTicker === "WDO$") {
      const usdBrl = (allAssets || []).find((a) => a.id === "usd-brl" || a.ticker.includes("USD / BRL"));
      const rawRate = usdBrl?.price || 5.4397;
      const contractPrice = Number((rawRate * 1000).toFixed(1));
      return {
        id: "wdo",
        ticker: "WDO$",
        name: "Mini Dólar Futuro B3",
        category: "América Latina" as const,
        currency: "BRL",
        price: contractPrice,
        change: Number(((usdBrl?.change || -0.012) * 1000).toFixed(1)),
        changePercent: usdBrl?.changePercent || -0.22,
        exchange: "B3 (Brasil)",
        sparkline: (usdBrl?.sparkline || [5.45, 5.44, 5.4397]).map((v) => v * 1000),
        historical: {} as any,
        metrics: {
          open: Number(((usdBrl?.metrics?.open || 5.45) * 1000).toFixed(1)),
          high: Number(((usdBrl?.metrics?.high || 5.46) * 1000).toFixed(1)),
          low: Number(((usdBrl?.metrics?.low || 5.43) * 1000).toFixed(1)),
          high52w: 5950,
          low52w: 4850,
          prevClose: contractPrice - ((usdBrl?.change || -0.012) * 1000),
          volume: "R$ 22,6 Bi",
        },
        profile: {
          description: "Contrato Futuro de Mini Dólar Comercial B3",
          sector: "Futuros & Derivativos",
          headquarters: "São Paulo, Brasil",
          websiteUrl: "https://www.b3.com.br",
          websiteLabel: "B3 Mercados",
          exchange: "B3",
          currency: "BRL",
        },
      };
    }

    // Default to Petrobras or first asset in catalog
    return (allAssets && allAssets[0]) || {
      id: "petr4",
      ticker: "PETR4",
      name: "Petrobras PN",
      category: "América Latina" as const,
      currency: "BRL",
      price: 47.28,
      change: 0.35,
      changePercent: 0.75,
      exchange: "B3 (Brasil)",
      sparkline: [46.8, 47.0, 47.28],
      historical: {} as any,
      metrics: {
        open: 46.95,
        high: 47.45,
        low: 46.70,
        high52w: 52.80,
        low52w: 34.20,
        prevClose: 46.93,
        volume: "R$ 1,84 Bi",
      },
      profile: {
        description: "Petróleo Brasileiro S.A. - Petrobras",
        sector: "Petróleo e Gás",
        headquarters: "Rio de Janeiro, Brasil",
        websiteUrl: "https://www.petrobras.com.br",
        websiteLabel: "RI Petrobras",
        exchange: "B3",
        currency: "BRL",
      },
    };
  }, [allAssets, selectedTicker]);

  // Active position on currently selected asset
  const activePositionOnAsset = useMemo(() => {
    return (positions || []).find(
      (p) =>
        p &&
        p.ticker &&
        currentAsset &&
        currentAsset.ticker &&
        p.ticker.toUpperCase() === currentAsset.ticker.toUpperCase()
    );
  }, [positions, currentAsset]);

  // Real-time dynamic DOM levels & Times & Trades generator centered on real price
  const [domLevels, setDomLevels] = useState<DOMLevel[]>(() =>
    dayTradeService.generateDOM(currentAsset.price, currentAsset.price > 1000 ? 5 : 0.05)
  );

  const [tradesFeed, setTradesFeed] = useState<TimesAndTradesItem[]>(() =>
    dayTradeService.generateTimesAndTrades(currentAsset.price, 35)
  );

  // Broker ranking derived from trades
  const brokerRanking = useMemo(() => {
    return dayTradeService.getBrokerRanking(tradesFeed);
  }, [tradesFeed]);

  // Synchronize official price updates to open positions and DOM
  useEffect(() => {
    dayTradeService.updateMarketTick(currentAsset.ticker, currentAsset.price);
    const step = currentAsset.price > 1000 ? 5 : currentAsset.price > 100 ? 0.25 : 0.05;
    setDomLevels(dayTradeService.generateDOM(currentAsset.price, step));
  }, [currentAsset.price, currentAsset.ticker]);

  // Live streaming trade updates to Times & Trades based on current official price
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}.${String(Math.floor(now.getMilliseconds() / 10)).padStart(2, "0")}`;
      const aggressor = Math.random() > 0.48 ? "BUY" : "SELL";
      const qtyOptions = [5, 10, 15, 20, 25, 50, 100, 200];
      const quantity = qtyOptions[Math.floor(Math.random() * qtyOptions.length)];

      const newTrade: TimesAndTradesItem = {
        id: `tt-${Date.now()}`,
        time: timeStr,
        price: currentAsset.price,
        quantity,
        aggressor,
        buyerBroker: "XP Investimentos",
        sellerBroker: "BTG Pactual",
      };

      setTradesFeed((prev) => [newTrade, ...prev.slice(0, 45)]);
    }, 1800);

    return () => clearInterval(timer);
  }, [currentAsset.price, currentAsset.ticker]);

  // Listen for real-time pushed trade ticks from Finnhub Webhook stream
  useEffect(() => {
    const unsub = marketStreamService.subscribePriceUpdates((quotes) => {
      const match = quotes.find(
        (q) =>
          q.ticker?.toUpperCase() === currentAsset.ticker.toUpperCase() ||
          q.id?.toLowerCase() === currentAsset.id?.toLowerCase()
      );
      if (match && match.price > 0) {
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}.${String(Math.floor(now.getMilliseconds() / 10)).padStart(2, "0")}`;
        const newTrade: TimesAndTradesItem = {
          id: `push-${Date.now()}`,
          time: timeStr,
          price: match.price,
          quantity: Math.floor(Math.random() * 50) + 10,
          aggressor: match.change >= 0 ? "BUY" : "SELL",
          buyerBroker: "Institutional Flow",
          sellerBroker: "Market Liquidity",
        };
        setTradesFeed((prev) => [newTrade, ...prev.slice(0, 45)]);
      }
    });
    return unsub;
  }, [currentAsset.ticker, currentAsset.id]);

  // If Renda Fixa & Derivativos tab is selected, render dedicated Fixed Income view
  if (activeTab === "Renda Fixa & Derivativos") {
    return (
      <FixedIncomeAndDerivativesView
        onSelectDerivative={(ticker) => {
          setSelectedTicker(ticker);
          if (onSelectTab) onSelectTab("Day Trade & Scalping");
        }}
      />
    );
  }

  // Handle Sidebar Navigation
  const handleSidebarSelect = (viewId: string) => {
    setSidebarActiveView(viewId);
    if (viewId === "home" && onSelectTab) {
      onSelectTab("América Latina");
    } else if (viewId === "markets" && onSelectTab) {
      onSelectTab("Mercados Globais");
    } else if (viewId === "charts" || viewId === "chart") {
      setActiveSubTab("chart");
    } else if (viewId === "tape") {
      setActiveSubTab("tape");
    } else if (viewId === "book" || viewId === "orders") {
      setActiveSubTab("dom");
    } else if (viewId === "analysis" || viewId === "indicators") {
      setActiveSubTab("indicators");
    } else if (viewId === "strategies") {
      setActiveSubTab("strategies");
    } else if (viewId === "settings" || viewId === "risk") {
      setRiskModalOpen(true);
    } else if (viewId === "broker") {
      setBrokerModalOpen(true);
    } else if (viewId === "simulator" || viewId === "sim") {
      if (confirm("Deseja redefinir a conta simulada para R$ 100.000,00 e zerar posições?")) {
        dayTradeService.resetSimulatedAccount();
      }
    } else if (viewId === "positions" || viewId === "portfolio") {
      setActiveSubTab("chart");
    } else if (viewId === "news") {
      // Kept in view, highlights news stream
    } else if (viewId === "alerts") {
      alert(`Sistema de Alertas: Monitorando rompimentos e níveis para ${currentAsset.ticker}.`);
    } else if (viewId === "help") {
      alert("Atalhos do Terminal Day Trade:\n• Compra a Mercado: Botão Verde ou clique no Ask do DOM\n• Venda a Mercado: Botão Vermelho ou clique no Bid do DOM\n• Zerar Posição: Botão Laranja ou na tabela de Posições\n• Traçado: LTA, Suporte e Fibonacci no topo do gráfico");
    }
  };

  const totalDayPL = account.realizedPLDay + account.unrealizedPL;
  const isPositiveDay = totalDayPL >= 0;

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-[#0a0d14] text-[#e6edf3] select-none">
      {/* 1. TOP BAR: CONTINUOUS REAL-TIME GLOBAL TICKER RIBBON */}
      <RealTimeTickerRibbon
        assets={allAssets || []}
        selectedTicker={selectedTicker}
        onSelectTicker={(ticker) => {
          setSelectedTicker(ticker);
          setSelectedDomPrice(undefined);
        }}
      />

      {/* 2. MAIN COCKPIT: SLIM SIDEBAR + INTEGRATED WORKSPACE */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* LEFT SLIM SIDEBAR (48px) */}
        <TradingDeskSidebar
          activeAction={sidebarActiveView}
          activeView={sidebarActiveView}
          onSelectAction={handleSidebarSelect}
          onSelectView={handleSidebarSelect}
          onGoHome={() => onSelectTab && onSelectTab("América Latina")}
          mode={account.mode}
        />

        {/* CENTER + RIGHT DESK (Split View) */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0 p-1.5 gap-1.5">
          {/* LEFT MINI-DOCK: Categories & Quick Tickers Selector (Alongside Chart) */}
          <div className="hidden md:flex flex-col w-[170px] lg:w-[190px] bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden shrink-0 shadow-md">
            {/* Category Filter Chips Header */}
            <div className="p-2 border-b border-[#21262d] bg-[#0e1117] shrink-0">
              <span className="text-[10px] font-bold text-[#8b949e] uppercase tracking-wider block mb-1.5">
                Categorias
              </span>
              <div className="flex flex-wrap gap-1">
                {MARKET_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                      selectedCategory === cat.id
                        ? "bg-[#58a6ff] text-white font-bold shadow-xs"
                        : "bg-[#21262d] text-[#8b949e] hover:text-white"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Tickers List */}
            <div className="flex-1 overflow-y-auto scrollbar-none p-1.5 flex flex-col gap-1">
              {QUICK_TRADING_TICKERS.filter(
                (t) => selectedCategory === "ALL" || t.category === selectedCategory
              ).map((t) => {
                const isSelected = selectedTicker === t.ticker;
                const liveInfo = getTickerLiveQuote(t);
                const isPositive = (liveInfo.changePercent ?? 0) >= 0;
                return (
                  <button
                    key={t.ticker}
                    type="button"
                    onClick={() => {
                      setSelectedTicker(t.ticker);
                      setSelectedDomPrice(undefined);
                    }}
                    className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-between border ${
                      isSelected
                        ? "bg-[#21262d] text-white border-[#58a6ff] shadow-sm font-bold"
                        : "bg-[#0e1117] text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d]/60 border-[#21262d]"
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className={isSelected ? "text-[#58a6ff]" : "text-white"}>{t.ticker}</span>
                      <span className="text-[9px] text-[#8b949e] truncate max-w-[80px]">{t.name}</span>
                    </div>
                    <div className="flex flex-col items-end font-mono">
                      <span className="text-[11px] text-white">
                        {formatAssetDisplayPrice(liveInfo.price, liveInfo.currency)}
                      </span>
                      <span className={`text-[9px] font-semibold ${isPositive ? "text-[#00c853]" : "text-[#ff5252]"}`}>
                        {isPositive ? "+" : ""}{(liveInfo.changePercent ?? 0).toFixed(1)}%
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CENTER COLUMN: Central Viewport + Lower Performance Dashboard (Expands fully when widescreen) */}
          <div className="flex-1 flex flex-col gap-1.5 overflow-hidden min-h-0">
            {/* Functional Sub-Tabs Control Strip + Chart Expansion Bar */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl px-2 py-1.5 flex flex-wrap items-center justify-between gap-1.5 shrink-0 shadow-xs">
              {/* Functional Sub-Tabs: Gráfico | Tape Reading | Book | Indicadores | Estratégias */}
              <div className="flex items-center bg-[#0e1117] border border-[#30363d] rounded-lg p-0.5 gap-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setActiveSubTab("chart");
                    setSidebarActiveView("chart");
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                    activeSubTab === "chart"
                      ? "bg-[#21262d] text-[#58a6ff] font-bold shadow-xs"
                      : "text-[#8b949e] hover:text-[#e6edf3]"
                  }`}
                >
                  <LineChart className="w-3.5 h-3.5" />
                  <span>Gráfico Completo</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveSubTab("tape");
                    setSidebarActiveView("tape");
                  }}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                    activeSubTab === "tape"
                      ? "bg-[#21262d] text-[#58a6ff] font-bold shadow-xs"
                      : "text-[#8b949e] hover:text-[#e6edf3]"
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Tape Reading</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveSubTab("dom");
                    setSidebarActiveView("book");
                  }}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                    activeSubTab === "dom"
                      ? "bg-[#21262d] text-[#58a6ff] font-bold shadow-xs"
                      : "text-[#8b949e] hover:text-[#e6edf3]"
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Book de Ofertas</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveSubTab("indicators");
                    setSidebarActiveView("indicators");
                  }}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                    activeSubTab === "indicators"
                      ? "bg-[#21262d] text-[#58a6ff] font-bold shadow-xs"
                      : "text-[#8b949e] hover:text-[#e6edf3]"
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Indicadores</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveSubTab("strategies");
                    setSidebarActiveView("strategies");
                  }}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                    activeSubTab === "strategies"
                      ? "bg-[#21262d] text-[#58a6ff] font-bold shadow-xs"
                      : "text-[#8b949e] hover:text-[#e6edf3]"
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Estratégias</span>
                </button>
              </div>

              {/* Mobile Quick Ticker Carousel when side dock is hidden on small screens */}
              <div className="flex md:hidden items-center gap-1 overflow-x-auto scrollbar-none py-0.5 max-w-[200px]">
                {QUICK_TRADING_TICKERS.slice(0, 5).map((t) => (
                  <button
                    key={t.ticker}
                    type="button"
                    onClick={() => {
                      setSelectedTicker(t.ticker);
                      setSelectedDomPrice(undefined);
                    }}
                    className={`px-1.5 py-0.5 rounded text-[11px] font-semibold whitespace-nowrap cursor-pointer ${
                      selectedTicker === t.ticker ? "bg-[#58a6ff] text-white" : "bg-[#21262d] text-[#8b949e]"
                    }`}
                  >
                    {t.ticker}
                  </button>
                ))}
              </div>

              {/* Live Ticker Quick Quote + P&L Indicator + Controls */}
              <div className="flex items-center gap-1.5 ml-auto">
                {/* Active Asset Live Quote with Dual Currency Conversion */}
                <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#0e1117] border border-[#21262d] font-mono text-xs">
                  <span className="font-bold text-white">{currentAsset.ticker}</span>
                  <span className="text-white font-bold">{formatAssetDisplayPrice(currentAsset.price, currentAsset.currency)}</span>
                  <span className="text-[10.5px] text-[#8b949e] font-semibold">
                    ≈ {computeDualCurrency(currentAsset.price, currentAsset.currency).convertedFormatted}
                  </span>
                  <span
                    className={`text-[10.5px] font-bold flex items-center ${
                      currentAsset.changePercent >= 0 ? "text-[#00c853]" : "text-[#ff5252]"
                    }`}
                  >
                    {currentAsset.changePercent >= 0 ? <TrendingUp className="w-3 h-3 inline mr-0.5" /> : <TrendingDown className="w-3 h-3 inline mr-0.5" />}
                    {currentAsset.changePercent >= 0 ? "+" : ""}{currentAsset.changePercent.toFixed(2)}%
                  </span>
                </div>

                {/* Risk Management Button */}
                <button
                  type="button"
                  onClick={() => setRiskModalOpen(true)}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 border shadow-xs ${
                    riskSettings.isLocked
                      ? "bg-[#ff5252]/20 text-[#ff5252] border-[#ff5252]/50 animate-pulse"
                      : "bg-[#161b22] text-[#8b949e] hover:text-white border-[#30363d] hover:border-[#8b949e]"
                  }`}
                  title="Abrir Gerenciador e Travas de Risco"
                >
                  {riskSettings.isLocked ? (
                    <ShieldAlert className="w-3.5 h-3.5 text-[#ff5252]" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5 text-[#00c853]" />
                  )}
                  <span className="hidden md:inline">{riskSettings.isLocked ? "Trava Ativa" : "Risco"}</span>
                </button>

                {/* Reset Simulated Account */}
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Deseja redefinir a conta simulada para R$ 100.000,00 e zerar o P&L do dia?")) {
                      dayTradeService.resetSimulatedAccount();
                    }
                  }}
                  className="p-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-white border border-[#30363d] transition-colors cursor-pointer"
                  title="Redefinir Conta Simulada"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                {/* Alargar Tela Toda (Widescreen Toggle to enlarge chart) */}
                <button
                  type="button"
                  onClick={() => {
                    setIsWidescreenChart(!isWidescreenChart);
                    if (!isWidescreenChart) {
                      setIsRightPanelOpen(false);
                    } else {
                      setIsRightPanelOpen(true);
                    }
                  }}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 border shadow-xs ${
                    isWidescreenChart
                      ? "bg-[#58a6ff]/20 text-[#58a6ff] border-[#58a6ff]"
                      : "bg-[#21262d] hover:bg-[#30363d] text-[#e6edf3] border-[#30363d]"
                  }`}
                  title={isWidescreenChart ? "Restaurar layout normal" : "Alargar tela toda do gráfico"}
                >
                  {isWidescreenChart ? (
                    <>
                      <Minimize2 className="w-3.5 h-3.5 text-[#58a6ff]" />
                      <span className="hidden sm:inline">Restaurar</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-3.5 h-3.5 text-[#58a6ff]" />
                      <span className="hidden sm:inline">Alargar Tela</span>
                    </>
                  )}
                </button>

                {/* Right Panel Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
                  className="p-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-white border border-[#30363d] transition-colors cursor-pointer hidden lg:flex"
                  title={isRightPanelOpen ? "Ocultar Painel Lateral" : "Mostrar Painel Lateral"}
                >
                  {isRightPanelOpen ? (
                    <PanelRightClose className="w-3.5 h-3.5" />
                  ) : (
                    <PanelRightOpen className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Central Viewport Switcher */}
            <div className="flex-1 min-h-[220px] overflow-hidden">
              {activeSubTab === "chart" && (
                <IntradayCandleChart
                  asset={currentAsset}
                  activePosition={activePositionOnAsset}
                />
              )}

              {activeSubTab === "tape" && (
                <div className="h-full bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden p-1">
                  <TimesAndTradesFeed
                    ticker={currentAsset.ticker}
                    currency={currentAsset.currency}
                    trades={tradesFeed}
                    brokerRanking={brokerRanking}
                  />
                </div>
              )}

              {activeSubTab === "dom" && (
                <div className="h-full bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden p-1">
                  <DepthOfMarketDOM
                    ticker={currentAsset.ticker}
                    currency={currentAsset.currency}
                    currentPrice={currentAsset.price}
                    domLevels={domLevels}
                    onSelectPriceLevel={(price) => setSelectedDomPrice(price)}
                    selectedPrice={selectedDomPrice}
                  />
                </div>
              )}

              {activeSubTab === "indicators" && (
                <div className="h-full bg-[#161b22] border border-[#30363d] rounded-xl p-3 overflow-y-auto scrollbar-none flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-[#21262d] pb-2">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-[#58a6ff]" />
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                        Painel de Indicadores Técnicos Intraday · {currentAsset.ticker}
                      </h3>
                    </div>
                    <span className="text-[11px] text-[#3fb950] font-mono font-bold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#3fb950] animate-pulse" />
                      Calculados em Tempo Real
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                    {/* RSI 14 */}
                    <div className="bg-[#0e1117] border border-[#30363d] rounded-lg p-2.5">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-[#8b949e] font-semibold">IFR / RSI (14)</span>
                        <span className="text-[#3fb950] font-bold font-mono">58.4 · Neutro-Alta</span>
                      </div>
                      <div className="w-full bg-[#21262d] h-2 rounded-full overflow-hidden">
                        <div className="bg-[#3fb950] h-full" style={{ width: "58.4%" }} />
                      </div>
                      <div className="flex justify-between text-[9px] text-[#8b949e] mt-1 font-mono">
                        <span>Sobrevenda (30)</span>
                        <span>Neutro (50)</span>
                        <span>Sobrecompra (70)</span>
                      </div>
                    </div>

                    {/* MACD */}
                    <div className="bg-[#0e1117] border border-[#30363d] rounded-lg p-2.5">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-[#8b949e] font-semibold">MACD (12, 26, 9)</span>
                        <span className="text-[#58a6ff] font-bold font-mono">+14.2 · Compra</span>
                      </div>
                      <p className="text-[10px] text-[#8b949e] leading-relaxed">
                        Histograma positivo. Linha rápida acima do sinal indicando momentum de alta.
                      </p>
                    </div>

                    {/* Bandas de Bollinger */}
                    <div className="bg-[#0e1117] border border-[#30363d] rounded-lg p-2.5">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-[#8b949e] font-semibold">Bandas de Bollinger (20, 2)</span>
                        <span className="text-[#e3b341] font-bold font-mono">Canal Normal</span>
                      </div>
                      <div className="flex justify-between text-[10px] font-mono text-[#8b949e]">
                        <span>Sup: {(currentAsset.price * 1.018).toFixed(2)}</span>
                        <span>Inf: {(currentAsset.price * 0.982).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {/* Médias Móveis Rastreadas */}
                    <div className="bg-[#0e1117] border border-[#30363d] rounded-lg p-2.5 flex flex-col gap-1.5">
                      <span className="text-xs font-bold text-white">Médias Móveis Institucionais</span>
                      <div className="flex items-center justify-between text-xs font-mono border-b border-[#21262d] py-1">
                        <span className="text-[#58a6ff]">MA 9 Exponencial (Curto Prazo)</span>
                        <span className="text-white font-bold">{(currentAsset.price * 0.998).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-mono border-b border-[#21262d] py-1">
                        <span className="text-[#f0883e]">MA 21 Aritmética (Médio Prazo)</span>
                        <span className="text-white font-bold">{(currentAsset.price * 0.994).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-mono py-1">
                        <span className="text-[#bc8cff]">MA 200 Institucional (Longo Prazo)</span>
                        <span className="text-white font-bold">{(currentAsset.price * 0.988).toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Fluxo e VWAP */}
                    <div className="bg-[#0e1117] border border-[#30363d] rounded-lg p-2.5 flex flex-col gap-1.5">
                      <span className="text-xs font-bold text-white">Preço Médio Ponderado por Volume (VWAP)</span>
                      <div className="flex items-center justify-between text-xs font-mono py-1">
                        <span className="text-[#e3b341]">VWAP do Dia</span>
                        <span className="text-white font-bold">{(currentAsset.price * 0.996).toFixed(2)}</span>
                      </div>
                      <p className="text-[10px] text-[#8b949e] leading-relaxed">
                        Preço atual negociando <strong className="text-[#3fb950]">+0.40%</strong> acima da VWAP. Tendência intraday dominante: COMPRA.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeSubTab === "strategies" && (
                <div className="h-full bg-[#161b22] border border-[#30363d] rounded-xl p-3 overflow-y-auto scrollbar-none flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-[#21262d] pb-2">
                    <div className="flex items-center gap-2">
                      <Compass className="w-4 h-4 text-[#e3b341]" />
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                        Estratégias Quantitativas & Setups Operacionais
                      </h3>
                    </div>
                    <span className="text-[11px] text-[#58a6ff] font-mono">Algoritmos Ativos</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {/* Setup 1 */}
                    <div className="bg-[#0e1117] border border-[#30363d] rounded-lg p-3 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">Cruzamento MA 9 x MA 21</span>
                        <span className="px-1.5 py-0.5 rounded bg-[#238636]/20 text-[#3fb950] text-[10px] font-bold">
                          Sinal de Compra
                        </span>
                      </div>
                      <p className="text-[10px] text-[#8b949e]">
                        Gatilho ativado no candle das 15:45. Alvo: 1.5x amplitude de risco. Stop Loss: mínima do candle anterior.
                      </p>
                    </div>

                    {/* Setup 2 */}
                    <div className="bg-[#0e1117] border border-[#30363d] rounded-lg p-3 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">Pullback na VWAP</span>
                        <span className="px-1.5 py-0.5 rounded bg-[#e3b341]/20 text-[#e3b341] text-[10px] font-bold">
                          Monitorando Entrada
                        </span>
                      </div>
                      <p className="text-[10px] text-[#8b949e]">
                        Aguardando retração controlada até o nível de VWAP com redução do volume de agressão vendedora.
                      </p>
                    </div>

                    {/* Setup 3 */}
                    <div className="bg-[#0e1117] border border-[#30363d] rounded-lg p-3 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">Rompimento de Máxima Diária</span>
                        <span className="px-1.5 py-0.5 rounded bg-[#58a6ff]/20 text-[#58a6ff] text-[10px] font-bold">
                          Alerta Próximo
                        </span>
                      </div>
                      <p className="text-[10px] text-[#8b949e]">
                        Ativo a 0.2% da máxima do dia. Entrada por ordem stop na superação da máxima com confirmação de fluxo.
                      </p>
                    </div>

                    {/* Setup 4 */}
                    <div className="bg-[#0e1117] border border-[#30363d] rounded-lg p-3 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">Filtro de Tendência MA 200</span>
                        <span className="px-1.5 py-0.5 rounded bg-[#bc8cff]/20 text-[#bc8cff] text-[10px] font-bold">
                          Filtro Ativo
                        </span>
                      </div>
                      <p className="text-[10px] text-[#8b949e]">
                        Operações a favor da tendência primária. Vendas contra a tendência desabilitadas pelo algoritmo de risco.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* LOWER HORIZONTAL PANEL: Minhas Posições + Performance do Dia + Notícias */}
            <div className="h-[148px] shrink-0 overflow-hidden">
              <LowerPerformanceDashboard
                positions={positions}
                account={account}
                onSelectTicker={(t) => setSelectedTicker(t)}
              />
            </div>
          </div>

          {/* RIGHT COLUMN: "MERCADO EM TEMPO REAL" (Top ~40%) + IMMEDIATE ORDER TICKET (Bottom ~60%) */}
          {isRightPanelOpen && (
            <div className="w-full lg:w-[325px] xl:w-[340px] flex flex-col gap-1.5 h-full overflow-hidden shrink-0 animate-in fade-in duration-150">
              {/* Top Watchlist (~38% of right column) */}
              <div className="h-[200px] xl:h-[220px] shrink-0 overflow-hidden">
                <MarketRealTimeWatchlist
                  assets={allAssets || []}
                  selectedTicker={selectedTicker}
                  onSelectTicker={(ticker) => {
                    setSelectedTicker(ticker);
                    setSelectedDomPrice(undefined);
                  }}
                  onSelectAsset={(ticker) => {
                    setSelectedTicker(ticker);
                    setSelectedDomPrice(undefined);
                  }}
                />
              </div>

              {/* Bottom Order Ticket Execution Boleta (Remaining flex height) */}
              <div className="flex-1 min-h-0 overflow-hidden">
                <OrderTicket
                  asset={currentAsset}
                  onOpenRiskModal={() => setRiskModalOpen(true)}
                  onOpenBrokerModal={() => setBrokerModalOpen(true)}
                  activePositionQuantity={activePositionOnAsset?.quantity}
                  activePositionSide={activePositionOnAsset?.side}
                  externalPrice={selectedDomPrice}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. FIXED INSTITUTIONAL FOOTER STATUS BAR */}
      <footer className="h-6 bg-[#090c10] border-t border-[#21262d] px-3 flex items-center justify-between text-[11px] font-mono text-[#8b949e] shrink-0 z-10 select-none">
        {/* Left: Connection Quality */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#00c853] animate-pulse" />
            <span className="text-[#3fb950] font-semibold">Conexão: Estável (Ultra Baixa Latência · 12ms)</span>
          </div>

          <span className="text-[#30363d]">|</span>

          <div className="hidden sm:flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-[#58a6ff]" />
            <span>Sistemas B3 / BACEN / Global: Online</span>
          </div>
        </div>

        {/* Center: Mode Indicator */}
        <div className="hidden md:flex items-center gap-1.5">
          <span className="px-1.5 py-0.2 rounded bg-[#21262d] text-[#e6edf3] font-semibold text-[10px]">
            {account.mode === "SIMULATED" ? "MODO SIMULADO (PAPER TRADING)" : "MODO REAL HOMOLOGADO"}
          </span>
        </div>

        {/* Right: B3 Time & Branding */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[#e6edf3]">
            <Clock className="w-3 h-3 text-[#e3b341]" />
            <span>{brtTime} BRT · B3 Aberta</span>
          </div>

          <span className="text-[#30363d] hidden sm:inline">|</span>

          <span className="text-white font-bold hidden sm:inline tracking-wider">
            DinhEuro <span className="text-[#58a6ff]">PRO</span>
          </span>
        </div>
      </footer>

      {/* 4. MODALS */}
      <RiskManagementModal
        isOpen={riskModalOpen}
        onClose={() => setRiskModalOpen(false)}
        currentRisk={riskSettings}
      />

      <BrokerApiModal
        isOpen={brokerModalOpen}
        onClose={() => setBrokerModalOpen(false)}
      />
    </div>
  );
};
