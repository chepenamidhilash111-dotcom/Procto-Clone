// ─── Profile Page ─────────────────────────────────────────────

let appointments = [];

async function initProfile() {
  // Redirect if not logged in
  await fetchCurrentUser();
  if (!currentUser) {
    document.getElementById('profile-wrapper').innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔐</div>
        <div class="empty-title">Sign in to view your profile</div>
        <div class="empty-desc" style="margin-bottom:24px">You need to be logged in to access this page</div>
        <button class="btn btn-primary" onclick="openModal('login-modal')">Sign In</button>
      </div>
    `;
    return;
  }

  await loadProfilePage();
}

async function loadProfilePage() {
  const { ok, data } = await api('/appointments/my');
  appointments = ok ? data.data : [];
  renderProfilePage();
}

function renderProfilePage() {
  const u = currentUser;
  const initials = u.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
  const confirmed = appointments.filter(a => a.status === 'confirmed');
  const cancelled = appointments.filter(a => a.status === 'cancelled');
  const upcoming  = confirmed.filter(a => new Date(a.date) >= new Date());

  document.getElementById('profile-wrapper').innerHTML = `
    <!-- Profile Header -->
    <div class="profile-info-card">
      <div class="profile-avatar-large">${initials}</div>
      <div style="flex:1">
        <h1 style="font-size:1.6rem;font-weight:800;margin-bottom:4px">${u.name}</h1>
        <div style="color:var(--text-secondary);font-size:0.9rem;margin-bottom:8px">${u.email}</div>
        ${u.phone ? `<div style="color:var(--text-muted);font-size:0.85rem">📞 ${u.phone}</div>` : ''}
      </div>
      <div style="display:flex;gap:10px">
        <button class="btn btn-secondary btn-sm" onclick="showTab('edit')">✏️ Edit Profile</button>
        <button id="logout-btn-profile" class="btn btn-danger btn-sm" onclick="handleLogout()">Logout</button>
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="grid-4" style="margin-bottom:32px">
      <div class="stat-card">
        <div class="stat-number">${appointments.length}</div>
        <div class="stat-label">Total Appointments</div>
      </div>
      <div class="stat-card">
        <div class="stat-number" style="color:var(--green-400)">${upcoming.length}</div>
        <div class="stat-label">Upcoming</div>
      </div>
      <div class="stat-card">
        <div class="stat-number" style="color:var(--blue-400)">${confirmed.length}</div>
        <div class="stat-label">Confirmed</div>
      </div>
      <div class="stat-card">
        <div class="stat-number" style="color:var(--red-400)">${cancelled.length}</div>
        <div class="stat-label">Cancelled</div>
      </div>
    </div>

    <!-- Tab Nav -->
    <div class="tab-nav" id="profile-tabs">
      <button class="tab-btn active" onclick="showTab('appointments')" id="tab-appointments">📅 My Appointments</button>
      <button class="tab-btn" onclick="showTab('edit')" id="tab-edit">👤 Edit Profile</button>
      <button class="tab-btn" onclick="showTab('health')" id="tab-health">💊 Health Records</button>
    </div>

    <!-- Appointments Panel -->
    <div id="panel-appointments">
      ${renderAppointments(appointments)}
    </div>

    <!-- Edit Profile Panel -->
    <div id="panel-edit" class="hidden">
      <div class="glass-card" style="padding:28px;max-width:560px">
        <h3 style="margin-bottom:24px">Edit Profile</h3>
        <form id="edit-profile-form" onsubmit="saveProfile(event)">
          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input class="form-input" id="edit-name" value="${u.name}" required/>
          </div>
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Phone</label>
              <input class="form-input" id="edit-phone" value="${u.phone || ''}" type="tel"/>
            </div>
            <div class="form-group">
              <label class="form-label">Date of Birth</label>
              <input class="form-input" id="edit-dob" value="${u.dob || ''}" type="date"/>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Gender</label>
            <select class="form-input" id="edit-gender">
              <option value="">Select</option>
              <option ${u.gender==='male'?'selected':''}>male</option>
              <option ${u.gender==='female'?'selected':''}>female</option>
              <option ${u.gender==='other'?'selected':''}>other</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Address</label>
            <textarea class="form-input" id="edit-address">${u.address || ''}</textarea>
          </div>
          <button type="submit" class="btn btn-primary btn-full">Save Changes</button>
        </form>
      </div>
    </div>

    <!-- Health Records Panel -->
    <div id="panel-health" class="hidden">
      <div class="glass-card" style="padding:28px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
          <h3>Health Records</h3>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px">
          ${[
            { icon: '📋', title: 'Prescriptions', count: confirmed.length, color: 'var(--teal-400)' },
            { icon: '🔬', title: 'Lab Reports', count: 0, color: 'var(--blue-400)' },
            { icon: '💉', title: 'Vaccinations', count: 0, color: 'var(--green-400)' },
            { icon: '🩺', title: 'Vitals History', count: 0, color: 'var(--purple-400)' },
          ].map(item => `
            <div class="glass-card" style="padding:20px;text-align:center">
              <div style="font-size:2rem;margin-bottom:8px">${item.icon}</div>
              <div style="font-size:1.4rem;font-weight:800;color:${item.color}">${item.count}</div>
              <div style="font-size:0.82rem;color:var(--text-secondary)">${item.title}</div>
            </div>
          `).join('')}
        </div>
        <div class="empty-state" style="padding:40px 0 0">
          <div style="font-size:0.9rem;color:var(--text-muted)">
            Upload and manage your medical records here. Coming soon!
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderAppointments(apts) {
  if (apts.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-icon">📅</div>
        <div class="empty-title">No appointments yet</div>
        <div class="empty-desc" style="margin-bottom:20px">Book your first appointment with a top doctor</div>
        <a href="doctors.html" class="btn btn-primary">Find Doctors</a>
      </div>
    `;
  }
  return apts.map(apt => `
    <div class="appointment-card" style="margin-bottom:16px">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px">
        <div>
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
            <div style="font-weight:700;font-size:1rem">${apt.doctor_name}</div>
            <span class="apt-status ${apt.status}">${apt.status === 'confirmed' ? '✓' : '✕'} ${apt.status}</span>
          </div>
          <div style="color:var(--teal-400);font-size:0.85rem;margin-bottom:8px">${apt.doctor_specialty}</div>
          <div style="display:flex;gap:20px;flex-wrap:wrap">
            <span style="font-size:0.85rem;color:var(--text-secondary)">📅 ${formatDate(apt.date)}</span>
            <span style="font-size:0.85rem;color:var(--text-secondary)">🕐 ${apt.slot}</span>
            <span style="font-size:0.85rem;color:var(--text-secondary)">${apt.type === 'online' ? '📹 Online' : '🏥 In-Clinic'}</span>
          </div>
          ${apt.notes ? `<div style="font-size:0.82rem;color:var(--text-muted);margin-top:8px;font-style:italic">📝 ${apt.notes}</div>` : ''}
        </div>
        <div style="text-align:right">
          <div style="font-size:1.2rem;font-weight:800;color:var(--teal-400);margin-bottom:8px">₹${apt.fee}</div>
          ${apt.status === 'confirmed' ?
            `<button class="btn btn-danger btn-sm" onclick="cancelAppointment('${apt.id}')">Cancel</button>` :
            `<span style="font-size:0.78rem;color:var(--text-muted)">Cancelled ${apt.cancelled_at ? formatDate(apt.cancelled_at) : ''}</span>`
          }
        </div>
      </div>
    </div>
  `).join('');
}

async function cancelAppointment(id) {
  if (!confirm('Cancel this appointment?')) return;
  const { ok, data } = await api(`/appointments/${id}/cancel`, { method: 'PUT' });
  if (ok) {
    showToast('Appointment cancelled', 'info');
    await loadProfilePage();
    renderProfilePage();
  } else {
    showToast(data.error || 'Failed to cancel', 'error');
  }
}

async function saveProfile(e) {
  e.preventDefault();
  const { ok, data } = await api('/auth/update-profile', {
    method: 'PUT',
    body: JSON.stringify({
      name:    document.getElementById('edit-name').value,
      phone:   document.getElementById('edit-phone').value,
      dob:     document.getElementById('edit-dob').value,
      gender:  document.getElementById('edit-gender').value,
      address: document.getElementById('edit-address').value,
    })
  });
  if (ok) {
    currentUser = data.data;
    showToast('Profile updated successfully!', 'success');
    renderProfilePage();
  } else {
    showToast(data.error || 'Update failed', 'error');
  }
}

function showTab(tab) {
  ['appointments', 'edit', 'health'].forEach(t => {
    document.getElementById(`panel-${t}`)?.classList.toggle('hidden', t !== tab);
    document.getElementById(`tab-${t}`)?.classList.toggle('active', t === tab);
  });
}

document.addEventListener('DOMContentLoaded', initProfile);
