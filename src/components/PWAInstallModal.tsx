import React, { useState, useEffect } from "react";
import {
  Download,
  Smartphone,
  CheckCircle2,
  X,
  Sparkles,
  WifiOff,
  RefreshCw,
  Share,
  PlusSquare,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { BrandLogo } from "./BrandLogo";

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstall: () => Promise<{ success: boolean; outcome: string }>;
  isInstallable: boolean;
  isInstalled: boolean;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  onInstall,
  isInstallable,
  isInstalled,
}) => {
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  useEffect(() => {
    // Detect iOS devices (iPhone, iPad)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    setIsInstalling(true);
    const result = await onInstall();
    setIsInstalling(false);
    if (result.success) {
      setInstallSuccess(true);
      setTimeout(() => {
        onClose();
        setInstallSuccess(false);
      }, 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-[#161b22] border border-[#30363d] rounded-2xl p-6 shadow-2xl overflow-hidden text-[#e6edf3]"
        onClick={(e) => e.stopPropagation()}
        id="pwa-install-dialog"
      >
        {/* Decorative Top Accent Glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1f6feb] via-[#10b981] to-[#00c853]" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] transition-colors cursor-pointer"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* App Logo & Header */}
        <div className="flex flex-col items-center text-center space-y-3 pt-2">
          <div className="p-3 rounded-2xl bg-gradient-to-b from-[#21262d] to-[#0e1117] border border-[#30363d] shadow-lg">
            <BrandLogo size="lg" showText={false} animate={false} />
          </div>

          <div>
            <div className="flex items-center justify-center gap-1.5">
              <h3 className="text-xl font-bold text-white">DinhEuro Finanças PWA</h3>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-[#00c853]/15 text-[#00c853] border border-[#00c853]/30 rounded-full">
                OFICIAL
              </span>
            </div>
            <p className="text-xs text-[#8b949e] mt-1">
              Instale na sua tela inicial para acesso instantâneo sem digitar URL
            </p>
          </div>
        </div>

        {/* Success Feedback */}
        {installSuccess ? (
          <div className="my-6 p-4 rounded-xl bg-[#00c853]/15 border border-[#00c853]/40 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-[#00c853] mx-auto animate-bounce" />
            <h4 className="text-sm font-bold text-white">Aplicativo Instalado com Sucesso!</h4>
            <p className="text-xs text-[#8b949e]">
              O ícone do DinhEuro foi adicionado à sua tela de início ou gaveta de apps.
            </p>
          </div>
        ) : isInstalled ? (
          <div className="my-6 p-4 rounded-xl bg-[#1f6feb]/15 border border-[#1f6feb]/40 text-center space-y-2">
            <CheckCircle2 className="w-7 h-7 text-[#58a6ff] mx-auto" />
            <h4 className="text-sm font-bold text-white">Você já está usando o app instalado!</h4>
            <p className="text-xs text-[#8b949e]">
              O modo Progressive Web App (PWA) está 100% ativo com suporte a cache offline.
            </p>
          </div>
        ) : (
          <>
            {/* Value Proposition Highlights */}
            <div className="my-5 space-y-2.5">
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-[#0e1117] border border-[#21262d]">
                <div className="p-1.5 rounded-lg bg-[#1f6feb]/15 text-[#58a6ff] shrink-0 mt-0.5">
                  <Zap className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <span className="font-semibold text-white block">Experiência Nativa Rápida</span>
                  <span className="text-[#8b949e]">
                    Abre em tela cheia sem barras de navegador, com carregamento instantâneo.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-[#0e1117] border border-[#21262d]">
                <div className="p-1.5 rounded-lg bg-[#00c853]/15 text-[#00c853] shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <span className="font-semibold text-white block">Modo Offline Inteligente</span>
                  <span className="text-[#8b949e]">
                    Consulte cotações salvas e ferramentas financeiras mesmo sem internet.
                  </span>
                </div>
              </div>
            </div>

            {/* iOS Specific Instructions */}
            {isIOS ? (
              <div className="p-3.5 rounded-xl bg-[#21262d] border border-[#30363d] space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-[#58a6ff]">
                  <Smartphone className="w-4 h-4" />
                  <span>Como instalar no iPhone / iPad (Safari):</span>
                </div>
                <ol className="space-y-1.5 text-[#e6edf3] list-decimal list-inside text-xs leading-relaxed">
                  <li>
                    Toque no botão <strong className="text-white">Compartilhar</strong> (ícone{" "}
                    <Share className="w-3.5 h-3.5 inline mx-0.5 text-[#58a6ff]" /> na barra do
                    Safari).
                  </li>
                  <li>
                    Role para baixo e selecione{" "}
                    <strong className="text-white">"Adicionar à Tela de Início"</strong> (ícone{" "}
                    <PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-[#00c853]" />
                    ).
                  </li>
                  <li>
                    Toque em <strong className="text-[#00c853]">Adicionar</strong> no canto
                    superior direito.
                  </li>
                </ol>
              </div>
            ) : isInstallable ? (
              /* Chrome / Android / Desktop Native Install Trigger */
              <button
                onClick={handleInstallClick}
                disabled={isInstalling}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#1f6feb] to-[#00c853] hover:from-[#388bfd] hover:to-[#00e676] text-white font-bold text-sm shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isInstalling ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Instalando...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Instalar DinhEuro no Dispositivo</span>
                  </>
                )}
              </button>
            ) : (
              /* Fallback instructions when browser doesn't expose prompt */
              <div className="p-3 rounded-xl bg-[#21262d] border border-[#30363d] text-center space-y-1">
                <p className="text-xs text-[#e6edf3] font-medium">
                  Para instalar no seu navegador:
                </p>
                <p className="text-[11px] text-[#8b949e]">
                  Clique no ícone de <strong>Instalar App ⊕</strong> na barra de endereços do Chrome/Edge ou no menu de 3 pontos do navegador.
                </p>
              </div>
            )}
          </>
        )}

        {/* Footer info */}
        <div className="mt-4 pt-3 border-t border-[#21262d] flex items-center justify-between text-[10px] text-[#8b949e]">
          <span>PWA v1.0.0 • Service Worker Ativo</span>
          <span className="flex items-center gap-1 text-[#00c853]">
            <Sparkles className="w-3 h-3" /> Seguro & Criptografado
          </span>
        </div>
      </div>
    </div>
  );
};
