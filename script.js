/* ===================================================================
   tagMe — script.js
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
     3b. Preis-Karten: Swipe-Dots mit der Scrollposition abgleichen
  ----------------------------------------------------------- */
  const pricingGrid = document.querySelector('.pricing-grid');
  const pricingDots = document.querySelectorAll('.pricing-dot');

  if (pricingGrid && pricingDots.length) {
    const priceCards = pricingGrid.querySelectorAll('.price-card');

    const scrollToCard = (index) => {
      priceCards[index]?.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        inline: 'center',
        block: 'nearest'
      });
    };

    pricingDots.forEach(dot => {
      const goTo = () => scrollToCard(Number(dot.dataset.index));
      dot.addEventListener('click', goTo);
      dot.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          goTo();
        }
      });
    });

    const syncPricingDots = () => {
      const gridCenter = pricingGrid.getBoundingClientRect().left + pricingGrid.clientWidth / 2;
      let closestIndex = 0;
      let closestDistance = Infinity;

      priceCards.forEach((card, index) => {
        const cardCenter = card.getBoundingClientRect().left + card.clientWidth / 2;
        const distance = Math.abs(cardCenter - gridCenter);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      pricingDots.forEach((dot, index) => {
        dot.classList.toggle('is-active', index === closestIndex);
      });
    };

    let pricingScrollTicking = false;
    pricingGrid.addEventListener('scroll', () => {
      if (pricingScrollTicking) return;
      pricingScrollTicking = true;
      window.requestAnimationFrame(() => {
        syncPricingDots();
        pricingScrollTicking = false;
      });
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
     6. Scroll-Indikator im Hero führt zum nächsten Bereich
  ----------------------------------------------------------- */
  const scrollIndicator = document.getElementById('scrollIndicator');
  if (scrollIndicator) {
    scrollIndicator.addEventListener('click', () => {
      const nextSection = document.querySelector('.industries');
      nextSection?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
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
    service: value => value.trim().length > 0 || 'Bitte wähle eine Leistung aus.',
    message: value => value.trim().length > 5 || 'Erzähl uns kurz von deinem Projekt.'
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
        formNote.style.color = 'var(--color-terracotta)';
        return;
      }

      // Formulardaten einsammeln
      const data = Object.fromEntries(new FormData(contactForm).entries());

      const subject = `Projektanfrage von ${data.name}${data.company ? ' (' + data.company + ')' : ''}`;
      const bodyLines = [
        `Name: ${data.name}`,
        data.company ? `Unternehmen: ${data.company}` : null,
        `E-Mail: ${data.email}`,
        data.instagram ? `Instagram: ${data.instagram}` : null,
        `Gewünschte Leistung: ${data.service}`,
        '',
        'Projektbeschreibung:',
        data.message
      ].filter(Boolean).join('\n');

      const mailtoLink = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines)}`;

      window.location.href = mailtoLink;

      formNote.textContent = 'Dein E-Mail-Programm öffnet sich gleich — danke für deine Nachricht!';
      formNote.style.color = 'var(--color-sage-dark)';
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
