import React, { useState } from "react";
import { Asset, OrderSide, OrderType, TradingMode } from "../../types/finance";
import { dayTradeService } from "../../services/dayTradeService";
import { formatAssetDisplayPrice } from "../../utils/formatters";
import {
  TrendingUp,
  TrendingDown,
  RotateCcw,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Key,
  Flame,
  ArrowRightLeft,
  XCircle,
} from "lucide-react";

interface OrderTicketProps {
  asset: Asset;
  onOpenRiskModal: () => void;
  onOpenBrokerModal: () => void;
  activePositionQuantity?: number;
  activePositionSide?: OrderSide;
}

export const OrderTicket: React.FC<OrderTicketProps> = ({
  asset,
  onOpenRiskModal,
  onOpenBrokerModal,
  activePositionQuantity = 0,
  activePositionSide,
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

  const risk = dayTradeService.getRiskSettings();
  const mode = dayTradeService.getMode();

  // Tick increment based on asset magnitude
  const tickSize = asset.price > 1000 ? 5 : asset.price > 100 ? 0.25 : 0.01;

  // Estimated Bid and Ask spreads
  const spread = tickSize * 2;
  const bidPrice = Number((asset.price - spread / 2).toFixed(2));
  const askPrice = Number((asset.price + spread / 2).toFixed(2));

  // Quick lot presets
  const isMini = asset.ticker.toUpperCase().includes("WIN") || asset.ticker.toUpperCase().includes("WDO");
  const lotPresets = isMini ? [1, 2, 5, 10, 20, 50] : [1, 5, 10, 25, 50, 100];

  const showNotification = (type: "success" | "error", text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleExecuteOrder = (side: OrderSide) => {
    const execPrice = orderType === "MARKET" ? (side === "BUY" ? askPrice : bidPrice) : limitPrice;

    // Calculate Stop Loss & Take Profit absolute prices
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
      showNotification("success", `Posição invertida com sucesso para ${opposingSide === "BUY" ? "COMPRA" : "VENDA"}.`);
    } else {
      showNotification("error", res.message);
    }
  };

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 flex flex-col justify-between shadow-lg">
      <div>
        {/* Top Header: Title & Trading Mode Switcher */}
        <div className="flex items-center justify-between pb-3 border-b border-[#21262d] mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#58a6ff]/15 text-[#58a6ff]">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#e6edf3] tracking-tight">Boleta de Negociação</h3>
              <p className="text-[11px] text-[#8b949e]">Order Ticket & Execução de Alta Velocidade</p>
            </div>
          </div>

          {/* Mode Switcher Segmented Control */}
          <div className="flex items-center bg-[#0e1117] border border-[#30363d] rounded-xl p-1 gap-1">
            <button
              type="button"
              onClick={() => dayTradeService.setMode("SIMULATED")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
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
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                mode === "REAL"
                  ? "bg-[#1f6feb] text-white shadow-xs"
                  : "text-[#8b949e] hover:text-[#e6edf3]"
              }`}
              title="Configurar Chaves API / Conexão com Corretora Real"
            >
              <Key className="w-3 h-3 text-[#e3b341]" />
              Conta Real
            </button>
          </div>
        </div>

        {/* Risk Lock Warning Banner if Active */}
        {risk.isLocked && (
          <div className="mb-3 p-2.5 rounded-xl bg-[#ff5252]/15 border border-[#ff5252]/40 text-[#ff5252] flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-[#ff5252]" />
              <span className="font-semibold">{risk.lockedReason || "Trava de Risco Acionada"}</span>
            </div>
            <button
              type="button"
              onClick={onOpenRiskModal}
              className="px-2 py-0.5 rounded bg-[#ff5252]/30 hover:bg-[#ff5252]/50 text-white font-bold text-[10px] cursor-pointer"
            >
              Gerenciar
            </button>
          </div>
        )}

        {/* Selected Asset Mini Banner */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-[#0e1117] border border-[#21262d] mb-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-white">{asset.ticker}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#21262d] text-[#8b949e]">
              {asset.currency}
            </span>
            {activePositionQuantity > 0 && (
              <span
                className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                  activePositionSide === "BUY"
                    ? "bg-[#00c853]/20 text-[#00c853] border border-[#00c853]/40"
                    : "bg-[#ff5252]/20 text-[#ff5252] border border-[#ff5252]/40"
                }`}
              >
                Posicionado: {activePositionQuantity} {activePositionSide === "BUY" ? "C" : "V"}
              </span>
            )}
          </div>
          <div className="text-right">
            <span className="font-mono font-bold text-sm text-[#e6edf3]">
              {formatAssetDisplayPrice(asset.price, asset.currency)}
            </span>
            <span
              className={`block text-[10px] font-mono font-bold ${
                asset.changePercent >= 0 ? "text-[#00c853]" : "text-[#ff5252]"
              }`}
            >
              {asset.changePercent >= 0 ? "+" : ""}
              {asset.changePercent.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Order Type Selector */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-[#0e1117] rounded-xl border border-[#21262d] mb-3">
          {(["MARKET", "LIMIT", "STOP"] as OrderType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setOrderType(t)}
              className={`py-1 text-center text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                orderType === t
                  ? "bg-[#21262d] text-[#58a6ff] border border-[#58a6ff]/40 shadow-xs"
                  : "text-[#8b949e] hover:text-[#e6edf3]"
              }`}
            >
              {t === "MARKET" ? "A Mercado" : t === "LIMIT" ? "Limitada" : "Ordem Stop"}
            </button>
          ))}
        </div>

        {/* Quantity Controls */}
        <div className="mb-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#8b949e] font-medium">Quantidade (Lotes / Contratos):</span>
            <span className="text-white font-mono font-bold">{quantity}x</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="px-3 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-white font-bold text-sm cursor-pointer"
            >
              -
            </button>
            <input
              type="number"
              min={1}
              max={risk.maxQuantityPerOrder || 100}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="flex-1 py-1.5 px-3 rounded-lg bg-[#0e1117] border border-[#30363d] text-center font-mono font-bold text-white text-sm focus:outline-none focus:border-[#58a6ff]"
            />
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(risk.maxQuantityPerOrder, q + 1))}
              className="px-3 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-white font-bold text-sm cursor-pointer"
            >
              +
            </button>
          </div>

          {/* Quick presets */}
          <div className="flex items-center gap-1 pt-0.5">
            {lotPresets.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setQuantity(l)}
                className={`flex-1 py-1 rounded text-[11px] font-mono font-semibold border transition-colors cursor-pointer ${
                  quantity === l
                    ? "bg-[#58a6ff]/20 text-[#58a6ff] border-[#58a6ff]/50"
                    : "bg-[#0e1117] text-[#8b949e] hover:text-white border-[#21262d]"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Limit Price Input (if not MARKET) */}
        {orderType !== "MARKET" && (
          <div className="mb-3 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#8b949e]">Preço da Ordem:</span>
              <span className="text-[#58a6ff] font-mono font-bold">
                {formatAssetDisplayPrice(limitPrice, asset.currency)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setLimitPrice((p) => Number((p - tickSize).toFixed(2)))}
                className="px-2.5 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-white font-bold text-xs cursor-pointer"
              >
                -{tickSize}
              </button>
              <input
                type="number"
                step={tickSize}
                value={limitPrice}
                onChange={(e) => setLimitPrice(parseFloat(e.target.value) || asset.price)}
                className="flex-1 py-1.5 px-3 rounded-lg bg-[#0e1117] border border-[#30363d] text-center font-mono font-bold text-white text-xs focus:outline-none focus:border-[#58a6ff]"
              />
              <button
                type="button"
                onClick={() => setLimitPrice((p) => Number((p + tickSize).toFixed(2)))}
                className="px-2.5 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-white font-bold text-xs cursor-pointer"
              >
                +{tickSize}
              </button>
            </div>
          </div>
        )}

        {/* OCO Protection: Automatic Stop Loss and Take Profit */}
        <div className="p-2.5 rounded-xl bg-[#0e1117] border border-[#21262d] mb-4 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-[#8b949e] font-semibold uppercase tracking-wider">
            <span>Proteção Automática (OCO)</span>
            <button
              type="button"
              onClick={onOpenRiskModal}
              className="text-[#58a6ff] hover:underline normal-case text-[11px] font-medium cursor-pointer"
            >
              Travas de Risco
            </button>
          </div>

          {/* Stop Loss row */}
          <div className="flex items-center justify-between gap-2 text-xs">
            <label className="flex items-center gap-1.5 text-[#ff5252] font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={enableStopLoss}
                onChange={(e) => setEnableStopLoss(e.target.checked)}
                className="accent-[#ff5252] rounded"
              />
              <span>Stop Loss:</span>
            </label>
            <div className="flex items-center gap-1 w-32">
              <input
                type="number"
                disabled={!enableStopLoss}
                value={stopLossOffset}
                onChange={(e) => setStopLossOffset(Math.max(0.01, parseFloat(e.target.value) || 0))}
                className="w-full py-0.5 px-2 rounded bg-[#161b22] border border-[#30363d] text-right font-mono text-xs text-[#ff5252] focus:outline-none disabled:opacity-40"
              />
              <span className="text-[10px] text-[#8b949e]">{asset.price > 1000 ? "pts" : asset.currency}</span>
            </div>
          </div>

          {/* Take Profit row */}
          <div className="flex items-center justify-between gap-2 text-xs">
            <label className="flex items-center gap-1.5 text-[#00c853] font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={enableTakeProfit}
                onChange={(e) => setEnableTakeProfit(e.target.checked)}
                className="accent-[#00c853] rounded"
              />
              <span>Take Profit:</span>
            </label>
            <div className="flex items-center gap-1 w-32">
              <input
                type="number"
                disabled={!enableTakeProfit}
                value={takeProfitOffset}
                onChange={(e) => setTakeProfitOffset(Math.max(0.01, parseFloat(e.target.value) || 0))}
                className="w-full py-0.5 px-2 rounded bg-[#161b22] border border-[#30363d] text-right font-mono text-xs text-[#00c853] focus:outline-none disabled:opacity-40"
              />
              <span className="text-[10px] text-[#8b949e]">{asset.price > 1000 ? "pts" : asset.currency}</span>
            </div>
          </div>
        </div>

        {/* Execution Feedback Notification */}
        {feedback && (
          <div
            className={`mb-3 p-2.5 rounded-xl text-xs flex items-center gap-2 animate-fade-in ${
              feedback.type === "success"
                ? "bg-[#00c853]/15 border border-[#00c853]/40 text-[#00c853]"
                : "bg-[#ff5252]/15 border border-[#ff5252]/40 text-[#ff5252]"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#00c853]" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-[#ff5252]" />
            )}
            <span className="font-medium">{feedback.text}</span>
          </div>
        )}

        {/* PRIMARY PRO BUY AND SELL BUTTONS */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          {/* BUY MARKET BUTTON */}
          <button
            type="button"
            id="daytrade-btn-buy"
            disabled={risk.isLocked}
            onClick={() => handleExecuteOrder("BUY")}
            className="py-3 px-3 rounded-xl bg-gradient-to-b from-[#2ea043] to-[#238636] hover:from-[#3fb950] hover:to-[#2ea043] active:scale-[0.98] text-white font-bold transition-all flex flex-col items-center justify-center shadow-lg shadow-[#238636]/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-1 text-sm tracking-wide">
              <TrendingUp className="w-4 h-4" />
              <span>COMPRA</span>
            </div>
            <span className="text-[11px] font-mono opacity-90 font-medium">
              Ask: {formatAssetDisplayPrice(askPrice, asset.currency)}
            </span>
          </button>

          {/* SELL MARKET BUTTON */}
          <button
            type="button"
            id="daytrade-btn-sell"
            disabled={risk.isLocked}
            onClick={() => handleExecuteOrder("SELL")}
            className="py-3 px-3 rounded-xl bg-gradient-to-b from-[#f85149] to-[#da3633] hover:from-[#ff6a60] hover:to-[#f85149] active:scale-[0.98] text-white font-bold transition-all flex flex-col items-center justify-center shadow-lg shadow-[#da3633]/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-1 text-sm tracking-wide">
              <TrendingDown className="w-4 h-4" />
              <span>VENDA</span>
            </div>
            <span className="text-[11px] font-mono opacity-90 font-medium">
              Bid: {formatAssetDisplayPrice(bidPrice, asset.currency)}
            </span>
          </button>
        </div>

        {/* SECONDARY ACTION BUTTONS: ZERAR / INVERTER */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            id="daytrade-btn-flatten"
            onClick={handleFlatten}
            className="py-2 px-3 rounded-xl bg-[#21262d] hover:bg-[#d29922]/20 hover:text-[#d29922] border border-[#30363d] hover:border-[#d29922]/50 text-[#e6edf3] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            title="Fechar posição atual deste ativo a mercado imediatamente"
          >
            <XCircle className="w-3.5 h-3.5 text-[#d29922]" />
            <span>Zerar Posição</span>
          </button>

          <button
            type="button"
            id="daytrade-btn-reverse"
            onClick={handleReverse}
            className="py-2 px-3 rounded-xl bg-[#21262d] hover:bg-[#1f6feb]/20 hover:text-[#58a6ff] border border-[#30363d] hover:border-[#58a6ff]/50 text-[#e6edf3] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            title="Inverter a mão da posição ativa (se comprado, vira vendido e vice-versa)"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-[#58a6ff]" />
            <span>Inverter Mão</span>
          </button>
        </div>
      </div>

      {/* Footer Info: Estimated Financial Value */}
      <div className="pt-3 mt-3 border-t border-[#21262d] flex items-center justify-between text-[11px] text-[#8b949e]">
        <span>Valor Estimado da Ordem:</span>
        <span className="font-mono font-semibold text-[#e6edf3]">
          {formatAssetDisplayPrice(asset.price * quantity, asset.currency)}
        </span>
      </div>
    </div>
  );
};
