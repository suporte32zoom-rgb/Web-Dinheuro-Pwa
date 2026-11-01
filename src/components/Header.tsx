import React, { useState, useEffect } from "react";
import { Asset } from "../types/finance";
import { BrandLogo } from "./BrandLogo";
import {
  Search,
  Menu,
  Bookmark,
  Briefcase,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Clock,
  Bell,
  BellRing,
} from "lucide-react";

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenSidebar: () => void;
  onOpenPortfolio: () => void;
  onOpenWatchlist: () => void;
  onOpenCopilot?: () => void;
  onOpenGoogleChat?: () => void;
  onOpenNotifications?: () => void;
  onOpenPwaModal?: () => void;
  notificationsEnabled?: boolean;
  notificationsCount?: number;
  isPwaInstallable?: boolean;
  isPwaInstalled?: boolean;
  onSelectAsset: (asset: Asset) => void;
  onGoHome: () => void;
  watchlistCount: number;
  portfolioCount: number;
  // Live Data Props
  liveAssets?: Asset[];
  lastUpdatedTime?: string;
  isRefreshing?: boolean;
  onManualRefresh?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSearch,
  onOpenSidebar,
  onOpenPortfolio,
  onOpenWatchlist,
  onOpenCopilot,
  onOpenGoogleChat,
  onOpenNotifications,
  onOpenPwaModal,
  notificationsEnabled = false,
  notificationsCount = 0,
  isPwaInstallable = false,
  isPwaInstalled = false,
  onSelectAsset,
  onGoHome,
  watchlistCount,
  portfolioCount,
  liveAssets = [],
  lastUpdatedTime,
  isRefreshing = false,
  onManualRefresh,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Find key benchmark tickers for top ticker bar
  const ibov = liveAssets.find((a) => a.id === "ibovespa" || a.ticker === "IBOV");
  const sp500 = liveAssets.find((a) => a.id === "sp-500" || a.ticker === "S&P 500");
  const usdBrl = liveAssets.find((a) => a.id === "usd-brl" || a.ticker.includes("USD / BRL"));
  const btc = liveAssets.find((a) => a.id === "bitcoin" || a.ticker === "BTC");
  const petr = liveAssets.find((a) => a.id === "petr4" || a.ticker === "PETR4");

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-200 ${
        isScrolled
          ? "bg-[#0e1117]/95 backdrop-blur-md border-b border-[#30363d] shadow-lg shadow-black/40"
          : "bg-[#0e1117] border-b border-[#21262d]"
      }`}
    >
      {/* Top Ticker Micro-Bar with Real-Time Data */}
      <div className="w-full bg-[#161b22] border-b border-[#21262d] px-3 sm:px-4 py-1 text-xs text-[#8b949e] flex items-center justify-between overflow-x-auto scrollbar-none flex-nowrap" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="flex items-center gap-4 shrink-0 flex-nowrap">
          <div className="flex items-center gap-1.5 font-medium text-[#e6edf3] shrink-0">
            <span className="w-2 h-2 rounded-full bg-[#00c853] animate-pulse"></span>
            <span className="text-[11px] uppercase tracking-wider font-semibold text-[#00c853]">AO VIVO</span>
          </div>

          <span className="text-[#30363d] shrink-0">|</span>

          <div className="flex items-center gap-4 shrink-0 flex-nowrap">
            {/* IBOV */}
            <div
              onClick={() => ibov && onSelectAsset(ibov)}
              className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity shrink-0"
              title="Ibovespa em tempo real"
            >
              <span className="text-[#8b949e] font-semibold text-[11px]">IBOV</span>
              <span className="text-[#e6edf3] font-mono text-[11px]">
                {ibov ? ibov.price.toLocaleString("pt-BR", { maximumFractionDigits: 0 }) : "183.477"} pts
              </span>
              <span
                className={`font-mono text-[11px] font-semibold ${
                  (ibov?.changePercent ?? 0) >= 0 ? "text-[#00c853]" : "text-[#ff5252]"
                }`}
              >
                {(ibov?.changePercent ?? 0) >= 0 ? "+" : ""}
                {(ibov?.changePercent ?? 0).toFixed(2)}%
              </span>
            </div>

            {/* S&P 500 */}
            <div
              onClick={() => sp500 && onSelectAsset(sp500)}
              className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity shrink-0"
              title="S&P 500 em tempo real"
            >
              <span className="text-[#8b949e] font-semibold text-[11px]">S&P 500</span>
              <span className="text-[#e6edf3] font-mono text-[11px]">
                {sp500 ? sp500.price.toLocaleString("en-US", { maximumFractionDigits: 1 }) : "7.743"}
              </span>
              <span
                className={`font-mono text-[11px] font-semibold ${
                  (sp500?.changePercent ?? 0) >= 0 ? "text-[#00c853]" : "text-[#ff5252]"
                }`}
              >
                {(sp500?.changePercent ?? 0) >= 0 ? "+" : ""}
                {(sp500?.changePercent ?? 0).toFixed(2)}%
              </span>
            </div>

            {/* USD/BRL */}
            <div
              onClick={() => usdBrl && onSelectAsset(usdBrl)}
              className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity shrink-0"
              title="Dólar Comercial em tempo real"
            >
              <span className="text-[#8b949e] font-semibold text-[11px]">USD/BRL</span>
              <span className="text-[#e6edf3] font-mono text-[11px]">
                R$ {usdBrl ? usdBrl.price.toLocaleString("pt-BR", { minimumFractionDigits: 4, maximumFractionDigits: 4 }) : "5,1866"}
              </span>
              <span
                className={`font-mono text-[11px] font-semibold ${
                  (usdBrl?.changePercent ?? 0) >= 0 ? "text-[#00c853]" : "text-[#ff5252]"
                }`}
              >
                {(usdBrl?.changePercent ?? 0) >= 0 ? "+" : ""}
                {(usdBrl?.changePercent ?? 0).toFixed(2)}%
              </span>
            </div>

            {/* BTC */}
            <div
              onClick={() => btc && onSelectAsset(btc)}
              className="hidden sm:flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity shrink-0"
              title="Bitcoin em tempo real"
            >
              <span className="text-[#8b949e] font-semibold text-[11px]">BTC</span>
              <span className="text-[#e6edf3] font-mono text-[11px]">
                US$ {btc ? btc.price.toLocaleString("en-US", { maximumFractionDigits: 0 }) : "83,430"}
              </span>
              <span
                className={`font-mono text-[11px] font-semibold ${
                  (btc?.changePercent ?? 0) >= 0 ? "text-[#00c853]" : "text-[#ff5252]"
                }`}
              >
                {(btc?.changePercent ?? 0) >= 0 ? "+" : ""}
                {(btc?.changePercent ?? 0).toFixed(2)}%
              </span>
            </div>

            {/* PETR4 */}
            <div
              onClick={() => petr && onSelectAsset(petr)}
              className="hidden md:flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity shrink-0"
              title="Petrobras PN em tempo real"
            >
              <span className="text-[#8b949e] font-semibold text-[11px]">PETR4</span>
              <span className="text-[#e6edf3] font-mono text-[11px]">
                R$ {petr ? petr.price.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "47,99"}
              </span>
              <span
                className={`font-mono text-[11px] font-semibold ${
                  (petr?.changePercent ?? 0) >= 0 ? "text-[#00c853]" : "text-[#ff5252]"
                }`}
              >
                {(petr?.changePercent ?? 0) >= 0 ? "+" : ""}
                {(petr?.changePercent ?? 0).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* Right Info & Live Refresh Trigger */}
        <div className="flex items-center gap-2 sm:gap-3 text-[#8b949e] text-xs shrink-0 flex-nowrap">
          <div className="hidden lg:flex items-center gap-1.5 font-mono text-[11px] shrink-0">
            <Clock className="w-3 h-3 text-[#8b949e]" />
            <span>Atualizado: {lastUpdatedTime || "Em tempo real"}</span>
          </div>

          {onManualRefresh && (
            <button
              type="button"
              onClick={onManualRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#21262d] hover:bg-[#30363d] text-[#58a6ff] hover:text-white transition-colors cursor-pointer text-[11px] font-medium border border-[#30363d] shrink-0"
              title="Atualizar cotações agora"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Navigation Row */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4 w-full">
        {/* Left: Hamburger & Brand Logo */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            id="btn-toggle-sidebar"
            onClick={onOpenSidebar}
            aria-label="Abrir menu de navegação"
            className="p-2 rounded-lg text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] transition-colors focus:outline-none focus:ring-2 focus:ring-[#58a6ff] cursor-pointer shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            onClick={onGoHome}
            className="cursor-pointer select-none group shrink-0"
            id="brand-logo"
            title="DinhEuro - Início"
          >
            <BrandLogo size="md" showText={true} showSubtitle={true} />
          </div>
        </div>
        {/* Center: Global Search Bar */}
        <div className="flex-1 min-w-0 max-w-xl hidden xs:block sm:block">
          <div
            id="global-search-trigger"
            onClick={onOpenSearch}
            className="w-full bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] hover:border-[#58a6ff]/60 rounded-xl px-3 py-2 flex items-center justify-between text-xs sm:text-sm text-[#8b949e] cursor-pointer transition-all duration-150 shadow-inner group"
          >
            <div className="flex items-center gap-2 overflow-hidden min-w-0">
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#8b949e] group-hover:text-[#58a6ff] transition-colors shrink-0" />
              <span className="truncate text-xs text-[#8b949e] group-hover:text-[#e6edf3]">
                Pesquisar B3, Wall St, câmbio, cripto...
              </span>
            </div>
            <div className="hidden md:flex items-center gap-1 shrink-0">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-[#0e1117] text-[#8b949e] border border-[#30363d] rounded shadow-xs">
                Ctrl + K
              </kbd>
            </div>
          </div>
        </div>

        {/* Right: Quick Actions */}
        <div
          className="flex items-center gap-1 sm:gap-2 shrink-0 max-w-full overflow-x-auto scrollbar-none nav-scroll-container py-1"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {/* Mobile search icon button when search input is hidden on very narrow screens */}
          <button
            type="button"
            onClick={onOpenSearch}
            aria-label="Pesquisar"
            className="xs:hidden flex items-center justify-center p-2 rounded-xl text-[#8b949e] hover:text-[#e6edf3] bg-[#161b22] border border-[#30363d] shrink-0 cursor-pointer"
          >
            <Search className="w-4 h-4 text-[#58a6ff]" />
          </button>

          {/* Real-time Notifications & Alerts Button */}
          {onOpenNotifications && (
            <button
              type="button"
              id="btn-header-notifications"
              onClick={onOpenNotifications}
              className={`relative flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border shrink-0 ${
                notificationsEnabled
                  ? "bg-[#161b22] text-[#58a6ff] border-[#30363d] hover:border-[#58a6ff] hover:bg-[#21262d]"
                  : "bg-[#161b22] text-[#8b949e] border-[#30363d] hover:text-[#e6edf3] hover:bg-[#21262d]"
              }`}
              title="Notificações Push & Alertas de Cotação em Tempo Real"
            >
              <div className="relative shrink-0">
                {notificationsEnabled ? (
                  <BellRing className="w-4 h-4 text-[#58a6ff]" />
                ) : (
                  <Bell className="w-4 h-4" />
                )}
                {notificationsEnabled && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#00c853] animate-pulse" />
                )}
              </div>
              <span className="hidden sm:inline">Alertas</span>
              {notificationsCount > 0 && (
                <span className="px-1.5 py-0.2 bg-[#58a6ff]/20 text-[#58a6ff] rounded-full text-[10px] font-bold shrink-0">
                  {notificationsCount}
                </span>
              )}
            </button>
          )}

          {/* Watchlist Quick Button */}
          <button
            type="button"
            id="btn-header-watchlist"
            onClick={onOpenWatchlist}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-medium text-[#e6edf3] bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] hover:border-[#8b949e] transition-all cursor-pointer shrink-0"
            title="Minha Lista de Observação"
          >
            <Bookmark className="w-4 h-4 text-[#e3b341] shrink-0" />
            <span className="hidden sm:inline">Listas</span>
            {watchlistCount > 0 && (
              <span className="px-1.5 py-0.2 bg-[#e3b341]/20 text-[#e3b341] rounded-full text-[10px] font-bold shrink-0">
                {watchlistCount}
              </span>
            )}
          </button>

          {/* Portfolio Quick Button */}
          <button
            type="button"
            id="btn-header-portfolio"
            onClick={onOpenPortfolio}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#1f6feb] to-[#238636] hover:brightness-110 border border-transparent shadow-sm transition-all cursor-pointer shrink-0"
            title="Meu Portfólio em Tempo Real"
          >
            <Briefcase className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Portfólio</span>
            {portfolioCount > 0 && (
              <span className="px-1.5 py-0.2 bg-white/20 text-white rounded-full text-[10px] font-bold shrink-0">
                {portfolioCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
