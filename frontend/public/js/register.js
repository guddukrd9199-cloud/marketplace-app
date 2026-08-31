document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const role = document.getElementById('role').value;
  const message = document.getElementById('message');

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    });
    const data = await res.json();

    if (res.ok) {
      message.style.color = 'green';
      message.textContent = data.message + ' Ab login karo.';
      setTimeout(() => { window.location.href = '/login.html'; }, 1500);
    } else {
      message.style.color = 'red';
      message.textContent = data.error;
    }
  } catch (err) {
    message.style.color = 'red';
    message.textContent = 'Kuch galat hua, dobara try karo.';
  }
});
