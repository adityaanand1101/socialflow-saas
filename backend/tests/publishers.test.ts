import fetch from 'node-fetch'
import { publishToInstagram } from '../utils/publishers/instagram'
import { publishToFacebook } from '../utils/publishers/facebook'
import { publishToTwitter as publishToX } from '../utils/publishers/twitter'
import { publishToLinkedIn } from '../utils/publishers/linkedin'
import { publishToYouTube } from '../utils/publishers/youtube'
import { publishToThreads } from '../utils/publishers/threads'
import { publishToReddit } from '../utils/publishers/reddit'
import { publishToPinterest } from '../utils/publishers/pinterest'
import { publishToWordPress } from '../utils/publishers/wordpress'
import { publishToDiscord } from '../utils/publishers/discord'
import { publishToTelegram } from '../utils/publishers/telegram'
import { publishToSlack } from '../utils/publishers/slack'
import { publishToBluesky } from '../utils/publishers/bluesky'
import { publishToMastodon } from '../utils/publishers/mastodon'
import { publishToTumblr } from '../utils/publishers/tumblr'
import { publishToGMB } from '../utils/publishers/gmb'

jest.mock('node-fetch', () => jest.fn())

const { Response } = jest.requireActual('node-fetch')
const mockFetch = fetch as unknown as jest.Mock

function mockJsonResponse(data: any, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(data), { status }))
}

function mockTextResponse(text: string, status = 200) {
  return Promise.resolve(new Response(text, { status }))
}

function mockBufferResponse(buffer: Buffer, contentType = 'image/jpeg') {
  const r = new Response(buffer, { status: 200 })
  r.headers.set('content-type', contentType)
  return Promise.resolve(r)
}

beforeEach(() => {
  mockFetch.mockReset()
})

const TOKEN = 'test-token'
const CONTENT = 'Hello world'
const PID = 'test-account-123'
const MEDIA_URLS = ['https://example.com/img.jpg']
const SC = { [PID.toLowerCase()]: { caption: 'test caption' } }
const PT = { [PID.toLowerCase()]: 'feed' }

// ───── Instagram ─────
describe('Instagram', () => {
  it('publishes a feed image', async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ id: 'img123' }))
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ id: 'pub123' }))
    const result = await publishToInstagram(TOKEN, CONTENT, MEDIA_URLS, PID, SC, PT)
    expect(result.id).toBe('pub123')
    expect(mockFetch).toHaveBeenCalledTimes(2)
    const firstCall = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(firstCall.image_url).toBe(MEDIA_URLS[0])
  })

  it('publishes a reel with video', async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ id: 'reel123' }))
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ status_code: 'FINISHED' }))
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ id: 'pub456' }))
    const result = await publishToInstagram(TOKEN, CONTENT, ['https://example.com/vid.mp4'], PID, SC, { [PID.toLowerCase()]: 'reel' })
    expect(result.id).toBe('pub456')
    expect(mockFetch).toHaveBeenCalled()
  })

  it('throws on missing media in reel', async () => {
    await expect(publishToInstagram(TOKEN, CONTENT, [], PID, SC, { [PID.toLowerCase()]: 'reel' }))
      .rejects.toThrow('requires at least one video')
  })

  it('publishes a carousel', async () => {
    mockFetch.mockResolvedValue(mockJsonResponse({ id: 'child1', status_code: 'FINISHED' }))
    const urls = ['https://example.com/1.jpg', 'https://example.com/2.jpg']
    for (const u of urls) {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({ id: `child-${u.slice(-5)}` }))
    }
    // poll for each child (immediately succeeds)
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ status_code: 'FINISHED' }))
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ status_code: 'FINISHED' }))
    // carousel creation
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ id: 'carousel123' }))
    // publish
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ id: 'pub789' }))
    const result = await publishToInstagram(TOKEN, CONTENT, urls, PID, SC, { [PID.toLowerCase()]: 'carousel' })
    expect(result.id).toBe('pub789')
  }, 15000)

  it('includes audio_name for reel', async () => {
    const scWithAudio = { [PID.toLowerCase()]: { caption: 'test', audio_name: 'song.mp3' } }
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ id: 'reel123' }))
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ status_code: 'FINISHED' }))
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ id: 'pub456' }))
    await publishToInstagram(TOKEN, CONTENT, ['https://example.com/vid.mp4'], PID, scWithAudio, { [PID.toLowerCase()]: 'reel' })
    const calls = mockFetch.mock.calls.filter((c: any) => c[1]?.body).map((c: any) => JSON.parse(c[1].body))
    expect(calls.some((b: any) => b.audio_name === 'song.mp3')).toBe(true)
  }, 15000)
})

