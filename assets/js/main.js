/*
 * SOMADONA — Maquette de démonstration (Marouane Studio)
 * JavaScript léger, sans dépendance. Le site reste utilisable sans JS.
 * Aucune requête réseau, aucun cookie, aucun stockage local.
 */
(function () {
  "use strict";

  var doc = document.documentElement;
  doc.classList.add("js");
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- En-tête : ombre au défilement ---------- */
  var header = document.querySelector(".site-header");
  var backToTop = document.querySelector(".back-to-top");
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle("is-scrolled", y > 8);
    if (backToTop) backToTop.classList.toggle("is-visible", y > 900);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (backToTop) {
    backToTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
      var skipTarget = document.querySelector(".brand");
      if (skipTarget) skipTarget.focus({ preventScroll: true });
    });
  }

  /* ---------- Menu mobile accessible ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  var mq = window.matchMedia("(max-width: 1023.98px)");

  function setNavTop() {
    if (!header) return;
    var rect = header.getBoundingClientRect();
    doc.style.setProperty("--nav-top", Math.max(rect.bottom, 0) + "px");
  }

  function focusables() {
    return nav ? Array.prototype.slice.call(nav.querySelectorAll("a[href], button:not([disabled])")) : [];
  }

  function openNav() {
    setNavTop();
    nav.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Fermer le menu");
    document.body.classList.add("nav-open");
    var items = focusables();
    if (items.length) items[0].focus();
  }

  function closeNav(returnFocus) {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Ouvrir le menu");
    document.body.classList.remove("nav-open");
    if (returnFocus) toggle.focus();
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      if (nav.classList.contains("is-open")) closeNav(false); else openNav();
    });
    document.addEventListener("keydown", function (e) {
      if (!nav.classList.contains("is-open")) return;
      if (e.key === "Escape") { closeNav(true); return; }
      if (e.key === "Tab") {
        // Piège de focus : menu + bouton de fermeture
        // Cycle explicite : liens du menu puis bouton de fermeture.
        var items = focusables().concat([toggle]);
        var idx = items.indexOf(document.activeElement);
        var next = idx === -1 ? 0 : (idx + (e.shiftKey ? -1 : 1) + items.length) % items.length;
        e.preventDefault();
        items[next].focus();
      }
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a") && nav.classList.contains("is-open")) closeNav(false);
    });
    var onMq = function () { if (!mq.matches && nav.classList.contains("is-open")) closeNav(false); };
    if (mq.addEventListener) mq.addEventListener("change", onMq); else mq.addListener(onMq);
    window.addEventListener("resize", function () { if (nav.classList.contains("is-open")) setNavTop(); });
  }

  /* ---------- FAQ : un seul élément ouvert à la fois ---------- */
  var faqItems = document.querySelectorAll(".faq-item");
  Array.prototype.forEach.call(faqItems, function (item) {
    var summary = item.querySelector("summary");
    if (!summary) return;
    // « click » couvre aussi l'activation clavier (Entrée / Espace) du <summary>.
    summary.addEventListener("click", function () {
      if (item.open) return; // l'élément est sur le point de se fermer
      Array.prototype.forEach.call(faqItems, function (other) {
        if (other !== item && other.open && other.parentNode === item.parentNode) other.open = false;
      });
    });
  });

  /* ---------- Apparitions discrètes au défilement ---------- */
  if (!reduceMotion && "IntersectionObserver" in window) {
    var revealEls = document.querySelectorAll("[data-reveal]");
    var vh = window.innerHeight || doc.clientHeight;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var delay = parseInt(el.getAttribute("data-reveal-delay") || "0", 10);
        window.setTimeout(function () {
          el.classList.add("reveal-in");
          el.classList.remove("reveal-pending");
        }, delay);
        io.unobserve(el);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    // Seuls les éléments situés sous la ligne de flottaison sont masqués : aucun scintillement.
    // Lectures groupées puis écritures groupées, pour éviter les recalculs de mise en page en cascade.
    var below = Array.prototype.filter.call(revealEls, function (el) {
      return el.getBoundingClientRect().top > vh;
    });
    below.forEach(function (el) {
      el.classList.add("reveal-pending");
      io.observe(el);
    });
  }

  /* ---------- Formulaire de démonstration (validation locale uniquement) ---------- */
  var form = document.getElementById("demo-form");
  if (form) {
    var result = document.getElementById("demo-result");
    var summary = document.getElementById("form-summary");
    var resetBtn = document.getElementById("demo-reset");

    var rules = {
      "f-nom": function (v) { return v.trim().length >= 2 ? "" : "Veuillez indiquer votre nom et prénom."; },
      "f-entreprise": function (v) { return v.trim().length >= 2 ? "" : "Veuillez indiquer le nom de votre entreprise."; },
      "f-email": function (v) {
        if (!v.trim()) return "Veuillez indiquer une adresse e-mail professionnelle.";
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Le format de l'adresse e-mail semble incorrect (ex. : prenom.nom@entreprise.ma).";
      },
      "f-tel": function (v) {
        if (!v.trim()) return "";
        return /^[+()\d\s.-]{8,20}$/.test(v.trim()) ? "" : "Le numéro de téléphone semble incorrect.";
      },
      "f-prestation": function (v) { return v ? "" : "Veuillez sélectionner un type de prestation."; },
      "f-besoin": function (v) { return v.trim().length >= 20 ? "" : "Merci de décrire votre besoin en quelques mots (20 caractères minimum)."; },
      "f-consent": function (_v, el) { return el.checked ? "" : "Veuillez confirmer avoir pris connaissance du caractère démonstratif du formulaire."; }
    };

    function validateField(el) {
      var rule = rules[el.id];
      if (!rule) return "";
      var msg = rule(el.value, el);
      var field = el.closest(".field") || el.closest(".check-field-wrap");
      var errorEl = document.getElementById(el.id + "-error");
      if (field) field.classList.toggle("has-error", !!msg);
      if (errorEl) {
        var text = errorEl.querySelector(".field-error-text");
        if (text) text.textContent = msg; // textContent : aucune injection HTML
      }
      if (msg) el.setAttribute("aria-invalid", "true"); else el.removeAttribute("aria-invalid");
      return msg;
    }

    Object.keys(rules).forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      var evt = (el.type === "checkbox" || el.tagName === "SELECT") ? "change" : "blur";
      el.addEventListener(evt, function () { validateField(el); });
      el.addEventListener("input", function () {
        var f = el.closest(".field") || el.closest(".check-field-wrap");
        if (f && f.classList.contains("has-error")) validateField(el);
      });
    });

    form.addEventListener("submit", function (e) {
      // Aucune transmission : l'envoi est systématiquement bloqué.
      e.preventDefault();
      var firstInvalid = null, count = 0;
      Object.keys(rules).forEach(function (id) {
        var el = document.getElementById(id);
        if (el && validateField(el)) { count++; if (!firstInvalid) firstInvalid = el; }
      });
      if (count) {
        summary.textContent = count === 1
          ? "Un champ nécessite votre attention avant de poursuivre la démonstration."
          : count + " champs nécessitent votre attention avant de poursuivre la démonstration.";
        summary.classList.add("is-visible");
        firstInvalid.focus();
        return;
      }
      summary.classList.remove("is-visible");
      summary.textContent = "";
      // Les valeurs saisies sont immédiatement effacées : rien n'est conservé.
      form.reset();
      form.hidden = true;
      result.hidden = false;
      result.focus();
    });

    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        result.hidden = true;
        form.hidden = false;
        var first = document.getElementById("f-nom");
        if (first) first.focus();
      });
    }
  }
})();
