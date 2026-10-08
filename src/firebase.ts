import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

// Configuração fornecida pelo usuário
const firebaseConfig = {
  apiKey: "AIzaSyCFsEexpAbmW7F4DSpZGum1Ve686BsOFE0",
  authDomain: "app-easyroutine-anaclaragg.firebaseapp.com",
  projectId: "app-easyroutine-anaclaragg",
  storageBucket: "app-easyroutine-anaclaragg.firebasestorage.app",
  messagingSenderId: "774138853781",
  appId: "1:774138853781:web:c965fe9b9666c4fdd35e9c",
  measurementId: "G-BN1QF0MKSX"
};

// Inicialização do Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Inicializa Analytics de forma segura (verifica se é suportado no ambiente de iframe)
export let analytics: any = null;
isSupported().then((supported) => {
  if (supported) {
    try {
      analytics = getAnalytics(app);
    } catch (e) {
      console.warn("Analytics não pôde ser iniciado neste ambiente (sandbox/iframe).", e);
    }
  }
});

// Enumeração de operações para tratamento avançado de erros do Firestore (Requisito da Skill)
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

/**
 * Função utilitária obrigatória para capturar falhas de segurança e erros no Firestore,
 * formatando de acordo com as especificações exigidas.
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error("Firestore Error Detailed: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
