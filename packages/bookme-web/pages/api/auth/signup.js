export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // Store in simple in-memory DB (for dev/testing)
  // In production, use persistent database
  if (!global.users) {
    global.users = [];
  }

  // Check if user already exists
  if (global.users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'User already exists' });
  }

  // Create user (password should be hashed in production)
  const user = {
    id: Math.random().toString(36).substr(2, 9),
    email,
    password, // NEVER STORE PLAINTEXT IN PRODUCTION
    name: name || email.split('@')[0],
    createdAt: new Date().toISOString(),
  };

  global.users.push(user);

  return res.status(201).json({
    id: user.id,
    email: user.email,
    name: user.name,
    message: 'Signup successful - user created',
  });
}
