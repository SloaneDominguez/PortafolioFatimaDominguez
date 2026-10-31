/* ==========================================================
   PORTAFOLIO – Fátima Domínguez
   Animaciones e interacciones (JavaScript puro, sin librerías)

   - No necesita cambios en el HTML ni en el CSS.
   - Usa la Web Animations API: si el JS falla, el contenido se ve igual.
   - Respeta "reducir movimiento" del sistema (prefers-reduced-motion).
   ========================================================== */
(() => {
  'use strict';

  /* ---------- Utilidades ---------- */
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const EASE_SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

  /**
   * Entrada con desvanecido + desplazamiento, escalonada entre elementos.
   * El elemento debe haberse ocultado antes con style.opacity = '0'.
   */
  function reveal(els, { x = 0, y = 28, delay = 0, step = 90, duration = 750 } = {}) {
    els.forEach((el, i) => {
      el.style.opacity = '';
      el.animate(
        [
          { opacity: 0, transform: `translate(${x}px, ${y}px)` },
          { opacity: 1, transform: 'translate(0, 0)' },
        ],
        {
          duration,
          delay: delay + Math.min(i, 6) * step,
          easing: EASE_OUT,
          fill: 'backwards',
        }
      );
    });
  }

  /* ==========================================================
     1. NAVEGACIÓN: sombra al hacer scroll + indicador deslizante
     ========================================================== */
  function initNav() {
    const header = $('.navbar');
    const menu = $('.navbar__menu');
    if (!header || !menu) return;

    const links = $$('.navbar__link', menu);

    /* Sombra cuando la página ya se desplazó */
    if (!reduceMotion) header.style.transition = 'box-shadow 0.3s ease';
    const onScroll = () => {
      header.style.boxShadow = window.scrollY > 8 ? '0 10px 30px rgba(60, 0, 80, 0.28)' : '';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* Raya blanca que se desliza bajo el enlace de la sección activa */
    menu.style.position = 'relative';
    const bar = document.createElement('span');
    bar.setAttribute('aria-hidden', 'true');
    Object.assign(bar.style, {
      position: 'absolute',
      left: '0',
      bottom: '-8px',
      width: '0',
      height: '3px',
      borderRadius: '3px',
      background: '#fff',
      opacity: '0',
      pointerEvents: 'none',
    });
    menu.appendChild(bar);

    let current = null;
    let placed = false;

    function place(link) {
      current = link;
      if (!link) {
        bar.style.opacity = '0';
        return;
      }
      bar.style.width = `${link.offsetWidth}px`;
      bar.style.left = `${link.offsetLeft}px`;
      bar.style.opacity = '1';

      if (!placed) {
        placed = true;
        void bar.offsetWidth; // evita que la primera posición "viaje" desde 0
        if (!reduceMotion) {
          bar.style.transition = `left 0.45s ${EASE_OUT}, width 0.45s ${EASE_OUT}, opacity 0.3s ease`;
        }
      }
    }

    function setActive(id) {
      const link = links.find((l) => l.getAttribute('href') === `#${id}`) || null;
      links.forEach((l) => {
        l.removeAttribute('aria-current');
        if (!reduceMotion) l.style.transition = 'opacity 0.3s ease';
        l.style.opacity = link && l !== link ? '0.72' : '1';
      });
      if (link) link.setAttribute('aria-current', 'true');
      place(link);
    }

    if ('IntersectionObserver' in window) {
      const spy = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) setActive(entry.target.id);
          });
        },
        { rootMargin: '-45% 0px -50% 0px' } // sección que cruza el centro de la pantalla
      );
      $$('main > section[id]').forEach((s) => spy.observe(s));
    }

    window.addEventListener('resize', () => place(current));

    /* Micro-interacción: el ícono crece un poco al pasar el cursor */
    if (canHover && !reduceMotion) {
      links.forEach((link) => {
        const icon = $('.navbar__icon', link);
        if (!icon) return;
        icon.style.transition = `scale 0.3s ${EASE_SPRING}`;
        link.addEventListener('pointerenter', () => (icon.style.scale = '1.15'));
        link.addEventListener('pointerleave', () => (icon.style.scale = ''));
      });
    }
  }

  /* ==========================================================
     2. HERO: entrada al cargar, flotación y parallax suave
     ========================================================== */
  function initHero() {
    const hero = $('.hero');
    const greeting = $('.hero__greeting');
    const title = $('.hero__title');
    const media = $('.hero__media');
    const img = $('.hero__image');
    const arrow = $('.explore svg');
    if (!hero || !greeting || !title || !media) return;

    [greeting, title, media].forEach((el) => (el.style.opacity = '0'));

    // Espera a que cargue la tipografía para que el texto no "salte" a media animación
    const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
    const timeout = new Promise((resolve) => setTimeout(resolve, 900));

    Promise.race([fontsReady, timeout]).then(() => {
      reveal([greeting], { y: 24, delay: 100, duration: 800 });
      reveal([title], { y: 40, delay: 260, duration: 900 });
      reveal([media], { x: 60, y: 20, delay: 450, duration: 1000 });

      /* La ilustración 3D flota suavemente */
      if (img) {
        img.animate(
          [{ transform: 'translateY(0)' }, { transform: 'translateY(-12px)' }],
          { duration: 3600, delay: 1500, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' }
        );
      }

      /* La flecha de "Explorar" invita a bajar */
      if (arrow) {
        arrow.animate(
          [{ transform: 'translateY(0)' }, { transform: 'translateY(8px)' }],
          { duration: 900, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' }
        );
      }
    });

    /* Parallax: la ilustración sigue levemente al cursor */
    if (canHover) {
      media.style.transition = 'translate 0.5s ease-out';
      hero.addEventListener('pointermove', (e) => {
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        media.style.translate = `${nx * -18}px ${ny * -14}px`;
      });
      hero.addEventListener('pointerleave', () => (media.style.translate = ''));
    }
  }

  /* ==========================================================
     3. REVELADO AL HACER SCROLL (una sola vez por sección)
        Cada sección lista sus elementos en el orden de aparición.
     ========================================================== */
  const SECTIONS = {
    'sobre-mi': [
      ['.section__title', { x: -40, y: 0 }],
      ['.card--photo', { y: 30 }],
      ['.about__text', { y: 24 }],
      ['.fact', { y: 24, step: 70 }],
    ],
    proyectos: [
      ['.section__title', { x: -40, y: 0 }],
      ['.card--project', { y: 36, step: 100 }],
      ['.carousel__next', { x: -16, y: 0 }],
    ],
    experiencia: [
      ['.section__title', { x: -40, y: 0 }],
      ['.btn-cv', { y: 16 }],
      ['.card--experience', { y: 36, step: 130 }],
    ],
    certificaciones: [
      ['.section__title', { x: -40, y: 0 }],
      ['.btn-cv', { y: 16 }],
      ['.card--cert', { y: 36, step: 130 }],
    ],
  };

  function initReveals() {
    if (!('IntersectionObserver' in window)) return;

    const plan = new Map();

    Object.entries(SECTIONS).forEach(([id, groups]) => {
      const section = document.getElementById(id);
      if (!section) return;
      const resolved = groups
        .map(([sel, opts]) => ({ els: $$(sel, section), opts }))
        .filter((g) => g.els.length);
      resolved.forEach((g) => g.els.forEach((el) => (el.style.opacity = '0')));
      plan.set(section, resolved);
    });

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          io.unobserve(entry.target);

          let t = 0;
          plan.get(entry.target).forEach(({ els, opts }) => {
            reveal(els, { ...opts, delay: t });
            t += 140;
          });

          /* Los listones de certificaciones "saltan" después de que aparece cada tarjeta */
          if (entry.target.id === 'certificaciones') {
            $$('.card__ribbon', entry.target).forEach((ribbon, i) => {
              ribbon.animate(
                [
                  { opacity: 0, scale: '0.3', rotate: '-25deg' },
                  { opacity: 1, scale: '1', rotate: '0deg' },
                ],
                { duration: 700, delay: t + 200 + i * 130, easing: EASE_SPRING, fill: 'backwards' }
              );
            });
          }
        });
      },
      { threshold: 0.2, rootMargin: '0px 0px -8% 0px' }
    );

    plan.forEach((_, section) => io.observe(section));
  }

  /* ==========================================================
     4. HOVER: las tarjetas y botones responden al cursor
     ========================================================== */
  function initHover() {
    if (!canHover) return;

    const lift = (els, dy, shadow) => {
      els.forEach((el) => {
        el.style.transition = `translate 0.35s ${EASE_OUT}, box-shadow 0.35s ease`;
        el.addEventListener('pointerenter', () => {
          el.style.translate = `0 ${dy}px`;
          if (shadow) el.style.boxShadow = shadow;
        });
        el.addEventListener('pointerleave', () => {
          el.style.translate = '';
          el.style.boxShadow = '';
        });
      });
    };

    const bigShadow = '0 22px 44px rgba(90, 0, 120, 0.18)';
    lift($$('.card--project'), -6, bigShadow);
    lift($$('.card--experience'), -10, bigShadow);
    lift($$('.card--cert'), -10, bigShadow);
    lift($$('.fact'), -4, '0 14px 28px rgba(90, 0, 120, 0.14)');
    lift($$('.btn-cv'), -3, '0 16px 30px rgba(120, 0, 154, 0.42)');

    const next = $('.carousel__next');
    if (next) {
      next.style.transition = `scale 0.3s ${EASE_SPRING}`;
      next.addEventListener('pointerenter', () => (next.style.scale = '1.12'));
      next.addEventListener('pointerleave', () => (next.style.scale = ''));
      next.addEventListener('pointerdown', () => (next.style.scale = '0.92'));
      next.addEventListener('pointerup', () => (next.style.scale = '1.12'));
    }
  }

  /* ==========================================================
     5. CARRUSEL DE PROYECTOS: botón ">" con scroll suave
        (al llegar al final, el botón gira y regresa al inicio)
     ========================================================== */
  function initCarousel() {
    const viewport = $('#proyectos-carrusel');
    const next = $('.carousel__next');
    const track = $('.carousel__track');
    if (!viewport || !next || !track) return;

    const icon = $('svg', next);
    const behavior = reduceMotion ? 'auto' : 'smooth';

    const gap = () => parseFloat(getComputedStyle(track).columnGap) || 0;
    const cardStep = () => {
      const card = $('.card--project', track);
      return card ? card.getBoundingClientRect().width + gap() : viewport.clientWidth;
    };
    const atEnd = () => viewport.scrollLeft + viewport.clientWidth >= viewport.scrollWidth - 4;

    function sync() {
      const overflow = viewport.scrollWidth > viewport.clientWidth + 4;
      next.style.display = overflow ? '' : 'none';

      const end = atEnd();
      next.setAttribute('aria-label', end ? 'Volver al primer proyecto' : 'Ver siguientes proyectos');
      if (icon) {
        if (!reduceMotion) icon.style.transition = `rotate 0.4s ${EASE_OUT}`;
        icon.style.rotate = end ? '180deg' : '0deg';
      }
    }

    next.addEventListener('click', () => {
      if (atEnd()) viewport.scrollTo({ left: 0, behavior });
      else viewport.scrollBy({ left: cardStep(), behavior });
    });

    let ticking = false;
    viewport.addEventListener(
      'scroll',
      () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          sync();
          ticking = false;
        });
      },
      { passive: true }
    );
    window.addEventListener('resize', sync);
    sync();
  }

  /* ==========================================================
     6. MODAL: detalle de proyectos y certificados (<dialog> nativo)
        - Esc, clic fuera o botón ✕ lo cierran.
        - El contenido sale del <template> de cada tarjeta.
     ========================================================== */
  function initModal() {
    const dialog = $('#modal');
    if (!dialog || typeof dialog.showModal !== 'function') return;

    const inner = $('.modal__inner', dialog);
    const media = $('.modal__media', dialog);
    const body = $('.modal__body', dialog);
    const closeBtn = $('.modal__close', dialog);

    /* Si una imagen no existe, la ocultamos para que quede solo el título */
    $$('.card__img').forEach((img) => {
      const hide = () => (img.style.visibility = 'hidden');
      if (img.complete && img.naturalWidth === 0) hide();
      img.addEventListener('error', hide);
    });

    let opener = null;
    let closing = false;

    function open(button) {
      const card = button.closest('.card');
      const tpl = $('template', card);
      const thumb = $('.card__img', button);
      const hasImg = thumb && thumb.style.visibility !== 'hidden';
      opener = button;

      media.replaceChildren();
      if (hasImg) {
        const img = new Image();
        img.src = thumb.currentSrc || thumb.src;
        img.alt = thumb.alt;
        media.append(img);
      }

      body.replaceChildren(tpl ? tpl.content.cloneNode(true) : document.createDocumentFragment());
      dialog.classList.toggle('modal--cert', card.classList.contains('card--cert'));
      dialog.classList.toggle('modal--noimg', !hasImg);

      const title = $('.modal__title', body);
      if (title) {
        title.id = 'modal-title';
        dialog.setAttribute('aria-labelledby', 'modal-title');
      }

      document.documentElement.style.overflow = 'hidden'; // bloquea el scroll de fondo
      dialog.showModal();
      inner.scrollTop = 0;

      if (!reduceMotion) {
        dialog.animate(
          [
            { opacity: 0, transform: 'translateY(24px) scale(0.96)' },
            { opacity: 1, transform: 'none' },
          ],
          { duration: 350, easing: EASE_OUT }
        );
        try {
          dialog.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 350, pseudoElement: '::backdrop' });
        } catch (_) { /* navegadores sin soporte: se abre sin animar el fondo */ }
      }
    }

    function close() {
      if (!dialog.open || closing) return;
      if (reduceMotion) return dialog.close();

      closing = true;
      const a = dialog.animate(
        [
          { opacity: 1, transform: 'none' },
          { opacity: 0, transform: 'translateY(16px) scale(0.97)' },
        ],
        { duration: 220, easing: 'ease-in', fill: 'forwards' }
      );
      let b = null;
      try {
        b = dialog.animate([{ opacity: 1 }, { opacity: 0 }], {
          duration: 220,
          pseudoElement: '::backdrop',
          fill: 'forwards',
        });
      } catch (_) { /* sin soporte */ }

      a.onfinish = () => {
        dialog.close();
        a.cancel();
        if (b) b.cancel();
        closing = false;
      };
    }

    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.card__open');
      if (btn) open(btn);
    });
    closeBtn.addEventListener('click', close);
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) close(); // clic en el fondo oscuro
    });
    dialog.addEventListener('cancel', (e) => {
      e.preventDefault(); // Esc: cerramos con animación
      close();
    });
    dialog.addEventListener('close', () => {
      document.documentElement.style.overflow = '';
      if (opener) opener.focus({ preventScroll: true });
    });
  }

  /* ---------- Arranque ---------- */
  initNav();
  initCarousel();
  initModal();

  if (!reduceMotion) {
    initHero();
    initReveals();
    initHover();
  }
})();