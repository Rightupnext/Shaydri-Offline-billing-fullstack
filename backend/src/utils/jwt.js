const jwt = require("jsonwebtoken");
const secret = process.env.JWT_SECRET;

exports.generateToken = (user) => {
  return jwt.sign({
    id: user.id,
    name: user.name,
    email: user.email,
    db_name: user.db_name,
    role: user.role,
    subscription_start: user.subscription_start,
    subscription_end: user.subscription_end,
  }, secret, { expiresIn: "1d" });
};


exports.verifyToken = (token) => {
  return jwt.verify(token, secret);
};
