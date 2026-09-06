// src/firebase.js

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  doc,
  serverTimestamp,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import {
  getAuth,
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

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
const auth = getAuth(app);

const prestationsCol = collection(db, "prestations");
const clientsCol = collection(db, "clients");
const commandesCol = collection(db, "commandes");
const messagesCol = collection(db, "messages");

/* =========================================================
   AUTHENTIFICATION
   ========================================================= */

// Connexion admin (email/mot de passe), utilisée par le panneau admin.
export async function loginAdmin(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function logoutAdmin() {
  await signOut(auth);
}

// Prévient le panneau admin quand l'état de connexion change.
export function onAdminAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

// Authentifie le visiteur anonymement avant l'envoi du formulaire de contact
// public (nécessaire pour satisfaire les Security Rules côté serveur).
export async function signInAsVisitor() {
  if (auth.currentUser) return auth.currentUser;
  const credential = await signInAnonymously(auth);
  return credential.user;
}

/* =========================================================
   PRESTATIONS
   ========================================================= */

export async function getPrestations() {
  const snapshot = await getDocs(prestationsCol);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addPrestation(prestation) {
  const docRef = await addDoc(prestationsCol, prestation);
  return docRef.id;
}

export async function updatePrestation(id, data) {
  await updateDoc(doc(db, "prestations", id), data);
}

/* =========================================================
   CLIENTS
   ========================================================= */

export async function getClients() {
  const snapshot = await getDocs(clientsCol);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getClient(id) {
  const snapshot = await getDoc(doc(db, "clients", id));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

export async function addClient(client) {
  const docRef = await addDoc(clientsCol, client);
  return docRef.id;
}

export async function updateClient(id, data) {
  await updateDoc(doc(db, "clients", id), data);
}

/* =========================================================
   COMMANDES
   ========================================================= */

export async function getCommandes() {
  const snapshot = await getDocs(
    query(commandesCol, orderBy("date_retrait_prevue", "asc"))
  );
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getCommandesByClient(clientId) {
  const snapshot = await getDocs(
    query(commandesCol, where("client_id", "==", clientId))
  );
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addCommande(commande) {
  const docRef = await addDoc(commandesCol, {
    ...commande,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateCommande(id, data) {
  await updateDoc(doc(db, "commandes", id), data);
}

/* =========================================================
   MESSAGES
   ========================================================= */

export async function getMessagesByClient(clientId) {
  const snapshot = await getDocs(
    query(
      messagesCol,
      where("client_id", "==", clientId),
      orderBy("date", "asc")
    )
  );
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addMessage(message) {
  const docRef = await addDoc(messagesCol, {
    ...message,
    date: serverTimestamp(),
  });
  return docRef.id;
}

export async function markMessageRead(id) {
  await updateDoc(doc(db, "messages", id), { lu: true });
}
