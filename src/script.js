/* =========================================================
   GS RETOUCHERIE – SCRIPT GLOBAL
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
  { nom: "Ourlet / longueur", description: "Pantalons, robes, manteaux ajustés à la bonne taille.", prix: "dès 10 €" },
  { nom: "Cintrage / reprise", description: "Vestes, chemises, robes repris à votre silhouette.", prix: "dès 15 €" },
  { nom: "Fermetures éclair", description: "Blousons, jupes, sacs — remplacement toutes tailles.", prix: "dès 12 €" },
  { nom: "Cuir & maroquinerie", description: "Blousons, manteaux, accessoires en cuir.", prix: "sur devis" },
  { nom: "Pièces de cérémonie", description: "Robes de mariée, costumes, avec essayage dédié.", prix: "sur devis" },
  { nom: "Retouche express", description: "Petites réparations réalisées pendant votre attente.", prix: "dès 8 €" },
];

const SWATCH_ICON = `<svg viewBox="0 0 34 34" fill="none"><circle cx="17" cy="17" r="12" stroke="#B4502E" stroke-width="1.6"/><path d="M17 9v8l6 4" stroke="#B4502E" stroke-width="1.6"/></svg>`;


/* =========================================================
   2) AVIS CLIENTS
   ========================================================= */

const reviewsData = [
  { text: "Un accueil patient, qui prend le temps d'expliquer chaque retouche.", author: "Client de l'atelier" },
  { text: "On y va pour un ourlet, on repart avec un vêtement qui a une seconde vie.", author: "Cliente du quartier" },
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
    const card = document.createElement("div");
    card.classList.add("swatch");
    card.innerHTML = `
      ${SWATCH_ICON}
      <div>
        <h3>${p.nom}</h3>
        <p>${p.description || ""}</p>
        <div class="price">${p.prix}</div>
      </div>
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
   5) AVIS
   ========================================================= */

const reviewsContainer = document.getElementById("reviews-container");
if (reviewsContainer) {
  reviewsContainer.innerHTML = reviewsData
    .map(
      (r) => `
      <div class="quote">
        <svg class="chalk-line" viewBox="0 0 70 8"><path d="M2 5c15-6 40 6 66-1" stroke="#B4502E" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>
        <p>« ${r.text} »</p>
        <div class="quote-attr">${r.author}</div>
      </div>`
    )
    .join("");
}


/* =========================================================
   6) MENU MOBILE (site public)
   ========================================================= */

const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

if (menuToggle && navLinks) {
  menuToggle.addEventListener("click", () => navLinks.classList.toggle("open"));
}


/* =========================================================
   7) FORMULAIRE DE CONTACT (index.html + pages/contact.html)
   ========================================================= */

const contactForm = document.getElementById("contactForm");

if (contactForm) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Ouvre l'onglet WhatsApp tout de suite (dans le geste utilisateur du clic),
    // sinon les navigateurs bloquent window.open() une fois les appels
    // Firestore (async) terminés, car ce n'est plus considéré comme une
    // action utilisateur directe.
    const waWindow = window.open("about:blank", "_blank");

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

      const waUrl =
        "https://wa.me/33696114806?text=" +
        encodeURIComponent(`Bonjour, je vous contacte via le site :\nNom: ${nom}\nMessage: ${message}`);

      if (waWindow) {
        waWindow.location.href = waUrl;
      } else {
        window.open(waUrl, "_blank");
      }

      alert("Votre message a été envoyé !");
      contactForm.reset();
    } catch (error) {
      console.error("Erreur lors de l'envoi du message :", error);
      if (waWindow) waWindow.close();
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
const adminUserLabel = document.getElementById("adminUserLabel");

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
      adminPanel.style.display = "flex";
      if (adminUserLabel) adminUserLabel.textContent = user.email || "Gérant";
      initAdminData();
    } else {
      authBox.style.display = "flex";
      adminPanel.style.display = "none";
    }
  });
}


/* =========================================================
   9) ADMIN — NAVIGATION (sidebar + mobile)
   ========================================================= */

const sideNavButtons = document.querySelectorAll(".side-nav button[data-view]");
const adminViews = document.querySelectorAll(".admin-view");
const topbarTitle = document.getElementById("topbarTitle");
const sidebar = document.getElementById("sidebar");
const scrim = document.getElementById("scrim");
const adminMenuToggle = document.getElementById("menuToggle");

const VIEW_TITLES = {
  dashboard: "Tableau de bord",
  commandes: "Commandes",
  prestations: "Prestations",
  clients: "Clients",
  messages: "Messages",
};

function closeSidebar() {
  if (sidebar) sidebar.classList.remove("open");
  if (scrim) scrim.classList.remove("open");
}

function activateView(view) {
  sideNavButtons.forEach((b) => b.classList.toggle("active", b.dataset.view === view));
  adminViews.forEach((v) => v.classList.toggle("active", v.id === `view-${view}`));
  if (topbarTitle) topbarTitle.textContent = VIEW_TITLES[view] || view;
  closeSidebar();
}

sideNavButtons.forEach((btn) => {
  btn.addEventListener("click", () => activateView(btn.dataset.view));
});

if (adminMenuToggle && sidebar && scrim) {
  adminMenuToggle.addEventListener("click", () => {
    sidebar.classList.add("open");
    scrim.classList.add("open");
  });
  scrim.addEventListener("click", closeSidebar);
}


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

function statutPill(statut) {
  return `<span class="status-pill ${statut}">${statutLabel(statut)}</span>`;
}

async function initAdminData() {
  await Promise.all([loadClients(), loadPrestations()]);
  await loadCommandes();
}

/* ---------- Clients ---------- */

const commandeClientSelect = document.getElementById("commandeClientSelect");
const clientsTableBody = document.getElementById("clientsTableBody");
const messagesClientList = document.getElementById("messagesClientList");

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
          <td class="row-actions"><button data-client-id="${c.id}">Voir</button></td>
        </tr>`
        )
        .join("")
    : `<tr><td colspan="4" style="text-align:center;">Aucun client</td></tr>`;

  clientsTableBody.querySelectorAll("button[data-client-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      activateView("messages");
      openClientThread(btn.dataset.clientId);
    });
  });

  messagesClientList.innerHTML = clientsCache.length
    ? clientsCache
        .map(
          (c) => `
        <button class="msg-item" data-client-id="${c.id}">
          <div class="name">${c.nom}</div>
          <div class="sub">${c.telephone}</div>
        </button>`
        )
        .join("")
    : `<div class="msg-detail-empty">Aucun client</div>`;

  messagesClientList.querySelectorAll("button[data-client-id]").forEach((btn) => {
    btn.addEventListener("click", () => openClientThread(btn.dataset.clientId));
  });
}

