/* =============================================
   AgroSmart — Page: Tanaman, Lahan, Karyawan
   ============================================= */

/* ---- TANAMAN ---- */
async function renderTanaman() {
  const { data: listTanaman } = await SB.tanaman.fetch();
  
  return `
  <div class="page-header">
    <div>
      <div class="page-title">Manajemen Tanaman</div>
      <div class="page-subtitle">Kelola seluruh jenis tanaman di perkebunan Anda.</div>
    </div>
     <div class="page-actions">
      <select class="form-control" style="width:160px" onchange="filterTanaman(this.value)">
        <option value="">Semua Kategori</option>
        <option>Palma</option><option>Lateks</option><option>Buah</option>
        <option>Gula</option><option>Umbi</option><option>Serealia</option>
      </select>
      ${canAccess('tanaman', 'add') ? `
      <button class="btn btn-primary" onclick="openTanamanModal()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Tambah Tanaman
      </button>` : ''}
    </div>
  </div>
  <div class="grid-auto" id="tanamanGrid">
    ${(listTanaman || []).map(t => tanamanCard(t)).join('')}
  </div>`;
}

function tanamanCard(t) {
  const statusColor = t.status === 'Aktif' ? 'badge-green' : t.status === 'Panen' ? 'badge-blue' : 'badge-yellow';
  // lahan could be comma-separated string or array
  const lahanList = Array.isArray(t.lahan)
    ? t.lahan
    : (t.lahan ? t.lahan.split(',').map(x => x.trim()).filter(Boolean) : []);
  return `
  <div class="tanaman-card">
    <div class="tanaman-img">${t.emoji}</div>
    <div class="tanaman-body">
      <div class="tanaman-name">${t.nama}</div>
      <div class="tanaman-latin">${t.latin}</div>
      <div class="tanaman-meta">
        <span class="badge ${statusColor}"><span class="badge-dot"></span>${t.status}</span>
        <span class="badge badge-gray">${t.kategori}</span>
      </div>
      <!-- Lahan badges -->
      <div style="display:flex;flex-wrap:wrap;gap:4px;margin:6px 0 10px">
        ${lahanList.length
          ? lahanList.map(l => `<span class="badge badge-green" style="font-size:10px">🌱 ${l}</span>`).join('')
          : `<span style="font-size:11px;color:var(--text-muted)">Belum ada lahan</span>`}
      </div>
      <div class="grid-3" style="gap:8px;margin-bottom:12px">
        <div><div style="font-size:10px;color:var(--text-muted);font-weight:600">LUAS</div><div style="font-size:13px;font-weight:600">${t.luas} ha</div></div>
        <div><div style="font-size:10px;color:var(--text-muted);font-weight:600">UMUR</div><div style="font-size:13px;font-weight:600">${t.umur}</div></div>
        <div><div style="font-size:10px;color:var(--text-muted);font-weight:600">HASIL</div><div style="font-size:13px;font-weight:600">${(t.hasil_kg||0) < 1000 ? (t.hasil_kg||0).toFixed(0)+'kg' : ((t.hasil_kg||0)/1000).toFixed(1)+'t'}</div></div>
      </div>
      <div class="tanaman-footer">
        <span style="font-size:11px;color:var(--text-muted)">💡 ${t.catatan||''}</span>
        <div style="display:flex;gap:6px">
          ${canAccess('tanaman', 'edit') ? `<button class="btn btn-sm btn-secondary" onclick="editTanaman('${t.id}')">Edit</button>` : ''}
          ${canAccess('tanaman', 'delete') ? `<button class="btn btn-sm btn-danger" onclick="deleteTanaman('${t.id}')">Hapus</button>` : ''}
        </div>
      </div>
    </div>
  </div>`;
}

async function filterTanaman(kategori) {
  const grid = document.getElementById('tanamanGrid');
  if (!grid) return;
  const { data: listTanaman } = await SB.tanaman.fetch();
  const filtered = kategori && listTanaman ? listTanaman.filter(t => t.kategori === kategori) : (listTanaman || []);
  grid.innerHTML = filtered.map(t => tanamanCard(t)).join('');
}

