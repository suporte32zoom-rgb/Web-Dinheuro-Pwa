import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Asset,
  RegionalTab,
  DayTradePosition,
  DayTradeOrder,
  DayTradeAccountSummary,
  DOMLevel,
  TimesAndTradesItem,
  BrokerRankingItem,
} from "../../types/finance";
import { dayTradeService } from "../../services/dayTradeService";
import { formatAssetDisplayPrice } from "../../utils/formatters";
import { OrderTicket } from "./OrderTicket";
import { PositionsAndPLTable } from "./PositionsAndPLTable";
import { DepthOfMarketDOM } from "./DepthOfMarketDOM";
import { TimesAndTradesFeed } from "./TimesAndTradesFeed";
import { RiskManagementModal } from "./RiskManagementModal";
import { BrokerApiModal } from "./BrokerApiModal";
import { IntradayCandleChart } from "./IntradayCandleChart";
import { FixedIncomeAndDerivativesView } from "./FixedIncomeAndDerivativesView";
import {
  Activity,
  Sliders,
  Percent,
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
  Key,
  Maximize2,
  TrendingUp,
  TrendingDown,
  Layers,
  ChevronDown,
  Sparkles,
  Zap,
} from "lucide-react";

interface DayTradeTerminalProps {
  allAssets: Asset[];
  activeTab: RegionalTab;
  onSelectTab?: (tab: RegionalTab) => void;
}

// Default Liquid Day Trade Assets
const QUICK_TRADING_TICKERS = [
  { id: "win", ticker: "WIN$", name: "Mini Índice Futuro B3", basePrice: 167548.0, currency: "BRL" },
  { id: "wdo", ticker: "WDO$", name: "Mini Dólar Futuro B3", basePrice: 5459.6, currency: "BRL" },
  { id: "petr4", ticker: "PETR4", name: "Petrobras PN", basePrice: 47.12, currency: "BRL" },
  { id: "vale3", ticker: "VALE3", name: "Vale ON", basePrice: 62.35, currency: "BRL" },
  { id: "itub4", ticker: "ITUB4", name: "Itaú Unibanco PN", basePrice: 39.71, currency: "BRL" },
  { id: "bitcoin", ticker: "BTC", name: "Bitcoin Spot", basePrice: 80112.0, currency: "USD" },
  { id: "sp-500", ticker: "S&P 500", name: "S&P 500 Futuro", basePrice: 7688.62, currency: "USD" },
  { id: "nvda", ticker: "NVDA", name: "NVIDIA Corp", basePrice: 200.13, currency: "USD" },
];

