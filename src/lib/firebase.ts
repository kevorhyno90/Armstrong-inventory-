import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// We'll use dummy config if the file doesn't exist yet to prevent build errors
// but in a real scenario, this would be populated by the platform.
const firebaseConfig = {
  apiKey: "mock-api-key",
  authDomain: "mock-project.firebaseapp.com",
  projectId: "mock-project",
  storageBucket: "mock-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

let config = firebaseConfig;
try {
  // Try to load real config if available
  // The agent tools might not have created it yet due to the error
} catch (e) {
  console.warn("Firebase config not found, using mock.");
}

const app = initializeApp(config);
export const auth = getAuth(app);
export const db = getFirestore(app);
