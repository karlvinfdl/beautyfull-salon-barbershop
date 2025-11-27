/* =========================================================
   BEAUTYFULL SALON & BARBERSHOP – SCRIPT GLOBAL
   ========================================================= */

/* =========================================================
   1) SERVICES
   ========================================================= */

import {
  saveReservationToCloud,
  getReservationsFromCloud,
  deleteReservationFromCloud,
  isSlotTaken,
} from "./firebase.js";

const servicesData = {
  homme: [
    { title: "Coupe classique", price: "20 €", desc: "Coiffure propre et adaptée à votre style." },
    { title: "Dégradé / Fade", price: "22 €", desc: "Dégradé net sur cheveux afro, bouclés ou lisses." },
    { title: "Coupe + Barbe", price: "35 €", desc: "Formule complète avec contours soignés." },
    { title: "Taille de barbe", price: "15 €", desc: "Taillage précis avec finition nette." }
  ],
  femme: [
    { title: "Coupe + Brushing", price: "38 €", desc: "Coupe professionnelle + brushing soigné." },
    { title: "Coloration complète", price: "55 €", desc: "Transformation ou retouche élégante." },
    { title: "Balayage / Mèches", price: "65 €+", desc: "Effets lumière naturels et personnalisés." },
    { title: "Soin cheveux afro", price: "15 €", desc: "Nourrit, hydrate et revitalise." }
  ],
  enfant: [
    { title: "Coupe garçon", price: "16 €", desc: "Coiffure pour garçons jusqu’à 12 ans." },
    { title: "Dégradé enfant", price: "18 €", desc: "Dégradé soigné adapté aux jeunes." },
    { title: "Coupe fille", price: "18 €", desc: "Coupe adaptée textures & morphologies." }
  ]
};


/* =========================================================
   2) AVIS CLIENTS
   ========================================================= */

const reviewsData = [
  { name: "Karim", text: "Toujours satisfait, dégradé impeccable !", stars: 5 },
  { name: "Mariam", text: "Équipe au top, soin cheveux afro incroyable.", stars: 5 },
  { name: "Yanis", text: "Ambiance conviviale, service de qualité.", stars: 5 }
];


/* =========================================================
   3) ANNÉE FOOTER
   ========================================================= */

const yearElement = document.getElementById("year");
if (yearElement) yearElement.textContent = new Date().getFullYear();


/* =========================================================
   4) SERVICES (ONGLETS)
   ========================================================= */

const servicesContainer = document.getElementById("services-container");
const tabButtons = document.querySelectorAll(".tab-button");

function renderServices(category) {
  servicesContainer.innerHTML = "";
  servicesData[category].forEach(service => {
    const card = document.createElement("article");
    card.classList.add("service-card");
    card.innerHTML = `
      <div class="service-card-header">
        <span class="service-title">${service.title}</span>
        <span class="service-price">${service.price}</span>
      </div>
      <p class="service-desc">${service.desc}</p>
    `;
    servicesContainer.appendChild(card);
  });
}

if (servicesContainer) {
  renderServices("homme");
  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      tabButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderServices(btn.dataset.category);
    });
  });
}


/* =========================================================
   5) AVIS DYNAMIQUES
   ========================================================= */

