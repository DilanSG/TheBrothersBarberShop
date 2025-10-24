/**
 * Tests Unitarios para AuthUseCases
 * Valida autenticación, registro, tokens y permisos
 */

import AuthUseCases from '../../src/core/application/usecases/AuthUseCases.js';
import User from '../../src/core/domain/entities/User.js';
import Barber from '../../src/core/domain/entities/Barber.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Mocks
jest.mock('../../src/core/domain/entities/User.js');
jest.mock('../../src/core/domain/entities/Barber.js');
jest.mock('jsonwebtoken');
jest.mock('bcryptjs');

describe('AuthUseCases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('debería registrar un nuevo usuario correctamente', async () => {
      const userData = {
        name: 'Juan Pérez',
        email: 'juan@example.com',
        password: 'Password123!',
        role: 'client'
      };

      const mockUser = {
        _id: 'user123',
        ...userData,
        password: 'hashedPassword',
        save: jest.fn().mockResolvedValue(true)
      };

      User.findOne = jest.fn().mockResolvedValue(null);
      User.mockImplementation(() => mockUser);

      const result = await AuthUseCases.register(userData);

      expect(User.findOne).toHaveBeenCalledWith({ email: userData.email });
      expect(mockUser.save).toHaveBeenCalled();
      expect(result).toHaveProperty('_id', 'user123');
      expect(result).toHaveProperty('email', userData.email);
    });

    it('debería rechazar email duplicado', async () => {
      const userData = {
        name: 'Juan Pérez',
        email: 'existing@example.com',
        password: 'Password123!',
        role: 'client'
      };

      User.findOne = jest.fn().mockResolvedValue({ email: userData.email });

      await expect(AuthUseCases.register(userData)).rejects.toThrow('El email ya está registrado');
    });

    it('debería validar formato de email', async () => {
      const userData = {
        name: 'Juan Pérez',
        email: 'invalid-email',
        password: 'Password123!',
        role: 'client'
      };

      await expect(AuthUseCases.register(userData)).rejects.toThrow();
    });

    it('debería validar contraseña fuerte', async () => {
      const userData = {
        name: 'Juan Pérez',
        email: 'juan@example.com',
        password: '123', // Contraseña débil
        role: 'client'
      };

      await expect(AuthUseCases.register(userData)).rejects.toThrow();
    });
  });

  describe('login', () => {
    it('debería hacer login con credenciales correctas', async () => {
      const credentials = {
        email: 'juan@example.com',
        password: 'Password123!'
      };

      const mockUser = {
        _id: 'user123',
        email: credentials.email,
        password: 'hashedPassword',
        role: 'client',
        isActive: true,
        comparePassword: jest.fn().mockResolvedValue(true)
      };

      const mockToken = 'jwt.token.here';
      const mockRefreshToken = 'refresh.token.here';

      User.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });
      jwt.sign = jest.fn()
        .mockReturnValueOnce(mockToken)
        .mockReturnValueOnce(mockRefreshToken);

      const result = await AuthUseCases.login(credentials);

      expect(result).toHaveProperty('token', mockToken);
      expect(result).toHaveProperty('refreshToken', mockRefreshToken);
      expect(result).toHaveProperty('user');
      expect(result.user).toHaveProperty('email', credentials.email);
    });

    it('debería rechazar credenciales incorrectas', async () => {
      const credentials = {
        email: 'juan@example.com',
        password: 'WrongPassword'
      };

      const mockUser = {
        _id: 'user123',
        email: credentials.email,
        password: 'hashedPassword',
        comparePassword: jest.fn().mockResolvedValue(false)
      };

      User.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await expect(AuthUseCases.login(credentials)).rejects.toThrow('Credenciales inválidas');
    });

    it('debería rechazar usuario inactivo', async () => {
      const credentials = {
        email: 'inactive@example.com',
        password: 'Password123!'
      };

      const mockUser = {
        _id: 'user123',
        email: credentials.email,
        password: 'hashedPassword',
        isActive: false,
        comparePassword: jest.fn().mockResolvedValue(true)
      };

      User.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await expect(AuthUseCases.login(credentials)).rejects.toThrow('Usuario inactivo');
    });

    it('debería rechazar usuario no encontrado', async () => {
      const credentials = {
        email: 'notfound@example.com',
        password: 'Password123!'
      };

      User.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      await expect(AuthUseCases.login(credentials)).rejects.toThrow('Credenciales inválidas');
    });
  });

  describe('refreshToken', () => {
    it('debería generar nuevo token con refresh token válido', async () => {
      const oldRefreshToken = 'valid.refresh.token';
      const decodedToken = {
        id: 'user123',
        role: 'client'
      };

      const mockUser = {
        _id: 'user123',
        email: 'juan@example.com',
        role: 'client',
        isActive: true
      };

      const newToken = 'new.jwt.token';
      const newRefreshToken = 'new.refresh.token';

      jwt.verify = jest.fn().mockReturnValue(decodedToken);
      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });
      jwt.sign = jest.fn()
        .mockReturnValueOnce(newToken)
        .mockReturnValueOnce(newRefreshToken);

      const result = await AuthUseCases.refreshToken(oldRefreshToken);

      expect(result).toHaveProperty('token', newToken);
      expect(result).toHaveProperty('refreshToken', newRefreshToken);
    });

    it('debería rechazar refresh token inválido', async () => {
      const invalidToken = 'invalid.token';

      jwt.verify = jest.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(AuthUseCases.refreshToken(invalidToken)).rejects.toThrow();
    });

    it('debería rechazar refresh token expirado', async () => {
      const expiredToken = 'expired.token';

      jwt.verify = jest.fn().mockImplementation(() => {
        const error = new Error('Token expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      await expect(AuthUseCases.refreshToken(expiredToken)).rejects.toThrow('Token expirado');
    });
  });

  describe('verifyPermissions', () => {
    it('debería permitir acceso a admin para cualquier recurso', () => {
      const user = { role: 'admin', id: 'admin123' };
      const resource = 'sales';
      const action = 'delete';

      const result = AuthUseCases.verifyPermissions(user, resource, action);

      expect(result).toBe(true);
    });

    it('debería permitir a barbero acceder a sus propios recursos', () => {
      const user = { role: 'barber', id: 'barber123' };
      const resource = 'sales';
      const action = 'read';
      const resourceOwnerId = 'barber123';

      const result = AuthUseCases.verifyPermissions(user, resource, action, resourceOwnerId);

      expect(result).toBe(true);
    });

    it('debería rechazar a barbero acceder a recursos de otro', () => {
      const user = { role: 'barber', id: 'barber123' };
      const resource = 'sales';
      const action = 'read';
      const resourceOwnerId = 'otherBarber456';

      const result = AuthUseCases.verifyPermissions(user, resource, action, resourceOwnerId);

      expect(result).toBe(false);
    });

    it('debería rechazar a cliente acceder a recursos administrativos', () => {
      const user = { role: 'client', id: 'client123' };
      const resource = 'users';
      const action = 'delete';

      const result = AuthUseCases.verifyPermissions(user, resource, action);

      expect(result).toBe(false);
    });
  });

  describe('changePassword', () => {
    it('debería cambiar contraseña con contraseña actual correcta', async () => {
      const userId = 'user123';
      const passwords = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword456!'
      };

      const mockUser = {
        _id: userId,
        password: 'hashedOldPassword',
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true)
      };

      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });
      bcrypt.hash = jest.fn().mockResolvedValue('hashedNewPassword');

      const result = await AuthUseCases.changePassword(userId, passwords);

      expect(mockUser.comparePassword).toHaveBeenCalledWith(passwords.currentPassword);
      expect(mockUser.save).toHaveBeenCalled();
      expect(result).toHaveProperty('message', 'Contraseña actualizada correctamente');
    });

    it('debería rechazar cambio con contraseña actual incorrecta', async () => {
      const userId = 'user123';
      const passwords = {
        currentPassword: 'WrongPassword',
        newPassword: 'NewPassword456!'
      };

      const mockUser = {
        _id: userId,
        password: 'hashedOldPassword',
        comparePassword: jest.fn().mockResolvedValue(false)
      };

      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await expect(AuthUseCases.changePassword(userId, passwords)).rejects.toThrow('Contraseña actual incorrecta');
    });

    it('debería validar que nueva contraseña sea diferente', async () => {
      const userId = 'user123';
      const passwords = {
        currentPassword: 'Password123!',
        newPassword: 'Password123!' // Misma contraseña
      };

      const mockUser = {
        _id: userId,
        password: 'hashedPassword',
        comparePassword: jest.fn().mockResolvedValue(true)
      };

      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await expect(AuthUseCases.changePassword(userId, passwords)).rejects.toThrow('La nueva contraseña debe ser diferente');
    });
  });
});
