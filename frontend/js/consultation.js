// ─── Consultation Page JS ──────────────────────────────────────────

let onlineDoctors = [];

async function loadOnlineDoctors() {
  const container = document.getElementById('online-doctors-list');
  const { ok, data } = await api('/doctors');

  if (ok && data.data) {
    onlineDoctors = data.data.slice(0, 6); // Pick top doctors
    renderOnlineDoctors(onlineDoctors);
  } else {
    container.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:var(--text-secondary);">Failed to load doctors.</p>`;
  }
}

function renderOnlineDoctors(doctors) {
  const container = document.getElementById('online-doctors-list');
  container.innerHTML = doctors.map(doc => `
    <div class="glass-card" style="padding:20px; display:flex; flex-direction:column; justify-content:space-between;">
      <div>
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
          <div style="width:48px; height:48px; border-radius:50%; background:linear-gradient(135deg, var(--teal-500), var(--blue-500)); display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:1.1rem; position:relative;">
            ${getDoctorInitials(doc.name)}
            <span style="position:absolute; bottom:0; right:0; width:12px; height:12px; background:var(--green-400); border-radius:50%; border:2px solid var(--navy-900);"></span>
          </div>
          <div>
            <h4 style="font-size:1rem; margin:0;">${doc.name}</h4>
            <span style="font-size:0.8rem; color:var(--teal-400);">${doc.specialty}</span>
          </div>
        </div>
        <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:12px;">${doc.experience_years} years exp • ${doc.clinic_name}</p>
      </div>

      <div style="border-top:1px solid var(--glass-border); padding-top:12px; display:flex; justify-content:space-between; align-items:center;">
        <span style="font-weight:700; color:var(--text-primary);">₹${doc.fee}</span>
        <button class="btn btn-primary btn-sm" onclick="startInstantConsult('${doc.specialty}', 'Direct Consult', '${doc.name}')">Connect Now</button>
      </div>
    </div>
  `).join('');
}

function startInstantConsult(specialty, reason, docName = null) {
  if (!currentUser) {
    openModal('login-modal');
    showToast('Please sign in to connect with a doctor', 'info');
    return;
  }

  const doctorToCall = docName || `Dr. (${specialty} Specialist)`;
  document.getElementById('consult-doc-name').textContent = doctorToCall;
  document.getElementById('video-connecting-state').classList.remove('hidden');
  document.getElementById('video-connected-state').classList.add('hidden');

  openModal('consult-room-modal');

  // Simulate video connection in 2.5 seconds
  setTimeout(() => {
    document.getElementById('video-connecting-state').classList.add('hidden');
    document.getElementById('video-connected-state').classList.remove('hidden');
    document.getElementById('consult-connected-doc').textContent = doctorToCall;
    showToast(`Connected with ${doctorToCall}!`, 'success');
  }, 2500);
}

function endConsultation() {
  closeModal('consult-room-modal');
  showToast('Consultation ended. Prescription sent to your email!', 'info');
}

document.addEventListener('DOMContentLoaded', () => {
  loadOnlineDoctors();
});