async function openTanamanModal(id) {
  const { data: listTanaman } = await SB.tanaman.fetch();
  const { data: listLahan } = await SB.lahan.fetch();
  
  const t = id ? (listTanaman||[]).find(x => String(x.id) === String(id)) : null;
  const selectedLahan = Array.isArray(t?.lahan)
    ? t.lahan
    : (t?.lahan && t.lahan !== '-' ? t.lahan.split(',').map(x => x.trim()).filter(Boolean) : []);

  openModal(t ? 'Edit Tanaman' : 'Tambah Tanaman Baru', `
    <div class="form-row">
      <div class="form-group"><label class="form-label">Nama Tanaman</label><input class="form-control" id="f-tNama" placeholder="cth. Kelapa Sawit" value="${t?.nama||''}"></div>
      <div class="form-group"><label class="form-label">Nama Latin</label><input class="form-control" id="f-tLatin" placeholder="cth. Elaeis guineensis" value="${t?.latin||''}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Kategori</label>
        <select class="form-control" id="f-tKat">
          ${['Palma','Lateks','Buah','Gula','Umbi','Serealia'].map(k=>`<option ${t?.kategori===k?'selected':''}>${k}</option>`).join('')}
        </select>
      </div>
      <div style="flex:1"><label class="form-label">Satuan</label>
        <select class="form-control" id="f-tSatuan">
          ${(window._DYNAMIC_SATS||[]).map(s => `<option ${t?.satuan===s.name?'selected':''}>${s.name}</option>`).join('')}
          ${!(window._DYNAMIC_SATS||[]).some(s=>s.name==='hektar') ? '<option>hektar</option>' : ''}
          ${!(window._DYNAMIC_SATS||[]).some(s=>s.name==='m2') ? '<option>m2</option>' : ''}
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Luas (ha)</label><input class="form-control" type="number" id="f-tLuas" value="${t?.luas||''}"></div>
      <div class="form-group"><label class="form-label">Umur Tanaman</label><input class="form-control" id="f-tUmur" placeholder="cth. 5 Tahun" value="${t?.umur||''}"></div>
    </div>

    <!-- Pilih Blok Lahan (multi-chip) -->
    <div style="border-top:1px solid var(--border);margin:14px 0 12px;padding-top:14px">
      <div style="font-size:12px;font-weight:700;color:var(--text-secondary);letter-spacing:0.5px;margin-bottom:10px">📍 PENEMPATAN BLOK LAHAN</div>
      ${(!listLahan || listLahan.length === 0)
        ? `<div style="font-size:12px;color:var(--text-muted);padding:10px">Belum ada blok lahan. Tambah lahan dulu.</div>`
        : `<div style="display:flex;flex-wrap:wrap;gap:8px" id="f-tLahanChips">
            ${listLahan.map(l => {
              const on = selectedLahan.includes(l.nama);
              return `<div class="tlc-chip${on?' tlc-on':''}" data-val="${l.nama}" onclick="toggleLahanChip(this)">
                <span class="tlc-dot"></span>${l.nama}
                <span style="font-size:10px;opacity:0.6;margin-left:3px">${l.luas}ha</span>
              </div>`;
            }).join('')}
          </div>`}
      <div style="font-size:11px;color:var(--text-muted);margin-top:8px">Klik chip untuk memilih/hapus blok. Bisa pilih lebih dari satu.</div>
    </div>

    <div class="form-group"><label class="form-label">Catatan Pemeliharaan</label><input class="form-control" id="f-tCatatan" value="${t?.catatan||''}"></div>
  `, async () => {
    const nama = document.getElementById('f-tNama').value.trim();
    if (!nama) { showToast('danger','Gagal','Nama tanaman tidak boleh kosong.'); return; }

    const chips = document.querySelectorAll('#f-tLahanChips .tlc-chip.tlc-on');
    const lahanArr = Array.from(chips).map(c => c.dataset.val);
    const lahanStr = lahanArr.join(', ') || '-';

    const data = {
      nama, 
      latin: document.getElementById('f-tLatin').value,
      kategori: document.getElementById('f-tKat').value,
      lahan: lahanStr,
      luas: +document.getElementById('f-tLuas').value || 0,
      umur: document.getElementById('f-tUmur').value || 'Baru',
      status: document.getElementById('f-tStatus').value,
      catatan: document.getElementById('f-tCatatan').value,
      emoji: t?.emoji || '🌱',
      hasil_kg: t?.hasil_kg || 0,
      satuan: document.getElementById('f-tSatuan').value,
    };
    
    // user_id handled by SB config _withUserId

    if (t) {
      await SB.tanaman.update(t.id, data);
      showToast('success','Berhasil','Data tanaman diperbarui.');
    } else {
      await SB.tanaman.insert(data);
      showToast('success','Berhasil','Tanaman baru ditambahkan.');
    }
    
    // Note: We skip complex syncLahanTanaman for now to keep it simple, 
    // relying on the UI to just read the comma separated strings.
    navigate('tanaman');
  });
}
function editTanaman(id) { openTanamanModal(id); }
async function deleteTanaman(id) {
  if(!confirm('Yakin ingin menghapus tanaman ini?')) return;
  await SB.tanaman.remove(id);
  showToast('success','Dihapus','Data tanaman telah dihapus.');
  navigate('tanaman');
}

