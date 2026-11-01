import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  FileText,
  ShieldCheck,
  Cookie,
  Info,
  AlertTriangle,
  Printer,
  Mail,
  Search,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  Share2,
} from "lucide-react";
import { LegalDocId, LegalDocument } from "../types/legal";
import { LEGAL_DOCUMENTS } from "../data/legalDocuments";
import { BrandLogo } from "./BrandLogo";

interface InstitutionalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDocId?: LegalDocId;
  onSelectDoc?: (docId: LegalDocId) => void;
}

const DOC_ICONS: Record<LegalDocId, React.ReactNode> = {
  "termos-de-uso": <FileText className="w-4 h-4 text-[#58a6ff]" />,
  "politica-de-privacidade": <ShieldCheck className="w-4 h-4 text-[#00c853]" />,
  "politica-de-cookies": <Cookie className="w-4 h-4 text-[#e3b341]" />,
  "sobre": <Info className="w-4 h-4 text-[#8957e5]" />,
  "disclaimer": <AlertTriangle className="w-4 h-4 text-[#f0883e]" />,
};

export const InstitutionalModal: React.FC<InstitutionalModalProps> = ({
  isOpen,
  onClose,
  initialDocId = "termos-de-uso",
  onSelectDoc,
}) => {
  const [currentDocId, setCurrentDocId] = useState<LegalDocId>(initialDocId);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (initialDocId) {
      setCurrentDocId(initialDocId);
    }
  }, [initialDocId]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const currentDoc: LegalDocument = LEGAL_DOCUMENTS[currentDocId] || LEGAL_DOCUMENTS["termos-de-uso"];

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return currentDoc.sections;
    const query = searchQuery.toLowerCase();
    return currentDoc.sections.filter(
      (sec) =>
        sec.title.toLowerCase().includes(query) ||
        sec.content.some((c) => c.toLowerCase().includes(query))
    );
  }, [currentDoc, searchQuery]);

  const handleSelectTab = (docId: LegalDocId) => {
    setCurrentDocId(docId);
    setSearchQuery("");
    if (onSelectDoc) {
      onSelectDoc(docId);
    }
    // Update browser URL silently without reloading
    window.history.pushState({}, "", `/${docId}`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/${currentDoc.id}`;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-5xl h-[92vh] max-h-[900px] bg-[#0e1117] border border-[#30363d] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#c9d1d9]"
        role="dialog"
        aria-modal="true"
        aria-label={currentDoc.title}
      >
        {/* Modal Top Header */}
        <div className="px-5 py-4 border-b border-[#21262d] bg-[#161b22] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <BrandLogo size="sm" showText={true} showSubtitle={false} />
            <span className="hidden sm:inline-block w-px h-5 bg-[#30363d]" />
            <span className="text-xs font-semibold text-[#8b949e] hidden sm:inline">
              Centro Institucional, Jurídico & Compliance Digital
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 rounded-lg text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] transition-colors cursor-pointer text-xs flex items-center gap-1.5"
              title="Imprimir documento legal"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-colors cursor-pointer ml-1"
              title="Fechar janela (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Body: Sidebar Tabs + Reader Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Navigation Tabs (Sidebar on Desktop, Horizontal on Mobile) */}
          <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-[#21262d] bg-[#12161f] p-3 md:p-4 shrink-0 flex md:flex-col overflow-x-auto md:overflow-x-visible md:overflow-y-auto gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8b949e] px-2 py-1 hidden md:block">
              Documentos Legais
            </span>

            {(Object.keys(LEGAL_DOCUMENTS) as LegalDocId[]).map((docKey) => {
              const doc = LEGAL_DOCUMENTS[docKey];
              const isSelected = currentDocId === docKey;
              return (
                <button
                  key={docKey}
                  type="button"
                  onClick={() => handleSelectTab(docKey)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-left whitespace-nowrap md:whitespace-normal shrink-0 md:shrink cursor-pointer ${
                    isSelected
                      ? "bg-[#1f6feb]/20 text-[#58a6ff] border border-[#1f6feb]/40 font-semibold"
                      : "text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#161b22] border border-transparent"
                  }`}
                >
                  <span className="shrink-0">{DOC_ICONS[docKey]}</span>
                  <span className="flex-1 truncate">{doc.title}</span>
                  {isSelected && (
                    <ChevronRight className="w-3.5 h-3.5 text-[#58a6ff] hidden md:block" />
                  )}
                </button>
              );
            })}

            {/* DPO Support Contact Box in Sidebar */}
            <div className="hidden md:block mt-auto pt-4 border-t border-[#21262d] space-y-2">
              <div className="p-3 rounded-xl bg-[#161b22] border border-[#30363d] space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#e6edf3]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#00c853]" />
                  <span>Encarregado DPO</span>
                </div>
                <p className="text-[11px] text-[#8b949e] leading-relaxed">
                  Dúvidas sobre tratamento de dados ou exercício de direitos LGPD:
                </p>
                <a
                  href="mailto:admin@dinheuro.com.br"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#58a6ff] hover:underline"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>admin@dinheuro.com.br</span>
                </a>
              </div>
            </div>
          </aside>

          {/* Right Main Content Area */}
          <main className="flex-1 flex flex-col overflow-y-auto bg-[#0e1117] p-5 sm:p-8">
            {/* Document Header */}
            <div className="space-y-3 pb-6 border-b border-[#21262d]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-[#161b22] border border-[#30363d]">
                    {DOC_ICONS[currentDoc.id]}
                  </span>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-[#e6edf3] tracking-tight">
                      {currentDoc.title}
                    </h1>
                    <p className="text-xs sm:text-sm text-[#8b949e] mt-0.5">
                      {currentDoc.subtitle}
                    </p>
                  </div>
                </div>

                {currentDoc.badge && (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-[#161b22] text-[#3fb950] border border-[#30363d]">
                    {currentDoc.badge}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-xs text-[#8b949e]">
                <div className="flex items-center gap-4">
                  <span>
                    Última revisão oficial:{" "}
                    <strong className="text-[#c9d1d9]">{currentDoc.lastUpdated}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    URL Canônica:{" "}
                    <span className="font-mono text-[#58a6ff]">{currentDoc.path}</span>
                  </span>
                </div>

                {/* Filter Search within Doc */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-[#8b949e] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filtrar tópicos no documento..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#161b22] border border-[#30363d] text-xs text-[#e6edf3] placeholder-[#8b949e] focus:outline-none focus:border-[#58a6ff] transition-colors"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8b949e] hover:text-white text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Document Sections Content */}
            <div className="py-6 space-y-8 flex-1">
              {filteredSections.length > 0 ? (
                filteredSections.map((sec) => (
                  <article
                    key={sec.id}
                    id={sec.id}
                    className="space-y-3 scroll-mt-6 p-4 sm:p-5 rounded-xl bg-[#161b22]/50 border border-[#21262d]/80 hover:border-[#30363d] transition-colors"
                  >
                    <h2 className="text-base sm:text-lg font-bold text-[#e6edf3] tracking-tight flex items-center gap-2">
                      <span className="w-1.5 h-4 bg-[#00c853] rounded-full inline-block" />
                      {sec.title}
                    </h2>
                    <div className="space-y-2.5 text-xs sm:text-sm leading-relaxed text-[#c9d1d9]/90 font-sans">
                      {sec.content.map((p, idx) => (
                        <p key={idx}>{p}</p>
                      ))}
                    </div>
                  </article>
                ))
              ) : (
                <div className="py-12 text-center space-y-2">
                  <p className="text-sm text-[#8b949e]">
                    Nenhum tópico encontrado para "{searchQuery}".
                  </p>
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="text-xs text-[#58a6ff] hover:underline cursor-pointer"
                  >
                    Limpar filtro de busca
                  </button>
                </div>
              )}
            </div>

            {/* Document Bottom Footer Note */}
            <div className="pt-6 border-t border-[#21262d] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8b949e]">
              <p>
                DinhEuro (dinheuro.com.br / dinheuro.com) • Todos os direitos reservados.
              </p>
              <div className="flex items-center gap-3">
                <a
                  href="mailto:admin@dinheuro.com.br"
                  className="hover:text-[#58a6ff] transition-colors flex items-center gap-1"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Suporte Jurídico: admin@dinheuro.com.br</span>
                </a>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
