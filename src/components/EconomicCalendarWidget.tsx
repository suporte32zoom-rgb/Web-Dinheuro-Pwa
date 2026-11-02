import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  CalendarDays,
  Flame,
  Clock,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Bell,
  SlidersHorizontal,
  Info,
  TrendingUp,
  Landmark,
  Percent,
  Briefcase,
  Layers,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import {
  EconomicEvent,
  EventImpact,
  EconomicEventCategory,
  Asset,
} from "../types/finance";
import {
  fetchEconomicCalendar,
  getRelativeEventTime,
} from "../services/economicCalendarService";

interface EconomicCalendarWidgetProps {
  onSelectTicker?: (ticker: string) => void;
  onOpenNotifications?: () => void;
}

export const EconomicCalendarWidget: React.FC<EconomicCalendarWidgetProps> = ({
  onSelectTicker,
  onOpenNotifications,
}) => {
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [activeCountry, setActiveCountry] = useState<string>("all");
  const [onlyHighImpact, setOnlyHighImpact] = useState<boolean>(false);
  const [expandedEventId, setExpandedEventId] = useState<string | null>("evt-copom-selic");
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [nowTick, setNowTick] = useState<number>(Date.now());

  // Atualiza tick a cada 30 segundos para contagem regressiva
  useEffect(() => {
    const timer = setInterval(() => setNowTick(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const loadCalendar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchEconomicCalendar();
      setEvents(data);
      setLastUpdated(
        new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch (err) {
      console.warn("[EconomicCalendarWidget] Falha ao carregar calendário:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCalendar();
    // Atualiza a cada 3 minutos
    const interval = setInterval(loadCalendar, 180000);
    return () => clearInterval(interval);
  }, [loadCalendar]);

  // Filtra os eventos
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (activeCategory !== "all" && ev.category !== activeCategory) return false;
      if (activeCountry !== "all" && ev.country !== activeCountry) return false;
      if (onlyHighImpact && ev.impact !== "high") return false;
      return true;
    });
  }, [events, activeCategory, activeCountry, onlyHighImpact]);

  // Próximo evento de alto impacto (Hero Event)
  const nextMajorEvent = useMemo(() => {
    const highImpactFuture = events.filter((e) => {
      const isHigh = e.impact === "high" || e.category === "interest_rate";
      const isFuture = new Date(e.datetime).getTime() > nowTick - 3600000;
      return isHigh && isFuture;
    });
    return highImpactFuture[0] || events[0] || null;
  }, [events, nowTick]);

  // Agrupamento por data amigável
  const groupedEvents = useMemo(() => {
    const groups: Record<string, { label: string; date: string; items: EconomicEvent[] }> = {};

    filteredEvents.forEach((ev) => {
      const d = ev.date;
      if (!groups[d]) {
        const evDate = new Date(`${ev.date}T12:00:00`);
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        let dateLabel = "";
        if (evDate.toDateString() === today.toDateString()) {
          dateLabel = "Hoje";
        } else if (evDate.toDateString() === tomorrow.toDateString()) {
          dateLabel = "Amanhã";
        } else {
          const weekday = evDate.toLocaleDateString("pt-BR", { weekday: "long" });
          const day = evDate.getDate();
          const month = evDate.toLocaleDateString("pt-BR", { month: "long" });
          dateLabel = `${weekday.charAt(0).toUpperCase() + weekday.slice(1)}, ${day} de ${month}`;
        }

        groups[d] = {
          label: dateLabel,
          date: d,
          items: [],
        };
      }
      groups[d].items.push(ev);
    });

    return Object.values(groups);
  }, [filteredEvents]);

  // Categorias disponíveis
  const categories: Array<{ id: string; label: string; icon: any }> = [
    { id: "all", label: "Todos os Eventos", icon: Layers },
    { id: "interest_rate", label: "Taxas de Juros", icon: Percent },
    { id: "inflation", label: "Inflação (IPCA/CPI)", icon: TrendingUp },
    { id: "employment", label: "Emprego & Payroll", icon: Briefcase },
    { id: "central_bank", label: "Bancos Centrais", icon: Landmark },
  ];

  // Países disponíveis
  const countries = [
    { id: "all", label: "Global", flag: "🌐" },
    { id: "BR", label: "Brasil", flag: "🇧🇷" },
    { id: "US", label: "EUA", flag: "🇺🇸" },
    { id: "EU", label: "Europa", flag: "🇪🇺" },
    { id: "GB", label: "Reino Unido", flag: "🇬🇧" },
    { id: "JP", label: "Japão", flag: "🇯🇵" },
  ];

  const getImpactBadge = (impact: EventImpact) => {
    switch (impact) {
      case "high":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#ff5252]/10 text-[#ff5252] border border-[#ff5252]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff5252] animate-pulse" />
            Alto Impacto
          </span>
        );
      case "medium":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#e3b341]/10 text-[#e3b341] border border-[#e3b341]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#e3b341]" />
            Médio Impacto
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#30363d] text-[#8b949e]">
            Baixo Impacto
          </span>
        );
    }
  };

  return (
    <section
      aria-label="Calendário Econômico e Decisões de Juros"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-8 mb-6"
    >
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        {/* Glow de fundo */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-[#1f6feb]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-[#ff5252]/5 rounded-full blur-3xl pointer-events-none" />

        {/* 1. Header do Widget */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#30363d]">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1f6feb]/15 border border-[#1f6feb]/30 flex items-center justify-center text-[#58a6ff] shrink-0">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-[#e6edf3] tracking-tight">
                  Calendário Econômico & Decisões de Juros
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#00c853]/15 text-[#00c853] border border-[#00c853]/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00c853] animate-ping" />
                  TEMPO REAL
                </span>
              </div>
              <p className="text-xs text-[#8b949e] mt-0.5">
                Acompanhe reuniões do Copom, Federal Reserve, inflação (IPCA/CPI) e os dados que movimentam B3 e Wall Street
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {lastUpdated && (
              <span className="text-[11px] font-mono text-[#8b949e] hidden md:inline">
                Sincronizado: {lastUpdated}
              </span>
            )}
            <button
              type="button"
              onClick={loadCalendar}
              disabled={loading}
              title="Atualizar calendário econômico"
              className="p-2 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-[#e6edf3] border border-[#30363d] transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#58a6ff]" : ""}`} />
            </button>
          </div>
        </div>

        {/* 2. Destaque do Próximo Grande Catalisador (Hero Banner) */}
        {nextMajorEvent && (
          <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-[#1f6feb]/10 via-[#161b22] to-[#ff5252]/10 border border-[#1f6feb]/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl mt-0.5">{nextMajorEvent.flag}</div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#1f6feb]/20 text-[#58a6ff] border border-[#1f6feb]/40">
                    PRÓXIMO DESTAQUE MACRO
                  </span>
                  {getImpactBadge(nextMajorEvent.impact)}
                </div>
                <h3 className="text-sm sm:text-base font-bold text-[#e6edf3] mt-1">
                  {nextMajorEvent.title}
                </h3>
                <p className="text-xs text-[#8b949e] mt-0.5 max-w-xl">
                  {nextMajorEvent.consensus}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 shrink-0 justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-[#30363d]">
              <div className="text-left md:text-right">
                <div className="text-[10px] text-[#8b949e] uppercase font-semibold">Projeção do Mercado</div>
                <div className="text-base sm:text-lg font-mono font-bold text-[#58a6ff]">
                  {nextMajorEvent.forecast || "Aguardando"}
                </div>
                <div className="text-[11px] font-mono text-[#8b949e]">
                  Anterior: <span className="text-[#e6edf3]">{nextMajorEvent.previous || "N/A"}</span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] text-[#8b949e] uppercase font-semibold flex items-center gap-1 justify-end">
                  <Clock className="w-3 h-3 text-[#ff5252]" />
                  Quando
                </div>
                <div className="text-xs sm:text-sm font-semibold text-[#e6edf3]">
                  {getRelativeEventTime(nextMajorEvent).label}
                </div>
                {onOpenNotifications && (
                  <button
                    type="button"
                    onClick={onOpenNotifications}
                    className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-[#58a6ff] hover:text-[#79c0ff] cursor-pointer"
                  >
                    <Bell className="w-3 h-3" />
                    Ativar Alerta
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 3. Barra de Filtros Interativos */}
        <div className="mt-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Categorias Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#1f6feb] text-white shadow-sm shadow-[#1f6feb]/30"
                      : "bg-[#0e1117] text-[#8b949e] hover:text-[#e6edf3] border border-[#30363d] hover:border-[#8b949e]/40"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* País & Filtro de Alto Impacto */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Seletor de País */}
            <div className="flex items-center bg-[#0e1117] border border-[#30363d] rounded-xl p-0.5">
              {countries.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveCountry(c.id)}
                  title={c.label}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                    activeCountry === c.id
                      ? "bg-[#21262d] text-[#e6edf3]"
                      : "text-[#8b949e] hover:text-[#e6edf3]"
                  }`}
                >
                  <span>{c.flag}</span>
                  <span className="hidden sm:inline text-[11px]">{c.label}</span>
                </button>
              ))}
            </div>

            {/* Toggle de Apenas Alto Impacto */}
            <button
              type="button"
              onClick={() => setOnlyHighImpact((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                onlyHighImpact
                  ? "bg-[#ff5252]/15 text-[#ff5252] border-[#ff5252]/40"
                  : "bg-[#0e1117] text-[#8b949e] hover:text-[#e6edf3] border-[#30363d]"
              }`}
            >
              <Flame className={`w-3.5 h-3.5 ${onlyHighImpact ? "text-[#ff5252]" : ""}`} />
              Alto Impacto
            </button>
          </div>
        </div>

        {/* 4. Lista Agrupada de Eventos */}
        <div className="mt-4 space-y-4">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-[#30363d] rounded-xl bg-[#0e1117]/50">
              <CalendarDays className="w-8 h-8 text-[#8b949e] mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-[#e6edf3]">
                Nenhum evento econômico com os filtros selecionados
              </p>
              <p className="text-xs text-[#8b949e] mt-1 max-w-sm mx-auto">
                Tente selecionar "Todos os Eventos" ou limpar o filtro de alto impacto para visualizar o calendário completo.
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveCategory("all");
                  setActiveCountry("all");
                  setOnlyHighImpact(false);
                }}
                className="mt-3 px-3 py-1.5 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-xs font-semibold text-[#58a6ff] cursor-pointer"
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            groupedEvents.map((group) => (
              <div key={group.date} className="space-y-2">
                {/* Data Header */}
                <div className="flex items-center gap-2 pt-2">
                  <div className="w-2 h-2 rounded-full bg-[#58a6ff]" />
                  <span className="text-xs font-bold text-[#e6edf3] tracking-wide uppercase">
                    {group.label}
                  </span>
                  <div className="h-px bg-[#30363d] flex-1" />
                </div>

                {/* Eventos do dia */}
                <div className="space-y-2">
                  {group.items.map((event) => {
                    const isExpanded = expandedEventId === event.id;
                    const timing = getRelativeEventTime(event);

                    return (
                      <div
                        key={event.id}
                        className={`rounded-xl border transition-all ${
                          isExpanded
                            ? "bg-[#0e1117] border-[#1f6feb]/50 shadow-md"
                            : "bg-[#0e1117]/80 hover:bg-[#0e1117] border-[#30363d] hover:border-[#8b949e]/40"
                        }`}
                      >
                        {/* Linha Principal do Evento */}
                        <div
                          onClick={() => setExpandedEventId(isExpanded ? null : event.id)}
                          className="p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer select-none"
                        >
                          {/* Coluna 1: Horário, Bandeira e Título */}
                          <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                            <div className="flex flex-col items-center justify-center min-w-[50px] shrink-0">
                              <span className="text-xs font-mono font-bold text-[#e6edf3]">
                                {event.time}
                              </span>
                              <span className="text-lg leading-none mt-0.5">{event.flag}</span>
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs sm:text-sm font-bold text-[#e6edf3] truncate">
                                  {event.title}
                                </span>
                                {getImpactBadge(event.impact)}
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#161b22] text-[#8b949e] border border-[#30363d]">
                                  {event.categoryLabel}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#8b949e] mt-0.5 truncate">
                                {event.consensus}
                              </p>
                            </div>
                          </div>

                          {/* Coluna 2: Dados Numéricos (Anterior / Projeção / Atual) */}
                          <div className="flex items-center gap-4 sm:gap-6 justify-between md:justify-end shrink-0 pl-14 md:pl-0 border-t md:border-t-0 pt-2 md:pt-0 border-[#30363d]/50">
                            <div className="text-left md:text-right">
                              <div className="text-[10px] text-[#8b949e] uppercase font-semibold">Anterior</div>
                              <div className="text-xs font-mono text-[#8b949e]">
                                {event.previous || "—"}
                              </div>
                            </div>

                            <div className="text-left md:text-right">
                              <div className="text-[10px] text-[#58a6ff] uppercase font-semibold">Projeção</div>
                              <div className="text-xs font-mono font-bold text-[#e6edf3]">
                                {event.forecast || "—"}
                              </div>
                            </div>

                            <div className="text-left md:text-right min-w-[60px]">
                              <div className="text-[10px] text-[#8b949e] uppercase font-semibold">Atual</div>
                              {event.actual ? (
                                <div className="text-xs font-mono font-bold text-[#00c853]">
                                  {event.actual}
                                </div>
                              ) : (
                                <div className="text-[11px] font-mono text-[#e3b341]">
                                  {timing.isPast ? "Aguardando" : "Agendado"}
                                </div>
                              )}
                            </div>

                            <div className="text-[#8b949e] pl-1">
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-[#58a6ff]" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Detalhes Expandidos (Explicação macro e ativos afetados) */}
                        {isExpanded && (
                          <div className="px-4 pb-4 pt-1 border-t border-[#30363d]/50 bg-[#161b22]/50 rounded-b-xl space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                              {/* Descrição do Evento */}
                              <div className="p-3 rounded-lg bg-[#0e1117] border border-[#30363d]">
                                <div className="text-[11px] font-bold text-[#58a6ff] uppercase flex items-center gap-1.5 mb-1">
                                  <Info className="w-3.5 h-3.5" />
                                  Sobre este Indicador
                                </div>
                                <p className="text-[#8b949e] leading-relaxed">
                                  {event.description}
                                </p>
                              </div>

                              {/* Impacto no Mercado & Investimentos */}
                              <div className="p-3 rounded-lg bg-[#0e1117] border border-[#30363d]">
                                <div className="text-[11px] font-bold text-[#e3b341] uppercase flex items-center gap-1.5 mb-1">
                                  <TrendingUp className="w-3.5 h-3.5" />
                                  Impacto no Mercado
                                </div>
                                <p className="text-[#8b949e] leading-relaxed">
                                  {event.importanceReason}
                                </p>
                              </div>
                            </div>

                            {/* Ativos Sensíveis / Relacionados */}
                            {event.affectedTickers && event.affectedTickers.length > 0 && (
                              <div className="flex items-center gap-2 flex-wrap pt-1">
                                <span className="text-[11px] text-[#8b949e] font-semibold">
                                  Ativos mais sensíveis à divulgação:
                                </span>
                                {event.affectedTickers.map((ticker) => (
                                  <button
                                    key={ticker}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (onSelectTicker) onSelectTicker(ticker);
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-[#21262d] hover:bg-[#30363d] text-[#e6edf3] hover:text-[#58a6ff] border border-[#30363d] transition-colors cursor-pointer"
                                  >
                                    {ticker}
                                    <ArrowUpRight className="w-3 h-3 text-[#8b949e]" />
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Ações Rápidas */}
                            <div className="flex items-center justify-between pt-2 border-t border-[#30363d]/40">
                              <span className="text-[11px] text-[#8b949e] flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#00c853]" />
                                Dados sincronizados com Banco Central e agências de estatística
                              </span>

                              {onOpenNotifications && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenNotifications();
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-xs font-semibold text-[#58a6ff] border border-[#30363d] transition-colors cursor-pointer"
                                >
                                  <Bell className="w-3.5 h-3.5" />
                                  Notificar-me no momento do evento
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* 5. Rodapé explicativo do widget */}
        <div className="mt-5 pt-4 border-t border-[#30363d] flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#8b949e]">
          <span>
            💡 <strong>Dica do Trader:</strong> Reuniões do Copom e Fed costumam gerar picos de volatilidade no fechamento e na abertura dos mercados subsequentes.
          </span>
          <span className="font-mono text-[#8b949e] shrink-0">
            Horário padrão: Brasília (BRT / UTC-3)
          </span>
        </div>
      </div>
    </section>
  );
};

export default EconomicCalendarWidget;
