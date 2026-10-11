/* ═══════════════════════════════════════════════════
   script.js — La Libertad Avanza Almirante Brown
═══════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────
   DATOS
───────────────────────────────────────── */
let currentIndex = 0;
const localidades = [
  { nombre: 'Adrogué',              wa: 'https://wa.me/5491131596936' },
  { nombre: 'Burzaco',              wa: 'https://wa.me/5491131596936' },
  { nombre: 'Claypole',             wa: 'https://wa.me/5491131596936' },
  { nombre: 'Don Orione',           wa: 'https://wa.me/5491131596936' },
  { nombre: 'Glew',                 wa: 'https://wa.me/5491131596936' },
  { nombre: 'José Mármol',          wa: 'https://wa.me/5491131596936' },
  { nombre: 'Longchamps',           wa: 'https://wa.me/5491131596936' },
  { nombre: 'Malvinas Argentinas',  wa: 'https://wa.me/5491131596936' },
  { nombre: 'Ministro Rivadavia',   wa: 'https://wa.me/5491131596936' },
  { nombre: 'Rafael Calzada',       wa: 'https://wa.me/5491131596936' },
  { nombre: 'San Francisco de Asís',wa: 'https://wa.me/5491131596936' },
  { nombre: 'Solano',               wa: 'https://wa.me/5491131596936' },
];

const concejales = [
  {
    nombre: 'Juan Pedro Aquino',
    rol: 'Jefe de bloque, Concejal',
    localidad: 'ALMIRANTE BROWN',
    foto: 'img/foto1.jpeg'
  },
  {
    nombre: 'Diego Garrido',
    rol: 'Concejal',
    localidad: 'ALMIRANTE BROWN',
    foto: 'img/foto2.jpeg'
  },
    {
    nombre: 'Ezequiel Barreiro',
    rol: 'Concejal',
    localidad: 'ALMIRANTE BROWN',
    foto: 'img/foto3.jpeg'
  },
    {
    nombre: 'Florencia Colman',
    rol: 'Concejal',
    localidad: 'ALMIRANTE BROWN',
    foto: 'img/foto4.jpeg'
  },
    {
    nombre: 'Ariel Vieyra',
    rol: 'Concejal',
    localidad: 'ALMIRANTE BROWN',
    foto: 'img/foto5.jpeg'
  },
    {
    nombre: 'Natalia German',
    rol: 'Concejal',
    localidad: 'ALMIRANTE BROWN',
    foto: 'img/foto6.jpeg'
  },
    {
    nombre: 'Ivan Ibañez',
    rol: 'Concejal',
    localidad: 'ALMIRANTE BROWN',
    foto: 'img/foto7.jpeg',
     estilo: 'object-position: center 15%;'
  },
    {
    nombre: 'Miriam Locher',
    rol: 'Concejal',
    localidad: 'ALMIRANTE BROWN',
    foto: 'img/foto8.jpg'
  },
  
];

const consejeros = [
    {
    nombre: 'Jorge Gangi',
    rol: 'Consejero escolar',
    localidad: 'ALMIRANTE BROWN',
    foto: 'img/foto9.jpeg'
  },
  {
    nombre: 'Yanina Niczyporuk',
    rol: 'Consejera escolar',
    localidad: 'ALMIRANTE BROWN',
    foto: 'img/foto10.jpeg'
  },
  {
    nombre: 'Silvina Barreiro',
    rol: 'Consejera escolar',
    localidad: 'ALMIRANTE BROWN',
    foto: 'img/foto11.jpeg',
    estilo: 'object-position: center top;'
  },
  {
    nombre: 'Juan Jose Cardenas',
    rol: 'Consejero escolar',
    localidad: 'ALMIRANTE BROWN',
    foto: 'img/foto12.jpeg'
  },
];

const carouselItems = [
  { img: 'img/PedroAquino.jpg.jpg' },
  { img: 'img/a1.jpg' },
  { img: 'img/a5.jpg' },
  { img: 'img/a6.jpg' },
  { img: 'img/a7.jpg' },
  { img: 'img/a8.jpg' }, 
  { img: 'img/a10.jpg' },
  { img: 'img/vecinos2.jpeg' },
  { img: 'img/vecinos3.jpeg' },
  { img: 'img/vecinos4.jpeg' },
  { img: 'img/vecinos5.jpeg' },
  { img: 'img/vecinos6.jpeg' },
  { img: 'img/vecinos7.jpeg' },
  { img: 'img/vecinos8.jpeg' }, 
  { img: 'img/foto13.jpeg' },
  { img: 'img/foto14.jpeg' },
  { img: 'img/foto16.jpeg' }, 
  { img: 'img/foto17.jpeg' },
  { img: 'img/foto18.jpeg' },
];

