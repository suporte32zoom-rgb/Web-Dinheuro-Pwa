import React from "react";
import {
  Home,
  LineChart,
  BarChart2,
  FileText,
  Layers,
  PieChart,
  Compass,
  Newspaper,
  Bell,
  Cpu,
  Zap,
  Settings,
  HelpCircle,
  Shield,
} from "lucide-react";

export type SidebarNavAction =
  | "home"
  | "markets"
  | "charts"
  | "orders"
  | "positions"
  | "portfolio"
  | "analysis"
  | "news"
  | "alerts"
  | "strategies"
  | "simulator"
  | "settings"
  | "help";

export interface TradingDeskSidebarProps {
  activeAction?: string;
  activeView?: string;
  onSelectAction?: (action: string) => void;
  onSelectView?: (viewId: string) => void;
  onGoHome?: () => void;
  mode?: "SIMULATED" | "REAL" | string;
}

export const TradingDeskSidebar: React.FC<TradingDeskSidebarProps> = ({
  activeAction,
  activeView,
  onSelectAction,
  onSelectView,
  onGoHome,
  mode = "SIMULATED",
}) => {
  const currentActive = activeAction || activeView || "charts";

  const navItems: { id: SidebarNavAction; label: string; icon: React.ReactNode }[] = [
    { id: "home", label: "Início do Portal", icon: <Home className="w-4 h-4" /> },
    { id: "markets", label: "Mercado em Tempo Real", icon: <BarChart2 className="w-4 h-4" /> },
    { id: "charts", label: "Gráficos Avançados", icon: <LineChart className="w-4 h-4" /> },
    { id: "orders", label: "Livro de Ordens", icon: <FileText className="w-4 h-4" /> },
    { id: "positions", label: "Minhas Posições", icon: <Layers className="w-4 h-4" /> },
    { id: "portfolio", label: "Carteira & Custódia", icon: <PieChart className="w-4 h-4" /> },
    { id: "analysis", label: "Análises Técnicas", icon: <Compass className="w-4 h-4" /> },
    { id: "news", label: "Notícias & Fatos Relevantes", icon: <Newspaper className="w-4 h-4" /> },
    { id: "alerts", label: "Alertas de Preço", icon: <Bell className="w-4 h-4" /> },
    { id: "strategies", label: "Estratégias de Day Trade", icon: <Cpu className="w-4 h-4" /> },
    { id: "simulator", label: mode === "SIMULATED" ? "Modo Simulador Ativo" : "Conta Real DMA2", icon: <Zap className="w-4 h-4" /> },
    { id: "settings", label: "Travas de Risco & Parâmetros", icon: <Settings className="w-4 h-4" /> },
    { id: "help", label: "Atalhos & Ajuda", icon: <HelpCircle className="w-4 h-4" /> },
  ];

  const handleSelect = (id: string) => {
    if (id === "home") {
      if (onGoHome) onGoHome();
      if (onSelectAction) onSelectAction("home");
      if (onSelectView) onSelectView("home");
      return;
    }
    if (onSelectAction) onSelectAction(id);
    if (onSelectView) onSelectView(id);
  };

  return (
    <aside
      aria-label="Menu Lateral do Terminal"
      className="w-12 bg-[#0c1017] border-r border-[#21262d] flex flex-col items-center justify-between py-2 shrink-0 select-none z-10"
    >
      {/* Top Brand Monogram */}
      <div className="flex flex-col items-center gap-2 mb-1">
        <button
          type="button"
          onClick={() => handleSelect("home")}
          title="DinhEuro - Retornar à Página Principal"
          className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1f6feb] to-[#238636] flex items-center justify-center text-white font-black text-xs shadow-md shadow-[#1f6feb]/20 hover:scale-105 transition-transform cursor-pointer"
        >
          D€
        </button>
        <div className="w-6 h-[1px] bg-[#21262d]" />
      </div>

      {/* Nav Icons Stack */}
      <nav className="flex flex-col items-center gap-1 w-full flex-1 overflow-y-auto scrollbar-none py-1">
        {navItems.map((item) => {
          const isActive = currentActive === item.id || (item.id === "charts" && currentActive === "chart");
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id)}
              title={item.label}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all relative group cursor-pointer ${
                isActive
                  ? "bg-[#21262d] text-[#58a6ff] border border-[#58a6ff]/50 shadow-xs"
                  : "text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#161b22]"
              }`}
            >
              {item.icon}

              {/* Tooltip on hover */}
              <span className="absolute left-10 ml-2 px-2 py-1 rounded bg-[#161b22] text-white text-[11px] font-semibold whitespace-nowrap shadow-xl border border-[#30363d] opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                {item.label}
              </span>

              {/* Left active marker indicator */}
              {isActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-[#58a6ff] rounded-r" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Institutional Seal */}
      <div className="flex flex-col items-center gap-1 pt-1 mt-1 border-t border-[#21262d] w-full">
        <div
          title="Terminal Seguro DinhEuro Institutional DMA2"
          className="w-8 h-8 rounded-lg bg-[#161b22] border border-[#30363d] flex flex-col items-center justify-center text-[#00c853] hover:border-[#00c853] transition-colors cursor-pointer"
        >
          <Shield className="w-3.5 h-3.5" />
          <span className="text-[7.5px] font-bold tracking-tight text-[#8b949e]">PRO</span>
        </div>
      </div>
    </aside>
  );
};
