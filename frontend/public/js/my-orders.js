const token = localStorage.getItem("token");

if (!token) {
  alert("Pehle login karo!");
  window.location.href = "/login.html";
}

async function loadOrders() {
  const container = document.getElementById("orders-list");
  try {
    const res = await fetch("/api/orders/my", {
      headers: { "Authorization": "Bearer " + token }
    });
    const orders = await res.json();

    if (!Array.isArray(orders) || orders.length === 0) {
      container.innerHTML = "<p>Abhi koi order nahi hai.</p>";
      return;
    }

    container.innerHTML = orders.map(o => {
      const cancelButton = o.status === "pending"
        ? `<button onclick="cancelOrder(${o.id})" style="background:red;color:white;border:none;padding:8px;border-radius:5px;margin-top:8px;width:100%;">Order Cancel Karo</button>`
        : '';

      return `
        <div class="product-card" style="margin-bottom:10px;">
          <h3>Order #${o.id}</h3>
          <p>Status: ${o.status}</p>
          <p>Address: ${o.address}</p>
          <p class="price">Total: ₹${o.total_amount}</p>
          ${cancelButton}
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = "<p>Load nahi ho paya.</p>";
  }
}

async function cancelOrder(orderId) {
  if (!confirm("Pakka order cancel karna hai?")) return;

  try {
    const res = await fetch(`/api/orders/${orderId}/cancel`, {
      method: "PUT",
      headers: { "Authorization": "Bearer " + token }
    });
    const data = await res.json();

    if (res.ok) {
      alert("Order cancel ho gaya");
      loadOrders();
    } else {
      alert(data.error);
    }
  } catch (err) {
    alert("Kuch galat hua");
  }
}

loadOrders();
