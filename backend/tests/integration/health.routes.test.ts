import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app.js';

describe('Health Routes (Integration)', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/health returns 200 with service status', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/health',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('UP');
    expect(body.data.service).toBe('amra-muhammadpuri-backend');
  });

  it('returns 404 for unknown routes formatted with error response', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/unknown-endpoint',
    });

    expect(response.statusCode).toBe(404);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
  });

  it('PUT /api/v1/org/admin/notices/:id requires authentication', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: '/api/v1/org/admin/notices/test-id',
      payload: { title: 'Test Title' },
    });

    expect(response.statusCode).toBe(401);
  });

  it('DELETE /api/v1/org/admin/notices/:id requires authentication', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: '/api/v1/org/admin/notices/test-id',
    });

    expect(response.statusCode).toBe(401);
  });
});
