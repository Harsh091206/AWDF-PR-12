const request = require('supertest');
const app = require('../server');

describe('Task Manager API - CI/CD Automated Tests', () => {
  // Test 1: Health check / Root endpoint
  test('GET / returns 200 and running message', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Task Manager API is running');
  });

  // Test 2: 404 handler for undefined route (Post Laboratory Work requirement)
  test('GET /api/nonexistent returns 404 error', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  // Test 3: AI generate-description graceful degradation / response
  test('POST /api/ai/generate-description returns description with fallback support', async () => {
    const res = await request(app)
      .post('/api/ai/generate-description')
      .send({ title: 'Deploy application with Docker' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('description');
  });
});
