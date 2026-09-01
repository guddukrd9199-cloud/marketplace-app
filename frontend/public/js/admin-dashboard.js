const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "null");

if (!token || !user || user.role !== "admin") {
  alert("Ye page sirf admin ke liye hai.");
  window.location.href = "/login.html";
}

async function loadAllOrders() {
  const container = document.getElementById("all-orders");
  try {
    const res = await fetch("/api/orders/all", {
      headers: { "Authorization": "Bearer " + token }
    });
    const orders = await res.json();

    if (!Array.isArray(orders) || orders.length === 0) {
      container.innerHTML = "<p>Koi order nahi hai.</p>";
      return;
    }

    container.innerHTML = orders.map(o => {
      const mapLink = (o.latitude && o.longitude)
        ? `<a href="https://www.google.com/maps?q=${o.latitude},${o.longitude}" target="_blank" style="color:#2c7be5;">📍 Location Dekho (Map)</a>`
        : `<span style="color:#999;">Location nahi mili</span>`;

      return `
        <div class="product-card" style="margin-bottom:10px;">
          <h3>Order #${o.id}</h3>
          <p><b>Buyer:</b> ${o.buyer_name} (${o.buyer_email})</p>
          <p><b>Address:</b> ${o.address || 'N/A'}</p>
          <p>${mapLink}</p>
          <p><b>Total:</b> ₹${o.total_amount}</p>
          <p><b>Status:</b> ${o.status}</p>
          <p><b>Date:</b> ${new Date(o.created_at).toLocaleString()}</p>
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = "<p>Load nahi ho paya.</p>";
  }
}

async function loadPendingProducts() {
  const container = document.getElementById("pending-products");
  try {
    const res = await fetch("/api/admin/products/pending", {
      headers: { "Authorization": "Bearer " + token }
    });
    const products = await res.json();

    if (!Array.isArray(products) || products.length === 0) {
      container.innerHTML = "<p>Koi pending product nahi hai.</p>";
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
    container.innerHTML = "<p>Load nahi ho paya.</p>";
  }
}

async function loadAllProducts() {
  const container = document.getElementById("all-products");
  try {
    const res = await fetch("/api/products");
    const products = await res.json();

    if (!Array.isArray(products) || products.length === 0) {
      container.innerHTML = "<p>Koi approved product nahi hai.</p>";
      return;
    }

    container.innerHTML = products.map(p => `
      <div class="product-card">
        <h3>${p.name}</h3>
        <p>${p.description || ''}</p>
        <p class="price">₹${p.price}</p>
        <button onclick="deleteProduct(${p.id})" style="background:#900;color:white;border:none;padding:8px;border-radius:5px;margin-top:5px;width:100%;">Delete</button>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = "<p>Load nahi ho paya.</p>";
  }
}

async function approveProduct(id) {
  await fetch(`/api/admin/products/${id}/approve`, {
    method: "PUT",
    headers: { "Authorization": "Bearer " + token }
  });
  loadPendingProducts();
  loadAllProducts();
}

async function rejectProduct(id) {
  await fetch(`/api/admin/products/${id}/reject`, {
    method: "PUT",
    headers: { "Authorization": "Bearer " + token }
  });
  loadPendingProducts();
}

async function deleteProduct(id) {
  if (!confirm("Pakka delete karna hai?")) return;
  await fetch(`/api/admin/products/${id}`, {
    method: "DELETE",
    headers: { "Authorization": "Bearer " + token }
  });
  loadAllProducts();
}

async function loadUsers() {
  const container = document.getElementById("user-list");
  try {
    const res = await fetch("/api/admin/users", {
      headers: { "Authorization": "Bearer " + token }
    });
    const users = await res.json();

    container.innerHTML = users.map(u => `
      <p>👤 ${u.name} - ${u.email} - <b>${u.role}</b></p>
    `).join('');
  } catch (err) {
    container.innerHTML = "<p>Load nahi ho paya.</p>";
  }
}

loadAllOrders();
loadPendingProducts();
loadAllProducts();
loadUsers();
