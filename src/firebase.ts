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
// Increase global storage timeout/retry to handle flaky connections, 
// though we usually want it to fail faster in this environment if it's blocking.
// But the SDK default is 10 mins, which might be why it hangs.
storage.maxOperationRetryTime = 30000; // 30 seconds
storage.maxUploadRetryTime = 60000; // 60 seconds

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
