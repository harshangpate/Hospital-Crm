import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';

// Hash password
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Compare password
export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

// Generate JWT token
export const generateToken = (
  payload: {
    id: string;
    email: string;
    role: string;
  },
  expiresIn?: string
): string => {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: expiresIn || process.env.JWT_EXPIRES_IN || '7d',
  } as jwt.SignOptions);
};

// Verify JWT token
export const verifyToken = (token: string): any => {
  return jwt.verify(token, process.env.JWT_SECRET!);
};
