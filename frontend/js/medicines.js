// ─── Medicines Page JS ──────────────────────────────────────────

let medicinesList = [];
let cart = {};

async function loadMedicines() {
  const search = document.getElementById('medicine-search-input').value.trim();
  const category = document.getElementById('category-filter').value;
  const grid = document.getElementById('medicines-grid');

  grid.innerHTML = `
    <div style="text-align:center; grid-column: 1/-1; padding: 40px;">
      <div class="spinner"></div>
      <p style="margin-top:12px; color:var(--text-secondary);">Loading medicines...</p>
    </div>
  `;

  let queryParams = [];
  if (search) queryParams.push(`search=${encodeURIComponent(search)}`);
  if (category) queryParams.push(`category=${encodeURIComponent(category)}`);

  const queryString = queryParams.length ? `?${queryParams.join('&')}` : '';
  const { ok, data } = await api(`/medicines${queryString}`);

  if (ok && data.data) {
    medicinesList = data.data;
    renderMedicines(medicinesList);
  } else {
    grid.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color:var(--text-secondary);">Failed to load medicines.</p>`;
  }
}

function renderMedicines(items) {
  const grid = document.getElementById('medicines-grid');
  if (items.length === 0) {
    grid.innerHTML = `
      <div class="glass-card" style="grid-column: 1/-1; text-align:center; padding: 40px;">
        <span style="font-size:2.5rem;">🔍</span>
        <h3 style="margin-top:10px;">No medicines found</h3>
        <p style="color:var(--text-secondary);">Try adjusting your search terms or filters.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = items.map(med => {
    const qty = cart[med.id] || 0;
    return `
      <div class="glass-card medicine-card" style="padding: 20px; display:flex; flex-direction:column; justify-content:space-between; transition: transform 0.2s ease, border-color 0.2s ease;">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 8px;">
            <span class="badge badge-blue" style="font-size:0.75rem;">${med.category}</span>
            ${med.prescription ? `<span class="badge badge-purple" style="font-size:0.75rem;">Rx Required</span>` : `<span class="badge badge-teal" style="font-size:0.75rem;">OTC</span>`}
          </div>
          <h3 style="font-size:1.1rem; margin-bottom:4px;">${med.name}</h3>
          <div style="color:var(--text-muted); font-size:0.85rem; margin-bottom:12px;">Brand: ${med.brand}</div>
        </div>

        <div style="border-top:1px solid var(--glass-border); padding-top:12px; margin-top:12px; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-size:1.25rem; font-weight:700; color:var(--teal-400);">₹${med.price}</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">Stock: ${med.stock} units</div>
          </div>
          
          <div>
            ${qty > 0 ? `
              <div style="display:flex; align-items:center; gap:8px; background:var(--navy-800); border:1px solid var(--glass-border); border-radius:8px; padding:4px 8px;">
                <button onclick="updateCartQuantity(${med.id}, -1)" style="background:none; border:none; color:var(--teal-400); font-weight:bold; cursor:pointer; padding:2px 6px;">-</button>
                <span style="font-weight:600; min-width:16px; text-align:center;">${qty}</span>
                <button onclick="updateCartQuantity(${med.id}, 1)" style="background:none; border:none; color:var(--teal-400); font-weight:bold; cursor:pointer; padding:2px 6px;">+</button>
              </div>
            ` : `
              <button class="btn btn-primary btn-sm" onclick="updateCartQuantity(${med.id}, 1)">Add to Cart</button>
            `}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function updateCartQuantity(medId, delta) {
  const current = cart[medId] || 0;
  const next = current + delta;
  if (next <= 0) {
    delete cart[medId];
  } else {
    cart[medId] = next;
  }
  updateCartBadge();
  renderMedicines(medicinesList);
}

function updateCartBadge() {
  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);
  document.getElementById('cart-count-badge').textContent = `${totalItems} Items`;
}

function openCartModal() {
  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);
  if (totalItems === 0) {
    showToast('Your cart is empty!', 'warning');
    return;
  }
  renderCartModal();
  openModal('cart-modal');
}

function renderCartModal() {
  const list = document.getElementById('cart-items-list');
  let totalPrice = 0;

  const itemsHtml = Object.keys(cart).map(medId => {
    const med = medicinesList.find(m => m.id == medId);
    if (!med) return '';
    const qty = cart[medId];
    const itemTotal = med.price * qty;
    totalPrice += itemTotal;

    return `
      <div style="display:flex; justify-content:space-between; align-items:center; background:var(--navy-800); padding:12px 16px; border-radius:8px; border:1px solid var(--glass-border);">
        <div>
          <strong style="color:var(--text-primary);">${med.name}</strong>
          <div style="font-size:0.8rem; color:var(--text-muted);">₹${med.price} x ${qty}</div>
        </div>
        <div style="font-size:1.1rem; font-weight:700; color:var(--teal-400);">₹${itemTotal}</div>
      </div>
    `;
  }).join('');

  list.innerHTML = itemsHtml;
  document.getElementById('cart-total-price').textContent = `₹${totalPrice}`;
}

function placeMedicineOrder() {
  if (!currentUser) {
    closeModal('cart-modal');
    openModal('login-modal');
    showToast('Please sign in to place an order', 'info');
    return;
  }

  showToast('Order placed successfully! 🚚 Delivery in 24 hours.', 'success');
  cart = {};
  updateCartBadge();
  closeModal('cart-modal');
  renderMedicines(medicinesList);
}

document.addEventListener('DOMContentLoaded', () => {
  loadMedicines();

  document.getElementById('medicine-search-input').addEventListener('input', loadMedicines);
  document.getElementById('category-filter').addEventListener('change', loadMedicines);
});