// ───── Facebook ─────
describe('Facebook', () => {
  it('publishes a text feed post', async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ id: 'fb123' }))
    const result = await publishToFacebook(TOKEN, CONTENT, [], PID, SC, { [PID.toLowerCase()]: 'feed' })
    expect(result.id).toBe('fb123')
  })

  it('publishes a link share', async () => {
    const scLink = { [PID.toLowerCase()]: { url: 'https://example.com', message: 'Check this' } }
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ id: 'link123' }))
    const result = await publishToFacebook(TOKEN, CONTENT, [], PID, scLink, { [PID.toLowerCase()]: 'link' })
    expect(result.id).toBe('link123')
  })

  it('publishes reels', async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ id: 'reel123' }))
    const result = await publishToFacebook(TOKEN, CONTENT, ['https://example.com/vid.mp4'], PID, SC, { [PID.toLowerCase()]: 'reels' })
    expect(result.id).toBe('reel123')
  })

  it('includes scheduled_publish_time when set', async () => {
    const scScheduled = { [PID.toLowerCase()]: { message: 'hi', scheduled_publish_time: '1718000000' } }
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ id: 'fb123' }))
    await publishToFacebook(TOKEN, CONTENT, [], PID, scScheduled, { [PID.toLowerCase()]: 'feed' })
    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.scheduled_publish_time).toBe(1718000000)
  })
})

// ───── X / Twitter ─────
describe('X/Twitter', () => {
  it('publishes a text post', async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ data: { id: 'x123', text: 'hi' } }))
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ data: { id: 'x123', text: 'hi' } }))
    const result = await publishToX(TOKEN, CONTENT, [], PID)
    expect(result.id).toBe('x123')
  })

  it('publishes a poll', async () => {
    const scPoll = { [PID.toLowerCase()]: { text: 'Question?', poll_options: 'A\nB\nC', poll_duration_minutes: '1440' } }
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ data: { id: 'poll123' } }))
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ data: { id: 'poll123' } }))
    const result = await publishToX(TOKEN, CONTENT, [], PID, scPoll, { [PID.toLowerCase()]: 'poll' })
    expect(result.id).toBe('poll123')
  })
})

// ───── LinkedIn ─────
describe('LinkedIn', () => {
  it('publishes a text post', async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ id: 'li123' }))
    const result = await publishToLinkedIn(TOKEN, CONTENT, [], PID, SC)
    expect(result.id).toBe('li123')
  })

  it('publishes an article', async () => {
    const scArticle = { [PID.toLowerCase()]: { title: 'My Title', description: 'My desc' } }
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ id: 'art123' }))
    const result = await publishToLinkedIn(TOKEN, CONTENT, [], PID, scArticle, { [PID.toLowerCase()]: 'article' })
    expect(result.id).toBe('art123')
  })

  it('publishes a poll', async () => {
    const scPoll = { [PID.toLowerCase()]: { commentary: 'Vote!', poll_options: 'A\nB\nC\nD', poll_duration_days: '7' } }
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ id: 'poll123' }))
    const result = await publishToLinkedIn(TOKEN, CONTENT, [], PID, scPoll, { [PID.toLowerCase()]: 'poll' })
    expect(result.id).toBe('poll123')
  })

  it('publishes a document', async () => {
    const scDoc = { [PID.toLowerCase()]: { commentary: 'See doc', document_url: 'https://example.com/doc.pdf' } }
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ value: { uploadUrl: 'https://upload.example.com', document: 'urn:li:document:123' } }))
    mockFetch.mockResolvedValueOnce(mockBufferResponse(Buffer.from('pdf content')))
    mockFetch.mockResolvedValueOnce(Promise.resolve(new Response(null, { status: 200 })))
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ id: 'doc123' }))
    const result = await publishToLinkedIn(TOKEN, CONTENT, [], PID, scDoc, { [PID.toLowerCase()]: 'document' })
    expect(result.id).toBe('doc123')
  })
})

