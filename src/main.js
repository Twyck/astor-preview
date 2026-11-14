import '@fontsource-variable/bodoni-moda/opsz.css'
import '@fontsource-variable/bodoni-moda/opsz-italic.css'
import '@fontsource-variable/instrument-sans/index.css'
import 'lenis/dist/lenis.css'
import './styles.css'

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger, SplitText)
ScrollTrigger.config({ ignoreMobileResize: true })

const $ = (s, root = document) => root.querySelector(s)
const $$ = (s, root = document) => [...root.querySelectorAll(s)]
const html = document.documentElement
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

/* --------------------------------------------------------------------------
   Scroll suave (Lenis) sincronizado com o ScrollTrigger
   Desligado quando o usuário pede menos movimento. No touch, o scroll é nativo.
   -------------------------------------------------------------------------- */
let lenis = null
if (!reduceMotion) {
  lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((time) => lenis.raf(time * 1000))
  gsap.ticker.lagSmoothing(0)
}

function scrollToY(y, onDone) {
  if (lenis) lenis.scrollTo(y, { duration: 1.4, onComplete: onDone })
  else {
    window.scrollTo({ top: y, behavior: 'auto' })
    onDone?.()
  }
}

function scrollToEl(el) {
  const y = el.getBoundingClientRect().top + window.scrollY
  scrollToY(y, () => el.focus({ preventScroll: true }))
}

/* --------------------------------------------------------------------------
   Navegação: âncoras, menu mobile, cardápios, estados do header
   -------------------------------------------------------------------------- */
const nav = $('[data-nav]')
const burger = $('[data-burger]')
const mmenu = $('[data-mmenu]')
const dialog = $('[data-menu-dialog]')
let casasNav = null // definido pelo módulo de casas (desktop horizontal)

function openMobileMenu() {
  mmenu.hidden = false
  requestAnimationFrame(() => mmenu.classList.add('is-open'))
  burger.setAttribute('aria-expanded', 'true')
  burger.querySelector('.nav__burger-text').textContent = 'Fechar'
  nav.classList.add('is-open')
  lenis?.stop()
  document.body.style.overflow = 'hidden'
  if (!reduceMotion) {
    gsap.fromTo(
      $$('.mmenu__links li, .mmenu__casas, .mmenu__cta, .mmenu__social', mmenu),
      { y: 36, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: 'expo.out', stagger: 0.06, delay: 0.25 },
    )
  }
  $('a, button', mmenu)?.focus({ preventScroll: true })
}

function closeMobileMenu({ restoreFocus = true } = {}) {
  if (mmenu.hidden) return
  mmenu.classList.remove('is-open')
  burger.setAttribute('aria-expanded', 'false')
  burger.querySelector('.nav__burger-text').textContent = 'Menu'
  nav.classList.remove('is-open')
  document.body.style.overflow = ''
  lenis?.start()
  setTimeout(() => { mmenu.hidden = true }, reduceMotion ? 0 : 800)
  if (restoreFocus) burger.focus({ preventScroll: true })
}

burger.addEventListener('click', () => (mmenu.hidden ? openMobileMenu() : closeMobileMenu()))

// Foco preso dentro do menu mobile enquanto aberto
mmenu.addEventListener('keydown', (e) => {
  if (e.key !== 'Tab') return
  const items = [burger, ...$$('a, button', mmenu)]
  const first = items[0]
  const last = items[items.length - 1]
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
})
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !mmenu.hidden) closeMobileMenu()
})

// Âncoras internas: Lenis + foco no destino (acessibilidade)
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]')
  if (!a) return
  const id = a.getAttribute('href').slice(1)
  const target = id ? document.getElementById(id) : null
  if (!target) return
  e.preventDefault()
  const wasOpen = !mmenu.hidden
  closeMobileMenu({ restoreFocus: false })
  const go = () => {
    if (target.classList.contains('casa')) goToCasa(target)
    else if (id === 'inicio') scrollToY(0, () => $('.nav__brand').focus({ preventScroll: true }))
    else scrollToEl(target)
  }
  wasOpen ? setTimeout(go, 120) : go()
  history.replaceState(null, '', `#${id}`)
})

