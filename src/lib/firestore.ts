import { auth } from '../firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMsg = error instanceof Error ? error.message : String(error);
  const errCode = (error as any)?.code;

  if (
    errCode === 'cancelled' ||
    errCode === 1 ||
    errMsg.includes('CANCELLED') ||
    errMsg.includes('Disconnecting idle stream') ||
    errMsg.includes('Timed out waiting for new targets')
  ) {
    console.warn(`[Firestore] Transient idle stream disconnect on ${path || 'unknown'}: ${errMsg}`);
    return;
  }

  const errInfo = {
    message: error instanceof Error ? error.message : String(error),
    code: errCode,
    operationType,
    path,
    timestamp: new Date().toISOString(),
    // Include minimal auth context for debugging without exposing full profile
    userId: auth.currentUser?.uid || 'anonymous'
  };

  console.error('[Firestore Error]', errInfo);
  
  // Throw a standard error with the message to avoid breaking standard catch blocks
  const finalError = new Error(errInfo.message);
  (finalError as any).details = errInfo;
  throw finalError;
}
