const root = document.documentElement;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (sel) => document.querySelector(sel);

/* ========== TEMA CLARO / ESCURO ========== */
function isDark() {
  return root.dataset.theme
    ? root.dataset.theme === 'dark'
    : matchMedia('(prefers-color-scheme: dark)').matches;
}
function toggleTheme() {
  root.dataset.theme = isDark() ? 'light' : 'dark';
  try { localStorage.setItem('tema', root.dataset.theme); } catch (e) {}
}
function initTheme() {
  $('#theme').onclick = toggleTheme;
}

/* ========== IDIOMA PORTUGUÊS / INGLÊS ========== */
// textos da página: cada elemento traduzível tem o inglês no atributo data-en
// (e data-en-label para o aria-label); o português original é guardado na primeira troca
const META = {
  pt: { title: document.title, desc: $('meta[name="description"]').content },
  en: { title: 'Eduarda | Information Systems', desc: 'Portfolio of Eduarda, Information Systems student. Projects in Java, JavaScript and databases.' },
};
let lang = 'pt';

function setLang(next) {
  lang = next;
  const en = lang === 'en';
  document.querySelectorAll('[data-en]').forEach((el) => {
    if (el.dataset.pt === undefined) el.dataset.pt = el.textContent;
    el.textContent = en ? el.dataset.en : el.dataset.pt;
  });
  document.querySelectorAll('[data-en-label]').forEach((el) => {
    if (el.dataset.ptLabel === undefined) el.dataset.ptLabel = el.getAttribute('aria-label');
    el.setAttribute('aria-label', en ? el.dataset.enLabel : el.dataset.ptLabel);
  });
  root.lang = en ? 'en' : 'pt-BR';
  document.title = META[lang].title;
  $('meta[name="description"]').content = META[lang].desc;

  // o botão mostra o idioma para o qual ele troca
  const btn = $('#lang');
  btn.textContent = en ? 'PT' : 'EN';
  btn.setAttribute('aria-label', en ? 'Ler em português' : 'Read in English');
  btn.lang = en ? 'pt-BR' : 'en';
  try { localStorage.setItem('idioma', lang); } catch (e) {}
}
function initLang() {
  $('#lang').onclick = () => setLang(lang === 'en' ? 'pt' : 'en');
  let saved = null;
  try { saved = localStorage.getItem('idioma'); } catch (e) {}
  if (saved === 'en') setLang('en');
}

/* ========== FORMULÁRIO DE CONTATO ========== */
const FORM_URL = 'https://formspree.io/f/mbgdlgyb';
const FORM_MSG = {
  pt: {
    missing: 'Preencha o e-mail e a mensagem.',
    invalid: 'Esse e-mail parece inválido.',
    sending: 'enviando…',
    sent: '✓ Mensagem enviada! Respondo em até 2 dias.',
    failed: 'Não foi possível enviar. Tente novamente em instantes.',
    offline: 'Erro de conexão. Verifique a internet e tente de novo.',
  },
  en: {
    missing: 'Please fill in your email and message.',
    invalid: 'That email looks invalid.',
    sending: 'sending…',
    sent: "✓ Message sent! I'll reply within 2 days.",
    failed: "Couldn't send it. Please try again in a moment.",
    offline: 'Connection error. Check your internet and try again.',
  },
};

function initContact() {
  const msg = $('#ok');
  const btn = $('#send');
  const say = (key, kind = '') => { msg.textContent = FORM_MSG[lang][key]; msg.className = kind; };

  $('#contact-form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const name = $('#n').value.trim();
    const email = $('#e').value.trim();
    const message = $('#m').value.trim();

    if (!email || !message) return say('missing', 'bad');
    if (!/^\S+@\S+\.\S+$/.test(email)) return say('invalid', 'bad');

    btn.disabled = true;
    say('sending');

    try {
      const res = await fetch(FORM_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });
      if (res.ok) {
        say('sent', 'good');
        ['n', 'e', 'm'].forEach((id) => (document.getElementById(id).value = ''));
      } else {
        say('failed', 'bad');
      }
    } catch (err) {
      say('offline', 'bad');
    }
    btn.disabled = false;
  });
}

