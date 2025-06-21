import jwt from 'jsonwebtoken';

export const signToken = (payload, expiresIn = '7d') => {
  return jwt.sign(payload, process.env.ACCESS_TOKEN, { expiresIn:process.env.ACCESS_TOKEN_EXPIRY });
};

export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
}; 