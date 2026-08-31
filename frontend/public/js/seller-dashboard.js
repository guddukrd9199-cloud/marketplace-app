const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || 'null');

if (!token || !user || user.role !== 'seller') {
  alert('Ye page sirf sellers ke liye hai. Pehle seller account se login karo.');
  window.location.href = '/login.html';
}

document.getElementById('product-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('name').value;
  const description = document.getElementById('description').value;
  const price = document.getElementById('price').value;
  const stock = document.getElementById('stock').value;
  const condition = document.getElementById('condition').value;
  const location = document.getElementById('location').value;
  const message = document.getElementById('message');

  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ name, description, price, stock, condition, location })
    });
    const data = await res.json();

    if (res.ok) {
      message.style.color = 'green';
      message.textContent = data.message;
      document.getElementById('product-form').reset();
      loadMyProducts();
    } else {
      message.style.color = 'red';
      message.textContent = data.error;
    }
  } catch (err) {
    message.style.color = 'red';
    message.textContent = 'Kuch galat hua, dobara try karo.';
  }
});

async function loadMyProducts() {
  const container = document.getElementById('my-products');
  try {
    const res = await fetch('/api/products/my/list', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const products = await res.json();

    if (!Array.isArray(products) || products.length === 0) {
      container.innerHTML = '<p>Abhi koi product add nahi kiya.</p>';
      return;
    }

    container.innerHTML = products.map(p => `
      <div class="product-card">
        <h3>${p.name}</h3>
        <p>Status: ${p.status}</p>
        <p class="price">₹${p.price}</p>
        <input type="file" id="file-${p.id}" accept="image/*" style="margin-top:8px;width:100%;">
        <button onclick="uploadImage(${p.id})" style="background:#555;color:white;border:none;padding:8px;border-radius:5px;margin-top:5px;width:100%;">Photo Upload Karo</button>
        <p id="upload-msg-${p.id}" style="font-size:0.85rem;margin-top:5px;"></p>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = '<p>Products load nahi ho paye.</p>';
  }
}

async function uploadImage(productId) {
  const fileInput = document.getElementById(`file-${productId}`);
  const msg = document.getElementById(`upload-msg-${productId}`);
  const file = fileInput.files[0];

  if (!file) {
    msg.style.color = 'red';
    msg.textContent = 'Pehle photo chuno';
    return;
  }

  const formData = new FormData();
  formData.append('image', file);

  try {
    const res = await fetch(`/api/products/${productId}/upload-image`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token },
      body: formData
    });
    const data = await res.json();

    if (res.ok) {
      msg.style.color = 'green';
      msg.textContent = 'Photo upload ho gayi!';
    } else {
      msg.style.color = 'red';
      msg.textContent = data.error;
    }
  } catch (err) {
    msg.style.color = 'red';
    msg.textContent = 'Upload nahi ho paya';
  }
}

loadMyProducts();
