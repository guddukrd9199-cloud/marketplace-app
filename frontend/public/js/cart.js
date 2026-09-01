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

async function checkout() {
  const address = document.getElementById("address").value;
  const message = document.getElementById("message");

  if (!address) {
    message.style.color = "red";
    message.textContent = "Address zaroori hai";
    return;
  }

  try {
    const res = await fetch("/api/orders/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({ address })
    });
    const data = await res.json();

    if (res.ok) {
      message.style.color = "green";
      message.textContent = `Order place ho gaya! Order ID: ${data.orderId}, Total: ₹${data.total}`;
      loadCart();
      setTimeout(() => { window.location.href = "/my-orders.html"; }, 1500);
    } else {
      message.style.color = "red";
      message.textContent = data.error;
    }
  } catch (err) {
    message.style.color = "red";
    message.textContent = "Kuch galat hua";
  }
}

loadCart();
