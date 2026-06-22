import { Rss } from 'lucide-react'
import {
  Instagram, Linkedin, Twitter, Youtube, Facebook, Threads, Bluesky,
  Slack, Pinterest, Mastodon, Reddit, Discord, Telegram, GMB, Tumblr, WordPress
} from '@/components/icons'

export interface PlatformDef {
  id: string
  label: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  color: string
  bgHover: string
  description: string
  authNote: string
  limit: number
}

export const ALL_PLATFORMS: PlatformDef[] = [
  { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-400', bgHover: 'hover:border-pink-500/50 hover:bg-pink-500/5', description: 'Reels, Stories & Feed', authNote: 'Business/Creator accounts: OAuth via Instagram Login. Personal accounts: manual connect with handle only.', limit: 2200 },
  { id: 'facebook', label: 'Facebook', icon: Facebook, color: 'text-blue-500', bgHover: 'hover:border-blue-600/50 hover:bg-blue-600/5', description: 'Pages & Groups', authNote: 'Requires Facebook Page admin access', limit: 63206 },
  { id: 'threads', label: 'Threads', icon: Threads, color: 'text-white', bgHover: 'hover:border-white/30 hover:bg-white/5', description: 'Text-based sharing', authNote: 'Requires Threads account', limit: 500 },
  { id: 'x', label: 'X (Twitter)', icon: Twitter, color: 'text-white', bgHover: 'hover:border-gray-400/50 hover:bg-gray-400/5', description: 'Tweets & Threads', authNote: 'Requires X developer access', limit: 280 },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'text-blue-400', bgHover: 'hover:border-blue-500/50 hover:bg-blue-500/5', description: 'Posts, Articles & Pages', authNote: 'Requires LinkedIn Page admin access', limit: 3000 },
  { id: 'youtube', label: 'YouTube', icon: Youtube, color: 'text-red-500', bgHover: 'hover:border-red-500/50 hover:bg-red-500/5', description: 'Videos & Shorts', authNote: 'Requires Google account', limit: 5000 },
  { id: 'gmb', label: 'Google My Business', icon: GMB, color: 'text-blue-600', bgHover: 'hover:border-blue-700/50 hover:bg-blue-700/5', description: 'Local SEO & Reviews', authNote: 'Requires Google Business Profile', limit: 1500 },
  { id: 'bluesky', label: 'Bluesky', icon: Bluesky, color: 'text-blue-400', bgHover: 'hover:border-blue-500/30 hover:bg-blue-500/5', description: 'Decentralized Social', authNote: 'Requires Bluesky handle & app password', limit: 300 },
  { id: 'mastodon', label: 'Mastodon', icon: Mastodon, color: 'text-purple-500', bgHover: 'hover:border-purple-600/50 hover:bg-purple-600/5', description: 'Federated microblogging', authNote: 'Requires Mastodon instance URL', limit: 500 },
  { id: 'wordpress', label: 'WordPress', icon: WordPress, color: 'text-blue-500', bgHover: 'hover:border-blue-500/50 hover:bg-blue-500/5', description: 'Blogs & Articles', authNote: 'Requires WordPress.com REST API OAuth', limit: 100000 },
  { id: 'discord', label: 'Discord', icon: Discord, color: 'text-indigo-400', bgHover: 'hover:border-indigo-500/50 hover:bg-indigo-500/5', description: 'Server Webhooks & Bots', authNote: 'Requires Discord Bot permissions', limit: 2000 },
  { id: 'telegram', label: 'Telegram', icon: Telegram, color: 'text-blue-400', bgHover: 'hover:border-blue-500/50 hover:bg-blue-500/5', description: 'Channels & Groups', authNote: 'Requires Telegram Bot API Token', limit: 4096 },
  { id: 'tumblr', label: 'Tumblr', icon: Tumblr, color: 'text-blue-900', bgHover: 'hover:border-blue-900/50 hover:bg-blue-900/5', description: 'Microblogging & Social', authNote: 'Requires Tumblr Consumer Key', limit: 10000 },
  { id: 'slack', label: 'Slack', icon: Slack, color: 'text-green-500', bgHover: 'hover:border-green-600/50 hover:bg-green-600/5', description: 'Workplace messaging', authNote: 'Requires Slack App/Webhook URL', limit: 12000 },
  { id: 'pinterest', label: 'Pinterest', icon: Pinterest, color: 'text-red-600', bgHover: 'hover:border-red-700/50 hover:bg-red-700/5', description: 'Pins & Boards', authNote: 'Requires Pinterest Business account', limit: 500 },
  { id: 'reddit', label: 'Reddit', icon: Reddit, color: 'text-orange-500', bgHover: 'hover:border-orange-600/50 hover:bg-orange-600/5', description: 'Subreddit communities', authNote: 'Requires Reddit app credentials', limit: 10000 },
  { id: 'rss', label: 'RSS Feed', icon: Rss, color: 'text-orange-500', bgHover: 'hover:border-orange-500/50 hover:bg-orange-500/5', description: 'Blog & News monitoring', authNote: 'Requires the feed URL of any RSS/Atom source', limit: 999999 },
]
