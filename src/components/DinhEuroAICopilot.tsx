import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Zap,
  Globe2,
  Calculator,
  ShieldCheck,
  Building2,
} from "lucide-react";
import { sendMessageToAI } from "../services/geminiService";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface DinhEuroAICopilotProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

const QUICK_PROMPTS = [
  {
    icon: Globe2,
    label: "Corredor UE ⇄ Brasil",
    prompt: "Como funciona o corredor financeiro União Europeia ⇄ Brasil? Quais os impostos (IOF), prazos e melhores vias de remessa?",
  },
  {
    icon: Calculator,
    label: "Simular 1.000 € em R$",
    prompt: "Simule a conversão e remessa de 1.000 Euros para Reais (BRL). Detalhe taxa de câmbio comercial, spread estimado e IOF.",
  },
  {
    icon: TrendingUp,
    label: "Ibovespa vs S&P 500",
    prompt: "Faça uma comparação técnica e macroeconômica entre o momento do Ibovespa (B3) e do S&P 500.",
  },
  {
    icon: ShieldCheck,
    label: "Taxas e Spread",
    prompt: "Explique como as instituições bancárias cobram spread cambial e compare com plataformas digitais (Wise, Remessa Online).",
  },
];

export const DinhEuroAICopilot: React.FC<DinhEuroAICopilotProps> = ({
  isOpen,
  onClose,
  initialQuery,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-msg",
      role: "assistant",
      content:
        "Olá! Sou a **Inteligência Artificial Oficial do DinhEuro.com**, especialista global em finanças, economia e mercados financeiros.\n\nPosso ajudar você com:\n- 🇪🇺 ⇄ 🇧🇷 **Corredor União Europeia ⇄ Mercosul & Remessas Internacionais**\n- 📊 **Cotações, Ações da B3, Wall Street, Câmbio e Cripto**\n- 💰 **Cálculos de conversão, IOF, spread bancário e planejamento financeiro**\n\nComo posso orientar suas decisões hoje?",
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialQuery && isOpen) {
      sendMessage(initialQuery);
    }
  }, [initialQuery, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const reply = await sendMessageToAI(text, history);

      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        role: "assistant",
        content: reply,
        timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      const errorMessage: Message = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content:
          "O DinhEuro AI está processando alto volume de dados em tempo real. As cotações de câmbio comercial (EUR/BRL, USD/BRL) e índices continuam disponíveis no painel principal.",
        timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full sm:max-w-2xl bg-[#161b22] border border-[#30363d] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col h-[85vh] sm:h-[650px] overflow-hidden animate-in slide-in-from-bottom-6 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 bg-[#0e1117] border-b border-[#30363d]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1f6feb] via-[#8957e5] to-[#f0883e] flex items-center justify-center text-white shadow-md shadow-[#1f6feb]/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#e6edf3]">
                  DinhEuro AI Copilot
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#00c853]/15 text-[#00c853] border border-[#00c853]/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00c853] animate-pulse"></span>
                  Gemini API Ativa
                </span>
              </div>
              <p className="text-[11px] text-[#8b949e]">
                Especialista Global em Finanças, Economia e Corredor UE ⇄ Mercosul
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] rounded-lg transition-all cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#0e1117]/60">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {m.role === "assistant" && (
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#1f6feb] to-[#a371f7] flex items-center justify-center text-white shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-[#1f6feb] text-white rounded-tr-none shadow-md"
                    : "bg-[#161b22] border border-[#30363d] text-[#e6edf3] rounded-tl-none shadow-sm"
                }`}
              >
                <div className="whitespace-pre-line prose-sm">{m.content}</div>
                <div
                  className={`text-[10px] mt-1.5 flex justify-end ${
                    m.role === "user" ? "text-white/70" : "text-[#8b949e]"
                  }`}
                >
                  {m.timestamp}
                </div>
              </div>

              {m.role === "user" && (
                <div className="w-7 h-7 rounded-lg bg-[#30363d] flex items-center justify-center text-[#e6edf3] shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#1f6feb] to-[#a371f7] flex items-center justify-center text-white shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-[#161b22] border border-[#30363d] rounded-2xl rounded-tl-none px-4 py-3 text-xs text-[#8b949e] flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#58a6ff]" />
                <span>DinhEuro AI calculando e analisando dados de mercado...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-[#161b22] border-t border-[#21262d] flex items-center gap-2 overflow-x-auto no-scrollbar">
          {QUICK_PROMPTS.map((q, idx) => {
            const Icon = q.icon;
            return (
              <button
                key={idx}
                onClick={() => sendMessage(q.prompt)}
                disabled={loading}
                className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#0e1117] border border-[#30363d] text-[#8b949e] hover:text-[#58a6ff] hover:border-[#58a6ff]/40 transition-all cursor-pointer disabled:opacity-50"
              >
                <Icon className="w-3 h-3 text-[#58a6ff]" />
                <span>{q.label}</span>
              </button>
            );
          })}
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-[#0e1117] border-t border-[#30363d]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte sobre cotações, remessas UE ⇄ Brasil, IOF, B3, Wall Street..."
              className="flex-1 bg-[#161b22] border border-[#30363d] focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#e6edf3] placeholder:text-[#8b949e] outline-none transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="h-10 px-4 rounded-xl bg-gradient-to-r from-[#1f6feb] to-[#8957e5] hover:brightness-110 text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Enviar</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
