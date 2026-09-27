// ─── Lab Tests Page JS ──────────────────────────────────────────

let labTests = [];
let selectedTest = null;

async function loadLabTests() {
  const search = document.getElementById('lab-search-input').value.trim();
  const grid = document.getElementById('labs-grid');

  grid.innerHTML = `
    <div style="text-align:center; grid-column: 1/-1; padding: 40px;">
      <div class="spinner"></div>
      <p style="margin-top:12px; color:var(--text-secondary);">Loading tests...</p>
    </div>
  `;

  const queryString = search ? `?search=${encodeURIComponent(search)}` : '';
  const { ok, data } = await api(`/lab-tests${queryString}`);

  if (ok && data.data) {
    labTests = data.data;
    renderLabTests(labTests);
  } else {
    grid.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color:var(--text-secondary);">Failed to load lab tests.</p>`;
  }
}

function renderLabTests(tests) {
  const grid = document.getElementById('labs-grid');

  if (tests.length === 0) {
    grid.innerHTML = `
      <div class="glass-card" style="grid-column: 1/-1; text-align:center; padding: 40px;">
        <span style="font-size:2.5rem;">🔍</span>
        <h3 style="margin-top:10px;">No lab tests match your search</h3>
      </div>
    `;
    return;
  }

  grid.innerHTML = tests.map(t => `
    <div class="glass-card" style="padding:24px; display:flex; flex-direction:column; justify-content:space-between; transition:transform 0.2s ease, border-color 0.2s ease;">
      <div>
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
          <span class="badge badge-teal" style="font-size:0.75rem;">⏱ Reports in ${t.turnaround}</span>
          <span style="font-size:1.25rem;">🔬</span>
        </div>
        <h3 style="font-size:1.15rem; margin-bottom:8px;">${t.name}</h3>
        <p style="color:var(--text-secondary); font-size:0.9rem; margin-bottom:16px;">${t.description}</p>
      </div>

      <div style="border-top:1px solid var(--glass-border); padding-top:16px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-size:1.3rem; font-weight:700; color:var(--teal-400);">₹${t.price}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">Free Home Sample</div>
        </div>
        <button class="btn btn-primary btn-sm" onclick="openLabBookingModal(${t.id})">Book Test</button>
      </div>
    </div>
  `).join('');
}

function openLabBookingModal(testId) {
  selectedTest = labTests.find(t => t.id === testId);
  if (!selectedTest) return;

  document.getElementById('modal-test-title').textContent = selectedTest.name;
  document.getElementById('modal-test-fee').textContent = `₹${selectedTest.price}`;

  const today = new Date().toISOString().split('T')[0];
  const dateInput = document.getElementById('lab-date');
  dateInput.min = today;
  dateInput.value = today;

  openModal('lab-booking-modal');
}

function handleLabBooking(e) {
  e.preventDefault();
  if (!currentUser) {
    closeModal('lab-booking-modal');
    openModal('login-modal');
    showToast('Please sign in to book a test', 'info');
    return;
  }

  showToast(`Test '${selectedTest.name}' booked! Phlebotomist will contact you soon. 🩸`, 'success');
  closeModal('lab-booking-modal');
}

document.addEventListener('DOMContentLoaded', () => {
  loadLabTests();
  document.getElementById('lab-search-input').addEventListener('input', loadLabTests);
  document.getElementById('lab-booking-form').addEventListener('submit', handleLabBooking);
});
