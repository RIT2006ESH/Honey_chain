const { Router } = require('express');
const router = Router();

// Mock Authentication
router.post('/login', (req, res) => {
  const { email } = req.body;
  let role = '';
  let name = '';

  if (email === 'beekeeper@honeychain.demo') { role = 'BEEKEEPER'; name = 'Rameshwar Verma'; }
  else if (email === 'processor@honeychain.demo') { role = 'PROCESSOR'; name = 'Satara Processing Unit'; }
  else if (email === 'tester@honeychain.demo') { role = 'TESTER'; name = 'Dr. Sharma'; }
  else if (email === 'manufacturer@honeychain.demo') { role = 'MANUFACTURER'; name = 'Nashik Packing Works'; }
  else return res.status(401).json({ ok: false, error: 'Invalid mock credentials' });

  res.json({ ok: true, user: { email, role, name } });
});

module.exports = router;