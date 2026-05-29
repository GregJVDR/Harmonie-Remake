/* ============================================================
   Harmonie Fanfare Rudipontaine — Main JS
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Navbar scroll effect ── */
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });
  }

  /* ── Mobile nav burger ── */
  const burger = document.querySelector('.nav-burger');
  const mobileNav = document.querySelector('.mobile-nav');
  if (burger && mobileNav) {
    burger.addEventListener('click', () => {
      burger.classList.toggle('open');
      mobileNav.classList.toggle('open');
      document.body.style.overflow = mobileNav.classList.contains('open') ? 'hidden' : '';
    });

    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        burger.classList.remove('open');
        mobileNav.classList.remove('open');
        document.body.style.overflow = '';
      });
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

  const counterEls = document.querySelectorAll('[data-count]');
  if (counterEls.length) {
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

  /* ── Guestbook form ── */
  const guestbookForm = document.getElementById('guestbook-form');
  if (guestbookForm) {
    guestbookForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const name = this.querySelector('[name="name"]').value.trim();
      const message = this.querySelector('[name="message"]').value.trim();

      if (!name || !message) return;

      const container = document.getElementById('guestbook-entries');
      const entry = document.createElement('div');
      entry.className = 'guestbook-entry';
      entry.style.opacity = '0';
      entry.style.transform = 'translateY(20px)';
      entry.innerHTML = `
        <div class="guestbook-entry-header">
          <div class="avatar">${name.charAt(0).toUpperCase()}</div>
          <div class="guestbook-entry-meta">
            <div class="author">${escapeHtml(name)}</div>
            <div class="date">${new Date().toLocaleDateString('fr-FR', {day:'numeric',month:'long',year:'numeric'})}</div>
          </div>
        </div>
        <p style="color:var(--c-text);font-size:.93rem;margin:0">${escapeHtml(message)}</p>
      `;
      container.insertBefore(entry, container.firstChild);
      requestAnimationFrame(() => {
        entry.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        entry.style.opacity = '1';
        entry.style.transform = 'translateY(0)';
      });
      this.reset();
      showToast('Votre message a été ajouté au livre d\'or !');
    });
  }

  /* ── Photo upload ── */
  const photoUpload = document.getElementById('photo-upload');
  const photoPreview = document.getElementById('photo-preview');
  if (photoUpload && photoPreview) {
    photoUpload.addEventListener('change', function() {
      photoPreview.innerHTML = '';
      Array.from(this.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const div = document.createElement('div');
          div.className = 'gallery-item';
          div.innerHTML = `<img src="${e.target.result}" alt="${escapeHtml(file.name)}" style="width:100%;height:100%;object-fit:cover">`;
          photoPreview.appendChild(div);
        };
        reader.readAsDataURL(file);
      });
    });
  }

  /* ── Login form ── */
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const btn = this.querySelector('button[type=submit]');
      btn.textContent = 'Connexion...';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = 'Se connecter';
        btn.disabled = false;
        showToast('Zone membres — Fonctionnalité disponible avec le serveur PHP.', 'info');
      }, 1200);
    });
  }

  /* ── Active nav link ── */
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link[href]').forEach(link => {
    if (link.getAttribute('href') === currentPage) link.classList.add('active');
  });

  /* ── Hero particles ── */
  const particleContainer = document.querySelector('.hero-particles');
  if (particleContainer) {
    for (let i = 0; i < 30; i++) {
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
