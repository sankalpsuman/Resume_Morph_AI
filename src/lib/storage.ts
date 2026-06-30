import { ref, uploadString, deleteObject, FirebaseStorage, StorageReference } from 'firebase/storage';

export async function uploadWithRetry(
  storageRef: StorageReference,
  data: string,
  format: 'raw' | 'base64' | 'base64url' | 'data_url' = 'raw',
  metadata?: any,
  maxRetries = 3
): Promise<void> {
  let attempt = 0;
  
  while (attempt <= maxRetries) {
    try {
      await uploadString(storageRef, data, format, metadata);
      return;
    } catch (error: any) {
      attempt++;
      
      const isRetryLimit = error.code === 'storage/retry-limit-exceeded' || 
                         error.message?.includes('retry-limit-exceeded');
                         
      if (isRetryLimit) {
        console.warn(`[Storage] Retry limit reached for ${storageRef.name}. This often indicates network/firewall restrictions in the preview environment.`);
        // We throw but with a cleaner message
        throw new Error(`Storage operation timed out. Data was still saved to Firestore history.`);
      }

      const isRetryable = error.code === 'storage/unknown' || 
                         error.code === 'storage/server-file-wrong-size' ||
                         error.code === 'storage/cannot-slice-blob' ||
                         error.message?.toLowerCase().includes('network');
      
      if (!isRetryable || attempt > maxRetries) {
        const dataSize = data ? (typeof data === 'string' ? data.length : 'unknown') : 0;
        console.warn(`[Storage Backup] Upload skipped (Size: ${dataSize} bytes):`, error.code || error.message);
        return; // Resolve gracefully instead of throwing to prevent unhandled rejections
      }
      
      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000;
      console.warn(`Storage upload failed (attempt ${attempt}). Retrying in ${delay}ms...`, error.code);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

export async function deleteWithRetry(
  storageRef: StorageReference,
  maxRetries = 2
): Promise<void> {
  let attempt = 0;
  
  while (attempt <= maxRetries) {
    try {
      await deleteObject(storageRef);
      return;
    } catch (error: any) {
      // If object not found, we consider it "deleted" successfully for our purposes
      if (error.code === 'storage/object-not-found') {
        return;
      }

      attempt++;
      
      const isRetryLimit = error.code === 'storage/retry-limit-exceeded' || 
                         error.message?.includes('retry-limit-exceeded');

      if (isRetryLimit) {
        console.warn(`[Storage] Delete operation timed out for ${storageRef.name}.`);
        return; // For delete, we treat timeout as "best effort reached"
      }

      const isRetryable = error.code === 'storage/unknown' ||
                         error.message?.includes('retry');
      
      if (!isRetryable || attempt > maxRetries) {
        console.warn(`[Storage Backup] Delete skipped:`, error.code || error.message);
        return; 
      }
      
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
