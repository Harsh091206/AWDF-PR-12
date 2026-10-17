const validateTask = (req, res, next) => {
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title is required for a task' });
  }
  
  if (typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({ error: 'Title must be a non-empty string' });
  }

  next();
};

const validateAuth = (req, res, next) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Please provide a valid email' });
  }

  next();
};

module.exports = { validateTask, validateAuth };
