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
  initializeFirestore
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Import the Firebase configuration
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore with settings to handle potential connection issues
// experimentalForceLongPolling is highly recommended in sandboxed/proxy environments.
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  // Use a shorter timeout to fail-fast and retry if needed
}, firebaseConfig.firestoreDatabaseId || '(default)');

export const storage = getStorage(app, `gs://${firebaseConfig.storageBucket}`);
// Increase global storage timeout/retry to handle flaky connections, but not so long that it hangs.
// We reduce this from 60s to 15s to fail-fast in restricted environments.
storage.maxOperationRetryTime = 15000; 
storage.maxUploadRetryTime = 15000; 

// Connection check as per guidelines - moved to a non-blocking lazy check
let connectionTested = false;
export async function ensureConnection() {
  if (connectionTested) return;
  console.log(`[Firebase] Checking connection to database: ${firebaseConfig.firestoreDatabaseId || '(default)'} in project: ${firebaseConfig.projectId}`);
  try {
    // Try to get a non-existent document from server to test connection
    // We use getDocFromServer to bypass local cache and force a network roundtrip
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore connection established successfully.");
    connectionTested = true;
  } catch (error: any) {
    console.error("[Firebase] Connection check failed:", error.code, error.message);
    if (error.code === 'unavailable' || error.message.includes('the client is offline')) {
      console.error("DEBUG: Firestore could not reach backend. Possible causes: wrong Project ID, Network Blocking, or Firestore disabled for this project.");
    } else if (error.code === 'permission-denied') {
      console.log("Firestore connection verified (Permission Denied is expected).");
      connectionTested = true;
    }
  }
}
