import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Asset,
  RegionalTab,
  AIAccordionTopic,
  PortfolioPosition,
  NewsItem,
  MarketMoverItem,
} from "./types/finance";
import { ALL_ASSETS } from "./data/mockMarketData";
import {
  fetchLiveQuotes,
  fetchLiveNews,
  fetchLiveMovers,
  LiveQuotePayload,
} from "./services/marketDataService";
import { getStoredQuotes } from "./services/apiService";
import { Header } from "./components/Header";
import { NavigationTabs } from "./components/NavigationTabs";
import { SectorFilterBar } from "./components/SectorFilterBar";
import { DynamicIndicesCarousel } from "./components/DynamicIndicesCarousel";
import { GlobalEconomyWidget } from "./components/GlobalEconomyWidget";
import { DEFAULT_UNIFIED_CURRENCIES, economyItemToAsset } from "./services/unifiedCurrencyService";
import { AIMarketSummaryAccordion } from "./components/AIMarketSummaryAccordion";
import { MarketMoversGrid } from "./components/MarketMoversGrid";
import { NewsSection } from "./components/NewsSection";
import { AssetDetailView } from "./components/AssetDetailView";
import { SidebarDrawer } from "./components/SidebarDrawer";
import { GlobalSearchModal } from "./components/GlobalSearchModal";
import { PortfolioModal } from "./components/PortfolioModal";
import { WatchlistModal } from "./components/WatchlistModal";
import { AIDeepDiveModal } from "./components/AIDeepDiveModal";
import { PWAInstallModal } from "./components/PWAInstallModal";
import { PWANotificationBar } from "./components/PWANotificationBar";
import { PWASplashIntro } from "./components/PWASplashIntro";
import { DinhEuroAICopilot } from "./components/DinhEuroAICopilot";
import { GoogleChatModal } from "./components/GoogleChatModal";
import { NotificationSettingsModal } from "./components/NotificationSettingsModal";
import { notificationService, NotificationSettings } from "./services/notificationService";
import { InstitutionalModal } from "./components/InstitutionalModal";
import { LGPDConsentBanner } from "./components/LGPDConsentBanner";
import { LegalDocId } from "./types/legal";
import { Footer } from "./components/Footer";
import { usePWA } from "./hooks/usePWA";

