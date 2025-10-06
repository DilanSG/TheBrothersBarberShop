import jwt from 'jsonwebtoken';

// Generar token JWT
export const generateToken = (payload, expiresIn = '7d') => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: expiresIn,
    issuer: 'the-brothers-barbershop-api',
    audience: 'the-brothers-barbershop-users',
  });
};

// Verificar token JWT
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'the-brothers-barbershop-api',
      audience: 'the-brothers-barbershop-users',
    });
  } catch (error) {
    throw new Error('Token inválido o expirado');
  }
};

// Decodificar token sin verificar (útil para obtener info)
export const decodeToken = (token) => {
  return jwt.decode(token);
};

// Generar token de refresco
export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '30d',
    issuer: 'the-brothers-barbershop-api',
    audience: 'the-brothers-barbershop-users',
  });
};

// Verificar token de refresco
export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
      issuer: 'the-brothers-barbershop-api',
      audience: 'the-brothers-barbershop-users',
    });
  } catch (error) {
    throw new Error('Token de refresco inválido o expirado');
  }
};