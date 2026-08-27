// 2. تسجيل الدخول - النسخة المعدلة والمصححة
export async function loginUser(email, password) {
  const cleanEmail = cleanText(email).toLowerCase();
  const cleanPassword = typeof password === "string" ? password : String(password || "");

  if (!cleanEmail) {
    throw new Error("البريد الإلكتروني مطلوب");
  }

  if (!cleanPassword) {
    throw new Error("كلمة المرور مطلوبة");
  }

  try {
    // 1. تسجيل الدخول عبر Firebase Auth
    const userCredential = await signInWithEmailAndPassword(
      auth,
      cleanEmail,
      cleanPassword
    );

    const user = userCredential.user;

    // 2. جلب ملف المستخدم من Firestore
    const userDocRef = doc(db, "users", user.uid);
    let userDoc = await getDoc(userDocRef);

    let profileData = {};

    // إذا لم يكن المستند موجوداً في مجموعة users، نقوم بإنشائه تلقائياً لمنع تعطل الدخول
    if (!userDoc.exists()) {
      profileData = {
        uid: user.uid,
        email: user.email || cleanEmail,
        fullName: user.displayName || "مستخدم",
        createdAt: serverTimestamp()
      };
      await setDoc(userDocRef, profileData);
    } else {
      profileData = userDoc.data();
    }

    return {
      user,
      profile: profileData,
    };

  } catch (error) {
    console.error("loginUser:", error);
    throw new Error(getFirebaseError(error));
  }
}
