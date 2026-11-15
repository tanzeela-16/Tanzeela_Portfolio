import './styles.css';

const root = document.documentElement;
const canvas = document.querySelector('.particle-canvas');
const context = canvas.getContext('2d');
const heroName = document.querySelector('.hero-name');
const aura = document.querySelector('.pointer-aura');
const nameText = 'Tanzeela Memon';
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function buildName() {
  let index = 0;
  heroName.innerHTML = nameText.split(' ').map((word, wordIndex) => {
    const lettersMarkup = [...word].map((character) => {
      const markup = `<span class="name-letter" role="button" tabindex="0" aria-label="Letter ${character}" data-index="${index}">${character}</span>`;
      index += 1;
      return markup;
    }).join('');
    const spacer = wordIndex < nameText.split(' ').length - 1 ? '<span class="name-space" aria-hidden="true">&nbsp;</span>' : '';
    return `<span class="name-word">${lettersMarkup}</span>${spacer}`;
  }).join('');
}

buildName();

const consoleTyping = document.querySelector('.console-typing');
const consolePhrases = ['deploy --safe', 'rag.index()', 'api.health()', 'ship --clean'];
let consolePhraseIndex = 0;
let consoleCharacterIndex = consolePhrases[0].length;
let consoleDeleting = true;

function animateConsole() {
  if (!consoleTyping || prefersReducedMotion.matches) return;
  const phrase = consolePhrases[consolePhraseIndex];
  if (consoleDeleting) {
    consoleCharacterIndex -= 1;
    consoleTyping.textContent = phrase.slice(0, consoleCharacterIndex);
    if (consoleCharacterIndex === 0) {
      consoleDeleting = false;
      consolePhraseIndex = (consolePhraseIndex + 1) % consolePhrases.length;
    }
  } else {
    const nextPhrase = consolePhrases[consolePhraseIndex];
    consoleCharacterIndex += 1;
    consoleTyping.textContent = nextPhrase.slice(0, consoleCharacterIndex);
    if (consoleCharacterIndex === nextPhrase.length) consoleDeleting = true;
  }
  window.setTimeout(animateConsole, consoleDeleting ? 68 : 105);
}

window.setTimeout(animateConsole, 1500);
const letters = [...document.querySelectorAll('.name-letter')];
let activeLetter = null;

function setActiveLetter(letter) {
  if (activeLetter === letter) return;
  letters.forEach((item) => item.classList.toggle('is-active', item === letter));
  activeLetter = letter;
}

function clearActiveLetter() {
  letters.forEach((letter) => letter.classList.remove('is-active'));
  activeLetter = null;
}

letters.forEach((letter) => {
  letter.addEventListener('pointerenter', () => setActiveLetter(letter));
  letter.addEventListener('focus', () => setActiveLetter(letter));
  letter.addEventListener('click', () => setActiveLetter(activeLetter === letter ? null : letter));
  letter.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setActiveLetter(activeLetter === letter ? null : letter);
    }
  });
});

heroName.addEventListener('pointerleave', clearActiveLetter);
heroName.addEventListener('focusout', (event) => {
  if (!heroName.contains(event.relatedTarget)) clearActiveLetter();
});

const projectCards = [...document.querySelectorAll('.work-card[data-project]')];
projectCards.forEach((card) => {
  card.addEventListener('pointermove', (event) => {
    if (prefersReducedMotion.matches || window.innerWidth < 720) return;
    const rect = card.getBoundingClientRect();
    const rotateY = ((event.clientX - rect.left) / rect.width - 0.5) * 7;
    const rotateX = ((event.clientY - rect.top) / rect.height - 0.5) * -7;
    card.style.setProperty('--rotate-x', `${rotateX}deg`);
    card.style.setProperty('--rotate-y', `${rotateY}deg`);
    card.style.setProperty('--spot-x', `${event.clientX - rect.left}px`);
    card.style.setProperty('--spot-y', `${event.clientY - rect.top}px`);
  });
  card.addEventListener('pointerleave', () => {
    card.style.setProperty('--rotate-x', '0deg');
    card.style.setProperty('--rotate-y', '0deg');
  });
});

const particleColors = [[158, 255, 157], [118, 225, 255], [161, 144, 255], [220, 255, 224]];
let particles = [];
let frameId;
let width = 0;
let height = 0;
const pointer = { x: 0, y: 0, targetX: 0, targetY: 0, active: false };

