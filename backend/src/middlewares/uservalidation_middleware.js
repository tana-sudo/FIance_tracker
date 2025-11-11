export const validateUser = (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      error: "Username and password are required."
    });
  }

  next();
};

export const validateNewUser = (req, res, next) => {
  const { username, fname, email, password, gender, dob } = req.body;

  // Regex rules - UPDATED to match frontend
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Check required fields
  if (!username || !fname || !email || !password || !gender || !dob) {
    return res.status(400).json({ error: "Please fill in all fields." });
  }

  // Username length
  if (username.length < 3) {
    return res.status(400).json({
      error: "Username must be at least 3 characters long."
    });
  }

  // Full name length
  if (fname.trim().length < 2) {
    return res.status(400).json({
      error: "Full name must be at least 2 characters long."
    });
  }

  // Password strength - UPDATED
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      error: "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character."
    });
  }

  // Valid email format
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      error: "Please enter a valid email address."
    });
  }

  // Validate age
  const age = new Date().getFullYear() - new Date(dob).getFullYear();
  if (age < 13) {
    return res.status(400).json({
      error: "You must be at least 13 years old to register."
    });
  }

  // Validate gender
  if (!['male', 'female', 'other'].includes(gender.toLowerCase())) {
    return res.status(400).json({
      error: "Please select a valid gender."
    });
  }

  next();
};

export default { validateUser, validateNewUser };