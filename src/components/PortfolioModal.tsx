import React, { useState } from "react";
import { PortfolioPosition, Asset } from "../types/finance";
import { formatCurrencyBRL, formatAssetDisplayPrice } from "../utils/formatters";
import {
  Briefcase,
  X,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
} from "lucide-react";

interface PortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  positions: PortfolioPosition[];
  onAddPosition: (position: Omit<PortfolioPosition, "id">) => void;
  onRemovePosition: (id: string) => void;
  onSelectAsset: (asset: Asset) => void;
  liveAssets?: Asset[];
}

export const PortfolioModal: React.FC<PortfolioModalProps> = ({
  isOpen,
  onClose,
  positions,
  onAddPosition,
  onRemovePosition,
  onSelectAsset,
  liveAssets = [],
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState(liveAssets[0]?.id || "petr4");
  const [quantity, setQuantity] = useState("100");
  const [buyPrice, setBuyPrice] = useState(
    (liveAssets[0]?.price || 0).toString()
  );

  if (!isOpen) return null;

  // Calculate totals strictly with live quotes (Single Source of Truth)
  const enrichedPositions = positions.map((pos) => {
    const liveAsset = liveAssets.find(
      (a) => a.id === pos.assetId || a.ticker.toUpperCase() === pos.ticker.toUpperCase()
    );
    const curPrice = liveAsset && liveAsset.price > 0 ? liveAsset.price : pos.avgBuyPrice;
    const totalCost = pos.quantity * pos.avgBuyPrice;
    const currentValue = pos.quantity * curPrice;
    const profitLoss = currentValue - totalCost;
    const profitLossPct = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;

    return {
      ...pos,
      currentPrice: curPrice,
      totalCost,
      currentValue,
      profitLoss,
      profitLossPct,
      liveAsset,
    };
  });

  // Taxas de câmbio para consolidação patrimonial em Reais (BRL)
  const usdBrlRate = liveAssets.find((a) => a.id === "usd-brl")?.price || 5.41;
  const eurBrlRate = liveAssets.find((a) => a.id === "eur-brl")?.price || 6.03;

  const totalPortfolioValue = enrichedPositions.reduce((acc, p) => {
    const curr = (p.liveAsset?.currency || "BRL").toUpperCase();
    const rate = curr === "USD" ? usdBrlRate : curr === "EUR" ? eurBrlRate : 1.0;
    return acc + p.currentValue * rate;
  }, 0);

  const totalPortfolioCost = enrichedPositions.reduce((acc, p) => {
    const curr = (p.liveAsset?.currency || "BRL").toUpperCase();
    const rate = curr === "USD" ? usdBrlRate : curr === "EUR" ? eurBrlRate : 1.0;
    return acc + p.totalCost * rate;
  }, 0);

  const totalPL = totalPortfolioValue - totalPortfolioCost;
  const totalPLPct = totalPortfolioCost > 0 ? (totalPL / totalPortfolioCost) * 100 : 0;

  const handleAssetChange = (assetId: string) => {
    setSelectedAssetId(assetId);
    const found = liveAssets.find((a) => a.id === assetId);
    if (found && found.price > 0) {
      setBuyPrice(found.price.toString());
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = liveAssets.find((a) => a.id === selectedAssetId);
    if (!found) return;

    onAddPosition({
      assetId: found.id,
      ticker: found.ticker,
      name: found.name,
      quantity: Number(quantity),
      avgBuyPrice: Number(buyPrice) || found.price,
      purchaseDate: new Date().toISOString().split("T")[0],
    });

    setShowAddForm(false);
    setQuantity("100");
  };

  const selectedAsset = liveAssets.find((a) => a.id === selectedAssetId);
  const selectedCurrencySymbol =
    selectedAsset?.currency === "USD"
      ? "US$"
      : selectedAsset?.currency === "EUR"
      ? "€"
      : selectedAsset?.currency === "GBP"
      ? "£"
      : "R$";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#21262d] flex items-center justify-between bg-[#161b22]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#1f6feb]/20 text-[#58a6ff]">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#e6edf3]">
                  Meu Portfólio de Investimentos
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#00c853]/15 text-[#00c853] font-bold border border-[#00c853]/30">
                  AO VIVO
                </span>
              </div>
              <p className="text-xs text-[#8b949e]">
                Gestão e acompanhamento de carteira avaliada com cotações em tempo real
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Portfolio Summary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-[#0e1117] border-b border-[#21262d]">
          <div className="p-3 rounded-xl bg-[#161b22] border border-[#30363d]">
            <span className="text-[11px] text-[#8b949e] font-medium">Patrimônio Consolidado</span>
            <div className="text-xl font-bold font-mono text-white mt-1">
              {formatCurrencyBRL(totalPortfolioValue)}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#161b22] border border-[#30363d]">
            <span className="text-[11px] text-[#8b949e] font-medium">Custo Total Aplicado</span>
            <div className="text-lg font-bold font-mono text-[#8b949e] mt-1">
              {formatCurrencyBRL(totalPortfolioCost)}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#161b22] border border-[#30363d]">
            <span className="text-[11px] text-[#8b949e] font-medium">Retorno Total (P&L)</span>
            <div
              className={`text-lg font-bold font-mono flex items-center gap-1 mt-1 ${
                totalPL >= 0 ? "text-[#00c853]" : "text-[#ff5252]"
              }`}
            >
              {totalPL >= 0 ? <TrendingUp className="w-4 h-4 shrink-0" /> : <TrendingDown className="w-4 h-4 shrink-0" />}
              <span>{formatCurrencyBRL(totalPL)}</span>
              <span className="text-xs">({totalPLPct >= 0 ? "+" : ""}{totalPLPct.toFixed(2)}%)</span>
            </div>
          </div>
        </div>

        {/* Action button to add position */}
        <div className="p-4 bg-[#161b22] flex items-center justify-between border-b border-[#21262d]">
          <span className="text-xs font-semibold text-[#e6edf3]">
            Posições Abertas ({positions.length})
          </span>
          <button
            onClick={() => {
              if (liveAssets.length > 0 && (!buyPrice || buyPrice === "0")) {
                const f = liveAssets[0];
                setSelectedAssetId(f.id);
                setBuyPrice(f.price.toString());
              }
              setShowAddForm(!showAddForm);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar Ativo</span>
          </button>
        </div>

        {/* Add Position Form */}
        {showAddForm && (
          <form
            onSubmit={handleAddSubmit}
            className="p-4 bg-[#0e1117] border-b border-[#30363d] space-y-3 animate-in slide-in-from-top-2 duration-150"
          >
            <h4 className="text-xs font-bold text-[#58a6ff] uppercase tracking-wide">
              Registrar Compra de Ativo
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-[#8b949e] mb-1">Selecionar Ativo</label>
                <select
                  value={selectedAssetId}
                  onChange={(e) => handleAssetChange(e.target.value)}
                  className="w-full bg-[#161b22] border border-[#30363d] text-xs text-[#e6edf3] p-2 rounded-xl focus:outline-none"
                >
                  {liveAssets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.ticker} - {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-[#8b949e] mb-1">Quantidade</label>
                <input
                  type="number"
                  step="any"
                  min="0.00000001"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full bg-[#161b22] border border-[#30363d] text-xs text-[#e6edf3] p-2 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#8b949e] mb-1">
                  Preço Médio de Compra ({selectedCurrencySymbol})
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.0001"
                  required
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(e.target.value)}
                  className="w-full bg-[#161b22] border border-[#30363d] text-xs text-[#e6edf3] p-2 rounded-xl focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 rounded-xl text-xs text-[#8b949e] hover:bg-[#21262d] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-[#1f6feb] hover:bg-[#388bfd] text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                Salvar Posição
              </button>
            </div>
          </form>
        )}

        {/* Positions List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {enrichedPositions.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#1f6feb]/10 text-[#58a6ff] mx-auto flex items-center justify-center border border-[#1f6feb]/20">
                <PieChart className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#e6edf3]">
                  Nenhuma posição cadastrada na carteira
                </p>
                <p className="text-xs text-[#8b949e] max-w-md mx-auto mt-1 leading-relaxed">
                  Seu portfólio inicia 100% zerado sem ativos pré-selecionados. Clique no botão abaixo para registrar a compra do seu primeiro ativo e acompanhar o patrimônio com cotações ao vivo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1f6feb] hover:bg-[#388bfd] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Adicionar primeiro ativo ao portfólio
              </button>
            </div>
          ) : (
            enrichedPositions.map((pos) => {
              const isProfit = pos.profitLoss >= 0;
              const posCurrency = pos.liveAsset?.currency || "BRL";
              return (
                <div
                  key={pos.id}
                  className="p-3.5 rounded-xl bg-[#0e1117] border border-[#30363d] hover:border-[#58a6ff]/50 transition-colors flex items-center justify-between gap-3"
                >
                  <div
                    onClick={() => {
                      if (pos.liveAsset) {
                        onSelectAsset(pos.liveAsset);
                        onClose();
                      }
                    }}
                    className="cursor-pointer group flex-1"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-[#e6edf3] group-hover:text-[#58a6ff] transition-colors">
                        {pos.ticker}
                      </span>
                      <span className="text-[11px] text-[#8b949e] truncate max-w-[150px]">
                        {pos.name}
                      </span>
                    </div>
                    <div className="text-xs text-[#8b949e] mt-1 flex items-center gap-3">
                      <span>Qtd: <strong className="text-[#e6edf3] font-mono">{pos.quantity}</strong></span>
                      <span>PM: <strong className="text-[#e6edf3] font-mono">{formatAssetDisplayPrice(pos.avgBuyPrice, posCurrency)}</strong></span>
                      <span>Atual: <strong className="text-[#e6edf3] font-mono">{formatAssetDisplayPrice(pos.currentPrice, posCurrency)}</strong></span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-3">
                    <div>
                      <div className="text-xs sm:text-sm font-mono font-bold text-[#e6edf3]">
                        {formatAssetDisplayPrice(pos.currentValue, posCurrency)}
                      </div>
                      <div
                        className={`text-xs font-mono font-semibold flex items-center justify-end gap-1 ${
                          isProfit ? "text-[#00c853]" : "text-[#ff5252]"
                        }`}
                      >
                        {isProfit ? "+" : ""}{formatAssetDisplayPrice(pos.profitLoss, posCurrency)} ({isProfit ? "+" : ""}{pos.profitLossPct.toFixed(2)}%)
                      </div>
                    </div>

                    <button
                      onClick={() => onRemovePosition(pos.id)}
                      className="p-1.5 rounded-lg text-[#8b949e] hover:text-[#ff5252] hover:bg-[#21262d] transition-colors cursor-pointer"
                      title="Excluir posição da carteira"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
