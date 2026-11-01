import React, { useState, useEffect } from "react";
import {
  Bell,
  BellRing,
  BellOff,
  Check,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Activity,
  Smartphone,
  Monitor,
  Volume2,
  VolumeX,
  Vibrate,
  Newspaper,
  Landmark,
  ShieldAlert,
  Sparkles,
  X,
  ExternalLink,
  ChevronRight,
  Info,
} from "lucide-react";
import { Asset } from "../types/finance";
import {
  notificationService,
  NotificationSettings,
  AssetPriceAlert,
} from "../services/notificationService";

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  liveAssets?: Asset[];
  initialAsset?: Asset | null;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
  liveAssets = [],
  initialAsset = null,
}) => {
  const [settings, setSettings] = useState<NotificationSettings>(notificationService.getSettings());
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    notificationService.getPermission()
  );
  const [deviceType, setDeviceType] = useState<"mobile" | "desktop">("desktop");
  const [activeTab, setActiveTab] = useState<"assets" | "news_macro" | "test">("assets");
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // New alert form state
  const [selectedTicker, setSelectedTicker] = useState<string>("PETR4");
  const [threshold, setThreshold] = useState<number>(2.0);
  const [direction, setDirection] = useState<"any" | "above" | "below">("any");
  const [customTicker, setCustomTicker] = useState<string>("");

  useEffect(() => {
    setDeviceType(notificationService.getDeviceType());
    setPermission(notificationService.getPermission());

    const unsubscribe = notificationService.subscribe((newSettings) => {
      setSettings(newSettings);
      setPermission(notificationService.getPermission());
    });

    return unsubscribe;
  }, []);

  // When initialAsset is passed, pre-select it
  useEffect(() => {
    if (initialAsset) {
      setSelectedTicker(initialAsset.ticker);
      setActiveTab("assets");
    }
  }, [initialAsset]);

  if (!isOpen) return null;

  const isGranted = permission === "granted";
  const isDenied = permission === "denied";

  const handleRequestPermission = async () => {
    const perm = await notificationService.requestPermission();
    setPermission(perm);
    if (perm === "granted") {
      setTestResult("Permissão concedida! As notificações push estão ativas no seu dispositivo.");
      setTimeout(() => setTestResult(null), 4000);
    }
  };

  // Find asset for quick selection
  const currentAsset = liveAssets.find(
    (a) => a.ticker.toUpperCase() === (customTicker || selectedTicker).toUpperCase()
  );

  const handleAddAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const ticker = (customTicker.trim() || selectedTicker).toUpperCase();
    const assetFound = liveAssets.find((a) => a.ticker.toUpperCase() === ticker);

    const basePrice = assetFound?.price || 100;
    const name = assetFound?.name || ticker;
    const category = assetFound?.category || "América Latina";

    notificationService.addAssetAlert({
      ticker,
      name,
      category,
      basePrice,
      thresholdPercent: threshold,
      direction,
      enabled: true,
    });

    setCustomTicker("");
    setTestResult(`Alerta criado para ${ticker} (±${threshold}%).`);
    setTimeout(() => setTestResult(null), 3000);
  };

  const handleTriggerTest = async (type: "asset" | "news" | "market") => {
    setIsTesting(true);
    setTestResult(null);

    const success = await notificationService.triggerTestNotification(type);
    setIsTesting(false);

    if (success) {
      setTestResult("Notificação disparada com sucesso! Verifique a central de notificações do seu sistema.");
    } else {
      setTestResult("Atenção: A notificação não pôde ser exibida. Verifique as permissões de notificação do navegador.");
    }
    setTimeout(() => setTestResult(null), 5000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-[#0e1117] border border-[#30363d] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#21262d] bg-[#161b22]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1f6feb]/20 to-[#238636]/20 border border-[#1f6feb]/30 flex items-center justify-center text-[#58a6ff]">
              <BellRing className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-[#e6edf3]">
                  Notificações & Alertas em Tempo Real
                </h3>
                <span className="flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#21262d] border border-[#30363d] text-[#8b949e]">
                  {deviceType === "mobile" ? (
                    <>
                      <Smartphone className="w-3 h-3 text-[#58a6ff]" />
                      <span>Mobile PWA</span>
                    </>
                  ) : (
                    <>
                      <Monitor className="w-3 h-3 text-[#58a6ff]" />
                      <span>Desktop</span>
                    </>
                  )}
                </span>
              </div>
              <p className="text-xs text-[#8b949e]">
                Alertas instantâneos de oscilação de ativos, plantão de notícias e eventos macro
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Permission Status Banner */}
        <div className="px-4 py-3 bg-[#161b22]/70 border-b border-[#21262d] flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isGranted
                  ? "bg-[#00c853] shadow-[0_0_8px_rgba(0,200,83,0.5)]"
                  : isDenied
                  ? "bg-[#ff5252]"
                  : "bg-[#e3b341] animate-pulse"
              }`}
            />
            <span className="text-[#8b949e]">Status do Sistema:</span>
            <span
              className={`font-semibold ${
                isGranted
                  ? "text-[#00c853]"
                  : isDenied
                  ? "text-[#ff5252]"
                  : "text-[#e3b341]"
              }`}
            >
              {isGranted
                ? "Notificações Ativas no Dispositivo"
                : isDenied
                ? "Bloqueado pelo Navegador"
                : "Aguardando Permissão"}
            </span>
          </div>

          {!isGranted && (
            <button
              onClick={handleRequestPermission}
              className="px-3 py-1.5 bg-gradient-to-r from-[#1f6feb] to-[#238636] hover:brightness-110 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Ativar Notificações Push</span>
            </button>
          )}

          {isGranted && (
            <div className="flex items-center gap-2 text-xs text-[#8b949e]">
              <button
                onClick={() => notificationService.updateSettings({ sound: !settings.sound })}
                className={`p-1.5 rounded-md border text-xs flex items-center gap-1 transition-colors ${
                  settings.sound
                    ? "bg-[#21262d] border-[#30363d] text-[#58a6ff]"
                    : "bg-[#161b22] border-[#21262d] text-[#8b949e]"
                }`}
                title="Som de Alerta"
              >
                {settings.sound ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span className="text-[11px]">Som</span>
              </button>

              <button
                onClick={() => notificationService.updateSettings({ vibrate: !settings.vibrate })}
                className={`p-1.5 rounded-md border text-xs flex items-center gap-1 transition-colors ${
                  settings.vibrate
                    ? "bg-[#21262d] border-[#30363d] text-[#00c853]"
                    : "bg-[#161b22] border-[#21262d] text-[#8b949e]"
                }`}
                title="Vibração Tátil no Mobile"
              >
                <Vibrate className="w-3.5 h-3.5" />
                <span className="text-[11px]">Vibração</span>
              </button>
            </div>
          )}
        </div>

        {/* Feedback message banner */}
        {testResult && (
          <div className="px-4 py-2 bg-[#1f6feb]/15 border-b border-[#1f6feb]/30 text-[#58a6ff] text-xs flex items-center gap-2 animate-in fade-in">
            <Info className="w-4 h-4 shrink-0" />
            <span>{testResult}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-[#21262d] bg-[#0e1117] px-4">
          <button
            onClick={() => setActiveTab("assets")}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === "assets"
                ? "border-[#58a6ff] text-[#58a6ff]"
                : "border-transparent text-[#8b949e] hover:text-[#e6edf3]"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Alertas de Ativos ({settings.assetAlerts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("news_macro")}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === "news_macro"
                ? "border-[#58a6ff] text-[#58a6ff]"
                : "border-transparent text-[#8b949e] hover:text-[#e6edf3]"
            }`}
          >
            <Newspaper className="w-4 h-4" />
            <span>Notícias & Eventos Macro</span>
          </button>

          <button
            onClick={() => setActiveTab("test")}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === "test"
                ? "border-[#58a6ff] text-[#58a6ff]"
                : "border-transparent text-[#8b949e] hover:text-[#e6edf3]"
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#f0883e]" />
            <span>Testar no Dispositivo</span>
          </button>
        </div>

        {/* Tab Contents (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* TAB 1: ASSET PRICE ALERTS */}
          {activeTab === "assets" && (
            <div className="space-y-5">
              {/* Add New Alert Card */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#e6edf3] flex items-center gap-2">
                    <Plus className="w-4 h-4 text-[#58a6ff]" />
                    <span>Criar Novo Alerta de Preço</span>
                  </h4>
                  <span className="text-[11px] text-[#8b949e]">Atualização contínua</span>
                </div>

                {/* Quick Asset Selector */}
                <div>
                  <label className="block text-[11px] font-medium text-[#8b949e] mb-1.5">
                    Selecione um Ativo ou Digite o Código (Ações B3, Moedas, Criptos):
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2.5">
                    {[
                      { ticker: "PETR4", label: "Petrobras" },
                      { ticker: "VALE3", label: "Vale" },
                      { ticker: "IBOV", label: "Ibovespa" },
                      { ticker: "USD/BRL", label: "Dólar" },
                      { ticker: "EUR/BRL", label: "Euro" },
                      { ticker: "BTC", label: "Bitcoin" },
                      { ticker: "ITUB4", label: "Itaú" },
                      { ticker: "S&P 500", label: "S&P 500" },
                    ].map((item) => (
                      <button
                        key={item.ticker}
                        type="button"
                        onClick={() => {
                          setSelectedTicker(item.ticker);
                          setCustomTicker("");
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-colors border cursor-pointer ${
                          selectedTicker === item.ticker && !customTicker
                            ? "bg-[#58a6ff]/20 text-[#58a6ff] border-[#58a6ff]/50"
                            : "bg-[#0e1117] text-[#8b949e] border-[#30363d] hover:border-[#8b949e]"
                        }`}
                      >
                        {item.ticker}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    placeholder="Ou digite outro ticker (ex: MGLU3, BBAS3, B3SA3, SOL)..."
                    value={customTicker}
                    onChange={(e) => setCustomTicker(e.target.value.toUpperCase())}
                    className="w-full bg-[#0e1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs font-mono text-[#e6edf3] placeholder-[#8b949e] focus:outline-none focus:border-[#58a6ff]"
                  />
                </div>

                {/* Threshold & Direction */}
                <form onSubmit={handleAddAlert} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-[#8b949e] mb-1.5">
                        Gatilho de Variação (%):
                      </label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[1.0, 2.0, 3.0, 5.0].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setThreshold(val)}
                            className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all border cursor-pointer text-center ${
                              threshold === val
                                ? "bg-[#238636]/20 text-[#00c853] border-[#238636]"
                                : "bg-[#0e1117] text-[#8b949e] border-[#30363d] hover:border-[#8b949e]"
                            }`}
                          >
                            ±{val}%
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-[#8b949e] mb-1.5">
                        Direção do Disparo:
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setDirection("any")}
                          className={`py-1.5 rounded-lg text-[11px] font-semibold transition-all border cursor-pointer ${
                            direction === "any"
                              ? "bg-[#58a6ff]/20 text-[#58a6ff] border-[#58a6ff]"
                              : "bg-[#0e1117] text-[#8b949e] border-[#30363d]"
                          }`}
                        >
                          Qualquer (±)
                        </button>
                        <button
                          type="button"
                          onClick={() => setDirection("above")}
                          className={`py-1.5 rounded-lg text-[11px] font-semibold transition-all border cursor-pointer flex items-center justify-center gap-1 ${
                            direction === "above"
                              ? "bg-[#00c853]/20 text-[#00c853] border-[#00c853]"
                              : "bg-[#0e1117] text-[#8b949e] border-[#30363d]"
                          }`}
                        >
                          <TrendingUp className="w-3 h-3" />
                          <span>Alta (+)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDirection("below")}
                          className={`py-1.5 rounded-lg text-[11px] font-semibold transition-all border cursor-pointer flex items-center justify-center gap-1 ${
                            direction === "below"
                              ? "bg-[#ff5252]/20 text-[#ff5252] border-[#ff5252]"
                              : "bg-[#0e1117] text-[#8b949e] border-[#30363d]"
                          }`}
                        >
                          <TrendingDown className="w-3 h-3" />
                          <span>Queda (-)</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Summary & Submit */}
                  <div className="pt-2 flex items-center justify-between border-t border-[#21262d]">
                    <div className="text-xs text-[#8b949e]">
                      Disparar quando{" "}
                      <span className="font-bold text-[#e6edf3]">
                        {customTicker || selectedTicker}
                      </span>{" "}
                      oscilar{" "}
                      <span className="font-mono font-bold text-[#58a6ff]">
                        {direction === "above"
                          ? `+${threshold}%`
                          : direction === "below"
                          ? `-${threshold}%`
                          : `±${threshold}%`}
                      </span>
                    </div>

                    <button
                      type="submit"
                      className="px-4 py-2 bg-gradient-to-r from-[#1f6feb] to-[#238636] hover:brightness-110 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Salvar Alerta</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Active Alerts List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#8b949e]">
                    Alertas Monitorados Ativos ({settings.assetAlerts.length})
                  </h4>
                  <span className="text-[11px] text-[#8b949e]">Desktop & Mobile</span>
                </div>

                {settings.assetAlerts.length === 0 ? (
                  <div className="p-8 text-center bg-[#161b22] border border-[#30363d] rounded-xl text-[#8b949e] text-xs">
                    Nenhum alerta de ativo configurado. Crie seu primeiro alerta acima para receber notificações em tempo real.
                  </div>
                ) : (
                  settings.assetAlerts.map((alert) => {
                    const live = liveAssets.find(
                      (a) => a.ticker.toUpperCase() === alert.ticker.toUpperCase()
                    );
                    const currentPrice = live?.price || alert.basePrice;

                    return (
                      <div
                        key={alert.id}
                        className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                          alert.enabled
                            ? "bg-[#161b22] border-[#30363d]"
                            : "bg-[#0e1117] border-[#21262d] opacity-60"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => notificationService.toggleAssetAlert(alert.id)}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
                              alert.enabled
                                ? "bg-[#00c853]/20 text-[#00c853] border border-[#00c853]/40"
                                : "bg-[#21262d] text-[#8b949e]"
                            }`}
                            title={alert.enabled ? "Desativar alerta" : "Ativar alerta"}
                          >
                            {alert.enabled ? <Check className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                          </button>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-sm text-[#e6edf3]">
                                {alert.ticker}
                              </span>
                              <span className="text-xs text-[#8b949e] truncate max-w-[120px] sm:max-w-none">
                                {alert.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-[#8b949e] font-mono">
                              <span>Ref: {alert.basePrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                              <span>•</span>
                              <span>Atual: {currentPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="px-2.5 py-1 rounded-md bg-[#21262d] text-[11px] font-mono font-bold text-[#58a6ff] border border-[#30363d]">
                            {alert.direction === "above" ? "+" : alert.direction === "below" ? "-" : "±"}
                            {alert.thresholdPercent}%
                          </span>

                          <button
                            type="button"
                            onClick={() => notificationService.removeAssetAlert(alert.id)}
                            className="p-1.5 rounded-lg text-[#8b949e] hover:text-[#ff5252] hover:bg-[#ff5252]/10 transition-colors cursor-pointer"
                            title="Excluir alerta"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: NEWS & MACRO EVENTS */}
          {activeTab === "news_macro" && (
            <div className="space-y-4">
              {/* Breaking News Toggle */}
              <div className="p-4 bg-[#161b22] border border-[#30363d] rounded-xl flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1f6feb]/20 to-[#8957e5]/20 border border-[#1f6feb]/30 flex items-center justify-center text-[#58a6ff] shrink-0 mt-0.5">
                    <Newspaper className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#e6edf3]">
                      Plantão de Notícias Urgentes (Breaking News)
                    </h4>
                    <p className="text-xs text-[#8b949e] mt-0.5">
                      Receba no desktop e celular notícias de impacto que movimentam a B3, Wall Street, Câmbio e Criptoativos.
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={settings.breakingNews}
                    onChange={(e) =>
                      notificationService.updateSettings({ breakingNews: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#21262d] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00c853]"></div>
                </label>
              </div>

              {/* Macro Events & Central Banks */}
              <div className="p-4 bg-[#161b22] border border-[#30363d] rounded-xl space-y-4">
                <div className="flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-[#e3b341]" />
                  <h4 className="text-sm font-bold text-[#e6edf3]">
                    Eventos Relevantes de Mercado & Bancos Centrais
                  </h4>
                </div>

                <div className="space-y-3 pt-1">
                  {/* Copom / Selic */}
                  <div className="flex items-center justify-between py-2 border-b border-[#21262d]">
                    <div>
                      <div className="text-xs font-semibold text-[#e6edf3]">
                        🇧🇷 Copom / Taxa Selic (Banco Central do Brasil)
                      </div>
                      <div className="text-[11px] text-[#8b949e]">
                        Aviso imediato da decisão de juros e comunicado oficial do Bacen
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.marketEvents.copom}
                      onChange={(e) =>
                        notificationService.updateSettings({
                          marketEvents: { ...settings.marketEvents, copom: e.target.checked },
                        })
                      }
                      className="w-4 h-4 accent-[#00c853] rounded cursor-pointer"
                    />
                  </div>

                  {/* Federal Reserve (Fed) */}
                  <div className="flex items-center justify-between py-2 border-b border-[#21262d]">
                    <div>
                      <div className="text-xs font-semibold text-[#e6edf3]">
                        🇺🇸 Federal Reserve (Fed / FOMC)
                      </div>
                      <div className="text-[11px] text-[#8b949e]">
                        Decisões de juros dos EUA e falas do presidente do Fed
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.marketEvents.fed}
                      onChange={(e) =>
                        notificationService.updateSettings({
                          marketEvents: { ...settings.marketEvents, fed: e.target.checked },
                        })
                      }
                      className="w-4 h-4 accent-[#00c853] rounded cursor-pointer"
                    />
                  </div>

                  {/* European Central Bank (BCE) */}
                  <div className="flex items-center justify-between py-2 border-b border-[#21262d]">
                    <div>
                      <div className="text-xs font-semibold text-[#e6edf3]">
                        🇪🇺 Banco Central Europeu (BCE / EUR)
                      </div>
                      <div className="text-[11px] text-[#8b949e]">
                        Políticas monetárias e impactos no Euro e remessas internacionais
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.marketEvents.ecb}
                      onChange={(e) =>
                        notificationService.updateSettings({
                          marketEvents: { ...settings.marketEvents, ecb: e.target.checked },
                        })
                      }
                      className="w-4 h-4 accent-[#00c853] rounded cursor-pointer"
                    />
                  </div>

                  {/* Circuit Breaker B3 */}
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <div className="text-xs font-semibold text-[#e6edf3] flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-[#ff5252]" />
                        <span>Circuit Breaker & Leilão Geral na B3</span>
                      </div>
                      <div className="text-[11px] text-[#8b949e]">
                        Alerta prioritário caso o Ibovespa atinja interrupções de negociação (-10%)
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.marketEvents.circuitBreaker}
                      onChange={(e) =>
                        notificationService.updateSettings({
                          marketEvents: { ...settings.marketEvents, circuitBreaker: e.target.checked },
                        })
                      }
                      className="w-4 h-4 accent-[#ff5252] rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: IMMEDIATE TESTING */}
          {activeTab === "test" && (
            <div className="space-y-4">
              <div className="p-4 bg-[#161b22] border border-[#30363d] rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#f0883e]" />
                  <h4 className="text-sm font-bold text-[#e6edf3]">
                    Disparo de Notificações de Teste (Desktop & Mobile)
                  </h4>
                </div>
                <p className="text-xs text-[#8b949e]">
                  Clique nos botões abaixo para disparar instantaneamente uma notificação real no seu dispositivo.
                  O navegador emitirá o aviso sonoro e a notificação do sistema operacional (Windows, macOS, Android ou iOS PWA).
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                  <button
                    onClick={() => handleTriggerTest("asset")}
                    disabled={isTesting}
                    className="p-3 bg-[#0e1117] hover:bg-[#21262d] border border-[#30363d] hover:border-[#58a6ff] rounded-xl text-left transition-all cursor-pointer group"
                  >
                    <div className="text-xs font-bold text-[#58a6ff] group-hover:underline flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-[#00c853]" />
                      <span>Alerta de Cotação</span>
                    </div>
                    <div className="text-[11px] text-[#8b949e] mt-1">
                      PETR4 sobe +3,24% e atinge R$ 49,55
                    </div>
                  </button>

                  <button
                    onClick={() => handleTriggerTest("news")}
                    disabled={isTesting}
                    className="p-3 bg-[#0e1117] hover:bg-[#21262d] border border-[#30363d] hover:border-[#e3b341] rounded-xl text-left transition-all cursor-pointer group"
                  >
                    <div className="text-xs font-bold text-[#e3b341] group-hover:underline flex items-center gap-1">
                      <Newspaper className="w-3.5 h-3.5" />
                      <span>Plantão B3</span>
                    </div>
                    <div className="text-[11px] text-[#8b949e] mt-1">
                      Ibovespa atinge novo recorde histórico
                    </div>
                  </button>

                  <button
                    onClick={() => handleTriggerTest("market")}
                    disabled={isTesting}
                    className="p-3 bg-[#0e1117] hover:bg-[#21262d] border border-[#30363d] hover:border-[#00c853] rounded-xl text-left transition-all cursor-pointer group"
                  >
                    <div className="text-xs font-bold text-[#00c853] group-hover:underline flex items-center gap-1">
                      <Landmark className="w-3.5 h-3.5" />
                      <span>Decisão Copom</span>
                    </div>
                    <div className="text-[11px] text-[#8b949e] mt-1">
                      Bacen anuncia manutenção da Selic a 10,75%
                    </div>
                  </button>
                </div>
              </div>

              {/* Cross-device installation guidelines */}
              <div className="p-4 bg-[#161b22] border border-[#30363d] rounded-xl space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#e6edf3]">
                  Como garantir o recebimento em todas as plataformas
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#8b949e]">
                  <div className="p-3 bg-[#0e1117] rounded-lg border border-[#21262d] space-y-1">
                    <div className="font-bold text-[#e6edf3] flex items-center gap-1">
                      <Smartphone className="w-3.5 h-3.5 text-[#58a6ff]" />
                      <span>Android / Chrome Mobile</span>
                    </div>
                    <p className="text-[11px]">
                      Basta clicar em "Ativar Notificações" e confirmar o pop-up nativo. As mensagens aparecem mesmo com o app fechado.
                    </p>
                  </div>

                  <div className="p-3 bg-[#0e1117] rounded-lg border border-[#21262d] space-y-1">
                    <div className="font-bold text-[#e6edf3] flex items-center gap-1">
                      <Smartphone className="w-3.5 h-3.5 text-[#e3b341]" />
                      <span>iPhone / iOS (Safari 16.4+)</span>
                    </div>
                    <p className="text-[11px]">
                      Toque em <strong>Compartilhar ➔ Adicionar à Tela de Início</strong>. Abra o app pela tela inicial para habilitar Web Push.
                    </p>
                  </div>

                  <div className="p-3 bg-[#0e1117] rounded-lg border border-[#21262d] space-y-1 sm:col-span-2">
                    <div className="font-bold text-[#e6edf3] flex items-center gap-1">
                      <Monitor className="w-3.5 h-3.5 text-[#00c853]" />
                      <span>Desktop (Windows, Mac, Linux - Chrome, Edge, Safari, Firefox)</span>
                    </div>
                    <p className="text-[11px]">
                      Notificações aparecem no canto inferior da tela (Windows) ou na Central de Notificações do macOS com som discreto e links diretos para os ativos da B3.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#21262d] bg-[#161b22] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-[#8b949e]">
            <span className="w-2 h-2 rounded-full bg-[#00c853] animate-pulse" />
            <span>PWA Web Push Ativo • DinhEuro Finanças</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#21262d] hover:bg-[#30363d] text-[#e6edf3] font-semibold text-xs rounded-xl transition-colors cursor-pointer border border-[#30363d]"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
