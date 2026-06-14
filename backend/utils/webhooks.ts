import fetch from 'node-fetch';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const triggerWebhooks = async (workspaceId: string, eventName: string, payload: any) => {
  try {
    const endpoints = await prisma.webhookEndpoint.findMany({
      where: {
        workspaceId,
        isActive: true,
        events: { has: eventName }
      }
    });

    if (endpoints.length === 0) return;

    const bodyString = JSON.stringify({
      event: eventName,
      timestamp: new Date().toISOString(),
      data: payload
    });

    for (const endpoint of endpoints) {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'SocialFlow-Webhook-System'
      };

      if (endpoint.secret) {
        const signature = crypto.createHmac('sha256', endpoint.secret).update(bodyString).digest('hex');
        headers['x-socialflow-signature'] = signature;
      }

      // Fire and forget, or handle retries in a real queue
      fetch(endpoint.url, {
        method: 'POST',
        headers,
        body: bodyString
      }).catch(e => console.error(`Webhook delivery to ${endpoint.url} failed:`, e.message));
    }
  } catch (error) {
    console.error('Webhook trigger system failed:', error);
  }
};