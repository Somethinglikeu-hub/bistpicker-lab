// BistPicker Lab PWA — veriyi v2 engine_v2_state.json'dan okur
const FALLBACK = {
  generated: "2026-07-24",
  data_date: "2026-07-24",
  regime: "OPEN",
  exposure_pct: 100,
  rebalance_date: "2026-07-24",
  positions: [
    {rank:1, ticker:"PCILT", name:"PC Iletisim", price:33.22, score:82.5},
    {rank:2, ticker:"RYSAS", name:"Ryunag Sanayi", price:19.84, score:79.5},
    {rank:3, ticker:"ATATP", name:"ATP Yazilim", price:266.75, score:77.0},
    {rank:4, ticker:"SANEL", name:"Sanela Hirdavat", price:72.65, score:75.7},
    {rank:5, ticker:"ARASE", name:"Aras Enerji", price:119.00, score:75.3},
    {rank:6, ticker:"KARSN", name:"Karsan", price:10.89, score:72.4},
    {rank:7, ticker:"EGPRO", name:"Ege Endustri", price:35.60, score:71.6},
    {rank:8, ticker:"ESCOM", name:"Escom Badana", price:5.27, score:71.5}
  ],
  reserves: [
    {ticker:"FONET", score:71.2},
    {ticker:"YUNSA", score:71.0}
  ]
};

const PRICE_OVERRIDE_KEY = 'bistpicker_v2_prices';

async function load() {
  try {
    const r = await fetch('https://raw.githubusercontent.com/Somethinglikeu-hub/bistpicker-v2/gh-pages/engine_v2_state.json', {cache:'no-store'});
    if (!r.ok) throw new Error(r.status);
    return await r.json();
  } catch (e) {
    console.warn('v2 state fetch failed, fallback:', e);
    return FALLBACK;
  }
}

function getOverridePrices() {
  try { return JSON.parse(localStorage.getItem(PRICE_OVERRIDE_KEY) || '{}'); }
  catch { return {}; }
}

function setOverridePrices(obj) {
  localStorage.setItem(PRICE_OVERRIDE_KEY, JSON.stringify({
    ...obj,
    _updated: new Date().toISOString().slice(0,10)
  }));
}

function editPrices() {
  const state = window._state;
  if (!state || !state.positions) return;
  const overrides = getOverridePrices();
  const lines = state.positions.map(p => {
    const cur = overrides[p.ticker] !== undefined ? overrides[p.ticker] : p.price;
    return `${p.ticker} (giris ${p.price.toFixed(2)}):`;
  });
  const input = prompt(
    "Guncel fiyatlari virgulle ayrilmis gir (PCILT=33.5, RYSAS=20, ...):\n" + lines.join('\n'),
    state.positions.map(p => `${p.ticker}=${overrides[p.ticker] !== undefined ? overrides[p.ticker] : p.price}`).join(', ')
  );
  if (!input) return;
  const newO = {...getOverridePrices()};
  input.split(',').forEach(pair => {
    const [t, v] = pair.split('=').map(s => s.trim());
    if (t && v && !isNaN(parseFloat(v))) newO[t] = parseFloat(v);
  });
  setOverridePrices(newO);
  render(state);
}

function calcPerformance(state) {
  if (!state || !state.positions) return null;
  const overrides = getOverridePrices();
  const positions = state.positions.map(p => {
    const overridePrice = overrides[p.ticker];
    const cur = overridePrice !== undefined ? overridePrice : p.price;
    const hasEntry = p.price !== null && p.price !== undefined;
    const hasCurrent = cur !== null && cur !== undefined;
    const ret = (hasEntry && hasCurrent) ? (cur / p.price - 1) * 100 : null;
    return { ...p, current_price: cur, return_pct: ret, has_entry: hasEntry, has_current: hasCurrent };
  });
  if (!positions.length) return null;
  const validRets = positions.filter(p => p.return_pct !== null).map(p => p.return_pct);
  const avg = validRets.length ? validRets.reduce((s,r) => s+r, 0) / validRets.length : null;
  const wins = positions.filter(p => p.return_pct !== null && p.return_pct > 0).length;
  const losses = positions.filter(p => p.return_pct !== null && p.return_pct < 0).length;
  const enteredCount = positions.filter(p => p.has_entry).length;
  const validPositions = positions.filter(p => p.return_pct !== null);
  const best = validPositions.length ? validPositions.reduce((a,b) => a.return_pct > b.return_pct ? a : b) : null;
  const worst = validPositions.length ? validPositions.reduce((a,b) => a.return_pct < b.return_pct ? a : b) : null;
  const xu = state.xu100_return_pct !== undefined ? state.xu100_return_pct : null;
  return {
    avg, xu, alpha: (avg !== null && xu !== null) ? avg - xu : null,
    wins, losses, enteredCount, totalCount: positions.length,
    best, worst,
    as_of: overrides._updated || state.data_date || state.generated || '—',
    positions
  };
}

