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
      // If we already hit retry-limit-exceeded, it means the SDK internal retries failed.
      // We check for other retryable codes or if it's the first time we see retry-limit-exceeded.
      const isRetryable = error.code === 'storage/retry-limit-exceeded' || 
                         error.code === 'storage/unknown' || 
                         error.code === 'storage/server-file-wrong-size' ||
                         error.message?.includes('retry');
      
      if (!isRetryable || attempt > maxRetries) {
        console.error(`Storage upload failed after ${attempt} attempts:`, error);
        throw error;
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
      const isRetryable = error.code === 'storage/retry-limit-exceeded' || 
                         error.code === 'storage/unknown' ||
                         error.message?.includes('retry');
      
      if (!isRetryable || attempt > maxRetries) {
        // If it's a delete operation and it's hanging, we might want to just log it 
        // and proceed so the user's UI isn't blocked by a cleanup task.
        console.error(`Storage delete failed after ${attempt} attempts:`, error);
        // We log but don't necessarily want to block the whole app flow if it's just cleanup
        return; 
      }
      
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
