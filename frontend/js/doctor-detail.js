// ─── Doctor Detail Page ───────────────────────────────────────

let doctor = null;
let selectedRating = 0;
let selectedSlot   = null;
const doctorId = parseInt(new URLSearchParams(window.location.search).get('id'));

// ─── Load Doctor ──────────────────────────────────────────────
async function loadDoctor() {
  if (!doctorId) {
    document.getElementById('doctor-detail-wrapper').innerHTML =
      '<div class="empty-state"><div class="empty-icon">❌</div><div class="empty-title">Doctor not found</div></div>';
    return;
  }

  const { ok, data } = await api(`/doctors/${doctorId}`);
  if (!ok) {
    document.getElementById('doctor-detail-wrapper').innerHTML =
      '<div class="empty-state"><div class="empty-icon">❌</div><div class="empty-title">Doctor not found</div></div>';
    return;
  }

  doctor = data.data;
  document.title = `${doctor.name} — MediCare`;
  renderDoctorDetail(doctor);
}

// ─── Render Doctor Profile ────────────────────────────────────
function renderDoctorDetail(doc) {
  const initials = getDoctorInitials(doc.name);
  const stars    = '★'.repeat(Math.floor(doc.rating)) + (doc.rating % 1 >= 0.5 ? '½' : '') + '☆'.repeat(5 - Math.floor(doc.rating) - (doc.rating % 1 >= 0.5 ? 1 : 0));

  document.getElementById('doctor-detail-wrapper').innerHTML = `
    <!-- Breadcrumb -->
    <div style="display:flex;align-items:center;gap:8px;color:var(--text-muted);font-size:0.85rem;margin-bottom:24px">
      <a href="../index.html" style="color:var(--text-muted);transition:var(--transition)" onmouseover="this.style.color='var(--teal-400)'" onmouseout="this.style.color='var(--text-muted)'">Home</a>
      <span>›</span>
      <a href="doctors.html" style="color:var(--text-muted);transition:var(--transition)" onmouseover="this.style.color='var(--teal-400)'" onmouseout="this.style.color='var(--text-muted)'">Doctors</a>
      <span>›</span>
      <span>${doc.name}</span>
    </div>

    <div style="display:grid;grid-template-columns:1fr 340px;gap:32px;align-items:start">
      <!-- Left: Doctor Info -->
      <div>
        <!-- Header Card -->
        <div class="glass-card" style="padding:32px;margin-bottom:24px">
          <div style="display:flex;gap:24px;align-items:flex-start">
            <div class="doctor-avatar" style="width:90px;height:90px;font-size:2rem;flex-shrink:0">${initials}</div>
            <div style="flex:1">
              <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:8px">
                <h1 style="font-size:1.8rem;font-weight:800">${doc.name}</h1>
                ${doc.verified ? '<span class="badge badge-teal">✓ Verified</span>' : ''}
              </div>
              <div style="color:var(--teal-400);font-size:1rem;font-weight:600;margin-bottom:4px">${doc.specialty}</div>
              <div style="color:var(--text-secondary);font-size:0.9rem;margin-bottom:12px">${doc.qualification}</div>
              <div style="display:flex;gap:16px;flex-wrap:wrap">
                <span style="display:flex;align-items:center;gap:6px;font-size:0.88rem;color:var(--text-secondary)">
                  <span>🏥</span> ${doc.experience} years experience
                </span>
                <span style="display:flex;align-items:center;gap:6px;font-size:0.88rem;color:var(--text-secondary)">
                  <span>📍</span> ${doc.location}
                </span>
                <span style="display:flex;align-items:center;gap:6px;font-size:0.88rem;color:var(--text-secondary)">
                  <span>🗣️</span> ${doc.languages.join(', ')}
                </span>
              </div>
              <div style="display:flex;align-items:center;gap:8px;margin-top:12px">
                <span style="color:#FBBF24;font-size:1.1rem">${stars}</span>
                <span style="font-weight:700">${doc.rating}</span>
                <span style="color:var(--text-muted);font-size:0.85rem">(${doc.total_reviews} reviews)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab Navigation -->
        <div class="tab-nav" id="detail-tabs">
          <button class="tab-btn active" onclick="showTab('about')" id="tab-about">📋 About</button>
          <button class="tab-btn" onclick="showTab('availability')" id="tab-availability">📅 Availability</button>
          <button class="tab-btn" onclick="showTab('reviews')" id="tab-reviews">⭐ Reviews (${doc.total_reviews})</button>
        </div>

        <!-- About Tab -->
        <div id="panel-about">
          <div class="glass-card" style="padding:24px;margin-bottom:20px">
            <h4 style="margin-bottom:12px;color:var(--teal-400)">About</h4>
            <p style="color:var(--text-secondary);line-height:1.8;font-size:0.95rem">${doc.bio}</p>
          </div>
          <div class="grid-2" style="margin-bottom:20px">
            <div class="glass-card" style="padding:20px">
              <h4 style="margin-bottom:12px;color:var(--teal-400)">Clinic</h4>
              <p style="color:var(--text-secondary);font-size:0.9rem">📍 ${doc.clinic}</p>
            </div>
            <div class="glass-card" style="padding:20px">
              <h4 style="margin-bottom:12px;color:var(--teal-400)">Consultation Types</h4>
              <div style="display:flex;gap:8px;flex-wrap:wrap">
                <span class="tag tag-clinic">🏥 In-Clinic</span>
                ${doc.online_consultation ? '<span class="tag tag-online">📹 Online</span>' : '<span style="color:var(--text-muted);font-size:0.82rem">Online not available</span>'}
              </div>
            </div>
          </div>
          <div class="glass-card" style="padding:20px">
            <h4 style="margin-bottom:12px;color:var(--teal-400)">Languages Spoken</h4>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              ${doc.languages.map(l => `<span class="badge badge-blue">${l}</span>`).join('')}
            </div>
          </div>
        </div>

        <!-- Availability Tab -->
        <div id="panel-availability" class="hidden">
          <div class="glass-card" style="padding:24px">
            <h4 style="margin-bottom:16px;color:var(--teal-400)">Available Days</h4>
            <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:24px">
              ${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day => `
                <div style="padding:8px 16px;border-radius:var(--radius-sm);border:1px solid;font-size:0.85rem;font-weight:600;
                  ${doc.availability.includes(day) ? 'background:rgba(0,201,167,0.12);color:var(--teal-400);border-color:rgba(0,201,167,0.3)' : 'background:rgba(255,255,255,0.03);color:var(--text-muted);border-color:rgba(255,255,255,0.05)'}">
                  ${day}
                </div>
              `).join('')}
            </div>
            <h4 style="margin-bottom:16px;color:var(--teal-400)">Available Time Slots</h4>
            <div class="slots-grid">
              ${doc.slots.map(slot => `
                <div style="padding:8px 14px;border-radius:var(--radius-sm);background:rgba(0,201,167,0.08);border:1px solid rgba(0,201,167,0.2);color:var(--teal-400);font-size:0.83rem;font-weight:600">
                  ${slot}
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Reviews Tab -->
        <div id="panel-reviews" class="hidden">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
            <h4>Patient Reviews</h4>
            <button class="btn btn-primary btn-sm" onclick="openReviewModal()">Write Review</button>
          </div>
          <div id="reviews-list">
            ${renderReviewsList(doc.reviews || [])}
          </div>
        </div>
      </div>

      <!-- Right: Booking Card -->
      <div style="position:sticky;top:90px">
        <div class="glass-card" style="padding:28px">
          <div style="font-size:2rem;font-weight:800;color:var(--teal-400);font-family:'Outfit',sans-serif;margin-bottom:4px">₹${doc.fee}</div>
          <div style="font-size:0.82rem;color:var(--text-muted);margin-bottom:20px">per consultation</div>

          <div style="display:flex;gap:10px;margin-bottom:20px">
            <div style="flex:1;text-align:center;padding:12px;background:rgba(255,255,255,0.03);border-radius:var(--radius-md);border:1px solid var(--glass-border)">
              <div style="font-size:1.2rem;font-weight:700;color:var(--text-primary)">${doc.experience}+</div>
              <div style="font-size:0.72rem;color:var(--text-muted)">Years Exp</div>
            </div>
            <div style="flex:1;text-align:center;padding:12px;background:rgba(255,255,255,0.03);border-radius:var(--radius-md);border:1px solid var(--glass-border)">
              <div style="font-size:1.2rem;font-weight:700;color:var(--yellow-400)">${doc.rating}★</div>
              <div style="font-size:0.72rem;color:var(--text-muted)">Rating</div>
            </div>
            <div style="flex:1;text-align:center;padding:12px;background:rgba(255,255,255,0.03);border-radius:var(--radius-md);border:1px solid var(--glass-border)">
              <div style="font-size:1.2rem;font-weight:700;color:var(--text-primary)">${doc.total_reviews}</div>
              <div style="font-size:0.72rem;color:var(--text-muted)">Reviews</div>
            </div>
          </div>

          <div style="margin-bottom:16px;padding:12px;background:rgba(74,222,128,0.06);border-radius:var(--radius-md);border:1px solid rgba(74,222,128,0.15)">
            <div style="font-size:0.82rem;color:var(--green-400);font-weight:600">🟢 Available Today</div>
            <div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px">${doc.availability.join(', ')}</div>
          </div>

          <button class="btn btn-primary btn-full btn-lg" onclick="openBookingModal()">
            📅 Book Appointment
          </button>
          ${doc.online_consultation ? `
          <button class="btn btn-secondary btn-full" style="margin-top:10px" onclick="openBookingModal('online')">
            📹 Book Online Consult
          </button>` : ''}

          <div style="margin-top:16px;padding:12px;text-align:center">
            <div style="font-size:0.8rem;color:var(--text-muted)">📞 Need help? <span style="color:var(--teal-400);font-weight:600">1800-123-4567</span></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ─── Render Reviews ───────────────────────────────────────────
function renderReviewsList(reviews) {
  if (!reviews || reviews.length === 0) {
    return '<div class="empty-state" style="padding:40px"><div class="empty-icon">💬</div><div class="empty-title">No reviews yet</div><div class="empty-desc">Be the first to review this doctor</div></div>';
  }
  return reviews.map(r => `
    <div class="glass-card" style="padding:20px;margin-bottom:12px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
        <div style="font-weight:600;font-size:0.9rem">${r.patient_name}</div>
        <div style="font-size:0.75rem;color:var(--text-muted)">${formatDate(r.created_at)}</div>
      </div>
      <div style="color:#FBBF24;font-size:1rem;margin-bottom:8px">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
      <p style="color:var(--text-secondary);font-size:0.88rem;line-height:1.7">${r.comment || '<em style="opacity:0.5">No written review</em>'}</p>
    </div>
  `).join('');
}

// ─── Tab Switching ────────────────────────────────────────────
function showTab(tab) {
  ['about', 'availability', 'reviews'].forEach(t => {
    document.getElementById(`panel-${t}`)?.classList.toggle('hidden', t !== tab);
    document.getElementById(`tab-${t}`)?.classList.toggle('active', t === tab);
  });
}

// ─── Booking Modal ────────────────────────────────────────────
function openBookingModal(type = 'clinic') {
  if (!currentUser) { openModal('login-modal'); showToast('Please sign in to book an appointment', 'warning'); return; }
  if (!doctor) return;

  document.getElementById('booking-doctor-info').innerHTML = `
    <div style="display:flex;align-items:center;gap:12px">
      <div class="doctor-avatar" style="width:44px;height:44px;font-size:1rem">${getDoctorInitials(doctor.name)}</div>
      <div>
        <div style="font-weight:700;font-size:0.95rem">${doctor.name}</div>
        <div style="font-size:0.8rem;color:var(--teal-400)">${doctor.specialty}</div>
      </div>
    </div>
  `;
  document.getElementById('booking-fee').textContent = `₹${doctor.fee}`;

  if (type === 'online') document.getElementById('type-online').checked = true;
  else document.getElementById('type-clinic').checked = true;

  // Min date = today
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('booking-date').min = today;
  document.getElementById('booking-date').value = today;

  selectedSlot = null;
  loadBookingSlots(today);
  openModal('booking-modal');
}

// Load Slots for Selected Date
document.getElementById('booking-date')?.addEventListener('change', (e) => {
  loadBookingSlots(e.target.value);
});

async function loadBookingSlots(date) {
  if (!doctor || !date) return;
  const grid = document.getElementById('slots-grid');
  grid.innerHTML = '<div style="color:var(--text-muted);font-size:0.85rem">Loading slots...</div>';

  const { ok, data } = await api(`/appointments/doctor/${doctor.id}/booked-slots?date=${date}`);
  const bookedSlots  = ok ? data.data : [];

  grid.innerHTML = doctor.slots.map(slot => {
    const isBooked = bookedSlots.includes(slot);
    return `
      <button class="slot-btn ${isBooked ? 'booked' : ''}"
        ${isBooked ? 'disabled' : `onclick="selectSlot('${slot}', this)"`}>
        ${slot} ${isBooked ? '(Booked)' : ''}
      </button>
    `;
  }).join('');
}

function selectSlot(slot, el) {
  document.querySelectorAll('.slot-btn').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
  selectedSlot = slot;
}

async function confirmBooking() {
  if (!selectedSlot) { showToast('Please select a time slot', 'warning'); return; }
  const date  = document.getElementById('booking-date').value;
  const type  = document.querySelector('input[name="apt-type"]:checked').value;
  const notes = document.getElementById('booking-notes').value.trim();
  const btn   = document.getElementById('confirm-booking-btn');

  if (!date) { showToast('Please select a date', 'warning'); return; }

  btn.textContent = 'Booking...';
  btn.disabled    = true;

  const { ok, data } = await api('/appointments', {
    method: 'POST',
    body: JSON.stringify({ doctor_id: doctor.id, date, slot: selectedSlot, type, notes })
  });

  btn.textContent = 'Confirm Appointment';
  btn.disabled    = false;

  if (ok) {
    closeModal('booking-modal');
    showToast(`Appointment confirmed for ${formatDate(date)} at ${selectedSlot} 🎉`, 'success', 5000);
  } else {
    showToast(data.error || 'Booking failed', 'error');
  }
}

// ─── Review Modal ─────────────────────────────────────────────
function openReviewModal() {
  if (!currentUser) { openModal('login-modal'); showToast('Please sign in to write a review', 'warning'); return; }
  selectedRating = 0;
  document.getElementById('review-text').value = '';
  setRating(0);
  openModal('review-modal');
}

function setRating(val) {
  selectedRating = val;
  document.querySelectorAll('#review-stars .star').forEach((s, i) => {
    s.classList.toggle('active', i < val);
  });
}

async function submitReview() {
  if (selectedRating === 0) { showToast('Please select a rating', 'warning'); return; }
  const comment = document.getElementById('review-text').value.trim();

  const { ok, data } = await api('/reviews', {
    method: 'POST',
    body: JSON.stringify({ doctor_id: doctor.id, rating: selectedRating, comment })
  });

  if (ok) {
    closeModal('review-modal');
    showToast('Review submitted! Thank you 🙏', 'success');
    // Refresh reviews
    const { ok: rok, data: rdata } = await api(`/reviews/doctor/${doctor.id}`);
    if (rok) {
      document.getElementById('reviews-list').innerHTML = renderReviewsList(rdata.data);
    }
  } else {
    showToast(data.error || 'Failed to submit review', 'error');
  }
}

// ─── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', loadDoctor);
