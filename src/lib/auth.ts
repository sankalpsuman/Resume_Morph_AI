import { auth } from '../firebase';
import { signInWithPopup, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

const githubProvider = new GithubAuthProvider();

export async function loginWithGoogle() {
  if (!auth) throw new Error('Auth not initialized');
  return await signInWithPopup(auth, googleProvider);
}

export async function loginWithGithub() {
  if (!auth) throw new Error('Auth not initialized');
  return await signInWithPopup(auth, githubProvider);
}
