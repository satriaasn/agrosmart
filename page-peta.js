/* =============================================
   AgroSmart — Page: Peta Lahan (GIS Map)
   Uses Leaflet.js + OpenStreetMap tiles
   ============================================= */

// ─── Leaflet map instance (singleton) ─────────────────────────────────────────
let _map = null;
let _markers = [];

// Status colour per lahan
const STATUS_COLORS = {
  'Aktif':        '#22c55e',
  'Pemeliharaan': '#f59e0b',
  'Tidak Aktif':  '#ef4444',
};

// ─── Google Maps URL → Lat/Lng Parser ─────────────────────────────────────────
function parseMapsUrl(url) {
  if (!url || !url.trim()) return null;
  const s = url.trim();

  // 1) Plain "lat,lng"
  if (/^-?\d+\.?\d*,\s*-?\d+\.?\d*$/.test(s)) {
    const [lat, lng] = s.split(',').map(Number);
    if (isValidLatLng(lat, lng)) return { lat, lng };
  }

  // 2) ?q=lat,lng  or  ?ll=lat,lng
  let m = s.match(/[?&](?:q|ll)=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (m) { const [lat, lng] = [+m[1], +m[2]]; if (isValidLatLng(lat, lng)) return { lat, lng }; }

  // 3) /@lat,lng,zoom  (Google Maps share link)
  m = s.match('\/@(-?\\d+\\.?\\d*),(-?\\d+\\.?\\d*)');
  if (m) { const [lat, lng] = [+m[1], +m[2]]; if (isValidLatLng(lat, lng)) return { lat, lng }; }

  // 4) /place/.../@lat,lng  (full Google Maps Place URL)
  m = s.match('@(-?\\d+\\.?\\d*),(-?\\d+\\.?\\d*)');
  if (m) { const [lat, lng] = [+m[1], +m[2]]; if (isValidLatLng(lat, lng)) return { lat, lng }; }

  // 5) ?daddr=lat,lng  or  destination=lat,lng
  m = s.match(/(?:daddr|destination)=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (m) { const [lat, lng] = [+m[1], +m[2]]; if (isValidLatLng(lat, lng)) return { lat, lng }; }

  return null;
}

function isValidLatLng(lat, lng) {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

// ─── Leaflet Custom Icon ───────────────────────────────────────────────────────
function createMarkerIcon(lahan) {
  const color = STATUS_COLORS[lahan.status] || '#22c55e';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
    <filter id="s"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.4"/></filter>
    <path filter="url(#s)" d="M18 0C8 0 0 8 0 18c0 12 18 26 18 26S36 30 36 18C36 8 28 0 18 0z" fill="${color}"/>
    <circle cx="18" cy="18" r="9" fill="white" opacity="0.9"/>
    <text x="18" y="22" text-anchor="middle" font-size="10" font-weight="bold" fill="${color}">${lahan.nama.replace('Blok ','')}</text>
  </svg>`;
  return L.divIcon({
    html: svg,
    iconSize: [36, 44],
    iconAnchor: [18, 44],
    popupAnchor: [0, -44],
    className: '',
  });
}

// ─── Popup HTML ───────────────────────────────────────────────────────────────
function buildPopup(l, listBiaya, listPanen) {
  const biaya      = (listBiaya||[]).filter(b => b.lahan === l.nama).reduce((a,b)=>a+(b.total||0), 0);
  const pendapatan = (listPanen||[]).filter(p => p.lahan === l.nama).reduce((a,p)=>a+(p.total||0), 0);
  const laba       = pendapatan - biaya;
  const statusColor = STATUS_COLORS[l.status] || '#22c55e';
  return `
  <div style="font-family:'Inter',sans-serif;min-width:220px;padding:4px">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
      <div style="font-size:28px">${l.emoji||'♦️'}</div>
      <div>
        <div style="font-family:'Outfit',sans-serif;font-size:16px;font-weight:700;color:#0f1f12">${l.nama}</div>
        <div style="font-size:11px;color:#6b7d70">${l.tanaman||'-'} • ${l.luas||0} ha</div>
      </div>
      <span style="margin-left:auto;background:${statusColor}22;color:${statusColor};font-size:10px;font-weight:700;padding:2px 8px;border-radius:99px;white-space:nowrap">${l.status||'-'}</span>
    </div>
      <div class="grid-2" style="gap:6px;margin-bottom:10px">
      <div style="background:#f0fdf4;border-radius:8px;padding:8px">
        <div style="font-size:9px;font-weight:700;color:#6b7280;text-transform:uppercase">Kelembaban</div>
        <div style="font-size:14px;font-weight:700;color:#15803d">${l.kelembaban||0}%</div>
      </div>
      <div style="background:#f0fdf4;border-radius:8px;padding:8px">
        <div style="font-size:9px;font-weight:700;color:#6b7280;text-transform:uppercase">pH Tanah</div>
        <div style="font-size:14px;font-weight:700;color:#15803d">${l.ph||'-'}</div>
      </div>
      <div style="background:#f0fdf4;border-radius:8px;padding:8px">
        <div style="font-size:9px;font-weight:700;color:#6b7280;text-transform:uppercase">Suhu</div>
        <div style="font-size:14px;font-weight:700;color:#15803d">${l.suhu||28}°C</div>
      </div>
      <div style="background:#f0fdf4;border-radius:8px;padding:8px">
        <div style="font-size:9px;font-weight:700;color:#6b7280;text-transform:uppercase">Laba</div>
        <div style="font-size:13px;font-weight:700;color:${laba>=0?'#16a34a':'#dc2626'}">${laba>=0?'+':'-'}Rp${Math.abs(laba/1000000).toFixed(1)}jt</div>
      </div>
    </div>
    <div style="font-size:10px;color:#9ca3af;margin-bottom:8px">📍 ${l.lat?.toFixed(5)}, ${l.lng?.toFixed(5)}</div>
    <div style="display:flex;gap:6px">
      <a href="${l.maps_url||'#'}" target="_blank" style="flex:1;text-align:center;padding:6px;background:#16a34a;color:#fff;border-radius:6px;font-size:11px;font-weight:600;text-decoration:none">🗺️ Buka Maps</a>
      <button onclick="closeModal();navigate('lahan')" style="flex:1;padding:6px;background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer">📋 Detail</button>
    </div>
  </div>`;
}

// ─── Render Page ──────────────────────────────────────────────────────────────
async function renderPeta() {
  const { data: listLahan } = await SB.lahan.fetch();
  window._CACHE_LAHAN = listLahan || [];
  
  const lahanDgKoord = window._CACHE_LAHAN.filter(l => l.lat && l.lng);
  return `
  <div class="page-header">
    <div>
      <div class="page-title">Peta Lahan GIS</div>
      <div class="page-subtitle">Visualisasi interaktif seluruh lokasi blok perkebunan Anda.</div>
    </div>
    <div class="page-actions">
      <button class="btn btn-secondary" onclick="petaFitAll()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
        Fit Semua
      </button>
      <button class="btn btn-primary" onclick="openLahanModal();navigate('lahan')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Tambah Blok
      </button>
    </div>
  </div>

  <!-- Legend + Stats bar -->
  <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:16px;padding:14px 18px;background:var(--bg-card);border:1px solid var(--border-card);border-radius:var(--border-radius)">
    <div style="font-size:12px;font-weight:600;color:var(--text-secondary)">Status:</div>
    ${Object.entries(STATUS_COLORS).map(([s,c])=>`
      <div style="display:flex;align-items:center;gap:6px">
        <div style="width:12px;height:12px;border-radius:50%;background:${c}"></div>
        <span style="font-size:12px;color:var(--text-secondary)">${s}</span>
      </div>`).join('')}
    <div style="margin-left:auto;display:flex;gap:16px">
      ${[
        { label:'Total Lahan', val: window._CACHE_LAHAN.length+' blok' },
        { label:'Terpetakan',  val: lahanDgKoord.length+' blok' },
        { label:'Total Luas',  val: window._CACHE_LAHAN.reduce((a,l)=>a+(l.luas||0),0)+' ha' },
      ].map(i=>`<div style="text-align:center"><div style="font-size:10px;color:var(--text-muted);font-weight:600;text-transform:uppercase">${i.label}</div><div style="font-size:15px;font-weight:700;color:var(--text-primary)">${i.val}</div></div>`).join('')}
    </div>
  </div>

  <!-- Main layout: map + sidebar -->
  <div style="display:flex;flex-wrap:wrap;gap:18px;align-items:flex-start">

    <!-- Map Container -->
    <div style="flex:1 1 320px;min-width:0;border-radius:var(--border-radius);overflow:hidden;border:1px solid var(--border-card);box-shadow:var(--shadow-card)">
      <div id="leafletMap" style="height:560px;width:100%;background:#1a2520"></div>
    </div>

    <!-- Lahan List Panel -->
    <div style="flex:1 1 300px;display:flex;flex-direction:column;gap:10px;max-height:576px;overflow-y:auto;min-width:0">
      <div style="font-size:12px;font-weight:600;color:var(--text-muted);padding:0 4px;letter-spacing:0.5px;text-transform:uppercase">Daftar Blok (${window._CACHE_LAHAN.length})</div>
      ${window._CACHE_LAHAN.map((l,i) => {
        const hasCoord = !!(l.lat && l.lng);
        const statusColor = STATUS_COLORS[l.status] || '#22c55e';
        return `
        <div class="card" style="padding:14px;cursor:pointer;transition:all 0.2s;border-left:3px solid ${statusColor}" onclick="petaFlyTo('${l.id}')" title="Klik untuk ke lokasi di peta">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="font-size:24px">${l.emoji||'♦️'}</div>
            <div style="flex:1;min-width:0">
              <div style="font-weight:600;font-size:13px">${l.nama}</div>
              <div style="font-size:11px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${l.tanaman||'-'} · ${l.luas||0}ha</div>
            </div>
            <span style="font-size:9px;padding:2px 6px;border-radius:99px;background:${statusColor}22;color:${statusColor};font-weight:700;flex-shrink:0">${l.status||'-'}</span>
          </div>
          <div style="margin-top:8px;font-size:10px;color:${hasCoord?'var(--green-400)':'var(--text-muted)'}">
            ${hasCoord
              ? `📍 ${l.lat.toFixed(4)}, ${l.lng.toFixed(4)}`
              : `⚠️ Koordinat belum diset`}
          </div>
          ${hasCoord ? `
          <div style="display:flex;gap:6px;margin-top:8px">
            <button class="btn btn-sm btn-secondary" style="flex:1;justify-content:center;font-size:10px" onclick="event.stopPropagation();petaFlyTo('${l.id}')">🎯 Goto</button>
            <a href="${l.maps_url||'#'}" target="_blank" class="btn btn-sm btn-secondary" style="flex:1;justify-content:center;font-size:10px;text-decoration:none">🗺️ Maps</a>
          </div>` : `
          <button class="btn btn-sm btn-secondary" style="width:100%;justify-content:center;font-size:10px;margin-top:8px" onclick="event.stopPropagation();editLahan('${l.id}')">📌 Set Koordinat</button>`}
        </div>`;
      }).join('')}
    </div>
  </div>`;
}

// ─── Init Leaflet Map ─────────────────────────────────────────────────────────
async function initPetaMap() {
  // Wait for DOM
  const el = document.getElementById('leafletMap');
  if (!el) return;

  const [{ data: listLahan }, { data: listBiaya }, { data: listPanen }] = await Promise.all([
    SB.lahan.fetch(),
    SB.biaya.fetch(),
    SB.panen.fetch()
  ]);

  const arrLahan = listLahan || [];
  const arrBiaya = listBiaya || [];
  const arrPanen = listPanen || [];

  // Destroy previous instance if any
  if (_map) { try { _map.remove(); } catch(e){} _map = null; _markers = []; }

  // Create map centred on Indonesia
  _map = L.map('leafletMap', {
    center: [-2.5, 112],
    zoom: 5,
    zoomControl: true,
    attributionControl: true,
  });

  // Tile layer — dark style via CartoDB
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© <a href="https://carto.com/">CARTO</a> © <a href="https://www.openstreetmap.org/">OSM</a>',
    maxZoom: 19,
    subdomains: 'abcd',
  }).addTo(_map);

  // Add circle for each lahan
  arrLahan.forEach(l => {
    if (!l.lat || !l.lng) return;

    const color  = STATUS_COLORS[l.status] || '#22c55e';
    const radius = Math.max((l.luas||0) * 80, 2000); // radius proportional to luas

    // Filled circle (represents plot area)
    L.circle([l.lat, l.lng], {
      color,
      fillColor: color,
      fillOpacity: 0.15,
      weight: 2,
      radius,
    }).addTo(_map);

    // Custom icon marker
    const marker = L.marker([l.lat, l.lng], { icon: createMarkerIcon(l) })
      .addTo(_map)
      .bindPopup(buildPopup(l, arrBiaya, arrPanen), { maxWidth: 280, className: 'agro-popup' });

    _markers.push({ id: l.id, marker, lat: l.lat, lng: l.lng });
  });

  // Fit bounds if we have markers
  if (_markers.length) {
    const group = L.featureGroup(_markers.map(m => m.marker));
    _map.fitBounds(group.getBounds().pad(0.3));
  }
}

// ─── Map Controls ─────────────────────────────────────────────────────────────
function petaFlyTo(lahanId) {
  const l = (window._CACHE_LAHAN||[]).find(x => String(x.id) === String(lahanId));
  if (!l?.lat || !_map) return;
  _map.flyTo([l.lat, l.lng], 14, { duration: 1.2 });
  const m = _markers.find(x => String(x.id) === String(lahanId));
  if (m) setTimeout(() => m.marker.openPopup(), 1300);
}

function petaFitAll() {
  if (!_map || !_markers.length) return;
  const group = L.featureGroup(_markers.map(m => m.marker));
  _map.fitBounds(group.getBounds().pad(0.3));
}

// ─── Mini Map on Dashboard ────────────────────────────────────────────────────
let _miniMap = null;

async function initDashboardMiniMap() {
  const el = document.getElementById('dashboardMiniMap');
  if (!el) return;
  
  const { data: listLahan } = await SB.lahan.fetch();
  const arrLahan = listLahan || [];

  if (_miniMap) { try { _miniMap.remove(); } catch(e){} _miniMap = null; }

  _miniMap = L.map('dashboardMiniMap', {
    center: [-2.5, 112],
    zoom: 4,
    zoomControl: false,
    attributionControl: false,
    dragging: false,
    scrollWheelZoom: false,
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 18, subdomains: 'abcd',
  }).addTo(_miniMap);

  arrLahan.forEach(l => {
    if (!l.lat || !l.lng) return;
    const color = STATUS_COLORS[l.status] || '#22c55e';
    L.circleMarker([l.lat, l.lng], {
      radius: 8, color, fillColor: color, fillOpacity: 0.85, weight: 2,
    }).addTo(_miniMap)
      .bindTooltip(`${l.emoji||'♦️'} ${l.nama} — ${l.tanaman||'-'}`, { permanent: false, direction: 'top' });
  });
}

// ─── Popup Leaflet Custom CSS ─────────────────────────────────────────────────
(function injectLeafletStyle() {
  if (document.getElementById('agro-leaflet-style')) return;
  const style = document.createElement('style');
  style.id = 'agro-leaflet-style';
  style.textContent = `
    .leaflet-container { font-family: 'Inter', sans-serif !important; background: #0a0f0d; }
    .leaflet-popup-content-wrapper { border-radius: 14px !important; padding: 0 !important; box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important; border: 1px solid rgba(34,197,94,0.2) !important; overflow: hidden; }
    .leaflet-popup-content { margin: 14px !important; }
    .leaflet-popup-tip-container { display: none; }
    .leaflet-control-attribution { font-size: 9px !important; background: rgba(0,0,0,0.5) !important; color: #555 !important; }
    .leaflet-control-attribution a { color: #888 !important; }
    .leaflet-bar a { background: #141d16 !important; color: #4ade80 !important; border-color: rgba(34,197,94,0.3) !important; }
    .leaflet-bar a:hover { background: #1a2520 !important; }
    #leafletMap, #dashboardMiniMap { cursor: crosshair; }
  `;
  document.head.appendChild(style);
})();