/* ─────────────────────────────────────────
   HEADER – scroll y burger
───────────────────────────────────────── */
(function initHeader() {
  const header = document.getElementById('header');
  const burger  = document.getElementById('burger');
  const nav     = document.getElementById('nav');

  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

burger.addEventListener('click', () => {
  burger.classList.toggle('active');
  nav.classList.toggle('active');
  document.body.style.overflow = nav.classList.contains('active') ? 'hidden' : '';
});

  nav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
     burger.classList.remove('active');
nav.classList.remove('active');
      document.body.style.overflow = '';
    });
  });
})();

/* ─────────────────────────────────────────
   CAROUSEL
───────────────────────────────────────── */
(function initCarousel() {
  const track  = document.getElementById('carouselTrack');
  const dots   = document.getElementById('carouselDots');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  let current  = 0;
  const visibleCount = () => window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : 3;

  // Render cards
  carouselItems.forEach((item, i) => {
    const card = document.createElement('div');
    card.className = 'carousel-card';
    card.innerHTML = `
  <img src="${item.img}" class="card-img" alt="">
`;
    // Lightbox al hacer click
card.addEventListener('click', () => {
  currentIndex = i;
  openLightbox(item.img);
});
    track.appendChild(card);
  });

  // Dots
  carouselItems.forEach((_, i) => {
    const d = document.createElement('div');
    d.className = 'dot' + (i === 0 ? ' active' : '');
    d.addEventListener('click', () => goTo(i));
    dots.appendChild(d);
  });

  function updateDots() {
    dots.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i === current));
  }

function goTo(idx) {
  const total = carouselItems.length;

  if (idx < 0) {
    current = total - visibleCount();
  } else if (idx >= total - visibleCount() + 1) {
    current = 0;
  } else {
    current = idx;
  }
  [...track.children].forEach((card, i) => {
  card.classList.toggle('active', i === current);
});
    const gap = 20;
    const cardW = track.children[0]?.offsetWidth || 0;
    track.style.transform = `translateX(-${current * (cardW + gap)}px)`;
    updateDots();
  }

  prevBtn.addEventListener('click', () => goTo(current - 1));
  nextBtn.addEventListener('click', () => goTo(current + 1));
  window.addEventListener('resize', () => goTo(current));

  // Auto-play
 let autoPlay = setInterval(nextSlide, 4500);

function nextSlide() {
  const total = carouselItems.length - visibleCount();
  goTo(current >= total ? 0 : current + 1);
}

track.addEventListener('mouseenter', () => clearInterval(autoPlay));
track.addEventListener('mouseleave', () => {
  autoPlay = setInterval(nextSlide, 3000);
});
})();

/* ─────────────────────────────────────────
   MAPA INTERACTIVO
───────────────────────────────────────── */
(function initMapa() {
  const panelIdle  = document.getElementById('panelIdle');
  const panelInfo  = document.getElementById('panelInfo');
  const panelNombre = document.getElementById('panelNombre');
  const panelWaBtn  = document.getElementById('panelWaBtn');
  const panelReset  = document.getElementById('panelReset');
  const listado     = document.getElementById('listadoLocalidades');

  // Construir listado lateral
  localidades.forEach(loc => {
    const item = document.createElement('div');
    item.className = 'lista-item';
    item.textContent = loc.nombre;
    item.addEventListener('click', () => selectLocalidad(loc.nombre, loc.wa));
    listado.appendChild(item);
  });

  // Click en zonas SVG
  document.querySelectorAll('.localidad').forEach(g => {
    g.addEventListener('click', () => {
      const nombre = g.dataset.nombre;
      const wa     = g.dataset.wa;
      selectLocalidad(nombre, wa);
    });
  });

  panelReset.addEventListener('click', resetPanel);

  function selectLocalidad(nombre, wa) {
    // Resetear activos
    document.querySelectorAll('.localidad').forEach(g => g.classList.remove('active'));
    // Activar la zona clickeada
    const target = document.querySelector(`.localidad[data-nombre="${nombre}"]`);
    if (target) target.classList.add('active');

    panelNombre.textContent = nombre;
    panelWaBtn.href = wa;
    panelIdle.style.display = 'none';
    panelInfo.style.display  = 'block';
    panelInfo.style.opacity = 0;
panelInfo.style.transform = 'translateY(10px)';

setTimeout(() => {
  panelInfo.style.opacity = 1;
  panelInfo.style.transform = 'translateY(0)';
}, 50);
  }

  function resetPanel() {
    document.querySelectorAll('.localidad').forEach(g => g.classList.remove('active'));
    panelInfo.style.display  = 'none';
    panelIdle.style.display  = 'block';
  }
})();

