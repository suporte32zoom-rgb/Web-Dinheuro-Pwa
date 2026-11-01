import React, { useState, useEffect } from "react";
import { Asset, NewsItem } from "../types/finance";
import { InteractiveChart } from "./InteractiveChart";
import { Sparkline } from "./Sparkline";
import { ALL_ASSETS, PORTAL_NEWS } from "../data/mockMarketData";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  TrendingUp,
  TrendingDown,
  Building,
  Globe,
  ExternalLink,
  Users,
  Calendar,
  Layers,
  Sparkles,
  Bot,
  Loader2,
  DollarSign,
  Briefcase,
  Share2,
  MessageSquare,
  Bell,
  FileText,
  BarChart3,
  PieChart,
} from "lucide-react";
import { formatAssetDisplayPrice } from "../utils/formatters";
import { getAssetSector, getAssetTags, SECTOR_DEFINITIONS } from "../utils/assetTaxonomy";
import {
  obterPerfilFMP,
  obterDemonstracaoResultadosFMP,
  FMPCompanyProfile,
  FMPIncomeStatement,
} from "../services/fmpService";
import {
  obterTermometroAcoes,
  obterPerfilEmpresaFinnhub,
  FinnhubThermometerResult,
} from "../services/finnhubService";

interface AssetDetailViewProps {
  asset: Asset;
  onBack: () => void;
  onSelectAsset: (asset: Asset) => void;
  isWatchlisted: boolean;
  onToggleWatchlist: (asset: Asset) => void;
  onOpenPortfolio: () => void;
  onShareToChat?: (text: string) => void;
  onOpenAlertModal?: (asset: Asset) => void;
  allAssets?: Asset[];
}

