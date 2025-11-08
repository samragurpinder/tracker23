

// Fix: The module resolution was failing. Assuming this is because the firebase module had compilation errors.
import { auth, db } from "./firebase";
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { User } from '../types';
import { initialTopics, staticQuotes } from '../constants';


const LOCAL_KEY = "prep-tracker-data";

export const saveUserData = async (data: any) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  const ref = doc(db, "users", user.uid);
  // Firestore does not support `undefined`. We clean the object before saving.
  // JSON.stringify removes keys with `undefined` values.
  const cleanedData = JSON.parse(JSON.stringify(data));
  await setDoc(ref, { ...cleanedData, updatedAt: serverTimestamp() }, { merge: true });
};

export const getUserData = async (): Promise<any | null> => {
  const user = auth.currentUser;
  if (!user) return null;
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
};

export const createNewUserDocument = async (userAuth: { uid: string; email?: string | null; displayName?: string | null }): Promise<User> => {
    const email = userAuth.email || 'no-email-provided';
    const newUser: User = {
        uid: userAuth.uid,
        email: email,
        displayName: userAuth.displayName || email.split('@')[0],
        studyStreak: 1,
        lastLogin: new Date().toISOString(),
        topics: initialTopics,
        tests: [],
        notes: "My JEE Journey begins today!",
        dailyPlans: [],
        lectures: [],
        events: [],
        upcomingTests: [],
        wellnessLogs: [],
        doubts: [],
        teachers: [],
        coachingLogs: [],
        documents: [],
        driveFolderId: '',
        driveServiceAccountCreds: null,
        prepStartDate: new Date('2025-04-01T00:00:00Z').toISOString(),
        examDate: new Date('2027-01-03T00:00:00Z').toISOString(),
        dailyQuote: {
            quote: staticQuotes[0],
            date: new Date().toDateString(),
        },
        achievements: [],
        challenges: [],
        rank: { name: 'Explorer I', tier: 'Bronze', score: 0, level: 1 },
        lastRankUpdate: new Date().toISOString(),
        personalBestStudyHours: 0,
    };
    await saveUserData(newUser);
    return newUser;
};


const migrateLocalToFirestoreIfNeeded = async () => {
  const user = auth.currentUser;
  if (!user) return;
  const localData = localStorage.getItem(LOCAL_KEY);
  if (!localData) return;
  
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  
  try {
    const data = JSON.parse(localData);
    // Ensure we don't overwrite newer Firestore data with old local data
    if (!snap.exists()) {
        await setDoc(ref, { ...data, migratedAt: serverTimestamp() });
    }
    // We intentionally don't merge/update if a Firestore doc already exists,
    // as it's assumed to be the source of truth. The migration is a one-time import.
    
    console.log("Local data migrated to Firestore.");
    localStorage.removeItem(LOCAL_KEY); // Clear local data after successful migration.
  } catch(e) {
    console.error("Error migrating local data:", e);
    // Don't remove local key if migration fails, so it can be retried.
  }
};

onAuthStateChanged(auth, (user) => {
  if (user) {
    // Run migration check shortly after auth state is confirmed
    setTimeout(() => migrateLocalToFirestoreIfNeeded(), 1000);
  }
});
