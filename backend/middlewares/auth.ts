import { Request, Response, NextFunction } from 'express';
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import { PrismaClient, User, WorkspaceMember } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthenticatedRequest extends Request {
  auth: any;
  userId: string;
  dbUser: User & { memberships: (WorkspaceMember & { workspace: any })[] };
  workspaceId: string | null;
  workspaceRole: string | null;
}

export const requireAuth = [
  ClerkExpressRequireAuth() as any,
  async (req: any, res: Response, next: NextFunction) => {
    const clerkId = req.auth?.userId;
    if (!clerkId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const dbUser = await prisma.user.findUnique({
        where: { clerkId },
        include: { memberships: { include: { workspace: true } } },
      });

      if (!dbUser) {
        return res.status(401).json({ error: 'User not synced to database yet' });
      }

      // Attach database IDs
      req.userId = dbUser.id;
      req.dbUser = dbUser;
      
      // Multi-tenant check: use header if supplied, otherwise fallback to first membership
      const headerWorkspaceId = req.headers['x-workspace-id'] as string;
      const targetMembership = headerWorkspaceId
        ? dbUser.memberships.find(m => m.workspaceId === headerWorkspaceId)
        : dbUser.memberships[0];

      req.workspaceId = targetMembership?.workspaceId || null;
      req.workspaceRole = targetMembership?.role || null;

      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      res.status(500).json({ error: 'Internal server error in auth verification' });
    }
  }
];