// ───── YouTube ─────
describe('YouTube', () => {
  it('publishes a video', async () => {
    mockFetch.mockResolvedValueOnce(mockBufferResponse(Buffer.from('mp4 content'), 'video/mp4'))
    const initResponse = new Response(JSON.stringify({ id: 'yt123' }), {
      status: 200,
      headers: { location: 'https://upload.youtube.com/upload' },
    })
    mockFetch.mockResolvedValueOnce(Promise.resolve(initResponse))
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ id: 'yt123' }))
    const result = await publishToYouTube(TOKEN, CONTENT, ['https://example.com/vid.mp4'], PID)
    expect(result.id).toBe('yt123')
  })
})

// ───── Threads ─────
describe('Threads', () => {
  it('publishes a text post', async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ id: 'th123' }))
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ id: 'pub123' }))
    const result = await publishToThreads(TOKEN, CONTENT, [], PID, SC)
    expect(result.id).toBe('pub123')
  })
})

// ───── Reddit ─────
describe('Reddit', () => {
  it('publishes a text post', async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ json: { data: { name: 't3_rd123' } } }))
    const result = await publishToReddit(TOKEN, CONTENT, [], PID, { [PID.toLowerCase()]: { subreddit: 'test', title: 'Post' } })
    expect(result.id).toBe('rd123')
  })

  it('throws when subreddit is missing', async () => {
    await expect(publishToReddit(TOKEN, CONTENT, [], PID, {}))
      .rejects.toThrow(/subreddit/i)
  })
})

// ───── Pinterest ─────
describe('Pinterest', () => {
  it('publishes a standard pin', async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ id: 'pin123' }))
    const result = await publishToPinterest(TOKEN, CONTENT, MEDIA_URLS, PID)
    expect(result.id).toBe('pin123')
  })

  it('publishes a carousel pin', async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ id: 'car123' }))
    const result = await publishToPinterest(TOKEN, CONTENT, ['https://example.com/1.jpg', 'https://example.com/2.jpg'], PID, {}, { [PID.toLowerCase()]: 'carousel_pin' })
    expect(result.id).toBe('car123')
  })

  it('throws on insufficient images for carousel', async () => {
    await expect(publishToPinterest(TOKEN, CONTENT, ['https://example.com/1.jpg'], PID, {}, { [PID.toLowerCase()]: 'carousel_pin' }))
      .rejects.toThrow('carousel requires at least 2 images')
  })
})

// ───── WordPress ─────
describe('WordPress', () => {
  it('publishes a post', async () => {
    mockFetch.mockResolvedValueOnce(mockBufferResponse(Buffer.from('img')))
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ id: 456 }))
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ id: 123, link: 'https://example.com/post' }))
    const result = await publishToWordPress(TOKEN, CONTENT, MEDIA_URLS, PID, { [PID.toLowerCase()]: { title: 'Post', body: 'Body' } })
    expect(result.id).toBe('123')
    expect(result.url).toBe('https://example.com/post')
  })
})

// ───── Discord ─────
describe('Discord', () => {
  it('sends a simple message', async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ id: 'dc123' }))
    const result = await publishToDiscord(TOKEN, CONTENT, [], PID)
    expect(result.id).toBe('discord-message')
  })

  it('sends an embed', async () => {
    const scEmbed = { [PID.toLowerCase()]: { embed_title: 'Title', embed_description: 'Desc' } }
    mockFetch.mockResolvedValueOnce(mockJsonResponse({}))
    const result = await publishToDiscord(TOKEN, CONTENT, [], PID, scEmbed, { [PID.toLowerCase()]: 'embed' })
    expect(result.id).toBe('discord-embed')
  })
})

// ───── Telegram ─────
describe('Telegram', () => {
  it('sends a text message', async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ result: { message_id: 42 } }))
    const result = await publishToTelegram(TOKEN, CONTENT, [], PID)
    expect(result.id).toBe('42')
  })

  it('sends a photo', async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ result: { message_id: 1 } }))
    const result = await publishToTelegram(TOKEN, CONTENT, MEDIA_URLS, PID)
    expect(result.id).toBe('1')
  })

  it('sends a poll', async () => {
    const scPoll = { [PID.toLowerCase()]: { question: 'Q?', poll_options: 'A\nB\nC' } }
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ result: { message_id: 10 } }))
    const result = await publishToTelegram(TOKEN, CONTENT, [], PID, scPoll, { [PID.toLowerCase()]: 'poll' })
    expect(result.id).toBe('10')
  })

  it('sends a media group', async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ ok: true }))
    const result = await publishToTelegram(TOKEN, CONTENT, ['https://example.com/a.jpg', 'https://example.com/b.jpg'], PID, {}, { [PID.toLowerCase()]: 'media_group' })
    expect(result.id).toBe('tg-media-group')
  })
})

