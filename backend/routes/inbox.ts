import { Router } from 'express'

const router = Router()

interface InboxItem {
  id: string
  platform: string
  type: 'comment' | 'dm'
  fromName: string
  fromUsername: string
  fromAvatar: string
  content: string
  postId?: string
  postCaption?: string
  timestamp: string
  isRead: boolean
}

interface InboxThread {
  id: string
  platform: string
  withName: string
  withUsername: string
  withAvatar: string
  lastMessage: string
  lastTimestamp: string
  unread: number
  messages: { id: string; fromMe: boolean; content: string; timestamp: string }[]
}

const MOCK_COMMENTS: InboxItem[] = [
  { id: 'c1', platform: 'instagram', type: 'comment', fromName: 'Sarah Johnson', fromUsername: 'sarah.j', fromAvatar: '', content: 'Love this! 🔥 When did you launch?', postId: 'p1', postCaption: 'Excited to announce our new product line!', timestamp: new Date(Date.now() - 15 * 60000).toISOString(), isRead: false },
  { id: 'c2', platform: 'instagram', type: 'comment', fromName: 'Mike Chen', fromUsername: 'mike.chen', fromAvatar: '', content: 'Great content as always 👏', postId: 'p1', postCaption: 'Excited to announce our new product line!', timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), isRead: true },
  { id: 'c3', platform: 'x', type: 'comment', fromName: 'Tech Weekly', fromUsername: 'techweekly', fromAvatar: '', content: 'We featured this in our newsletter!', postId: 'p2', postCaption: '5 tips for better social media engagement', timestamp: new Date(Date.now() - 5 * 3600000).toISOString(), isRead: false },
  { id: 'c4', platform: 'facebook', type: 'comment', fromName: 'Emily Davis', fromUsername: 'emily.davis', fromAvatar: '', content: 'When is the next webinar?', postId: 'p3', postCaption: 'Monthly update - what we achieved', timestamp: new Date(Date.now() - 86400000).toISOString(), isRead: false },
  { id: 'c5', platform: 'linkedin', type: 'comment', fromName: 'Alex Rodriguez', fromUsername: 'arodriguez', fromAvatar: '', content: 'Interesting perspective. I would add that...', postId: 'p4', postCaption: 'Industry trends to watch in 2026', timestamp: new Date(Date.now() - 2 * 86400000).toISOString(), isRead: true },
]

const MOCK_DMS: InboxThread[] = [
  { id: 'd1', platform: 'instagram', withName: 'Jessica Park', withUsername: 'jessica.park', withAvatar: '', lastMessage: 'Hey! Would love to collaborate on something', lastTimestamp: new Date(Date.now() - 10 * 60000).toISOString(), unread: 2, messages: [
    { id: 'dm1', fromMe: false, content: 'Hey! Would love to collaborate on something', timestamp: new Date(Date.now() - 10 * 60000).toISOString() },
    { id: 'dm2', fromMe: false, content: 'I have 50k followers and our audiences align perfectly', timestamp: new Date(Date.now() - 8 * 60000).toISOString() },
  ]},
  { id: 'd2', platform: 'x', withName: 'David Kim', withUsername: 'davidk', withAvatar: '', lastMessage: 'Can you check your DMs?', lastTimestamp: new Date(Date.now() - 3600000).toISOString(), unread: 0, messages: [
    { id: 'dm3', fromMe: true, content: 'Thanks for reaching out!', timestamp: new Date(Date.now() - 7200000).toISOString() },
    { id: 'dm4', fromMe: false, content: 'Can you check your DMs?', timestamp: new Date(Date.now() - 3600000).toISOString() },
  ]},
  { id: 'd3', platform: 'telegram', withName: 'Anna Schmidt', withUsername: 'anna_s', withAvatar: '', lastMessage: 'The report is ready for review', lastTimestamp: new Date(Date.now() - 4 * 3600000).toISOString(), unread: 1, messages: [
    { id: 'dm5', fromMe: false, content: 'The report is ready for review', timestamp: new Date(Date.now() - 4 * 3600000).toISOString() },
  ]},
  { id: 'd4', platform: 'discord', withName: 'Community Bot', withUsername: 'community_bot', withAvatar: '', lastMessage: 'New member joined: @user123', lastTimestamp: new Date(Date.now() - 86400000).toISOString(), unread: 0, messages: [
    { id: 'dm6', fromMe: false, content: 'New member joined: @user123', timestamp: new Date(Date.now() - 86400000).toISOString() },
  ]},
]

router.get('/comments', (_req, res) => {
  res.json(MOCK_COMMENTS)
})

router.get('/dms', (_req, res) => {
  res.json(MOCK_DMS)
})

router.post('/comments/:id/reply', (req, res) => {
  const { id } = req.params
  const { content } = req.body
  const comment = MOCK_COMMENTS.find(c => c.id === id)
  if (!comment) return res.status(404).json({ error: 'Comment not found' })
  console.log(`Reply to comment ${id}: "${content}"`)
  res.json({ success: true, reply: { id: `r_${Date.now()}`, content, timestamp: new Date().toISOString() } })
})

router.post('/dms/:id/reply', (req, res) => {
  const { id } = req.params
  const { content } = req.body
  const thread = MOCK_DMS.find(t => t.id === id)
  if (!thread) return res.status(404).json({ error: 'Thread not found' })
  console.log(`Reply to DM thread ${id}: "${content}"`)
  thread.messages.push({ id: `dm_${Date.now()}`, fromMe: true, content, timestamp: new Date().toISOString() })
  thread.lastMessage = content
  thread.lastTimestamp = new Date().toISOString()
  res.json({ success: true })
})

router.patch('/comments/:id/read', (req, res) => {
  const { id } = req.params
  const comment = MOCK_COMMENTS.find(c => c.id === id)
  if (comment) comment.isRead = true
  res.json({ success: true })
})

export default router
