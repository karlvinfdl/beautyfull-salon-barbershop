/* =========================================================
   ATELIER COUTURE & RETOUCHE – SCRIPT GLOBAL
   ========================================================= */

import {
  getPrestations,
  addPrestation,
  updatePrestation,
  getClients,
  addClient,
  getCommandes,
  getCommandesByClient,
  addCommande,
  updateCommande,
  getMessagesByClient,
  addMessage,
  markMessageRead,
  loginAdmin,
  logoutAdmin,
  onAdminAuthChange,
  signInAsVisitor,
} from "./firebase.js";

/* =========================================================
   1) PRESTATIONS (fallback si Firestore est vide)
   ========================================================= */

const FALLBACK_PRESTATIONS = [
  { nom: "Ourlet pantalon", description: "Sans doublure, toutes matières.", prix: 12 },
  { nom: "Ourlet robe / jupe", description: "Ajustement de longueur.", prix: 15 },
  { nom: "Reprise de taille", description: "Pantalon ou jupe, avant/arrière.", prix: 18 },
  { nom: "Changement fermeture éclair", description: "Pantalon ou jupe.", prix: 15 },
  { nom: "Changement fermeture éclair", description: "Blouson ou manteau.", prix: 25 },
  { nom: "Retouche de manches", description: "Veste ou chemise.", prix: 20 },
  { nom: "Reprise d'épaules", description: "Veste ou manteau.", prix: 22 },
  { nom: "Réparation de doublure", description: "Toutes pièces.", prix: 15 },
];


/* =========================================================
   2) AVIS CLIENTS
   ========================================================= */

const reviewsData = [
  { name: "Karim", text: "Ourlet parfait, fait en 2 jours seulement !", stars: 5 },
  { name: "Mariam", text: "Retouche impeccable sur ma robe de mariage.", stars: 5 },
  { name: "Yanis", text: "Service rapide et couturier très à l'écoute.", stars: 5 },
];


/* =========================================================
   3) ANNÉE FOOTER
   ========================================================= */

const yearElement = document.getElementById("year");
if (yearElement) yearElement.textContent = new Date().getFullYear();


/* =========================================================
   4) PRESTATIONS PUBLIQUES (index.html)
   ========================================================= */

const servicesContainer = document.getElementById("services-container");

function renderPrestations(prestations) {
  servicesContainer.innerHTML = "";
  prestations.forEach((p) => {
    const card = document.createElement("article");
    card.classList.add("service-card");
    card.innerHTML = `
      <div class="service-card-header">
        <span class="service-title">${p.nom}</span>
        <span class="service-price">${p.prix} €</span>
      </div>
      <p class="service-desc">${p.description || ""}</p>
    `;
    servicesContainer.appendChild(card);
  });
}

if (servicesContainer) {
  getPrestations()
    .then((prestations) => {
      renderPrestations(prestations.length ? prestations : FALLBACK_PRESTATIONS);
    })
    .catch((error) => {
      console.error("Erreur chargement des prestations :", error);
      renderPrestations(FALLBACK_PRESTATIONS);
    });
}


/* =========================================================
   5) AVIS DYNAMIQUES
   ========================================================= */

const reviewsContainer = document.getElementById("reviews-container");
if (reviewsContainer) {
  reviewsData.forEach((r) => {
    const card = document.createElement("article");
    card.classList.add("review-card");
    card.innerHTML = `
      <div class="review-stars">${"★".repeat(r.stars)}</div>
      <p class="review-text">${r.text}</p>
      <p class="review-author">${r.name}</p>
    `;
    reviewsContainer.appendChild(card);
  });
}


/* =========================================================
   6) MENU MOBILE
   ========================================================= */

const menuToggle = document.getElementById("menu-toggle");
const navMenu = document.getElementById("nav-menu");

if (menuToggle && navMenu) {
  menuToggle.addEventListener("click", () => navMenu.classList.toggle("open"));
}


/* =========================================================
   7) FORMULAIRE DE CONTACT (pages/contact.html)
   ========================================================= */

const contactForm = document.getElementById("contactForm");