const reviewsContainer = document.getElementById("reviews-container");
if (reviewsContainer) {
  reviewsData.forEach(r => {
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
   6) GALERIE (IMAGES + VIDÉOS + AUTOPLAY)
   ========================================================= */

// ===== IMPORTS VITE =====
import img1 from "./images/a.jpg";
import vid1 from "./videos/1.mp4";
import vid2 from "./videos/2.mp4";

// ===== GALERIE =====
const galleryMedia = [
  { type: "image", src: img1 },
  { type: "video", src: vid1 },
  { type: "video", src: vid2 }
];

const galleryMain = document.getElementById("gallery-main");
const galleryThumbs = document.getElementById("gallery-thumbs");
let galleryIndex = 0;
let galleryTimer;

function initGallery() {
  galleryMedia.forEach((m, i) => {
    const el = document.createElement(m.type === "image" ? "img" : "video");
    el.src = m.src;
    el.classList.add("thumb");
    el.dataset.index = i;
    if (m.type === "video") el.muted = true;

    el.addEventListener("click", () => {
      clearInterval(galleryTimer);
      showMedia(i);
      startAuto();
    });

    galleryThumbs.appendChild(el);
  });

  showMedia(0);
  startAuto();
}

function showMedia(i) {
  galleryIndex = i;
  galleryMain.innerHTML = "";

  const m = galleryMedia[i];
  const el = document.createElement(m.type === "image" ? "img" : "video");
  el.src = m.src;
  el.classList.add("gallery-full");

  if (m.type === "video") {
    el.autoplay = true;
    el.loop = true;
    el.muted = true;
    el.playsInline = true;
  }

  galleryMain.appendChild(el);

  document.querySelectorAll(".thumb").forEach(t => t.classList.remove("active"));
  galleryThumbs.children[i].classList.add("active");
}

function startAuto() {
  galleryTimer = setInterval(() => {
    galleryIndex = (galleryIndex + 1) % galleryMedia.length;
    showMedia(galleryIndex);
  }, 6000);
}

if (galleryMain && galleryThumbs) initGallery();


/* =========================================================
   7) MENU MOBILE
   ========================================================= */

const menuToggle = document.getElementById("menu-toggle");
const navMenu = document.getElementById("nav-menu");

if (menuToggle && navMenu) {
  menuToggle.addEventListener("click", () => navMenu.classList.toggle("open"));
}


/* =========================================================
   8) RENDEZ-VOUS + SLOTS BLOQUÉS
   ========================================================= */

const HEURES = ["10:00","11:00","12:00","14:00","15:00","16:00","17:00","18:00","19:00"];
const STORAGE_KEY = "beautyfull-rdv";

const rdvForm = document.getElementById("rdvForm");
const dateInput = document.getElementById("date");
const heureSelect = document.getElementById("heure");

function getRDV() { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
function saveRDV(data) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }

if (dateInput) {
  dateInput.min = new Date().toISOString().split("T")[0];
  dateInput.addEventListener("change", fillHours);
}

function fillHours() {
  const booked = getRDV().filter(r => r.date === dateInput.value).map(r => r.heure);
  heureSelect.innerHTML = "";
  HEURES.forEach(h => {
    const opt = document.createElement("option");
    opt.value = h;
    opt.textContent = booked.includes(h) ? h + " (indisponible)" : h;
    opt.disabled = booked.includes(h);
    heureSelect.appendChild(opt);
  });
}

if (rdvForm) {
  rdvForm.addEventListener("submit", async e => {
    e.preventDefault();

    const nom = document.getElementById("nom").value.trim();
    const tel = document.getElementById("tel").value.trim();
    const email = document.getElementById("email").value.trim();
    const service = document.getElementById("service").value;
    const date = dateInput.value;
    const heure = heureSelect.value;

    const rdv = getRDV();

    // Vérifie dans localStorage (appareil actuel)
    if (rdv.some(r => r.date === date && r.heure === heure)) {
      return alert("Ce créneau est déjà réservé.");
    }

    // Vérifie dans Firestore (cloud) pour éviter les doublons entre appareils
    const taken = await isSlotTaken(date, heure);
    if (taken) {
      return alert("Ce créneau est déjà réservé en ligne !");
    }

    rdv.push({ nom, tel, email, service, date, heure });
    saveRDV(rdv);

    // ✅ ENREGISTREMENT DANS FIRESTORE (cloud)
    const reservationCloud = { nom, tel, email, service, date, heure };
    saveReservationToCloud(reservationCloud)
      .then((id) => {
        console.log("Rendez-vous enregistré dans Firestore avec l'id :", id);
      })
      .catch((error) => {
        console.error("Erreur lors de l'enregistrement dans Firestore :", error);
        // On ne bloque pas le client : localStorage + WhatsApp fonctionnent quand même
      });

    window.open("https://wa.me/3361453210?text=" + encodeURIComponent(
      `Bonjour, je souhaite un rendez-vous :
Nom: ${nom}
Service: ${service}
Le ${date} à ${heure}`), "_blank");

    alert("Votre rendez-vous a été enregistré !");
    rdvForm.reset();
    fillHours();
  });
}


/* =========================================================
   9) ADMIN PANEL
   ========================================================= */

const ADMIN_CODE = "2025";
const adminPanel = document.getElementById("admin-panel");
const authBox = document.getElementById("auth-container");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const clearAllBtn = document.getElementById("clearAll");
const rdvTableBody = document.getElementById("rdvTableBody");
const rdvCloudTableBody = document.getElementById("rdvCloudTableBody"); // 🔹 pour Firestore

function loadAdmin() {
  const data = getRDV();
  rdvTableBody.innerHTML = data.length
    ? data.map((r,i) => `
        <tr>
          <td>${r.nom}</td>
          <td>${r.tel}</td>
          <td>${r.service}</td>
          <td>${r.date}</td>
          <td>${r.heure}</td>
          <td><button class="btn-delete" data-i="${i}">X</button></td>
        </tr>`).join("")
    : `<tr><td colspan="6" style="text-align:center;">Aucun rendez-vous</td></tr>`;

  document.querySelectorAll(".btn-delete").forEach(btn => {
    btn.addEventListener("click", () => {
      const rdv = getRDV();
      rdv.splice(btn.dataset.i, 1);
      saveRDV(rdv);
      loadAdmin();
    });
  });
}

// ---------- ADMIN CLOUD (Firestore) ----------
async function loadAdminCloud() {
  if (!rdvCloudTableBody) return;

  try {
    rdvCloudTableBody.innerHTML =
      `<tr><td colspan="6" style="text-align:center;">Chargement des rendez-vous en ligne...</td></tr>`;

    const data = await getReservationsFromCloud();

    if (!data.length) {
      rdvCloudTableBody.innerHTML =
        `<tr><td colspan="6" style="text-align:center;">Aucun rendez-vous en ligne</td></tr>`;
      return;
    }

    rdvCloudTableBody.innerHTML = data.map((r) => `
      <tr>
        <td>${r.nom}</td>
        <td>${r.tel}</td>
        <td>${r.service}</td>
        <td>${r.date}</td>
        <td>${r.heure}</td>
        <td>
          <button class="btn-delete-cloud" data-id="${r.id}">X</button>
        </td>
      </tr>
    `).join("");

    document.querySelectorAll(".btn-delete-cloud").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        if (!confirm("Supprimer ce rendez-vous (cloud) ?")) return;

        try {
          await deleteReservationFromCloud(id);
          btn.closest("tr").remove();

          if (!rdvCloudTableBody.querySelector("tr")) {
            rdvCloudTableBody.innerHTML =
              `<tr><td colspan="6" style="text-align:center;">Aucun rendez-vous en ligne</td></tr>`;
          }
        } catch (error) {
          console.error("Erreur suppression Firestore :", error);
          alert("Impossible de supprimer ce rendez-vous (cloud).");
        }
      });
    });
  } catch (error) {
    console.error("Erreur chargement Firestore :", error);
    rdvCloudTableBody.innerHTML =
      `<tr><td colspan="6" style="text-align:center;">Erreur lors du chargement des rendez-vous en ligne</td></tr>`;
  }
}

if (loginBtn) loginBtn.addEventListener("click", () => {
  if (document.getElementById("adminCode").value === ADMIN_CODE) {
    authBox.style.display = "none";
    adminPanel.style.display = "block";
    loadAdmin();       // localStorage
    loadAdminCloud();  // Firestore
  } else alert("Code incorrect !");
});

if (logoutBtn) logoutBtn.addEventListener("click", () => {
  adminPanel.style.display = "none";
  authBox.style.display = "block";
});

if (clearAllBtn) clearAllBtn.addEventListener("click", () => {
  if (confirm("Supprimer tous les rendez-vous ?")) {
    saveRDV([]);
    loadAdmin();
    // On laisse les rendez-vous cloud séparés (on pourrait ajouter un "reset cloud" plus tard)
  }
});

console.log("🚀 BeautyFull Salon & Barbershop — Script chargé et opérationnel !");
