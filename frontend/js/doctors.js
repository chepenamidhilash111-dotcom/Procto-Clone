// ─── Doctors Listing Page ─────────────────────────────────────

let allDoctors = [];
let filteredDoctors = [];

// ─── Get URL Params ───────────────────────────────────────────
const urlParams = new URLSearchParams(window.location.search);

// ─── Load Specialties for Filters ────────────────────────────
async function loadSpecialtyFilters() {
  const { ok, data } = await api('/doctors/specialties');
  if (!ok) return;

  const container = document.getElementById('specialty-filters');
  const specialties = data.data;

  const extras = specialties.map(spec => `
    <label class="filter-option">
      <input type="radio" name="specialty" value="${spec}" ${urlParams.get('specialty') === spec ? 'checked' : ''}/>
      ${spec}
    </label>
  `).join('');

  container.innerHTML = `
    <label class="filter-option">
      <input type="radio" name="specialty" value="" ${!urlParams.get('specialty') ? 'checked' : ''}/>
      All Specialties
    </label>
    ${extras}
  `;

  // Add filter change listeners
  container.querySelectorAll('input[type="radio"]').forEach(r =>
    r.addEventListener('change', applyFilters)
  );
}

// ─── Fetch & Render Doctors ───────────────────────────────────
async function fetchDoctors() {
  const { ok, data } = await api('/doctors');
  if (!ok) {
    document.getElementById('doctors-grid').innerHTML =
      '<p style="color:var(--red-400)">Failed to load doctors. Make sure the backend is running.</p>';
    return;
  }
  allDoctors = data.data;
  applyFilters();
}

// ─── Apply Filters ────────────────────────────────────────────
function applyFilters() {
  const search   = document.getElementById('search-input').value.trim().toLowerCase();
  const location = document.getElementById('location-filter').value;
  const specialty= document.querySelector('input[name="specialty"]:checked')?.value || '';
  const sort     = document.querySelector('input[name="sort"]:checked')?.value || 'rating';
  const online   = document.getElementById('filter-online').checked;
  const maxFee   = parseInt(document.getElementById('fee-range').value);

  filteredDoctors = allDoctors.filter(d => {
    if (search && !d.name.toLowerCase().includes(search) &&
        !d.specialty.toLowerCase().includes(search) &&
        !d.clinic.toLowerCase().includes(search)) return false;
    if (location && d.location !== location) return false;
    if (specialty && d.specialty !== specialty) return false;
    if (online && !d.online_consultation) return false;
    if (d.fee > maxFee) return false;
    return true;
  });

  // Sort
  if (sort === 'rating')     filteredDoctors.sort((a,b) => b.rating - a.rating);
  else if (sort === 'experience') filteredDoctors.sort((a,b) => b.experience - a.experience);
  else if (sort === 'fee_asc')    filteredDoctors.sort((a,b) => a.fee - b.fee);
  else if (sort === 'fee_desc')   filteredDoctors.sort((a,b) => b.fee - a.fee);

  renderDoctors(filteredDoctors);
}

// ─── Render Doctor Cards ──────────────────────────────────────
function renderDoctors(doctors) {
  const grid  = document.getElementById('doctors-grid');
  const empty = document.getElementById('empty-state');
  const count = document.getElementById('results-count');

  count.textContent = `${doctors.length} doctor${doctors.length !== 1 ? 's' : ''} found`;

  if (doctors.length === 0) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  grid.innerHTML = doctors.map(doc => {
    const initials = getDoctorInitials(doc.name);
    const starFull = Math.floor(doc.rating);
    const stars    = '★'.repeat(starFull) + (doc.rating % 1 >= 0.5 ? '½' : '') + '☆'.repeat(5 - starFull - (doc.rating % 1 >= 0.5 ? 1 : 0));
    return `
      <div class="doctor-card" onclick="window.location.href='doctor-detail.html?id=${doc.id}'">
        ${doc.verified ? '<div class="doctor-verified">✓ Verified</div>' : ''}
        <div class="doctor-card-header">
          <div class="doctor-avatar">${initials}</div>
          <div class="doctor-info">
            <div class="doctor-name">${doc.name}</div>
            <div class="doctor-specialty">${doc.specialty}</div>
            <div class="doctor-qual">${doc.qualification}</div>
          </div>
        </div>
        <div class="doctor-card-body">
          <div class="doctor-meta">
            <div class="doctor-meta-item">
              <span class="meta-icon">🏥</span>
              <span class="meta-value"><strong>${doc.experience} yrs</strong> exp</span>
            </div>
            <div class="doctor-meta-item">
              <span class="meta-icon">📍</span>
              <span class="meta-value">${doc.location}</span>
            </div>
            <div class="doctor-meta-item">
              <span class="meta-icon">🗣️</span>
              <span class="meta-value">${doc.languages.slice(0,2).join(', ')}</span>
            </div>
            <div class="doctor-meta-item">
              <span class="meta-icon">📅</span>
              <span class="meta-value">${doc.availability.join(', ')}</span>
            </div>
          </div>
          <div class="doctor-rating">
            <span class="stars">${stars}</span>
            <span class="rating-value">${doc.rating}</span>
            <span class="rating-count">(${doc.total_reviews} reviews)</span>
          </div>
          <div class="doctor-tags">
            ${doc.online_consultation ? '<span class="tag tag-online">📹 Online</span>' : ''}
            <span class="tag tag-clinic">🏥 In-Clinic</span>
          </div>
          <div class="doctor-fee">
            <div>
              <div class="fee-amount">₹${doc.fee}</div>
              <div class="fee-label">per consultation</div>
            </div>
            <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); window.location.href='doctor-detail.html?id=${doc.id}'">
              Book Now
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ─── Clear Filters ────────────────────────────────────────────
function clearFilters() {
  document.getElementById('search-input').value = '';
  document.getElementById('location-filter').value = '';
  document.getElementById('filter-online').checked = false;
  document.getElementById('fee-range').value = 1500;
  document.getElementById('fee-display').textContent = '1500';
  const allSpecRadio = document.querySelector('input[name="specialty"][value=""]');
  if (allSpecRadio) allSpecRadio.checked = true;
  const ratingRadio = document.querySelector('input[name="sort"][value="rating"]');
  if (ratingRadio) ratingRadio.checked = true;
  applyFilters();
}

// ─── Event Listeners ──────────────────────────────────────────
document.getElementById('search-btn')?.addEventListener('click', applyFilters);
document.getElementById('search-input')?.addEventListener('input', applyFilters);
document.getElementById('location-filter')?.addEventListener('change', applyFilters);
document.getElementById('filter-online')?.addEventListener('change', applyFilters);
document.querySelectorAll('input[name="sort"]').forEach(r => r.addEventListener('change', applyFilters));

// ─── Pre-fill URL Params ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // Pre-fill search from URL
  const search = urlParams.get('search');
  const loc    = urlParams.get('location');
  if (search) document.getElementById('search-input').value = search;
  if (loc)    document.getElementById('location-filter').value = loc;

  await loadSpecialtyFilters();
  await fetchDoctors();
});
