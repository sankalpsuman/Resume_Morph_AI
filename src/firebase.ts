import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { 
  doc, 
  getDocFromServer, 
  initializeFirestore,
  connectFirestoreEmulator,
  getFirestore
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Import the Firebase configuration
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);

// Initialize Firestore with settings to handle potential connection issues
// experimentalForceLongPolling is highly recommended in sandboxed/proxy environments.
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);
export const storage = getStorage(app);
// Increase global storage timeout/retry to handle flaky connections.
storage.maxOperationRetryTime = 180000; 
storage.maxUploadRetryTime = 180000; 

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Connection check as per guidelines
async function testConnection() {
  try {
    // Try to get a non-existent document from server to test connection
    // We use getDocFromServer to bypass local cache and force a network roundtrip
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore connection established successfully.");
  } catch (error: any) {
    if (error.code === 'unavailable' || error.message.includes('the client is offline')) {
      console.error("DEBUG: Firestore could not reach backend. Possible causes: wrong Project ID, Network Blocking, or Firestore disabled for this project.");
      console.log("Config used:", { 
        projectId: firebaseConfig.projectId, 
        databaseId: firebaseConfig.firestoreDatabaseId 
      });
    } else {
      // If it's just 'permission-denied', the connection itself is working
      if (error.code === 'permission-denied') {
        console.log("Firestore connection verified (Permission Denied is expected for 'test/connection').");
      } else {
        console.warn("Firestore connection check produced an unexpected error:", error);
      }
    }
  }
}

testConnection();
