import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config/env';

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
  fullName: string;
}

export const generateToken = (payload: TokenPayload): string => {
  const secret = config.jwt.secret || 'default-secret';
  return jwt.sign(payload, secret, {
    expiresIn: config.jwt.expiresIn || '7d',
  } as SignOptions);
};

export const verifyToken = (token: string): TokenPayload => {
  const secret = config.jwt.secret || 'default-secret';
  return jwt.verify(token, secret) as TokenPayload;
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  const secret = config.jwt.refreshSecret || 'default-refresh-secret';
  const options: SignOptions = {
    expiresIn: '30d',
  };
  return jwt.sign(payload, secret, options);
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  const secret = config.jwt.refreshSecret || 'default-refresh-secret';
  return jwt.verify(token, secret) as TokenPayload;
};


