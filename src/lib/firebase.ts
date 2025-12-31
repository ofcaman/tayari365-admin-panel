import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "your key",
  authDomain: "your key",
  databaseURL: "your key",
  projectId: "your key",
  storageBucket: "your key",
  messagingSenderId: "your key",
  appId: "your key",
  measurementId: "your key"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
