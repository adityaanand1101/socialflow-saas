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
        events: { has: eventName as any }
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

      const signature = crypto.createHmac('sha256', endpoint.secret).update(bodyString).digest('hex');
      headers['x-socialflow-signature'] = signature;

      // Fire with retry logic (3 attempts, exponential backoff)
      let attempt = 0;
      const maxAttempts = 3;
      while (attempt < maxAttempts) {
        try {
          const response = await fetch(endpoint.url, {
            method: 'POST',
            headers,
            body: bodyString
          });
          
          if (response.ok) {
            await prisma.webhookEndpoint.update({
              where: { id: endpoint.id },
              data: { lastTriggeredAt: new Date() }
            });
            break;
          }
          
          attempt++;
        } catch (e: any) {
          if (attempt === maxAttempts - 1) {
            console.error(`Webhook delivery to ${endpoint.url} failed after ${maxAttempts} attempts:`, e.message);
          }
        }
        
        attempt++;
        if (attempt < maxAttempts) {
          await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
        }
      }
    }
  } catch (error) {
    console.error('Webhook trigger system failed:', error);
  }
};