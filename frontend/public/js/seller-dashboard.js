const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user"));

if (!token || !user || user.role !== "seller") {
  window.location.href = "/login.html";
}

document.getElementById("productForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData();
  formData.append("name", document.getElementById("title").value);
  formData.append("description", document.getElementById("description").value);
  formData.append("price", document.getElementById("price").value);
  formData.append("location", document.getElementById("location").value);

  const imageFile = document.getElementById("image").files[0];
  if (imageFile) {
    formData.append("image", imageFile);
  }

  try {
    const res = await fetch("/api/products", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + token
      },
      body: formData
    });

    const data = await res.json();

    if (res.ok) {
      alert("Product add ho gaya! Admin approval ka wait karo.");
      document.getElementById("productForm").reset();
      loadMyProducts();
    } else {
      alert("Error: " + data.error);
    }
  } catch (err) {
    alert("Kuch galat ho gaya: " + err.message);
  }
});

async function loadMyProducts() {
  try {
    const res = await fetch("/api/products/my/list", {
      headers: {
        "Authorization": "Bearer " + token
      }
    });
    const products = await res.json();

    const container = document.getElementById("myProducts");
    container.innerHTML = "";

    if (products.length === 0) {
      container.innerHTML = "<p>Abhi tak koi product add nahi kiya.</p>";
      return;
    }

    products.forEach(p => {
      const div = document.createElement("div");
      div.style.border = "1px solid #ccc";
      div.style.padding = "10px";
      div.style.marginBottom = "10px";

      const imageTag = (p.images && p.images.length > 0)
        ? `<img src="${p.images[0].image_path}" style="width:100px; height:100px; object-fit:cover; display:block; margin-bottom:8px;">`
        : '';

      div.innerHTML = `
        ${imageTag}
        <strong>${p.name}</strong> - ₹${p.price} <br>
        Status: ${p.status} <br>
        Location: ${p.location}
      `;
      container.appendChild(div);
    });
  } catch (err) {
    document.getElementById("myProducts").innerHTML = "<p>Products load nahi ho paye.</p>";
  }
}

async function loadMyOrders() {
  try {
    const res = await fetch("/api/orders/seller", {
      headers: {
        "Authorization": "Bearer " + token
      }
    });
    const orders = await res.json();

    const container = document.getElementById("myOrders");
    container.innerHTML = "";

    if (!Array.isArray(orders) || orders.length === 0) {
      container.innerHTML = "<p>Abhi tak koi order nahi hai.</p>";
      return;
    }

    orders.forEach(o => {
      const div = document.createElement("div");
      div.style.border = "1px solid #ccc";
      div.style.padding = "10px";
      div.style.marginBottom = "10px";

      const completeButton = o.order_status !== "completed"
        ? `<button onclick="markCompleted(${o.order_id})" style="background:green;color:white;border:none;padding:8px;border-radius:5px;margin-top:8px;width:100%;">Completed Mark Karo</button>`
        : `<p style="color:green;font-weight:bold;">✔ Completed</p>`;

      div.innerHTML = `
        <strong>${o.product_name}</strong> x ${o.quantity} <br>
        Price: ₹${o.price} <br>
        Order Status: ${o.order_status} <br>
        Address: ${o.address || 'N/A'} <br>
        Order Date: ${new Date(o.created_at).toLocaleDateString()}
        ${completeButton}
      `;
      container.appendChild(div);
    });
  } catch (err) {
    document.getElementById("myOrders").innerHTML = "<p>Orders load nahi ho paye.</p>";
  }
}

async function markCompleted(orderId) {
  try {
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({ status: "completed" })
    });

    if (res.ok) {
      alert("Order completed mark ho gaya!");
      loadMyOrders();
    } else {
      alert("Kuch galat ho gaya");
    }
  } catch (err) {
    alert("Error: " + err.message);
  }
}

loadMyProducts();
loadMyOrders();
