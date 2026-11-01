import React from "react";
import { WifiOff, RefreshCw, Smartphone, Sparkles, X } from "lucide-react";

interface PWANotificationBarProps {
  isOffline: boolean;
  hasUpdate: boolean;
  onApplyUpdate: () => void;
  isInstallable: boolean;
  onOpenInstallModal: () => void;
}

export const PWANotificationBar: React.FC<PWANotificationBarProps> = ({
  isOffline,
  hasUpdate,
  onApplyUpdate,
  isInstallable,
  onOpenInstallModal,
}) => {
  return (
    <>
      {/* 1. Offline Mode Alert Banner */}
      {isOffline && (
        <div
          id="pwa-offline-alert"
          className="bg-amber-950/80 border-b border-amber-600/40 text-amber-200 px-4 py-2 text-xs flex items-center justify-between gap-3 shadow-md animate-in slide-in-from-top duration-200"
        >
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="flex-1">
              <span className="font-bold">Modo Offline Ativo:</span> Você está desconectado da
              internet. O DinhEuro está exibindo dados salvos no cache local do PWA.
            </div>
            <span className="text-[10px] bg-amber-900/60 px-2 py-0.5 rounded border border-amber-700/50 font-mono">
              OFFLINE
            </span>
          </div>
        </div>
      )}

      {/* 2. New Version Available Banner */}
      {hasUpdate && (
        <div
          id="pwa-update-alert"
          className="bg-emerald-950/90 border-b border-emerald-500/50 text-emerald-100 px-4 py-2 text-xs flex items-center justify-between gap-3 shadow-md animate-in slide-in-from-top duration-200"
        >
          <div className="flex items-center justify-between max-w-7xl mx-auto w-full gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Nova versão disponível!</strong> O portal DinhEuro foi atualizado com melhorias.
              </span>
            </div>
            <button
              onClick={onApplyUpdate}
              className="px-3 py-1 bg-[#00c853] hover:bg-[#00e676] text-black font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Atualizar Agora</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
