import request from 'supertest';
import app from '../app.js';

describe('GET /api/users', () => {
  it('debe requerir autenticación', async () => {
    const res = await request(app).get('/api/users');
    expect(res.statusCode).toBe(401);
  });
});