import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDTeZg1VMGWJ4yM2BDcvjhEGb4ZS5AdccU",
  authDomain: "earnity-92a88.firebaseapp.com",
  databaseURL: "https://earnity-92a88-default-rtdb.firebaseio.com",
  projectId: "earnity-92a88",
  storageBucket: "earnity-92a88.appspot.com",
  messagingSenderId: "388474556644",
  appId: "1:388474556644:web:0a824f8da6d7d334d19cf1",
  measurementId: "G-T0Y9XCJVD7"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
