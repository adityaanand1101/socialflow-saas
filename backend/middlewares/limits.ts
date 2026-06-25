import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from './auth';

const prisma = new PrismaClient();

// Hardcoded tier limits — in production this would query a Stripe or pricing config table.
const PLAN_LIMITS = {
  STARTER: { workspaces: 1, channels: 3, members: 1 },
  PRO: { workspaces: 3, channels: 10, members: 5 },
  ENTERPRISE: { workspaces: -1, channels: -1, members: -1 }, // -1 means unlimited
};

export const checkSaaSLimits = (limitType: 'workspaces' | 'channels' | 'seats') => {
  return async (req: any, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const dbUser = authReq.dbUser;
      
      // Determine the user's plan.
      // E.g. we might check the active workspace's subscription if the limit is per-workspace
      // or the user's subscription if the limit is per-user (workspaces count).
      
      // For simplicity, we'll check the current workspace if it's 'channels' or 'seats',
      // or check the user's global state if it's 'workspaces'.
      
      let planName: keyof typeof PLAN_LIMITS = 'PRO';
      
      if (limitType === 'workspaces') {
         // Count user's workspaces
         const count = await prisma.workspaceMember.count({ where: { userId: dbUser.id, role: 'OWNER' } });
         if (PLAN_LIMITS[planName].workspaces !== -1 && count >= PLAN_LIMITS[planName].workspaces) {
            return res.status(403).json({ error: 'Workspace limit reached. Upgrade to create more.' });
         }
      } else {
         const workspaceId = authReq.workspaceId;
         if (!workspaceId) return res.status(400).json({ error: 'Workspace required for this limit check' });
         
         const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
         
         if (workspace?.plan) {
            planName = workspace.plan as keyof typeof PLAN_LIMITS;
         }

         if (limitType === 'channels') {
            const count = await prisma.socialAccount.count({ where: { workspaceId } });
            if (PLAN_LIMITS[planName].channels !== -1 && count >= PLAN_LIMITS[planName].channels) {
               return res.status(403).json({ error: 'Channel limit reached. Upgrade your plan.' });
            }
         } else if (limitType === 'seats') {
            const memberCount = await prisma.workspaceMember.count({ where: { workspaceId } });
            const inviteCount = await prisma.workspaceInvite.count({ where: { workspaceId, status: 'PENDING' } });
            const total = memberCount + inviteCount;
            if (PLAN_LIMITS[planName].members !== -1 && total >= PLAN_LIMITS[planName].members) {
               return res.status(403).json({ error: 'Seat limit reached. Upgrade your plan to invite more.' });
            }
         }
      }

      next();
    } catch (error) {
      console.error('Limit check error:', error);
      res.status(500).json({ error: 'Internal server error checking limits' });
    }
  };
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: any, res: Response, next: NextFunction) => {
    const role = (req as AuthenticatedRequest).workspaceRole;
    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};
