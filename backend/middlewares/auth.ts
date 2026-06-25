import { Request, Response, NextFunction } from 'express';
import { ClerkExpressRequireAuth, users } from '@clerk/clerk-sdk-node';
import { PrismaClient, User, WorkspaceMember } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthenticatedRequest extends Request {
  auth: any;
  userId: string;
  dbUser: User & { memberships: (WorkspaceMember & { workspace: any })[] };
  workspaceId: string | null;
  workspaceRole: string | null;
}

const syncUser = async (clerkId: string) => {
  try {
    const clerkUser = await users.getUser(clerkId);
    const email = clerkUser.emailAddresses?.[0]?.emailAddress || '';
    const name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User';
    const avatarUrl = clerkUser.imageUrl || null;

    const user = await prisma.user.create({
      data: { clerkId, email, name, avatarUrl },
    });
    const workspace = await prisma.workspace.create({
      data: { name: `${name}'s Workspace`, slug: `workspace-${user.id}`, plan: 'PRO' },
    });
    await prisma.workspaceMember.create({
      data: { userId: user.id, workspaceId: workspace.id, role: 'OWNER' },
    });
    return user;
  } catch (err) {
    console.error('Auto-sync user failed:', err);
    return null;
  }
};

export const requireAuth = [
  ClerkExpressRequireAuth() as any,
  async (req: any, res: Response, next: NextFunction) => {
    const clerkId = req.auth?.userId;
    if (!clerkId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      let dbUser = await prisma.user.findUnique({
        where: { clerkId },
        include: { memberships: { include: { workspace: true } } },
      });

      if (!dbUser) {
        const newUser = await syncUser(clerkId);
        if (!newUser) {
          return res.status(401).json({ error: 'User not synced to database yet' });
        }
        dbUser = await prisma.user.findUnique({
          where: { clerkId },
          include: { memberships: { include: { workspace: true } } },
        })!;
      }

      req.userId = dbUser!.id;
      req.dbUser = dbUser!;
      
      const headerWorkspaceId = req.headers['x-workspace-id'] as string;
      const targetMembership = headerWorkspaceId
        ? dbUser!.memberships.find(m => m.workspaceId === headerWorkspaceId)
        : dbUser!.memberships[0];

      req.workspaceId = targetMembership?.workspaceId || null;
      req.workspaceRole = targetMembership?.role || null;

      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      res.status(500).json({ error: 'Internal server error in auth verification' });
    }
  }
];
