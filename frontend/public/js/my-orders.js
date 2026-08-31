const token = localStorage.getItem('token');

if (!token) {
  alert('Pehle login karo!');
  window.location.href = '/login.html';
}

async function loadOrders() {
  const container = document.getElementById('orders-list');
  try {
    const res = await fetch('/api/orders/my', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const orders = await res.json();

    if (!Array.isArray(orders) || orders.length === 0) {
      container.innerHTML = '<p>Abhi koi order nahi hai.</p>';
      return;
    }

    container.innerHTML = orders.map(o => `
      <div class="product-card" style="margin-bottom:10px;">
        <h3>Order #${o.id}</h3>
        <p>Status: ${o.status}</p>
        <p>Address: ${o.address}</p>
        <p class="price">Total: ₹${o.total_amount}</p>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = '<p>Load nahi ho paya.</p>';
  }
}

loadOrders();
