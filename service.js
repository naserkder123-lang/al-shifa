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

const ROLE_COLLECTIONS = {
  patient: "patients",
  doctor: "doctors",
  pharmacy: "pharmacies",
  laboratory: "laboratories"
};

// تنظيف النصوص
function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

// تحويل أخطاء Firebase إلى رسائل مفهومة
function getFirebaseError(error) {
  const code = error?.code || "";

  const messages = {
    "auth/email-already-in-use": "البريد الإلكتروني مستخدم بالفعل",
    "auth/invalid-email": "البريد الإلكتروني غير صحيح",
    "auth/weak-password": "كلمة المرور ضعيفة",
    "auth/user-not-found": "بيانات الدخول غير صحيحة",
    "auth/wrong-password": "بيانات الدخول غير صحيحة",
    "auth/invalid-credential": "بيانات الدخول غير صحيحة",
    "auth/too-many-requests": "تمت محاولات كثيرة، حاول لاحقًا",
    "auth/network-request-failed": "تعذر الاتصال بالإنترنت",
    "permission-denied": "ليس لديك صلاحية لتنفيذ هذه العملية"
  };

  return messages[code] || error?.message || "حدث خطأ غير متوقع";
}

// 1. تسجيل مستخدم جديد
export async function registerUser(email, password, userData = {}) {
  const cleanEmail = cleanText(email).toLowerCase();
  const cleanPassword = typeof password === "string" ? password : "";

  const role = cleanText(userData.role);
  const fullName = cleanText(userData.fullName);
  const phone = cleanText(userData.phone);

  if (!cleanEmail) {
    throw new Error("البريد الإلكتروني مطلوب");
  }

  if (!cleanPassword) {
    throw new Error("كلمة المرور مطلوبة");
  }

  if (!role) {
    throw new Error("نوع المستخدم مطلوب");
  }

  if (!fullName) {
    throw new Error("الاسم الكامل مطلوب");
  }

  if (!phone) {
    throw new Error("رقم الهاتف مطلوب");
  }

  try {
    // إنشاء حساب Firebase Authentication
    const userCredential =
      await createUserWithEmailAndPassword(
        auth,
        cleanEmail,
        cleanPassword
      );

    const user = userCredential.user;

    const profile = {
      uid: user.uid,
      email: user.email || cleanEmail,
      role,
      fullName,
      phone,
      createdAt: serverTimestamp()
    };

    // إنشاء ملف المستخدم الأساسي
    await setDoc(
      doc(db, "users", user.uid),
      profile
    );

    // إنشاء ملف الدور إذا كان الدور معروفًا
    const roleCollection = ROLE_COLLECTIONS[role];

    if (roleCollection) {
      await setDoc(
        doc(db, roleCollection, user.uid),
        {
          uid: user.uid,
          fullName,
          phone,
          email: user.email || cleanEmail,
          role,
          createdAt: serverTimestamp()
        }
      );
    }

    return user;

  } catch (error) {
    console.error("registerUser:", error);
    throw new Error(getFirebaseError(error));
  }
}

// 2. تسجيل الدخول
export async function loginUser(email, password) {
  const cleanEmail = cleanText(email).toLowerCase();
  const cleanPassword = typeof password === "string" ? password : "";

  if (!cleanEmail) {
    throw new Error("البريد الإلكتروني مطلوب");
  }

  if (!cleanPassword) {
    throw new Error("كلمة المرور مطلوبة");
  }

  try {
    const userCredential =
      await signInWithEmailAndPassword(
        auth,
        cleanEmail,
        cleanPassword
      );

    const user = userCredential.user;

    const userDoc = await getDoc(
      doc(db, "users", user.uid)
    );

    if (!userDoc.exists()) {
      // تسجيل الخروج إذا كان حساب Authentication موجودًا
      // ولكن ملف Firestore غير موجود.
      await signOut(auth);

      throw new Error("بيانات المستخدم غير موجودة");
    }

    return {
      user,
      profile: userDoc.data()
    };

  } catch (error) {
    console.error("loginUser:", error);
    throw new Error(getFirebaseError(error));
  }
}

// 3. تسجيل الخروج
export async function logoutUser() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("logoutUser:", error);
    throw new Error(getFirebaseError(error));
  }
}

// 4. مراقبة حالة تسجيل الدخول
export function watchAuthState(callback) {
  if (typeof callback !== "function") {
    throw new Error("يجب تمرير دالة callback صحيحة");
  }

  return onAuthStateChanged(
    auth,
    async (user) => {
      if (!user) {
        callback(null, null);
        return;
      }

      try {
        const userDoc = await getDoc(
          doc(db, "users", user.uid)
        );

        if (!userDoc.exists()) {
          callback(user, null);
          return;
        }

        callback(user, userDoc.data());

      } catch (error) {
        console.error("watchAuthState:", error);
        callback(user, null);
      }
    },
    (error) => {
      console.error("Auth state error:", error);
      callback(null, null);
    }
  );
}
