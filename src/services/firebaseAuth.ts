import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/drive.readonly');
provider.setCustomParameters({
  prompt: 'select_account',
});

const TOKEN_KEY = 'hsc_google_access_token';

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const getStoredAccessToken = (uid?: string): string | null => {
  try {
    if (uid) {
      const userToken = localStorage.getItem(`${TOKEN_KEY}_${uid}`);
      if (userToken) return userToken;
    }
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const storeAccessToken = (token: string, uid?: string) => {
  try {
    cachedAccessToken = token;
    localStorage.setItem(TOKEN_KEY, token);
    if (uid) {
      localStorage.setItem(`${TOKEN_KEY}_${uid}`, token);
    }
  } catch (e) {
    console.error('Failed to save access token', e);
  }
};

export const clearStoredAccessToken = (uid?: string) => {
  try {
    cachedAccessToken = null;
    localStorage.removeItem(TOKEN_KEY);
    if (uid) {
      localStorage.removeItem(`${TOKEN_KEY}_${uid}`);
    }
  } catch (e) {
    console.error('Failed to clear access token', e);
  }
};

export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (!cachedAccessToken) {
        cachedAccessToken = getStoredAccessToken(user.uid);
      }
      if (onAuthSuccess) {
        onAuthSuccess(user, cachedAccessToken);
      }
    } else {
      cachedAccessToken = null;
      clearStoredAccessToken();
      if (onAuthFailure) {
        onAuthFailure();
      }
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Could not obtain Google OAuth access token from authentication result');
    }

    cachedAccessToken = credential.accessToken;
    storeAccessToken(cachedAccessToken, result.user.uid);
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  if (!cachedAccessToken) {
    cachedAccessToken = getStoredAccessToken(auth.currentUser?.uid);
  }
  return cachedAccessToken;
};

export const setCachedToken = (token: string | null) => {
  cachedAccessToken = token;
  if (token) {
    storeAccessToken(token, auth.currentUser?.uid);
  } else {
    clearStoredAccessToken(auth.currentUser?.uid);
  }
};

export const logout = async () => {
  const uid = auth.currentUser?.uid;
  await signOut(auth);
  clearStoredAccessToken(uid);
};
