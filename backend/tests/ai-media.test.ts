import request from 'supertest';
import { app } from '../index';

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
      create: jest.fn().mockResolvedValue({})
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

// Mock OpenAI
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => {
    return {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{ message: { content: JSON.stringify({ variations: ['AI Caption 1', 'AI Caption 2'] }) } }],
            usage: { total_tokens: 100 }
          })
        }
      },
      images: {
        generate: jest.fn().mockResolvedValue({
          data: [{ url: 'https://mock.openai.com/generated_image.png' }]
        })
      }
    };
  });
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

describe('AI Studio API Endpoints', () => {
  it('should generate captions', async () => {
    process.env.OPENAI_API_KEY = 'real-key-for-test-mock';
    const response = await request(app)
      .post('/api/ai/caption')
      .send({ prompt: 'Test prompt', tone: 'funny', platform: 'twitter' });
    
    expect(response.status).toBe(200);
    expect(response.body.variations).toBeDefined();
    expect(response.body.variations.length).toBeGreaterThan(0);
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
