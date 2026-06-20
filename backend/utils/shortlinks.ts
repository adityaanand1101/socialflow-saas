import fetch from 'node-fetch';

export type ShortlinkProvider = 'dub' | 'shortio' | 'kutt' | 'linkdrip';

export interface ShortlinkProviderConfig {
  provider: ShortlinkProvider;
  apiKey: string;
  domain?: string;
}

export interface ShortlinkResult {
  shortUrl: string;
  originalUrl: string;
  provider: ShortlinkProvider;
  id?: string;
}

async function createDubLink(url: string, config: ShortlinkProviderConfig): Promise<ShortlinkResult> {
  const body: any = { url };
  if (config.domain) body.domain = config.domain;
  
  const res = await fetch('https://api.dub.co/links', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Dub.co error: ${err}`);
  }
  
  const data = await res.json() as any;
  return { shortUrl: data.shortLink || data.url, originalUrl: url, provider: 'dub', id: data.id };
}

async function createShortIOLink(url: string, config: ShortlinkProviderConfig): Promise<ShortlinkResult> {
  const body: any = { originalURL: url };
  if (config.domain) body.domain = config.domain;
  
  const res = await fetch('https://api.short.io/links', {
    method: 'POST',
    headers: {
      'Authorization': config.apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Short.io error: ${err}`);
  }
  
  const data = await res.json() as any;
  return { shortUrl: data.shortURL, originalUrl: url, provider: 'shortio', id: data.idString };
}

async function createKuttLink(url: string, config: ShortlinkProviderConfig): Promise<ShortlinkResult> {
  const body: any = { target: url };
  if (config.domain) body.domain = config.domain;
  
  const res = await fetch('https://kutt.it/api/v2/links', {
    method: 'POST',
    headers: {
      'X-API-Key': config.apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Kutt error: ${err}`);
  }
  
  const data = await res.json() as any;
  return { shortUrl: data.shortUrl, originalUrl: url, provider: 'kutt', id: data.id };
}

async function createLinkDripLink(url: string, config: ShortlinkProviderConfig): Promise<ShortlinkResult> {
  const body: any = { destination: url };
  if (config.domain) body.domain = config.domain;
  
  const res = await fetch('https://api.linkdrip.co/v1/links', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LinkDrip error: ${err}`);
  }
  
  const data = await res.json() as any;
  return { shortUrl: data.short_url, originalUrl: url, provider: 'linkdrip', id: data.id };
}

export async function createShortLink(
  url: string, 
  provider: ShortlinkProvider, 
  config: ShortlinkProviderConfig
): Promise<ShortlinkResult> {
  switch (provider) {
    case 'dub':
      return createDubLink(url, config);
    case 'shortio':
      return createShortIOLink(url, config);
    case 'kutt':
      return createKuttLink(url, config);
    case 'linkdrip':
      return createLinkDripLink(url, config);
    default:
      throw new Error(`Unknown shortlink provider: ${provider}`);
  }
}

export async function createShortLinksForUrls(
  urls: string[],
  provider: ShortlinkProvider,
  config: ShortlinkProviderConfig
): Promise<Map<string, string>> {
  const results = new Map<string, string>();
  
  for (const url of urls) {
    try {
      const result = await createShortLink(url, provider, config);
      results.set(url, result.shortUrl);
    } catch (err) {
      console.error(`Failed to shorten ${url}:`, err);
      results.set(url, url); // fallback to original
    }
  }
  
  return results;
}

export function extractUrls(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s]+/g;
  const matches = text.match(urlRegex);
  return matches || [];
}