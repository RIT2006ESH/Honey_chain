const { Router } = require('express');
const { users } = require('../store');
const router = Router();

// Users Management
router.get('/', (req, res) => {
  res.json({ ok: true, users: Object.values(users) });
});

router.post('/', (req, res) => {
  const { name, email, role, cluster } = req.body;
  if (!name || !email || !role) return res.status(400).json({ ok: false, error: 'Name, email and role required' });
  const id = 'U' + String(Object.keys(users).length + 1).padStart(3, '0');
  const user = { id, name, email, role, cluster: cluster || '—', status: 'Invited', joined: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) };
  users[id] = user;
  res.json({ ok: true, user });
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  if (!users[id]) return res.status(404).json({ ok: false, error: 'User not found' });
  delete users[id];
  res.json({ ok: true });
});

module.exports = router;