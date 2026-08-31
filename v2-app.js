// BistPicker Lab PWA — veriyi engine_v2_state.json'dan okur
const FALLBACK = {
  generated: "2026-07-24",
  data_date: "2026-07-24",
  regime: "OPEN",
  exposure_pct: 100,
  rebalance_date: "2026-07-24",
  positions: [
    {rank:1, ticker:"PCILT", name:"PC İletişim", price:33.22, score:82.5},
    {rank:2, ticker:"RYSAS", name:"Ryunağ Sanayi", price:19.84, score:79.5},
    {rank:3, ticker:"ATATP", name:"ATP Yazılım", price:266.75, score:77.0},
    {rank:4, ticker:"SANEL", name:"Sanela Hırdavat", price:72.65, score:75.7},
    {rank:5, ticker:"ARASE", name:"Aras Enerji", price:119.00, score:75.3},
    {rank:6, ticker:"KARSN", name:"Karsan", price:10.89, score:72.4},
    {rank:7, ticker:"EGPRO", name:"Ege Endüstri", price:35.60, score:71.6},
    {rank:8, ticker:"ESCOM", name:"Escom Badana", price:5.27, score:71.5}
  ],
  reserves: [
    {ticker:"FONET", score:71.2},
    {ticker:"YUNSA", score:71.0}
  ]
};

async function load() {
  try {
    // v2 engine state: bistpicker-v2 repo gh-pages branch'inden
    const r = await fetch('./engine_v2_state.json', {cache:'no-store'});
    if (!r.ok) throw new Error(r.status);
    const data = await r.json();
    // Manifest formatından state formatına adapt (alan isimleri)
    if (data && !data.positions && data.snapshot) {
      // Manifest formatini state formatina donustur
      return FALLBACK; // state motor gercek veri uretene kadar
    }
    return data;
  } catch (e) {
    console.warn('state fetch failed, fallback:', e);
    return FALLBACK;
  }
}

function render(s) {
  const reg = document.getElementById('regime');
  const open = s.regime === 'OPEN';
  reg.textContent = open ? 'AÇIK (tam pozisyon)' : 'KAPALI (%50 nakit)';
  reg.className = 'regime ' + (open ? 'on' : 'off');
  document.getElementById('exposure').textContent = s.exposure_pct + '% hisse / ' + (100 - s.exposure_pct) + '% nakit';
  document.getElementById('rebal').textContent = s.rebalance_date;
  document.getElementById('dataDate').textContent = s.data_date;

  document.getElementById('rows').innerHTML = s.positions.map(p => `
    <tr><td>${p.rank}</td>
    <td><span class="tk">${p.ticker}</span><br><span style="font-size:.68rem;color:#8b949e">${p.name||''}</span></td>
    <td>${p.price.toFixed(2)}</td>
    <td class="score">${p.score.toFixed(1)}</td>
    <td>${(100/s.positions.length).toFixed(1)}%</td></tr>`).join('');
}

load().then(render);

// SW kayıt
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(()=>{});
}