export default function App() {
  const [activeTab, setActiveTab] = useState<RegionalTab>("América Latina");
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // Sector & Custom Tags Filter State
  const [selectedSector, setSelectedSector] = useState<string>("all");
  const [activeTag, setActiveTag] = useState<string>("");
  const [groupBySector, setGroupBySector] = useState<boolean>(false);

  // Live real-time market feeds state (Pre-loaded from localStorage cache)
  const [liveAssets, setLiveAssets] = useState<Asset[]>(() => {
    const stored = getStoredQuotes();
    if (!stored) return ALL_ASSETS;
    return ALL_ASSETS.map((asset) => {
      const q = stored[asset.id];
      if (!q) return asset;
      return {
        ...asset,
        price: q.price,
        change: q.change,
        changePercent: q.changePercent,
        sparkline: q.sparkline && q.sparkline.length > 0 ? q.sparkline : asset.sparkline,
        metrics: {
          ...asset.metrics,
          open: q.open !== undefined ? q.open : asset.metrics.open,
          high: q.high !== undefined ? q.high : asset.metrics.high,
          low: q.low !== undefined ? q.low : asset.metrics.low,
          high52w: q.high52w !== undefined ? q.high52w : asset.metrics.high52w,
          low52w: q.low52w !== undefined ? q.low52w : asset.metrics.low52w,
          prevClose: q.price - q.change,
          volume: q.volume || asset.metrics.volume,
        },
      };
    });
  });
  const [liveNews, setLiveNews] = useState<NewsItem[] | null>(null);
  const [liveMovers, setLiveMovers] = useState<{
    mostActive: MarketMoverItem[];
    topGainers: MarketMoverItem[];
    topLosers: MarketMoverItem[];
  } | null>(null);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // PWA State & Installation Hook
  const {
    isInstallable,
    isInstalled,
    isOffline,
    hasUpdate,
    promptInstall,
    applyUpdate,
  } = usePWA();

  // Modals state
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [portfolioOpen, setPortfolioOpen] = useState(false);
  const [watchlistOpen, setWatchlistOpen] = useState(false);
  const [pwaModalOpen, setPwaModalOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [googleChatOpen, setGoogleChatOpen] = useState(false);
  const [chatShareText, setChatShareText] = useState("");
  const [deepDiveTopic, setDeepDiveTopic] = useState<AIAccordionTopic | null>(null);

  // Institutional, Legal & LGPD Compliance Modal State
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [currentLegalDoc, setCurrentLegalDoc] = useState<LegalDocId>("termos-de-uso");

  // Sync browser URL paths (/termos-de-uso, /politica-de-privacidade, /politica-de-cookies, /sobre, /disclaimer)
  useEffect(() => {
    const checkLegalRoute = () => {
      const rawPath = window.location.pathname.replace(/^\//, "").toLowerCase();
      if (
        rawPath === "termos-de-uso" ||
        rawPath === "politica-de-privacidade" ||
        rawPath === "politica-de-cookies" ||
        rawPath === "sobre" ||
        rawPath === "disclaimer"
      ) {
        setCurrentLegalDoc(rawPath as LegalDocId);
        setLegalModalOpen(true);
      }
    };

    checkLegalRoute();
    window.addEventListener("popstate", checkLegalRoute);
    return () => window.removeEventListener("popstate", checkLegalRoute);
  }, []);

  const handleOpenLegalDoc = useCallback((docId: LegalDocId) => {
    setCurrentLegalDoc(docId);
    setLegalModalOpen(true);
    window.history.pushState({}, "", `/${docId}`);
  }, []);

  const handleCloseLegalModal = useCallback(() => {
    setLegalModalOpen(false);
    const rawPath = window.location.pathname.replace(/^\//, "").toLowerCase();
    if (
      rawPath === "termos-de-uso" ||
      rawPath === "politica-de-privacidade" ||
      rawPath === "politica-de-cookies" ||
      rawPath === "sobre" ||
      rawPath === "disclaimer"
    ) {
      window.history.pushState({}, "", "/");
    }
  }, []);

  // Push Notifications Modal & Preferences State
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [alertTargetAsset, setAlertTargetAsset] = useState<Asset | null>(null);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() =>
    notificationService.getSettings()
  );

  useEffect(() => {
    const unsub = notificationService.subscribe((newSettings) => {
      setNotificationSettings(newSettings);
    });
    return unsub;
  }, []);

  // Listen for Service Worker push notification clicks to deep-link into assets
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === "NOTIFICATION_OPEN_ASSET" && event.data.assetId) {
          const match = liveAssets.find(
            (a) =>
              a.id === event.data.assetId ||
              a.ticker.toUpperCase() === String(event.data.assetId).toUpperCase()
          );
          if (match) {
            setSelectedAsset(match);
          }
        }
      };
      navigator.serviceWorker.addEventListener("message", handleMessage);
      return () => navigator.serviceWorker.removeEventListener("message", handleMessage);
    }
  }, [liveAssets]);

  // Helper to merge live quotes into asset objects and evaluate alert thresholds
  const mergeQuotesIntoAssets = useCallback(
    (quotes: Record<string, LiveQuotePayload>) => {
      setLiveAssets((prevAssets) => {
        const updatedList = prevAssets.map((asset) => {
          const quote = quotes[asset.id];
          if (!quote) return asset;

          const updated: Asset = {
            ...asset,
            price: quote.price,
            change: quote.change,
            changePercent: quote.changePercent,
            currency: quote.currency || asset.currency,
            sparkline:
              quote.sparkline && quote.sparkline.length > 0
                ? quote.sparkline
                : asset.sparkline,
            metrics: {
              ...asset.metrics,
              open: quote.open !== undefined ? quote.open : asset.metrics.open,
              high: quote.high !== undefined ? quote.high : asset.metrics.high,
              low: quote.low !== undefined ? quote.low : asset.metrics.low,
              high52w: quote.high52w !== undefined ? quote.high52w : asset.metrics.high52w,
              low52w: quote.low52w !== undefined ? quote.low52w : asset.metrics.low52w,
              prevClose: quote.price - quote.change,
              volume: quote.volume || asset.metrics.volume,
            },
          };

          return updated;
        });

        // Trigger real-time price alerts evaluation on desktop & mobile
        notificationService.evaluateAssetPrices(updatedList);

        return updatedList;
      });

      // Keep selectedAsset updated in real time if open
      setSelectedAsset((cur) => {
        if (!cur) return null;
        const quote = quotes[cur.id];
        if (!quote) return cur;
        return {
          ...cur,
          price: quote.price,
          change: quote.change,
          changePercent: quote.changePercent,
          currency: quote.currency || cur.currency,
          sparkline:
            quote.sparkline && quote.sparkline.length > 0
              ? quote.sparkline
              : cur.sparkline,
          metrics: {
            ...cur.metrics,
            open: quote.open !== undefined ? quote.open : cur.metrics.open,
            high: quote.high !== undefined ? quote.high : cur.metrics.high,
            low: quote.low !== undefined ? quote.low : cur.metrics.low,
            high52w: quote.high52w !== undefined ? quote.high52w : cur.metrics.high52w,
            low52w: quote.low52w !== undefined ? quote.low52w : cur.metrics.low52w,
            prevClose: quote.price - quote.change,
            volume: quote.volume || cur.metrics.volume,
          },
        };
      });
    },
    []
  );

  // Master refresh function
  const refreshAllMarketData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [quotes, news, movers] = await Promise.all([
        fetchLiveQuotes(),
        fetchLiveNews(),
        fetchLiveMovers(),
      ]);

      if (quotes) {
        mergeQuotesIntoAssets(quotes);
      }
      if (news && news.length > 0) {
        setLiveNews(news);
      }
      if (movers) {
        setLiveMovers(movers);
      }
      setLastUpdatedTime(
        new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    } catch (err) {
      console.warn("Market refresh error:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [mergeQuotesIntoAssets]);

  // Initial load and periodic polling every 15 seconds
  useEffect(() => {
    refreshAllMarketData();
    const interval = setInterval(() => {
      refreshAllMarketData();
    }, 15000);
    return () => clearInterval(interval);
  }, [refreshAllMarketData]);

  // Watchlist state (Local Storage persisted - defaults to empty: zero pre-selected items)
  const [watchlistIds, setWatchlistIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("dinheuro_watchlist");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // If legacy pre-seeded mock array is detected, reset to empty
          const legacySeed = ["ibov", "petr4", "sp500", "btc-brl", "usd-brl"];
          const isLegacySeed =
            parsed.length === legacySeed.length &&
            parsed.every((item, idx) => item === legacySeed[idx]);
          if (isLegacySeed) {
            localStorage.setItem("dinheuro_watchlist", JSON.stringify([]));
            return [];
          }
          return parsed;
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  // Portfolio positions state (Local Storage persisted - defaults to empty: zero pre-selected items)
  const [portfolioPositions, setPortfolioPositions] = useState<PortfolioPosition[]>(() => {
    try {
      const saved = localStorage.getItem("dinheuro_portfolio");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // If legacy pre-seeded mock positions are detected, reset to empty
          const hasLegacyMock = parsed.some(
            (p: any) => p && (p.id === "pos-1" || p.id === "pos-2" || p.id === "pos-3")
          );
          if (hasLegacyMock && parsed.length <= 3) {
            localStorage.setItem("dinheuro_portfolio", JSON.stringify([]));
            return [];
          }
          return parsed;
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  // Save watchlist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("dinheuro_watchlist", JSON.stringify(watchlistIds));
    } catch (e) {
      console.error(e);
    }
  }, [watchlistIds]);

  // Save portfolio to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("dinheuro_portfolio", JSON.stringify(portfolioPositions));
    } catch (e) {
      console.error(e);
    }
  }, [portfolioPositions]);

  // Keep stable refs to prevent re-entrant route listeners from resetting state on polling
  const liveAssetsRef = useRef<Asset[]>(liveAssets);
  useEffect(() => {
    liveAssetsRef.current = liveAssets;
  }, [liveAssets]);

  const selectedAssetRef = useRef<Asset | null>(selectedAsset);
  useEffect(() => {
    selectedAssetRef.current = selectedAsset;
  }, [selectedAsset]);

  // Robust asset resolver by ID, ticker or code
  const resolveAssetByKey = useCallback((rawKey: string): Asset | null => {
    if (!rawKey) return null;
    const cleanRaw = decodeURIComponent(rawKey).trim().toLowerCase();
    const pool = liveAssetsRef.current && liveAssetsRef.current.length > 0 ? liveAssetsRef.current : ALL_ASSETS;

    let found = pool.find(
      (a) => a.id.toLowerCase() === cleanRaw || a.ticker.toLowerCase() === cleanRaw
    );

    if (!found) {
      const cleanKey = cleanRaw.replace(/[-_/]/g, "").toUpperCase();
      const matchQuote = Object.values(DEFAULT_UNIFIED_CURRENCIES).find(
        (q) =>
          `${q.code}${q.codein}`.toUpperCase() === cleanKey ||
          `${q.code.toLowerCase()}-${q.codein.toLowerCase()}` === cleanRaw ||
          q.code.toLowerCase() === cleanRaw
      );
      if (matchQuote) {
        found = economyItemToAsset(matchQuote);
      }
    }

    return found || null;
  }, []);

  // Stable URL hash listener: Runs ONLY on mount or true user hashchange
  // Never re-executes on liveAssets background polling or data refresh!
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith("#asset/")) {
        const rawKey = hash.replace("#asset/", "");
        const found = resolveAssetByKey(rawKey);
        if (found && selectedAssetRef.current?.id !== found.id) {
          setSelectedAsset(found);
        }
      } else if (hash === "" || hash === "#") {
        // Only return to home if user explicitly cleared hash via browser back/forward
        if (selectedAssetRef.current !== null) {
          setSelectedAsset(null);
        }
      }
    };

    // Run once on initial page load to support deep links
    handleHash();

    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, [resolveAssetByKey]);

  // Google Analytics Pageview tracker on view/route change
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).gtag) {
      const pagePath = selectedAsset
        ? `/#asset/${selectedAsset.id}`
        : window.location.pathname + (window.location.hash || "");
      const pageTitle = selectedAsset
        ? `${selectedAsset.ticker} - ${selectedAsset.name} | DinhEuro`
        : document.title;
      (window as any).gtag("event", "page_view", {
        page_path: pagePath,
        page_title: pageTitle,
      });
    }
  }, [selectedAsset]);

  const handleSelectAsset = useCallback((asset: Asset) => {
    setSelectedAsset(asset);
    const targetHash = `#asset/${encodeURIComponent(asset.id)}`;
    if (window.location.hash !== targetHash) {
      try {
        window.history.pushState(null, "", targetHash);
      } catch {
        window.location.hash = targetHash;
      }
    }
    // Only scroll to top on explicit user navigation to an asset
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleSelectTicker = useCallback((ticker: string) => {
    const pool = liveAssetsRef.current && liveAssetsRef.current.length > 0 ? liveAssetsRef.current : ALL_ASSETS;
    const asset = pool.find(
      (a) => a.ticker.toLowerCase() === ticker.toLowerCase() || a.id.toLowerCase() === ticker.toLowerCase()
    );
    if (asset) {
      handleSelectAsset(asset);
    } else {
      const ibov = pool.find((a) => a.id === "ibov" || a.id === "ibovespa");
      if (ibov) handleSelectAsset(ibov);
    }
  }, [handleSelectAsset]);

  const handleGoHome = useCallback(() => {
    setSelectedAsset(null);
    if (window.location.hash) {
      try {
        window.history.pushState(null, "", window.location.pathname);
      } catch {
        window.location.hash = "";
      }
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleViewAllStocks = useCallback(() => {
    setActiveTab("América Latina");
    setSelectedSector("all");
    setActiveTag("");
    if (selectedAssetRef.current) {
      setSelectedAsset(null);
      if (window.location.hash) {
        try {
          window.history.pushState(null, "", window.location.pathname);
        } catch {
          window.location.hash = "";
        }
      }
    }
    setTimeout(() => {
      const el = document.getElementById("market-assets-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        window.scrollTo({ top: 380, behavior: "smooth" });
      }
    }, 50);
  }, []);

  const handleToggleWatchlist = (asset: Asset) => {
    setWatchlistIds((prev) =>
      prev.includes(asset.id) ? prev.filter((id) => id !== asset.id) : [...prev, asset.id]
    );
  };

  const handleAddPortfolioPosition = (newPos: Omit<PortfolioPosition, "id">) => {
    const pos: PortfolioPosition = {
      ...newPos,
      id: `pos-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    setPortfolioPositions((prev) => [pos, ...prev]);
  };

  const handleRemovePortfolioPosition = (id: string) => {
    setPortfolioPositions((prev) => prev.filter((p) => p.id !== id));
  };

  const watchlistAssets = liveAssets.filter((a) => watchlistIds.includes(a.id));

  return (
    <div className="min-h-screen bg-[#0e1117] text-[#e6edf3] flex flex-col selection:bg-[#58a6ff]/30 selection:text-white">
      {/* PWA Splash Screen on launch */}
      <PWASplashIntro />

      {/* PWA Offline and Update notification banner */}
      <PWANotificationBar
        isOffline={isOffline}
        hasUpdate={hasUpdate}
        onApplyUpdate={applyUpdate}
        isInstallable={isInstallable}
        onOpenInstallModal={() => setPwaModalOpen(true)}
      />

      {/* 1. Global Navigation Header */}
      <Header
        onOpenSearch={() => setSearchOpen(true)}
        onOpenSidebar={() => setSidebarOpen(true)}
        onOpenPortfolio={() => setPortfolioOpen(true)}
        onOpenWatchlist={() => setWatchlistOpen(true)}
        onOpenCopilot={() => setCopilotOpen(true)}
        onOpenGoogleChat={() => {
          setChatShareText("");
          setGoogleChatOpen(true);
        }}
        onOpenNotifications={() => {
          setAlertTargetAsset(null);
          setNotificationsOpen(true);
        }}
        onOpenPwaModal={() => setPwaModalOpen(true)}
        notificationsEnabled={
          notificationSettings.enabled &&
          typeof window !== "undefined" &&
          "Notification" in window &&
          Notification.permission === "granted"
        }
        notificationsCount={notificationSettings.assetAlerts.filter((a) => a.enabled).length}
        isPwaInstallable={isInstallable}
        isPwaInstalled={isInstalled}
        onSelectAsset={handleSelectAsset}
        onGoHome={handleGoHome}
        watchlistCount={watchlistIds.length}
        portfolioCount={portfolioPositions.length}
        liveAssets={liveAssets}
        lastUpdatedTime={lastUpdatedTime}
        isRefreshing={isRefreshing}
        onManualRefresh={refreshAllMarketData}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full flex flex-col">
        {selectedAsset ? (
          /* 2. PÁGINA INTERNA (VISÃO DETALHADA DO ATIVO/ÍNDICE) */
          <AssetDetailView
            asset={selectedAsset}
            onBack={handleGoHome}
            onSelectAsset={handleSelectAsset}
            isWatchlisted={watchlistIds.includes(selectedAsset.id)}
            onToggleWatchlist={handleToggleWatchlist}
            onOpenPortfolio={() => setPortfolioOpen(true)}
            onShareToChat={(text) => {
              setChatShareText(text);
              setGoogleChatOpen(true);
            }}
            onOpenAlertModal={(asset) => {
              setAlertTargetAsset(asset);
              setNotificationsOpen(true);
            }}
            allAssets={liveAssets}
          />
        ) : (
          /* 1. VISÃO GERAL (PÁGINA INICIAL) */
          <div className="flex-1 flex flex-col">
            {/* Category Pills Navigation */}
            <NavigationTabs
              activeTab={activeTab}
              onSelectTab={(tab) => {
                setActiveTab(tab);
              }}
            />

            {/* Setores & Tags Customizadas Filter Bar */}
            <SectorFilterBar
              assets={liveAssets}
              selectedSector={selectedSector}
              onSelectSector={setSelectedSector}
              groupBySector={groupBySector}
              onToggleGroupBySector={setGroupBySector}
              activeTag={activeTag}
              onSelectTag={setActiveTag}
            />

            {/* Dynamic Indices Carousel (com suporte a filtros e agrupamento setorial) */}
            <DynamicIndicesCarousel
              assets={liveAssets}
              activeTab={activeTab}
              onSelectAsset={handleSelectAsset}
              isLoading={isRefreshing && liveAssets.length === 0}
              selectedSector={selectedSector}
              activeTag={activeTag}
              groupBySector={groupBySector}
              onSelectSector={setSelectedSector}
              onSelectTag={setActiveTag}
            />

            {/* Global Economy & AwesomeAPI Live Indicators */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-2">
              <GlobalEconomyWidget
                onSelectAsset={handleSelectAsset}
                liveAssets={liveAssets}
              />
            </div>

            {/* AI Market Summary Accordion */}
            <AIMarketSummaryAccordion
              activeTab={activeTab}
              onOpenDeepDive={(topic) => setDeepDiveTopic(topic)}
            />

            {/* Market Movers (Mais ativas, Maiores altas, Maiores quedas) */}
            <MarketMoversGrid
              onSelectTicker={handleSelectTicker}
              liveMovers={liveMovers}
              onViewAllStocks={handleViewAllStocks}
            />

            {/* Portal News Section */}
            <NewsSection
              onSelectTicker={handleSelectTicker}
              liveNews={liveNews}
            />
          </div>
        )}
      </main>

      {/* Global Modals & Drawers */}
      <SidebarDrawer
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (selectedAsset) setSelectedAsset(null);
        }}
        onOpenPortfolio={() => setPortfolioOpen(true)}
        onOpenWatchlist={() => setWatchlistOpen(true)}
        onOpenCopilot={() => setCopilotOpen(true)}
        onOpenGoogleChat={() => {
          setChatShareText("");
          setGoogleChatOpen(true);
        }}
        onOpenNotifications={() => {
          setAlertTargetAsset(null);
          setNotificationsOpen(true);
        }}
        onOpenPwaModal={() => setPwaModalOpen(true)}
        isPwaInstalled={isInstalled}
        watchlistAssets={watchlistAssets}
        onSelectAsset={handleSelectAsset}
        liveAssets={liveAssets}
        onOpenLegalDoc={handleOpenLegalDoc}
      />

      <GlobalSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectAsset={handleSelectAsset}
        liveAssets={liveAssets}
      />

      <PortfolioModal
        isOpen={portfolioOpen}
        onClose={() => setPortfolioOpen(false)}
        positions={portfolioPositions}
        onAddPosition={handleAddPortfolioPosition}
        onRemovePosition={handleRemovePortfolioPosition}
        onSelectAsset={handleSelectAsset}
        liveAssets={liveAssets}
      />

      <WatchlistModal
        isOpen={watchlistOpen}
        onClose={() => setWatchlistOpen(false)}
        watchlistAssets={watchlistAssets}
        onRemoveFromWatchlist={handleToggleWatchlist}
        onSelectAsset={handleSelectAsset}
      />

      <AIDeepDiveModal
        topic={deepDiveTopic}
        onClose={() => setDeepDiveTopic(null)}
      />

      {/* DinhEuro Official AI Copilot Modal */}
      <DinhEuroAICopilot
        isOpen={copilotOpen}
        onClose={() => setCopilotOpen(false)}
      />

      {/* Google Chat Workspace Integration Modal */}
      <GoogleChatModal
        isOpen={googleChatOpen}
        onClose={() => {
          setGoogleChatOpen(false);
          setChatShareText("");
        }}
        initialShareText={chatShareText}
      />

      {/* Real-time Push Notifications & Market Alerts Settings Modal */}
      <NotificationSettingsModal
        isOpen={notificationsOpen}
        onClose={() => {
          setNotificationsOpen(false);
          setAlertTargetAsset(null);
        }}
        liveAssets={liveAssets}
        initialAsset={alertTargetAsset}
      />

      {/* Institutional, Jurídico & Compliance Modal */}
      <InstitutionalModal
        isOpen={legalModalOpen}
        onClose={handleCloseLegalModal}
        initialDocId={currentLegalDoc}
        onSelectDoc={(docId) => setCurrentLegalDoc(docId)}
      />

      {/* Interactive LGPD Consent & Privacy Banner */}
      <LGPDConsentBanner onOpenLegalDoc={handleOpenLegalDoc} />

      <PWAInstallModal
        isOpen={pwaModalOpen}
        onClose={() => setPwaModalOpen(false)}
        onInstall={promptInstall}
        isInstallable={isInstallable}
        isInstalled={isInstalled}
      />

      {/* Global Footer with Legal & Compliance Navigation */}
      <Footer onOpenLegalDoc={handleOpenLegalDoc} />
    </div>
  );
}
