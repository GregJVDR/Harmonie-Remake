/* ============================================================
   Injecte la navbar, le footer et le bouton scroll-top
   dans toutes les pages du site.
   ============================================================ */
(function () {

  const NAV_HTML = `
<nav class="navbar" id="navbar">
  <div class="container">
    <div class="nav-inner">
      <a href="index.html" class="nav-logo">
        <img src="images/logo3d2.png" alt="Logo Harmonie Fanfare Rudipontaine" class="nav-logo-icon" style="object-fit:contain;background:transparent;padding:2px">
        <div class="nav-logo-text">
          <span class="name">Harmonie</span>
          <span class="sub">Fanfare Rudipontaine</span>
        </div>
      </a>
      <ul class="nav-menu">
        <li class="nav-item"><a href="index.html" class="nav-link" data-page="index.html">Accueil</a></li>
        <li class="nav-item"><a href="histoire.html" class="nav-link" data-page="histoire.html">Histoire</a></li>
        <li class="nav-item">
          <span class="nav-link">Manifestations <span class="arrow">▾</span></span>
          <div class="nav-dropdown">
            <a href="manifestations.html#avenir"><i class="fa-solid fa-calendar-days"></i> À Venir</a>
            <a href="manifestations.html#passees"><i class="fa-solid fa-clock-rotate-left"></i> Passées</a>
          </div>
        </li>
        <li class="nav-item">
          <span class="nav-link">Présentation <span class="arrow">▾</span></span>
          <div class="nav-dropdown">
            <a href="ecole-musique.html"><i class="fa-solid fa-graduation-cap"></i> École de Musique</a>
            <a href="orchestre-junior.html"><i class="fa-solid fa-star"></i> Orchestre Junior</a>
            <a href="musiciens.html"><i class="fa-solid fa-users"></i> Musiciens</a>
            <a href="comite.html"><i class="fa-solid fa-sitemap"></i> Comité</a>
          </div>
        </li>
        <li class="nav-item">
          <span class="nav-link">Souvenirs <span class="arrow">▾</span></span>
          <div class="nav-dropdown">
            <a href="souvenirs.html#photos"><i class="fa-solid fa-images"></i> Photos</a>
          </div>
        </li>
      </ul>
      <div class="nav-actions">
        <a href="ecole-musique.html#inscription" class="nav-link nav-inscription-btn" data-page="ecole-musique.html">
          S'inscrire à l'école
        </a>
        <div class="nav-burger" id="nav-burger"><span></span><span></span><span></span></div>
      </div>
    </div>
  </div>
</nav>
<div class="mobile-backdrop" id="mobile-backdrop"></div>
<div class="mobile-nav" id="mobile-nav" role="dialog" aria-modal="true" aria-label="Menu de navigation">
  <nav class="mobile-nav-body">
    <a href="index.html" class="mobile-nav-link" data-page="index.html">
      <span class="mnl-icon mnl-blue"><i class="fa-solid fa-house"></i></span>
      <span class="mnl-label">Accueil</span>
      <i class="fa-solid fa-chevron-right mnl-arrow"></i>
    </a>
    <a href="histoire.html" class="mobile-nav-link" data-page="histoire.html">
      <span class="mnl-icon mnl-purple"><i class="fa-solid fa-book-open"></i></span>
      <span class="mnl-label">Histoire</span>
      <i class="fa-solid fa-chevron-right mnl-arrow"></i>
    </a>

    <div class="mobile-nav-section-label">Manifestations</div>
    <a href="manifestations.html#avenir" class="mobile-nav-link">
      <span class="mnl-icon mnl-green"><i class="fa-solid fa-calendar-days"></i></span>
      <span class="mnl-label">Concerts à Venir</span>
      <i class="fa-solid fa-chevron-right mnl-arrow"></i>
    </a>
    <a href="manifestations.html#passees" class="mobile-nav-link">
      <span class="mnl-icon mnl-gray"><i class="fa-solid fa-clock-rotate-left"></i></span>
      <span class="mnl-label">Manifestations Passées</span>
      <i class="fa-solid fa-chevron-right mnl-arrow"></i>
    </a>

    <div class="mobile-nav-section-label">L'Association</div>
    <a href="ecole-musique.html" class="mobile-nav-link" data-page="ecole-musique.html">
      <span class="mnl-icon mnl-gold"><i class="fa-solid fa-graduation-cap"></i></span>
      <span class="mnl-label">École de Musique</span>
      <i class="fa-solid fa-chevron-right mnl-arrow"></i>
    </a>
    <a href="orchestre-junior.html" class="mobile-nav-link" data-page="orchestre-junior.html">
      <span class="mnl-icon mnl-orange"><i class="fa-solid fa-star"></i></span>
      <span class="mnl-label">Orchestre Junior</span>
      <i class="fa-solid fa-chevron-right mnl-arrow"></i>
    </a>
    <a href="musiciens.html" class="mobile-nav-link" data-page="musiciens.html">
      <span class="mnl-icon mnl-blue"><i class="fa-solid fa-users"></i></span>
      <span class="mnl-label">Nos Musiciens</span>
      <i class="fa-solid fa-chevron-right mnl-arrow"></i>
    </a>
    <a href="comite.html" class="mobile-nav-link" data-page="comite.html">
      <span class="mnl-icon mnl-teal"><i class="fa-solid fa-sitemap"></i></span>
      <span class="mnl-label">Le Comité</span>
      <i class="fa-solid fa-chevron-right mnl-arrow"></i>
    </a>

    <div class="mobile-nav-section-label">Souvenirs</div>
    <a href="souvenirs.html#photos" class="mobile-nav-link">
      <span class="mnl-icon mnl-green"><i class="fa-solid fa-images"></i></span>
      <span class="mnl-label">Photos</span>
      <i class="fa-solid fa-chevron-right mnl-arrow"></i>
    </a>
  </nav>

  <div class="mobile-nav-cta">
    <a href="ecole-musique.html#inscription" class="mobile-nav-link" data-page="ecole-musique.html">
      <span class="mnl-icon mnl-gold"><i class="fa-solid fa-pen"></i></span>
      <span class="mnl-label">S'inscrire à l'École</span>
      <i class="fa-solid fa-chevron-right mnl-arrow"></i>
    </a>
  </div>

  <div class="mobile-nav-footer">
    <div class="mobile-nav-socials">
      <a href="https://www.facebook.com/people/Harmonie-Fanfare-Rudipontaine/100057406793498/" target="_blank" rel="noopener" aria-label="Facebook"><i class="fa-brands fa-facebook-f"></i></a>
      <a href="https://www.instagram.com/harmonie_rudipontaine/" target="_blank" rel="noopener" aria-label="Instagram"><i class="fa-brands fa-instagram"></i></a>
      <a href="mailto:contact@harmonie-pont-de-roide.com" aria-label="Email"><i class="fa-solid fa-envelope"></i></a>
    </div>
    <p class="mobile-nav-copyright">© 2026 Harmonie Fanfare Rudipontaine</p>
  </div>
</div>`;

  const FOOTER_HTML = `
<footer>
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:.25rem">
          <img src="images/logo3d2.png" alt="Logo Harmonie" style="width:44px;height:44px;border-radius:12px;object-fit:contain;flex-shrink:0">
          <div style="display:flex;flex-direction:column;line-height:1.1">
            <span style="font-family:var(--font-display);font-size:1rem;font-weight:700;color:var(--c-white)">Harmonie</span>
            <span style="font-size:.7rem;color:var(--c-text-muted);letter-spacing:.05em">Fanfare Rudipontaine</span>
          </div>
        </div>
        <p class="desc">Association musicale fondée en 1922 à Pont de Roide-Vermondans. 38 musiciens actifs et 49 élèves à l'école de musique.</p>
        <div class="footer-social">
          <a href="https://www.facebook.com/harmoniefanfarerudipontaine" target="_blank" rel="noopener" class="social-btn" title="Facebook"><i class="fa-brands fa-facebook-f"></i></a>
          <a href="https://www.instagram.com/harmonie_rudipontaine/" target="_blank" rel="noopener" class="social-btn" title="Instagram" aria-label="Instagram"><i class="fa-brands fa-instagram"></i></a>
          <a href="mailto:contact@harmonie-pont-de-roide.com" class="social-btn" title="Email"><i class="fa-solid fa-envelope"></i></a>
        </div>
      </div>
      <div class="footer-col">
        <h4>Navigation</h4>
        <ul>
          <li><a href="index.html"><i class="fa-solid fa-chevron-right" style="font-size:.7rem"></i> Accueil</a></li>
          <li><a href="histoire.html"><i class="fa-solid fa-chevron-right" style="font-size:.7rem"></i> Histoire</a></li>
          <li><a href="manifestations.html"><i class="fa-solid fa-chevron-right" style="font-size:.7rem"></i> Manifestations</a></li>
          <li><a href="souvenirs.html"><i class="fa-solid fa-chevron-right" style="font-size:.7rem"></i> Souvenirs</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Présentation</h4>
        <ul>
          <li><a href="ecole-musique.html"><i class="fa-solid fa-chevron-right" style="font-size:.7rem"></i> École de Musique</a></li>
          <li><a href="orchestre-junior.html"><i class="fa-solid fa-chevron-right" style="font-size:.7rem"></i> Orchestre Junior</a></li>
          <li><a href="musiciens.html"><i class="fa-solid fa-chevron-right" style="font-size:.7rem"></i> Nos Musiciens</a></li>
          <li><a href="comite.html"><i class="fa-solid fa-chevron-right" style="font-size:.7rem"></i> Le Comité</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Contact</h4>
        <ul>
          <li style="margin-bottom:.75rem">
            <span style="font-size:.85rem;color:var(--c-text-muted);display:flex;align-items:flex-start;gap:.5rem">
              <i class="fa-solid fa-location-dot" style="color:var(--c-accent);margin-top:.2rem"></i>
              Pont de Roide-Vermondans<br>25150 Doubs, France
            </span>
          </li>
          <li><a href="mailto:contact@harmonie-pont-de-roide.com" style="font-size:.85rem;display:flex;align-items:center;gap:.5rem"><i class="fa-solid fa-envelope" style="color:var(--c-accent)"></i> Nous écrire</a></li>
        </ul>
        <div class="highlight-box" style="margin-top:1rem;padding:1rem">
          <div style="font-size:.8rem;font-weight:600;color:var(--c-accent);margin-bottom:.4rem"><i class="fa-solid fa-circle-info"></i> Répétitions</div>
          <div style="font-size:.82rem;color:var(--c-text-muted)">Tous les vendredis - 20h00 – 22h00</div>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <div>© 2007–2026 Harmonie Fanfare Rudipontaine. Tous droits réservés.</div>
      <div>
        <a href="mentions-legales.html#mentions">Mentions légales</a>
        <span style="opacity:.4;margin:0 .4rem">·</span>
        <a href="mentions-legales.html#cgu">CGU</a>
        <span style="opacity:.4;margin:0 .4rem">·</span>
        Webmaster : <a href="#">Grégoire JURY--VERMOT DES ROCHES</a>
      </div>
    </div>
  </div>
</footer>
<button class="scroll-top" id="scroll-top-btn" aria-label="Retour en haut">
  <i class="fa-solid fa-chevron-up"></i>
</button>`;

  /* ── Navbar : injection immédiate (synchrone) ──
     Le script est en tête de <body> donc afterbegin place bien la
     navbar avant tout le contenu de page. */
  document.body.insertAdjacentHTML('afterbegin', NAV_HTML);

  /* ── Footer : injection différée après parse complet du DOM ──
     Sans DOMContentLoaded, le script s'exécute alors que le reste
     du <body> n'est pas encore parsé : beforeend insérerait le
     footer juste après la navbar au lieu du bas de page. */
  document.addEventListener('DOMContentLoaded', function () {

    document.body.insertAdjacentHTML('beforeend', FOOTER_HTML);

    /* Lien actif dans la navbar */
    const page = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-menu .nav-link[data-page]').forEach(a => {
      if (a.dataset.page === page) a.classList.add('active');
    });

    /* Surligner le parent dropdown pour les sous-pages */
    const subPages = {
      'manifestations.html': 1,
      'ecole-musique.html': 3, 'orchestre-junior.html': 3,
      'musiciens.html': 3, 'comite.html': 3,
      'souvenirs.html': 5,
    };
    if (subPages[page] !== undefined) {
      const items = document.querySelectorAll('.nav-menu .nav-item');
      const item = items[subPages[page]];
      if (item) item.querySelector('.nav-link').classList.add('active');
    }

  });

})();
