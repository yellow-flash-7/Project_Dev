const token = localStorage.getItem('ct_token');
const user = JSON.parse(localStorage.getItem('ct_user') || 'null');
if (!token || !user) location.href = '/pages/login.html';

const $ = (s, root = document) => root.querySelector(s);
const esc = v => String(v ?? '').replace(/[&<>"']/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[m]));

async function api(url, opt = {}) {
  opt.headers = { ...(opt.headers || {}), Authorization: `Bearer ${token}` };
  const r = await fetch(url, opt);
  const text = await r.text();
  let j = {};
  try { j = text ? JSON.parse(text) : {}; } catch { j = { message: text }; }
  if (!r.ok) throw new Error(j.message || `Request failed (${r.status})`);
  return j;
}

function shell(title, sub, body) {
  $('#dashboard').innerHTML = `<div class="dash-title"><div><span class="eyebrow">${user.role === 'ADMIN' ? 'ADMIN CONTROL CENTER' : 'INSTITUTION DASHBOARD'}</span><h1>${title}</h1><p class="muted">${sub}</p></div></div>${body}`;
}

function toast(message, type = 'good') {
  let el = $('#toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; document.body.appendChild(el); }
  el.className = `toast ${type}`;
  el.textContent = message;
  el.hidden = false;
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => { el.hidden = true; }, 3500);
}

$('#logout').onclick = () => { localStorage.clear(); location.href = '/pages/login.html'; };

async function institution() {
  shell('Institution dashboard', 'Track certificate uploads, academic years, departments and approval requests.', `<div id="content">Loading…</div>`);
  try {
    const [d, c, r] = await Promise.all([
      api('/api/institution/dashboard'),
      api('/api/institution/certificates'),
      api('/api/change-requests/mine')
    ]);
    const s = d.data.stats;
    $('#content').innerHTML = `
      <div class="stats">
        <div class="stat"><small>Total certificates</small><strong>${s.total}</strong></div>
        <div class="stat"><small>Active</small><strong>${s.active}</strong></div>
        <div class="stat"><small>Revoked</small><strong>${s.revoked}</strong></div>
        <div class="stat"><small>Public verifications</small><strong>${s.verifications}</strong></div>
      </div>
      <div class="two">
        <section class="panel"><h2>Upload certificate</h2>
          <form id="issue" class="form-grid">
            <label>Student name<input name="studentName" required></label>
            <label>Register number<input name="registerNumber" required></label>
            <label>Email<input name="email" type="email"></label>
            <label>Course<input name="course" required value="B.E Computer Science"></label>
            <label>Department<input name="department" required value="Computer Science and Engineering"></label>
            <label>Academic year<input name="academicYear" type="number" value="2026" required></label>
            <label>Issue date<input name="issueDate" type="date" required></label>
            <label>Grade<input name="grade"></label>
            <label>CGPA<input name="cgpa" type="number" step="0.01" min="0" max="10"></label>
            <label class="wide">Original certificate (PDF/image)<input name="document" type="file" accept=".pdf,image/*"></label>
            <button class="btn wide" type="submit">Create certificate + QR</button>
          </form><div id="issueMsg" class="message" hidden></div>
        </section>
        <section class="panel"><h2>Members by academic year</h2>
          ${d.data.byYear.map(x => `<div class="bar"><span>${esc(x.academic_year)}</span><i style="width:${Math.max(8, Math.min(100, x.members * 18))}%"></i><b>${x.members}</b></div>`).join('')}
          <h2>Departments</h2>${d.data.byDepartment.map(x => `<div class="bar"><span>${esc(x.department)}</span><i style="width:${Math.max(8, Math.min(100, x.members * 18))}%"></i><b>${x.members}</b></div>`).join('')}
        </section>
      </div>
      <section class="panel" style="margin-top:18px"><h2>Certificates</h2><div class="table-wrap"><table class="table"><thead><tr><th>ID</th><th>Student</th><th>Year</th><th>Department</th><th>Date</th><th>Status</th><th>Action</th></tr></thead><tbody>
        ${c.data.certificates.map(x => `<tr><td>${esc(x.certificate_id)}</td><td>${esc(x.student_name)}<br><small>${esc(x.register_number)}</small></td><td>${x.academic_year}</td><td>${esc(x.department)}</td><td>${esc(x.issue_date)}</td><td><span class="pill ${x.status === 'ACTIVE' ? 'good' : 'bad'}">${x.status}</span></td><td>${x.status === 'ACTIVE' ? `<button class="btn small ghost js-change" data-id="${esc(x.certificate_id)}">Request change</button> <button class="btn small ghost js-revoke" data-id="${esc(x.certificate_id)}">Revoke</button>` : '-'}</td></tr>`).join('')}
      </tbody></table></div></section>
      <section class="panel" style="margin-top:18px"><h2>My change requests</h2>${r.data.requests.length ? r.data.requests.map(x => `<div class="request"><b>${esc(x.certificate_id)}</b> · <span class="pill ${x.status === 'APPROVED' ? 'good' : x.status === 'REJECTED' ? 'bad' : 'warn'}">${x.status}</span><p>${esc(x.reason)}</p>${x.admin_note ? `<p><b>Admin:</b> ${esc(x.admin_note)}</p>` : ''}</div>`).join('') : '<div class="empty">No requests.</div>'}</section>`;

    $('#issue').onsubmit = async e => {
      e.preventDefault();
      const m = $('#issueMsg'); m.hidden = false; m.textContent = 'Creating certificate…';
      try {
        const j = await api('/api/certificates', { method: 'POST', body: new FormData(e.target) });
        m.innerHTML = `Certificate <b>${esc(j.data.certificate.certificate_id)}</b> created successfully.`;
        m.className = 'message success';
        const w = window.open('', '_blank', 'width=520,height=760');
        if (w) w.document.write(`<title>CertiTrust QR</title><body style="font-family:system-ui;text-align:center;padding:30px"><h2>Certificate QR</h2><img src="${j.data.qrCode}" style="width:360px;max-width:90%"><p><b>Verification URL</b></p><p style="word-break:break-all">${esc(j.data.verificationUrl)}</p><p>Scan with Google Lens or any QR scanner.</p></body>`);
        e.target.reset();
      } catch (err) { m.textContent = err.message; m.className = 'message error'; }
    };

    $('#content').addEventListener('click', async e => {
      const change = e.target.closest('.js-change');
      const revoke = e.target.closest('.js-revoke');
      if (change) {
        const name = prompt('New student name (leave blank to keep current):', '');
        const reason = prompt('Why should this detail be changed?');
        if (!reason) return;
        try { await api('/api/change-requests', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ certificateId:change.dataset.id, reason, newData:{ studentName:name || undefined } }) }); toast('Change request sent to admin.'); await institution(); }
        catch (err) { toast(err.message, 'bad'); }
      }
      if (revoke) {
        if (!confirm('Revoke this certificate? This will make public verification show REVOKED.')) return;
        try { await api(`/api/certificates/${encodeURIComponent(revoke.dataset.id)}/revoke`, { method:'PATCH' }); toast('Certificate revoked.'); await institution(); }
        catch (err) { toast(err.message, 'bad'); }
      }
    });
  } catch (err) { $('#content').innerHTML = `<div class="result bad"><h3>Unable to load dashboard</h3><p>${esc(err.message)}</p><button class="btn small" onclick="location.reload()">Try again</button></div>`; }
}

