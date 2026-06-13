import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { requireAuth } from '../middlewares/auth';

dotenv.config();

const router = Router();
const prisma = new PrismaClient();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret',
});

// Create an order for a subscription upgrade
router.post('/create-order', requireAuth, async (req: any, res: any) => {
  const { planId } = req.body; // E.g. 'pro', 'enterprise'
  
  const PLAN_PRICES: Record<string, number> = {
    'pro': 4900, // INR 49.00 * 100 (paise)
    'enterprise': 14900,
  };

  const amount = PLAN_PRICES[planId];
  if (!amount) return res.status(400).json({ error: 'Invalid plan selected' });

  try {
    const workspaceId = req.workspaceId;
    if (!workspaceId) return res.status(404).json({ error: 'Workspace not found' });

    const options = {
      amount,
      currency: "INR",
      receipt: `receipt_${workspaceId}_${Date.now()}`,
      notes: {
        workspaceId,
        planId
      }
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
});

// Webhook to handle successful payments
router.post('/webhook', async (req: any, res: any) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'placeholder_webhook_secret';
  const signature = req.headers['x-razorpay-signature'];

  const body = JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  if (expectedSignature !== signature) {
    return res.status(400).send('Invalid signature');
  }

  const event = req.body.event;
  const payload = req.body.payload;

  try {
    switch (event) {
      case 'order.paid': {
        const order = payload.order.entity;
        const workspaceId = order.notes.workspaceId;
        const planId = order.notes.planId;

        if (workspaceId) {
          await prisma.workspace.update({
            where: { id: workspaceId },
            data: { 
              subscriptionId: order.id,
              plan: planId.toUpperCase()
            }
          });
        }
        break;
      }
      // Add other events like subscription.cancelled if using Razorpay Subscriptions
      default:
        console.log(`Unhandled Razorpay event: ${event}`);
    }

    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Razorpay webhook processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
