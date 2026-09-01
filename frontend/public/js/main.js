const token = localStorage.getItem("token");

async function loadProducts() {
  const container = document.getElementById("product-list");

  if (!token) {
    container.innerHTML = `
      <div style="text-align:center; padding:40px;">
        <p style="font-size:18px; margin-bottom:20px;">Products dekhne ke liye pehle login ya register karo</p>
        <a href="/login.html" style="background:#2c7be5;color:white;border:none;padding:10px 20px;border-radius:5px;text-decoration:none;margin-right:10px;">Login</a>
        <a href="/register.html" style="background:#28a745;color:white;border:none;padding:10px 20px;border-radius:5px;text-decoration:none;">Register</a>
      </div>
    `;
    return;
  }

  try {
    const res = await fetch('/api/products');
    const products = await res.json();

    if (products.length === 0) {
      container.innerHTML = "<p>Koi product available nahi hai.</p>";
      return;
    }

    const productsWithImages = await Promise.all(products.map(async (p) => {
      try {
        const detailRes = await fetch(`/api/products/${p.id}`);
        const detail = await detailRes.json();
        p.images = detail.images || [];
      } catch (e) {
        p.images = [];
      }
      return p;
    }));

    container.innerHTML = productsWithImages.map(p => `
      <div class="product-card">
        ${p.images.length > 0
          ? `<img src="${p.images[0].image_path}" style="width:100%;height:140px;object-fit:cover;border-radius:6px;margin-bottom:8px;">`
          : `<div style="width:100%;height:140px;background:#eee;border-radius:6px;margin-bottom:8px;display:flex;align-items:center;justify-content:center;color:#999;">No Image</div>`
        }
        <h3>${p.name}</h3>
        <p>${p.description || ''}</p>
        <p>Location: ${p.location || 'N/A'}</p>
        <p class="price">₹${p.price}</p>
        <button onclick="addToCart(${p.id})" style="background:#2c7be5;color:white;border:none;padding:8px;border-radius:5px;margin-top:8px;width:100%;">Cart Mein Add Karo</button>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = "<p>Products load nahi ho paye.</p>";
  }
}

async function addToCart(productId) {
  if (!token) {
    alert('Pehle login karo!');
    window.location.href = '/login.html';
    return;
  }

  try {
    const res = await fetch('/api/cart/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ product_id: productId, quantity: 1 })
    });
    const data = await res.json();

    if (res.ok) {
      alert('Cart mein add ho gaya!');
    } else {
      alert(data.error);
    }
  } catch (err) {
    alert('Kuch galat hua');
  }
}

loadProducts();
