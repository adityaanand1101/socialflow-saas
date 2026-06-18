import request from 'supertest';
import app from '../index';

// We mock the Clerk authentication to bypass the requirement during tests
jest.mock('@clerk/clerk-sdk-node', () => {
  return {
    ClerkExpressRequireAuth: jest.fn().mockImplementation(() => {
      return (req: any, res: any, next: any) => {
        req.auth = { userId: 'mocked_clerk_id' };
        next();
      };
    })
  };
});

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    user: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'mocked_user_id',
        memberships: [{ workspaceId: 'mocked_workspace_id' }]
      })
    },
    aiGenerationLog: {
      create: jest.fn().mockResolvedValue({}),
      count: jest.fn().mockResolvedValue(0)
    },
    mediaAsset: {
      create: jest.fn().mockResolvedValue({ id: 'mocked_asset_id', fileUrl: 'https://mock.com/img.png' }),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue({ id: 'mocked_asset_id', workspaceId: 'mocked_workspace_id', fileUrl: 'https://mock.com/img.png' }),
      delete: jest.fn().mockResolvedValue({})
    }
  };
  return { PrismaClient: jest.fn(() => mockPrisma) };
});

// Mock Google GenAI
jest.mock('@google/genai', () => {
  const mockGenerateContent = jest.fn().mockResolvedValue({
    candidates: [{
      content: {
        parts: [{ text: JSON.stringify({ variations: ['AI Caption 1', 'AI Caption 2'], hashtags: ['#test1', '#test2'], ideas: [{ day: 1, topic: 'Test', description: 'A test idea' }] }) }]
      }
    }]
  });
  return {
    GoogleGenAI: jest.fn().mockImplementation(() => ({
      models: {
        generateContent: mockGenerateContent
      }
    }))
  };
});

// Mock AWS S3
jest.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: jest.fn().mockImplementation(() => ({
      send: jest.fn().mockResolvedValue({})
    })),
    PutObjectCommand: jest.fn(),
    DeleteObjectCommand: jest.fn()
  };
});

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://mock.s3.com/presigned-url')
}));

beforeAll(() => {
  process.env.GOOGLE_AI_API_KEY = 'mock-key-for-tests';
});

describe('AI Studio API Endpoints', () => {
  it('should generate captions', async () => {
    const response = await request(app)
      .post('/api/ai/caption')
      .send({ prompt: 'Test prompt', tone: 'funny', platform: 'Instagram' });
    
    expect(response.status).toBe(200);
    expect(response.body.variations).toBeDefined();
    expect(response.body.variations.length).toBeGreaterThan(0);
  });

  it('should reject empty prompt for captions', async () => {
    const response = await request(app)
      .post('/api/ai/caption')
      .send({ prompt: '' });
    expect(response.status).toBe(400);
  });

  it('should reject invalid tone', async () => {
    const response = await request(app)
      .post('/api/ai/caption')
      .send({ prompt: 'Test', tone: 'InvalidTone' });
    expect(response.status).toBe(400);
  });

  it('should generate hashtags', async () => {
    const response = await request(app)
      .post('/api/ai/hashtags')
      .send({ niche: 'fashion', keywords: 'sustainable' });
    expect(response.status).toBe(200);
    expect(response.body.hashtags).toBeDefined();
  });

  it('should generate ideas', async () => {
    const response = await request(app)
      .post('/api/ai/ideas')
      .send({ topic: 'fitness coaching', industry: 'health' });
    expect(response.status).toBe(200);
    expect(response.body.ideas).toBeDefined();
  });
});

describe('Media Library API Endpoints', () => {
  it('should generate presigned URL', async () => {
    const response = await request(app)
      .post('/api/media/presigned-url')
      .send({ fileName: 'test.png', fileType: 'image/png', fileSize: 1024 });

    expect(response.status).toBe(200);
    expect(response.body.uploadUrl).toBe('https://mock.s3.com/presigned-url');
    expect(response.body.key).toBeDefined();
  });

  it('should register media asset', async () => {
    const response = await request(app)
      .post('/api/media/register')
      .send({ fileName: 'test.png', fileUrl: 'https://mock.s3.com/test.png', fileType: 'image/png', fileSize: 1024, tags: [] });

    expect(response.status).toBe(200);
    expect(response.body.id).toBe('mocked_asset_id');
  });
});