// ───── Slack ─────
describe('Slack', () => {
  it('sends a simple message', async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ ok: true, ts: '123.456' }))
    const result = await publishToSlack(TOKEN, CONTENT, [], PID)
    expect(result.id).toBe('123.456')
  })

  it('sends blocks', async () => {
    const scBlocks = { [PID.toLowerCase()]: { blocks_json: JSON.stringify([{ type: 'section', text: { text: 'hi' } }]) } }
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ ok: true, ts: '789.012' }))
    const result = await publishToSlack(TOKEN, CONTENT, [], PID, scBlocks, { [PID.toLowerCase()]: 'blocks_json' })
    expect(result.id).toBe('789.012')
  })

  it('includes thread_ts when set', async () => {
    const scThread = { [PID.toLowerCase()]: { text: 'reply', thread_ts: '123.456' } }
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ ok: true, ts: '789.012' }))
    await publishToSlack(TOKEN, CONTENT, [], PID, scThread)
    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.thread_ts).toBe('123.456')
  })
})

// ───── Bluesky ─────
describe('Bluesky', () => {
  it('publishes a text post', async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ accessJwt: 'jwt123', did: 'did:plc:abc', handle: 'user.bsky.social' }))
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ cid: 'cid123', uri: 'at://did:plc:abc/app.bsky.feed.post/rkey123' }))
    const result = await publishToBluesky(TOKEN, CONTENT, [], PID)
    expect(result.id).toBe('cid123')
  })

  it('publishes with image', async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ accessJwt: 'jwt123', did: 'did:plc:abc', handle: 'user.bsky.social' }))
    mockFetch.mockResolvedValueOnce(mockBufferResponse(Buffer.from('img'), 'image/jpeg'))
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ blob: { ref: { $link: 'ref123' }, mimeType: 'image/jpeg' } }))
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ cid: 'cid456', uri: 'at://did:plc:abc/app.bsky.feed.post/rkey456' }))
    const result = await publishToBluesky(TOKEN, CONTENT, MEDIA_URLS, PID)
    expect(result.id).toBe('cid456')
  })

  it('adds facets for URLs and hashtags', async () => {
    const textWithLinks = 'Check https://example.com and #tag'
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ accessJwt: 'jwt123', did: 'did:plc:abc', handle: 'user.bsky.social' }))
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ cid: 'cid789', uri: 'at://did:plc:abc/app.bsky.feed.post/rkey789' }))
    await publishToBluesky(TOKEN, textWithLinks, [], PID)
    const record = JSON.parse(mockFetch.mock.calls[1][1].body).record
    expect(record.facets).toBeDefined()
    expect(record.facets.length).toBeGreaterThanOrEqual(2)
    expect(record.facets.some((f: any) => f.features[0]['$type'] === 'app.bsky.richtext.facet#link')).toBe(true)
    expect(record.facets.some((f: any) => f.features[0]['$type'] === 'app.bsky.richtext.facet#tag')).toBe(true)
  })
})

// ───── Mastodon ─────
describe('Mastodon', () => {
  it('publishes a text post', async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ id: 'mst123', url: 'https://mastodon.social/@user/123' }))
    const result = await publishToMastodon(TOKEN, CONTENT, [], PID, { [PID.toLowerCase()]: { text: 'Hello' } })
    expect(result.id).toBe('mst123')
  })

  it('publishes a poll', async () => {
    const scPoll = { [PID.toLowerCase()]: { text: 'Q?', poll_options: 'A\nB\nC', poll_expires_in: '86400' } }
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ id: 'poll123', url: 'https://mastodon.social/@user/123' }))
    const result = await publishToMastodon(TOKEN, CONTENT, [], PID, scPoll, { [PID.toLowerCase()]: 'poll' })
    expect(result.id).toBe('poll123')
  })

  it('includes content_warning when set', async () => {
    const scCw = { [PID.toLowerCase()]: { text: 'Spoiler content', content_warning: 'NSFW' } }
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ id: 'cw123', url: '' }))
    await publishToMastodon(TOKEN, CONTENT, [], PID, scCw)
    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.spoiler_text).toBe('NSFW')
  })
})

