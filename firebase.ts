import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBUdYNs4ydGdU9qTgzgkZRcXFTc_fhHLd0",
  authDomain: "jeeprep-ba36e.firebaseapp.com",
  projectId: "jeeprep-ba36e",
  storageBucket: "jeeprep-ba36e.appspot.com",
  messagingSenderId: "286552771397",
  appId: "1:286552771397:web:3769f5042ff09844b14c2c",
  measurementId: "G-25T1YT2625"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);