/* ─────────────────────────────────────────
   EQUIPO
───────────────────────────────────────── */
(function initEquipo() {
  const grid  = document.getElementById('equipoGrid');
  const tabs  = document.querySelectorAll('.tab-btn');
  let current = 'concejales';

  function renderGrid(tipo) {
    const data = tipo === 'concejales' ? concejales : consejeros;
    grid.innerHTML = '';
    data.forEach((m, i) => {
      const card = document.createElement('div');
      card.className = 'miembro-card reveal';
      card.style.transitionDelay = `${i * 60}ms`;
      card.innerHTML = `
 <div class="miembro-avatar">
  <img src="${m.foto}" alt="${m.nombre}" style="${m.estilo || ''}">
</div>
        <div class="miembro-info">
          <div class="miembro-nombre">${m.nombre}</div>
          <div class="miembro-rol">${m.rol}</div>
          <div class="miembro-loc">${m.localidad}</div>
        </div>
      `;
      grid.appendChild(card);
    });
    // Trigger reveal
    requestAnimationFrame(() => {
      grid.querySelectorAll('.reveal').forEach(el => {
        observer.observe(el);
      });
    });
  }

  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      current = btn.dataset.tab;
      renderGrid(current);
    });
  });

  renderGrid('concejales');
})();

/* ─────────────────────────────────────────
   FORMULARIO CONTACTO
───────────────────────────────────────── */
(function initForm() {
const form = document.querySelector('.contacto-form');
  const success = document.getElementById('formSuccess');

  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('.form-submit');
    btn.disabled = true;
    btn.innerHTML = '<span>Enviando...</span>';

    setTimeout(() => {
      form.reset();
      success.style.display = 'block';
      btn.disabled = false;
      btn.innerHTML = `
        <span>Enviar mensaje</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      `;
      setTimeout(() => { success.style.display = 'none'; }, 5000);
    }, 1200);
  });
})();

/* ─────────────────────────────────────────
   LIGHTBOX
───────────────────────────────────────── */
function openLightbox(src) {
  const lb  = document.getElementById('lightbox');
  const img = document.getElementById('lightboxImg');

  zoom = 1; // 🔥 resetea zoom
  img.style.transform = 'scale(1)';

  img.src = src;

  lb.classList.add('open');
  document.body.style.overflow = 'hidden';
}


(function initLightbox() {
  const lb    = document.getElementById('lightbox');
  const close = document.getElementById('lightboxClose');

  function closeLightbox() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
  }

  close.addEventListener('click', closeLightbox);
  lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });
})();

/* ─────────────────────────────────────────
   SCROLL REVEAL
───────────────────────────────────────── */
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.section-header, .quote-inner, .contacto-item, .mapa-container, .mapa-panel, .contacto-form, .footer-brand, .footer-links, .footer-social').forEach(el => {
  el.classList.add('reveal');
  observer.observe(el);
});

/* ─────────────────────────────────────────
   ACTIVE NAV LINK (scroll spy)
───────────────────────────────────────── */
(function initScrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(a => {
         navLinks.forEach(a => a.classList.remove('active'));

const activeLink = document.querySelector(`.nav-link[href="#${entry.target.id}"]`);
if (activeLink) activeLink.classList.add('active');
        });
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(s => io.observe(s));
})();
document.querySelector('.lightbox-next').addEventListener('click', () => {
  currentIndex = (currentIndex + 1) % carouselItems.length;
  openLightbox(carouselItems[currentIndex].img);
});

document.querySelector('.lightbox-prev').addEventListener('click', () => {
  currentIndex = (currentIndex - 1 + carouselItems.length) % carouselItems.length;
  openLightbox(carouselItems[currentIndex].img);
});
let startX = 0;

const lightbox = document.getElementById('lightbox');

lightbox.addEventListener('touchstart', (e) => {
  startX = e.touches[0].clientX;
});

lightbox.addEventListener('touchend', (e) => {
  let endX = e.changedTouches[0].clientX;

  if (startX - endX > 50) {
    // swipe izquierda → siguiente
    currentIndex = (currentIndex + 1) % carouselItems.length;
    openLightbox(carouselItems[currentIndex].img);
  }

  if (endX - startX > 50) {
    // swipe derecha → anterior
    currentIndex = (currentIndex - 1 + carouselItems.length) % carouselItems.length;
    openLightbox(carouselItems[currentIndex].img);
  }
});
let mouseStartX = 0;

lightbox.addEventListener('mousedown', (e) => {
  mouseStartX = e.clientX;
});

lightbox.addEventListener('mouseup', (e) => {
  let mouseEndX = e.clientX;

  if (mouseStartX - mouseEndX > 50) {
    currentIndex = (currentIndex + 1) % carouselItems.length;
    openLightbox(carouselItems[currentIndex].img);
  }

  if (mouseEndX - mouseStartX > 50) {
    currentIndex = (currentIndex - 1 + carouselItems.length) % carouselItems.length;
    openLightbox(carouselItems[currentIndex].img);
  }
});
let zoom = 1;

const lightboxImg = document.getElementById('lightboxImg');

lightboxImg.addEventListener('wheel', (e) => {
  e.preventDefault();

  zoom += e.deltaY * -0.001;
  zoom = Math.min(Math.max(1, zoom), 3);

  lightboxImg.style.transform = `scale(${zoom})`;
});