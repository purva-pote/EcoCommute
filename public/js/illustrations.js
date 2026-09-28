/*
 * EcoCommute – inline SVG illustrations (flat, hand-drawn vector feel)
 * Every figure is drawn with plain <svg> markup from the design palette.
 * Exposes:
 *   EcoArt.<figure>()      – SVG string functions (for backgrounds / inlining)
 *   injectSprites()        – one hidden <svg><symbol> sprite per page
 *   TREELINE_URI / HERO_URI / EMPTY_URI – data-URI backgrounds
 * common.js calls injectSprites() once and stores the data URIs as CSS vars.
 */
(function (root) {
  'use strict';

  const C = {
    green600: '#2A7A2F', green500: '#3E9B3E', green400: '#6DBE5A',
    lime400: '#A8D65C', green50: '#F1F9EC', sky100: '#E8F6FB', sky200: '#D3EDF7',
    orange400: '#F5A623', brown500: '#8B5E3C', text: '#333333', muted: '#8A8F98',
    skin: '#F2C6A0', dark: '#444444', water: '#BFE3F2', farHill: '#CFEAB8',
    grey: '#B8BEC6', roof: '#7A4A2B', deer: '#A9723F', lime: '#FFD84D',
    road: '#5B6470', sidewalk: '#E6E9EC', bikeLane: '#4FA34F', blanket: '#E8D9B8', stripe: '#F28BA8',
    sky1: '#00B3F2', // reserved accent (green-blue used for public transport)
    palIt: ['#F5A623', '#4FB3D9', '#F28BA8', '#FFD84D']
  };

  function svgUri(svg) {
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  /* Rounded triangle helper (flat, chunky pine tiers) */
  function tri(cx, y0, y1, half) {
    const r = Math.max(2, Math.min(5, (y1 - y0) * 0.25, half * 0.4));
    const mid = (y1 - y0) * 0.42;
    return [
      `M ${cx} ${y0}`,
      `Q ${cx + half * 0.55} ${y0 + mid} ${cx + half} ${y1 - r}`,
      `Q ${cx + half} ${y1} ${cx + half - r} ${y1}`,
      `L ${cx - half + r} ${y1}`,
      `Q ${cx - half} ${y1} ${cx - half} ${y1 - r}`,
      `Q ${cx - half * 0.55} ${y0 + mid} ${cx} ${y0}`,
      'Z'
    ].join(' ');
  }

  /* ---------- Symbols (used via <use href="#...">) ---------- */

  function treeRound() {
    return `
    <rect x="16" y="33" width="8" height="15" rx="4" fill="${C.brown500}"/>
    <circle cx="20" cy="17" r="13.5" fill="${C.green500}"/>
    <circle cx="8.5" cy="24" r="9" fill="${C.green500}"/>
    <circle cx="31.5" cy="24" r="9" fill="${C.green500}"/>
    <circle cx="20" cy="24" r="6" fill="${C.green500}"/>
    <circle cx="14" cy="11" r="4.5" fill="${C.lime400}"/>`;
  }

  function treePine() {
    return `
    <rect x="17" y="41" width="6" height="7" rx="3" fill="${C.brown500}"/>
    <path d="${tri(20, 25, 42, 16)}" fill="${C.green600}"/>
    <path d="${tri(20, 16, 30, 11)}" fill="${C.green600}"/>
    <path d="${tri(20, 6, 19, 6)}" fill="${C.green600}"/>`;
  }

  function treeCluster() {
    return `
    <g transform="translate(4 16) scale(.6)">${treeRound()}</g>
    <g transform="translate(30 4) scale(.8)">${treePine()}</g>
    <g transform="translate(58 20) scale(.55)">${treeRound()}</g>
    <g transform="translate(84 6) scale(.75)">${treePine()}</g>
    <g transform="translate(104 18) scale(.55)">${treeRound()}</g>
    <ellipse cx="20" cy="50" rx="11" ry="4.5" fill="${C.lime400}"/>
    <ellipse cx="72" cy="52" rx="13" ry="5" fill="${C.green400}"/>
    <ellipse cx="112" cy="50" rx="10" ry="4" fill="${C.lime400}"/>
    <ellipse cx="50" cy="53" rx="9" ry="4" fill="${C.lime400}"/>`;
  }

  /* Generic person – torso color varies via CSS var --p */
  function person() {
    return `
    <circle cx="16" cy="9" r="6.5" fill="${C.skin}"/>
    <rect x="9" y="19" width="14" height="21" rx="7" fill="var(--p, ${C.green500})"/>
    <rect x="6.5" y="23" width="3.4" height="10" rx="1.7" fill="${C.skin}"/>
    <rect x="22" y="23" width="3.4" height="10" rx="1.7" fill="${C.skin}"/>
    <rect x="7" y="39" width="7" height="13" rx="3.5" fill="${C.dark}"/>
    <rect x="18" y="39" width="7" height="13" rx="3.5" fill="${C.dark}"/>`;
  }

  function walker() {
    return `
    <rect x="3" y="21" width="9" height="16" rx="4.5" fill="${C.lime400}"/>
    <circle cx="15" cy="9" r="6.5" fill="${C.skin}"/>
    <rect x="8" y="19" width="14" height="20" rx="7" fill="var(--p, ${C.green500})"/>
    <rect x="24" y="22" width="3.4" height="12" rx="1.7" fill="${C.skin}" transform="rotate(-18 26 28)"/>
    <rect x="6" y="39" width="8" height="14" rx="4" fill="${C.dark}"/>
    <rect x="16" y="37" width="8" height="15" rx="4" fill="${C.dark}" transform="rotate(-18 20 52)"/>`;
  }

  function cyclist() {
    return `
    <circle cx="26" cy="72" r="19" fill="none" stroke="${C.green600}" stroke-width="4"/>
    <circle cx="94" cy="72" r="19" fill="none" stroke="${C.green600}" stroke-width="4"/>
    <circle cx="26" cy="72" r="3" fill="${C.green600}"/>
    <circle cx="94" cy="72" r="3" fill="${C.green600}"/>
    <g stroke="${C.green600}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <path d="M26 72 L48 46 L82 46 L58 72 Z"/>
      <path d="M82 46 L94 72"/>
      <path d="M82 46 L86 38"/>
      <path d="M42 44 L54 44" stroke-width="5"/>
    </g>
    <path d="M48 42 L52 60 L56 72" stroke="#666666" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M48 40 L72 26" stroke="#4FB3D9" stroke-width="14" stroke-linecap="round" fill="none"/>
    <path d="M48 42 L68 58 L62 74" stroke="#444444" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M72 28 L86 38" stroke="#4FB3D9" stroke-width="5" stroke-linecap="round" fill="none"/>
    <circle cx="80" cy="14" r="8" fill="${C.skin}"/>
    <path d="M72 13 A8 8 0 0 1 88 13 Z" fill="${C.green500}"/>`;
  }

  function bus() {
    return `
    <rect x="2" y="5" width="44" height="22" rx="6" fill="${C.green500}"/>
    <rect x="7" y="9" width="9" height="9" rx="2" fill="#ffffff"/>
    <rect x="18.5" y="9" width="9" height="9" rx="2" fill="#ffffff"/>
    <rect x="30" y="9" width="9" height="9" rx="2" fill="#ffffff"/>
    <rect x="41" y="9" width="3.5" height="9" rx="1.5" fill="#E8EEF2"/>
    <rect x="2" y="19.5" width="44" height="3.2" fill="${C.orange400}"/>
    <circle cx="15" cy="28" r="4" fill="${C.dark}"/>
    <circle cx="15" cy="28" r="1.5" fill="#fff"/>
    <circle cx="35" cy="28" r="4" fill="${C.dark}"/>
    <circle cx="35" cy="28" r="1.5" fill="#fff"/>`;
  }

  function carOutline() {
    return `
    <rect x="2" y="9" width="44" height="14" rx="7" fill="${C.grey}"/>
    <rect x="11" y="3.5" width="18" height="10" rx="4.5" fill="${C.grey}"/>
    <circle cx="11" cy="24" r="3.5" fill="${C.dark}"/>
    <circle cx="11" cy="24" r="1.4" fill="#fff"/>
    <circle cx="37" cy="24" r="3.5" fill="${C.dark}"/>
    <circle cx="37" cy="24" r="1.4" fill="#fff"/>`;
  }

  function sparkle() {
    return `<path d="M12 1 Q13.5 9 23 12 Q13.5 15 12 23 Q10.5 15 1 12 Q10.5 9 12 1 Z" fill="${C.orange400}"/>`;
  }

  function leaf() {
    return `
    <path d="M21 3 C13 4.5 7.5 8.5 3 21 C15.5 17.5 19.5 11.5 21 3 Z" fill="${C.lime400}"/>
    <path d="M20 4 L4.5 19.5" stroke="${C.green600}" stroke-width="1.4" stroke-linecap="round"/>`;
  }

  /* ---------- Full-width artwork ---------- */

  function treelineTile() {
    const spots = [
      [0, 'pine', .7], [36, 'round', .85], [78, 'pine', 1], [128, 'round', .7],
      [168, 'pine', .85], [212, 'round', 1], [258, 'pine', .6], [300, 'round', .9],
      [342, 'pine', 1], [392, 'round', .65], [432, 'pine', .85], [472, 'round', 1],
      [520, 'pine', .7], [556, 'round', .9]
    ];
    const parts = spots.map(([x, type, s]) => {
      const el = type === 'round' ? treeRound() : treePine();
      const y = 72 - 48 * s;
      return `<g transform="translate(${x} ${y}) scale(${s})">${el}</g>`;
    }).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 72" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <rect y="68" width="600" height="4" fill="${C.green600}"/>
      ${parts}<g transform="translate(180 46) scale(.5)">${treePine()}</g>
    </svg>`;
  }

  function heroScene() {
    const W = 1440, H = 420;
    const farHill  = x => 55 + 20 * Math.sin(x / 210) + 8 * Math.sin(x / 97);
    const midHill  = x => 125 + 22 * Math.sin(x / 260 + 1.2) + 7 * Math.sin(x / 110);
    const nearHill = x => 205 + 16 * Math.sin(x / 320 + 2.4) + 5 * Math.sin(x / 130);
    const roadY = x => 285 + 10 * Math.sin(x / 300);
    const side = x => roadY(x) - 14;
    const rTop = x => roadY(x) - 23;
    const rBot = x => roadY(x) + 23;
    const roadHit = (x, y) => Math.abs(y - roadY(x)) <= 30;
    const hillPath = fn => {
      let d = 'M 0 ' + fn(0);
      for (let x = 20; x <= W; x += 20) d += ' L ' + x + ' ' + fn(x);
      return d + ' L ' + W + ' ' + H + ' L 0 ' + H + ' Z';
    };
    const bandPath = (top, bot) => {
      let d = 'M 0 ' + top(0);
      for (let x = 20; x <= W; x += 20) d += ' L ' + x + ' ' + top(x);
      d += ' L ' + W + ' ' + bot(W);
      for (let x = W - 20; x >= 0; x -= 20) d += ' L ' + x + ' ' + bot(x);
      return d + ' Z';
    };

    /* Placement bookkeeping – exposed for the QA/dev page */
    const placed = { trees: [], people: [] };
    const placeTree = (x, layer, s, type) => {
      const hill = layer === 'far' ? farHill : layer === 'mid' ? midHill : nearHill;
      const base = hill(x) + 2;
      if (base > H - 2) return '';
      if (roadHit(x, base)) return '';
      const el = type === 'round' ? treeRound() : treePine();
      const shadow = `<ellipse cx="20" cy="46" rx="${type === 'round' ? 27 : 32}" ry="3" fill="#000000" fill-opacity=".08"/>`;
      placed.trees.push({ x, base, scale: s, type, layer });
      return `<g transform="translate(${x} ${Math.round(base - 48 * s)}) scale(${s})">${shadow}${el}</g>`;
    };
    const treeList = (list, layer) => list.map(t => placeTree(t[0], layer, t[1], t[2])).join('');

    const farTrees = treeList([
      [210, .5, 'round'], [360, .55, 'pine'], [530, .5, 'round'], [700, .55, 'pine'],
      [860, .5, 'round'], [1030, .55, 'pine'], [1200, .5, 'round']
    ], 'far');

    const midTrees = treeList([
      [62, .7, 'pine'], [150, .78, 'round'], [430, .8, 'pine'], [615, .78, 'round'],
      [835, .8, 'pine'], [1105, .8, 'round']
    ], 'mid');

    const nearTrees = treeList([
      [52, 1.15, 'pine'], [84, 1.3, 'round'], [118, 1.15, 'pine'],
      [1388, 1.15, 'pine'], [1412, 1.25, 'round'], [1434, 1.1, 'pine']
    ], 'near');

    /* Figures – tiny flat characters with a few poses */
    const SIT = `<circle cx="16" cy="7" r="6.5" fill="${C.skin}"/>
<rect x="9" y="16" width="14" height="18" rx="7" fill="var(--p, ${C.green500})"/>
<path d="M9 32 Q5 40 12 42 Q18 42 16 34" stroke="${C.dark}" stroke-width="6" fill="none" stroke-linecap="round"/>
<path d="M18 32 Q22 40 21 42" stroke="${C.dark}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
    const hatEl = c => `<path d="M9.5 4 h13 l.6 2.6 h-14.2 Z" fill="${c}"/><path d="M12 4 a4 4 0 0 1 8 0 Z" fill="${c}"/>`;
    const waveEl = () => `<path d="M20 20 l6 -8" stroke="${C.skin}" stroke-width="3.4" stroke-linecap="round"/>`;
    const pointEl = () => `<path d="M22 22 l7 2" stroke="${C.skin}" stroke-width="3.4" stroke-linecap="round"/>`;
    const photoEl = () => `<rect x="11" y="15" width="9" height="6" rx="2" fill="#555555"/><rect x="14" y="13" width="4" height="3" rx="1" fill="#555555"/>`;
    const phoneEl = () => `<rect x="25" y="13" width="4" height="7" rx="1.8" fill="#333333"/><path d="M22 24 l4 -4" stroke="${C.skin}" stroke-width="3" stroke-linecap="round"/>`;
    const armsEl = () => `<path d="M9 24 L5 14 M23 24 L27 14" stroke="${C.skin}" stroke-width="3.4" stroke-linecap="round"/>`;
    const backEl = () => `<rect x="9" y="19" width="14" height="17" rx="6" fill="#7A4A2B"/><rect x="12" y="23" width="8" height="7" rx="3" fill="#5F3A22"/>`;
    const lugEl = () => `<rect x="-9" y="40" width="10" height="12" rx="2.5" fill="#5F3A22"/><rect x="-6.5" y="35" width="5" height="6" rx="1.5" fill="#2F4770"/><rect x="-9" y="47" width="10" height="3" rx="1.5" fill="#8B5E3C"/>`;
    const extra = (c, v) => (v === 'hat' ? hatEl(c) : v === 'wave' ? waveEl() : v === 'point' ? pointEl() : v === 'photo' ? photoEl() : v === 'phone' ? phoneEl() : v === 'arms' ? armsEl() : v === 'lug' ? lugEl() : v === 'back' ? backEl() : '');
    const p = (x, feetY, sc, c, v, kind) => {
      const isWalk = kind === 'walk';
      const body = v === 'sit' ? SIT : isWalk ? walker() : person();
      const baseY = v === 'sit' ? feetY - 42 * sc : feetY - 56 * sc;
      placed.people.push({ x, feetY, scale: sc, variant: (v || 'plain') + (isWalk ? '·walk' : ''), element: body === person() ? 'person' : body === walker() ? 'walker' : 'sit', color: c });
      return `<g transform="translate(${x} ${Math.round(baseY)}) scale(${sc})" style="--p:${c}">${body}${extra(c, v)}</g>`;
    };
    const pL = (x, feetY, sc, c, v) => {
      placed.people.push({ x, feetY, scale: sc, variant: (v || 'plain') + 'L', element: 'walker', color: c });
      return `<g transform="translate(${x} ${Math.round(feetY - 56 * sc)}) scale(${-sc} ${sc})" style="--p:${c}">${walker()}${extra(c, v)}</g>`;
    };
    const cyclistG = (x, feetY, sc, acc) => {
      placed.people.push({ x, feetY, scale: sc, variant: 'cyclist', element: 'cyclist', color: C.palIt[0] });
      const accEl = acc === 'basket'
        ? `<rect x="82" y="40" width="16" height="10" rx="3" fill="#C9A063"/><rect x="85" y="43" width="10" height="4" rx="2" fill="#8B5E3C"/>`
        : acc === 'flag'
          ? `<rect x="30" y="18" width="2.6" height="26" fill="#8A8F98"/><path d="M32.6 19 L52 27 L32.6 35 Z" fill="${C.orange400}"/>`
          : '';
      return `<g transform="translate(${x} ${Math.round(feetY - 91 * sc)}) scale(${sc})">${cyclist()}${accEl}</g>`;
    };
    const houseEl = (x, w, wall, roofH, winW) => {
      const baseY = midHill(x);
      const doorH = Math.floor(wall * 0.55);
      const doorW = Math.max(11, Math.round(w * 0.13));
      return `<g transform="translate(${x} ${Math.round(baseY)})">
  <rect x="${(-w * 0.34).toFixed(1)}" y="${-wall - 28}" width="9" height="28" rx="4" fill="#ffffff"/>
  <rect x="${Math.round(-w * 0.34) - 1.5}" y="${-wall - 31}" width="12" height="4" rx="2" fill="${C.roof}"/>
  <rect x="${-w / 2}" y="${-wall}" width="${w}" height="${wall}" rx="7" fill="#ffffff"/>
  <rect x="${-w / 2 - 6}" y="${-wall - roofH}" width="${w + 12}" height="${roofH}" rx="${roofH / 2}" fill="${C.roof}"/>
  <rect x="${-doorW / 2}" y="${-doorH}" width="${doorW}" height="${doorH}" rx="4" fill="${C.orange400}"/>
  <circle cx="0" cy="${-doorH + 6}" r="1.5" fill="#fff"/>
  <rect x="${-w / 2 + 8}" y="${-wall + 16}" width="${winW}" height="${winW}" rx="4" fill="#BFE9F7"/>
  <rect x="${w / 2 - 8 - winW}" y="${-wall + 16}" width="${winW}" height="${winW}" rx="4" fill="#BFE9F7"/>
</g>`;
    };

    const sparkleAt = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})">${sparkle()}</g>`;
    const leafAt = (x, y, s, r) => `<g transform="translate(${x} ${y}) scale(${s}) rotate(${r})">${leaf()}</g>`;

    /* Road furniture */
    const head = cx => `<circle cx="${cx}" cy="32" r="6" fill="${C.skin}"/><path d="M${cx - 6} 32 a6 6 0 0 1 12 0 Z" fill="${C.dark}"/>`;
    const busG = (body, roof, sign) => `
<rect x="0" y="8" width="190" height="52" rx="10" fill="${body}"/>
<rect x="0" y="8" width="190" height="13" rx="6.5" fill="${roof}"/>
<rect x="34" y="25" width="24" height="21" rx="6" fill="#fff"/>${head(46)}
<rect x="63" y="25" width="24" height="21" rx="6" fill="#fff"/>${head(75)}
<rect x="92" y="25" width="24" height="21" rx="6" fill="#fff"/>${head(104)}
<rect x="121" y="25" width="24" height="21" rx="6" fill="#fff"/>${head(133)}
<rect x="6" y="20" width="22" height="38" rx="5" fill="#0E1C24" opacity=".9"/>
<path d="M17 26 L-2 42 L5 56 L24 42 Z" fill="#6C7A83"/>
<path d="M14 44 L22 44" stroke="${C.lime400}" stroke-width="5" stroke-linecap="round"/>
<rect x="149" y="17" width="35" height="26" rx="4" fill="${sign}"/>
<rect x="153" y="22" width="27" height="5" rx="2.5" fill="#fff" opacity=".85"/>
<rect x="153" y="30" width="18" height="6" rx="3" fill="#fff" opacity=".75"/>
<path d="M167 34 L172 39 M172 39 L167 44" stroke="#fff" stroke-width="2" fill="none" opacity=".85"/>
<circle cx="28" cy="62" r="12" fill="${C.dark}"/><circle cx="28" cy="62" r="3.4" fill="#fff"/>
<circle cx="160" cy="62" r="12" fill="${C.dark}"/><circle cx="160" cy="62" r="3.4" fill="#fff"/>`;
    const dashPts = () => {
      let d = '';
      for (let x = 10; x <= W - 28; x += 50) d += `<rect x="${x}" y="${(roadY(x) - 2).toFixed(1)}" width="28" height="4" rx="2" fill="#ffffff"/>`;
      return d;
    };
    const zebraPts = (base) => {
      let d = '';
      for (let k = 0; k < 7; k++) {
        const cx = base + 11 * k;
        d += `<g transform="translate(${cx} 0)"><rect x="-4" y="${(roadY(cx) - 22).toFixed(1)}" width="8" height="44" rx="1.5" fill="#ffffff"/></g>`;
      }
      return d;
    };
    const hv = (cx, hair, r) => `
  <circle cx="${cx}" cy="18" r="${r}" fill="${C.skin}"/><path d="M${cx - r} 18 a${r} ${r} 0 0 1 ${2 * r} 0 Z" fill="${hair}"/>`;
    const carShell = color => `
  <rect x="2" y="24" width="96" height="26" rx="11" fill="${color}"/>
  <path d="M12 26 L19 10 Q20 8 23 8 L63 8 Q66 8 67 10 L84 24 L88 26 Z" fill="${color}"/>
  <path d="M15 26 L22 12 L58 12 L74 24" fill="none" stroke="#ffffff" stroke-width="2.4" opacity=".25"/>
  <rect x="26" y="12" width="15" height="12" rx="3" fill="#fff"/>
  <rect x="45" y="12" width="15" height="12" rx="3" fill="#fff"/>
  <circle cx="20" cy="50" r="7.5" fill="${C.dark}"/><circle cx="20" cy="50" r="2.6" fill="#fff"/>
  <circle cx="80" cy="50" r="7.5" fill="${C.dark}"/><circle cx="80" cy="50" r="2.6" fill="#fff"/>`;
    const carAt = (x, ground, color, w, extra) => {
      const ws = w / 100;
      return `<g transform="translate(${x} ${Math.round(ground - 58 * ws)}) scale(${ws})">${carShell(color)}${extra}</g>`;
    };

    /* Bus stop (shelter, bench, round sign) + bench for second stop */
    const shelter = () => `<g transform="translate(160 ${Math.round(side(160))})">
  <rect x="-6" y="-26" width="44" height="6" rx="3" fill="${C.green600}"/>
  <rect x="0" y="-20" width="32" height="5" rx="2.5" fill="${C.green500}"/>
  <path d="M6 -15 L6 0" stroke="#8A8F98" stroke-width="2.6" fill="none" stroke-linecap="round"/>
  <path d="M28 -13 L28 0" stroke="#8A8F98" stroke-width="2.6" fill="none" stroke-linecap="round"/>
  <rect x="-13" y="-5" width="24" height="3.6" rx="1.8" fill="#8B5E3C"/>
  <rect x="-11" y="-6" width="3" height="6" rx="1.5" fill="#8B5E3C"/>
  <rect x="8" y="-6" width="3" height="6" rx="1.5" fill="#8B5E3C"/>
  <circle cx="42" cy="-20" r="6" fill="#fff" stroke="${C.orange400}" stroke-width="2.6"/>
  <path d="M40.5 -22 h2 a2 2 0 0 1 0 4 h-2 Z" fill="${C.orange400}"/>
</g>`;
    const benchAt = (x) => `<g transform="translate(${x} ${Math.round(side(x))})">
  <rect x="-14" y="-16" width="28" height="4" rx="2" fill="#8B5E3C"/>
  <rect x="10" y="-17" width="3.5" height="15" rx="1.5" fill="#8B5E3C"/>
  <rect x="-13.5" y="-17" width="3.5" height="15" rx="1.5" fill="#8B5E3C"/>
</g>`;
    const dogG = (x, feet, sc) => `<g transform="translate(${x} ${Math.round(feet - 29 * sc)}) scale(${sc})">
  <ellipse cx="18" cy="16" rx="15" ry="8" fill="#8B5E3C"/>
  <circle cx="4" cy="16" r="6" fill="#8B5E3C"/>
  <circle cx="5" cy="14.5" r="1.8" fill="#fff"/>
  <path d="M8 21 l3 1.5 M16 21 l3 -1.5" stroke="#5F3A22" stroke-width="2" stroke-linecap="round"/>
  <path d="M31 14 q7 -5 6 6" stroke="#8B5E3C" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  <rect x="2" y="23" width="4" height="6" rx="2" fill="#5F3A22"/>
  <rect x="13" y="23" width="4" height="6" rx="2" fill="#5F3A22"/>
  <rect x="24" y="23" width="4" height="6" rx="2" fill="#5F3A22"/>
</g>`;

    /* Mid-hill meadow – picnic on a muted blanket, hikers, photographer, kite kid */
    const mf = (x, o) => midHill(x) + o;
    const blanket = `<g transform="translate(700 ${Math.round(midHill(700) + 2)})">
  <rect x="-72" y="0" width="144" height="6" rx="3" fill="${C.blanket}"/>
  <rect x="-72" y="6" width="144" height="5" fill="${C.stripe}" opacity=".85"/>
  <rect x="-72" y="11" width="144" height="6" rx="3" fill="${C.blanket}"/>
  <rect x="-72" y="17" width="144" height="5" fill="${C.stripe}" opacity=".85"/>
</g>`;
    const tripod = `<g transform="translate(372 ${Math.round(midHill(372) + 6)})">
  <path d="M0 0 L-8 -20 M0 0 L0 -24 M0 0 L8 -20" stroke="#8A8F98" stroke-width="2.2" stroke-linecap="round" fill="none"/>
  <rect x="-5.5" y="-32" width="11" height="10" rx="2" fill="#555555"/>
</g>`;
    const kiteKid = (x) => {
      const feet = midHill(x) + 6;
      return `<path d="M${x + 12} ${feet - 13} C ${x + 34} ${feet - 40} 178 76 196 68" stroke="#ffffff" stroke-width="1.6" fill="none" stroke-dasharray="3 3"/>` +
        `<g transform="translate(196 60)"><path d="M0 0 L11 8 L0 16 L-11 8 Z" fill="${C.orange400}"/><path d="M-3.5 6 L3.6 8 L-1.5 10" stroke="#ffffff" stroke-width="1.6" fill="none"/><path d="M4 16 l2 6 M-1 16 l2 6" stroke="${C.palIt[2]}" stroke-width="1.4" fill="none" stroke-linecap="round"/></g>` +
        p(x, feet, .46, C.palIt[2], 'arms');
    };
    const meadow =
      p(300, mf(300, 6), .46, C.palIt[3], 'plain') +
      p(360, mf(360, 4), .5, C.palIt[1], 'photo') + tripod +
      p(470, mf(470, 8), .45, C.palIt[1], 'back') +
      p(530, mf(530, 6), .5, C.palIt[3], 'wave') +
      p(590, mf(590, 8), .45, C.palIt[0], 'arms') +
      blanket +
      p(655, 139, .5, C.palIt[1], 'sit') + p(672, 139, .5, C.palIt[0], 'sit') + p(690, 139, .5, C.palIt[3], 'sit') + p(706, 128, .5, C.palIt[2], 'sit') + p(724, 139, .5, C.palIt[1], 'sit') +
      p(790, mf(790, 8), .45, C.palIt[2], 'hat') +
      p(860, mf(860, 6), .5, C.palIt[1], 'point') +
      p(930, mf(930, 6), .5, C.palIt[2], 'back') +
      p(1000, mf(1000, 6), .5, C.palIt[0], 'arms') + dogG(1018, mf(1018, 10), .8) +
      p(1070, mf(1070, 6), .48, C.palIt[3], 'hat') +
      kiteKid(138);

    /* Far hill – tiny figures in the distance */
    const farP = (x, c, s) => p(x, farHill(x) + 3, s, c, 'plain');
    const farMeadow =
      farP(60, C.palIt[3], .33) + farP(130, C.palIt[1], .31) + farP(240, C.palIt[2], .32) +
      farP(285, C.palIt[0], .33) + farP(445, C.palIt[3], .32) + farP(615, C.palIt[1], .31) +
      farP(780, C.palIt[0], .32) + farP(945, C.palIt[2], .33) + farP(1090, C.palIt[3], .32);

    /* Slots – each transport item gets an exclusive road lane (A..G) */
    const slotA =
      `<g data-slot="A">` +
      shelter() +
      p(60, side(60), .5, C.palIt[2], 'plain', 'walk') +
      p(84, side(84), .5, C.palIt[3], 'plain', 'walk') +
      p(110, side(110), .72, C.palIt[1], 'lug', 'walk') +
      pL(140, side(140), .75, C.palIt[0], 'phone') +
      p(168, side(168), .62, C.palIt[2], 'plain', 'walk') +
      p(198, side(198), .8, C.palIt[3], 'back') +
      `</g>`;
    const slotB =
      `<g data-slot="B">` +
      `<g transform="translate(270 ${Math.round(roadY(380) + 6 - 74)})">${busG(C.green500, C.green600, C.orange400)}</g>` +
      p(284, roadY(284) + 6, .5, C.palIt[1], 'plain') +
      p(294, roadY(294) + 6, .45, C.palIt[0], 'phone') +
      `</g>`;
    const slotC =
      `<g data-slot="C">` +
      carAt(500, roadY(500) + 6, C.palIt[1], 105, hv(31, '#444444', 4.2) + hv(38, '#5F3A22', 4.2) + hv(50.5, '#444444', 4.6)) +
      carAt(643, roadY(643) + 6, C.orange400, 105, hv(30.5, '#5F3A22', 4.2) + hv(38, '#444444', 4.2) + hv(49, '#444444', 4.2) + hv(56.5, '#5F3A22', 4.2) + `<path d="M58 22 l11 -8" stroke="${C.skin}" stroke-width="3.2" stroke-linecap="round"/><g transform="translate(66 34) scale(.5)">${leaf()}</g>`) +
      `</g>`;
    const slotD =
      `<g data-slot="D">` +
      zebraPts(796) +
      p(806, roadY(806) + 7, .85, C.palIt[2], 'lug', 'walk') +
      p(822, roadY(822) + 4, .8, C.palIt[0], 'hat', 'walk') +
      p(838, roadY(838) + 7, .8, C.palIt[3], 'wave', 'walk') +
      p(854, roadY(854) + 4, .85, C.palIt[1], 'plain', 'walk') +
      `</g>`;
    const slotE =
      `<g data-slot="E">` +
      cyclistG(930, roadY(930) + 10, .625, 'basket') +
      cyclistG(1020, roadY(1020) + 10, .625, 'flag') +
      `</g>`;
    const slotF =
      `<g data-slot="F">` +
      `<g transform="translate(1350 ${Math.round(roadY(1260) + 6 - 74)}) scale(-1 1)">${busG(C.lime400, C.green500, C.orange400)}</g>` +
      `</g>`;
    const slotG =
      `<g data-slot="G">` +
      benchAt(1404) +
      p(1404, side(1404) - 16, .5, C.palIt[2], 'sit') +
      pL(1424, side(1424), .55, C.palIt[3], 'back') +
      `</g>`;

    const vehicles = slotC + slotF;
    const peopleRoad =
      slotA + slotB + slotD + slotE + slotG +
      p(247, side(247), .5, C.palIt[1], 'plain', 'walk') +
      p(481, side(481), .45, C.palIt[0], 'back', 'walk') +
      p(769, side(769), .5, C.palIt[3], 'plain', 'walk') +
      p(903, side(903), .5, C.palIt[1], 'hat', 'walk');

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
  ${sparkleAt(150, 16, .5)}${sparkleAt(1290, 14, .45)}${sparkleAt(1380, 10, .4)}
  ${leafAt(330, 20, .5, -20)}${leafAt(680, 16, .45, 18)}${leafAt(1060, 18, .45, -12)}${leafAt(1210, 12, .5, 14)}
  <path d="${hillPath(farHill)}" fill="${C.farHill}"/>
  ${farTrees}
  ${farMeadow}
  <path d="${hillPath(midHill)}" fill="${C.lime400}"/>
  ${midTrees}
  ${houseEl(215, 112, 42, 22, 14)}
  ${houseEl(1290, 76, 38, 16, 11)}
  ${meadow}
  <path d="${hillPath(nearHill)}" fill="${C.green400}"/>
  <path d="${bandPath(rTop, rBot)}" fill="${C.road}"/>
  <path d="${bandPath(x => roadY(x) - 23, x => roadY(x) - 13)}" fill="${C.sidewalk}"/>
  <path d="${bandPath(x => roadY(x) + 9, x => roadY(x) + 23)}" fill="${C.bikeLane}"/>
  ${dashPts()}
  ${vehicles}
  ${peopleRoad}
  ${nearTrees}
</svg>`;

    return {
      svg,
      data: {
        W, H, farHill, midHill, nearHill, roadY, roadHit, side,
        trees: placed.trees, people: placed.people
      }
    };
  }

  /* ---------- Sprite injection ---------- */

  const SYMBOLS = {
    'tree-round': treeRound, 'tree-pine': treePine, 'tree-cluster': treeCluster,
    person: person, cyclist: cyclist, walker: walker, bus: bus,
    'car-outline': carOutline, sparkle: sparkle, leaf: leaf
  };
  const VB = {
    'tree-round': '0 0 40 48', 'tree-pine': '0 0 40 48', 'tree-cluster': '0 0 128 60',
    person: '0 0 32 56', cyclist: '0 0 120 96', walker: '0 0 32 56', bus: '0 0 48 32',
    'car-outline': '0 0 48 28', sparkle: '0 0 24 24', leaf: '0 0 24 24'
  };

  function injectSprites() {
    if (document.getElementById('ec-sprites')) return;
    const body = Object.entries(SYMBOLS).map(([id, fn]) =>
      `<symbol id="ec-${id}" viewBox="${VB[id]}">${fn()}</symbol>`).join('');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'ec-sprites';
    svg.setAttribute('aria-hidden', 'true');
    svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    svg.innerHTML = body;
    document.body.appendChild(svg);
  }

  const TREELINE_URI = svgUri(treelineTile());
  const HERO_URI = svgUri(heroScene().svg);
  const EMPTY_URI = svgUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 60" aria-hidden="true">${treeCluster()}</svg>`
  );

  root.EcoArt = {
    C, treeRound, treePine, treeCluster, person, cyclist, walker, bus, carOutline,
    sparkle, leaf, treelineTile, heroScene, svgUri,
    heroData: () => heroScene().data
  };
  root.injectSprites = injectSprites;
  root.TREELINE_URI = TREELINE_URI;
  root.HERO_URI = HERO_URI;
  root.EMPTY_URI = EMPTY_URI;
})(typeof self !== 'undefined' ? self : this);