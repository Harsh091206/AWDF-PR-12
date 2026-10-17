const request = require('supertest');
const app = require('../server');

describe('Task Manager API - CI/CD Automated Tests', () => {
  // Test 1: Health check / Root endpoint
  test('GET / returns 200 and running message', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('Task Manager API is running');
  });

  // Test 2: 404 handler for undefined route (Post Laboratory Work requirement)
  test('GET /api/nonexistent returns 404 error', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});
