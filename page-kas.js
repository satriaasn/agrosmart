/* =============================================
   AgroSmart — Page: Buku Kas (Journal Cash Flow)
   ============================================= */

async function renderKas() {
  const [{ data: listKas }, { data: listCOA }] = await Promise.all([
    SB.cash_book.fetch(),
    SB.coa.fetch()
  ]);
  const arrKas = listKas || [];
  const arrCOA = listCOA || [];

  const totalMasuk = arrKas.filter(k => k.tipe === 'masuk').reduce((a, b) => a + (b.jumlah || 0), 0);
  const totalKeluar = arrKas.filter(k => k.tipe === 'keluar').reduce((a, b) => a + (b.jumlah || 0), 0);
  const saldo = totalMasuk - totalKeluar;

  return `
  <div class="page-header">
    <div>
      <div class="page-title">Buku Kas & Neraca</div>
      <div class="page-subtitle">Kontrol uang masuk dan keluar untuk keseimbangan kas usaha.</div>
    </div>
    <div class="page-actions">
      <button class="btn btn-secondary" onclick="forceSyncKeuangan(this)" style="margin-right:8px">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
        Sinkron Data
      </button>
      <button class="btn btn-primary" onclick="openKasModal()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Catat Transaksi
      </button>
    </div>
  </div>

  <div class="stats-grid" style="margin-bottom:24px">
    <div class="stat-card" style="--card-accent:#22c55e">
      <div class="stat-header"><span class="stat-label">Total Uang Masuk</span><div class="stat-icon-wrapper">📥</div></div>
      <div class="stat-value" style="font-size:22px">Rp ${totalMasuk.toLocaleString('id-ID')}</div>
    </div>
    <div class="stat-card" style="--card-accent:#ef4444">
      <div class="stat-header"><span class="stat-label">Total Uang Keluar</span><div class="stat-icon-wrapper">📤</div></div>
      <div class="stat-value" style="font-size:22px">Rp ${totalKeluar.toLocaleString('id-ID')}</div>
    </div>
    <div class="stat-card" style="--card-accent:#3b82f6">
      <div class="stat-header"><span class="stat-label">Saldo Kas Saat Ini</span><div class="stat-icon-wrapper">🏦</div></div>
      <div class="stat-value" style="font-size:22px; color:${saldo < 0 ? '#ef4444' : 'inherit'}">Rp ${saldo.toLocaleString('id-ID')}</div>
    </div>
  </div>

  <div class="card">
    <div class="section-title">Riwayat Transaksi Kas</div>
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Tanggal</th>
            <th>Tipe</th>
            <th>Akun & Kategori</th>
            <th>Deskripsi</th>
            <th style="text-align:right">Jumlah (Rp)</th>
            <th style="text-align:right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          ${arrKas.length ? arrKas.map(k => `
            <tr>
              <td style="font-size:13px">${new Date(k.tanggal).toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'})}</td>
              <td>
                <span class="badge ${k.tipe === 'masuk' ? 'badge-green' : 'badge-red'}">
                  ${k.tipe === 'masuk' ? '🟢 MASUK' : '🔴 KELUAR'}
                </span>
              </td>
              <td>
                <div style="font-weight:700; font-size:12px; color:var(--text-primary)">
                  ${(() => {
                    const coa = arrCOA.find(a => String(a.id) === String(k.coa_id));
                    return coa ? `[${coa.account_code}] ${coa.account_name}` : k.kategori;
                  })()}
                </div>
                <div style="font-size:10px; color:var(--text-muted)">${k.kategori}</div>
              </td>
              <td style="color:var(--text-secondary); font-size:12px">${k.deskripsi || '-'}</td>
              <td style="text-align:right; font-weight:700; color:${k.tipe === 'masuk' ? 'var(--emerald-400)' : 'var(--red-400)'}">
                ${k.tipe === 'masuk' ? '+' : '-'} ${k.jumlah.toLocaleString('id-ID')}
              </td>
              <td style="text-align:right">
                <div style="display:flex; gap:6.4px; justify-content:flex-end">
                  <button class="btn btn-sm btn-secondary" onclick="editKas('${k.id}')">Edit</button>
                  <button class="btn btn-sm btn-danger" onclick="deleteKas('${k.id}')">Hapus</button>
                </div>
              </td>
            </tr>
          `).join('') : '<tr><td colspan="6" style="text-align:center; padding:32px; color:var(--text-muted)">Belum ada transaksi kas tercatat.</td></tr>'}
        </tbody>
      </table>
    </div>
  </div>`;
}

async function openKasModal(id) {
  const [{ data: listKas }, { data: listKats }] = await Promise.all([
    SB.cash_book.fetch(),
    SB.expense_categories.fetch()
  ]);
  const k = id ? (listKas || []).find(x => String(x.id) === String(id)) : null;
  const arrKats = listKats || [];

  openModal(k ? 'Edit Transaksi Kas' : 'Catat Transaksi Kas Baru', `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Tipe Transaksi *</label>
        <select class="form-control" id="f-kasTipe">
          <option value="masuk" ${k?.tipe === 'masuk' ? 'selected' : ''}>Uang Masuk (Pendapatan/Modal)</option>
          <option value="keluar" ${k?.tipe === 'keluar' ? 'selected' : ''}>Uang Keluar (Biaya/Pribadi)</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Tanggal</label>
        <input class="form-control" type="date" id="f-kasTgl" value="${k?.tanggal || new Date().toISOString().slice(0, 10)}">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-group">Jumlah (Rp) *</label>
        <input class="form-control" type="number" id="f-kasJml" value="${k?.jumlah || ''}" placeholder="0" min="0">
      </div>
      <div class="form-group">
        <label class="form-label">Kategori *</label>
        <select class="form-control" id="f-kasKat">
          <option value="Hasil Panen" ${k?.kategori === 'Hasil Panen' ? 'selected' : ''}>Hasil Panen (Pendapatan)</option>
          <option value="Modal" ${k?.kategori === 'Modal' ? 'selected' : ''}>Modal Awal / Tambahan</option>
          <optgroup label="Biaya Operasional (Master)">
            ${arrKats.map(c => `<option value="${c.name}" ${k?.kategori === c.name ? 'selected' : ''}>${c.icon || '💸'} ${c.name}</option>`).join('')}
          </optgroup>
          <option value="Lainnya" ${k?.kategori === 'Lainnya' || !k ? 'selected' : ''}>Lainnya / Pribadi</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Deskripsi / Catatan</label>
      <textarea class="form-control" id="f-kasDesc" placeholder="Keterangan tambahan..." rows="2">${k?.deskripsi || ''}</textarea>
    </div>
    <div style="margin-top:20px; display:flex; justify-content:flex-end; gap:8px">
      <button class="btn btn-secondary" onclick="closeModal()">Batal</button>
      <button class="btn btn-primary" id="btnSaveKas">Simpan Transaksi</button>
    </div>
  `);

  document.getElementById('btnSaveKas').addEventListener('click', async () => {
    const data = {
      tipe: document.getElementById('f-kasTipe').value,
      tanggal: document.getElementById('f-kasTgl').value,
      jumlah: parseFloat(document.getElementById('f-kasJml').value) || 0,
      kategori: document.getElementById('f-kasKat').value || 'Lainnya',
      deskripsi: document.getElementById('f-kasDesc').value,
      coa_id: null // Manual entry might need COA selection too, but user asked for Biaya/Panen sync specifically.
    };

    if (data.jumlah <= 0) return showToast('danger', 'Error', 'Jumlah harus lebih dari 0');

    try {
      if (k?.id) {
        await SB.cash_book.update(k.id, data);
        showToast('success', 'Berhasil', 'Transaksi diperbarui.');
      } else {
        await SB.cash_book.insert(data);
        showToast('success', 'Berhasil', 'Transaksi disimpan.');
      }
      closeModal();
      navigate('kas');
    } catch (err) {
      showToast('danger', 'Error', err.message);
    }
  });
}

function editKas(id) { openKasModal(id); }
async function deleteKas(id) {
  if (!confirm('Hapus transaksi ini?')) return;
  await SB.cash_book.remove(id);
  showToast('success', 'Dihapus', 'Transaksi kas dihapus.');
  navigate('kas');
}

async function forceSyncKeuangan(btn) {
  const original = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner" style="width:14px;height:14px;border:2px solid #fff;border-top-color:transparent;border-radius:50%;display:inline-block;animation:spin 1s linear infinite;"></span> Menyingkronkan...';

  try {
    const [{ data: listBiaya }, { data: listPanen }, { data: listKas }, { data: listKats }] = await Promise.all([
      SB.biaya.fetch(),
      SB.panen.fetch(),
      SB.cash_book.fetch(),
      SB.expense_categories.fetch()
    ]);

    const arrBiaya = listBiaya || [];
    const arrPanen = listPanen || [];
    const arrKas   = listKas || [];
    const arrKats  = listKats || [];

    let count = 0;

    // Sync Biaya
    for (const b of arrBiaya) {
      const exists = arrKas.some(k => String(k.ref_id) === String(b.id) && k.ref_type === 'biaya');
      if (!exists) {
        let cid = b.coa_id;
        if (!cid) {
          const cat = arrKats.find(c => c.name === b.kategori);
          if (cat) cid = cat.coa_id;
        }

        await SB.cash_book.insert({
          tipe: 'keluar',
          tanggal: b.tanggal,
          jumlah: b.total || 0,
          kategori: b.kategori,
          coa_id: cid ? parseInt(cid) : null,
          deskripsi: `[Biaya Lahan: ${b.lahan}] ${b.deskripsi}`,
          ref_id: String(b.id),
          ref_type: 'biaya'
        });
        count++;
      }
    }

    // Sync Panen
    for (const p of arrPanen) {
      const exists = arrKas.some(k => String(k.ref_id) === String(p.id) && k.ref_type === 'panen');
      if (!exists) {
        await SB.cash_book.insert({
          tipe: 'masuk',
          tanggal: p.tanggal || new Date(p.created_at).toISOString().split('T')[0],
          jumlah: p.total || 0,
          kategori: 'Hasil Panen',
          coa_id: p.coa_id ? parseInt(p.coa_id) : null,
          deskripsi: `[Panen: ${p.tanaman}] ${p.lahan}`,
          ref_id: String(p.id),
          ref_type: 'panen'
        });
        count++;
      }
    }

    showToast('success', 'Berhasil', `${count} data berhasil disinkronkan ke Buku Kas.`);
    navigate('kas');
  } catch (err) {
    showToast('danger', 'Error', 'Gagal sinkron: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = original;
  }
}