if (contactForm) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nom = document.getElementById("nom").value.trim();
    const tel = document.getElementById("tel").value.trim();
    const email = document.getElementById("email").value.trim();
    const message = document.getElementById("message").value.trim();

    try {
      await signInAsVisitor();
      const clientId = await addClient({ nom, telephone: tel, email });
      await addMessage({
        client_id: clientId,
        contenu: message,
        sens: "client_vers_couturier",
        lu: false,
      });

      window.open(
        "https://wa.me/3361453210?text=" +
          encodeURIComponent(`Bonjour, je vous contacte via le site :\nNom: ${nom}\nMessage: ${message}`),
        "_blank"
      );

      alert("Votre message a été envoyé !");
      contactForm.reset();
    } catch (error) {
      console.error("Erreur lors de l'envoi du message :", error);
      alert("Une erreur est survenue, merci de réessayer.");
    }
  });
}


/* =========================================================
   8) ADMIN — AUTHENTIFICATION
   ========================================================= */

const adminPanel = document.getElementById("admin-panel");
const authBox = document.getElementById("auth-container");
const authError = document.getElementById("authError");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    const email = document.getElementById("adminEmail").value.trim();
    const password = document.getElementById("adminPassword").value;
    authError.style.display = "none";

    try {
      await loginAdmin(email, password);
    } catch (error) {
      console.error("Erreur de connexion admin :", error);
      authError.textContent = "Email ou mot de passe incorrect.";
      authError.style.display = "block";
    }
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => logoutAdmin());
}

if (adminPanel && authBox) {
  onAdminAuthChange((user) => {
    if (user && !user.isAnonymous) {
      authBox.style.display = "none";
      adminPanel.style.display = "block";
      initAdminData();
    } else {
      authBox.style.display = "block";
      adminPanel.style.display = "none";
    }
  });
}


/* =========================================================
   9) ADMIN — ONGLETS
   ========================================================= */

const tabButtonsAdmin = document.querySelectorAll("#admin-panel .tab-button");
const adminTabs = document.querySelectorAll(".admin-tab");

tabButtonsAdmin.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabButtonsAdmin.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    adminTabs.forEach((tab) => (tab.style.display = "none"));
    document.getElementById(`tab-${btn.dataset.tab}`).style.display = "block";
  });
});


/* =========================================================
   10) ADMIN — DONNÉES (clients / commandes / prestations)
   ========================================================= */

let clientsCache = [];
let commandesCache = [];
let prestationsCache = [];

function clientNom(clientId) {
  const client = clientsCache.find((c) => c.id === clientId);
  return client ? client.nom : "Client supprimé";
}

function statutLabel(statut) {
  return { en_cours: "En cours", prete: "Prête", recuperee: "Récupérée" }[statut] || statut;
}

async function initAdminData() {
  await Promise.all([loadClients(), loadPrestations()]);
  await loadCommandes();
}

/* ---------- Clients ---------- */

const commandeClientSelect = document.getElementById("commandeClientSelect");
const clientsTableBody = document.getElementById("clientsTableBody");

async function loadClients() {
  clientsCache = await getClients();

  commandeClientSelect.innerHTML = '<option value="">— Nouveau client —</option>';
  clientsCache.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = c.nom;
    commandeClientSelect.appendChild(opt);
  });

  clientsTableBody.innerHTML = clientsCache.length
    ? clientsCache
        .map(
          (c) => `
        <tr>
          <td>${c.nom}</td>
          <td>${c.telephone}</td>
          <td>${c.email || "—"}</td>
          <td><button class="btn-link" data-client-id="${c.id}">Voir la fiche</button></td>
        </tr>`
        )
        .join("")
    : `<tr><td colspan="4" style="text-align:center;">Aucun client</td></tr>`;

  clientsTableBody.querySelectorAll("button[data-client-id]").forEach((btn) => {
    btn.addEventListener("click", () => openClientDetail(btn.dataset.clientId));
  });
}

/* ---------- Fiche client + messagerie ---------- */

const clientDetail = document.getElementById("clientDetail");
const clientDetailName = document.getElementById("clientDetailName");
const clientDetailInfo = document.getElementById("clientDetailInfo");
const clientCommandesBody = document.getElementById("clientCommandesBody");
const messagesThread = document.getElementById("messagesThread");
const replyForm = document.getElementById("replyForm");
const closeClientDetailBtn = document.getElementById("closeClientDetail");

