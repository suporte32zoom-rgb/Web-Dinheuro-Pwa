import React, { useState, useEffect } from "react";
import { X, Sparkles, Send, Loader2, BookOpen, ArrowRight, ShieldCheck, RefreshCw } from "lucide-react";
import { AIAccordionTopic } from "../types/finance";

interface AIDeepDiveModalProps {
  topic: AIAccordionTopic | null;
  onClose: () => void;
}

export const AIDeepDiveModal: React.FC<AIDeepDiveModalProps> = ({ topic, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; text: string }>>([]);
  const [inputQuery, setInputQuery] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    if (!topic) return;

    let isMounted = true;
    setLoading(true);
    setContent("");
    setChatMessages([]);

    fetch(`/api/market-ai/deep-dive?t=${Date.now()}`, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
      body: JSON.stringify({
        topicTitle: topic.title,
        context: topic.detailedContext,
        region: topic.region,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          if (data && data.content) {
            setContent(data.content);
          } else {
            setContent(
              `### Análise Macroeconômica DinhEuro\n\n**Tópico:** ${topic.title}\n\n**Síntese de Inteligência:**\n${topic.summary}\n\n**Cenário em Destaque:**\n${topic.detailedContext}\n\n**Diretriz para o Investidor:**\nMonitore o fluxo de capitais e os spreads de volatilidade nos principais ativos correlacionados.`
            );
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("AI Error:", err);
        if (isMounted) {
          setContent(
            `### Análise Macroeconômica DinhEuro\n\n**Tópico:** ${topic.title}\n\n**Síntese de Inteligência:**\n${topic.summary}\n\n**Cenário em Destaque:**\n${topic.detailedContext}\n\n**Diretriz para o Investidor:**\nMonitore o fluxo de capitais e os spreads de volatilidade nos principais ativos correlacionados.`
          );
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [topic]);

  if (!topic) return null;

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim() || chatLoading) return;

    const userText = inputQuery.trim();
    setInputQuery("");
    const newHistory = [...chatMessages, { role: "user" as const, text: userText }];
    setChatMessages(newHistory);
    setChatLoading(true);

    try {
      const res = await fetch(`/api/market-ai/chat?t=${Date.now()}`, {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
        body: JSON.stringify({
          message: `${userText} (Contexto do tópico: ${topic.title} na região ${topic.region})`,
          history: newHistory.map((m) => ({ role: m.role, content: m.text })),
        }),
      });
      const data = await res.json();
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", text: data.reply || "Resposta processada com sucesso." },
      ]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Erro ao conectar com a IA DinhEuro. Tente novamente." },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        id="modal-ai-deepdive"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#30363d] flex items-center justify-between bg-[#0e1117]/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#58a6ff]/20 text-[#58a6ff] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-[#e6edf3]">
                  IA DinhEuro • Análise de Mercado
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#238636]/20 text-[#00c853] border border-[#238636]/40 font-semibold">
                  {topic.region}
                </span>
              </div>
              <p className="text-xs text-[#8b949e] truncate max-w-md">{topic.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8b949e] hover:text-white hover:bg-[#30363d] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-sm text-[#e6edf3]">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-[#8b949e]">
              <Loader2 className="w-8 h-8 text-[#58a6ff] animate-spin" />
              <p className="text-xs">Consultando modelos e dados de mercado DinhEuro...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Highlight Tag */}
              <div className="flex items-center gap-2 text-xs bg-[#0e1117] p-2.5 rounded-xl border border-[#30363d] text-[#58a6ff]">
                <ShieldCheck className="w-4 h-4 text-[#00c853] shrink-0" />
                <span>{topic.impactTag}</span>
              </div>

              {/* Main Markdown / Text Content */}
              <div className="prose prose-invert prose-sm max-w-none space-y-3 leading-relaxed text-[#c9d1d9]">
                {content.split("\n\n").map((para, idx) => {
                  if (para.startsWith("### ")) {
                    return (
                      <h4 key={idx} className="text-base font-bold text-white mt-2">
                        {para.replace("### ", "")}
                      </h4>
                    );
                  }
                  if (para.startsWith("- ")) {
                    return (
                      <ul key={idx} className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
                        {para.split("\n").map((li, lIdx) => (
                          <li key={lIdx}>{li.replace("- ", "")}</li>
                        ))}
                      </ul>
                    );
                  }
                  return (
                    <p key={idx} className="text-xs sm:text-sm">
                      {para}
                    </p>
                  );
                })}
              </div>

              {/* Interactive Q&A thread */}
              {chatMessages.length > 0 && (
                <div className="border-t border-[#30363d] pt-4 space-y-3">
                  <h5 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider">
                    Perguntas e Respostas com a IA
                  </h5>
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl text-xs sm:text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-[#1f6feb]/20 border border-[#1f6feb]/40 text-[#e6edf3] ml-6"
                          : "bg-[#0e1117] border border-[#30363d] text-[#c9d1d9] mr-6"
                      }`}
                    >
                      <div className="font-bold text-[11px] mb-1 text-[#8b949e]">
                        {msg.role === "user" ? "Você:" : "DinhEuro IA Especialista:"}
                      </div>
                      {msg.text}
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex items-center gap-2 text-xs text-[#8b949e] italic p-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#58a6ff]" />
                      <span>Gerando resposta financeira...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer / Chat Input */}
        <div className="p-4 border-t border-[#30363d] bg-[#0e1117]/80">
          <form onSubmit={handleSendChat} className="flex items-center gap-2">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Faça uma pergunta sobre este tópico (ex: Como isso afeta o dólar?)..."
              className="flex-1 bg-[#161b22] border border-[#30363d] focus:border-[#58a6ff] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-[#e6edf3] placeholder-[#8b949e] focus:outline-none"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || chatLoading}
              className="p-2.5 rounded-xl bg-[#238636] hover:bg-[#2ea043] disabled:opacity-50 text-white font-medium transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
