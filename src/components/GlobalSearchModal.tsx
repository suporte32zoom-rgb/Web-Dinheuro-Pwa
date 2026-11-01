import React, { useState, useEffect, useRef } from "react";
import { Asset } from "../types/finance";
import { formatAssetDisplayPrice } from "../utils/formatters";
import { Search, X, TrendingUp, TrendingDown, ArrowRight, CornerDownLeft } from "lucide-react";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAsset: (asset: Asset) => void;
  liveAssets?: Asset[];
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectAsset,
  liveAssets = [],
}) => {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  // Global keydown listeners (Escape to close, Ctrl+K or / to open)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const pool = liveAssets;

  const filteredAssets = query.trim()
    ? pool.filter((a) => {
        const q = query.toLowerCase();
        const sector = (a.sector || "").toLowerCase();
        const tags = (a.tags || []).map((t) => t.toLowerCase());
        return (
          a.ticker.toLowerCase().includes(q) ||
          a.name.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q) ||
          sector.includes(q) ||
          tags.some((t) => t.includes(q))
        );
      })
    : pool.slice(0, 8); // default suggestions

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-[#21262d] flex items-center gap-3 bg-[#161b22]">
          <Search className="w-5 h-5 text-[#58a6ff] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar por código, empresa, moeda (ex: PETR4, IBOV, Dólar, BTC)..."
            className="w-full bg-transparent text-sm sm:text-base text-[#e6edf3] placeholder-[#8b949e] focus:outline-none font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded-md text-[#8b949e] hover:text-[#e6edf3] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-xs bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-[#e6edf3] border border-[#30363d] cursor-pointer"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto divide-y divide-[#21262d]">
          {filteredAssets.length === 0 ? (
            <div className="p-8 text-center text-[#8b949e] text-sm">
              Nenhum ativo financeiro encontrado para <span className="text-[#e6edf3] font-semibold">"{query}"</span>.
            </div>
          ) : (
            filteredAssets.map((asset) => {
              const isPositive = asset.changePercent >= 0;
              return (
                <div
                  key={asset.id}
                  onClick={() => {
                    onSelectAsset(asset);
                    onClose();
                  }}
                  className="p-3.5 sm:p-4 hover:bg-[#21262d]/80 cursor-pointer flex items-center justify-between transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-4">
                    <div className="w-9 h-9 rounded-xl bg-[#0e1117] border border-[#30363d] flex items-center justify-center font-mono font-bold text-xs text-[#58a6ff] shrink-0 group-hover:border-[#58a6ff]">
                      {asset.ticker.slice(0, 4)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs sm:text-sm font-bold text-[#e6edf3] group-hover:text-[#58a6ff] transition-colors">
                          {asset.ticker}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#0e1117] text-[#8b949e] border border-[#30363d] shrink-0 font-medium">
                          {asset.category}
                        </span>
                        {asset.sector && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#58a6ff]/10 text-[#58a6ff] border border-[#58a6ff]/30 shrink-0 font-semibold">
                            {asset.sector}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#8b949e] truncate mt-0.5" title={asset.name}>
                        {asset.name}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-4">
                    <div>
                      <div className="text-xs sm:text-sm font-mono font-bold text-[#e6edf3]">
                        {formatAssetDisplayPrice(asset.price, asset.currency)}
                      </div>
                      <div
                        className={`text-xs font-mono font-semibold flex items-center justify-end gap-0.5 ${
                          isPositive ? "text-[#00c853]" : "text-[#ff5252]"
                        }`}
                      >
                        {isPositive ? (
                          <TrendingUp className="w-3 h-3 shrink-0" />
                        ) : (
                          <TrendingDown className="w-3 h-3 shrink-0" />
                        )}
                        <span>
                          {isPositive ? "+" : ""}
                          {asset.changePercent.toFixed(2)}%
                        </span>
                      </div>
                    </div>

                    <div className="p-1 rounded-lg text-[#8b949e] group-hover:text-[#58a6ff] group-hover:translate-x-0.5 transition-all">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info in Modal */}
        <div className="p-3 bg-[#0e1117] border-t border-[#21262d] flex items-center justify-between text-[11px] text-[#8b949e]">
          <span>
            Pressione <kbd className="px-1.5 py-0.5 bg-[#161b22] border border-[#30363d] rounded text-[#e6edf3]">Enter</kbd> para selecionar
          </span>
          <span className="flex items-center gap-1 font-mono text-[#00c853]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00c853] animate-pulse"></span>
            Cotações em Tempo Real
          </span>
        </div>
      </div>
    </div>
  );
};
