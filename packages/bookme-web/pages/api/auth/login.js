export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  if (!global.users) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Find user
  const user = global.users.find(u => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Create session token (in production, use JWT)
  const token = Buffer.from(JSON.stringify({
    id: user.id,
    email: user.email,
    iat: Date.now(),
  })).toString('base64');

  return res.status(200).json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    message: 'Login successful',
  });
}
