import React, { useState, useEffect } from "react";
import { ShieldCheck, Cookie, ChevronRight, X, Check, Settings2, ExternalLink } from "lucide-react";
import { LegalDocId } from "../types/legal";

interface LGPDConsentBannerProps {
  onOpenLegalDoc: (docId: LegalDocId) => void;
}

export const LGPD_STORAGE_KEY = "dinheuro_lgpd_accepted";
export const LGPD_TIMESTAMP_KEY = "dinheuro_lgpd_timestamp";
export const LGPD_PREFERENCES_KEY = "dinheuro_lgpd_preferences";

export const LGPDConsentBanner: React.FC<LGPDConsentBannerProps> = ({ onOpenLegalDoc }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [analyticsAllowed, setAnalyticsAllowed] = useState(true);
  const [preferencesAllowed, setPreferencesAllowed] = useState(true);

  // Check consent state on mount and listen to custom event to reopen preferences
  useEffect(() => {
    const accepted = localStorage.getItem(LGPD_STORAGE_KEY);
    if (!accepted) {
      // Small delay for smooth entry animation
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 700);
      return () => clearTimeout(timer);
    }

    // Load custom preferences if stored
    try {
      const storedPrefs = localStorage.getItem(LGPD_PREFERENCES_KEY);
      if (storedPrefs) {
        const parsed = JSON.parse(storedPrefs);
        if (typeof parsed.analytics === "boolean") setAnalyticsAllowed(parsed.analytics);
        if (typeof parsed.preferences === "boolean") setPreferencesAllowed(parsed.preferences);
      }
    } catch (e) {
      // Ignore JSON error
    }
  }, []);

  // Listen to global trigger event to reopen cookie preferences from Footer
  useEffect(() => {
    const handleReopen = () => {
      setIsVisible(true);
      setShowPreferences(true);
    };

    window.addEventListener("reopen-lgpd-preferences", handleReopen);
    return () => window.removeEventListener("reopen-lgpd-preferences", handleReopen);
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem(LGPD_STORAGE_KEY, "true");
    localStorage.setItem(LGPD_TIMESTAMP_KEY, new Date().toISOString());
    localStorage.setItem(
      LGPD_PREFERENCES_KEY,
      JSON.stringify({
        essential: true,
        preferences: true,
        analytics: true,
      })
    );
    setIsVisible(false);
    setShowPreferences(false);
  };

  const handleSaveCustomPreferences = () => {
    localStorage.setItem(LGPD_STORAGE_KEY, "true");
    localStorage.setItem(LGPD_TIMESTAMP_KEY, new Date().toISOString());
    localStorage.setItem(
      LGPD_PREFERENCES_KEY,
      JSON.stringify({
        essential: true,
        preferences: preferencesAllowed,
        analytics: analyticsAllowed,
      })
    );
    setIsVisible(false);
    setShowPreferences(false);
  };

  if (!isVisible) return null;

  return (
    <div
      role="region"
      aria-label="Consentimento de Cookies e Privacidade LGPD"
      className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 md:p-6 bg-[#0d1117]/95 backdrop-blur-md border-t border-[#30363d] shadow-[0_-10px_35px_rgba(0,0,0,0.7)] transition-all animate-in slide-in-from-bottom duration-300"
    >
      <div className="max-w-6xl mx-auto">
        {!showPreferences ? (
          /* Main Consent Bar */
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* Left Content */}
            <div className="flex items-start gap-3.5 flex-1 pr-0 md:pr-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1f6feb]/20 to-[#00c853]/20 border border-[#30363d] flex items-center justify-center shrink-0 text-[#00c853] mt-0.5">
                <ShieldCheck className="w-5 h-5 text-[#00c853]" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-bold text-[#e6edf3] tracking-tight">
                    Sua Privacidade e Conformidade LGPD
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[#1f6feb]/20 text-[#58a6ff] border border-[#1f6feb]/30">
                    Lei nº 13.709/2018
                  </span>
                </div>
                <p className="text-xs text-[#8b949e] leading-relaxed">
                  O <strong>DinhEuro</strong> utiliza cookies essenciais, armazenamento local (PWA) e tecnologias seguras para assegurar cotações em tempo real, memorizar suas preferências e aprimorar a sua experiência financeira. Não vendemos seus dados. Você tem controle total sobre suas informações a qualquer momento.
                </p>
                <div className="flex items-center gap-3 pt-1 text-xs">
                  <button
                    type="button"
                    onClick={() => onOpenLegalDoc("politica-de-privacidade")}
                    className="text-[#58a6ff] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <span>Saber mais / Política de Privacidade</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                  <span className="text-[#30363d]">•</span>
                  <button
                    type="button"
                    onClick={() => onOpenLegalDoc("politica-de-cookies")}
                    className="text-[#8b949e] hover:text-[#e6edf3] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Política de Cookies</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto shrink-0 justify-end pt-1 md:pt-0">
              <button
                type="button"
                onClick={() => setShowPreferences(true)}
                className="flex-1 md:flex-initial px-3.5 py-2.5 rounded-lg text-xs font-semibold text-[#c9d1d9] bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Settings2 className="w-3.5 h-3.5 text-[#8b949e]" />
                <span>Preferências</span>
              </button>

              <button
                type="button"
                id="btn-lgpd-accept-all"
                onClick={handleAcceptAll}
                className="flex-1 md:flex-initial px-5 py-2.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-[#00c853] to-[#009624] hover:brightness-110 shadow-lg shadow-[#00c853]/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Aceitar e Continuar</span>
              </button>
            </div>
          </div>
        ) : (
          /* Custom Preferences Panel */
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-[#21262d] pb-3">
              <div className="flex items-center gap-2">
                <Cookie className="w-4 h-4 text-[#e3b341]" />
                <h4 className="text-sm font-bold text-[#e6edf3]">
                  Painel de Preferências de Privacidade & Cookies
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowPreferences(false)}
                className="p-1 rounded-md text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] cursor-pointer"
                title="Voltar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Essential Cookies */}
              <div className="p-3 rounded-lg bg-[#161b22] border border-[#30363d] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#e6edf3]">Cookies Essenciais</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#238636]/20 text-[#3fb950] border border-[#238636]/40">
                    Obrigatório
                  </span>
                </div>
                <p className="text-[11px] text-[#8b949e] leading-snug">
                  Indispensáveis para cotações em tempo real, segurança e funcionamento das abas do PWA.
                </p>
              </div>

              {/* Preferences Cookies */}
              <div className="p-3 rounded-lg bg-[#161b22] border border-[#30363d] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#e6edf3]">Preferências Locais</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferencesAllowed}
                      onChange={(e) => setPreferencesAllowed(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-[#30363d] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#00c853]"></div>
                  </label>
                </div>
                <p className="text-[11px] text-[#8b949e] leading-snug">
                  Memorizam sua carteira de simulação, ativos favoritados e configurações do simulador de câmbio.
                </p>
              </div>

              {/* Analytics Cookies */}
              <div className="p-3 rounded-lg bg-[#161b22] border border-[#30363d] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#e6edf3]">Desempenho & Métricas</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={analyticsAllowed}
                      onChange={(e) => setAnalyticsAllowed(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-[#30363d] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#00c853]"></div>
                  </label>
                </div>
                <p className="text-[11px] text-[#8b949e] leading-snug">
                  Estatísticas anônimas de latência e tempo de carregamento de cotações para otimização do portal.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPreferences(false)}
                className="text-xs text-[#8b949e] hover:text-[#e6edf3] cursor-pointer"
              >
                Voltar à visualização simplificada
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveCustomPreferences}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-[#e6edf3] bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] transition-colors cursor-pointer"
                >
                  Salvar Preferências
                </button>
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-[#00c853] hover:bg-[#00b048] transition-colors cursor-pointer"
                >
                  Aceitar Todos
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
