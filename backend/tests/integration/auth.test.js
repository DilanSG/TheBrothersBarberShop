/**
 * Tests de Integración - API de Autenticación
 * Valida flujo completo de endpoints auth
 */

import request from 'supertest';
import app from '../../src/app.js';
import User from '../../src/core/domain/entities/User.js';
import mongoose from 'mongoose';

// Mock de la base de datos
jest.mock('../../src/core/domain/entities/User.js');

describe('Auth API Integration Tests', () => {
  beforeAll(async () => {
    // Configurar conexión de prueba si es necesario
  });

  afterAll(async () => {
    // Cerrar conexiones si es necesario
  });

  describe('POST /api/auth/register', () => {
    it('debería registrar un nuevo usuario con datos válidos', async () => {
      const newUser = {
        name: 'Juan Pérez',
        email: 'juan.perez@example.com',
        password: 'SecurePass123!',
        role: 'client'
      };

      User.findOne = jest.fn().mockResolvedValue(null);
      User.prototype.save = jest.fn().mockResolvedValue({
        _id: 'newUserId123',
        ...newUser,
        password: 'hashedPassword'
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe(newUser.email);
    });

    it('debería rechazar registro con email duplicado', async () => {
      const existingUser = {
        name: 'Juan Pérez',
        email: 'existing@example.com',
        password: 'SecurePass123!',
        role: 'client'
      };

      User.findOne = jest.fn().mockResolvedValue({ email: existingUser.email });

      const response = await request(app)
        .post('/api/auth/register')
        .send(existingUser)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('email');
    });

    it('debería validar formato de email', async () => {
      const invalidUser = {
        name: 'Test User',
        email: 'invalid-email-format',
        password: 'SecurePass123!',
        role: 'client'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUser)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.errors).toBeDefined();
    });

    it('debería validar contraseña mínima', async () => {
      const weakPasswordUser = {
        name: 'Test User',
        email: 'test@example.com',
        password: '123',
        role: 'client'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(weakPasswordUser)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.errors).toBeDefined();
    });

    it('debería rechazar campos faltantes', async () => {
      const incompleteUser = {
        email: 'test@example.com'
        // Falta name, password, role
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(incompleteUser)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('debería hacer login con credenciales válidas', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'CorrectPassword123!'
      };

      const mockUser = {
        _id: 'userId123',
        email: credentials.email,
        password: 'hashedPassword',
        role: 'client',
        isActive: true,
        comparePassword: jest.fn().mockResolvedValue(true)
      };

      User.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data).toHaveProperty('user');
    });

    it('debería rechazar credenciales incorrectas', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'WrongPassword123!'
      };

      const mockUser = {
        _id: 'userId123',
        email: credentials.email,
        comparePassword: jest.fn().mockResolvedValue(false)
      };

      User.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('Credenciales');
    });

    it('debería rechazar usuario inactivo', async () => {
      const credentials = {
        email: 'inactive@example.com',
        password: 'Password123!'
      };

      const mockUser = {
        _id: 'userId123',
        email: credentials.email,
        isActive: false,
        comparePassword: jest.fn().mockResolvedValue(true)
      };

      User.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect('Content-Type', /json/)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('inactivo');
    });

    it('debería rechazar email no registrado', async () => {
      const credentials = {
        email: 'notfound@example.com',
        password: 'Password123!'
      };

      User.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('debería refrescar token con refresh token válido', async () => {
      const refreshToken = 'valid.refresh.token.here';

      const mockUser = {
        _id: 'userId123',
        email: 'test@example.com',
        role: 'client',
        isActive: true
      };

      // Mock JWT verification y user lookup
      jest.spyOn(require('jsonwebtoken'), 'verify').mockReturnValue({
        id: mockUser._id,
        role: mockUser.role
      });

      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('refreshToken');
    });

    it('debería rechazar refresh token inválido', async () => {
      const invalidToken = 'invalid.token';

      jest.spyOn(require('jsonwebtoken'), 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: invalidToken })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('debería rechazar refresh token expirado', async () => {
      const expiredToken = 'expired.token';

      jest.spyOn(require('jsonwebtoken'), 'verify').mockImplementation(() => {
        const error = new Error('Token expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: expiredToken })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('expirado');
    });
  });

  describe('GET /api/auth/me', () => {
    it('debería retornar datos del usuario autenticado', async () => {
      const mockUser = {
        _id: 'userId123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'client'
      };

      const token = 'valid.jwt.token';

      jest.spyOn(require('jsonwebtoken'), 'verify').mockReturnValue({
        id: mockUser._id
      });

      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('email', mockUser.email);
    });

    it('debería rechazar petición sin token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('token');
    });

    it('debería rechazar token inválido', async () => {
      const invalidToken = 'invalid.token';

      jest.spyOn(require('jsonwebtoken'), 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('Rate Limiting', () => {
    it('debería aplicar rate limiting en endpoints de auth', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'WrongPassword'
      };

      // Mock para simular múltiples intentos fallidos
      User.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      // Hacer múltiples requests
      const requests = Array(6).fill(null).map(() =>
        request(app)
          .post('/api/auth/login')
          .send(credentials)
      );

      const responses = await Promise.all(requests);

      // Después de 5 intentos, debería bloquearse
      const rateLimitedResponse = responses[5];
      expect(rateLimitedResponse.status).toBe(429);
    });
  });
});