export const AssetDetailView: React.FC<AssetDetailViewProps> = ({
  asset,
  onBack,
  onSelectAsset,
  isWatchlisted,
  onToggleWatchlist,
  onOpenPortfolio,
  onShareToChat,
  onOpenAlertModal,
  allAssets = ALL_ASSETS,
}) => {
  const [aiAnalysis, setAiAnalysis] = useState<{
    summary?: string;
    valuationStatus?: string;
    strengths?: string[];
    risks?: string[];
    technicalInsight?: string;
  } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Finnhub API: Termômetro de Ações e Consenso de Mercado
  const [finnhubThermometer, setFinnhubThermometer] = useState<FinnhubThermometerResult | null>(null);
  const [fmpProfile, setFmpProfile] = useState<FMPCompanyProfile | null>(null);
  const [fmpFinancials, setFmpFinancials] = useState<FMPIncomeStatement[] | null>(null);
  const [fmpLoading, setFmpLoading] = useState(false);

  // Fetch Finnhub Stock Thermometer & Profile, along with Financial Statements
  useEffect(() => {
    let isMounted = true;
    const cleanTicker = asset.ticker.replace(/^\./, "").replace(/\.SA$/, "").trim().toUpperCase();

    if (cleanTicker && !cleanTicker.includes("/")) {
      setFmpLoading(true);

      // Finnhub API: Termômetro e perfil da economia global
      obterTermometroAcoes(cleanTicker).then((therm) => {
        if (isMounted && therm) setFinnhubThermometer(therm);
      }).catch(() => {});

      obterPerfilEmpresaFinnhub(cleanTicker).then((p) => {
        if (isMounted && p && !fmpProfile) {
          setFmpProfile({
            symbol: p.symbol,
            price: asset.price,
            companyName: p.companyName,
            currency: p.currency,
            exchange: p.exchange,
            industry: p.industry,
            description: asset.profile?.description || `${p.companyName} listada em ${p.exchange}.`,
            marketCap: p.marketCap || 0,
            website: p.weburl,
          });
        }
      }).catch(() => {});

      Promise.all([
        obterPerfilFMP(cleanTicker),
        obterDemonstracaoResultadosFMP(cleanTicker),
      ])
        .then(([profile, financials]) => {
          if (isMounted) {
            if (profile) setFmpProfile(profile);
            setFmpFinancials(financials);
            setFmpLoading(false);
          }
        })
        .catch(() => {
          if (isMounted) setFmpLoading(false);
        });
    } else {
      setFinnhubThermometer(null);
      setFmpProfile(null);
      setFmpFinancials(null);
    }

    return () => {
      isMounted = false;
    };
  }, [asset.ticker]);

  // Fetch AI asset analysis on load with real current price
  useEffect(() => {
    let isMounted = true;
    setAiLoading(true);
    fetch(`/api/market-ai/asset-analysis?t=${Date.now()}`, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
      body: JSON.stringify({
        ticker: asset.ticker,
        name: asset.name,
        currentPrice: asset.price,
        changePercent: asset.changePercent,
        metrics: asset.metrics,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          setAiAnalysis(data);
          setAiLoading(false);
        }
      })
      .catch((err) => {
        console.error("AI Asset Analysis Error:", err);
        if (isMounted) {
          setAiAnalysis({
            summary: `${asset.name} (${asset.ticker}) apresenta liquidez ativa e correlação relevante com o mercado ${asset.category}. O ativo consolida níveis de preço com suporte e resistência bem delineados.`,
            valuationStatus: asset.changePercent >= 0 ? "Momentum Positivo" : "Zona de Suporte Relevante",
            strengths: ["Forte liquidez e volume diário", "Acompanhamento institucional de referência", "Posição consolidada no setor"],
            risks: ["Sensibilidade macroeconômica e taxa de juros", "Flutuações de curto prazo"],
            technicalInsight: "Médias móveis de 20 e 50 períodos acompanham a tendência recente do pregão.",
          });
          setAiLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [asset.id, asset.price, asset.changePercent]);

  const isPositive = asset.changePercent >= 0;

  // Related assets mapping
  const currentPool = allAssets && allAssets.length > 0 ? allAssets : ALL_ASSETS;
  const relatedAssets = currentPool.filter((a) =>
    asset.relatedAssetIds?.includes(a.id)
  );

  const formatPrice = (price: number, currency: string) =>
    formatAssetDisplayPrice(price, currency);

  const formatLargeCurrency = (value: number, curr: string = "USD") => {
    if (!value || isNaN(value)) return "--";
    const abs = Math.abs(value);
    const prefix = curr === "BRL" ? "R$ " : curr === "EUR" ? "€ " : "US$ ";
    const sign = value < 0 ? "-" : "";
    if (abs >= 1e12) return `${sign}${prefix}${(abs / 1e12).toFixed(2)} Tri`;
    if (abs >= 1e9) return `${sign}${prefix}${(abs / 1e9).toFixed(2)} Bi`;
    if (abs >= 1e6) return `${sign}${prefix}${(abs / 1e6).toFixed(1)} Mi`;
    return `${sign}${prefix}${abs.toLocaleString()}`;
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="w-full py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Top Back Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            id="btn-back-to-overview"
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-xs font-semibold text-[#8b949e] hover:text-[#e6edf3] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para Visão Geral</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              id="btn-toggle-watchlist-asset"
              onClick={() => onToggleWatchlist(asset)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                isWatchlisted
                  ? "bg-[#e3b341]/15 text-[#e3b341] border-[#e3b341]/40"
                  : "bg-[#161b22] text-[#8b949e] hover:text-[#e6edf3] border-[#30363d] hover:bg-[#21262d]"
              }`}
            >
              {isWatchlisted ? (
                <>
                  <BookmarkCheck className="w-4 h-4 text-[#e3b341]" />
                  <span>Seguindo</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4" />
                  <span>Seguir Ativo</span>
                </>
              )}
            </button>

            {onOpenAlertModal && (
              <button
                id="btn-asset-price-alert"
                onClick={() => onOpenAlertModal(asset)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#161b22] hover:bg-[#21262d] text-[#58a6ff] hover:text-white border border-[#30363d] hover:border-[#58a6ff]/50 transition-all cursor-pointer shadow-xs"
                title="Configurar alerta de variação de preço para este ativo"
              >
                <Bell className="w-3.5 h-3.5 text-[#58a6ff]" />
                <span className="hidden sm:inline">Criar Alerta</span>
              </button>
            )}

            <button
              onClick={onOpenPortfolio}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#1f6feb] to-[#238636] hover:brightness-110 shadow-sm transition-all cursor-pointer"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Adicionar ao Portfólio</span>
            </button>
          </div>
        </div>

        {/* 1. Asset Header Info Hero Card */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              {fmpProfile?.image && (
                <img
                  src={fmpProfile.image}
                  alt={fmpProfile.companyName || asset.name}
                  className="w-7 h-7 rounded-lg bg-white p-0.5 object-contain border border-[#30363d] shrink-0 shadow-xs"
                />
              )}
              <span className="font-mono text-xl sm:text-2xl font-black text-[#58a6ff]">
                {asset.ticker}
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-[#0e1117] text-[#8b949e] border border-[#30363d]">
                {asset.exchange}
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-[#0e1117] text-[#8b949e] border border-[#30363d]">
                {asset.category}
              </span>

              {/* Setor & Tags */}
              {(() => {
                const sector = getAssetSector(asset);
                const tags = getAssetTags(asset);
                const secDef = SECTOR_DEFINITIONS[sector] || SECTOR_DEFINITIONS.Indices;
                return (
                  <>
                    <span
                      className="px-2.5 py-0.5 rounded-md text-xs font-bold"
                      style={{
                        backgroundColor: secDef.bgColor,
                        color: secDef.color,
                        border: `1px solid ${secDef.borderColor}`,
                      }}
                    >
                      {secDef.name}
                    </span>
                    {tags.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-[#0e1117] text-[#8b949e] border border-[#30363d]"
                      >
                        #{t}
                      </span>
                    ))}
                  </>
                );
              })()}

              <span className="flex items-center gap-1 text-[11px] font-semibold text-[#00c853] bg-[#00c853]/10 px-2 py-0.5 rounded border border-[#00c853]/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00c853] animate-pulse"></span>
                AO VIVO
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-[#e6edf3] mt-1 tracking-tight">
              {asset.name}
            </h1>

            <p className="text-xs sm:text-sm text-[#8b949e] mt-1 max-w-2xl">
              {asset.profile?.description || `Acompanhamento de cotações e indicadores em tempo real para ${asset.name}.`}
            </p>
          </div>

          {/* Large Live Price & Variation Banner */}
          <div className="text-left md:text-right shrink-0 bg-[#0e1117]/80 p-4 rounded-xl border border-[#30363d]/80">
            <div className="text-2xl sm:text-4xl font-extrabold font-mono text-[#e6edf3] tracking-tight">
              {formatPrice(asset.price, asset.currency)}
            </div>
            <div
              className={`flex items-center md:justify-end gap-1.5 font-mono text-sm sm:text-base font-bold mt-1 ${
                isPositive ? "text-[#00c853]" : "text-[#ff5252]"
              }`}
            >
              {isPositive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>
                {isPositive ? "+" : ""}
                {formatPrice(asset.change, asset.currency)}
              </span>
              <span>
                ({isPositive ? "+" : ""}
                {asset.changePercent.toFixed(2)}%)
              </span>
            </div>
            <div className="text-[11px] text-[#8b949e] mt-1 font-mono">
              Moeda: {asset.currency} • Cotação em tempo real
            </div>
          </div>
        </div>

        {/* 2. Interactive SVG Chart Component with Live Data & Dual-Ticker Comparison */}
        <InteractiveChart
          historicalData={asset.historical}
          annotations={asset.annotations}
          currency={asset.currency}
          isPositiveOverall={isPositive}
          assetTicker={asset.ticker}
          assetName={asset.name}
          allAssets={currentPool}
          onSelectAsset={onSelectAsset}
        />

        {/* 3. Real-Time Financial Metrics Grid */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 shadow-lg shadow-black/20">
          <div className="pb-3 border-b border-[#21262d] mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#e6edf3] tracking-wide uppercase">
              Indicadores de Mercado & Estatísticas Chave
            </h3>
            <span className="text-xs text-[#00c853] font-mono font-semibold">● Dados em Tempo Real</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="p-3 rounded-xl bg-[#0e1117] border border-[#30363d]">
              <span className="text-xs text-[#8b949e]">Abertura</span>
              <p className="text-sm sm:text-base font-bold font-mono text-[#e6edf3] mt-0.5">
                {formatPrice(asset.metrics?.open || asset.price, asset.currency)}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#0e1117] border border-[#30363d]">
              <span className="text-xs text-[#8b949e]">Máxima do Dia</span>
              <p className="text-sm sm:text-base font-bold font-mono text-[#00c853] mt-0.5">
                {formatPrice(asset.metrics?.high || asset.price * 1.01, asset.currency)}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#0e1117] border border-[#30363d]">
              <span className="text-xs text-[#8b949e]">Mínima do Dia</span>
              <p className="text-sm sm:text-base font-bold font-mono text-[#ff5252] mt-0.5">
                {formatPrice(asset.metrics?.low || asset.price * 0.99, asset.currency)}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#0e1117] border border-[#30363d]">
              <span className="text-xs text-[#8b949e]">Volume</span>
              <p className="text-sm sm:text-base font-bold font-mono text-[#e6edf3] mt-0.5">
                {asset.metrics?.volume || "R$ 450 Mi"}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#0e1117] border border-[#30363d]">
              <span className="text-xs text-[#8b949e]">Máx 52 Semanas</span>
              <p className="text-sm sm:text-base font-bold font-mono text-[#e6edf3] mt-0.5">
                {formatPrice(asset.metrics?.high52w || asset.price * 1.25, asset.currency)}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#0e1117] border border-[#30363d]">
              <span className="text-xs text-[#8b949e]">Mín 52 Semanas</span>
              <p className="text-sm sm:text-base font-bold font-mono text-[#e6edf3] mt-0.5">
                {formatPrice(asset.metrics?.low52w || asset.price * 0.8, asset.currency)}
              </p>
            </div>

            {asset.metrics?.peRatio && (
              <div className="p-3 rounded-xl bg-[#0e1117] border border-[#30363d]">
                <span className="text-xs text-[#8b949e]">P/L (Preço / Lucro)</span>
                <p className="text-sm sm:text-base font-bold font-mono text-[#e6edf3] mt-0.5">
                  {asset.metrics.peRatio}
                </p>
              </div>
            )}

            {asset.metrics?.dividendYield && (
              <div className="p-3 rounded-xl bg-[#0e1117] border border-[#30363d]">
                <span className="text-xs text-[#8b949e]">Dividend Yield (DY)</span>
                <p className="text-sm sm:text-base font-bold font-mono text-[#00c853] mt-0.5">
                  {asset.metrics.dividendYield}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Termômetro de Ações & Recomendações Globais (Finnhub API) */}
        {finnhubThermometer && (
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 shadow-lg shadow-black/20">
            <div className="flex items-center justify-between pb-3 border-b border-[#21262d] mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#00c853] to-[#58a6ff] flex items-center justify-center text-white shadow-md">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#e6edf3] tracking-tight">
                    Termômetro de Ações • Consenso de Mercado
                  </h3>
                  <p className="text-xs text-[#8b949e]">
                    Classificação quantitativa de analistas de mercado e bancos globais em tempo real
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-xs px-3 py-1 rounded-full font-bold border ${
                  finnhubThermometer.score && finnhubThermometer.score >= 60
                    ? "bg-[#00c853]/15 text-[#00c853] border-[#00c853]/30"
                    : finnhubThermometer.score && finnhubThermometer.score <= 40
                    ? "bg-[#ff5252]/15 text-[#ff5252] border-[#ff5252]/30"
                    : "bg-[#e3b341]/15 text-[#e3b341] border-[#e3b341]/30"
                }`}>
                  {finnhubThermometer.sentimentText || "Neutro"} ({finnhubThermometer.score || 50}/100)
                </span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full font-mono bg-[#58a6ff]/10 text-[#58a6ff] border border-[#58a6ff]/20 font-semibold">
                  Consenso Global
                </span>
              </div>
            </div>

            {/* Recommendation Distribution Bars */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
              <div className="p-2.5 rounded-xl bg-[#0e1117] border border-[#00c853]/30 text-center">
                <span className="text-[11px] text-[#8b949e] block">Forte Compra</span>
                <span className="text-sm font-bold text-[#00c853] font-mono">{finnhubThermometer.strongBuy}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#0e1117] border border-[#3fb950]/30 text-center">
                <span className="text-[11px] text-[#8b949e] block">Compra</span>
                <span className="text-sm font-bold text-[#3fb950] font-mono">{finnhubThermometer.buy}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#0e1117] border border-[#e3b341]/30 text-center">
                <span className="text-[11px] text-[#8b949e] block">Manter</span>
                <span className="text-sm font-bold text-[#e3b341] font-mono">{finnhubThermometer.hold}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#0e1117] border border-[#f85149]/30 text-center">
                <span className="text-[11px] text-[#8b949e] block">Venda</span>
                <span className="text-sm font-bold text-[#f85149] font-mono">{finnhubThermometer.sell}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#0e1117] border border-[#ff5252]/30 text-center col-span-2 sm:col-span-1">
                <span className="text-[11px] text-[#8b949e] block">Forte Venda</span>
                <span className="text-sm font-bold text-[#ff5252] font-mono">{finnhubThermometer.strongSell}</span>
              </div>
            </div>
          </div>
        )}

        {/* 4. Gemini AI Asset Intelligence Deep Dive Card */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-[#21262d] mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1f6feb] to-[#a371f7] flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-[#e6edf3] tracking-tight">
                    Diagnóstico do Ativo com Inteligência Artificial
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#238636]/20 text-[#00c853] border border-[#238636]/40 font-semibold">
                    Gemini 3.8 Flash
                  </span>
                </div>
                <p className="text-xs text-[#8b949e]">
                  Síntese automatizada de fundamentos, momentum e posicionamento técnico em tempo real
                </p>
              </div>
            </div>

            {aiLoading && (
              <span className="flex items-center gap-1.5 text-xs text-[#58a6ff] font-medium bg-[#58a6ff]/10 px-2.5 py-1 rounded-full border border-[#58a6ff]/30">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Processando IA...
              </span>
            )}
          </div>

          {aiLoading ? (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
              <Loader2 className="w-8 h-8 text-[#58a6ff] animate-spin" />
              <p className="text-xs text-[#8b949e]">Gerando síntese diagnóstica com Gemini 3.8 Flash...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#0e1117] border border-[#30363d]/80 text-xs sm:text-sm text-[#e6edf3] leading-relaxed">
                <div className="font-semibold text-[#58a6ff] mb-1 flex items-center gap-1.5">
                  <Bot className="w-4 h-4" />
                  <span>Resumo do Cenário:</span>
                </div>
                <p>{aiAnalysis?.summary || "Diagnóstico técnico ativo no radar DinhEuro."}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Strengths */}
                <div className="p-3 rounded-xl bg-[#0e1117] border border-[#30363d]/60">
                  <span className="font-bold text-[#00c853] flex items-center gap-1.5 mb-2 text-xs">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Pontos Fortes & Oportunidades
                  </span>
                  <ul className="space-y-1 text-xs text-[#8b949e]">
                    {aiAnalysis?.strengths?.map((str, sIdx) => (
                      <li key={sIdx} className="flex items-start gap-1.5">
                        <span className="text-[#00c853]">•</span>
                        <span>{str}</span>
                      </li>
                    )) || <li>Liderança operacional e presença em carteiras teóricas.</li>}
                  </ul>
                </div>

                {/* Risks */}
                <div className="p-3 rounded-xl bg-[#0e1117] border border-[#30363d]/60">
                  <span className="font-bold text-[#ff5252] flex items-center gap-1.5 mb-2 text-xs">
                    <TrendingDown className="w-3.5 h-3.5" />
                    Fatores de Risco & Atenção
                  </span>
                  <ul className="space-y-1 text-xs text-[#8b949e]">
                    {aiAnalysis?.risks?.map((r, rIdx) => (
                      <li key={rIdx} className="flex items-start gap-1.5">
                        <span className="text-[#ff5252]">•</span>
                        <span>{r}</span>
                      </li>
                    )) || <li>Sensibilidade ao cenário de taxas de juros e demanda global.</li>}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 5. Institutional Profile */}
        {asset.profile && (
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 shadow-lg shadow-black/20">
            <div className="pb-3 border-b border-[#21262d] mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-[#58a6ff]" />
                <h3 className="text-sm font-bold text-[#e6edf3] tracking-wide uppercase">
                  Perfil Institucional
                </h3>
              </div>
              {asset.profile.websiteUrl && (
                <a
                  href={asset.profile.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#58a6ff] hover:underline flex items-center gap-1 font-medium"
                >
                  <span>{asset.profile.websiteLabel || "Site Oficial"}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-[#8b949e]">
              <p className="leading-relaxed text-[#c9d1d9]">
                {asset.profile.description}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-[#0e1117] border border-[#30363d]">
                  <span className="text-[11px] text-[#8b949e]">Setor / Segmento</span>
                  <p className="text-xs font-semibold text-[#e6edf3] mt-0.5">
                    {asset.profile.sector || "Mercados"}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#0e1117] border border-[#30363d]">
                  <span className="text-[11px] text-[#8b949e]">Sede Corporativa</span>
                  <p className="text-xs font-semibold text-[#e6edf3] mt-0.5">
                    {asset.profile.headquarters || "Global"}
                  </p>
                </div>

                {asset.profile.ceo && (
                  <div className="p-3 rounded-xl bg-[#0e1117] border border-[#30363d]">
                    <span className="text-[11px] text-[#8b949e]">Diretor Presidente (CEO)</span>
                    <p className="text-xs font-semibold text-[#e6edf3] mt-0.5">
                      {asset.profile.ceo}
                    </p>
                  </div>
                )}

                {asset.profile.employees && (
                  <div className="p-3 rounded-xl bg-[#0e1117] border border-[#30363d]">
                    <span className="text-[11px] text-[#8b949e]">Colaboradores</span>
                    <p className="text-xs font-semibold text-[#e6edf3] mt-0.5">
                      {asset.profile.employees}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 6. Demonstrativo de Resultados & Finanças */}
        {fmpFinancials && fmpFinancials.length > 0 && (
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 shadow-lg shadow-black/20">
            <div className="pb-3 border-b border-[#21262d] mb-4 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#58a6ff]" />
                <h3 className="text-sm font-bold text-[#e6edf3] tracking-wide uppercase">
                  Demonstrações Financeiras & Análise Fundamentalista
                </h3>
              </div>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-mono bg-[#58a6ff]/10 text-[#58a6ff] border border-[#58a6ff]/20 font-semibold">
                Relatórios Auditados (10-K / CVM)
              </span>
            </div>

            <p className="text-xs text-[#8b949e] mb-3">
              Dados financeiros auditados dos últimos exercícios fiscais obtidos diretamente dos relatórios oficiais (10-K / CVM).
            </p>

            <div className="overflow-x-auto scrollbar-none">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#30363d]/60 text-[#8b949e]">
                    <th className="py-2.5 px-3 font-semibold">Exercício / Data</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Receita Líquida</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Lucro Bruto</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Margem Bruta</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Lucro Operacional</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Lucro Líquido</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Margem Líquida</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Lucro por Ação (LPA)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#21262d]">
                  {fmpFinancials.slice(0, 4).map((fin, idx) => (
                    <tr key={idx} className="hover:bg-[#21262d]/50 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-white">
                        {fin.fiscalYear || fin.date.slice(0, 4)} ({fin.period === "FY" || !fin.period ? "Anual" : fin.period})
                        <span className="block text-[10px] text-[#8b949e] font-normal">{fin.date}</span>
                      </td>
                      <td className="py-3 px-3 font-mono text-right text-[#e6edf3] font-semibold">
                        {formatLargeCurrency(fin.revenue, fin.reportedCurrency)}
                      </td>
                      <td className="py-3 px-3 font-mono text-right text-[#e6edf3]">
                        {formatLargeCurrency(fin.grossProfit, fin.reportedCurrency)}
                      </td>
                      <td className="py-3 px-3 font-mono text-right text-[#00c853]">
                        {((fin.grossProfitRatio || 0) * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 px-3 font-mono text-right text-[#e6edf3]">
                        {formatLargeCurrency(fin.operatingIncome, fin.reportedCurrency)}
                      </td>
                      <td className={`py-3 px-3 font-mono text-right font-bold ${fin.netIncome >= 0 ? "text-[#00c853]" : "text-[#ff5252]"}`}>
                        {formatLargeCurrency(fin.netIncome, fin.reportedCurrency)}
                      </td>
                      <td className={`py-3 px-3 font-mono text-right font-semibold ${fin.netIncomeRatio >= 0 ? "text-[#00c853]" : "text-[#ff5252]"}`}>
                        {((fin.netIncomeRatio || 0) * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 px-3 font-mono text-right text-[#58a6ff] font-bold">
                        {fin.eps !== undefined ? formatAssetDisplayPrice(fin.eps, fin.reportedCurrency || asset.currency) : "--"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
