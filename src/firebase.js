// src/firebase.js

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp,
  orderBy,
  query,
  where,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBg-kW04PQNYFcnRWoBhYco2IyLe9fKoJ0",
  authDomain: "beautyfull-salon-barbershop.firebaseapp.com",
  projectId: "beautyfull-salon-barbershop",
  storageBucket: "beautyfull-salon-barbershop.appspot.com",
  messagingSenderId: "938922747064",
  appId: "1:938922747064:web:7538f5326c91d954f3404d",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const reservationsCol = collection(db, "reservations");

// Enregistre un rendez-vous dans Firestore
export async function saveReservationToCloud(reservation) {
  const docRef = await addDoc(reservationsCol, {
    ...reservation,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

// Récupère tous les rendez-vous depuis Firestore (les plus récents en premier)
export async function getReservationsFromCloud() {
  const q = query(reservationsCol, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Vérifie si un créneau (date + heure) est déjà pris dans Firestore
export async function isSlotTaken(date, heure) {
  const q = query(
    reservationsCol,
    where("date", "==", date),
    where("heure", "==", heure)
  );
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

// Supprime un rendez-vous dans Firestore
export async function deleteReservationFromCloud(id) {
  await deleteDoc(doc(db, "reservations", id));
}