function fmtPct(n) {
  if (n === null || n === undefined) return '—';
  const cls = n > 0 ? 'pos' : n < 0 ? 'neg' : 'flat';
  return `<span class="perf ${cls}">${n >= 0 ? '+' : ''}${n.toFixed(2)}%</span>`;
}

function render(state) {
  window._state = state;
  const reg = document.getElementById('regime');
  const open = state.regime === 'OPEN';
  reg.textContent = open ? 'AÇIK (tam pozisyon)' : 'KAPALI (%50 nakit)';
  reg.className = 'regime ' + (open ? 'on' : 'off');
  document.getElementById('exposure').textContent = state.exposure_pct + '% hisse / ' + (100 - state.exposure_pct) + '% nakit';
  document.getElementById('rebal').textContent = state.rebalance_date;
  document.getElementById('dataDate').textContent = state.data_date;

  // performance
  const perf = calcPerformance(state);
  const dataNote = state.data_note || state.data_status || null;
  if (perf) {
    if (dataNote) {
      document.getElementById('avgReturn').innerHTML = `<span class="perf flat">veri yok</span>`;
      document.getElementById('xu100Return').innerHTML = perf.xu !== null ? fmtPct(perf.xu) : '<span class="perf flat">yok</span>';
      document.getElementById('alpha').innerHTML = '<span class="perf flat">—</span>';
      document.getElementById('winsLosses').textContent = `0 / 0`;
      document.getElementById('bestWorst').textContent = '—';
      document.getElementById('perfStatus').innerHTML = `<span class="perf flat">fiyat gir</span>`;
    } else {
      document.getElementById('avgReturn').innerHTML = perf.avg !== null ? fmtPct(perf.avg) : '<span class="perf flat">—</span>';
      document.getElementById('xu100Return').innerHTML = perf.xu !== null ? fmtPct(perf.xu) : '<span class="perf flat">yok</span>';
      document.getElementById('alpha').innerHTML = perf.alpha !== null ? fmtPct(perf.alpha) : '<span class="perf flat">—</span>';
      document.getElementById('winsLosses').textContent = `${perf.wins} / ${perf.losses}`;
      document.getElementById('bestWorst').textContent = (perf.best && perf.worst)
        ? `${perf.best.ticker} ${perf.best.return_pct >= 0 ? '+' : ''}${perf.best.return_pct.toFixed(1)}% / ${perf.worst.ticker} ${perf.worst.return_pct >= 0 ? '+' : ''}${perf.worst.return_pct.toFixed(1)}%`
        : '—';
      document.getElementById('perfStatus').innerHTML = perf.alpha !== null ? fmtPct(perf.alpha) : (perf.avg !== null ? fmtPct(perf.avg) : '<span class="perf flat">—</span>');
    }
    document.getElementById('perfAsOf').textContent = perf.as_of;
  }

  document.getElementById('rows').innerHTML = perf.positions.map(p => {
    const entryCell = p.has_entry ? p.price.toFixed(2) : '<span style="color:#8b949e">—</span>';
    const curCell = p.has_current ? p.current_price.toFixed(2) : '<span style="color:#f0883e">gir</span>';
    const retCell = p.return_pct !== null
      ? `<span class="perf ${p.return_pct > 0 ? 'pos' : p.return_pct < 0 ? 'neg' : 'flat'}">${p.return_pct >= 0 ? '+' : ''}${p.return_pct.toFixed(2)}%</span>`
      : '<span style="color:#8b949e">—</span>';
    return `<tr><td>${p.rank}</td>
    <td><span class="tk">${p.ticker}</span><br><span style="font-size:.68rem;color:#8b949e">${p.name||''}</span></td>
    <td>${entryCell}</td>
    <td>${curCell}</td>
    <td>${retCell}</td>
    <td class="score">${p.score.toFixed(1)}</td></tr>`;
  }).join('');

  // data note uyarisi
  let note = document.getElementById('dataNoteBanner');
  if (dataNote && !note) {
    note = document.createElement('div');
    note.id = 'dataNoteBanner';
    note.className = 'card warn';
    note.innerHTML = `<div class="t">⚠ Veri notu</div><div class="rules">${dataNote}</div>`;
    document.querySelector('h1').after(note);
  } else if (!dataNote && note) {
    note.remove();
  }
}

load().then(render);

// SW kayıt
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(()=>{});
}
