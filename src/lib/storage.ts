import { ref, uploadString, FirebaseStorage, StorageReference } from 'firebase/storage';

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
      const isRetryable = error.code === 'storage/retry-limit-exceeded' || 
                         error.code === 'storage/unknown' || 
                         error.code === 'storage/server-file-wrong-size';
      
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