function randomBetween(min, max) { return min + Math.random() * (max - min); }

function createParticles() {
  const count = Math.min(170, Math.max(90, Math.floor((width * height) / 10500)));
  particles = Array.from({ length: count }, (_, index) => {
    const isLeftCluster = Math.random() < 0.74;
    const color = particleColors[index % particleColors.length];
    return { x: isLeftCluster ? randomBetween(width * 0.025, width * 0.68) : randomBetween(width * 0.62, width * 0.98), y: randomBetween(height * 0.08, height * 0.96), radius: randomBetween(0.45, isLeftCluster ? 1.7 : 1.1), alpha: randomBetween(0.2, 0.74), drift: randomBetween(0.2, 1.1), phase: randomBetween(0, Math.PI * 2), color, index };
  });
}

function resizeCanvas() {
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * pixelRatio);
  canvas.height = Math.floor(height * pixelRatio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  pointer.x = pointer.targetX = width * 0.52;
  pointer.y = pointer.targetY = height * 0.5;
  createParticles();
}

function drawParticle(particle, time) {
  const waveX = Math.sin(time * 0.00025 * particle.drift + particle.phase) * 6;
  const waveY = Math.cos(time * 0.00019 * particle.drift + particle.phase) * 5;
  let x = particle.x + waveX;
  let y = particle.y + waveY;
  const dx = x - pointer.x;
  const dy = y - pointer.y;
  const distance = Math.sqrt(dx * dx + dy * dy) || 1;
  const influence = pointer.active ? Math.max(0, 1 - distance / 210) : 0;
  x += (dx / distance) * influence * 24;
  y += (dy / distance) * influence * 24;
  const [red, green, blue] = particle.color;
  context.beginPath();
  context.fillStyle = `rgba(${red}, ${green}, ${blue}, ${particle.alpha * (0.7 + influence * 0.8)})`;
  context.shadowBlur = influence * 14;
  context.shadowColor = `rgba(${red}, ${green}, ${blue}, ${0.75 * influence})`;
  context.arc(x, y, particle.radius + influence * 1.1, 0, Math.PI * 2);
  context.fill();
  context.shadowBlur = 0;
  return { x, y };
}

function renderParticles(time = 0) {
  context.clearRect(0, 0, width, height);
  const visible = particles.map((particle) => drawParticle(particle, prefersReducedMotion.matches ? 0 : time));
  if (!prefersReducedMotion.matches) {
    context.lineWidth = 0.35;
    for (let index = 0; index < visible.length; index += 1) {
      const current = visible[index];
      if (current.x > width * 0.72) continue;
      for (let nextIndex = index + 1; nextIndex < Math.min(index + 16, visible.length); nextIndex += 1) {
        const next = visible[nextIndex];
        const dx = current.x - next.x;
        const dy = current.y - next.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 96) continue;
        context.strokeStyle = `rgba(153, 255, 198, ${(1 - distance / 96) * 0.09})`;
        context.beginPath(); context.moveTo(current.x, current.y); context.lineTo(next.x, next.y); context.stroke();
      }
    }
  }
  if (!prefersReducedMotion.matches) frameId = requestAnimationFrame(renderParticles);
}

function movePointer(event) {
  pointer.targetX = event.clientX;
  pointer.targetY = event.clientY;
  pointer.active = true;
  root.style.setProperty('--pointer-x', `${event.clientX}px`);
  root.style.setProperty('--pointer-y', `${event.clientY}px`);
  aura.style.opacity = '1';
}

function smoothPointer() {
  pointer.x += (pointer.targetX - pointer.x) * 0.08;
  pointer.y += (pointer.targetY - pointer.y) * 0.08;
  if (!prefersReducedMotion.matches) requestAnimationFrame(smoothPointer);
}

window.addEventListener('pointermove', movePointer, { passive: true });
window.addEventListener('pointerleave', () => { pointer.active = false; aura.style.opacity = '0'; });
window.addEventListener('resize', resizeCanvas);
prefersReducedMotion.addEventListener?.('change', () => {
  cancelAnimationFrame(frameId);
  renderParticles();
  if (!prefersReducedMotion.matches) { smoothPointer(); frameId = requestAnimationFrame(renderParticles); }
});

resizeCanvas();
renderParticles();
smoothPointer();
const nav = document.querySelector('.site-nav');
const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 18);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();
