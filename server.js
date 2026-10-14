import express from 'express';
import session from 'express-session';
import pgSession from 'connect-pg-simple';
import bcrypt from 'bcrypt';
import pool from './db/pool.js';
import { requireLogin, requireAdmin, requireSuperAdmin } from './middleware/rbac.js';

const app = express();
const PgStore = pgSession(session);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  store: new PgStore({ pool }),
  secret: process.env.SESSION_SECRET || 'dev-only-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 1000 * 60 * 60 * 24 }
}));

// ---- Cold-start admin bootstrap (production path; QA uses seed.sql) ----
async function bootstrapAdminAccount() {
  if (!process.env.ADMIN_BOOTSTRAP_EMAIL) return;
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS n FROM users WHERE role = 'admin' AND verification_status = 'verified'`
  );
  if (rows[0].n > 0) return;
  const hash = await bcrypt.hash(process.env.ADMIN_BOOTSTRAP_PASSWORD, 10);
  await pool.query(
    `INSERT INTO users (username, email, password_hash, role, verification_status, verified_at)
     VALUES ($1, $2, $3, 'admin', 'verified', CURRENT_TIMESTAMP)
     ON CONFLICT (email) DO NOTHING`,
    [process.env.ADMIN_BOOTSTRAP_USERNAME, process.env.ADMIN_BOOTSTRAP_EMAIL, hash]
  );
  console.log('[bootstrap] Admin account ensured.');
}

// ---- Auth routes ----
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, teacherKey } = req.body;
    if (!username || !email || !password || password.length < 8) {
      return res.status(400).json({ error: 'Username, email, and a password of 8+ characters are required.' });
    }
    const hash = await bcrypt.hash(password, 10);
    let role = 'player';
    let requestedRole = null;
    let verification = 'unverified';

    if (teacherKey) {
      const key = await pool.query(
        `SELECT id FROM educator_keys
         WHERE key_code = $1 AND is_active = TRUE
           AND (expires_at IS NULL OR expires_at > NOW())
           AND times_used < max_uses
         FOR UPDATE`,
        [teacherKey]
      );
      if (key.rowCount === 0) return res.status(400).json({ error: 'Invalid or expired educator key.' });
      role = 'teacher';
      verification = 'verified';
      await pool.query(`UPDATE educator_keys SET times_used = times_used + 1 WHERE id = $1`, [key.rows[0].id]);
    } else {
      requestedRole = 'teacher';
      verification = 'pending_approval';
    }

    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, role, requested_role, verification_status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, username, role`,
      [username, email, hash, role, requestedRole, verification]
    );
    res.status(201).json({ message: 'Registered successfully', user: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Username or email already taken.' });
    console.error(err);
    res.status(500).json({ error: 'Registration failed.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const { rows } = await pool.query(
      `SELECT id, username, password_hash, role, verification_status FROM users WHERE username = $1 OR email = $1`,
      [username]
    );
    const user = rows[0];
    const ok = user && (await bcrypt.compare(password, user.password_hash));
    if (!ok) return res.status(401).json({ error: 'Invalid credentials.' });

    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.role = user.role;
    res.json({ message: 'Logged in', user: { username: user.username, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed.' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => res.json({ message: 'Logged out' }));
});

app.get('/api/auth/me', (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: 'Not logged in' });
  res.json({ username: req.session.username, role: req.session.role });
});

// ---- RBAC gatekeeper routes ----
app.get('/api/admin/ping', requireLogin, requireSuperAdmin, (req, res) => {
  res.json({ message: 'admin access granted' });
});
app.get('/api/teacher/ping', requireLogin, requireAdmin, (req, res) => {
  res.json({ message: 'teacher or admin access granted' });
});

app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
pool.query('SELECT 1')
  .then(() => bootstrapAdminAccount())
  .then(() => app.listen(PORT, () => console.log(`NFL Quiz Central listening on ${PORT}`)))
  .catch((err) => { console.error('Startup failed:', err.message); process.exit(1); });
