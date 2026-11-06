import {initializeApp} from 'firebase/app'
import {getFirestore} from 'firebase/firestore'
import {getAuth,GoogleAuthProvider} from 'firebase/auth'
const e=import.meta.env
const app=initializeApp({apiKey:e.VITE_FB_KEY,authDomain:e.VITE_FB_DOMAIN,projectId:e.VITE_FB_PROJECT,appId:e.VITE_FB_APP})
export const db=getFirestore(app),auth=getAuth(app),provider=new GoogleAuthProvider()
export const ADMIN=e.VITE_ADMIN_EMAIL,SITE=e.VITE_SITE_NAME||'paradiso',CLOUD=e.VITE_CLOUD_NAME,PRESET=e.VITE_CLOUD_PRESET,MUSIC=e.VITE_MUSIC_URL
