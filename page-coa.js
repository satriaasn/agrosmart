/* =============================================
   AgroSmart — Page: Chart of Accounts (Daftar Akun)
   ============================================= */

async function renderCOA() {
  const { data: listCOA } = await SB.coa.fetch();
  const arrCOA = listCOA || [];

  return `
  <div class="page-header">
    <div>
      <div class="page-title">Daftar Akun (COA)</div>
      <div class="page-subtitle">Kelola struktur akun akuntansi untuk standarisasi laporan keuangan.</div>
    </div>
    <div class="page-actions">
      <button class="btn btn-primary" onclick="openCOAModal()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Tambah Akun
      </button>
    </div>
  </div>

  <div class="card">
    <div class="section-title">Struktur Akun</div>
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Kode</th>
            <th>Nama Akun</th>
            <th>Tipe</th>
            <th>Status</th>
            <th style="text-align:right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          ${arrCOA.length ? arrCOA.map(a => `
            <tr>
              <td style="font-family:monospace; font-weight:700">${a.account_code}</td>
              <td style="font-weight:600">${a.account_name}</td>
              <td>
                <span class="badge ${getAccountTypeClass(a.account_type)}">${a.account_type}</span>
              </td>
              <td>${a.is_header ? '📂 Header' : '📄 Detail'}</td>
              <td style="text-align:right">
                <div style="display:flex; gap:6.4px; justify-content:flex-end">
                  <button class="btn btn-sm btn-secondary" onclick="editCOA('${a.id}')">Edit</button>
                  <button class="btn btn-sm btn-danger" onclick="deleteCOA('${a.id}')">Hapus</button>
                </div>
              </td>
            </tr>
          `).join('') : '<tr><td colspan="5" style="text-align:center; padding:32px; color:var(--text-muted)">Belum ada daftar akun. Klik "Tambah Akun" untuk memulai.</td></tr>'}
        </tbody>
      </table>
    </div>
  </div>`;
}

function getAccountTypeClass(type) {
  switch(type) {
    case 'Asset': return 'badge-blue';
    case 'Liability': return 'badge-orange';
    case 'Equity': return 'badge-purple';
    case 'Revenue': return 'badge-green';
    case 'Expense': return 'badge-red';
    default: return 'badge-gray';
  }
}

async function openCOAModal(id) {
  const { data: listCOA } = await SB.coa.fetch();
  const a = id ? (listCOA || []).find(x => String(x.id) === String(id)) : null;

  openModal(a ? 'Edit Akun' : 'Tambah Akun Baru', `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Kode Akun *</label>
        <input class="form-control" id="f-coaCode" value="${a?.account_code || ''}" placeholder="cth. 1101">
      </div>
      <div class="form-group">
        <label class="form-label">Nama Akun *</label>
        <input class="form-control" id="f-coaName" value="${a?.account_name || ''}" placeholder="cth. Kas Kecil">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Tipe Akun *</label>
        <select class="form-control" id="f-coaType">
          ${['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'].map(t => `<option value="${t}" ${a?.account_type === t ? 'selected' : ''}>${t}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Status</label>
        <select class="form-control" id="f-coaHeader">
          <option value="false" ${a?.is_header === false ? 'selected' : ''}>📄 Akun Detail (Bisa mencatat transaksi)</option>
          <option value="true" ${a?.is_header === true ? 'selected' : ''}>📂 Akun Header (Hanya untuk grup)</option>
        </select>
      </div>
    </div>
    <div style="margin-top:20px; display:flex; justify-content:flex-end; gap:8px">
      <button class="btn btn-secondary" onclick="closeModal()">Batal</button>
      <button class="btn btn-primary" id="btnSaveCOA">Simpan Akun</button>
    </div>
  `);

  document.getElementById('btnSaveCOA').addEventListener('click', async () => {
    const data = {
      account_code: document.getElementById('f-coaCode').value.trim(),
      account_name: document.getElementById('f-coaName').value.trim(),
      account_type: document.getElementById('f-coaType').value,
      is_header: document.getElementById('f-coaHeader').value === 'true'
    };

    if (!data.account_code || !data.account_name) return showToast('danger', 'Error', 'Kode dan Nama Akun wajib diisi');

    try {
      if (a?.id) {
        await SB.coa.update(a.id, data);
        showToast('success', 'Berhasil', 'Akun diperbarui.');
      } else {
        await SB.coa.insert(data);
        showToast('success', 'Berhasil', 'Akun disimpan.');
      }
      closeModal();
      navigate('coa');
    } catch (err) {
      showToast('danger', 'Error', err.message);
    }
  });
}

function editCOA(id) { openCOAModal(id); }
async function deleteCOA(id) {
  if (!confirm('Hapus akun ini? Pastikan tidak ada kategori yang terhubung.')) return;
  await SB.coa.remove(id);
  showToast('success', 'Dihapus', 'Akun dihapus.');
  navigate('coa');
}