let currentClientId = null;

async function openClientDetail(clientId) {
  currentClientId = clientId;
  const client = clientsCache.find((c) => c.id === clientId);
  if (!client) return;

  clientDetail.style.display = "block";
  clientDetailName.textContent = client.nom;
  clientDetailInfo.textContent = `${client.telephone}${client.email ? " — " + client.email : ""}`;

  const commandes = await getCommandesByClient(clientId);
  clientCommandesBody.innerHTML = commandes.length
    ? commandes
        .map(
          (c) => `
        <tr>
          <td>${c.description}</td>
          <td>${c.prix} €</td>
          <td>${c.date_retrait_prevue}</td>
          <td><span class="status-badge status-${c.statut}">${statutLabel(c.statut)}</span></td>
        </tr>`
        )
        .join("")
    : `<tr><td colspan="4" style="text-align:center;">Aucune commande</td></tr>`;

  const messages = await getMessagesByClient(clientId);
  messagesThread.innerHTML = messages
    .map((m) => {
      const isClient = m.sens === "client_vers_couturier";
      const date = m.date && m.date.toDate ? m.date.toDate().toLocaleString("fr-FR") : "";
      return `
        <div class="msg-bubble ${isClient ? "from-client" : "from-couturier"}">
          ${m.contenu}
          <time>${date}</time>
        </div>`;
    })
    .join("") || `<p class="rdv-note">Aucun message.</p>`;

  await Promise.all(
    messages.filter((m) => m.sens === "client_vers_couturier" && !m.lu).map((m) => markMessageRead(m.id))
  );
}

if (replyForm) {
  replyForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentClientId) return;

    const contenu = document.getElementById("replyContenu").value.trim();
    if (!contenu) return;

    await addMessage({
      client_id: currentClientId,
      contenu,
      sens: "couturier_vers_client",
      lu: true,
    });

    document.getElementById("replyContenu").value = "";
    openClientDetail(currentClientId);
  });
}

if (closeClientDetailBtn) {
  closeClientDetailBtn.addEventListener("click", () => {
    clientDetail.style.display = "none";
    currentClientId = null;
  });
}

/* ---------- Commandes ---------- */

const commandesTableBody = document.getElementById("commandesTableBody");
const filterStatut = document.getElementById("filterStatut");
const newCommandeBtn = document.getElementById("newCommandeBtn");
const commandeForm = document.getElementById("commandeForm");
const cancelCommandeBtn = document.getElementById("cancelCommandeBtn");
const newClientFields = document.getElementById("newClientFields");

async function loadCommandes() {
  commandesCache = await getCommandes();
  renderCommandes();
}

function renderCommandes() {
  const statut = filterStatut.value;
  const rows = statut ? commandesCache.filter((c) => c.statut === statut) : commandesCache;

  commandesTableBody.innerHTML = rows.length
    ? rows
        .map(
          (c) => `
        <tr>
          <td>${clientNom(c.client_id)}</td>
          <td>${c.description}</td>
          <td>${c.prix} €</td>
          <td>${c.date_depot}</td>
          <td>${c.date_retrait_prevue}</td>
          <td><span class="status-badge status-${c.statut}">${statutLabel(c.statut)}</span></td>
          <td><button class="btn-link" data-edit-id="${c.id}">Modifier</button></td>
        </tr>`
        )
        .join("")
    : `<tr><td colspan="7" style="text-align:center;">Aucune commande</td></tr>`;

  commandesTableBody.querySelectorAll("button[data-edit-id]").forEach((btn) => {
    btn.addEventListener("click", () => editCommande(btn.dataset.editId));
  });
}

if (filterStatut) filterStatut.addEventListener("change", renderCommandes);

function resetCommandeForm() {
  commandeForm.reset();
  document.getElementById("commandeId").value = "";
  document.getElementById("commandeDateDepot").value = new Date().toISOString().split("T")[0];
  newClientFields.style.display = "block";
}

if (newCommandeBtn) {
  newCommandeBtn.addEventListener("click", () => {
    resetCommandeForm();
    commandeForm.style.display = "block";
  });
}

