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
import { OrderTicket } from "./OrderTicket";
import { PositionsAndPLTable } from "./PositionsAndPLTable";
import { DepthOfMarketDOM } from "./DepthOfMarketDOM";
import { TimesAndTradesFeed } from "./TimesAndTradesFeed";
import { RiskManagementModal } from "./RiskManagementModal";
import { BrokerApiModal } from "./BrokerApiModal";
import { IntradayCandleChart } from "./IntradayCandleChart";
import { FixedIncomeAndDerivativesView } from "./FixedIncomeAndDerivativesView";
import {
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
  Key,
  Maximize2,
  TrendingUp,
  TrendingDown,
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
  const [selectedDomPrice, setSelectedDomPrice] = useState<number | undefined>(undefined);
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
    dayTradeService.generateTimesAndTrades(currentAsset.price, 35)
  );

  // Broker ranking derived from trades
  const brokerRanking = useMemo(() => {
    return dayTradeService.getBrokerRanking(tradesFeed);
  }, [tradesFeed]);

  // Live High-Frequency Ticks interval simulation (updates DOM & streaming trades)
  useEffect(() => {
    const timer = setInterval(() => {
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

      setTradesFeed((prev) => [newTrade, ...prev.slice(0, 45)]);
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

  const totalDayPL = account.realizedPLDay + account.unrealizedPL;
  const isPositiveDay = totalDayPL >= 0;

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-[#0a0d12] text-[#e6edf3] select-none p-2 gap-2">
      {/* 1. TOP DENSE CONTROL STRIP (Height ~38px) */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl px-2.5 py-1.5 flex flex-wrap items-center justify-between gap-2 shrink-0 shadow-sm">
        {/* Left: Quick Tickers Carousel */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
          {QUICK_TRADING_TICKERS.map((t) => {
            const isSelected = selectedTicker === t.ticker;
            return (
              <button
                key={t.ticker}
                type="button"
                onClick={() => {
                  setSelectedTicker(t.ticker);
                  setSelectedDomPrice(undefined);
                }}
                className={`px-2 py-0.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? "bg-[#21262d] text-[#58a6ff] border border-[#58a6ff] shadow-xs font-bold"
                    : "bg-[#0e1117] text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d]/60 border border-[#30363d]"
                }`}
              >
                <span>{t.ticker}</span>
                <span className="text-[10px] font-mono opacity-80">
                  {formatAssetDisplayPrice(t.basePrice, t.currency)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Center / Right: Live Ticker Quick Quote + P&L Indicator + Controls */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap ml-auto">
          {/* Active Asset Live Quote */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[#0e1117] border border-[#21262d] font-mono text-xs">
            <span className="font-bold text-white">{currentAsset.ticker}</span>
            <span className="text-white font-bold">{formatAssetDisplayPrice(currentAsset.price, currentAsset.currency)}</span>
            <span
              className={`text-[10.5px] font-bold flex items-center ${
                currentAsset.changePercent >= 0 ? "text-[#00c853]" : "text-[#ff5252]"
              }`}
            >
              {currentAsset.changePercent >= 0 ? <TrendingUp className="w-3 h-3 inline mr-0.5" /> : <TrendingDown className="w-3 h-3 inline mr-0.5" />}
              {currentAsset.changePercent >= 0 ? "+" : ""}{currentAsset.changePercent.toFixed(2)}%
            </span>
          </div>

          {/* Quick Account P&L */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[#0e1117] border border-[#21262d] font-mono text-xs">
            <span className="text-[10px] text-[#8b949e] uppercase font-sans font-semibold">P&L Dia:</span>
            <span className={`font-bold ${isPositiveDay ? "text-[#00c853]" : "text-[#ff5252]"}`}>
              {isPositiveDay ? "+" : ""}R$ {totalDayPL.toFixed(2)}
            </span>
          </div>

          {/* Risk Management Button */}
          <button
            type="button"
            id="btn-daytrade-risk-settings"
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
            <span className="hidden md:inline">{riskSettings.isLocked ? "Trava Ativa" : "Travas de Risco"}</span>
          </button>

          {/* Broker API Modal Trigger */}
          <button
            type="button"
            id="btn-daytrade-broker-api"
            onClick={() => setBrokerModalOpen(true)}
            className="px-2 py-1 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-[#e6edf3] border border-[#30363d] text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 shadow-xs"
            title="Conectar Conta Real via API DMA2"
          >
            <Key className="w-3.5 h-3.5 text-[#e3b341]" />
            <span className="hidden sm:inline">API Corretora</span>
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
            title="Redefinir Conta Simulada (Paper Trading)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. MAIN COCKPIT: SINGLE-SCREEN RESPONSIVE GRID (ZERO SCROLL) */}
      {activeTab === "Fluxo & Tape Reading" ? (
        /* FLUXO & TAPE READING WORKSPACE: DOM (Col 1-4) + Tape & Players (Col 5-9) + Boleta & Mini Chart (Col 10-12) */
        <div className="flex-1 grid grid-cols-12 gap-2 overflow-hidden min-h-0">
          {/* Column 1: Full Height DOM Ladder (4 cols) */}
          <div className="col-span-12 lg:col-span-4 flex flex-col h-full overflow-hidden min-h-0">
            <DepthOfMarketDOM
              ticker={currentAsset.ticker}
              currency={currentAsset.currency}
              currentPrice={currentAsset.price}
              domLevels={domLevels}
              onSelectPriceLevel={(price) => setSelectedDomPrice(price)}
              selectedPrice={selectedDomPrice}
            />
          </div>

          {/* Column 2: Full Height Times & Trades Feed + Broker Ranking (5 cols) */}
          <div className="col-span-12 lg:col-span-5 flex flex-col h-full overflow-hidden min-h-0">
            <TimesAndTradesFeed
              ticker={currentAsset.ticker}
              currency={currentAsset.currency}
              trades={tradesFeed}
              brokerRanking={brokerRanking}
            />
          </div>

          {/* Column 3: Order Ticket (Top) + Positions / Mini Chart (Bottom) (3 cols) */}
          <div className="col-span-12 lg:col-span-3 flex flex-col gap-2 h-full overflow-hidden min-h-0">
            <OrderTicket
              asset={currentAsset}
              onOpenRiskModal={() => setRiskModalOpen(true)}
              onOpenBrokerModal={() => setBrokerModalOpen(true)}
              activePositionQuantity={activePositionOnAsset?.quantity}
              activePositionSide={activePositionOnAsset?.side}
              externalPrice={selectedDomPrice}
            />

            <div className="flex-1 overflow-hidden min-h-0">
              <PositionsAndPLTable
                positions={positions}
                orders={orders}
                account={account}
                onSelectTicker={(t) => setSelectedTicker(t)}
              />
            </div>
          </div>
        </div>
      ) : (
        /* STANDARD DAY TRADE & SCALPING WORKSPACE: 3 COLUMNS SIDE-BY-SIDE */
        <div className="flex-1 grid grid-cols-12 gap-2 overflow-hidden min-h-0">
          {/* Column 1 (Left): 6 cols -> Chart (top ~58%) + Positions Table (bottom ~42%) */}
          <div className="col-span-12 lg:col-span-6 flex flex-col gap-2 h-full overflow-hidden min-h-0">
            {/* Chart Area */}
            <div className="flex-[3] min-h-[220px] overflow-hidden">
              <IntradayCandleChart
                asset={currentAsset}
                activePosition={activePositionOnAsset}
              />
            </div>

            {/* Positions & Daily P&L Table */}
            <div className="flex-[2] min-h-[140px] overflow-hidden">
              <PositionsAndPLTable
                positions={positions}
                orders={orders}
                account={account}
                onSelectTicker={(t) => setSelectedTicker(t)}
              />
            </div>
          </div>

          {/* Column 2 (Center): 3 cols -> Full Height Book de Ofertas (DOM Ladder) */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3 flex flex-col h-full overflow-hidden min-h-0">
            <DepthOfMarketDOM
              ticker={currentAsset.ticker}
              currency={currentAsset.currency}
              currentPrice={currentAsset.price}
              domLevels={domLevels}
              onSelectPriceLevel={(price) => setSelectedDomPrice(price)}
              selectedPrice={selectedDomPrice}
            />
          </div>

          {/* Column 3 (Right): 3 cols -> Order Ticket Boleta (top) + Times & Trades (bottom) */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3 flex flex-col gap-2 h-full overflow-hidden min-h-0">
            {/* Fixed Execution Boleta at the top */}
            <OrderTicket
              asset={currentAsset}
              onOpenRiskModal={() => setRiskModalOpen(true)}
              onOpenBrokerModal={() => setBrokerModalOpen(true)}
              activePositionQuantity={activePositionOnAsset?.quantity}
              activePositionSide={activePositionOnAsset?.side}
              externalPrice={selectedDomPrice}
            />

            {/* Times & Trades Fita at the bottom */}
            <div className="flex-1 min-h-[150px] overflow-hidden">
              <TimesAndTradesFeed
                ticker={currentAsset.ticker}
                currency={currentAsset.currency}
                trades={tradesFeed}
                brokerRanking={brokerRanking}
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. MODALS */}
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
