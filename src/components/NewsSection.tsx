import React, { useState } from "react";
import { PORTAL_NEWS } from "../data/mockMarketData";
import { NewsItem } from "../types/finance";
import { Newspaper, ExternalLink, Clock, Sparkles } from "lucide-react";

interface NewsSectionProps {
  onSelectTicker?: (ticker: string) => void;
  liveNews?: NewsItem[] | null;
}

export const NewsSection: React.FC<NewsSectionProps> = ({ onSelectTicker, liveNews }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");
  const categories = ["Todas", "Mercados B3", "Wall Street", "Câmbio & Forex", "Criptoativos", "Commodities"];

  const newsSourceList = liveNews && liveNews.length > 0 ? liveNews : PORTAL_NEWS;

  const filteredNews =
    selectedCategory === "Todas"
      ? newsSourceList
      : newsSourceList.filter((n) => n.category === selectedCategory);

  const getSafeNewsUrl = (rawUrl?: string, title?: string): string => {
    if (!rawUrl || rawUrl.trim() === "" || rawUrl === "#") {
      const query = encodeURIComponent((title || "mercado financeiro").slice(0, 80));
      return `https://news.google.com/search?q=${query}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
    }
    let url = rawUrl.trim();
    if (url.startsWith("http://")) {
      url = url.replace(/^http:\/\//i, "https://");
    } else if (!url.startsWith("https://")) {
      url = `https://${url}`;
    }
    return url;
  };

  return (
    <section className="w-full py-4" id="portal-news-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 sm:p-5 shadow-lg shadow-black/30">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#21262d] mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#58a6ff]/15 text-[#58a6ff]">
                <Newspaper className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#e6edf3] tracking-tight">
                    Notícias & Análises em Tempo Real
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#00c853]/15 text-[#00c853] border border-[#00c853]/30">
                    FEED AO VIVO
                  </span>
                </div>
                <p className="text-xs text-[#8b949e]">
                  Cobertura financeira direta das principais agências, portais de economia e fontes de mercado
                </p>
              </div>
            </div>

            {/* Category filter pills */}
            <div
              className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none nav-scroll-container flex-nowrap"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {categories.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                    selectedCategory === cat
                      ? "bg-[#21262d] text-[#58a6ff] border border-[#58a6ff]"
                      : "bg-[#0e1117] text-[#8b949e] hover:text-[#e6edf3] border border-[#30363d]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* News Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {!liveNews ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={`news-skeleton-${i}`}
                  className="bg-[#0e1117]/60 border border-[#30363d]/70 rounded-xl p-4 flex flex-col justify-between h-40 animate-pulse"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="h-3.5 w-20 bg-[#21262d] rounded" />
                      <div className="h-3 w-14 bg-[#21262d] rounded" />
                    </div>
                    <div className="h-4 w-full bg-[#21262d] rounded mt-2" />
                    <div className="h-4 w-4/5 bg-[#21262d] rounded" />
                  </div>
                  <div className="pt-3 border-t border-[#21262d] flex justify-between items-center">
                    <div className="h-3.5 w-16 bg-[#21262d] rounded" />
                    <div className="h-3.5 w-16 bg-[#21262d] rounded" />
                  </div>
                </div>
              ))
            ) : (
              filteredNews.map((news) => {
                const safeUrl = getSafeNewsUrl(news.url, news.title);
                return (
                  <a
                    key={news.id}
                    href={safeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#0e1117]/60 hover:bg-[#21262d]/70 border border-[#30363d]/70 hover:border-[#58a6ff]/50 rounded-xl p-4 flex flex-col justify-between transition-all duration-150 group block cursor-pointer"
                  >
                    <div>
                      {/* Source and Time */}
                      <div className="flex items-center justify-between gap-2 mb-2 text-xs text-[#8b949e]">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-[#58a6ff] bg-[#58a6ff]/10 px-2 py-0.5 rounded border border-[#58a6ff]/20">
                            {news.source}
                          </span>
                          <span className="flex items-center gap-1 text-[11px]">
                            <Clock className="w-3 h-3" />
                            {news.timeAgo}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#8b949e] bg-[#161b22] px-1.5 py-0.5 rounded border border-[#30363d]">
                          {news.category}
                        </span>
                      </div>

                      {/* Headline */}
                      <h3 className="text-xs sm:text-sm font-semibold text-[#e6edf3] group-hover:text-white leading-snug line-clamp-3">
                        {news.title}
                      </h3>
                    </div>

                    {/* Related Ticker Tags and Read link */}
                    <div className="pt-3 mt-3 border-t border-[#21262d] flex items-center justify-between">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {news.relatedTickers?.map((ticker) => (
                          <button
                            key={ticker}
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (onSelectTicker) onSelectTicker(ticker);
                            }}
                            className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#161b22] hover:bg-[#30363d] text-[#e6edf3] border border-[#30363d] transition-colors cursor-pointer"
                          >
                            {ticker}
                          </button>
                        ))}
                      </div>

                      <span className="text-xs text-[#58a6ff] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform font-medium">
                        <span>Ler matéria</span>
                        <ExternalLink className="w-3 h-3" />
                      </span>
                    </div>
                  </a>
                );
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