/* ========== INÍCIO: CAMPO DE CARACTERES ========== */
function initHeroField() {
  const canvas = $('#hero-canvas');
  const hero = canvas.parentElement;
  const ctx = canvas.getContext('2d');
  const CHARS = '01{}[]<>/\\;:=+*#&%$';
  const CELL = 20;
  const pick = (s) => s[(Math.random() * s.length) | 0];

  let w = 0, h = 0, cols = 0, rows = 0, cells = [], color = '';
  let running = false, raf = 0, lastFrame = 0;

  function readColors() {
    color = getComputedStyle(root).getPropertyValue('--mute').trim();
    if (!running) draw(performance.now());
  }

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = hero.clientWidth; h = hero.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = `500 13px ${getComputedStyle(root).getPropertyValue('--mono')}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    cols = Math.ceil(w / CELL); rows = Math.ceil(h / CELL);
    cells = Array.from({ length: cols * rows }, () => pick(CHARS));
    if (!running) draw(performance.now());
  }

  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = color;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        if (Math.random() < 0.002) cells[i] = pick(CHARS);
        // onda diagonal lenta que atravessa o campo
        const wave = 0.5 + 0.5 * Math.sin(c * 0.18 + r * 0.12 - t / 900);
        const a = 0.05 + wave * wave * 0.22;
        if (a < 0.06) continue;
        ctx.globalAlpha = a;
        ctx.fillText(cells[i], c * CELL + CELL / 2, r * CELL + CELL / 2);
      }
    }
    ctx.globalAlpha = 1;
  }

  function loop(t) {
    raf = requestAnimationFrame(loop);
    if (t - lastFrame < 33) return;    // ~30 fps é suficiente
    lastFrame = t;
    draw(t);
  }
  const start = () => { if (!running && !reduceMotion) { running = true; raf = requestAnimationFrame(loop); } };
  const stop = () => { running = false; cancelAnimationFrame(raf); };

  new ResizeObserver(resize).observe(hero);
  new IntersectionObserver(([en]) => (en.isIntersecting ? start() : stop())).observe(hero);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  new MutationObserver(readColors).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', readColors);

  readColors();
  resize();
  document.fonts?.ready.then(resize);   // redesenha com a fonte mono já carregada
}

/* ========== INÍCIO: NOME "DECODIFICANDO" + PALAVRA DIGITADA ========== */
function initHeroText() {
  const h1 = $('#hero-name');
  const nameEl = h1.querySelector('.name');
  const NAME = nameEl.textContent;
  const GLYPHS = '01<>{}/#*$%';
  let busy = false;

  function scramble(dur = 900) {
    if (reduceMotion || busy) return;
    busy = true;
    const t0 = performance.now();
    (function frame(now) {
      const p = Math.min(1, (now - t0) / dur);
      const fixed = Math.floor(p * NAME.length);
      nameEl.textContent = NAME.slice(0, fixed) + [...NAME.slice(fixed)].map(() => GLYPHS[(Math.random() * GLYPHS.length) | 0]).join('');
      if (p < 1) requestAnimationFrame(frame); else busy = false;
    })(t0);
  }
  scramble(1200);
  h1.addEventListener('pointerenter', () => scramble());

  const wordEl = $('#typed-word');
  const WORDS = ['C', 'Java', 'JavaScript', 'Python', 'SQL'];
  if (reduceMotion) return;
  let wi = 0, len = WORDS[0].length, deleting = false;
  (function step() {
    const word = WORDS[wi];
    if (!deleting && len === word.length) { deleting = true; return setTimeout(step, 1700); }
    if (deleting && len === 0) { deleting = false; wi = (wi + 1) % WORDS.length; return setTimeout(step, 250); }
    len += deleting ? -1 : 1;
    wordEl.textContent = WORDS[wi].slice(0, len);
    setTimeout(step, deleting ? 45 : 95);
  })();
}

/* ========== BARRA DE STATUS + MENU ATIVO ========== */
function initStatusbar() {
  const fileEl = $('#sb-file');
  const posEl = $('#sb-pos');
  const clockEl = $('#sb-clock');
  const navLinks = document.querySelectorAll('.links a');

  const sections = [...document.querySelectorAll('[data-file]')];
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      fileEl.textContent = en.target.dataset.file;
      navLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((s) => obs.observe(s));

  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const pct = max > 0 ? Math.round((scrollY / max) * 100) : 0;
    posEl.textContent = `Ln ${Math.round(scrollY / 24) + 1}, ${pct}%`;
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const tick = () => {
    clockEl.textContent = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }) + ' BRT';
  };
  tick();
  setInterval(tick, 15000);
}

/* ========== INICIAR ========== */
initTheme();
initLang();
initContact();
initHeroField();
initHeroText();
initStatusbar();
