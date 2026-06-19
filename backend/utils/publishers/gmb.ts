import fetch from 'node-fetch';
import type { PublishResult } from './common';

const GMB_BASE = 'https://mybusiness.googleapis.com/v4';

export async function publishToGMB(
  token: string,
  content: string,
  mediaUrls: string[],
  platformAccountId: string,
  structuredContent?: Record<string, Record<string, string>>,
  postTypes?: Record<string, string>,
): Promise<PublishResult> {
  const pid = platformAccountId.toLowerCase();
  const sc = structuredContent?.[pid] || {};
  const ct = postTypes?.[pid] || 'standard';

  // platformAccountId should be formatted as: accounts/{accountId}/locations/{locationId}
  const parent = platformAccountId.startsWith('accounts/')
    ? platformAccountId
    : `accounts/${platformAccountId}/locations/${platformAccountId}`;

  const summary = sc.summary || content || '';
  const callToAction = sc.call_to_action || '';
  const actionUrl = sc.url || '';

  const body: Record<string, any> = {
    summary: summary.slice(0, 1500),
    languageCode: 'en',
    topicType: ct.toUpperCase(),
  };

  // Add call-to-action
  if (callToAction && actionUrl) {
    body.callToAction = {
      actionType: callToAction,
      url: actionUrl,
    };
  }

  // Media
  if (mediaUrls.length > 0) {
    body.media = mediaUrls.slice(0, 10).map((url, i) => ({
      mediaFormat: url.match(/\.(mp4|webm|mov|avi)(\?|$)/i) ? 'VIDEO' : 'PHOTO',
      sourceUrl: url,
      googleUrl: url,
    }));
  }

  switch (ct) {
    case 'event': {
      body.event = {
        title: sc.event_title || summary.slice(0, 100),
        startDate: sc.event_start_date || '',
        startTime: sc.event_start_time || '',
        endDate: sc.event_end_date || '',
        endTime: sc.event_end_time || '',
      };
      break;
    }
    case 'offer': {
      body.offer = {
        couponCode: sc.coupon_code || '',
        redeemUrl: sc.redeem_url || '',
        termsConditions: sc.terms_conditions || '',
      };
      break;
    }
    case 'alert': {
      body.alertType = sc.alert_type || 'COVID_19';
      break;
    }
  }

  const res = await fetch(`${GMB_BASE}/${parent}/localPosts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GMB post failed: ${err.slice(0, 400)}`);
  }
  const result = await res.json() as any;
  return {
    id: result.name,
    url: result.searchUrl,
  };
}
