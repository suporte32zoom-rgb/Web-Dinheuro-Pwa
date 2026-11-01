import React, { useState, useEffect } from "react";
import { User } from "firebase/auth";
import {
  X,
  MessageSquare,
  Send,
  Plus,
  RefreshCw,
  LogOut,
  Users,
  Building,
  CheckCircle,
  AlertCircle,
  Share2,
  ExternalLink,
} from "lucide-react";
import {
  googleSignIn,
  logoutGoogle,
  listChatSpaces,
  createChatSpace,
  listChatMessages,
  sendChatMessage,
  GoogleChatSpace,
  GoogleChatMessage,
  auth,
} from "../services/googleChatService";

interface GoogleChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialShareText?: string;
}

export const GoogleChatModal: React.FC<GoogleChatModalProps> = ({
  isOpen,
  onClose,
  initialShareText,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [spaces, setSpaces] = useState<GoogleChatSpace[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<GoogleChatSpace | null>(null);
  const [messages, setMessages] = useState<GoogleChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState(initialShareText || "");
  const [newSpaceName, setNewSpaceName] = useState("");
  const [isCreatingSpace, setIsCreatingSpace] = useState(false);

  // Loading & error states
  const [loadingSpaces, setLoadingSpaces] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Confirmation dialogs
  const [confirmDialog, setConfirmDialog] = useState<{
    type: "send_message" | "create_space";
    title: string;
    description: string;
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    if (initialShareText) {
      setMessageInput(initialShareText);
    }
  }, [initialShareText]);

  useEffect(() => {
    if (isOpen && currentUser) {
      loadSpaces();
    }
  }, [isOpen, currentUser]);

  useEffect(() => {
    if (selectedSpace) {
      loadMessages(selectedSpace.name);
    } else {
      setMessages([]);
    }
  }, [selectedSpace]);

  const loadSpaces = async () => {
    setLoadingSpaces(true);
    setErrorMessage(null);
    try {
      const data = await listChatSpaces();
      setSpaces(data);
      if (data.length > 0 && !selectedSpace) {
        setSelectedSpace(data[0]);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Falha ao listar espaços do Google Chat.");
    } finally {
      setLoadingSpaces(false);
    }
  };

  const loadMessages = async (spaceName: string) => {
    setLoadingMessages(true);
    try {
      const data = await listChatMessages(spaceName);
      setMessages(data);
    } catch (err: any) {
      console.warn("Erro ao carregar mensagens do chat:", err?.message);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setErrorMessage(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setCurrentUser(res.user);
        setSuccessMessage(`Conectado como ${res.user.displayName || res.user.email}`);
        setTimeout(() => setSuccessMessage(null), 3500);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Falha na autenticação com Google Workspace.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logoutGoogle();
    setCurrentUser(null);
    setSpaces([]);
    setSelectedSpace(null);
    setMessages([]);
  };

  const requestCreateSpace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpaceName.trim()) return;

    setConfirmDialog({
      type: "create_space",
      title: "Criar novo Space no Google Chat?",
      description: `Será criado o espaço público ou sala "${newSpaceName.trim()}" na sua organização do Google Workspace com permissão da sua conta.`,
      onConfirm: async () => {
        setConfirmDialog(null);
        setIsCreatingSpace(true);
        try {
          const newSp = await createChatSpace(newSpaceName.trim());
          setSuccessMessage(`Espaço "${newSp.displayName || newSpaceName}" criado com sucesso!`);
          setNewSpaceName("");
          await loadSpaces();
          setSelectedSpace(newSp);
          setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err: any) {
          setErrorMessage(err?.message || "Erro ao criar espaço no Google Chat.");
        } finally {
          setIsCreatingSpace(false);
        }
      },
    });
  };

  const requestSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSpace || !messageInput.trim()) return;

    const spaceTitle = selectedSpace.displayName || selectedSpace.name;
    const textToSend = messageInput.trim();

    setConfirmDialog({
      type: "send_message",
      title: `Enviar mensagem para "${spaceTitle}"?`,
      description: `A mensagem abaixo será publicada no Google Chat em seu nome:\n\n"${textToSend.length > 80 ? textToSend.substring(0, 80) + "..." : textToSend}"`,
      onConfirm: async () => {
        setConfirmDialog(null);
        setIsSending(true);
        try {
          await sendChatMessage(selectedSpace.name, textToSend);
          setMessageInput("");
          setSuccessMessage("Mensagem enviada com sucesso ao Google Chat!");
          await loadMessages(selectedSpace.name);
          setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err: any) {
          setErrorMessage(err?.message || "Erro ao enviar mensagem.");
        } finally {
          setIsSending(false);
        }
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-3xl bg-[#161b22] border border-[#30363d] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-[#e6edf3]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#30363d] bg-[#0e1117] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00ac47] via-[#00832d] to-[#1f6feb] flex items-center justify-center text-white shadow-md">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#e6edf3]">
                  Google Chat • DinhEuro Workspace
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#00c853]/15 text-[#00c853] border border-[#00c853]/30">
                  API Oficial
                </span>
              </div>
              <p className="text-[11px] text-[#8b949e]">
                Compartilhe cotações, alertas de câmbio e relatórios com sua equipe no Google Chat
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] rounded-lg transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications Bar */}
        {errorMessage && (
          <div className="px-4 py-2.5 bg-red-900/30 border-b border-red-500/30 text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span className="flex-1">{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-red-200">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="px-4 py-2.5 bg-emerald-900/30 border-b border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="flex-1">{successMessage}</span>
            <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-emerald-200">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modal Body */}
        {!currentUser ? (
          /* Unauthenticated State: Sign In With Google */
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-[#21262d] border border-[#30363d] flex items-center justify-center shadow-inner text-[#58a6ff]">
              <MessageSquare className="w-8 h-8" />
            </div>

            <div className="max-w-md space-y-2">
              <h4 className="text-base font-bold text-[#e6edf3]">
                Conectar ao Google Chat & Google Workspace
              </h4>
              <p className="text-xs text-[#8b949e] leading-relaxed">
                Faça login com sua conta Google para listar seus espaços (Spaces), canais de comunicação e enviar cotações e análises diretamente aos membros do seu time.
              </p>
            </div>

            {/* Official Google Sign-In Material Button */}
            <button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="inline-flex items-center gap-3 px-6 py-3 bg-white text-[#3c4043] hover:bg-gray-100 border border-gray-300 rounded-xl font-medium text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <span>{isLoggingIn ? "Conectando..." : "Sign in with Google"}</span>
            </button>
          </div>
        ) : (
          /* Authenticated Workspace View */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden divide-y md:divide-y-0 md:divide-x divide-[#30363d]">
            {/* Sidebar: Spaces List & User Profile */}
            <div className="w-full md:w-64 bg-[#0e1117] p-3 flex flex-col justify-between shrink-0">
              <div className="space-y-3">
                {/* User Info */}
                <div className="p-2.5 rounded-xl bg-[#161b22] border border-[#30363d] flex items-center justify-between">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    {currentUser.photoURL ? (
                      <img src={currentUser.photoURL} alt="Avatar" className="w-7 h-7 rounded-full" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-[#58a6ff] text-white flex items-center justify-center font-bold text-xs">
                        {currentUser.displayName?.[0] || "U"}
                      </div>
                    )}
                    <div className="truncate">
                      <p className="text-xs font-bold text-[#e6edf3] truncate">
                        {currentUser.displayName || "Usuário"}
                      </p>
                      <p className="text-[10px] text-[#8b949e] truncate">{currentUser.email}</p>
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="p-1 text-[#8b949e] hover:text-red-400 hover:bg-[#21262d] rounded"
                    title="Desconectar"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Spaces Header */}
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold text-[#8b949e] uppercase tracking-wider">
                    Espaços & Canais
                  </span>
                  <button
                    onClick={loadSpaces}
                    disabled={loadingSpaces}
                    className="text-[#8b949e] hover:text-[#e6edf3]"
                    title="Recarregar Espaços"
                  >
                    <RefreshCw className={`w-3 h-3 ${loadingSpaces ? "animate-spin text-[#58a6ff]" : ""}`} />
                  </button>
                </div>

                {/* Spaces List */}
                <div className="space-y-1 max-h-48 md:max-h-64 overflow-y-auto pr-1">
                  {loadingSpaces && spaces.length === 0 ? (
                    <div className="p-3 text-center text-xs text-[#8b949e]">Carregando espaços...</div>
                  ) : spaces.length === 0 ? (
                    <div className="p-3 text-center text-xs text-[#8b949e] bg-[#161b22] rounded-lg border border-[#30363d]">
                      Nenhum espaço encontrado no Google Chat.
                    </div>
                  ) : (
                    spaces.map((sp) => {
                      const isSelected = selectedSpace?.name === sp.name;
                      return (
                        <button
                          key={sp.name}
                          onClick={() => setSelectedSpace(sp)}
                          className={`w-full text-left p-2 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer ${
                            isSelected
                              ? "bg-[#1f6feb] text-white font-semibold shadow-xs"
                              : "text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#161b22]"
                          }`}
                        >
                          <Users className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{sp.displayName || sp.name.replace("spaces/", "Espaço ")}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Create New Space Input */}
              <form onSubmit={requestCreateSpace} className="mt-3 pt-3 border-t border-[#21262d]">
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newSpaceName}
                    onChange={(e) => setNewSpaceName(e.target.value)}
                    placeholder="Novo espaço..."
                    className="flex-1 bg-[#161b22] border border-[#30363d] focus:border-[#58a6ff] rounded-lg px-2.5 py-1.5 text-xs text-[#e6edf3] outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!newSpaceName.trim() || isCreatingSpace}
                    className="p-1.5 rounded-lg bg-[#238636] hover:bg-[#2ea043] text-white disabled:opacity-50 cursor-pointer"
                    title="Criar Espaço"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </div>

            {/* Main Chat Area: Messages & Sender */}
            <div className="flex-1 flex flex-col justify-between bg-[#161b22] overflow-hidden min-h-[350px]">
              {selectedSpace ? (
                <>
                  {/* Space Subheader */}
                  <div className="p-3 bg-[#0e1117] border-b border-[#30363d] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#58a6ff]" />
                      <h4 className="text-xs font-bold text-[#e6edf3]">
                        {selectedSpace.displayName || selectedSpace.name}
                      </h4>
                    </div>
                    <span className="text-[10px] text-[#8b949e] font-mono">{selectedSpace.spaceType || "SPACE"}</span>
                  </div>

                  {/* Messages Timeline */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#0e1117]/40">
                    {loadingMessages ? (
                      <div className="p-4 text-center text-xs text-[#8b949e]">Carregando histórico...</div>
                    ) : messages.length === 0 ? (
                      <div className="p-6 text-center text-xs text-[#8b949e] space-y-1">
                        <p className="font-semibold text-[#e6edf3]">Nenhuma mensagem recente neste espaço.</p>
                        <p>Envie cotações ou mensagens abaixo para notificar os membros do Google Chat.</p>
                      </div>
                    ) : (
                      messages.map((m) => (
                        <div key={m.name} className="p-3 rounded-xl bg-[#161b22] border border-[#30363d] text-xs space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-[#8b949e]">
                            <span className="font-bold text-[#58a6ff]">
                              {m.sender?.displayName || "Membro"}
                            </span>
                            <span>
                              {m.createTime ? new Date(m.createTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : ""}
                            </span>
                          </div>
                          <p className="text-[#e6edf3] whitespace-pre-wrap leading-relaxed">{m.text}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Message Composer */}
                  <form onSubmit={requestSendMessage} className="p-3 bg-[#0e1117] border-t border-[#30363d]">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder={`Enviar mensagem para ${selectedSpace.displayName || "o espaço"}...`}
                        className="flex-1 bg-[#161b22] border border-[#30363d] focus:border-[#58a6ff] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#e6edf3] outline-none"
                      />
                      <button
                        type="submit"
                        disabled={!messageInput.trim() || isSending}
                        className="h-10 px-4 rounded-xl bg-gradient-to-r from-[#00ac47] to-[#1f6feb] hover:brightness-110 text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer shadow-md"
                      >
                        <Send className="w-4 h-4" />
                        <span className="hidden sm:inline">Enviar</span>
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-xs text-[#8b949e]">
                  <MessageSquare className="w-8 h-8 text-[#8b949e] mb-2" />
                  <p>Selecione um espaço no menu à esquerda para visualizar e enviar mensagens.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Confirmation Modal (Mandatory for Workspace mutations) */}
        {confirmDialog && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <div className="w-full max-w-md bg-[#161b22] border border-[#30363d] rounded-2xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-amber-400">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <h4 className="text-sm font-bold text-[#e6edf3]">{confirmDialog.title}</h4>
              </div>
              <p className="text-xs text-[#8b949e] whitespace-pre-line leading-relaxed">
                {confirmDialog.description}
              </p>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#21262d]">
                <button
                  onClick={() => setConfirmDialog(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDialog.onConfirm}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#238636] hover:bg-[#2ea043] transition-all cursor-pointer shadow-sm"
                >
                  Confirmar Ação
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
