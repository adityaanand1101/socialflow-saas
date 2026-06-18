import request from 'supertest';
import app from '../index';
import { PrismaClient } from '@prisma/client';
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';

jest.mock('@clerk/clerk-sdk-node', () => ({
  ClerkExpressRequireAuth: jest.fn().mockImplementation(() => {
    return (req: any, res: any, next: any) => {
      req.auth = { userId: 'clerk_viewer_test' };
      next();
    };
  })
}));

const prisma = new PrismaClient();

describe('Role-Based Access Control (RBAC)', () => {
  let viewerUserId: string;
  let workspaceId: string;
  let mockClerkId = 'clerk_viewer_test';

  beforeAll(async () => {
    // Create a mock user
    const user = await prisma.user.create({
      data: {
        clerkId: mockClerkId,
        email: 'viewer@example.com',
        name: 'Viewer User',
      }
    });
    viewerUserId = user.id;

    // Create a workspace
    const workspace = await prisma.workspace.create({
      data: { name: 'Test Workspace', slug: 'test-workspace-rbac' }
    });
    workspaceId = workspace.id;

    // Add user as VIEWER
    await prisma.workspaceMember.create({
      data: {
        userId: viewerUserId,
        workspaceId,
        role: 'VIEWER' // Role is VIEWER
      }
    });

    // Mock Clerk auth
    (ClerkExpressRequireAuth as jest.Mock).mockImplementation(() => {
      return (req: any, res: any, next: any) => {
        req.auth = { userId: mockClerkId };
        next();
      };
    });
  });

  afterAll(async () => {
    await prisma.workspaceMember.deleteMany({ where: { userId: viewerUserId } });
    await prisma.workspace.delete({ where: { id: workspaceId } });
    await prisma.user.delete({ where: { id: viewerUserId } });
    await prisma.$disconnect();
  });

  it('should return 403 Forbidden when a VIEWER tries to update a workspace', async () => {
    const res = await request(app)
      .patch(`/api/workspaces/${workspaceId}`)
      .send({ name: 'Hacked Workspace' })
      .set('x-workspace-id', workspaceId);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Insufficient permissions');
  });

  it('should return 403 Forbidden when a VIEWER tries to invite a member', async () => {
    const res = await request(app)
      .post(`/api/workspaces/${workspaceId}/invites`)
      .send({ email: 'new@example.com', role: 'ADMIN' })
      .set('x-workspace-id', workspaceId);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Insufficient permissions');
  });

  it('should allow GET requests to /api/user/me for the viewer', async () => {
    const res = await request(app)
      .get('/api/user/me');

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('viewer@example.com');
  });
});