// Toggle chip helper (tanaman modal – lahan chips)
function toggleLahanChip(el) {
  el.classList.toggle('tlc-on');
}

// Sync all lahan.tanaman strings from current DB.tanaman assignments
function syncLahanTanaman() {
  DB.lahan.forEach(l => {
    const list = DB.tanaman
      .filter(t => {
        const arr = Array.isArray(t.lahan) ? t.lahan
          : (t.lahan && t.lahan !== '-' ? t.lahan.split(',').map(x => x.trim()) : []);
        return arr.includes(l.nama);
      })
      .map(t => t.nama);
    l.tanaman = list.join(', ') || '-';
  });
}

/* ---- LAHAN ---- */
async function renderLahan() {
  const { data: listLahan } = await SB.lahan.fetch();
  return `
  <div class="page-header">
    <div>
      <div class="page-title">Manajemen Lahan</div>
      <div class="page-subtitle">Pantau kondisi dan status seluruh blok lahan perkebunan.</div>
    </div>
    <div class="page-actions">
      ${canAccess('lahan', 'add') ? `
      <button class="btn btn-primary" onclick="openLahanModal()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Tambah Blok
      </button>` : ''}
    </div>
  </div>
  <div class="grid-auto">
    ${(listLahan || []).map(l => lahanCard(l)).join('')}
  </div>`;
}

