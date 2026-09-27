// ─── Admin Dashboard JS ──────────────────────────────────────────

async function loadAdminStats() {
  const { ok, data } = await api('/admin/stats');

  if (ok && data.data) {
    const s = data.data;
    document.getElementById('stat-revenue').textContent = `₹${s.total_revenue.toLocaleString()}`;
    document.getElementById('stat-appointments').textContent = s.total_appointments;
    document.getElementById('stat-doctors').textContent = s.total_doctors;
    document.getElementById('stat-patients').textContent = s.total_patients;

    renderRecentAppointments(s.recent_appointments || []);
  } else {
    showToast('Failed to load admin stats', 'error');
  }
}

function renderRecentAppointments(list) {
  const tbody = document.getElementById('recent-appointments-tbody');

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:var(--text-muted);">No appointments recorded yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(a => `
    <tr style="border-bottom:1px solid var(--glass-border);">
      <td style="padding:12px; font-family:monospace; font-size:0.8rem; color:var(--teal-400);">${a.id.slice(0, 8)}...</td>
      <td style="padding:12px;">${a.patient_name}</td>
      <td style="padding:12px;">${a.doctor_name}</td>
      <td style="padding:12px; font-size:0.85rem; color:var(--text-secondary);">${a.date} at ${a.time}</td>
      <td style="padding:12px; font-weight:600; color:var(--teal-400);">₹${a.fee}</td>
      <td style="padding:12px;">
        <span class="badge ${a.status === 'confirmed' ? 'badge-teal' : 'badge-purple'}">${a.status}</span>
      </td>
    </tr>
  `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  loadAdminStats();
});
