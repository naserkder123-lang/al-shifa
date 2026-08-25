import { auth, db } from "./firebase-config.js";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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
    createdAt: new Date().toISOString()
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
      createdAt: new Date().toISOString()
    });
  }

  return user;
}

export async function loginUser(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  const userDoc = await getDoc(doc(db, "users", user.uid));
  
  if (!userDoc.exists()) throw new Error("بيانات المستخدم غير موجودة");
  return { user, profile: userDoc.data() };
}

export async function logoutUser() {
  await signOut(auth);
}

export function watchAuthState(callback) {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      callback(user, userDoc.exists() ? userDoc.data() : null);
    } else {
      callback(null, null);
    }
  });
}
