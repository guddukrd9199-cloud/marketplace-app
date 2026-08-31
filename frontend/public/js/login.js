document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const message = document.getElementById('message');

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (res.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      message.style.color = 'green';
      message.textContent = 'Login successful! Redirect ho raha hai...';
      setTimeout(() => { window.location.href = '/'; }, 1000);
    } else {
      message.style.color = 'red';
      message.textContent = data.error;
    }
  } catch (err) {
    message.style.color = 'red';
    message.textContent = 'Kuch galat hua, dobara try karo.';
  }
});