/* ---------- Messages (fiche client + fil de discussion) ---------- */

const messagesEmpty = document.getElementById("messagesEmpty");
const messagesDetail = document.getElementById("messagesDetail");
const messagesClientName = document.getElementById("messagesClientName");
const messagesClientInfo = document.getElementById("messagesClientInfo");
const messagesHistoryBody = document.getElementById("messagesHistoryBody");
const messagesThread = document.getElementById("messagesThread");
const replyForm = document.getElementById("replyForm");

let currentClientId = null;

async function openClientThread(clientId) {
  currentClientId = clientId;
  const client = clientsCache.find((c) => c.id === clientId);
  if (!client) return;

  messagesClientList.querySelectorAll(".msg-item").forEach((el) => {
    el.classList.toggle("active", el.dataset.clientId === clientId);
  });

  messagesEmpty.style.display = "none";
  messagesDetail.style.display = "flex";
  messagesClientName.textContent = client.nom;
  messagesClientInfo.textContent = `${client.telephone}${client.email ? " — " + client.email : ""}`;

  const commandes = await getCommandesByClient(clientId);
  messagesHistoryBody.innerHTML = commandes.length
    ? commandes
        .map(
          (c) => `
        <tr>
          <td>${c.description}</td>
          <td>${c.prix} €</td>
          <td>${c.date_retrait_prevue}</td>
          <td>${statutPill(c.statut)}</td>
        </tr>`
        )
        .join("")
    : `<tr><td colspan="4" style="text-align:center;">Aucune commande</td></tr>`;

  const messages = await getMessagesByClient(clientId);
  messagesThread.innerHTML = messages.length
    ? messages
        .map((m) => {
          const isClient = m.sens === "client_vers_couturier";
          const date = m.date && m.date.toDate ? m.date.toDate().toLocaleString("fr-FR") : "";
          return `
            <div class="bubble ${isClient ? "in" : "out"}">
              ${m.contenu}
              <time>${date}</time>
            </div>`;
        })
        .join("")
    : `<p style="color:var(--muted); font-size:0.85rem;">Aucun message.</p>`;

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
    openClientThread(currentClientId);
  });
}

