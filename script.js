/* ===================================================================
   Spotlight - script.js
   Vanilla JavaScript, kein Framework, kein Backend.
   =================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* -----------------------------------------------------------
     1. Ladeanimation ausblenden, sobald die Seite bereit ist
  ----------------------------------------------------------- */
  const loader = document.getElementById('loader');
  if (loader) {
    window.addEventListener('load', () => {
      setTimeout(() => loader.classList.add('loader-hidden'), 250);
    });
    // Sicherheitsnetz: falls "load" sich verzögert (z. B. externe Bilder)
    setTimeout(() => loader.classList.add('loader-hidden'), 2500);
  }

  /* -----------------------------------------------------------
     2. Navigation: Hintergrund beim Scrollen + Burger-Menü
  ----------------------------------------------------------- */
  const nav = document.getElementById('nav');
  const navBurger = document.getElementById('navBurger');
  const navLinks = document.getElementById('navLinks');
  const navLinkItems = document.querySelectorAll('.nav-link');

  const toggleNavBackground = () => {
    if (window.scrollY > 40) {
      nav.classList.add('nav-scrolled');
    } else {
      nav.classList.remove('nav-scrolled');
    }
  };
  toggleNavBackground();
  window.addEventListener('scroll', toggleNavBackground, { passive: true });

  const closeMobileNav = () => {
    navLinks.classList.remove('nav-open');
    navBurger.classList.remove('burger-open');
    navBurger.setAttribute('aria-expanded', 'false');
  };

  if (navBurger) {
    navBurger.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('nav-open');
      navBurger.classList.toggle('burger-open', isOpen);
      navBurger.setAttribute('aria-expanded', String(isOpen));
      navBurger.setAttribute('aria-label', isOpen ? 'Menü schließen' : 'Menü öffnen');
    });
  }

  // Menü schließen, wenn außerhalb davon geklickt/getippt wird
  document.addEventListener('click', (event) => {
    if (!navLinks.classList.contains('nav-open')) return;
    if (navLinks.contains(event.target) || navBurger.contains(event.target)) return;
    closeMobileNav();
  });

  // Aktiven Navigationspunkt beim Scrollen markieren (nur Desktop-Einzelseite,
  // im mobilen Seitenmodus übernimmt setActivePage() das Markieren)
  const sections = document.querySelectorAll('main section[id]');
  const pagedMedia = window.matchMedia('(max-width: 780px)');

  const highlightActiveNav = () => {
    if (pagedMedia.matches) return;

    let currentId = '';
    const scrollPos = window.scrollY + 140;

    sections.forEach(section => {
      if (scrollPos >= section.offsetTop) {
        currentId = section.id;
      }
    });

    navLinkItems.forEach(link => {
      const targetId = link.getAttribute('href')?.replace('#', '');
      link.classList.toggle('nav-active', targetId === currentId);
    });
  };
  window.addEventListener('scroll', highlightActiveNav, { passive: true });
  highlightActiveNav();

  /* -----------------------------------------------------------
     2b. Mobile Seitenmodus: statt einer langen Scrollseite zeigt
     das Menü auf schmalen Bildschirmen jeweils nur eine "Seite"
     (Gruppe von Sections mit gleichem data-page-Attribut).
     Auf breiten Bildschirmen bleibt es die gewohnte Scroll-Seite.
  ----------------------------------------------------------- */
  const pageGroups = document.querySelectorAll('main > section[data-page]');
  const knownPageIds = new Set(Array.from(pageGroups, el => el.dataset.page));

  const setActivePage = (pageId, { scroll = true } = {}) => {
    if (!knownPageIds.has(pageId)) return;

    pageGroups.forEach(section => {
      section.classList.toggle('page-active', section.dataset.page === pageId);
    });

    navLinkItems.forEach(link => {
      const targetId = link.getAttribute('href')?.replace('#', '');
      link.classList.toggle('nav-active', targetId === pageId);
    });

    if (!scroll) return;

    if (pagedMedia.matches) {
      window.scrollTo({ top: 0, behavior: 'auto' });
    } else {
      document.getElementById(pageId)?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    }
  };

  // Sprungziel beim Laden aus dem Hash übernehmen (Startseite als Fallback)
  const initialPageId = knownPageIds.has(location.hash.replace('#', ''))
    ? location.hash.replace('#', '')
    : 'top';
  setActivePage(initialPageId, { scroll: false });

  // Alle internen Anker (Nav, Hero-Buttons, "Lern mich kennen" …) abfangen:
  // Im mobilen Seitenmodus schalten sie die Seite um statt zu scrollen.
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    const targetId = link.getAttribute('href')?.replace('#', '');
    if (!knownPageIds.has(targetId)) return;

    link.addEventListener('click', (event) => {
      event.preventDefault();
      history.replaceState(null, '', `#${targetId}`);
      setActivePage(targetId);
      closeMobileNav();
    });
  });

  /* -----------------------------------------------------------
     3. Scroll-Animationen mit IntersectionObserver
     Respektiert prefers-reduced-motion (siehe CSS und Check oben).
  ----------------------------------------------------------- */
  if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    const revealTargets = document.querySelectorAll('.reveal-fade');

    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -60px 0px'
    });

    revealTargets.forEach(target => revealObserver.observe(target));
  } else {
    // Ohne Animation: alles sofort sichtbar machen
    document.querySelectorAll('.reveal-fade').forEach(el => {
      el.classList.add('is-visible');
    });
  }

  /* -----------------------------------------------------------
     3b. Projekt-Fotos: Kacheln öffnen sich, sobald sie ins Bild kommen
  ----------------------------------------------------------- */
  const projectTiles = document.querySelectorAll('.project-tile');
  if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    const tileObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    projectTiles.forEach(tile => tileObserver.observe(tile));
  } else {
    projectTiles.forEach(tile => tile.classList.add('is-visible'));
  }

  /* -----------------------------------------------------------
     3d. Lightbox: Foto groß ansehen und durchklicken
     (Pfeiltasten, Wischen, Escape; <dialog> übernimmt den Fokus-Trap)
  ----------------------------------------------------------- */
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxText = document.getElementById('lightboxText');
  const lightboxCount = document.getElementById('lightboxCount');
  let lightboxItems = [];
  let lightboxIndex = 0;

  const renderLightbox = (animate) => {
    const item = lightboxItems[lightboxIndex];
    const img = item.querySelector('img');
    const apply = () => {
      lightboxImg.src = img.currentSrc || img.src;
      lightboxImg.alt = img.alt;
      lightboxText.textContent = item.dataset.caption || '';
      lightboxCount.textContent = `${lightboxIndex + 1} / ${lightboxItems.length}`;
      lightboxImg.classList.remove('is-swapping');
    };
    if (animate && !prefersReducedMotion) {
      lightboxImg.classList.add('is-swapping');
      setTimeout(apply, 130);
    } else {
      apply();
    }
  };

  const stepLightbox = (dir) => {
    lightboxIndex = (lightboxIndex + dir + lightboxItems.length) % lightboxItems.length;
    renderLightbox(true);
  };

  const closeLightbox = () => lightbox.close();

  if (lightbox) {
    document.querySelectorAll('.gallery-item').forEach(item => {
      item.addEventListener('click', () => {
        lightboxItems = Array.from(item.closest('.project-gallery').querySelectorAll('.gallery-item'));
        lightboxIndex = lightboxItems.indexOf(item);
        renderLightbox(false);
        lightbox.showModal();
      });
    });

    document.getElementById('lightboxPrev').addEventListener('click', () => stepLightbox(-1));
    document.getElementById('lightboxNext').addEventListener('click', () => stepLightbox(1));
    document.getElementById('lightboxClose').addEventListener('click', closeLightbox);

    // Klick auf den dunklen Hintergrund schließt
    lightbox.addEventListener('click', (event) => {
      if (event.target === lightbox) closeLightbox();
    });

    lightbox.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight') stepLightbox(1);
      if (event.key === 'ArrowLeft') stepLightbox(-1);
    });

    // Wischen auf Touchgeräten
    let touchStartX = null;
    lightbox.addEventListener('touchstart', (event) => {
      touchStartX = event.touches.length === 1 ? event.touches[0].clientX : null;
    }, { passive: true });
    lightbox.addEventListener('touchend', (event) => {
      if (touchStartX === null) return;
      const deltaX = event.changedTouches[0].clientX - touchStartX;
      touchStartX = null;
      if (Math.abs(deltaX) > 50) stepLightbox(deltaX < 0 ? 1 : -1);
    }, { passive: true });
  }

  /* -----------------------------------------------------------
     4. "Zurück nach oben"-Button
  ----------------------------------------------------------- */
  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    window.addEventListener('scroll', () => {
      backToTop.classList.toggle('visible', window.scrollY > 600);
    }, { passive: true });

    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  }

  /* -----------------------------------------------------------
     7. Kontaktformular: Validierung + mailto-Versand
     Kein Backend vorhanden — es wird ein mailto-Link geöffnet.
  ----------------------------------------------------------- */
  const contactForm = document.getElementById('contactForm');
  const formNote = document.getElementById('formNote');

  // KONTAKT-E-MAIL: Hier später eure eigene Adresse eintragen
  const CONTACT_EMAIL = 'alev.ay@outlook.de';

  const validators = {
    name: value => value.trim().length > 1 || 'Bitte gib deinen Namen ein.',
    email: value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) || 'Bitte gib eine gültige E-Mail-Adresse ein.',
    message: value => value.trim().length > 5 || 'Schreib mir kurz, worum es geht.'
  };

  const showFieldError = (fieldName, message) => {
    const field = contactForm.elements[fieldName];
    const errorEl = document.getElementById(`error-${fieldName}`);
    const row = field.closest('.form-row');
    if (message) {
      row.classList.add('field-invalid');
      errorEl.textContent = message;
    } else {
      row.classList.remove('field-invalid');
      errorEl.textContent = '';
    }
  };

  if (contactForm) {
    contactForm.addEventListener('submit', (event) => {
      event.preventDefault();

      let isValid = true;
      Object.entries(validators).forEach(([fieldName, validate]) => {
        const field = contactForm.elements[fieldName];
        const result = validate(field.value);
        if (result !== true) {
          showFieldError(fieldName, result);
          isValid = false;
        } else {
          showFieldError(fieldName, '');
        }
      });

      if (!isValid) {
        formNote.textContent = 'Bitte überprüfe die markierten Felder.';
        formNote.classList.add('is-error');
        return;
      }

      // Formulardaten einsammeln
      const data = Object.fromEntries(new FormData(contactForm).entries());

      const subject = `Anfrage von ${data.name}${data.company ? ' (' + data.company + ')' : ''}`;
      const bodyLines = [
        `Name: ${data.name}`,
        data.company ? `Unternehmen: ${data.company}` : null,
        `E-Mail: ${data.email}`,
        data.instagram ? `Instagram: ${data.instagram}` : null,
        data.phone ? `Telefon: ${data.phone}` : null,
        '',
        'Nachricht:',
        data.message
      ].filter(Boolean).join('\n');

      const mailtoLink = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines)}`;

      window.location.href = mailtoLink;

      formNote.textContent = 'Dein E-Mail-Programm öffnet sich gleich. Danke für deine Nachricht!';
      formNote.classList.remove('is-error');
    });

    // Fehler live entfernen, sobald korrigiert wird
    Object.keys(validators).forEach(fieldName => {
      const field = contactForm.elements[fieldName];
      field?.addEventListener('input', () => {
        const result = validators[fieldName](field.value);
        if (result === true) showFieldError(fieldName, '');
      });
    });
  }

  /* -----------------------------------------------------------
     8. Aktuelles Jahr im Footer
  ----------------------------------------------------------- */
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  /* -----------------------------------------------------------
     9. Platzhalter-Modal für Impressum / Datenschutz
     Rechtliche Inhalte müssen vor dem Live-Gang ergänzt werden.
  ----------------------------------------------------------- */
  const legalModal = document.getElementById('legalModal');
  const legalModalTitle = document.getElementById('legalModalTitle');
  const legalModalClose = document.getElementById('legalModalClose');
  const impressumLink = document.getElementById('impressumLink');
  const datenschutzLink = document.getElementById('datenschutzLink');

  const legalContent = {
    impressum: {
      title: 'Impressum',
      text: 'Hier folgt in Kürze das vollständige Impressum mit Name, Anschrift und Kontaktdaten der verantwortlichen Person (Anbieterkennzeichnung nach § 5 TMG).'
    },
    datenschutz: {
      title: 'Datenschutz',
      text: 'Hier folgt in Kürze die vollständige Datenschutzerklärung, u. a. zu Kontaktformular, Cookies und Hosting.'
    }
  };

  const openLegalModal = (key) => {
    legalModalTitle.textContent = legalContent[key].title;
    legalModal.querySelector('p').textContent = legalContent[key].text;
    legalModal.hidden = false;
  };

  impressumLink?.addEventListener('click', (e) => {
    e.preventDefault();
    openLegalModal('impressum');
  });

  datenschutzLink?.addEventListener('click', (e) => {
    e.preventDefault();
    openLegalModal('datenschutz');
  });

  legalModalClose?.addEventListener('click', () => {
    legalModal.hidden = true;
  });

  legalModal?.addEventListener('click', (e) => {
    if (e.target === legalModal) legalModal.hidden = true;
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && legalModal && !legalModal.hidden) {
      legalModal.hidden = true;
    }
  });

});