async function admin() {
  shell('Admin dashboard', 'Approve institutions and review student/certificate change requests.', `<div id="content">Loading…</div>`);
  try {
    const [o, r] = await Promise.all([api('/api/admin/overview'), api('/api/admin/change-requests')]);
    const s = o.data.stats;
    $('#content').innerHTML = `
      <div class="stats">
        <div class="stat"><small>Total institutions</small><strong>${s.total}</strong></div>
        <div class="stat"><small>Pending approvals</small><strong>${s.pending}</strong></div>
        <div class="stat"><small>Certificates</small><strong>${s.certificates}</strong></div>
        <div class="stat"><small>Pending changes</small><strong>${s.pendingChanges}</strong></div>
      </div>
      <section class="panel" style="margin-top:18px"><div class="section-title-row"><div><h2>Institution registrations</h2><p class="muted">Review proof documents before allowing an institution to log in.</p></div></div>
        <div class="table-wrap"><table class="table"><thead><tr><th>Institution</th><th>Code</th><th>Email</th><th>Status</th><th>Action</th></tr></thead><tbody>
        ${o.data.institutions.map(i => `<tr id="inst-${esc(i.id)}"><td><b>${esc(i.name)}</b></td><td>${esc(i.code)}</td><td>${esc(i.email)}</td><td><span class="pill ${i.status === 'APPROVED' ? 'good' : i.status === 'REJECTED' ? 'bad' : 'warn'}">${esc(i.status)}</span></td><td class="action-cell">${i.registration_document ? `<button class="btn small ghost js-proof" data-id="${esc(i.id)}">View proof</button>` : ''}${i.status === 'PENDING' ? ` <button class="btn small js-approve" data-id="${esc(i.id)}">Approve</button> <button class="btn small ghost js-reject" data-id="${esc(i.id)}">Reject</button>` : '<span class="muted">Reviewed</span>'}</td></tr>`).join('')}
        </tbody></table></div>
      </section>
      <section class="panel" style="margin-top:18px"><h2>Student / certificate change requests</h2>
        ${r.data.requests.length ? r.data.requests.map(x => `<div class="request"><b>${esc(x.certificate_id)}</b> · ${esc(x.institution_name)} · <span class="pill ${x.status === 'APPROVED' ? 'good' : x.status === 'REJECTED' ? 'bad' : 'warn'}">${x.status}</span><p><b>Reason:</b> ${esc(x.reason)}</p><pre>Old: ${esc(JSON.stringify(x.old_data, null, 2))}\nNew: ${esc(JSON.stringify(x.new_data, null, 2))}</pre>${x.status === 'PENDING' ? `<button class="btn small js-change-approve" data-id="${esc(x.id)}">OK / Approve</button> <button class="btn small ghost js-change-reject" data-id="${esc(x.id)}">Reject</button>` : `<p><b>Admin note:</b> ${esc(x.admin_note || '-')}</p>`}</div>`).join('') : '<div class="empty">No requests.</div>'}
      </section>`;

    $('#content').addEventListener('click', async e => {
      const proof = e.target.closest('.js-proof');
      const approve = e.target.closest('.js-approve');
      const reject = e.target.closest('.js-reject');
      const ca = e.target.closest('.js-change-approve');
      const cr = e.target.closest('.js-change-reject');
      if (proof) {
        try { const r = await fetch(`/api/admin/institutions/${encodeURIComponent(proof.dataset.id)}/document`, { headers:{Authorization:`Bearer ${token}`} }); if(!r.ok) throw new Error('Unable to open proof document.'); const b=await r.blob(); const u=URL.createObjectURL(b); window.open(u,'_blank'); setTimeout(()=>URL.revokeObjectURL(u),60000); }
        catch(err){ toast(err.message,'bad'); }
      }
      if (approve) {
        if (!confirm('Approve this institution? They will be allowed to log in.')) return;
        approve.disabled = true; approve.textContent = 'Approving…';
        try { await api(`/api/admin/institutions/${encodeURIComponent(approve.dataset.id)}/approve`, {method:'POST'}); toast('Institution approved successfully.'); await admin(); }
        catch(err){ approve.disabled=false; approve.textContent='Approve'; toast(err.message,'bad'); }
      }
      if (reject) {
        const note = prompt('Reason for rejection:');
        if (!note?.trim()) return;
        reject.disabled = true; reject.textContent = 'Rejecting…';
        try { await api(`/api/admin/institutions/${encodeURIComponent(reject.dataset.id)}/reject`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({note})}); toast('Institution rejected.'); await admin(); }
        catch(err){ reject.disabled=false; reject.textContent='Reject'; toast(err.message,'bad'); }
      }
      if (ca || cr) {
        const status = ca ? 'APPROVED' : 'REJECTED';
        let note = '';
        if (status === 'REJECTED') { note = prompt('Why is this change not approved?') || ''; if (!note.trim()) return; }
        const btn = ca || cr; btn.disabled = true; btn.textContent = status === 'APPROVED' ? 'Approving…' : 'Rejecting…';
        try { await api(`/api/admin/change-requests/${encodeURIComponent(btn.dataset.id)}/review`, {method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status,note})}); toast(status === 'APPROVED' ? 'Change approved.' : 'Change rejected.'); await admin(); }
        catch(err){ btn.disabled=false; toast(err.message,'bad'); }
      }
    });
  } catch (err) { $('#content').innerHTML = `<div class="result bad"><h3>Unable to load admin dashboard</h3><p>${esc(err.message)}</p><button class="btn small" onclick="location.reload()">Try again</button></div>`; }
}

(user.role === 'ADMIN' ? admin : institution)();
