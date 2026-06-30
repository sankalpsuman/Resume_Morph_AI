import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider,
  browserLocalPersistence,
  setPersistence
} from 'firebase/auth';
import { 
  doc, 
  getDocFromServer, 
  getFirestore,
  setLogLevel
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Import the Firebase configuration
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Silence internal SDK warning logs (like stream idle timeouts) while keeping real errors
setLogLevel('error');

export const storage = getStorage(app, `gs://${firebaseConfig.storageBucket}`);
// Increase global storage timeout/retry to handle flaky connections, but not so long that it hangs.
// We reduce this from 60s to 15s to fail-fast in restricted environments.
storage.maxOperationRetryTime = 15000; 
storage.maxUploadRetryTime = 15000; 

// Connection check as per guidelines - moved to a non-blocking lazy check
let connectionTested = false;
export async function ensureConnection() {
  if (connectionTested) return;
  connectionTested = true;
  // Firebase SDK handles its own connection and reconnection logic.
  // We avoid manual connection checks to prevent unnecessary console spam.
}
