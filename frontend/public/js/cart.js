const token = localStorage.getItem("token");

if (!token) {
  alert("Pehle login karo!");
  window.location.href = "/login.html";
}

async function loadCart() {
  const container = document.getElementById("cart-items");
  const totalEl = document.getElementById("cart-total");

  try {
    const res = await fetch("/api/cart", {
      headers: { "Authorization": "Bearer " + token }
    });
    const items = await res.json();

    if (!Array.isArray(items) || items.length === 0) {
      container.innerHTML = "<p>Cart khali hai.</p>";
      totalEl.textContent = "";
      return;
    }

    let total = 0;
    container.innerHTML = items.map(item => {
      total += item.price * item.quantity;
      return `
        <div class="product-card" style="margin-bottom:10px;">
          <h3>${item.name}</h3>
          <p>Quantity: ${item.quantity}</p>
          <p class="price">₹${item.price} x ${item.quantity} = ₹${item.price * item.quantity}</p>
          <button onclick="removeItem(${item.id})" style="background:red;color:white;border:none;padding:6px;border-radius:5px;margin-top:5px;width:100%;">Remove</button>
        </div>
      `;
    }).join('');

    totalEl.textContent = `Total: ₹${total}`;
  } catch (err) {
    container.innerHTML = "<p>Load nahi ho paya.</p>";
  }
}

async function removeItem(itemId) {
  try {
    await fetch(`/api/cart/${itemId}`, {
      method: "DELETE",
      headers: { "Authorization": "Bearer " + token }
    });
    loadCart();
  } catch (err) {
    alert("Kuch galat hua");
  }
}

function getLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ latitude: null, longitude: null });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      () => {
        resolve({ latitude: null, longitude: null });
      }
    );
  });
}

async function checkout() {
  const address = document.getElementById("address").value;
  const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
  const message = document.getElementById("message");
  const upiInfo = document.getElementById("upi-info");

  if (!address) {
    message.style.color = "red";
    message.textContent = "Address zaroori hai";
    return;
  }

  message.style.color = "black";
  message.textContent = "Location detect ho raha hai...";
  upiInfo.innerHTML = "";

  const location = await getLocation();

  try {
    const res = await fetch("/api/orders/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({
        address,
        latitude: location.latitude,
        longitude: location.longitude,
        paymentMethod
      })
    });
    const data = await res.json();

    if (res.ok) {
      message.style.color = "green";

      if (data.method === "upi") {
        message.textContent = `Order place ho gaya! Order ID: ${data.orderId}, Total: ₹${data.total}`;
        upiInfo.innerHTML = `
          <div style="padding:15px;background:#f0f8f0;border:1px solid #28a745;border-radius:5px;">
            <p style="font-weight:bold;margin:0 0 8px 0;">📱 UPI Payment Karo:</p>
            <p style="margin:0 0 8px 0;">UPI ID: <b>${data.upiId}</b></p>
            <p style="margin:0 0 12px 0;">Amount: ₹${data.total}</p>
            <button onclick="markPaid(${data.orderId})" style="background:#2c7be5;color:white;border:none;padding:10px;border-radius:5px;width:100%;">Maine Payment Kar Diya</button>
          </div>
        `;
        loadCart();
      } else {
        message.textContent = `Order place ho gaya! Order ID: ${data.orderId}, Total: ₹${data.total}`;
        loadCart();
        setTimeout(() => { window.location.href = "/my-orders.html"; }, 1500);
      }
    } else {
      message.style.color = "red";
      message.textContent = data.error;
    }
  } catch (err) {
    message.style.color = "red";
    message.textContent = "Kuch galat hua";
  }
}

async function markPaid(orderId) {
  try {
    const res = await fetch(`/api/orders/${orderId}/mark-paid`, {
      method: "PUT",
      headers: { "Authorization": "Bearer " + token }
    });
    if (res.ok) {
      alert("Payment status update ho gaya! Verification ka wait karo.");
      window.location.href = "/my-orders.html";
    }
  } catch (err) {
    alert("Kuch galat hua");
  }
}

loadCart();
