import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middlewares/auth';
import { createShortLink, createShortLinksForUrls, extractUrls, ShortlinkProvider } from '../utils/shortlinks';

const prisma = new PrismaClient();
const router = Router();

router.use(requireAuth);

// POST /api/shortlinks/create - Create short link(s)
router.post('/create', async (req: any, res) => {
  try {
    const userId = req.userId;
    const { urls, provider, apiKey, domain } = req.body as {
      urls: string[];
      provider: ShortlinkProvider;
      apiKey: string;
      domain?: string;
    };

    if (!urls || !urls.length || !provider || !apiKey) {
      return res.status(400).json({ error: 'urls, provider, and apiKey are required' });
    }

    const config = { provider, apiKey, domain };
    const results = new Map<string, string>();

    for (const url of urls) {
      try {
        const result = await createShortLink(url, provider, config);
        results.set(url, result.shortUrl);
      } catch (err: any) {
        console.error(`Failed to shorten ${url}:`, err);
        results.set(url, url);
      }
    }

    res.json(Object.fromEntries(results));
  } catch (err: any) {
    console.error('Shortlink creation error:', err);
    res.status(500).json({ error: 'Failed to create short links' });
  }
});

// POST /api/shortlinks/auto - Auto-shorten URLs in content
router.post('/auto', async (req: any, res) => {
  try {
    const userId = req.userId;
    const { content, provider, apiKey, domain } = req.body as {
      content: string;
      provider: ShortlinkProvider;
      apiKey: string;
      domain?: string;
    };

    if (!content || !provider || !apiKey) {
      return res.status(400).json({ error: 'content, provider, and apiKey are required' });
    }

    const urls = extractUrls(content);
    if (!urls.length) {
      return res.json({ shortenedContent: content, links: {} });
    }

    const config = { provider, apiKey, domain };
    const linkMap = await createShortLinksForUrls(urls, provider, config);

    let shortenedContent = content;
    for (const [original, shortened] of linkMap) {
      shortenedContent = shortenedContent.replace(new RegExp(original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), shortened);
    }

    res.json({ shortenedContent, links: Object.fromEntries(linkMap) });
  } catch (err: any) {
    console.error('Auto-shorten error:', err);
    res.status(500).json({ error: 'Failed to auto-shorten links' });
  }
});

export default router;