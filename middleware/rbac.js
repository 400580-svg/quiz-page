export function requireLogin(req, res, next) {
  if (req.session && req.session.userId) return next();
  return res.status(401).json({ error: 'Not logged in' });
}

export function requireAdmin(req, res, next) {
  if (req.session?.userId && ['admin', 'teacher'].includes(req.session.role)) return next();
  return res.status(403).json({ error: 'Forbidden' });
}

export function requireSuperAdmin(req, res, next) {
  if (req.session?.userId && req.session.role === 'admin') return next();
  return res.status(403).json({ error: 'Forbidden' });
}
