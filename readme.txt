# ✂️ Atelier Couture & Retouche

Site vitrine + suivi de commandes de retouche pour l'**Atelier Couture & Retouche** basé à **Évry-Courcouronnes (91000)**.

Développé en **HTML / CSS / JavaScript natif** avec **Vite**, et hébergé sur **GitHub Pages**, ce projet permet aux clients de contacter l'atelier, et au couturier de suivre ses commandes (dépôt, statut, date de retrait) via un panneau d'administration dédié.

---

## 🚀 Fonctionnalités

### 🖥️ Côté client
- ✔️ Page d'accueil premium (thème **noir / rouge / or**)
- ✔️ Menu responsive fullscreen
- ✔️ Présentation des prestations (chargées depuis Firestore, avec liste de secours si vide)
- ✔️ Avis clients dynamiques
- ✔️ Formulaire de **contact** (pas de créneau à réserver — le client passe à l'atelier pour un essayage)
  - Enregistrement du message dans Firestore
  - Envoi automatique d'un message WhatsApp à l'atelier

---

### 🔐 Côté administrateur
- ✔️ Accès sécurisé par **Firebase Authentication** (email / mot de passe) — aucun code en dur côté client
- ✔️ Gestion des **commandes de retouche** : description, prix, date de dépôt, date de retrait prévue, statut (en cours / prête / récupérée)
- ✔️ Fiche client avec historique des commandes et messagerie
- ✔️ Gestion des prestations affichées sur le site public
- ✔️ Toutes les collections Firestore (`clients`, `commandes`, `messages`) protégées par des **Security Rules** réservant la lecture/écriture à l'admin authentifié

---

## 🛠️ Stack technique

| Technologie | Usage |
|------------|-------|
| **HTML5** | Structure des pages |
| **CSS3** | Design premium responsive |
| **JavaScript (ES Modules)** | Logique client |
| **Vite** | Bundler + optimisation |
| **Firebase Authentication** | Connexion admin sécurisée |
| **Firebase Firestore** | Stockage des clients, commandes, messages, prestations |
| **Firestore Security Rules** | Contrôle d'accès côté serveur |
| **WhatsApp API** | Confirmation instantanée |
| **GitHub Pages** | Hébergement |
