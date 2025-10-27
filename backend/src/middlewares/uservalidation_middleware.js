export const validateUser = (req, res, next) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required." });
   
  }
   next();
};

export const validate_newUser = (req, res, next) => {
  const { username, fname, email, password } = req.body;
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!username || !fname || !email || !password) {
    return res.status(400).json({ error: "fill in all the boxes ." });
  } 
  
  if (username.length < 3) {
    return res
      .status(400)
      .json({ error: "Username must be at least 3 characters long." });
  } 
  
  if (!password || !passwordRegex.test(password)) {
    return res
      .status(400)
      .json({
        error:
          "Password must be at least 8 characters long and include both letters and numbers.",
      });
  } 
  
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ error: "A valid email is required." });
  }

  next();
};

export default { validateUser, validate_newUser };
