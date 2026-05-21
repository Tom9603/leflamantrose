/* ==========================================================================
   Le Flamant Rose — Scripts
   ========================================================================== */


/* Header scroll state
   ========================================================================== */
const header = document.getElementById('header');

window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
});


/* Mobile navigation
   ========================================================================== */
const burger = document.getElementById('burger');
const nav = document.getElementById('nav');

burger.addEventListener('click', () => {
  burger.classList.toggle('active');
  nav.classList.toggle('open');
});

/* Close mobile nav when a link is clicked */
nav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    burger.classList.remove('active');
    nav.classList.remove('open');
  });
});


/* Scroll reveal animations
   ========================================================================== */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.15,
  rootMargin: '0px 0px -80px 0px'
});

document.querySelectorAll('.reveal').forEach(el => {
  revealObserver.observe(el);
});


/* Back to top
   ========================================================================== */
const backToTop = document.getElementById('backToTop');
window.addEventListener('scroll', () => {
  backToTop.classList.toggle('visible', window.scrollY > 400);
}, { passive: true });
backToTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});


/* Gallery — dynamic from gallery.json + categories.json
   ========================================================================== */
const galleryGrid = document.querySelector('.gallery-grid');
const filterBtns  = document.querySelectorAll('.filter-btn');
let allItems  = [];
let catLabels = {};
const GALLERY_LIMIT = 4;

const PLACEHOLDER = `<div class="gallery-placeholder"><svg width="80" height="80" viewBox="0 0 100 100" fill="none" aria-hidden="true"><path d="M50 20 Q62 18 68 28 Q70 38 60 42 L62 50 Q72 52 75 62 Q72 75 60 78 L52 78 L52 70 Q60 68 62 62 Q60 56 52 56 L52 50 Q54 44 50 40 Q42 35 42 28 Q44 22 50 20 Z" stroke="currentColor" stroke-width="1.5"/></svg></div>`;

const itemObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      itemObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 });

function buildItem(item) {
  const el = document.createElement('div');
  el.className = 'gallery-item' + (item.size === 'tall' ? ' tall' : '') + (item.size === 'wide' ? ' wide' : '');
  el.dataset.cat = item.category;
  const label = catLabels[item.category] || item.category;
  el.innerHTML = `
    ${item.image ? `<img src="${item.image}" alt="${item.title}" class="gallery-img">` : PLACEHOLDER}
    <div class="gallery-item-label">
      <div class="category">${label}</div>
      <div class="title">${item.title}</div>
    </div>`;
  return el;
}

function renderGallery(filter = 'all', showAll = false) {
  galleryGrid.innerHTML = '';

  /* Retire l'éventuel bouton voir plus existant */
  const existing = document.querySelector('.gallery-more-btn');
  if (existing) existing.remove();

  const list = filter === 'all' ? allItems : allItems.filter(i => i.category === filter);
  const visible = showAll ? list : list.slice(0, GALLERY_LIMIT);

  visible.forEach((item, idx) => {
    const el = buildItem(item);
    galleryGrid.appendChild(el);
    setTimeout(() => itemObserver.observe(el), idx * 40);
  });

  /* Bouton voir plus / réduire */
  if (list.length > GALLERY_LIMIT) {
    const btn = document.createElement('button');
    btn.className = 'gallery-more-btn';

    if (showAll) {
      btn.textContent = 'Réduire ↑';
      btn.addEventListener('click', () => {
        renderGallery(filter, false);
        document.getElementById('gallery').scrollIntoView({ behavior: 'smooth' });
      });
    } else {
      btn.textContent = `Voir plus — ${list.length - GALLERY_LIMIT} photos`;
      btn.addEventListener('click', () => renderGallery(filter, true));
    }

    galleryGrid.insertAdjacentElement('afterend', btn);
  }
}

Promise.all([
  fetch('gallery.json').then(r => r.json()),
  fetch('categories.json').then(r => r.json()).catch(() => ({}))
])
  .then(([galleryData, cats]) => {
    catLabels = cats;

    /* Met à jour les labels des boutons filtres */
    filterBtns.forEach(btn => {
      const f = btn.dataset.filter;
      if (f !== 'all' && cats[f]) btn.textContent = cats[f];
    });

    allItems = galleryData.items || [];
    renderGallery();

    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderGallery(btn.dataset.filter);
      });
    });
  })
  .catch(() => {
    galleryGrid.innerHTML = '<p style="padding:2rem;color:var(--ink-soft)">Galerie en cours de préparation.</p>';
  });


/* Specialty cards → gallery filter
   ========================================================================== */
document.querySelectorAll('.specialty[data-gallery-filter]').forEach(card => {
  card.addEventListener('click', () => {
    const filter = card.dataset.galleryFilter;
    if (filter === 'contact') {
      document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
    } else {
      const targetBtn = document.querySelector(`.filter-btn[data-filter="${filter}"]`);
      if (targetBtn) targetBtn.click();
      document.getElementById('gallery').scrollIntoView({ behavior: 'smooth' });
    }
  });
});


/* Contact form — Netlify AJAX
   ========================================================================== */
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', e => {
    e.preventDefault();
    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(new FormData(contactForm)).toString()
    })
    .then(() => {
      contactForm.innerHTML = '<p class="form-success">Merci ! Clémentine vous recontactera très vite. ✦</p>';
    })
    .catch(() => {
      alert('Une erreur est survenue, veuillez réessayer ou appeler directement.');
    });
  });
}


/* About photo — dynamic from about.json
   ========================================================================== */
fetch('about.json')
  .then(r => r.json())
  .then(({ photo }) => {
    if (photo) {
      const visual = document.getElementById('about-visual');
      if (visual) {
        const img = document.createElement('img');
        img.src = photo;
        img.alt = "L'atelier de Clémentine";
        img.className = 'about-photo';
        visual.prepend(img);
      }
    }
  })
  .catch(() => { /* pas de photo, on garde le fond dégradé */ });


/* Netlify Identity — redirect to admin after login
   ========================================================================== */
if (window.netlifyIdentity) {
  window.netlifyIdentity.on('init', user => {
    if (!user) {
      window.netlifyIdentity.on('login', () => {
        document.location.href = '/admin/';
      });
    }
  });
}