function lahanCard(l) {
  const statusColor = l.status === 'Aktif' ? 'badge-green' : 'badge-yellow';
  const kelColor = l.kelembaban < 50 ? '#ef4444' : '#22c55e';
  const hasCoord = !!(l.lat && l.lng);
  return `
  <div class="plot-card">
    <div class="plot-header">
      <div>
        <div class="plot-name">${l.nama}</div>
        <div class="plot-location">📍 ${l.lokasi}</div>
      </div>
      <span class="badge ${statusColor}"><span class="badge-dot"></span>${l.status}</span>
    </div>
    <div class="plot-map">${l.emoji}</div>
    <div style="margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-muted);margin-bottom:4px">
        <span>💧 Kelembaban</span><span style="color:${kelColor};font-weight:600">${l.kelembaban}%</span>
      </div>
      <div class="progress-wrap"><div class="progress-bar" style="width:${l.kelembaban}%;background:linear-gradient(90deg,${kelColor},${l.kelembaban<50?'#f87171':'#34d399'})"></div></div>
    </div>
    <div class="plot-stats">
      <div><div class="plot-stat-label">Luas</div><div class="plot-stat-val">${l.luas} ha</div></div>
      <div><div class="plot-stat-label">pH Tanah</div><div class="plot-stat-val">${l.ph}</div></div>
      <div><div class="plot-stat-label">Suhu</div><div class="plot-stat-val">${l.suhu}°C</div></div>
    </div>
    <!-- Koordinat row -->
    <div style="margin-top:12px;padding:10px 12px;background:var(--bg-secondary);border-radius:8px;border:1px solid ${hasCoord?'rgba(34,197,94,0.2)':'rgba(255,255,255,0.06)'}">
      ${hasCoord
        ? `<div style="display:flex;align-items:center;justify-content:space-between">
            <div>
              <div style="font-size:9px;font-weight:700;color:var(--text-muted);letter-spacing:0.5px;text-transform:uppercase">📡 Koordinat GPS</div>
              <div style="font-size:12px;font-weight:600;color:var(--emerald-400);margin-top:2px;font-family:monospace">${l.lat.toFixed(5)}, ${l.lng.toFixed(5)}</div>
            </div>
            <div style="display:flex;gap:4px">
              <a href="${l.maps_url}" target="_blank" class="btn btn-sm btn-secondary" style="padding:4px 8px;font-size:10px;text-decoration:none">🗺️</a>
              <button class="btn btn-sm btn-secondary" style="padding:4px 8px;font-size:10px" onclick="navigate('peta')">📌</button>
            </div>
          </div>`
        : `<div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:11px;color:var(--amber-400)">⚠️ Koordinat belum diset</span>
            <button class="btn btn-sm btn-secondary" style="margin-left:auto;font-size:10px;padding:4px 8px" onclick="editLahan('${l.id}')">📌 Set</button>
          </div>`}
    </div>
    <!-- tanaman pills row -->
    <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border-card)">
      <div style="font-size:10px;font-weight:700;color:var(--text-muted);letter-spacing:0.5px;margin-bottom:6px">TANAMAN DI LAHAN INI</div>
      <div style="display:flex;flex-wrap:wrap;gap:5px;min-height:22px">
        ${(l.tanaman && l.tanaman !== '-')
          ? l.tanaman.split(',').map(n => n.trim()).filter(Boolean).map(n =>
              `<span class="badge badge-green" style="font-size:10px">🌿 ${n}</span>`).join('')
          : `<span style="font-size:11px;color:var(--text-muted)">Belum ada tanaman</span>`}
      </div>
    </div>
    <div style="margin-top:12px;display:flex;align-items:center;justify-content:flex-end;gap:6px">
      ${canAccess('lahan', 'edit') ? `<button class="btn btn-sm btn-secondary" onclick="editLahan('${l.id}')">Edit</button>` : ''}
      ${canAccess('lahan', 'delete') ? `<button class="btn btn-sm btn-danger" onclick="deleteLahan('${l.id}')">Hapus</button>` : ''}
    </div>
  </div>`;
}

