import React from "react";

/**
 * Caminho canônico e dinâmico para o logo original do DinhEuro.
 * Pode ser facilmente alterado ou injetado via variável de ambiente.
 */
export const DINHEURO_LOGO_URL = "/assets/logo-original.png";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  showSubtitle?: boolean;
  className?: string;
  animate?: boolean;
  src?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = "md",
  showText = true,
  showSubtitle = true,
  className = "",
  animate = true,
  src = DINHEURO_LOGO_URL,
}) => {
  const sizeMap = {
    sm: { icon: "w-8 h-8", title: "text-base", sub: "text-[9px]" },
    md: { icon: "w-10 h-10", title: "text-xl", sub: "text-[10px]" },
    lg: { icon: "w-14 h-14", title: "text-2xl", sub: "text-xs" },
    xl: { icon: "w-20 h-20 sm:w-24 sm:h-24", title: "text-3xl", sub: "text-sm" },
  };

  const selectedSize = sizeMap[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Emblema Circular Oficial com o Logo Original DinhEuro (€ R$) */}
      <div
        className={`relative ${selectedSize.icon} shrink-0 rounded-full bg-white p-0.5 shadow-md shadow-black/40 ring-2 ring-emerald-500/40 flex items-center justify-center overflow-hidden transition-all ${
          animate ? "hover:scale-105 hover:ring-emerald-400 duration-200" : ""
        }`}
      >
        <img
          src={src}
          alt="DinhEuro Logo Oficial"
          className="w-full h-full object-contain rounded-full select-none"
          loading="eager"
          decoding="async"
          onError={(e) => {
            // Fallback para a pasta aistudio caso a rota pública principal oscile
            const target = e.currentTarget;
            if (target.src.indexOf("dinheuro-20260604") === -1) {
              target.src = "/assets/aistudio/dinheuro-20260604_114440_0000_e5c44739.png";
            }
          }}
        />
      </div>

      {/* Tipografia Oficial da Marca Alinhada à Direita do Logo */}
      {showText && (
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-1.5 leading-none">
            <span
              className={`${selectedSize.title} font-extrabold tracking-tight text-[#e6edf3] group-hover:text-white transition-colors`}
            >
              Dinh<span className="text-[#00c853]">Euro</span>
            </span>
            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[#21262d] text-[#58a6ff] border border-[#30363d] rounded tracking-wide">
              PRO
            </span>
          </div>
          {showSubtitle && (
            <span className={`${selectedSize.sub} text-[#8b949e] font-medium mt-0.5 hidden sm:inline`}>
              Mercados Globais & IA
            </span>
          )}
        </div>
      )}
    </div>
  );
};
