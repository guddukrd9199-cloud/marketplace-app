function updateNavbar() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const nav = document.querySelector('.navbar nav');

  if (token && user) {
    let extraLink = '';
    if (user.role === 'seller') {
      extraLink = '<a href="/seller-dashboard.html">Dashboard</a>';
    } else if (user.role === 'admin') {
      extraLink = '<a href="/admin-dashboard.html">Dashboard</a>';
    }

    nav.innerHTML = `
      <a href="/">Home</a>
      <a href="/cart.html">Cart</a>
      <a href="/my-orders.html">Orders</a>
      ${extraLink}
      <span style="color:white; margin-left:15px;">👤 ${user.name} (${user.role})</span>
      <a href="#" id="logout-link">Logout</a>
    `;
    document.getElementById('logout-link').addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    });
  }
}

updateNavbar();