async function openLahanModal(id) {
  const { data: listLahan } = await SB.lahan.fetch();
  const { data: listTanaman } = await SB.tanaman.fetch();
  
  const l = id ? (listLahan||[]).find(x => String(x.id) === String(id)) : null;
  
  // Tanaman currently assigned to this lahan
  const tanamanDiLahan = (listTanaman || [])
    .filter(t => {
      const arr = Array.isArray(t.lahan) ? t.lahan
        : (t.lahan && t.lahan !== '-' ? t.lahan.split(',').map(x => x.trim()) : []);
      return arr.includes(l?.nama || '');
    })
    .map(t => t.nama);

  openModal(l ? 'Edit Blok Lahan' : 'Tambah Blok Lahan Baru', `
    <div class="form-row">
      <div class="form-group"><label class="form-label">Nama Blok</label><input class="form-control" id="f-lNama" value="${l?.nama||''}" placeholder="cth. Blok I"></div>
      <div class="form-group"><label class="form-label">Lokasi / Desa</label><input class="form-control" id="f-lLok" value="${l?.lokasi||''}" placeholder="cth. Desa Subur, Kalimantan"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Luas (ha)</label><input class="form-control" type="number" id="f-lLuas" value="${l?.luas||''}"></div>
      <div class="form-group"><label class="form-label">Jenis Lahan</label>
        <select class="form-control" id="f-lJenis">
          ${['Perkebunan','Pertanian','Agrowisata'].map(j =>`<option ${l?.jenis===j?'selected':''}>${j}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">pH Tanah</label><input class="form-control" type="number" step="0.1" id="f-lPh" value="${l?.ph||'6.5'}"></div>
      <div class="form-group"><label class="form-label">Status</label>
        <select class="form-control" id="f-lStatus">
          ${['Aktif','Pemeliharaan','Tidak Aktif'].map(s =>`<option ${l?.status===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </div>
    </div>

    <!-- Pilih Tanaman (multi-chip) -->
    <div style="border-top:1px solid var(--border);margin:14px 0 12px;padding-top:14px">
      <div style="font-size:12px;font-weight:700;color:var(--text-secondary);letter-spacing:0.5px;margin-bottom:10px">🌿 TANAMAN DI BLOK INI</div>
      ${(!listTanaman || listTanaman.length === 0)
        ? `<div style="font-size:12px;color:var(--text-muted);padding:10px">Belum ada tanaman terdaftar. Tambah tanaman dulu.</div>`
        : `<div style="display:flex;flex-wrap:wrap;gap:8px" id="f-lTanamanChips">
            ${listTanaman.map(t => {
              const on = tanamanDiLahan.includes(t.nama);
              return `<div class="tlc-chip${on?' tlc-on':''}" data-val="${t.nama}" onclick="toggleLahanChip(this)">
                <span class="tlc-dot"></span>${t.nama || '-'}
                ${t.kategori ? `<span style="font-size:10px;opacity:0.6;margin-left:2px">(${t.kategori})</span>` : ''}
              </div>`;
            }).join('')}
          </div>
          <style>.tlc-chip{display:inline-flex;align-items:center;gap:6px;padding:7px 13px;border-radius:99px;border:1.5px solid var(--border-strong);background:var(--bg-input);color:var(--text-secondary);font-size:12px;font-weight:600;cursor:pointer;transition:all .2s;user-select:none}.tlc-chip.tlc-on{border-color:var(--accent-primary);background:var(--accent-glow-soft);color:var(--text-accent)}.tlc-dot{width:8px;height:8px;border-radius:50%;background:var(--border-strong);flex-shrink:0;transition:background .2s}.tlc-chip.tlc-on .tlc-dot{background:var(--accent-primary)}</style>`}
      <div style="font-size:11px;color:var(--text-muted);margin-top:8px">Klik chip untuk assign/hapus tanaman. Otomatis tersinkronisasi ke halaman Tanaman.</div>
    </div>

    <!-- Koordinat GPS Section -->
    <div style="border-top:1px solid var(--border);margin:14px 0 12px;padding-top:14px">
      <div style="font-size:12px;font-weight:700;color:var(--text-secondary);letter-spacing:0.5px;margin-bottom:12px">📡 KOORDINAT GPS LAHAN</div>
      <button type="button" class="btn btn-secondary" style="width:100%;justify-content:center;margin-bottom:12px" onclick="lahanGetGPS()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
        📍 Ambil Lokasi Saat Ini (GPS)
      </button>
      <div id="f-lGpsStatus" style="font-size:11px;color:var(--text-muted);text-align:center;margin-bottom:10px;min-height:16px"></div>
      <div class="form-group">
        <label class="form-label">Atau Paste Link Google Maps</label>
        <div style="display:flex;gap:8px">
          <input class="form-control" id="f-lMapsUrl" placeholder="https://maps.google.com/?q=... atau -0.5238,113.9213" value="${l?.maps_url||''}" oninput="lahanParseUrl()" style="flex:1">
          <button type="button" class="btn btn-secondary" onclick="lahanParseUrl(true)" style="flex-shrink:0;padding:0 12px">✔ Parse</button>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Latitude</label><input class="form-control" type="number" step="0.000001" id="f-lLat" placeholder="cth. -0.5238" value="${l?.lat||''}"></div>
        <div class="form-group"><label class="form-label">Longitude</label><input class="form-control" type="number" step="0.000001" id="f-lLng" placeholder="cth. 113.9213" value="${l?.lng||''}"></div>
      </div>
    </div>
  `, async () => {
    const nama = document.getElementById('f-lNama').value.trim();
    if (!nama) { showToast('danger','Gagal','Nama blok tidak boleh kosong.'); return; }
    const lat = parseFloat(document.getElementById('f-lLat').value) || null;
    const lng = parseFloat(document.getElementById('f-lLng').value) || null;
    const maps_url = lat && lng ? `https://maps.google.com/?q=${lat},${lng}` : (document.getElementById('f-lMapsUrl').value || null);

    const selectedChips = document.querySelectorAll('#f-lTanamanChips .tlc-chip.tlc-on');
    const selectedTanaman = Array.from(selectedChips).map(c => c.dataset.val);
    const tanamanStr = selectedTanaman.join(', ') || '-';

    const data = { 
      nama, 
      lokasi: document.getElementById('f-lLok').value, 
      luas: +document.getElementById('f-lLuas').value || 0, 
      jenis: document.getElementById('f-lJenis').value, 
      status: document.getElementById('f-lStatus').value, 
      tanaman: tanamanStr, 
      ph: +document.getElementById('f-lPh').value || 6.5, 
      lat, 
      lng, 
      maps_url,
      suhu: l?.suhu || 28,
      kelembaban: l?.kelembaban || 75,
      emoji: l?.emoji || '📍'
    };
    
    // user_id handled by SB config _withUserId

    if (l) {
      await SB.lahan.update(l.id, data);
      showToast('success','Berhasil','Data lahan diperbarui.');
    } else {
      await SB.lahan.insert(data);
      showToast('success','Berhasil','Blok lahan ditambahkan.');
    }
    
    // We update tanaman records to match selected ones async (Best Effort Sync)
    // Find all target tanaman from DB based on selection, update their lahan array
    if (listTanaman && listTanaman.length > 0) {
      for (let i = 0; i < listTanaman.length; i++) {
        const t = listTanaman[i];
        let arr = Array.isArray(t.lahan) ? [...t.lahan] : (t.lahan && t.lahan !== '-' ? t.lahan.split(',').map(x => x.trim()) : []);
        let changed = false;
        
        if (selectedTanaman.includes(t.nama)) {
          if (!arr.includes(nama)) {
            arr.push(nama);
            changed = true;
          }
        } else {
          const oldLen = arr.length;
          arr = arr.filter(x => x !== (l?.nama || nama));
          if (arr.length !== oldLen) changed = true;
        }
        
        // If the name changed, rename in references
        if (l && l.nama !== nama) {
           const idx = arr.indexOf(l.nama);
           if (idx !== -1) { arr[idx] = nama; changed = true; }
        }
        
        if (changed) {
          await SB.tanaman.update(t.id, { lahan: arr.join(', ') || '-' });
        }
      }
    }

    navigate('lahan');
  });
}

// ─── GPS: get current position ────────────────────────────────────────────────
function lahanGetGPS() {
  const status = document.getElementById('f-lGpsStatus');
  if (!navigator.geolocation) {
    if (status) status.textContent = '⚠️ Browser tidak mendukung geolocation.';
    return;
  }
  if (status) status.innerHTML = '<span style="color:var(--amber-400)">⏳ Mengambil lokasi GPS…</span>';
  navigator.geolocation.getCurrentPosition(
    pos => {
      const lat = parseFloat(pos.coords.latitude.toFixed(6));
      const lng = parseFloat(pos.coords.longitude.toFixed(6));
      const acc = Math.round(pos.coords.accuracy);
      document.getElementById('f-lLat').value = lat;
      document.getElementById('f-lLng').value = lng;
      document.getElementById('f-lMapsUrl').value = `https://maps.google.com/?q=${lat},${lng}`;
      if (status) status.innerHTML = `<span style="color:var(--green-400)">✅ Berhasil! ${lat}, ${lng} (akurasi ±${acc}m)</span>`;
      showToast('success','Lokasi Ditemukan',`Lat: ${lat}, Lng: ${lng} — Akurasi ±${acc}m`);
    },
    err => {
      const msg = err.code === 1 ? 'Akses lokasi ditolak. Izinkan di browser.' : 'Gagal mendapat lokasi GPS.';
      if (status) status.innerHTML = `<span style="color:var(--red-400)">❌ ${msg}</span>`;
      showToast('danger','GPS Gagal', msg);
    },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
  );
}

// ─── Parse Maps URL to fill lat/lng fields ────────────────────────────────────
function lahanParseUrl(showFeedback) {
  const urlInput = document.getElementById('f-lMapsUrl');
  if (!urlInput) return;
  const result = parseMapsUrl(urlInput.value);
  if (result) {
    document.getElementById('f-lLat').value = result.lat;
    document.getElementById('f-lLng').value = result.lng;
    const st = document.getElementById('f-lGpsStatus');
    if (st) st.innerHTML = `<span style="color:var(--green-400)">✅ Terdeteksi: ${result.lat}, ${result.lng}</span>`;
    if (showFeedback) showToast('success','URL Diparse',`Lat: ${result.lat}, Lng: ${result.lng}`);
  } else if (showFeedback) {
    const st = document.getElementById('f-lGpsStatus');
    if (st) st.innerHTML = `<span style="color:var(--red-400)">❌ Format URL tidak dikenali. Coba format: lat,lng</span>`;
    showToast('warning','Gagal Parse','Format URL tidak dikenali.');
  }
}

function editLahan(id) { openLahanModal(id); }
async function deleteLahan(id) { 
  if(!confirm('Yakin hapus blok lahan ini?')) return;
  await SB.lahan.remove(id); 
  showToast('success','Dihapus','Blok lahan dihapus.'); 
  navigate('lahan'); 
}

/* ---- KARYAWAN ---- */
async function renderKaryawan() {
  const { data: listKaryawan } = await SB.karyawan.fetch();
  const kArr = listKaryawan || [];
  
  const total = kArr.length;
  const aktif = kArr.filter(k=>k.status==='Aktif').length;
  const avgKehadiran = total ? Math.round(kArr.reduce((a,k)=>a+(k.kehadiran||100),0)/total) : 0;
  const totalGaji = kArr.reduce((a,k)=>a+(k.gaji||0),0) / 1000000;

  return `
  <div class="page-header">
    <div>
      <div class="page-title">Manajemen Karyawan</div>
      <div class="page-subtitle">Kelola data dan kehadiran seluruh karyawan perkebunan.</div>
    </div>
    <div class="page-actions">
      ${canAccess('karyawan', 'add') ? `
      <button class="btn btn-primary" onclick="openKaryawanModal()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Tambah Karyawan
      </button>` : ''}
    </div>
  </div>
  <div style="margin-bottom:22px">
    <div class="stats-grid">
      <div class="stat-card" style="--card-accent:#22c55e">
        <div class="stat-header"><span class="stat-label">Total Karyawan</span><div class="stat-icon-wrapper">👥</div></div>
        <div class="stat-value">${total}</div>
      </div>
      <div class="stat-card" style="--card-accent:#10b981">
        <div class="stat-header"><span class="stat-label">Karyawan Aktif</span><div class="stat-icon-wrapper">✅</div></div>
        <div class="stat-value">${aktif}</div>
      </div>
      <div class="stat-card" style="--card-accent:#f59e0b">
        <div class="stat-header"><span class="stat-label">Rata-rata Kehadiran</span><div class="stat-icon-wrapper">📋</div></div>
        <div class="stat-value">${avgKehadiran}<span class="stat-unit">%</span></div>
      </div>
      <div class="stat-card" style="--card-accent:#3b82f6">
        <div class="stat-header"><span class="stat-label">Total Gaji/bln</span><div class="stat-icon-wrapper">💵</div></div>
        <div class="stat-value">${totalGaji.toFixed(0)}<span class="stat-unit">jt</span></div>
      </div>
    </div>
  </div>
  <div class="card">
    <div class="table-wrapper">
      <table>
        <thead><tr><th>Karyawan</th><th>Jabatan</th><th>Divisi</th><th>Tugas Saat Ini</th><th>Kehadiran</th><th>Gaji</th><th>Status</th><th>Aksi</th></tr></thead>
        <tbody>
          ${kArr.map(k => `
            <tr>
              <td>
                <div style="display:flex;align-items:center;gap:10px">
                  <div class="user-avatar" style="width:34px;height:34px;font-size:11px">${k.nama.split(' ').map(n=>n[0]).slice(0,2).join('')}</div>
                  <div><div style="font-weight:600">${k.nama}</div><div style="font-size:11px;color:var(--text-muted)">Bergabung ${new Date(k.bergabung).toLocaleDateString('id-ID',{year:'numeric',month:'short'})}</div></div>
                </div>
              </td>
              <td>${k.jabatan || '-'}</td>
              <td><span class="badge badge-gray">${k.divisi || '-'}</span></td>
              <td style="font-size:12px;color:var(--text-secondary)">${k.tugas || '-'}</td>
              <td>
                <div style="display:flex;align-items:center;gap:8px">
                  <div class="progress-wrap" style="width:60px;height:5px"><div class="progress-bar" style="width:${k.kehadiran||0}%"></div></div>
                  <span style="font-size:12px">${k.kehadiran||0}%</span>
                </div>
              </td>
              <td style="font-weight:600">Rp ${(k.gaji||0).toLocaleString('id-ID')}</td>
              <td><span class="badge ${(k.status||'').toLowerCase()==='aktif'?'badge-green':'badge-yellow'}">${k.status || '-'}</span></td>
              <td>
                <div style="display:flex;gap:6px">
                  ${canAccess('karyawan', 'edit') ? `<button class="btn btn-sm btn-secondary" onclick="editKaryawan('${k.id}')">Edit</button>` : ''}
                  ${canAccess('karyawan', 'delete') ? `<button class="btn btn-sm btn-danger" onclick="deleteKaryawan('${k.id}')">Hapus</button>` : ''}
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

async function openKaryawanModal(id) {
  const { data: listKaryawan } = await SB.karyawan.fetch();
  let k = null;
  // Type conversion just in case id is string/number
  if (id) {
    k = (listKaryawan||[]).find(x => String(x.id) === String(id));
  }

  openModal(k ? 'Edit Karyawan' : 'Tambah Karyawan Baru', `
    <div class="form-row">
      <div class="form-group"><label class="form-label">Nama Lengkap</label><input class="form-control" id="f-kNama" value="${k?.nama||''}" placeholder="Nama karyawan"></div>
      <div class="form-group"><label class="form-label">Jabatan</label><input class="form-control" id="f-kJab" value="${k?.jabatan||''}" placeholder="cth. Mandor Kebun"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Divisi</label>
        <select class="form-control" id="f-kDiv">
          ${['Operasional','Teknis','Administrasi','Logistik','Keuangan'].map(d=>`<option ${k?.divisi===d?'selected':''}>${d}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label class="form-label">Status</label>
        <select class="form-control" id="f-kStatus">
          ${['Aktif','Cuti','Tidak Aktif'].map(s=>`<option ${k?.status===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Gaji (Rp)</label><input class="form-control" type="number" id="f-kGaji" value="${k?.gaji||''}"></div>
      <div class="form-group"><label class="form-label">Tanggal Bergabung</label><input class="form-control" type="date" id="f-kTgl" value="${k?.bergabung||''}"></div>
    </div>
    <div class="form-group"><label class="form-label">Tugas Saat Ini</label><input class="form-control" id="f-kTugas" value="${k?.tugas||''}"></div>
  `, async () => {
    const nama = document.getElementById('f-kNama').value.trim();
    if (!nama) { showToast('danger','Gagal','Nama karyawan tidak boleh kosong.'); return; }
    
    const data = {
      nama, 
      jabatan: document.getElementById('f-kJab').value, 
      divisi: document.getElementById('f-kDiv').value, 
      status: document.getElementById('f-kStatus').value, 
      gaji: +document.getElementById('f-kGaji').value || 0, 
      bergabung: document.getElementById('f-kTgl').value || new Date().toISOString().slice(0,10),
      tugas: document.getElementById('f-kTugas').value,
      kehadiran: k?.kehadiran || 100
    };

    // user_id handled by SB config _withUserId

    if (k) {
      await SB.karyawan.update(k.id, data);
      showToast('success','Berhasil','Data karyawan diperbarui.');
    } else {
      await SB.karyawan.insert(data);
      showToast('success','Berhasil','Karyawan baru ditambahkan.');
    }
    navigate('karyawan');
  });
}
function editKaryawan(id) { openKaryawanModal(id); }
async function deleteKaryawan(id) { 
  if(!confirm('Yakin ingin menghapus karyawan ini?')) return;
  await SB.karyawan.remove(id);
  showToast('success','Dihapus','Data karyawan dihapus.'); 
  navigate('karyawan'); 
}
