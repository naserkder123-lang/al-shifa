import { db, auth } from "./firebase-config.js";
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 1. تسجيل الأحداث (Audit Logs)
export async function logAuditEvent(action, details = {}) {
  if (!auth.currentUser) return;
  await addDoc(collection(db, "auditLogs"), {
    userId: auth.currentUser.uid,
    action: action,
    details: details,
    timestamp: new Date().toISOString()
  });
}

// 2. إنشاء موعد جديد
export async function createAppointment(doctorId, date, time, notes) {
  if (!auth.currentUser) throw new Error("يجب تسجيل الدخول");
  
  const docRef = await addDoc(collection(db, "appointments"), {
    patientId: auth.currentUser.uid,
    doctorId: doctorId,
    date: date,
    time: time,
    notes: notes,
    status: "pending",
    createdAt: new Date().toISOString()
  });

  await logAuditEvent("CREATE_APPOINTMENT", { appointmentId: docRef.id, doctorId });
  return docRef.id;
}

// 3. جلب المواعيد حسب الدور
export async function fetchAppointments(role) {
  if (!auth.currentUser) return [];

  let q;
  if (role === 'patient') {
    q = query(collection(db, "appointments"), where("patientId", "==", auth.currentUser.uid));
  } else if (role === 'doctor') {
    q = query(collection(db, "appointments"), where("doctorId", "==", auth.currentUser.uid));
  } else if (role === 'admin') {
    q = query(collection(db, "appointments"));
  } else {
    return [];
  }

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
