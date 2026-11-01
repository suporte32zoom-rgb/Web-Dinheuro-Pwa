import React from "react";
import { BrandLogo } from "./BrandLogo";
import { ShieldCheck, Cookie, FileText, AlertTriangle, Info, Mail, ExternalLink } from "lucide-react";
import { LegalDocId } from "../types/legal";

interface FooterProps {
  onOpenLegalDoc?: (docId: LegalDocId) => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenLegalDoc }) => {
  const handleOpenDoc = (e: React.MouseEvent, docId: LegalDocId) => {
    e.preventDefault();
    if (onOpenLegalDoc) {
      onOpenLegalDoc(docId);
    } else {
      window.history.pushState({}, "", `/${docId}`);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  const handleResetCookies = (e: React.MouseEvent) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent("reopen-lgpd-preferences"));
  };

  return (
    <footer
      style={{
        paddingBottom: "max(24px, env(safe-area-inset-bottom))",
      }}
      className="w-full border-t border-[#21262d] bg-[#0e1117] text-[#8b949e] pt-10 pb-12 sm:pb-16 mt-12"
      id="main-footer"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top Footer Row: Brand and Main Description */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-[#21262d]">
          <div className="flex items-center gap-3">
            <BrandLogo size="sm" showText={true} showSubtitle={false} />
            <span className="text-xs text-[#8b949e] hidden sm:inline">
              — Portal Financeiro & Inteligência de Mercados Globais
            </span>
          </div>

          {/* Quick Legal Badges & DPO */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#161b22] border border-[#30363d] text-[#3fb950] font-mono text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00c853]" />
              <span>LGPD Compliant</span>
            </span>
            <a
              href="mailto:admin@dinheuro.com.br"
              className="inline-flex items-center gap-1.5 text-xs text-[#8b949e] hover:text-[#58a6ff] transition-colors"
              title="Contato oficial do Encarregado de Proteção de Dados (DPO)"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>DPO: admin@dinheuro.com.br</span>
            </a>
          </div>
        </div>

        {/* Middle Footer Row: Institutional Links Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 text-xs">
          {/* Termos de Uso */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-[#c9d1d9] uppercase tracking-wider block">
              Termos & Contratos
            </span>
            <a
              href="/termos-de-uso"
              onClick={(e) => handleOpenDoc(e, "termos-de-uso")}
              className="text-[#8b949e] hover:text-[#58a6ff] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Termos de Uso</span>
            </a>
          </div>

          {/* Privacidade & LGPD */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-[#c9d1d9] uppercase tracking-wider block">
              Privacidade & Dados
            </span>
            <a
              href="/politica-de-privacidade"
              onClick={(e) => handleOpenDoc(e, "politica-de-privacidade")}
              className="text-[#8b949e] hover:text-[#00c853] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Política de Privacidade</span>
            </a>
          </div>

          {/* Cookies & Rastreamento */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-[#c9d1d9] uppercase tracking-wider block">
              Cookies & PWA
            </span>
            <a
              href="/politica-de-cookies"
              onClick={(e) => handleOpenDoc(e, "politica-de-cookies")}
              className="text-[#8b949e] hover:text-[#e3b341] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Cookie className="w-3.5 h-3.5" />
              <span>Política de Cookies</span>
            </a>
          </div>

          {/* Sobre a Empresa */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-[#c9d1d9] uppercase tracking-wider block">
              Institucional
            </span>
            <a
              href="/sobre"
              onClick={(e) => handleOpenDoc(e, "sobre")}
              className="text-[#8b949e] hover:text-[#8957e5] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Info className="w-3.5 h-3.5" />
              <span>Sobre o DinhEuro</span>
            </a>
          </div>

          {/* Aviso Legal / Disclaimer */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-[#c9d1d9] uppercase tracking-wider block">
              Regulatório
            </span>
            <a
              href="/disclaimer"
              onClick={(e) => handleOpenDoc(e, "disclaimer")}
              className="text-[#8b949e] hover:text-[#f0883e] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Aviso Legal / Disclaimer</span>
            </a>
          </div>
        </div>

        {/* Action Row: Reset Cookie Preferences Button */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-[#21262d]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              id="btn-redefine-cookies"
              onClick={handleResetCookies}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-xs font-medium text-[#c9d1d9] hover:text-white transition-colors cursor-pointer"
              title="Abrir painel para alterar ou revogar consentimento de cookies e privacidade LGPD"
            >
              <Cookie className="w-3.5 h-3.5 text-[#e3b341]" />
              <span>Redefinir Preferências de Cookies</span>
            </button>

            <span className="text-[11px] text-[#8b949e]">
              Transparência ativa e conformidade com a Lei nº 13.709/2018 (LGPD).
            </span>
          </div>

          <div className="text-[11px] font-mono text-[#8b949e]">
            dinheuro.com.br • Hostinger Production Ready
          </div>
        </div>

        {/* Bottom Disclaimer & Copyright */}
        <div className="pt-4 border-t border-[#21262d] text-[11px] leading-relaxed text-[#8b949e]/80 space-y-2">
          <p>
            <strong className="text-[#8b949e]">Aviso Legal Financeiro:</strong> As cotações, taxas cambiais, índices e gráficos exibidos no portal DinhEuro (dinheuro.com e dinheuro.com.br) são fornecidos para fins estritamente informativos e educacionais e não constituem assessoria, consultoria ou recomendação de compra ou venda de quaisquer ativos financeiros, ações, derivativos ou contratos futuros. Cotações de bolsas mundiais podem apresentar atrasos normativos de até 15 minutos em virtude das regras das praças financeiras.
          </p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2">
            <p>© {new Date().getFullYear()} DinhEuro. Todos os direitos reservados.</p>
            <p className="text-[10px] text-[#8b949e]/60 font-mono">
              São Paulo, Brasil • CNPJ e Governança Digital em Conformidade com a ANPD
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
