import { auth, db } from "./firebase-config.js";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 1. تسجيل مستخدم جديد
export async function registerUser(email, password, userData) {
  const { role, fullName, phone } = userData;
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    email: email,
    role: role,
    fullName: fullName,
    phone: phone,
    createdAt: serverTimestamp()
  });

  const roleCollections = {
    patient: "patients",
    doctor: "doctors",
    pharmacy: "pharmacies",
    laboratory: "laboratories"
  };

  if (roleCollections[role]) {
    await setDoc(doc(db, roleCollections[role], user.uid), {
      uid: user.uid,
      fullName: fullName,
      phone: phone,
      createdAt: serverTimestamp()
    });
  }

  return user;
}

// 2. تسجيل الدخول
export async function loginUser(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  const userDoc = await getDoc(doc(db, "users", user.uid));
  
  if (!userDoc.exists()) throw new Error("بيانات المستخدم غير موجودة");
  return { user, profile: userDoc.data() };
}

// 3. تسجيل الخروج
export async function logoutUser() {
  await signOut(auth);
}

// 4. مراقبة حالة تسجيل الدخول
export function watchAuthState(callback) {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      callback(user, userDoc.exists() ? userDoc.data() : null);
    } else {
      callback(null, null);
    }
  });
}
