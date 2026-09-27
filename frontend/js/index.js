// ─── Homepage JS ──────────────────────────────────────────────

const SPECIALTY_META = {
  'Cardiologist':     { icon: '❤️', color: '#F87171', bg: 'rgba(248,113,113,0.12)' },
  'Dermatologist':    { icon: '🧴', color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
  'Pediatrician':     { icon: '👶', color: '#34D399', bg: 'rgba(52,211,153,0.12)' },
  'Orthopedic Surgeon':{ icon: '🦴', color: '#60A5FA', bg: 'rgba(96,165,250,0.12)' },
  'Neurologist':      { icon: '🧠', color: '#FBBF24', bg: 'rgba(251,191,36,0.12)' },
  'Psychiatrist':     { icon: '🧘', color: '#818CF8', bg: 'rgba(129,140,248,0.12)' },
  'Gynecologist':     { icon: '🌸', color: '#F472B6', bg: 'rgba(244,114,182,0.12)' },
  'ENT Specialist':   { icon: '👂', color: '#2DD4BF', bg: 'rgba(45,212,191,0.12)' },
  'Ophthalmologist':  { icon: '👁️', color: '#38BDF8', bg: 'rgba(56,189,248,0.12)' },
  'Gastroenterologist':{ icon: '🫁', color: '#FB923C', bg: 'rgba(251,146,60,0.12)' },
  'Endocrinologist':  { icon: '⚗️', color: '#A3E635', bg: 'rgba(163,230,53,0.12)' },
  'Pulmonologist':    { icon: '🫀', color: '#00C9A7', bg: 'rgba(0,201,167,0.12)' },
};

// ─── Render Specialties ───────────────────────────────────────
async function renderSpecialties() {
  const grid = document.getElementById('specialties-grid');
  const { ok, data } = await api('/doctors/specialties');

  if (!ok) { grid.innerHTML = '<p style="color:var(--text-muted)">Could not load specialties.</p>'; return; }

  const specialties = data.data;
  const { ok: dok, data: ddata } = await api('/doctors');
  const doctors = dok ? ddata.data : [];

  grid.innerHTML = specialties.map(spec => {
    const meta = SPECIALTY_META[spec] || { icon: '🩺', color: 'var(--teal-400)', bg: 'rgba(0,201,167,0.12)' };
    const count = doctors.filter(d => d.specialty === spec).length;
    return `
      <div class="specialty-card animate-on-scroll" onclick="window.location.href='pages/doctors.html?specialty=${encodeURIComponent(spec)}'">
        <div class="specialty-icon" style="background:${meta.bg}; color:${meta.color}">${meta.icon}</div>
        <div class="specialty-name">${spec}</div>
        <div class="specialty-count">${count} doctor${count !== 1 ? 's' : ''}</div>
      </div>
    `;
  }).join('');
}

// ─── Render Top Doctors ───────────────────────────────────────
async function renderTopDoctors() {
  const grid = document.getElementById('top-doctors-grid');
  const { ok, data } = await api('/doctors?sort=rating');

  if (!ok) { grid.innerHTML = '<p style="color:var(--text-muted)">Could not load doctors.</p>'; return; }

  const doctors = data.data.slice(0, 6);
  grid.innerHTML = doctors.map(doc => renderDoctorCard(doc)).join('');
}

// ─── Doctor Card HTML ─────────────────────────────────────────
function renderDoctorCard(doc) {
  const initials = getDoctorInitials(doc.name);
  const stars    = '★'.repeat(Math.floor(doc.rating)) + (doc.rating % 1 >= 0.5 ? '½' : '');
  return `
    <div class="doctor-card" onclick="window.location.href='pages/doctor-detail.html?id=${doc.id}'" id="doc-card-${doc.id}">
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
        </div>
        <div class="doctor-rating">
          <span class="stars" style="color:#FBBF24">${stars}</span>
          <span class="rating-value">${doc.rating}</span>
          <span class="rating-count">(${doc.total_reviews} reviews)</span>
        </div>
        <div class="doctor-tags">
          ${doc.online_consultation ? '<span class="tag tag-online">📹 Online</span>' : ''}
          <span class="tag tag-clinic">🏥 Clinic</span>
          <span class="tag tag-location">📍 ${doc.location}</span>
        </div>
        <div class="doctor-fee">
          <div>
            <div class="fee-amount">₹${doc.fee}</div>
            <div class="fee-label">Consultation fee</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); window.location.href='pages/doctor-detail.html?id=${doc.id}'">
            Book Now
          </button>
        </div>
      </div>
    </div>
  `;
}

// ─── Hero Search ──────────────────────────────────────────────
function quickSearch(term) {
  window.location.href = `pages/doctors.html?search=${encodeURIComponent(term)}`;
}

document.getElementById('hero-search-btn')?.addEventListener('click', () => {
  const q   = document.getElementById('hero-search-input').value.trim();
  const loc = document.getElementById('hero-location-select').value;
  let url   = 'pages/doctors.html?';
  if (q)   url += `search=${encodeURIComponent(q)}&`;
  if (loc) url += `location=${encodeURIComponent(loc)}`;
  window.location.href = url;
});

document.getElementById('hero-search-input')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('hero-search-btn').click();
});

// ─── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderSpecialties();
  renderTopDoctors();
});
