import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const e = import.meta.env;

const app = initializeApp({
  apiKey: e.VITE_FB_KEY,
  authDomain: e.VITE_FB_DOMAIN,
  projectId: e.VITE_FB_PROJECT,
  appId: e.VITE_FB_APP,
});

export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
});
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

export const ADMIN = e.VITE_ADMIN_EMAIL;
export const SITE = e.VITE_SITE_NAME || 'paradiso';
export const CLOUD = e.VITE_CLOUD_NAME;
export const PRESET = e.VITE_CLOUD_PRESET;
export const MUSIC = e.VITE_MUSIC_URL;
