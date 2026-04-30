import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Import the Firebase configuration
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);

// Initialize Firestore with settings to handle potential connection issues
// Some environments (like specific proxies or browser extensions) block WebSockets
// experimentalForceLongPolling helps in these scenarios.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  }),
  experimentalForceLongPolling: true
}, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);
export const storage = getStorage(app);
// Increase global storage timeout/retry to handle flaky connections.
// The SDK default is 10 mins (600,000ms), but we previously set it to 30s which might be too aggressive.
// Setting it to 3 minutes (180,000ms) provides a better balance.
storage.maxOperationRetryTime = 180000; 
storage.maxUploadRetryTime = 180000; 

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Connection check as per guidelines
async function testConnection() {
  try {
    // Try to get a non-existent document from server to test connection
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore connection established successfully.");
  } catch (error: any) {
    console.warn("Firestore connectivity warning:", error.message);
    if (error.code === 'unavailable' || error.message.includes('the client is offline')) {
      console.error("DEBUG: Firestore could not reach backend. Possible causes: wrong Project ID, Network Blocking, or Firestore disabled for this project.");
      console.log("Config used:", { 
        projectId: firebaseConfig.projectId, 
        databaseId: firebaseConfig.firestoreDatabaseId 
      });
    }
  }
}

testConnection();
