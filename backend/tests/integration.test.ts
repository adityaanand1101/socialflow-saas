import request from 'supertest';
import { app } from '../index';
import { Webhook } from 'svix';

describe('Integration Tests: JWT & Webhook Verification', () => {
  describe('JWT Verification Middleware', () => {
    it('should return 401 Unauthorized when no token is provided', async () => {
      const response = await request(app).get('/api/user/me');
      // Clerk SDK typically returns 401 for unauthenticated requests via requireAuth middleware
      expect(response.status).toBe(401);
    });

    it('should return 401 Unauthorized when an invalid token is provided', async () => {
      const response = await request(app)
        .get('/api/user/me')
        .set('Authorization', 'Bearer invalid_token');
      expect(response.status).toBe(401);
    });
  });

  describe('Webhook Payload Verification', () => {
    const WEBHOOK_SECRET = 'whsec_MjU2Ynl0ZXNlY3JldGtleXRoYXRpc2Jhc2U2NGVuYw==';
    
    beforeAll(() => {
      process.env.CLERK_WEBHOOK_SECRET = WEBHOOK_SECRET;
    });

    it('should return 400 Bad Request when svix headers are missing', async () => {
      const response = await request(app)
        .post('/api/webhooks/clerk')
        .send({ type: 'user.created', data: { id: 'user_123' } });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Error occured -- no svix headers');
    });

    it('should return 400 Bad Request when svix signature is invalid', async () => {
      const response = await request(app)
        .post('/api/webhooks/clerk')
        .set('svix-id', 'msg_123')
        .set('svix-timestamp', Date.now().toString())
        .set('svix-signature', 'v1,invalid_signature')
        .send({ type: 'user.created', data: { id: 'user_123' } });

      expect(response.status).toBe(400);
    });

    it('should pass verification with valid svix signature', async () => {
      const payload = { type: 'user.created', data: { id: 'user_123', email_addresses: [{ email_address: 'test@example.com' }] } };
      const payloadString = JSON.stringify(payload);
      
      const wh = new Webhook(WEBHOOK_SECRET);
      
      // Generating a valid signature for our mocked svix header
      const msgId = 'msg_123';
      const timestamp = new Date();
      // Svix Webhook.sign() returns the raw signature string, we need to format it or use the headers directly if svix provides a utility
      // Some versions of svix provide wh.sign() returning just the signature
      const signature = wh.sign(msgId, timestamp, payloadString);

      // We mock the Prisma client here to prevent actual DB inserts if it reaches the handler
      jest.mock('@prisma/client', () => {
        return {
          PrismaClient: jest.fn().mockImplementation(() => {
            return {
              user: { create: jest.fn().mockResolvedValue({ id: 'mocked_uuid' }) },
              workspace: { create: jest.fn().mockResolvedValue({ id: 'mocked_uuid' }) },
              workspaceMember: { create: jest.fn().mockResolvedValue({}) }
            };
          })
        };
      });

      const response = await request(app)
        .post('/api/webhooks/clerk')
        .set('svix-id', msgId)
        .set('svix-timestamp', Math.floor(timestamp.getTime() / 1000).toString())
        .set('svix-signature', signature)
        .send(payloadString); // Send raw string instead of object for raw body parser

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
