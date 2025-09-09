import UserService from '../../src/services/userService.js';
import User from '../../src/models/User.js';
import { createTestUser } from '../utils/testHelpers.js';
import mongoose from 'mongoose';

describe('User Service', () => {
  let userService;

  beforeEach(() => {
    userService = new UserService();
  });

  describe('createUser', () => {
    const userData = {
      email: 'test@test.com',
      password: 'Test123!',
      name: 'Test User'
    };

    it('should create a new user', async () => {
      const user = await userService.createUser(userData);
      
      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.name).toBe(userData.name);
      expect(user.password).not.toBe(userData.password); // Password debe estar hasheado
    });

    it('should not create a user with existing email', async () => {
      await userService.createUser(userData);
      
      await expect(userService.createUser(userData))
        .rejects
        .toThrow('Email already exists');
    });
  });

  describe('getUserById', () => {
    it('should get user by id', async () => {
      const { user: createdUser } = await createTestUser();
      const user = await userService.getUserById(createdUser._id);
      
      expect(user).toBeDefined();
      expect(user._id.toString()).toBe(createdUser._id.toString());
    });

    it('should return null for non-existent user', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const user = await userService.getUserById(nonExistentId);
      
      expect(user).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('should update user data', async () => {
      const { user: createdUser } = await createTestUser();
      const updates = { name: 'Updated Name' };
      
      const updatedUser = await userService.updateUser(createdUser._id, updates);
      
      expect(updatedUser.name).toBe(updates.name);
    });

    it('should not update with invalid data', async () => {
      const { user: createdUser } = await createTestUser();
      const updates = { email: 'invalid-email' };
      
      await expect(userService.updateUser(createdUser._id, updates))
        .rejects
        .toThrow();
    });
  });

  describe('deleteUser', () => {
    it('should delete user', async () => {
      const { user: createdUser } = await createTestUser();
      
      await userService.deleteUser(createdUser._id);
      
      const deletedUser = await User.findById(createdUser._id);
      expect(deletedUser).toBeNull();
    });
  });

  describe('validatePassword', () => {
    it('should validate correct password', async () => {
      const password = 'Test123!';
      const { user } = await createTestUser();
      
      const isValid = await userService.validatePassword(user._id, password);
      expect(isValid).toBe(true);
    });

    it('should not validate incorrect password', async () => {
      const { user } = await createTestUser();
      
      const isValid = await userService.validatePassword(user._id, 'WrongPass123!');
      expect(isValid).toBe(false);
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const { user } = await createTestUser();
      const newPassword = 'NewTest123!';
      
      await userService.changePassword(user._id, 'Test123!', newPassword);
      
      const isValid = await userService.validatePassword(user._id, newPassword);
      expect(isValid).toBe(true);
    });

    it('should not change password with incorrect current password', async () => {
      const { user } = await createTestUser();
      
      await expect(userService.changePassword(user._id, 'WrongPass123!', 'NewTest123!'))
        .rejects
        .toThrow('Current password is incorrect');
    });
  });
});
