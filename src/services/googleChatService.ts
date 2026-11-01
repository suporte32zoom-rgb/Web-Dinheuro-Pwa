/**
 * DinhEuro.com - Google Chat API & Firebase Workspace Integration Service
 * Suporte a listagem e criação de Spaces, envio e leitura de mensagens,
 * e compartilhamento de relatórios financeiros diretamente no Google Chat.
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase App safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

export const CHAT_SCOPES = [
  "https://www.googleapis.com/auth/chat.spaces",
  "https://www.googleapis.com/auth/chat.spaces.readonly",
  "https://www.googleapis.com/auth/chat.spaces.create",
  "https://www.googleapis.com/auth/chat.messages",
  "https://www.googleapis.com/auth/chat.messages.readonly",
  "https://www.googleapis.com/auth/chat.messages.create",
  "https://www.googleapis.com/auth/chat.messages.reactions",
  "https://www.googleapis.com/auth/chat.messages.reactions.readonly",
  "https://www.googleapis.com/auth/chat.memberships",
  "https://www.googleapis.com/auth/chat.memberships.readonly",
  "https://www.googleapis.com/auth/chat.customemojis.readonly",
];

const provider = new GoogleAuthProvider();
for (const scope of CHAT_SCOPES) {
  provider.addScope(scope);
}

// In-memory token management
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export interface GoogleChatSpace {
  name: string; // e.g. "spaces/AAAA..."
  displayName?: string;
  type: "SPACE" | "GROUP_CHAT" | "DIRECT_MESSAGE" | string;
  spaceType?: string;
  singleUserBotDm?: boolean;
}

export interface GoogleChatMessage {
  name: string;
  text?: string;
  formattedText?: string;
  sender?: {
    name?: string;
    displayName?: string;
    type?: string;
    avatarUrl?: string;
  };
  createTime?: string;
  space?: {
    name?: string;
  };
}

/**
 * Inicializa ouvinte de estado de autenticação
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user && cachedAccessToken) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else {
      if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    }
  });
};

/**
 * Realiza login com Google via Firebase Auth e obtém token OAuth
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (!credential?.accessToken) {
      throw new Error("Não foi possível obter o token de acesso do Google Workspace.");
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error("[GoogleChatService] Erro no login com Google:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Retorna o token de acesso armazenado em memória
 */
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

/**
 * Desconecta a conta do Google
 */
export const logoutGoogle = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
};

/**
 * 1. Lista os Spaces (espaços e canais) do usuário no Google Chat
 */
export async function listChatSpaces(): Promise<GoogleChatSpace[]> {
  const token = await getAccessToken();
  if (!token) throw new Error("Usuário não autenticado no Google Chat.");

  const res = await fetch("https://chat.googleapis.com/v1/spaces", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Erro HTTP ${res.status} ao carregar Spaces`);
  }

  const data = await res.json();
  return data.spaces || [];
}

/**
 * 2. Cria um novo Space no Google Chat (com confirmação explícita do usuário)
 */
export async function createChatSpace(displayName: string): Promise<GoogleChatSpace> {
  const token = await getAccessToken();
  if (!token) throw new Error("Usuário não autenticado no Google Chat.");

  const res = await fetch("https://chat.googleapis.com/v1/spaces", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      displayName,
      spaceType: "SPACE",
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Erro ao criar Space (${res.status})`);
  }

  return await res.json();
}

/**
 * 3. Lista mensagens recentes de um Space
 */
export async function listChatMessages(spaceName: string): Promise<GoogleChatMessage[]> {
  const token = await getAccessToken();
  if (!token) throw new Error("Usuário não autenticado no Google Chat.");

  const url = `https://chat.googleapis.com/v1/${spaceName}/messages?pageSize=25`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Erro ao listar mensagens (${res.status})`);
  }

  const data = await res.json();
  return (data.messages || []).reverse(); // Ordena da mais antiga para a mais recente
}

/**
 * 4. Envia mensagem para um Space no Google Chat
 */
export async function sendChatMessage(spaceName: string, text: string): Promise<GoogleChatMessage> {
  const token = await getAccessToken();
  if (!token) throw new Error("Usuário não autenticado no Google Chat.");

  const url = `https://chat.googleapis.com/v1/${spaceName}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Erro ao enviar mensagem (${res.status})`);
  }

  return await res.json();
}
