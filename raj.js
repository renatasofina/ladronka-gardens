/* Ladronka Gardens — Koncept B · "Jedna linie": one line is drawn through the page as you scroll
   and closes into an apple at the end. */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = document.documentElement.classList.contains('no-motion');
  const sysReduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  if (hasGsap) { gsap.registerPlugin(ScrollTrigger); ScrollTrigger.config({ ignoreMobileResize: true }); }
  let pref = null; try { pref = localStorage.getItem('lg-motion'); } catch (e) {}

  /* motion opt-in bar for visitors with reduced motion (shared key with concept A) */
  if (sysReduce && pref === null) {
    const bar = document.createElement('div');
    bar.className = 'motion-bar'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Animace');
    bar.innerHTML = '<span>Máte v systému vypnuté animace. Web je součástí konceptu, pohyb zapnete jedním klepnutím.</span><button type="button" class="on">Zapnout animace</button><button type="button" class="x" aria-label="Ponechat vypnuté">✕</button>';
    document.body.appendChild(bar);
    bar.querySelector('.on').onclick = () => { try { localStorage.setItem('lg-motion', 'on'); } catch (e) {} location.reload(); };
    bar.querySelector('.x').onclick = () => { try { localStorage.setItem('lg-motion', 'off'); } catch (e) {} bar.remove(); };
  }

  /* smooth wheel on Windows only (macOS already has native momentum) */
  const isWin = /win/i.test((navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || '');
  let lenis = null;
  if (!reduce && isWin && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    { const set = lenis.setScroll.bind(lenis); lenis.setScroll = v => set(Math.round(v)); }
    if (hasGsap) { lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
    else { const raf = t => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf); }
  }
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href'); const t = id.length > 1 && $(id);
    if (!t) return; e.preventDefault();
    if (lenis) lenis.scrollTo(t, { offset: -70, duration: 1.4 }); else t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }));

  /* header + mobile menu */
  const hdr = $('#hdr');
  const heroEnd = () => { const r = document.querySelector('.reveal'); const sp = r.parentElement.classList.contains('pin-spacer') ? r.parentElement : r; return sp.offsetTop + sp.offsetHeight - 70; };
  const onScroll = () => hdr.classList.toggle('solid', scrollY > heroEnd());
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .2 });
  document.querySelectorAll('.why-card').forEach(c => io.observe(c));
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const burger = $('.burger'), menu = $('#menu');
  burger.addEventListener('click', () => { const open = menu.hidden; menu.hidden = !open; burger.setAttribute('aria-expanded', open); document.documentElement.style.overflow = open ? 'hidden' : ''; });
  $$('a', menu).forEach(a => a.addEventListener('click', () => { menu.hidden = true; burger.setAttribute('aria-expanded', false); document.documentElement.style.overflow = ''; }));

  /* ---------- the line ---------- */
  /* the designer's symbol (apple in a circle) as ONE continuous stroke; raw coords in a 466 px box at (155,134) */
  const SYM = [[300,578],[420,548,510,480,520,380],[528,290,470,215,385,217],[318,219,272,258,276,318],[280,378,318,420,350,435],[336,392,331,330,342,280],[352,238,378,205,410,184],[432,170,458,161,483,157],[572,188,625,272,620,368],[614,488,516,600,388,600],[260,600,158,500,157,368],[156,236,262,133,390,134],[424,134,456,142,483,157]];
  const wrap = $('#linewrap'), svgEl = $('#lineSvg'), path = $('#linePath');
  let L = 0, table = [], SYMR = [];
  const draw = { v: 0 };

  function docPos(el) { const r = el.getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height }; }

  function build() {
    const main = $('main'); const W = main.offsetWidth; const H = main.offsetHeight;
    wrap.style.height = H + 'px'; svgEl.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const mTop = docPos(main).y;
    const P = [];
    const narrow = W < 700;
    const s = docPos($('#lineStart')), grid = docPos($('.why-grid'));
    const why = docPos($('.why')), state = docPos($('.state')), sins = docPos($('.sins')), res = docPos($('.res')), park = docPos($('.park')), con = docPos($('.contact'));
    const Y = o => o.y - mTop;
    const gR = W * (narrow ? .975 : .972);                          // right gutter
    P.push([s.x + s.w * .55, Y(s) + s.h + 12]);                   // leaves from under "Gardens"
    P.push([W * .64, Y(grid) - 34]);                               // through the gap above the tiles
    P.push([gR, Y(grid) + grid.h * .45]);                          // down the right gutter…
    P.push([gR, Y(state) + state.h + 10]);                         // …past the numbers
    P.push([W * .5, Y(sins) - 40]);
    P.push([W * .5, Y(sins) + sins.h + 40]);                     // hidden behind the pinned sins panel
    P.push([W * (narrow ? .96 : .93), Y(res) + res.h * .5]);
    P.push([W * (narrow ? .06 : .1), Y(park) + park.h * .55]);
    // the symbol, scaled into its slot
    const a = docPos($('#appleSlot')); const sc = a.w / 466; const ax = a.x, ay = a.y - mTop;
    const ap = ([x, y]) => [ax + (x - 155) * sc, ay + (y - 134) * sc];
    // reverse the symbol so the line enters at the top of the circle, from inside the page
    const R = [SYM[SYM.length - 1].slice(4, 6)];
    for (let i = SYM.length - 1; i >= 1; i--) { const c = SYM[i], prev = i === 1 ? SYM[0] : SYM[i - 1].slice(4, 6); R.push([c[2], c[3], c[0], c[1], prev[0], prev[1]]); }
    SYMR = R;
    const st = ap(R[0]), nx = ap([R[1][0], R[1][1]]);
    const dx = nx[0] - st[0], dy = nx[1] - st[1], dl = Math.hypot(dx, dy) || 1;
    const gx = W * (narrow ? .9 : .46);
    P.push([gx, Y(con) + 40]);                                  // down the gap between the columns
    P.push([st[0] - dx / dl * 110, st[1] - dy / dl * 110]);     // arrive along the symbol's own tangent: no corner
    P.push(st);
    // Catmull-Rom -> cubic Bézier
    let d = `M${P[0][0].toFixed(1)},${P[0][1].toFixed(1)}`;
    for (let i = 0; i < P.length - 1; i++) {
      const p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || p2;
      const t = .5 / 3;   // standard Catmull-Rom: round, no kinks
      const c1 = [p1[0] + (p2[0] - p0[0]) * t, p1[1] + (p2[1] - p0[1]) * t];
      const c2 = [p2[0] - (p3[0] - p1[0]) * t, p2[1] - (p3[1] - p1[1]) * t];
      let c2b = c2;
      if (i === P.length - 2) c2b = [p2[0] - (p2[0] - p1[0]) * .45, p2[1] - (p2[1] - p1[1]) * .45];   // straight tangent into the symbol
      d += ` C${c1.map(v => v.toFixed(1))} ${c2b.map(v => v.toFixed(1))} ${p2.map(v => v.toFixed(1))}`;
    }
    for (let i = 1; i < SYMR.length; i++) { const c = SYMR[i]; d += ` C${ap([c[0], c[1]])} ${ap([c[2], c[3]])} ${ap([c[4], c[5]])}`; }
    path.setAttribute('d', d);
    // colour: olive on light, golden light over the night garden
    const g = $('#lineGrad'); g.setAttribute('y2', H);
    const f = (con.y - mTop) / H; $('#gs2').setAttribute('offset', f); $('#gs3').setAttribute('offset', f);
    path.setAttribute('stroke-width', W < 700 ? 1.4 : 1.8);
    L = path.getTotalLength();
    table = []; const N = 600;
    for (let i = 0; i <= N; i++) { const p = path.getPointAtLength(L * i / N); table.push(p.y); }
    // normalised length: the dash maths no longer depends on the real length, which changes on every rebuild
    path.setAttribute('pathLength', '1');
    path.style.strokeDasharray = '1 1'; path.style.strokeDashoffset = reduce ? 0 : Math.max(0, 1 - draw.v);
    return mTop;
  }

  let mTop = 0;
  function targetLen() {
    // draw up to the furthest point whose y is above the "pen" (60 % down the viewport)
    const pen = scrollY + innerHeight * .62 - mTop;
    let idx = 0; for (let i = 0; i < table.length; i++) if (table[i] <= pen) idx = i;
    if (scrollY + innerHeight >= document.documentElement.scrollHeight - 4) idx = table.length - 1;
    return idx / (table.length - 1);
  }
  function apply() { path.style.strokeDashoffset = Math.max(0, 1 - draw.v); }

  function setupLine() {
    mTop = build();
    if (reduce) { path.style.strokeDashoffset = 0; return; }
    draw.v = Math.min(draw.v, 1);
    const to = hasGsap ? gsap.quickTo(draw, 'v', { duration: .9, ease: 'power3.out', onUpdate: apply }) : v => { draw.v = v; apply(); };
    const upd = () => to(targetLen());
    window.__lineUpd = upd; upd();
  }
  addEventListener('scroll', () => window.__lineUpd && window.__lineUpd(), { passive: true });

  /* ---------- GSAP choreography ---------- */
  if (!reduce && hasGsap) {
    /* HERO · branches and logo part to the sides, the residence comes closer and sharpens, the claim appears */
    const vw = () => innerWidth / 100;
    const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: '.reveal', start: 'top top', end: () => '+=' + innerHeight * 1.6, pin: true, anticipatePin: 1, scrub: .9, invalidateOnRefresh: true } });
    const ni = { immediateRender: false };
    tl.fromTo('.branch.l', { x: 0, scale: 1 }, { x: () => -62 * vw(), scale: 1.12, duration: .8, ...ni }, 0)
      .fromTo('.branch.r', { x: 0, scale: 1 }, { x: () => 62 * vw(), scale: 1.12, duration: .8, ...ni }, 0)
      .fromTo('.w1', { x: 0, opacity: 1 }, { x: () => -38 * vw(), opacity: 0, duration: .55, ...ni }, 0)
      .fromTo('.w2', { x: 0, opacity: 1 }, { x: () => 38 * vw(), opacity: 0, duration: .55, ...ni }, 0)
      .fromTo('.bg', { scale: 1 }, { scale: 1.18, duration: 1, ...ni }, 0)
      .fromTo('.bg-blur', { opacity: 1 }, { opacity: 0, duration: .6, ...ni }, 0)
      .fromTo('.scroll-hint', { opacity: 1 }, { opacity: 0, duration: .15, ...ni }, 0)
      .fromTo('.claim', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .35, ...ni }, .55);
    gsap.from('.words img', { opacity: 0, y: 14, duration: 1.4, ease: 'power3.out', stagger: .1, delay: .15 });
    gsap.from('.branch.l', { xPercent: -6, opacity: 0, duration: 1.8, ease: 'power3.out' });
    gsap.from('.branch.r', { xPercent: 6, opacity: 0, duration: 1.8, ease: 'power3.out' });
    // statement + headings
    $$('.rise, .why h2, .res-head h2, .park h2, .contact h2, .sins-head h2').forEach(h => gsap.from(h, { y: 50, opacity: .15, duration: 1.3, ease: 'power3.out', scrollTrigger: { trigger: h, start: 'top 88%' } }));
    $$('.fact b[data-n]').forEach(b => { const n = +b.dataset.n, pre = b.dataset.pre || '', o = { v: 0 }; gsap.to(o, { v: n, duration: 1, ease: 'power2.out', scrollTrigger: { trigger: b, start: 'top 90%' }, onUpdate: () => { b.textContent = pre + Math.round(o.v); } }); });
    // park images drift at two speeds
    gsap.to('.park .tall div:nth-child(1)', { yPercent: -8, ease: 'none', scrollTrigger: { trigger: '.park', scrub: .8 } });
    gsap.to('.park .tall div:nth-child(2)', { yPercent: 6, ease: 'none', scrollTrigger: { trigger: '.park', scrub: .8 } });
    // sins: horizontal walk through the four "sins" (desktop only)
    const mm = gsap.matchMedia();
    mm.add('(min-width: 981px)', () => {
      const track = $('#track');
      const dist = () => track.scrollWidth - innerWidth;
      gsap.to(track, { x: () => -dist(), ease: 'none', modifiers: { x: gsap.utils.unitize(v => Math.round(v), 'px') }, force3D: true, scrollTrigger: { trigger: '.sins', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: .8, invalidateOnRefresh: true } });
    });
    ScrollTrigger.addEventListener('refresh', setupLine);
    addEventListener('load', () => ScrollTrigger.refresh());
  } else {
    addEventListener('load', setupLine);
    addEventListener('resize', setupLine);
  }
  document.fonts && document.fonts.ready.then(() => hasGsap && !reduce ? ScrollTrigger.refresh() : setupLine());

  /* form: concept site, nothing is sent */
  $('#form').addEventListener('submit', e => {
    e.preventDefault(); const f = e.target, ok = $('#ok'); ok.hidden = false;
    ok.textContent = f.checkValidity() ? 'Děkujeme. (Koncept: nic nebylo odesláno.)' : 'Vyplňte prosím jméno, e-mail a souhlas.';
  });
})();