export const DayTradeTerminal: React.FC<DayTradeTerminalProps> = ({
  allAssets,
  activeTab,
  onSelectTab,
}) => {
  // Current Selected Asset for trading
  const [selectedTicker, setSelectedTicker] = useState<string>("PETR4");
  const [riskModalOpen, setRiskModalOpen] = useState(false);
  const [brokerModalOpen, setBrokerModalOpen] = useState(false);

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

  // Resolve matching Asset object from catalog
  const currentAsset = useMemo(() => {
    const cleanTicker = selectedTicker.replace("$", "").toUpperCase();
    const found = allAssets.find(
      (a) =>
        a.ticker.toUpperCase() === cleanTicker ||
        a.id.toLowerCase() === selectedTicker.toLowerCase() ||
        a.ticker.toUpperCase().includes(cleanTicker)
    );

    if (found) return found;

    // Fallback virtual asset for Mini Índice / Mini Dólar
    const preset = QUICK_TRADING_TICKERS.find((t) => t.ticker === selectedTicker) || QUICK_TRADING_TICKERS[0];
    return {
      id: preset.id,
      ticker: preset.ticker,
      name: preset.name,
      category: "América Latina" as const,
      currency: preset.currency,
      price: preset.basePrice,
      change: preset.basePrice * 0.008,
      changePercent: 0.8,
      exchange: "B3 (Brasil)",
      sparkline: [preset.basePrice * 0.99, preset.basePrice * 1.005, preset.basePrice],
      historical: {} as any,
      metrics: {
        open: preset.basePrice * 0.992,
        high: preset.basePrice * 1.012,
        low: preset.basePrice * 0.988,
        high52w: preset.basePrice * 1.25,
        low52w: preset.basePrice * 0.75,
        prevClose: preset.basePrice * 0.992,
        volume: "R$ 1,24 Bi",
      },
      profile: {
        description: preset.name,
        sector: "Derivativos & Day Trade",
        headquarters: "São Paulo, Brasil",
        websiteUrl: "https://www.b3.com.br",
        websiteLabel: "B3 Mercados",
        exchange: "B3",
        currency: preset.currency,
      },
    };
  }, [allAssets, selectedTicker]);

  // Active position on currently selected asset
  const activePositionOnAsset = useMemo(() => {
    return positions.find(
      (p) => p.ticker.toUpperCase() === currentAsset.ticker.toUpperCase()
    );
  }, [positions, currentAsset.ticker]);

  // Real-time dynamic DOM levels & Times & Trades generator
  const [domLevels, setDomLevels] = useState<DOMLevel[]>(() =>
    dayTradeService.generateDOM(currentAsset.price, currentAsset.price > 1000 ? 5 : 0.05)
  );

  const [tradesFeed, setTradesFeed] = useState<TimesAndTradesItem[]>(() =>
    dayTradeService.generateTimesAndTrades(currentAsset.price, 30)
  );

  // Broker ranking derived from trades
  const brokerRanking = useMemo(() => {
    return dayTradeService.getBrokerRanking(tradesFeed);
  }, [tradesFeed]);

  // Live High-Frequency Ticks interval simulation (updates DOM & streaming trades)
  useEffect(() => {
    const timer = setInterval(() => {
      // Small realistic price micro-tick
      const tickDelta = (Math.random() - 0.49) * (currentAsset.price * 0.0004);
      const newPrice = Number((currentAsset.price + tickDelta).toFixed(2));

      // Update service positions P&L with the live tick
      dayTradeService.updateMarketTick(currentAsset.ticker, newPrice);

      // Refresh DOM
      const step = currentAsset.price > 1000 ? 5 : 0.05;
      setDomLevels(dayTradeService.generateDOM(newPrice, step));

      // Add a live trade to the tape
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}.${String(Math.floor(now.getMilliseconds() / 10)).padStart(2, "0")}`;
      const aggressor = Math.random() > 0.5 ? "BUY" : "SELL";
      const qtyOptions = [5, 10, 15, 20, 25, 50, 100];
      const quantity = qtyOptions[Math.floor(Math.random() * qtyOptions.length)];

      const newTrade: TimesAndTradesItem = {
        id: `tt-${Date.now()}`,
        time: timeStr,
        price: newPrice,
        quantity,
        aggressor,
        buyerBroker: "XP Investimentos",
        sellerBroker: "BTG Pactual",
      };

      setTradesFeed((prev) => [newTrade, ...prev.slice(0, 40)]);
    }, 1600);

    return () => clearInterval(timer);
  }, [currentAsset.price, currentAsset.ticker]);

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

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full py-4 space-y-4">
      {/* 1. TOP CONTROL BAR: Ticker Switcher, Quick Stats & Action Buttons */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-3.5 shadow-lg flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
        {/* Left: Quick Tickers Carousel */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none w-full lg:w-auto py-1">
          {QUICK_TRADING_TICKERS.map((t) => {
            const isSelected = selectedTicker === t.ticker;
            return (
              <button
                key={t.ticker}
                type="button"
                onClick={() => setSelectedTicker(t.ticker)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? "bg-[#21262d] text-[#58a6ff] border border-[#58a6ff] shadow-xs font-bold"
                    : "bg-[#0e1117] text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d]/60 border border-[#30363d]"
                }`}
              >
                <span>{t.ticker}</span>
                <span className="text-[10px] font-mono text-[#8b949e]">
                  {formatAssetDisplayPrice(t.basePrice, t.currency)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: Risk Button, Broker API & Simulator Reset */}
        <div className="flex items-center gap-2 w-full lg:w-auto justify-end flex-wrap">
          {/* Risk Management Button */}
          <button
            type="button"
            id="btn-daytrade-risk-settings"
            onClick={() => setRiskModalOpen(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 border shadow-xs ${
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
            <span>{riskSettings.isLocked ? "Trava Bloqueada" : "Travas de Risco"}</span>
          </button>

          {/* Broker API Modal Trigger */}
          <button
            type="button"
            id="btn-daytrade-broker-api"
            onClick={() => setBrokerModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-[#e6edf3] border border-[#30363d] text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
            title="Conectar Conta Real via API DMA2"
          >
            <Key className="w-3.5 h-3.5 text-[#e3b341]" />
            <span>API Corretora</span>
          </button>

          {/* Reset Simulated Account */}
          <button
            type="button"
            onClick={() => {
              if (confirm("Deseja redefinir a conta simulada para R$ 100.000,00 e zerar o P&L do dia?")) {
                dayTradeService.resetSimulatedAccount();
              }
            }}
            className="p-2 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-white border border-[#30363d] transition-colors cursor-pointer"
            title="Redefinir Conta Simulada (Paper Trading)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. MAIN COCKPIT: Order Ticket + Chart + Microstructure (DOM / Trades) */}
      {activeTab === "Fluxo & Tape Reading" ? (
        /* FLUXO & TAPE READING DEEP VIEW: Full DOM + Stream + Broker Ranking */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-4">
            <DepthOfMarketDOM
              ticker={currentAsset.ticker}
              currency={currentAsset.currency}
              currentPrice={currentAsset.price}
              domLevels={domLevels}
            />
          </div>
          <div className="lg:col-span-4">
            <TimesAndTradesFeed
              ticker={currentAsset.ticker}
              currency={currentAsset.currency}
              trades={tradesFeed}
              brokerRanking={brokerRanking}
            />
          </div>
          <div className="lg:col-span-4">
            <OrderTicket
              asset={currentAsset}
              onOpenRiskModal={() => setRiskModalOpen(true)}
              onOpenBrokerModal={() => setBrokerModalOpen(true)}
              activePositionQuantity={activePositionOnAsset?.quantity}
              activePositionSide={activePositionOnAsset?.side}
            />
          </div>
        </div>
      ) : (
        /* STANDARD DAY TRADE & SCALPING VIEW: Chart + Boleta + Microstructure */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Main Chart (Col 1-8) */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <IntradayCandleChart
              asset={currentAsset}
              activePosition={activePositionOnAsset}
            />

            {/* DOM and Times & Trades Side by Side under chart on wide screens */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[300px]">
              <DepthOfMarketDOM
                ticker={currentAsset.ticker}
                currency={currentAsset.currency}
                currentPrice={currentAsset.price}
                domLevels={domLevels}
              />
              <TimesAndTradesFeed
                ticker={currentAsset.ticker}
                currency={currentAsset.currency}
                trades={tradesFeed}
                brokerRanking={brokerRanking}
              />
            </div>
          </div>

          {/* Right Column: Order Ticket Boleta (Col 9-12) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <OrderTicket
              asset={currentAsset}
              onOpenRiskModal={() => setRiskModalOpen(true)}
              onOpenBrokerModal={() => setBrokerModalOpen(true)}
              activePositionQuantity={activePositionOnAsset?.quantity}
              activePositionSide={activePositionOnAsset?.side}
            />
          </div>
        </div>
      )}

      {/* 3. POSITIONS & DAILY P&L TABLE (Always visible at the bottom) */}
      <PositionsAndPLTable
        positions={positions}
        orders={orders}
        account={account}
        onSelectTicker={(t) => setSelectedTicker(t)}
      />

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
