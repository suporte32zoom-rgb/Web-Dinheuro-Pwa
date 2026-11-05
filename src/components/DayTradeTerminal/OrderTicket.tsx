import React, { useState, useEffect } from "react";
import { Asset, OrderSide, OrderType } from "../../types/finance";
import { dayTradeService } from "../../services/dayTradeService";
import { formatAssetDisplayPrice } from "../../utils/formatters";
import {
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Key,
  ArrowRightLeft,
  XCircle,
} from "lucide-react";

interface OrderTicketProps {
  asset: Asset;
  onOpenRiskModal: () => void;
  onOpenBrokerModal: () => void;
  activePositionQuantity?: number;
  activePositionSide?: OrderSide;
  externalPrice?: number;
}

export const OrderTicket: React.FC<OrderTicketProps> = ({
  asset,
  onOpenRiskModal,
  onOpenBrokerModal,
  activePositionQuantity = 0,
  activePositionSide,
  externalPrice,
}) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [orderType, setOrderType] = useState<OrderType>("MARKET");
  const [limitPrice, setLimitPrice] = useState<number>(asset.price);
  const [enableStopLoss, setEnableStopLoss] = useState<boolean>(true);
  const [stopLossOffset, setStopLossOffset] = useState<number>(
    asset.price > 1000 ? 150 : asset.price > 100 ? 5 : 0.4
  );
  const [enableTakeProfit, setEnableTakeProfit] = useState<boolean>(true);
  const [takeProfitOffset, setTakeProfitOffset] = useState<number>(
    asset.price > 1000 ? 300 : asset.price > 100 ? 10 : 0.8
  );
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Sync external price clicked from DOM ladder
  useEffect(() => {
    if (externalPrice && externalPrice > 0) {
      setLimitPrice(externalPrice);
      setOrderType("LIMIT");
    }
  }, [externalPrice]);

  const risk = dayTradeService.getRiskSettings();
  const mode = dayTradeService.getMode();

  // Tick increment based on asset magnitude
  const tickSize = asset.price > 1000 ? 5 : asset.price > 100 ? 0.25 : 0.01;
  const spread = tickSize * 2;
  const bidPrice = Number((asset.price - spread / 2).toFixed(2));
  const askPrice = Number((asset.price + spread / 2).toFixed(2));

  // Quick lot presets
  const isMini = asset.ticker.toUpperCase().includes("WIN") || asset.ticker.toUpperCase().includes("WDO");
  const lotPresets = isMini ? [1, 2, 5, 10, 20, 50] : [1, 5, 10, 25, 50, 100];

  const showNotification = (type: "success" | "error", text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleExecuteOrder = (side: OrderSide) => {
    const execPrice = orderType === "MARKET" ? (side === "BUY" ? askPrice : bidPrice) : limitPrice;

    let slPrice: number | undefined;
    let tpPrice: number | undefined;

    if (enableStopLoss && stopLossOffset > 0) {
      slPrice = side === "BUY" ? execPrice - stopLossOffset : execPrice + stopLossOffset;
      slPrice = Number(slPrice.toFixed(2));
    }
    if (enableTakeProfit && takeProfitOffset > 0) {
      tpPrice = side === "BUY" ? execPrice + takeProfitOffset : execPrice - takeProfitOffset;
      tpPrice = Number(tpPrice.toFixed(2));
    }

    const res = dayTradeService.sendOrder({
      ticker: asset.ticker,
      name: asset.name,
      side,
      type: orderType,
      quantity,
      price: execPrice,
      stopLoss: slPrice,
      takeProfit: tpPrice,
      currency: asset.currency,
    });

    if (res.success) {
      showNotification("success", res.message);
    } else {
      showNotification("error", res.message);
    }
  };

  const handleFlatten = () => {
    const positions = dayTradeService.getPositions().filter(
      (p) => p.ticker.toUpperCase() === asset.ticker.toUpperCase()
    );
    if (positions.length === 0) {
      showNotification("error", `Nenhuma posição aberta em ${asset.ticker} para zerar.`);
      return;
    }
    positions.forEach((p) => {
      dayTradeService.flattenPosition(p.id, asset.price, "Zeragem a Mercado");
    });
    showNotification("success", `Posição em ${asset.ticker} zerada a mercado.`);
  };

  const handleReverse = () => {
    if (!activePositionSide || activePositionQuantity <= 0) {
      showNotification("error", `Nenhuma posição ativa em ${asset.ticker} para inverter.`);
      return;
    }
    const opposingSide: OrderSide = activePositionSide === "BUY" ? "SELL" : "BUY";
    const reverseQty = activePositionQuantity * 2;
    const res = dayTradeService.sendOrder({
      ticker: asset.ticker,
      name: asset.name,
      side: opposingSide,
      type: "MARKET",
      quantity: reverseQty,
      price: opposingSide === "BUY" ? askPrice : bidPrice,
      currency: asset.currency,
    });
    if (res.success) {
      showNotification("success", `Posição invertida para ${opposingSide === "BUY" ? "COMPRA" : "VENDA"}.`);
    } else {
      showNotification("error", res.message);
    }
  };

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-2.5 flex flex-col justify-between shadow-lg select-none text-xs shrink-0">
      <div>
        {/* Top Header: Title & Trading Mode Switcher */}
        <div className="flex items-center justify-between pb-1.5 border-b border-[#21262d] mb-2">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-xs text-white tracking-tight">{asset.ticker}</span>
            {activePositionQuantity > 0 && (
              <span
                className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded ${
                  activePositionSide === "BUY"
                    ? "bg-[#00c853]/20 text-[#00c853] border border-[#00c853]/40"
                    : "bg-[#ff5252]/20 text-[#ff5252] border border-[#ff5252]/40"
                }`}
              >
                {activePositionQuantity}x {activePositionSide === "BUY" ? "COMPRADO" : "VENDIDO"}
              </span>
            )}
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center bg-[#0e1117] border border-[#30363d] rounded-md p-0.5 gap-0.5">
            <button
              type="button"
              onClick={() => dayTradeService.setMode("SIMULATED")}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                mode === "SIMULATED"
                  ? "bg-[#238636] text-white shadow-xs"
                  : "text-[#8b949e] hover:text-[#e6edf3]"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#00c853] animate-pulse" />
              Simulador
            </button>
            <button
              type="button"
              onClick={onOpenBrokerModal}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all cursor-pointer flex items-center gap-1 ${
                mode === "REAL"
                  ? "bg-[#1f6feb] text-white shadow-xs"
                  : "text-[#8b949e] hover:text-[#e6edf3]"
              }`}
              title="Conexão com Corretora Real"
            >
              <Key className="w-2.5 h-2.5 text-[#e3b341]" />
              Real
            </button>
          </div>
        </div>

        {/* Risk Lock Banner if active */}
        {risk.isLocked && (
          <div className="mb-2 p-1.5 rounded-lg bg-[#ff5252]/15 border border-[#ff5252]/40 text-[#ff5252] flex items-center justify-between gap-1 text-[11px]">
            <div className="flex items-center gap-1 truncate">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-[#ff5252]" />
              <span className="font-semibold truncate">{risk.lockedReason || "Trava de Risco"}</span>
            </div>
            <button
              type="button"
              onClick={onOpenRiskModal}
              className="px-1.5 py-0.2 rounded bg-[#ff5252]/30 text-white font-bold text-[9.5px] shrink-0"
            >
              Destravar
            </button>
          </div>
        )}

        {/* PRO COMPRA E VENDA A MERCADO (Prominent, Top-Pinned) */}
        <div className="grid grid-cols-2 gap-1.5 mb-2">
          {/* BUY MARKET */}
          <button
            type="button"
            id="daytrade-btn-buy"
            disabled={risk.isLocked}
            onClick={() => handleExecuteOrder("BUY")}
            className="py-2.5 px-2 rounded-lg bg-gradient-to-b from-[#2ea043] to-[#238636] hover:from-[#3fb950] hover:to-[#2ea043] active:scale-[0.98] text-white font-bold transition-all flex flex-col items-center justify-center shadow-md shadow-[#238636]/25 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-1 text-xs tracking-wider uppercase font-black">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>COMPRA MERCADO</span>
            </div>
            <span className="text-[10.5px] font-mono opacity-90 font-medium">
              Ask {formatAssetDisplayPrice(askPrice, asset.currency)}
            </span>
          </button>

          {/* SELL MARKET */}
          <button
            type="button"
            id="daytrade-btn-sell"
            disabled={risk.isLocked}
            onClick={() => handleExecuteOrder("SELL")}
            className="py-2.5 px-2 rounded-lg bg-gradient-to-b from-[#f85149] to-[#da3633] hover:from-[#ff6a60] hover:to-[#f85149] active:scale-[0.98] text-white font-bold transition-all flex flex-col items-center justify-center shadow-md shadow-[#da3633]/25 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-1 text-xs tracking-wider uppercase font-black">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>VENDA MERCADO</span>
            </div>
            <span className="text-[10.5px] font-mono opacity-90 font-medium">
              Bid {formatAssetDisplayPrice(bidPrice, asset.currency)}
            </span>
          </button>
        </div>

        {/* SECONDARY PANIC BUTTONS: ZERAR / INVERTER */}
        <div className="grid grid-cols-2 gap-1.5 mb-2">
          <button
            type="button"
            id="daytrade-btn-flatten"
            onClick={handleFlatten}
            className="py-1.5 px-2 rounded-lg bg-[#21262d] hover:bg-[#d29922]/20 hover:text-[#d29922] border border-[#30363d] hover:border-[#d29922]/50 text-[#e6edf3] text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
            title="Encerrar posição imediatamente a mercado"
          >
            <XCircle className="w-3 h-3 text-[#d29922]" />
            <span>Zerar Posição</span>
          </button>

          <button
            type="button"
            id="daytrade-btn-reverse"
            onClick={handleReverse}
            className="py-1.5 px-2 rounded-lg bg-[#21262d] hover:bg-[#1f6feb]/20 hover:text-[#58a6ff] border border-[#30363d] hover:border-[#58a6ff]/50 text-[#e6edf3] text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
            title="Inverter a mão da posição ativa"
          >
            <ArrowRightLeft className="w-3 h-3 text-[#58a6ff]" />
            <span>Inverter Mão</span>
          </button>
        </div>

        {/* Order Type & Quantity Compact Strip */}
        <div className="grid grid-cols-2 gap-1.5 mb-2">
          {/* Order Type Toggle */}
          <div className="flex bg-[#0e1117] rounded-lg border border-[#21262d] p-0.5">
            {(["MARKET", "LIMIT"] as OrderType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setOrderType(t)}
                className={`flex-1 py-1 text-center text-[10px] font-semibold rounded transition-colors cursor-pointer ${
                  orderType === t
                    ? "bg-[#21262d] text-[#58a6ff] border border-[#58a6ff]/40 shadow-xs"
                    : "text-[#8b949e] hover:text-[#e6edf3]"
                }`}
              >
                {t === "MARKET" ? "Mercado" : "Limite"}
              </button>
            ))}
          </div>

          {/* Quantity Controls */}
          <div className="flex items-center gap-1 bg-[#0e1117] rounded-lg border border-[#30363d] px-1 py-0.5">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-5 h-5 rounded bg-[#21262d] hover:bg-[#30363d] text-white font-bold text-xs flex items-center justify-center cursor-pointer"
            >
              -
            </button>
            <input
              type="number"
              min={1}
              max={risk.maxQuantityPerOrder || 100}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="flex-1 w-full bg-transparent text-center font-mono font-bold text-white text-xs focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(risk.maxQuantityPerOrder, q + 1))}
              className="w-5 h-5 rounded bg-[#21262d] hover:bg-[#30363d] text-white font-bold text-xs flex items-center justify-center cursor-pointer"
            >
              +
            </button>
          </div>
        </div>

        {/* Quick Lot Presets */}
        <div className="flex items-center gap-1 mb-2">
          {lotPresets.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setQuantity(l)}
              className={`flex-1 py-0.5 rounded text-[10px] font-mono font-semibold border transition-colors cursor-pointer ${
                quantity === l
                  ? "bg-[#58a6ff]/20 text-[#58a6ff] border-[#58a6ff]/50"
                  : "bg-[#0e1117] text-[#8b949e] hover:text-white border-[#21262d]"
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Limit Price Input (if LIMIT) */}
        {orderType === "LIMIT" && (
          <div className="mb-2 p-1.5 rounded-lg bg-[#0e1117] border border-[#21262d] flex items-center justify-between gap-1">
            <span className="text-[10px] text-[#8b949e]">Preço Limite:</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setLimitPrice((p) => Number((p - tickSize).toFixed(2)))}
                className="px-1.5 py-0.2 rounded bg-[#21262d] text-white font-mono text-[10px]"
              >
                -{tickSize}
              </button>
              <input
                type="number"
                step={tickSize}
                value={limitPrice}
                onChange={(e) => setLimitPrice(parseFloat(e.target.value) || asset.price)}
                className="w-20 py-0.2 px-1 rounded bg-[#161b22] border border-[#30363d] text-center font-mono font-bold text-[#58a6ff] text-xs focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setLimitPrice((p) => Number((p + tickSize).toFixed(2)))}
                className="px-1.5 py-0.2 rounded bg-[#21262d] text-white font-mono text-[10px]"
              >
                +{tickSize}
              </button>
            </div>
          </div>
        )}

        {/* Compact OCO Protection (Stop Loss & Take Profit) */}
        <div className="p-1.5 rounded-lg bg-[#0e1117] border border-[#21262d] space-y-1 mb-1">
          <div className="flex items-center justify-between text-[9.5px] text-[#8b949e] uppercase font-semibold">
            <span>Travas Automáticas OCO</span>
            <span className="font-mono text-white">Est. {formatAssetDisplayPrice(asset.price * quantity, asset.currency)}</span>
          </div>

          <div className="grid grid-cols-2 gap-1 text-[10.5px]">
            {/* Stop Loss */}
            <div className="flex items-center justify-between gap-1 bg-[#161b22] px-1.5 py-0.5 rounded border border-[#30363d]">
              <label className="flex items-center gap-1 text-[#ff5252] font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableStopLoss}
                  onChange={(e) => setEnableStopLoss(e.target.checked)}
                  className="accent-[#ff5252] w-3 h-3 rounded"
                />
                <span>SL:</span>
              </label>
              <input
                type="number"
                disabled={!enableStopLoss}
                value={stopLossOffset}
                onChange={(e) => setStopLossOffset(Math.max(0.01, parseFloat(e.target.value) || 0))}
                className="w-14 bg-transparent text-right font-mono font-bold text-[#ff5252] text-xs focus:outline-none disabled:opacity-40"
              />
            </div>

            {/* Take Profit */}
            <div className="flex items-center justify-between gap-1 bg-[#161b22] px-1.5 py-0.5 rounded border border-[#30363d]">
              <label className="flex items-center gap-1 text-[#00c853] font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableTakeProfit}
                  onChange={(e) => setEnableTakeProfit(e.target.checked)}
                  className="accent-[#00c853] w-3 h-3 rounded"
                />
                <span>TP:</span>
              </label>
              <input
                type="number"
                disabled={!enableTakeProfit}
                value={takeProfitOffset}
                onChange={(e) => setTakeProfitOffset(Math.max(0.01, parseFloat(e.target.value) || 0))}
                className="w-14 bg-transparent text-right font-mono font-bold text-[#00c853] text-xs focus:outline-none disabled:opacity-40"
              />
            </div>
          </div>
        </div>

        {/* Execution Feedback Notification Toast */}
        {feedback && (
          <div
            className={`mt-1 p-1.5 rounded-lg text-[10.5px] flex items-center gap-1.5 animate-fade-in ${
              feedback.type === "success"
                ? "bg-[#00c853]/15 border border-[#00c853]/40 text-[#00c853]"
                : "bg-[#ff5252]/15 border border-[#ff5252]/40 text-[#ff5252]"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[#00c853]" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-[#ff5252]" />
            )}
            <span className="font-semibold truncate">{feedback.text}</span>
          </div>
        )}
      </div>
    </div>
  );
};
