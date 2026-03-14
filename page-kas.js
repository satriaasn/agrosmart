/* =============================================
   AgroSmart — Page: Buku Kas (Journal Cash Flow)
   ============================================= */

async function renderKas() {
  const { data: listKas } = await SB.cash_book.fetch();
  const arrKas = listKas || [];

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
            <th>Kategori</th>
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
              <td style="font-weight:600; font-size:13px">${k.kategori}</td>
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
  const { data: listKas } = await SB.cash_book.fetch();
  const k = id ? (listKas || []).find(x => String(x.id) === String(id)) : null;

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
        <label class="form-label">Kategori</label>
        <input class="form-control" id="f-kasKat" value="${k?.kategori || ''}" placeholder="cth. Hasil Panen, Pinjaman, Gaji">
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
      deskripsi: document.getElementById('f-kasDesc').value
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
