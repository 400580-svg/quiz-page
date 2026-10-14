const msg = (form) => form.querySelector('#msg');

if (document.getElementById('register-form')) {
  document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    const res = await fetch('/api/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(f)))
    });
    const data = await res.json();
    msg(f).textContent = res.ok ? 'Registered! Redirecting…' : data.error;
    if (res.ok) setTimeout(() => location.href = '/login.html', 1000);
  });
}

if (document.getElementById('login-form')) {
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    const res = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(f)))
    });
    const data = await res.json();
    msg(f).textContent = res.ok ? 'Welcome back!' : data.error;
    if (res.ok) setTimeout(() => location.href = '/dashboard.html', 800);
  });
}

if (document.getElementById('dashboard')) {
  fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(me => {
    if (!me) { location.href = '/login.html'; return; }
    document.getElementById('welcome').textContent = 'Welcome, ' + me.username + ' (' + me.role + ')';
  });
  document.getElementById('logout-btn').addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    location.href = '/login.html';
  });
}
