const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || 'null');

if (!token || !user || user.role !== 'admin') {
  alert('Ye page sirf admin ke liye hai.');
  window.location.href = '/login.html';
}

async function loadPendingProducts() {
  const container = document.getElementById('pending-products');
  try {
    const res = await fetch('/api/admin/products/pending', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const products = await res.json();

    if (!Array.isArray(products) || products.length === 0) {
      container.innerHTML = '<p>Koi pending product nahi hai.</p>';
      return;
    }

    container.innerHTML = products.map(p => `
      <div class="product-card">
        <h3>${p.name}</h3>
        <p>${p.description || ''}</p>
        <p class="price">₹${p.price}</p>
        <button onclick="approveProduct(${p.id})" style="background:green;color:white;border:none;padding:8px;border-radius:5px;margin-top:5px;width:100%;">Approve</button>
        <button onclick="rejectProduct(${p.id})" style="background:red;color:white;border:none;padding:8px;border-radius:5px;margin-top:5px;width:100%;">Reject</button>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = '<p>Load nahi ho paya.</p>';
  }
}

async function approveProduct(id) {
  await fetch(`/api/admin/products/${id}/approve`, {
    method: 'PUT',
    headers: { 'Authorization': 'Bearer ' + token }
  });
  loadPendingProducts();
}

async function rejectProduct(id) {
  await fetch(`/api/admin/products/${id}/reject`, {
    method: 'PUT',
    headers: { 'Authorization': 'Bearer ' + token }
  });
  loadPendingProducts();
}

async function loadUsers() {
  const container = document.getElementById('user-list');
  try {
    const res = await fetch('/api/admin/users', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const users = await res.json();

    container.innerHTML = users.map(u => `
      <p>👤 ${u.name} — ${u.email} — <b>${u.role}</b></p>
    `).join('');
  } catch (err) {
    container.innerHTML = '<p>Load nahi ho paya.</p>';
  }
}

loadPendingProducts();
loadUsers();
