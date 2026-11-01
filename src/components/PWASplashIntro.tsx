import React, { useState, useEffect } from "react";
import { DINHEURO_LOGO_URL } from "./BrandLogo";
import { Sparkles } from "lucide-react";

export const PWASplashIntro: React.FC = () => {
  const [isVisible, setIsVisible] = useState<boolean>(() => {
    // Exibe apenas na abertura da sessão
    const alreadyShown = sessionStorage.getItem("dinheuro_splash_shown");
    return !alreadyShown;
  });

  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);

  useEffect(() => {
    if (isVisible) {
      sessionStorage.setItem("dinheuro_splash_shown", "true");
      const timer = setTimeout(() => {
        setIsFadingOut(true);
        const removeTimer = setTimeout(() => {
          setIsVisible(false);
        }, 400);
        return () => clearTimeout(removeTimer);
      }, 1100);

      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div
      id="pwa-splash-screen"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0e1117] transition-opacity duration-400 ease-out select-none ${
        isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Background ambient radial glow */}
      <div className="absolute w-80 h-80 rounded-full bg-[#1f6feb]/25 blur-3xl pointer-events-none -translate-x-14 -translate-y-14" />
      <div className="absolute w-80 h-80 rounded-full bg-[#00c853]/25 blur-3xl pointer-events-none translate-x-14 translate-y-14" />

      {/* Main Center Splash Content with Original DinhEuro Logo */}
      <div className="relative flex flex-col items-center text-center space-y-4 px-6 animate-in zoom-in-95 duration-300">
        {/* Emblema Original Centralizado com Anéis de Luz */}
        <div className="p-3.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl shadow-emerald-500/25 ring-4 ring-emerald-500/20">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white p-1 shadow-inner flex items-center justify-center overflow-hidden">
            <img
              src={DINHEURO_LOGO_URL}
              alt="DinhEuro Logo Original"
              className="w-full h-full object-contain rounded-full select-none"
              loading="eager"
            />
          </div>
        </div>

        <div className="space-y-1.5 pt-2">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center justify-center gap-1.5">
            Dinh<span className="text-[#00c853]">Euro</span>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-[#21262d] text-[#58a6ff] border border-[#30363d] rounded">
              PWA
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-[#8b949e] font-medium tracking-wide">
            Cotações em Tempo Real • Mercados Globais & IA
          </p>
        </div>

        {/* Loading Pulsing Progress Indicator */}
        <div className="w-44 h-1.5 bg-[#21262d] rounded-full overflow-hidden mt-6 relative">
          <div className="h-full bg-gradient-to-r from-[#1f6feb] via-[#10b981] to-[#00c853] w-full animate-pulse" />
        </div>

        <div className="flex items-center gap-1.5 text-xs text-[#58a6ff] font-mono pt-2">
          <Sparkles className="w-3.5 h-3.5 text-[#00c853] animate-spin-slow" />
          <span>Motor Financeiro Conectado</span>
        </div>
      </div>
    </div>
  );
};
