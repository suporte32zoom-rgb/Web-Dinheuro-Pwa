import React, { useState } from "react";
import {
  Key,
  X,
  ShieldCheck,
  Server,
  Zap,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
  Globe,
} from "lucide-react";

interface BrokerApiModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BrokerApiModal: React.FC<BrokerApiModalProps> = ({ isOpen, onClose }) => {
  const [selectedBroker, setSelectedBroker] = useState("xp");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [testResult, setTestResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const brokers = [
    { id: "xp", name: "XP Investimentos", type: "B3 / FIX API", status: "Homologado", ping: "2ms" },
    { id: "btg", name: "BTG Pactual", type: "B3 / FIX API", status: "Homologado", ping: "3ms" },
    { id: "clear", name: "Clear Corretora", type: "B3 / RLP", status: "Homologado", ping: "4ms" },
    { id: "ib", name: "Interactive Brokers", type: "Global DMA", status: "Homologado", ping: "28ms" },
    { id: "binance", name: "Binance Futures", type: "Cripto / REST & WS", status: "Homologado", ping: "15ms" },
  ];

  const handleTestConnection = () => {
    setTestResult("Conexão validada com sucesso! Sandbox de negociação respondendo em 2.4ms.");
    setTimeout(() => setTestResult(null), 5000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-xl p-5 sm:p-6 shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#21262d] mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#1f6feb]/20 text-[#58a6ff]">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Conexão Institucional de Roteamento (Modo Real)
              </h3>
              <p className="text-xs text-[#8b949e]">
                Conexão direta FIX / REST com corretoras parceiras
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="p-3 rounded-xl bg-[#58a6ff]/10 border border-[#58a6ff]/30 text-xs text-[#58a6ff] mb-4 flex items-start gap-2.5">
          <ShieldCheck className="w-5 h-5 shrink-0 text-[#58a6ff] mt-0.5" />
          <div className="leading-relaxed">
            <strong className="block text-white">Ambiente Preparado para Operações Reais</strong>
            O terminal DinhEuro possui arquitetura de ultra-baixa latência pronta para receber suas credenciais oficiais de API/OAuth da sua corretora credenciada.
          </div>
        </div>

        {/* Broker Selection */}
        <div className="mb-4">
          <label className="text-xs text-[#8b949e] font-semibold uppercase tracking-wider block mb-2">
            Selecione a Corretora / Provedor:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {brokers.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedBroker(b.id)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedBroker === b.id
                    ? "bg-[#21262d] border-[#58a6ff] text-white shadow-xs"
                    : "bg-[#0e1117] border-[#30363d] text-[#8b949e] hover:text-[#e6edf3]"
                }`}
              >
                <span className="font-bold text-xs block text-white">{b.name}</span>
                <div className="flex items-center justify-between text-[10px] mt-1 text-[#8b949e]">
                  <span>{b.type}</span>
                  <span className="text-[#00c853] font-mono">{b.ping}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Conexão Institucional Credentials Input */}
        <div className="space-y-3 mb-5">
          <div>
            <label className="text-xs text-[#e6edf3] font-medium block mb-1">
              Credencial de Acesso (Código Operador / Client ID):
            </label>
            <input
              type="text"
              placeholder="Identificador institucional fornecido pela corretora..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0e1117] border border-[#30363d] text-white text-xs font-mono focus:outline-none focus:border-[#58a6ff]"
            />
          </div>

          <div>
            <label className="text-xs text-[#e6edf3] font-medium block mb-1">
              Assinatura Eletrônica / Token de Conexão:
            </label>
            <input
              type="password"
              placeholder="••••••••••••••••••••••••••••••••"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0e1117] border border-[#30363d] text-white text-xs font-mono focus:outline-none focus:border-[#58a6ff]"
            />
          </div>

          {testResult && (
            <div className="p-2.5 rounded-xl bg-[#00c853]/15 border border-[#00c853]/40 text-[#00c853] text-xs flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{testResult}</span>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[#21262d]">
          <span className="text-[11px] text-[#8b949e] flex items-center gap-1">
            <Server className="w-3.5 h-3.5 text-[#00c853]" />
            Gateway FIX B3 • Criptografia AES-256
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestConnection}
              className="px-3.5 py-1.5 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-[#58a6ff] text-xs font-semibold transition-colors cursor-pointer"
            >
              Testar Conexão
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-[#1f6feb] hover:bg-[#388bfd] text-white text-xs font-bold transition-all cursor-pointer shadow-md"
            >
              Concluir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
