import React from "react";
import { RegionalTab } from "../types/finance";
import {
  Globe,
  DollarSign,
  Coins,
  FileSpreadsheet,
  TrendingUp,
  Landmark,
} from "lucide-react";

interface NavigationTabsProps {
  activeTab: RegionalTab;
  onSelectTab: (tab: RegionalTab) => void;
}

const TABS: { id: RegionalTab; label: string; icon: React.ReactNode; badge?: string }[] = [
  { id: "EUA", label: "EUA", icon: <Landmark className="w-3.5 h-3.5" /> },
  { id: "Europa", label: "Europa", icon: <Globe className="w-3.5 h-3.5" /> },
  { id: "Ásia", label: "Ásia", icon: <TrendingUp className="w-3.5 h-3.5" /> },
  { id: "América Latina", label: "América Latina", icon: <Globe className="w-3.5 h-3.5" />, badge: "B3" },
  { id: "Moedas", label: "Moedas", icon: <DollarSign className="w-3.5 h-3.5" /> },
  { id: "Criptomoedas", label: "Criptomoedas", icon: <Coins className="w-3.5 h-3.5" />, badge: "24h" },
  { id: "Contratos futuros", label: "Contratos futuros", icon: <FileSpreadsheet className="w-3.5 h-3.5" /> },
];

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  onSelectTab,
}) => {
  return (
    <nav aria-label="Categorias de Mercado" className="w-full border-b border-[#21262d] bg-[#0e1117]/80 backdrop-blur-xs py-2.5 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 nav-scroll-container flex-nowrap"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                type="button"
                key={tab.id}
                id={`tab-${tab.id.toLowerCase().replace(/\s+/g, "-")}`}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer shrink-0 ${
                  isActive
                    ? "bg-[#21262d] text-white border border-[#58a6ff] shadow-sm shadow-[#58a6ff]/10"
                    : "bg-[#161b22]/70 text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d]/60 border border-[#30363d]/60"
                }`}
              >
                <span className={isActive ? "text-[#58a6ff]" : "text-[#8b949e]"}>
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                      isActive
                        ? "bg-[#58a6ff]/20 text-[#58a6ff]"
                        : "bg-[#30363d] text-[#8b949e]"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
