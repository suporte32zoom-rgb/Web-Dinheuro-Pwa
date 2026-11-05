import React, { useState } from "react";
import { DayTradeRiskSettings } from "../../types/finance";
import { dayTradeService } from "../../services/dayTradeService";
import {
  ShieldAlert,
  ShieldCheck,
  X,
  Lock,
  Unlock,
  AlertTriangle,
  Clock,
  Target,
  Zap,
} from "lucide-react";

interface RiskManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRisk: DayTradeRiskSettings;
}

export const RiskManagementModal: React.FC<RiskManagementModalProps> = ({
  isOpen,
  onClose,
  currentRisk,
}) => {
  const [dailyGainTarget, setDailyGainTarget] = useState(currentRisk.dailyGainTarget);
  const [dailyLossLimit, setDailyLossLimit] = useState(currentRisk.dailyLossLimit);
  const [maxLossPerTrade, setMaxLossPerTrade] = useState(currentRisk.maxLossPerTrade);
  const [maxQuantityPerOrder, setMaxQuantityPerOrder] = useState(currentRisk.maxQuantityPerOrder);
  const [autoLockOnLossLimit, setAutoLockOnLossLimit] = useState(currentRisk.autoLockOnLossLimit);
  const [autoLockOnGainTarget, setAutoLockOnGainTarget] = useState(currentRisk.autoLockOnGainTarget);
  const [cutoffTime, setCutoffTime] = useState(currentRisk.cutoffTime || "17:50");

  if (!isOpen) return null;

  const handleSave = () => {
    dayTradeService.updateRiskSettings({
      dailyGainTarget,
      dailyLossLimit,
      maxLossPerTrade,
      maxQuantityPerOrder,
      autoLockOnLossLimit,
      autoLockOnGainTarget,
      cutoffTime,
    });
    onClose();
  };

  const handleUnlock = () => {
    dayTradeService.unlockRisk();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#21262d] mb-4">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl ${
                currentRisk.isLocked
                  ? "bg-[#ff5252]/20 text-[#ff5252]"
                  : "bg-[#00c853]/20 text-[#00c853]"
              }`}
            >
              {currentRisk.isLocked ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Gerenciador de Risco Operacional
              </h3>
              <p className="text-xs text-[#8b949e]">
                Travas de segurança institucionais e limites de stop
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Banner */}
        {currentRisk.isLocked ? (
          <div className="p-3 rounded-xl bg-[#ff5252]/15 border border-[#ff5252]/40 text-[#ff5252] mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 shrink-0" />
              <div>
                <span className="font-bold text-xs block">Bloqueio Automático Ativo</span>
                <span className="text-[11px] text-[#ff8080]">
                  {currentRisk.lockedReason || "Limite operacional atingido. Envio de ordens suspenso."}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleUnlock}
              className="px-3 py-1.5 rounded-lg bg-[#ff5252] hover:bg-[#ff6a60] text-white text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-sm"
            >
              Desbloquear
            </button>
          </div>
        ) : (
          <div className="p-2.5 rounded-xl bg-[#00c853]/10 border border-[#00c853]/30 text-[#00c853] mb-4 flex items-center gap-2 text-xs">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span className="font-medium">
              Travas de risco ativas e monitorando seu pregão em tempo real.
            </span>
          </div>
        )}

        {/* Parameters Form */}
        <div className="space-y-3.5 mb-5">
          {/* Daily Loss Limit */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <label className="text-[#e6edf3] font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-[#ff5252]" />
                Limite de Loss Diário (Stop do Dia):
              </label>
              <span className="text-[#ff5252] font-mono font-bold">
                R$ {dailyLossLimit.toFixed(2)}
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#8b949e]">R$</span>
              <input
                type="number"
                min={0}
                step={50}
                value={dailyLossLimit}
                onChange={(e) => setDailyLossLimit(parseFloat(e.target.value) || 0)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0e1117] border border-[#30363d] text-white font-mono text-sm focus:outline-none focus:border-[#58a6ff]"
              />
            </div>
          </div>

          {/* Daily Gain Target */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <label className="text-[#e6edf3] font-semibold flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-[#00c853]" />
                Meta de Gain Diária (Alvo de Lucro):
              </label>
              <span className="text-[#00c853] font-mono font-bold">
                R$ {dailyGainTarget.toFixed(2)}
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#8b949e]">R$</span>
              <input
                type="number"
                min={0}
                step={100}
                value={dailyGainTarget}
                onChange={(e) => setDailyGainTarget(parseFloat(e.target.value) || 0)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0e1117] border border-[#30363d] text-white font-mono text-sm focus:outline-none focus:border-[#58a6ff]"
              />
            </div>
          </div>

          {/* Max Loss Per Trade & Max Lots */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#8b949e] font-medium block mb-1">
                Stop Máx / Operação:
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#8b949e]">R$</span>
                <input
                  type="number"
                  min={0}
                  value={maxLossPerTrade}
                  onChange={(e) => setMaxLossPerTrade(parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-2 py-1.5 rounded-lg bg-[#0e1117] border border-[#30363d] text-white font-mono text-xs focus:outline-none focus:border-[#58a6ff]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-[#8b949e] font-medium block mb-1">
                Lotes Máximos / Ordem:
              </label>
              <input
                type="number"
                min={1}
                max={500}
                value={maxQuantityPerOrder}
                onChange={(e) => setMaxQuantityPerOrder(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-1.5 rounded-lg bg-[#0e1117] border border-[#30363d] text-white font-mono text-xs focus:outline-none focus:border-[#58a6ff]"
              />
            </div>
          </div>

          {/* Automatic Lock Checkboxes */}
          <div className="pt-2 border-t border-[#21262d] space-y-2">
            <label className="flex items-center gap-2 text-xs text-[#e6edf3] cursor-pointer">
              <input
                type="checkbox"
                checked={autoLockOnLossLimit}
                onChange={(e) => setAutoLockOnLossLimit(e.target.checked)}
                className="accent-[#58a6ff] rounded"
              />
              <span>Bloquear envio de novas ordens automaticamente ao atingir o Limite de Loss</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-[#e6edf3] cursor-pointer">
              <input
                type="checkbox"
                checked={autoLockOnGainTarget}
                onChange={(e) => setAutoLockOnGainTarget(e.target.checked)}
                className="accent-[#58a6ff] rounded"
              />
              <span>Travar lucro do dia (bloquear novas ordens) ao atingir a Meta de Gain</span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#21262d]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-[#e6edf3] text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-bold transition-all cursor-pointer shadow-md"
          >
            Salvar Travas de Risco
          </button>
        </div>
      </div>
    </div>
  );
};