// Cardápios (diálogo nativo: foco, Esc e inert já tratados pelo navegador)
$$('[data-menu-open]').forEach((btn) =>
  btn.addEventListener('click', () => {
    closeMobileMenu({ restoreFocus: false })
    dialog.showModal()
    lenis?.stop()
  }),
)
$('[data-menu-close]').addEventListener('click', () => dialog.close())
dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close() })
dialog.addEventListener('close', () => lenis?.start())

// Rótulos que rolam no hover dos botões
$$('.btn__label').forEach((label) => {
  const roll = document.createElement('span')
  roll.className = 'btn__roll'
  roll.textContent = label.textContent
  label.textContent = ''
  label.append(roll)
})

// Ano corrente no rodapé
$$('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()) })

// Header: fundo ao rolar, some ao descer, volta ao subir
ScrollTrigger.create({
  start: 0,
  end: 'max',
  onUpdate(self) {
    const y = self.scroll()
    nav.classList.toggle('is-solid', y > 40)
    const busy = nav.contains(document.activeElement) || !mmenu.hidden
    nav.classList.toggle('is-hidden', y > window.innerHeight * 0.7 && self.direction === 1 && !busy)
  },
})
nav.addEventListener('focusin', () => nav.classList.remove('is-hidden'))

// Link ativo conforme a seção visível
const navLinks = $$('[data-nav-link]')
$$('[data-section]').forEach((section) => {
  ScrollTrigger.create({
    trigger: section,
    start: 'top 50%',
    end: 'bottom 50%',
    onToggle(self) {
      if (!self.isActive) return
      const key = section.dataset.section
      navLinks.forEach((l) => {
        if (l.dataset.navLink === key) l.setAttribute('aria-current', 'true')
        else l.removeAttribute('aria-current')
      })
    },
  })
})

// CTA fixo no mobile: aparece depois do hero, some perto das reservas/rodapé
const sticky = $('[data-sticky-cta]')
ScrollTrigger.create({
  trigger: '.hero',
  start: 'bottom 60%',
  endTrigger: '#reservas',
  end: 'top bottom',
  onToggle: (self) => sticky.classList.toggle('is-visible', self.isActive),
})

/* --------------------------------------------------------------------------
   Nossas Casas — navegação até uma casa (horizontal no desktop, nativo no mobile)
   -------------------------------------------------------------------------- */
const casasSection = $('#casas')
const casasViewport = $('[data-casas-viewport]')
const casasTrack = $('[data-casas-track]')
const casaEls = $$('.casa', casasTrack)
const casasCurrent = $('[data-casas-current]')
const casasBar = $('[data-casas-bar]')

function setCasasProgress(index, progress) {
  casasCurrent.textContent = String(index + 1).padStart(2, '0')
  const p = progress ?? index / (casaEls.length - 1)
  casasBar.style.transform = `scaleX(${(1 + p * (casaEls.length - 1)) / casaEls.length})`
}

function goToCasa(casa) {
  if (casasNav) return casasNav(casa)
  const left = casa.offsetLeft - parseFloat(getComputedStyle(casasTrack).paddingLeft)
  scrollToY(casasSection.getBoundingClientRect().top + window.scrollY, () => {
    casasViewport.scrollTo({ left, behavior: reduceMotion ? 'auto' : 'smooth' })
    casa.focus({ preventScroll: true })
  })
}

casasViewport.addEventListener(
  'scroll',
  () => {
    if (casasNav) return
    const max = casasViewport.scrollWidth - casasViewport.clientWidth
    const p = max > 0 ? casasViewport.scrollLeft / max : 0
    setCasasProgress(Math.round(p * (casaEls.length - 1)), p)
  },
  { passive: true },
)

/* --------------------------------------------------------------------------
   Abertura do hero
   -------------------------------------------------------------------------- */
async function intro() {
  if (reduceMotion) { html.classList.remove('js-intro'); return }
  const img = $('.hero__img')
  const imgReady = img.complete
    ? Promise.resolve()
    : new Promise((r) => {
        img.addEventListener('load', r, { once: true })
        img.addEventListener('error', r, { once: true })
      })
  await Promise.race([Promise.all([imgReady, document.fonts?.ready]), wait(1600)])

  const wordmark = SplitText.create('[data-hero-wordmark]', { type: 'chars', charsClass: 'char', aria: 'none' })
  const title = SplitText.create('[data-intro="title"]', { type: 'lines', mask: 'lines', linesClass: 'split-line' })

  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })
  tl.fromTo('[data-hero-media]', { clipPath: 'inset(16% 22% 16% 22%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.9, ease: 'expo.inOut' }, 0)
    .fromTo('.hero__img', { scale: 1.4 }, { scale: 1.06, duration: 2.6 }, 0)
    .from('.hero__shade', { opacity: 0, duration: 1.4, ease: 'power2.out' }, 0.7)
    .from(wordmark.chars, { yPercent: 70, opacity: 0, duration: 1.8, stagger: 0.08 }, 0.95)
    .from('[data-intro="eyebrow"]', { opacity: 0, x: -18, duration: 1.2 }, 1.15)
    .from(title.lines, { yPercent: 108, duration: 1.5, stagger: 0.12 }, 1.2)
    .from('[data-intro="fade"]', { opacity: 0, y: 20, duration: 1.3, stagger: 0.12 }, 1.55)
    .from('.nav', { autoAlpha: 0, duration: 1.4, ease: 'power2.out' }, 1.35)
    .add(() => title.revert())
  html.classList.remove('js-intro')
}

/* --------------------------------------------------------------------------
   Coreografia de scroll (gsap.matchMedia: desktop × mobile × movimento)
   -------------------------------------------------------------------------- */
function lineReveal(el, trigger = el, start = 'top 86%') {
  return SplitText.create(el, {
    type: 'lines',
    mask: 'lines',
    linesClass: 'split-line',
    autoSplit: true,
    onSplit: (self) =>
      gsap.from(self.lines, {
        yPercent: 108,
        duration: 1.4,
        ease: 'expo.out',
        stagger: 0.1,
        scrollTrigger: { trigger, start, once: true },
      }),
  })
}

function choreography() {
  const mm = gsap.matchMedia()

  mm.add(
    {
      desktop: '(min-width: 1024px)',
      mobile: '(max-width: 1023px)',
      motion: '(prefers-reduced-motion: no-preference)',
    },
    (ctx) => {
      const { desktop, motion } = ctx.conditions
      if (!motion) return

      /* ---- 01 Hero: a cena recua enquanto o marfim sobe ---- */
      gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } })
        .to('.hero__img', { yPercent: 16, ease: 'none' }, 0)
        .to('.hero__inner', { yPercent: -22, opacity: 0, ease: 'none' }, 0)
        .to('[data-hero-wordmark]', { letterSpacing: '0.2em', opacity: 0, ease: 'none' }, 0)

      /* ---- 03 Gastronomia: o prato gira, assenta e domina a cena ---- */
      const plate = $('[data-gastro-plate]')
      const gCopy = $('[data-gastro-copy]')
      if (desktop) {
        gsap.set(plate, { yPercent: -50 })
        gsap.set(gCopy, { yPercent: -50 })
        const gTitle = SplitText.create($('h2', gCopy), { type: 'lines', mask: 'lines', linesClass: 'split-line' })
        const tl = gsap.timeline({
          scrollTrigger: { trigger: '[data-gastro]', start: 'top top', end: '+=190%', pin: true, scrub: 0.8, refreshPriority: 4 },
        })
        tl.fromTo(plate, { scale: 1.22, xPercent: -14, yPercent: -40, rotate: -12 }, { scale: 1, xPercent: 0, yPercent: -50, rotate: 0, ease: 'none', duration: 1 }, 0)
          .from($('.eyebrow', gCopy), { opacity: 0, x: -20, duration: 0.25 }, 0.35)
          .from(gTitle.lines, { yPercent: 108, duration: 0.4, stagger: 0.08 }, 0.4)
          .from($$('[data-reveal]', gCopy), { opacity: 0, y: 30, duration: 0.3, stagger: 0.08 }, 0.6)
          .from('[data-gastro-caption]', { opacity: 0, x: -16, duration: 0.25 }, 0.8)
          .to(plate, { xPercent: -6, yPercent: -56, scale: 0.94, rotate: 4, ease: 'none', duration: 0.7 }, 1.15)
          .to(gCopy, { yPercent: -60, opacity: 0.35, ease: 'none', duration: 0.7 }, 1.15)
      } else {
        gsap.fromTo(plate, { scale: 1.18, rotate: -8 }, {
          scale: 1, rotate: 0, ease: 'none',
          scrollTrigger: { trigger: plate, start: 'top bottom', end: 'center 45%', scrub: true },
        })
      }

      /* ---- 04 Coquetelaria: o copo cresce, desliza e se dissolve no bar ---- */
      const stage = $('[data-cock]')
      const glass = $('[data-cock-glass]')
      const word = $('[data-cock-word]')
      const cCopy = $('[data-cock-copy]')
      const scene = $('[data-cock-scene]')
      if (desktop) {
        gsap.set(glass, { xPercent: -50, yPercent: -50 })
        gsap.set([cCopy, word], { yPercent: -50 })
        const cTitle = SplitText.create($('h2', cCopy), { type: 'lines', mask: 'lines', linesClass: 'split-line' })
        const tl = gsap.timeline({
          scrollTrigger: { trigger: stage, start: 'top top', end: '+=280%', pin: true, scrub: 0.8, refreshPriority: 3 },
        })
        tl.fromTo(glass, { scale: 0.58, yPercent: -36 }, { scale: 1, yPercent: -50, ease: 'none', duration: 1 }, 0)
          .fromTo(stage, { '--glow': 0.15 }, { '--glow': 1, ease: 'none', duration: 1 }, 0)
          .fromTo(word, { xPercent: 8 }, { xPercent: -42, ease: 'none', duration: 3.6 }, 0)
          .to(glass, { x: () => window.innerWidth * 0.2, ease: 'none', duration: 0.8 }, 1)
          // o texto só entra depois que o copo terminou de abrir espaço à esquerda
          .from($('.eyebrow', cCopy), { opacity: 0, x: -20, duration: 0.25 }, 1.75)
          .from(cTitle.lines, { yPercent: 108, duration: 0.4, stagger: 0.08 }, 1.8)
          .from($$('[data-reveal]', cCopy), { opacity: 0, y: 30, duration: 0.3, stagger: 0.08 }, 2)
          .from($('.caption', glass), { opacity: 0, duration: 0.3 }, 2.05)
          .fromTo(scene, { clipPath: 'circle(0% at 70% 50%)' }, { clipPath: 'circle(80% at 50% 50%)', ease: 'none', duration: 1 }, 2.6)
          .fromTo($('img', scene), { scale: 1.3 }, { scale: 1, ease: 'none', duration: 1.1 }, 2.6)
          // quando o bar cobre a tela, o texto anterior sai (a nota nunca fica sobre ele)
          .to(cCopy, { autoAlpha: 0, duration: 0.2 }, 3.25)
          .from('[data-cock-note]', { opacity: 0, y: 30, duration: 0.3 }, 3.35)
      } else {
        gsap.fromTo(glass, { scale: 0.82 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: glass, start: 'top bottom', end: 'center center', scrub: true } })
        gsap.fromTo(word, { xPercent: 0 }, { xPercent: -40, ease: 'none', scrollTrigger: { trigger: stage, start: 'top bottom', end: 'bottom top', scrub: true } })
        gsap.fromTo(scene, { clipPath: 'inset(14% 8% 14% 8%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: { trigger: scene, start: 'top bottom', end: 'center center', scrub: true } })
        gsap.fromTo($('img', scene), { scale: 1.25 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: scene, start: 'top bottom', end: 'center center', scrub: true } })
      }

      /* ---- 05 Experiência: a janela se abre até virar o salão inteiro ---- */
      const frame = $('[data-exp-frame]')
      const lineA = $('[data-exp-a]')
      const lineB = $('[data-exp-b]')
      gsap.from([lineA, lineB], {
        yPercent: 40, opacity: 0, duration: 1.4, ease: 'expo.out', stagger: 0.12,
        scrollTrigger: { trigger: '[data-exp]', start: 'top 65%', once: true },
      })
      if (desktop) {
        gsap.timeline({ scrollTrigger: { trigger: '[data-exp]', start: 'top top', end: '+=170%', pin: true, scrub: 0.8, refreshPriority: 2 } })
          .fromTo(frame, { clipPath: 'inset(23% 31% 23% 31%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', duration: 1 }, 0)
          .fromTo($('img', frame), { scale: 1.3 }, { scale: 1, ease: 'none', duration: 1 }, 0)
          .to(lineA, { x: () => -window.innerWidth * 0.18, opacity: 0, ease: 'none', duration: 0.7 }, 0.15)
          .to(lineB, { x: () => window.innerWidth * 0.18, opacity: 0, ease: 'none', duration: 0.7 }, 0.15)
          .to({}, { duration: 0.35 })
      } else {
        gsap.timeline({ scrollTrigger: { trigger: '[data-exp]', start: 'top 75%', end: 'bottom 70%', scrub: true } })
          .fromTo(frame, { clipPath: 'inset(22% 7% 22% 7%)' }, { clipPath: 'inset(15% 0% 15% 0%)', ease: 'none' }, 0)
          .fromTo($('img', frame), { scale: 1.3 }, { scale: 1, ease: 'none' }, 0)
      }

      /* ---- 06 Nossas Casas: galeria horizontal guiada pelo scroll vertical ---- */
      if (desktop) {
        casasSection.classList.add('is-horizontal')
        const pinEl = $('[data-casas]')
        const distance = () => Math.max(0, casasTrack.scrollWidth - casasViewport.clientWidth)
        const tween = gsap.to(casasTrack, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: pinEl,
            start: 'top top',
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
            refreshPriority: 1,
            onUpdate: (self) => setCasasProgress(Math.round(self.progress * (casaEls.length - 1)), self.progress),
          },
        })
        casaEls.forEach((casa) => {
          gsap.fromTo($('img', casa), { xPercent: -5 }, {
            xPercent: 5, ease: 'none',
            scrollTrigger: { trigger: casa, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true },
          })
        })
        // Navegar até uma casa = rolar até o ponto correspondente do pin
        casasNav = (casa) => {
          const st = tween.scrollTrigger
          const x = casa.offsetLeft - parseFloat(getComputedStyle(casasTrack).paddingLeft)
          const p = Math.min(1, Math.max(0, x / (distance() || 1)))
          scrollToY(st.start + p * (st.end - st.start), () => casa.focus({ preventScroll: true }))
        }
        // Teclado: ao focar um link dentro de uma casa, traz a casa para a tela
        const onFocus = (e) => {
          const casa = e.target.closest('.casa')
          if (casa && e.target !== casa) {
            const r = casa.getBoundingClientRect()
            if (r.left < 0 || r.right > window.innerWidth) casasNav(casa)
          }
        }
        casasTrack.addEventListener('focusin', onFocus)
        return () => {
          casasSection.classList.remove('is-horizontal')
          casasTrack.removeEventListener('focusin', onFocus)
          casasNav = null
        }
      }
    },
  )

  // Efeitos que não dependem do layout (rodam em qualquer largura, com movimento)
  mm.add(
    { desktop: '(min-width: 1024px)', motion: '(prefers-reduced-motion: no-preference)' },
    (ctx) => {
      const { desktop, motion } = ctx.conditions
      if (!motion) return
      const pinnedScopes = desktop ? ['.gastro__stage', '.cock__stage'] : []
      const inPinned = (el) => pinnedScopes.some((s) => el.closest(s))

      /* Títulos: linhas sobem de dentro de uma máscara */
      $$('[data-split]').filter((el) => !inPinned(el)).forEach((el) => lineReveal(el))

      /* Textos de apoio */
      $$('[data-reveal]').filter((el) => !inPinned(el)).forEach((el) => {
        gsap.from(el, { y: 26, opacity: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } })
      })

      /* Manifesto: as palavras acendem conforme a leitura */
      const manifesto = $('[data-scrub-words]')
      const words = SplitText.create(manifesto, { type: 'words', wordsClass: 'word' })
      gsap.fromTo(words.words, { opacity: 0.14 }, {
        opacity: 1, ease: 'none', stagger: 0.08,
        scrollTrigger: { trigger: manifesto, start: 'top 80%', end: 'bottom 50%', scrub: true },
      })

      /* Fotos que se revelam por máscara */
      $$('[data-clip-reveal]').forEach((frame) => {
        const tl = gsap.timeline({ scrollTrigger: { trigger: frame, start: 'top 88%', once: true } })
        tl.fromTo(frame, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'expo.inOut' }, 0)
          .fromTo($('img', frame), { scale: 1.3 }, { scale: 1, duration: 2, ease: 'expo.out' }, 0.1)
      })

      /* Parallax em camadas (velocidades diferentes = profundidade) */
      $$('[data-parallax]').forEach((el) => {
        const v = parseFloat(el.dataset.parallax) * (desktop ? 1 : 0.5)
        gsap.fromTo(el, { yPercent: v }, {
          yPercent: -v, ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
        })
      })

      /* Transição de cena: Nossas Casas e Reservas entram como uma janela que se abre */
      gsap.fromTo('.casas', { clipPath: 'inset(5% 3% 0% 3% round 28px)' }, {
        clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none',
        scrollTrigger: { trigger: '.casas', start: 'top bottom', end: 'top 15%', scrub: true },
      })
      gsap.fromTo('[data-res-media]', { clipPath: 'inset(8% 5% 8% 5% round 24px)' }, {
        clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none',
        scrollTrigger: { trigger: '.res', start: 'top bottom', end: 'top top', scrub: true },
      })
      gsap.fromTo('[data-res-media] img', { scale: 1.22, yPercent: -5 }, {
        scale: 1, yPercent: 5, ease: 'none',
        scrollTrigger: { trigger: '.res', start: 'top bottom', end: 'bottom top', scrub: true },
      })

      /* Rodapé: a assinatura sobe letra a letra */
      const foot = SplitText.create('[data-foot-wordmark]', { type: 'chars', charsClass: 'char', aria: 'none' })
      gsap.from(foot.chars, {
        yPercent: 70, opacity: 0, duration: 1.6, ease: 'expo.out', stagger: 0.07,
        scrollTrigger: { trigger: '.foot', start: 'top 70%', once: true },
      })

      /* Lista de experiências: imagem que acompanha o cursor (desktop com mouse) */
      if (desktop && window.matchMedia('(hover: hover)').matches) {
        const list = $('[data-exp-list]')
        const cursor = $('[data-exp-cursor]')
        const img = document.createElement('img')
        img.alt = ''
        cursor.append(img)
        const xTo = gsap.quickTo(cursor, 'x', { duration: 0.6, ease: 'power3' })
        const yTo = gsap.quickTo(cursor, 'y', { duration: 0.6, ease: 'power3' })
        const rTo = gsap.quickTo(cursor, 'rotate', { duration: 0.8, ease: 'power3' })
        let lastX = 0
        const thumbs = $$('.exp__thumb', list)
        const onEnterList = () => thumbs.forEach((t) => { t.loading = 'eager' })
        const onMove = (e) => {
          xTo(e.clientX); yTo(e.clientY)
          rTo(gsap.utils.clamp(-8, 8, (e.clientX - lastX) * 0.6))
          lastX = e.clientX
        }
        const onOver = (e) => {
          const item = e.target.closest('.exp__item')
          if (!item) return
          const t = $('.exp__thumb', item)
          const src = t.currentSrc || t.src
          if (img.src !== src) img.src = src
          gsap.to(cursor, { opacity: 1, scale: 1, duration: 0.5, ease: 'expo.out' })
        }
        const onLeave = () => gsap.to(cursor, { opacity: 0, scale: 0.86, duration: 0.4, ease: 'power2.out' })
        gsap.set(cursor, { xPercent: -50, yPercent: -50 })
        list.addEventListener('pointerenter', onEnterList, { once: true })
        list.addEventListener('pointermove', onMove)
        list.addEventListener('pointerover', onOver)
        list.addEventListener('pointerleave', onLeave)
        return () => {
          list.removeEventListener('pointermove', onMove)
          list.removeEventListener('pointerover', onOver)
          list.removeEventListener('pointerleave', onLeave)
          img.remove()
        }
      }
    },
  )
}

/* -------------------------------------------------------------------------- */
intro()
choreography()
document.fonts?.ready.then(() => ScrollTrigger.refresh())
window.addEventListener('load', () => {
  ScrollTrigger.refresh()
  // Entrada direta por âncora (ex.: /#reservas)
  const id = location.hash.slice(1)
  const target = id && document.getElementById(id)
  if (target && id !== 'inicio') {
    target.classList.contains('casa') ? goToCasa(target) : scrollToEl(target)
  }
})