/* ---------- Commandes ---------- */

const commandesTableBody = document.getElementById("commandesTableBody");
const filterStatut = document.getElementById("filterStatut");
const newCommandeBtn = document.getElementById("newCommandeBtn");
const commandeForm = document.getElementById("commandeForm");
const commandeFormWrap = document.getElementById("commandeFormWrap");
const cancelCommandeBtn = document.getElementById("cancelCommandeBtn");
const newClientFields = document.getElementById("newClientFields");
const dashboardTableBody = document.getElementById("dashboardTableBody");
const statEnCours = document.getElementById("statEnCours");
const statPretes = document.getElementById("statPretes");
const statRecupereesMois = document.getElementById("statRecupereesMois");
const statCaMois = document.getElementById("statCaMois");

async function loadCommandes() {
  commandesCache = await getCommandes();
  renderCommandes();
  renderDashboard();
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
          <td>${statutPill(c.statut)}</td>
          <td class="row-actions"><button data-edit-id="${c.id}">Modifier</button></td>
        </tr>`
        )
        .join("")
    : `<tr><td colspan="7" style="text-align:center;">Aucune commande</td></tr>`;

  commandesTableBody.querySelectorAll("button[data-edit-id]").forEach((btn) => {
    btn.addEventListener("click", () => editCommande(btn.dataset.editId));
  });
}

function renderDashboard() {
  if (!statEnCours) return;

  const now = new Date();
  const isCurrentMonth = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  };

  const enCours = commandesCache.filter((c) => c.statut === "en_cours");
  const pretes = commandesCache.filter((c) => c.statut === "prete");
  const recupereesMois = commandesCache.filter((c) => c.statut === "recuperee" && isCurrentMonth(c.date_retrait_prevue));
  const caMois = commandesCache
    .filter((c) => isCurrentMonth(c.date_depot))
    .reduce((sum, c) => sum + (Number(c.prix) || 0), 0);

  statEnCours.textContent = enCours.length;
  statPretes.textContent = pretes.length;
  statRecupereesMois.textContent = recupereesMois.length;
  statCaMois.textContent = `${caMois} €`;

  const upcoming = commandesCache.filter((c) => c.statut !== "recuperee").slice(0, 6);
  dashboardTableBody.innerHTML = upcoming.length
    ? upcoming
        .map(
          (c) => `
        <tr>
          <td>${clientNom(c.client_id)}</td>
          <td>${c.description}</td>
          <td>${c.date_retrait_prevue}</td>
          <td>${statutPill(c.statut)}</td>
        </tr>`
        )
        .join("")
    : `<tr><td colspan="4" style="text-align:center;">Aucune commande en cours</td></tr>`;
}

if (filterStatut) filterStatut.addEventListener("change", renderCommandes);

function resetCommandeForm() {
  commandeForm.reset();
  document.getElementById("commandeId").value = "";
  document.getElementById("commandeDateDepot").value = new Date().toISOString().split("T")[0];
  newClientFields.style.display = "grid";
}

if (newCommandeBtn) {
  newCommandeBtn.addEventListener("click", () => {
    resetCommandeForm();
    commandeFormWrap.style.display = "block";
  });
}

if (cancelCommandeBtn) {
  cancelCommandeBtn.addEventListener("click", () => {
    commandeFormWrap.style.display = "none";
  });
}

if (commandeClientSelect) {
  commandeClientSelect.addEventListener("change", () => {
    newClientFields.style.display = commandeClientSelect.value ? "none" : "grid";
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

  commandeFormWrap.style.display = "block";
  commandeFormWrap.scrollIntoView({ behavior: "smooth" });
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

    commandeFormWrap.style.display = "none";
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
          <td>${p.prix}</td>
          <td class="row-actions"><button data-prestation-id="${p.id}">Modifier</button></td>
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
      prix: document.getElementById("prestationPrix").value.trim(),
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

console.log("🚀 GS Retoucherie — Script chargé et opérationnel !");
