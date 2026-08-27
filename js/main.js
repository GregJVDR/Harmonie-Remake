/* ============================================================
   Harmonie Fanfare Rudipontaine - Main JS
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Navbar scroll effect ── */
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });
  }

  /* ── Desktop dropdowns (mutually exclusive) ── */
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    if (!item.querySelector('.nav-dropdown')) return;

    let closeTimer;

    item.addEventListener('mouseenter', () => {
      clearTimeout(closeTimer);
      navItems.forEach(i => i.classList.remove('dropdown-open'));
      item.classList.add('dropdown-open');
    });

    item.addEventListener('mouseleave', () => {
      closeTimer = setTimeout(() => item.classList.remove('dropdown-open'), 120);
    });

    item.querySelector('.nav-dropdown').addEventListener('mouseenter', () => {
      clearTimeout(closeTimer);
    });
    item.querySelector('.nav-dropdown').addEventListener('mouseleave', () => {
      closeTimer = setTimeout(() => item.classList.remove('dropdown-open'), 120);
    });
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('.nav-item')) {
      navItems.forEach(i => i.classList.remove('dropdown-open'));
    }
  });

  /* ── Mobile nav ── */
  const burger   = document.querySelector('.nav-burger');
  const mobileNav = document.querySelector('.mobile-nav');
  const backdrop  = document.querySelector('.mobile-backdrop');

  function openMenu() {
    const scrollbarW = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.paddingRight = scrollbarW + 'px';
    document.body.style.overflow = 'hidden';
    burger.classList.add('open');
    mobileNav.classList.add('open');
    if (backdrop) backdrop.classList.add('open');
  }
  function closeMenu() {
    burger.classList.remove('open');
    mobileNav.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  }

  if (burger && mobileNav) {
    burger.addEventListener('click', () => {
      mobileNav.classList.contains('open') ? closeMenu() : openMenu();
    });

    if (backdrop) backdrop.addEventListener('click', closeMenu);

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && mobileNav.classList.contains('open')) closeMenu();
    });

    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    /* Active page highlight */
    const page = location.pathname.split('/').pop() || 'index.html';
    mobileNav.querySelectorAll('.mobile-nav-link[data-page]').forEach(link => {
      if (link.dataset.page === page) link.classList.add('active');
    });
  }

  /* ── Scroll to top ── */
  const scrollBtn = document.querySelector('.scroll-top');
  if (scrollBtn) {
    window.addEventListener('scroll', () => {
      scrollBtn.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });

    scrollBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ── AOS (Animate on Scroll) ── */
  const aosElements = document.querySelectorAll('[data-aos]');
  if (aosElements.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const delay = entry.target.dataset.aosDelay || 0;
          setTimeout(() => entry.target.classList.add('aos-animate'), parseInt(delay));
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

    aosElements.forEach(el => observer.observe(el));
  }

  /* ── Counter animation ── */
  function animateCounter(el) {
    const target = parseInt(el.dataset.count);
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = Math.floor(current).toLocaleString('fr-FR');
      if (current >= target) clearInterval(timer);
    }, 16);
  }

  /* ── Chiffres partagés ──────────────────────────────────────────
     Les nombres marqués  data-chiffre="..."  s'affichent sur plusieurs
     pages. Personne ne les recopie à la main :

       * musiciens  est COMPTÉ sur les cartes de la page musiciens.html
                    (le directeur n'est pas compté comme musicien) ;
       * eleves     vient de js/chiffres.js ;
       * annees     se calcule depuis l'année de fondation.

     Le chiffre écrit dans la page n'est qu'une valeur d'attente,
     remplacée dès que le comptage est connu.
     ────────────────────────────────────────────────────────────── */
  const chiffres  = (typeof CHIFFRES !== 'undefined') ? CHIFFRES : {};
  const fondation = chiffres.fondation || 1922;

  function afficherChiffres(valeurs) {
    document.querySelectorAll('[data-chiffre]').forEach(el => {
      const valeur = valeurs[el.dataset.chiffre];
      if (valeur === undefined) return;
      el.textContent = valeur.toLocaleString('fr-FR');
      if (el.classList.contains('num')) el.dataset.count = valeur;   // chiffre animé
    });
  }

  function compterMusiciens(racine) {
    const cartes = racine.querySelectorAll('.member-card[data-section]').length;
    const directeurs = racine.querySelectorAll('.member-card[data-section="directeur"]').length;
    return cartes - directeurs;
  }

  afficherChiffres({
    eleves    : chiffres.eleves,
    fondation : fondation,
    annees    : new Date().getFullYear() - fondation
  });

  function demarrerCompteurs() {
    const counterEls = document.querySelectorAll('[data-count]');
    if (!counterEls.length) return;
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counterEls.forEach(el => counterObserver.observe(el));
  }

  if (document.querySelector('.member-card[data-section]')) {
    // Page musiciens : les cartes sont là, on compte directement.
    afficherChiffres({ musiciens: compterMusiciens(document) });
    demarrerCompteurs();
  } else if (document.querySelector('[data-chiffre="musiciens"]')) {
    // Autres pages : on va lire la page musiciens et on compte ses cartes.
    fetch('musiciens.html')
      .then(reponse => reponse.ok ? reponse.text() : Promise.reject())
      .then(html => {
        const page = new DOMParser().parseFromString(html, 'text/html');
        const nombre = compterMusiciens(page);
        if (nombre > 0) afficherChiffres({ musiciens: nombre });
      })
      .catch(() => { /* page illisible : la valeur d'attente reste affichée */ })
      .then(demarrerCompteurs);
  } else {
    demarrerCompteurs();
  }

  /* ── Accordion ── */
  document.querySelectorAll('.accordion-trigger').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.accordion-item');
      const body = item.querySelector('.accordion-body');
      const bodyInner = item.querySelector('.accordion-body-inner');
      const isOpen = item.classList.contains('open');

      // Close all
      document.querySelectorAll('.accordion-item.open').forEach(openItem => {
        openItem.classList.remove('open');
        openItem.querySelector('.accordion-body').style.maxHeight = '0';
      });

      // Open clicked (if was closed)
      if (!isOpen) {
        item.classList.add('open');
        body.style.maxHeight = bodyInner.scrollHeight + 'px';
      }
    });
  });

  /* ── Active nav link ── */
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link[href]').forEach(link => {
    if (link.getAttribute('href') === currentPage) link.classList.add('active');
  });

  /* ── Hero particles ── */
  const particleContainer = document.querySelector('.hero-particles');
  if (particleContainer) {
    for (let i = 0; i < 8; i++) {
      const p = document.createElement('div');
      p.className = 'hero-particle';
      p.style.cssText = `
        left: ${Math.random()*100}%;
        top: ${Math.random()*100}%;
        width: ${Math.random()*3+1}px;
        height: ${Math.random()*3+1}px;
        animation-delay: ${Math.random()*8}s;
        animation-duration: ${Math.random()*6+6}s;
      `;
      particleContainer.appendChild(p);
    }
  }

  /* ── Music notes animation ── */
  const musicNotes = document.querySelectorAll('.music-note');
  musicNotes.forEach((note, i) => {
    note.style.animationDelay = `${i * 1.2}s`;
    note.style.animationDuration = `${4 + Math.random()*3}s`;
    note.style.left = `${10 + Math.random()*80}%`;
    note.style.top = `${20 + Math.random()*60}%`;
  });

});

/* ── Utilities ── */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function showToast(message, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.style.cssText = `
    position:fixed;bottom:2rem;left:50%;transform:translateX(-50%) translateY(20px);
    background:${type==='success'?'var(--c-blue)':'var(--c-navy-light)'};
    color:white;padding:.85rem 1.75rem;border-radius:var(--radius-md);
    font-size:.9rem;font-family:var(--font-sans);
    box-shadow:var(--shadow-md);z-index:9999;
    opacity:0;transition:opacity .3s ease,transform .3s ease;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