if (cancelCommandeBtn) {
  cancelCommandeBtn.addEventListener("click", () => {
    commandeForm.style.display = "none";
  });
}

if (commandeClientSelect) {
  commandeClientSelect.addEventListener("change", () => {
    newClientFields.style.display = commandeClientSelect.value ? "none" : "block";
  });
}

function editCommande(id) {
  const commande = commandesCache.find((c) => c.id === id);
  if (!commande) return;

  document.getElementById("commandeId").value = commande.id;
  commandeClientSelect.value = commande.client_id;
  newClientFields.style.display = "none";
  document.getElementById("commandeDescription").value = commande.description;
  document.getElementById("commandePrix").value = commande.prix;
  document.getElementById("commandeDateDepot").value = commande.date_depot;
  document.getElementById("commandeDateRetrait").value = commande.date_retrait_prevue;
  document.getElementById("commandeStatut").value = commande.statut;

  commandeForm.style.display = "block";
  commandeForm.scrollIntoView({ behavior: "smooth" });
}

if (commandeForm) {
  commandeForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    let clientId = commandeClientSelect.value;

    if (!clientId) {
      const nom = document.getElementById("commandeClientNom").value.trim();
      const telephone = document.getElementById("commandeClientTel").value.trim();
      const email = document.getElementById("commandeClientEmail").value.trim();

      if (!nom || !telephone) {
        alert("Merci de renseigner le nom et le téléphone du nouveau client.");
        return;
      }

      clientId = await addClient({ nom, telephone, email });
    }

    const data = {
      client_id: clientId,
      description: document.getElementById("commandeDescription").value.trim(),
      prix: Number(document.getElementById("commandePrix").value),
      date_depot: document.getElementById("commandeDateDepot").value,
      date_retrait_prevue: document.getElementById("commandeDateRetrait").value,
      statut: document.getElementById("commandeStatut").value,
    };

    const commandeId = document.getElementById("commandeId").value;
    if (commandeId) {
      await updateCommande(commandeId, data);
    } else {
      await addCommande(data);
    }

    commandeForm.style.display = "none";
    await Promise.all([loadClients(), loadCommandes()]);
  });
}

/* ---------- Prestations ---------- */

const prestationsTableBody = document.getElementById("prestationsTableBody");
const prestationForm = document.getElementById("prestationForm");

async function loadPrestations() {
  prestationsCache = await getPrestations();

  prestationsTableBody.innerHTML = prestationsCache.length
    ? prestationsCache
        .map(
          (p) => `
        <tr>
          <td>${p.nom}</td>
          <td>${p.description || "—"}</td>
          <td>${p.prix} €</td>
          <td><button class="btn-link" data-prestation-id="${p.id}">Modifier</button></td>
        </tr>`
        )
        .join("")
    : `<tr><td colspan="4" style="text-align:center;">Aucune prestation, la liste par défaut est affichée sur le site.</td></tr>`;

  prestationsTableBody.querySelectorAll("button[data-prestation-id]").forEach((btn) => {
    btn.addEventListener("click", () => editPrestation(btn.dataset.prestationId));
  });
}

function editPrestation(id) {
  const prestation = prestationsCache.find((p) => p.id === id);
  if (!prestation) return;

  document.getElementById("prestationId").value = prestation.id;
  document.getElementById("prestationNom").value = prestation.nom;
  document.getElementById("prestationDescription").value = prestation.description || "";
  document.getElementById("prestationPrix").value = prestation.prix;
  prestationForm.scrollIntoView({ behavior: "smooth" });
}

if (prestationForm) {
  prestationForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
      nom: document.getElementById("prestationNom").value.trim(),
      description: document.getElementById("prestationDescription").value.trim(),
      prix: Number(document.getElementById("prestationPrix").value),
    };

    const prestationId = document.getElementById("prestationId").value;
    if (prestationId) {
      await updatePrestation(prestationId, data);
    } else {
      await addPrestation(data);
    }

    prestationForm.reset();
    document.getElementById("prestationId").value = "";
    await loadPrestations();
  });
}

console.log("🚀 Atelier Couture & Retouche — Script chargé et opérationnel !");
