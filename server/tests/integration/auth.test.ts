import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/index';

/**
 * Auth API 集成测试
 * 验证认证功能是否正常工作
 */
describe('Authentication API', () => {
  describe('POST /api/auth/register', () => {
    it('should create new user with valid email and password (TDD-001)', async () => {
      const body = {
        email: 'test@example.com',
        password: 'Secure123!',
        displayName: 'Test User'
      };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(body);
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user.email).toBe(body.email);
      expect(response.body.data.user.password).toBeUndefined();
      expect(response.body.data.accessToken).toBeDefined();
    });

    it('should return 400 for invalid email format (TDD-002)', async () => {
      const body = {
        email: 'invalid-email',
        password: 'Secure123!',
        displayName: 'Test'
      };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(body);
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for weak password (TDD-003)', async () => {
      const body = {
        email: 'test@example.com',
        password: '123',
        displayName: 'Test'
      };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(body);
      
      expect(response.status).toBe(400);
    });

    it('should return 409 for duplicate email (TDD-004)', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'Secure123!',
          displayName: 'First'
        });
      
      // Second registration with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'Secure123!',
          displayName: 'Second'
        });
      
      expect(response.status).toBe(409);
    });

    it('should return 400 for missing required fields (TDD-005)', async () => {
      const body = { email: 'test@example.com' };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(body);
      
      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeAll(async () => {
      // Pre-create user for login tests
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'login-test@example.com',
          password: 'Secure123!',
          displayName: 'Login Test'
        });
    });

    it('should return token for valid credentials (TDD-006)', async () => {
      const body = {
        email: 'login-test@example.com',
        password: 'Secure123!'
      };
      
      const response = await request(app)
        .post('/api/auth/login')
        .send(body);
      
      expect(response.status).toBe(200);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.user.email).toBe(body.email);
    });

    it('should return 401 for wrong password (TDD-007)', async () => {
      const body = {
        email: 'login-test@example.com',
        password: 'wrongpassword'
      };
      
      const response = await request(app)
        .post('/api/auth/login')
        .send(body);
      
      expect(response.status).toBe(401);
    });

    it('should return 401 for non-existent user (TDD-008)', async () => {
      const body = {
        email: 'notexist@example.com',
        password: 'Secure123!'
      };
      
      const response = await request(app)
        .post('/api/auth/login')
        .send(body);
      
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    let authToken: string;

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'me-test@example.com',
          password: 'Secure123!',
          displayName: 'Me Test'
        });
      authToken = response.body.data.accessToken;
    });

    it('should return current user with valid token (TDD-009)', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.data.email).toBe('me-test@example.com');
    });

    it('should return 401 without token (TDD-010)', async () => {
      const response = await request(app)
        .get('/api/auth/me');
      
      expect(response.status).toBe(401);
    });

    it('should return 401 with invalid token (TDD-011)', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_token');
      
      expect(response.status).toBe(401);
    });
  });
});