// ───── Tumblr ─────
describe('Tumblr', () => {
  it('publishes a text post', async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ response: { id: 123 } }))
    const result = await publishToTumblr(TOKEN, CONTENT, [], PID, { [PID.toLowerCase()]: { title: 'Title', body: 'Body' } }, { [PID.toLowerCase()]: 'text' })
    expect(result.id).toBe('123')
  })

  it('publishes a photo post', async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ response: { id: 456 } }))
    const result = await publishToTumblr(TOKEN, CONTENT, MEDIA_URLS, PID, { [PID.toLowerCase()]: { body: 'Caption' } }, { [PID.toLowerCase()]: 'photo' })
    expect(result.id).toBe('456')
  })
})

// ───── GMB ─────
describe('GMB', () => {
  it('publishes an update', async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ name: 'localPosts/post123' }))
    const result = await publishToGMB(TOKEN, CONTENT, MEDIA_URLS, PID, { [PID.toLowerCase()]: { summary: 'Great update' } }, { [PID.toLowerCase()]: 'update' })
    expect(result.id).toBe('localPosts/post123')
  })

  it('publishes an event', async () => {
    const scEvent = { [PID.toLowerCase()]: { summary: 'Event desc', event_title: 'Event', event_start_date: '2025-12-31', event_end_date: '2026-01-01' } }
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ name: 'localPosts/evt123' }))
    const result = await publishToGMB(TOKEN, CONTENT, MEDIA_URLS, PID, scEvent, { [PID.toLowerCase()]: 'event' })
    expect(result.id).toBe('localPosts/evt123')
  })

  it('publishes an offer', async () => {
    const scOffer = { [PID.toLowerCase()]: { summary: '50% off', call_to_action: 'Learn More', end_date: '2025-12-31' } }
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ name: 'localPosts/offer123' }))
    const result = await publishToGMB(TOKEN, CONTENT, MEDIA_URLS, PID, scOffer, { [PID.toLowerCase()]: 'offer' })
    expect(result.id).toBe('localPosts/offer123')
  })

  it('publishes an alert', async () => {
    const scAlert = { [PID.toLowerCase()]: { summary: 'Store closed', call_to_action: 'LEARN_MORE', end_date: '2025-12-31' } }
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ name: 'localPosts/alert123' }))
    const result = await publishToGMB(TOKEN, CONTENT, MEDIA_URLS, PID, scAlert, { [PID.toLowerCase()]: 'alert' })
    expect(result.id).toBe('localPosts/alert123')
  })
})

// ───── Error Handling ─────
describe('Error handling across publishers', () => {
  it('Instagram throws on API error', async () => {
    mockFetch.mockResolvedValueOnce(mockTextResponse('Bad request', 400))
    await expect(publishToInstagram(TOKEN, CONTENT, MEDIA_URLS, PID, SC, PT))
      .rejects.toThrow()
  })

  it('Pinterest throws on missing media', async () => {
    await expect(publishToPinterest(TOKEN, CONTENT, [], PID))
      .rejects.toThrow('requires at least one media')
  })

  it('Telegram throws on poll with <2 options', async () => {
    const scPoll = { [PID.toLowerCase()]: { question: 'Q?', poll_options: 'Only one' } }
    await expect(publishToTelegram(TOKEN, CONTENT, [], PID, scPoll, { [PID.toLowerCase()]: 'poll' }))
      .rejects.toThrow('requires at least 2 options')
  })

  it('Mastodon throws on poll with <2 options', async () => {
    const scPoll = { [PID.toLowerCase()]: { text: 'Q?', poll_options: 'Only one' } }
    await expect(publishToMastodon(TOKEN, CONTENT, [], PID, scPoll, { [PID.toLowerCase()]: 'poll' }))
      .rejects.toThrow('requires at least 2 options')
  })

  it('Slack throws on API error', async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ ok: false, error: 'not_authed' }, 200))
    await expect(publishToSlack(TOKEN, CONTENT, [], PID))
      .rejects.toThrow('not_authed')
  })

  it('Bluesky throws on auth failure', async () => {
    mockFetch.mockResolvedValueOnce(mockTextResponse('Unauthorized', 401))
    await expect(publishToBluesky(TOKEN, CONTENT, [], PID))
      .rejects.toThrow('Bluesky auth failed')
  })
})
