import React, { useState, useEffect } from "react";
import { RegionalTab, AIAccordionTopic, NewsItem, Asset } from "../types/finance";
import { AI_MARKET_TOPICS_BY_REGION } from "../data/mockMarketData";
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  Brain,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Zap,
  Clock,
} from "lucide-react";

interface AIMarketSummaryAccordionProps {
  activeTab: RegionalTab;
  onOpenDeepDive: (topic: AIAccordionTopic) => void;
  liveNews?: NewsItem[] | null;
  liveAssets?: Asset[];
}

export const AIMarketSummaryAccordion: React.FC<AIMarketSummaryAccordionProps> = ({
  activeTab,
  onOpenDeepDive,
  liveNews,
  liveAssets = [],
}) => {
  const topics = AI_MARKET_TOPICS_BY_REGION[activeTab] || AI_MARKET_TOPICS_BY_REGION["EUA"];
  const [expandedId, setExpandedId] = useState<string | null>(topics[0]?.id || null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dynamicSummary, setDynamicSummary] = useState<Record<string, string>>({});
  const [aiUpdatedTime, setAiUpdatedTime] = useState<string>(() => {
    const now = new Date();
    return `Atualizado hoje às ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  });

  const toggleAccordion = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleRefresh = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsRefreshing(true);

    try {
      const topNews = (liveNews || []).slice(0, 5).map((n) => ({
        title: n.title,
        source: n.source,
      }));

      const relevantQuotes = liveAssets
        .filter((a) => a.category === activeTab || a.ticker === "IBOV" || a.ticker === "S&P 500" || a.id === "usd-brl")
        .slice(0, 4)
        .map((a) => `${a.ticker}: ${a.price} (${a.changePercent >= 0 ? "+" : ""}${a.changePercent}%)`)
        .join(", ");

      const res = await fetch(`/api/market-ai/summary?t=${Date.now()}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
        body: JSON.stringify({
          region: activeTab,
          topic: topics[0]?.title || "Geral",
          recentNews: topNews,
          quotesSummary: relevantQuotes,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.generatedAt) {
          setAiUpdatedTime(`Atualizado ${data.generatedAt.toLowerCase()}`);
        }
        if (data.analysis && topics[0]?.id) {
          setDynamicSummary((prev) => ({
            ...prev,
            [topics[0].id]: data.analysis,
          }));
        }
      }
    } catch (err) {
      console.warn("Error fetching fresh AI summary:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const now = new Date();
    setAiUpdatedTime(`Atualizado hoje às ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`);
  }, [activeTab]);

  return (
    <section className="w-full py-4" id="ai-market-summary-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 sm:p-5 shadow-lg shadow-black/30">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#21262d] mb-4 gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1f6feb] to-[#a371f7] flex items-center justify-center text-white shadow-md shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-bold text-[#e6edf3] tracking-tight">
                    Resumo do Mercado com IA DinhEuro
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#58a6ff]/15 text-[#58a6ff] border border-[#58a6ff]/30">
                    {activeTab}
                  </span>
                </div>
                <p className="text-xs text-[#8b949e]">
                  Síntese analítica em tempo real conectada a notícias e fluxos setoriais
                </p>
              </div>
            </div>

            {/* Right Tag & Refresh Controls */}
            <div className="flex items-center gap-2.5 self-start sm:self-auto">
              {/* Visible Live Generation Time Tag */}
              <div
                className="px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-[#1f6feb]/15 text-[#58a6ff] border border-[#1f6feb]/30 flex items-center gap-1.5 shrink-0 shadow-xs"
                title="Horário da última leitura e síntese gerada pela IA"
              >
                <Clock className="w-3 h-3 text-[#58a6ff]" />
                <span>{aiUpdatedTime}</span>
              </div>

              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs text-[#8b949e] hover:text-[#e6edf3] bg-[#0e1117] hover:bg-[#21262d] border border-[#30363d] transition-all cursor-pointer font-medium"
                title="Atualizar leituras de IA com feed em tempo real"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#58a6ff]" : ""}`} />
                <span className="hidden sm:inline">Atualizar IA</span>
              </button>
            </div>
          </div>

          {/* Accordion List */}
          <div className="space-y-2.5">
            {topics.map((topic, index) => {
              const isExpanded = expandedId === topic.id;
              const currentSummary = dynamicSummary[topic.id] || topic.summary;
              return (
                <div
                  key={topic.id}
                  className={`border rounded-xl transition-all duration-200 overflow-hidden ${
                    isExpanded
                      ? "bg-[#0e1117]/80 border-[#58a6ff]/50 shadow-md shadow-[#58a6ff]/5"
                      : "bg-[#0e1117]/40 border-[#30363d]/70 hover:border-[#8b949e]/50"
                  }`}
                >
                  {/* Accordion Bar Header */}
                  <button
                    onClick={() => toggleAccordion(topic.id)}
                    className="w-full text-left p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
                    aria-expanded={isExpanded}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-[#21262d] text-[#58a6ff] font-bold text-xs flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-xs sm:text-sm font-semibold text-[#e6edf3] truncate">
                            {topic.title}
                          </h3>
                          <span className="text-[10px] px-2 py-0.2 rounded bg-[#161b22] text-[#8b949e] border border-[#30363d]">
                            {topic.impactTag}
                          </span>
                        </div>
                        {!isExpanded && (
                          <p className="text-xs text-[#8b949e] truncate mt-1">
                            {currentSummary}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {topic.trend === "bullish" ? (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-[#00c853] bg-[#00c853]/10 px-2 py-0.5 rounded-md border border-[#00c853]/20">
                          <TrendingUp className="w-3 h-3" />
                          <span className="hidden sm:inline">Otimista</span>
                        </span>
                      ) : topic.trend === "bearish" ? (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-[#ff5252] bg-[#ff5252]/10 px-2 py-0.5 rounded-md border border-[#ff5252]/20">
                          <TrendingDown className="w-3 h-3" />
                          <span className="hidden sm:inline">Cautela</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-[#8b949e] bg-[#30363d]/40 px-2 py-0.5 rounded-md">
                          <Minus className="w-3 h-3" />
                          <span className="hidden sm:inline">Neutro</span>
                        </span>
                      )}

                      <div className="p-1 rounded-md text-[#8b949e] hover:text-[#e6edf3]">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Accordion Content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 sm:px-5 sm:pb-5 border-t border-[#21262d]/70 animate-in fade-in duration-200">
                      <div className="space-y-3">
                        <p className="text-xs sm:text-sm text-[#e6edf3] font-medium leading-relaxed">
                          {currentSummary}
                        </p>
                        <div className="p-3 rounded-xl bg-[#161b22] border border-[#30363d]/60 text-xs text-[#8b949e] leading-relaxed">
                          <span className="text-[#58a6ff] font-semibold">Análise de Cenário & Notícias: </span>
                          {topic.detailedContext}
                        </div>

                        {/* Action CTA Button */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-1 gap-2">
                          <span className="text-[11px] text-[#8b949e] flex items-center gap-1">
                            <Zap className="w-3 h-3 text-[#f0883e]" />
                            Modelos Gemini 3.7 Flash integrados com feed ao vivo
                          </span>

                          <button
                            id={`btn-learn-more-${topic.id}`}
                            onClick={() => onOpenDeepDive(topic)}
                            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#1f6feb] to-[#238636] hover:brightness-110 shadow-sm transition-all cursor-pointer self-end sm:self-auto"
                          >
                            <Brain className="w-3.5 h-3.5" />
                            <span>Aprenda mais com a IA do DinhEuro</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
