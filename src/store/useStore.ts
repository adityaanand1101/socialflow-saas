import { create } from 'zustand'

export type SocialPlatform = 
  | 'instagram' | 'linkedin' | 'x' | 'youtube' | 'tiktok' 
  | 'facebook' | 'threads' | 'pinterest' | 'reddit' 
  | 'bluesky' | 'mastodon' | 'discord' | 'slack' | 'gmb'

export interface Post {
  id: string
  platforms: SocialPlatform[]
  caption: string
  media: string[]
  scheduledTime: string
  status: 'scheduled' | 'draft' | 'failed' | 'published'
  tags: string[]
}

export interface Channel {
  id: string
  platform: SocialPlatform
  name: string
  username: string
  avatar: string
  followers: number
  status: 'connected' | 'expired' | 'disconnected'
  engagementRate: number
  lastSynced: string
}

interface SocialFlowStore {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  channels: Channel[]
  posts: Post[]
  media: any[]
  addPost: (post: Post) => void
  removePost: (id: string) => void
}

export const useStore = create<SocialFlowStore>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  channels: [
    {
      id: '1',
      platform: 'instagram',
      name: 'SocialFlow HQ',
      username: '@socialflow_hq',
      avatar: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=128&h=128&fit=crop',
      followers: 12400,
      status: 'connected',
      engagementRate: 4.8,
      lastSynced: new Date().toISOString()
    },
    {
      id: '2',
      platform: 'linkedin',
      name: 'SocialFlow Inc.',
      username: 'socialflow-inc',
      avatar: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=128&h=128&fit=crop',
      followers: 5200,
      status: 'connected',
      engagementRate: 3.2,
      lastSynced: new Date().toISOString()
    },
    {
      id: '3',
      platform: 'x',
      name: 'SocialFlow',
      username: '@SocialFlowApp',
      avatar: 'https://images.unsplash.com/photo-1611605698335-8b1569810432?w=128&h=128&fit=crop',
      followers: 8900,
      status: 'connected',
      engagementRate: 2.1,
      lastSynced: new Date().toISOString()
    }
  ],
  posts: [
    {
      id: '1',
      platforms: ['instagram', 'x'],
      caption: 'Big things are coming! Stay tuned for our next update. #SaaS #SocialMedia',
      media: ['https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop'],
      scheduledTime: new Date(Date.now() + 86400000).toISOString(),
      status: 'scheduled',
      tags: ['campaign-a']
    },
    {
      id: '2',
      platforms: ['linkedin'],
      caption: 'Why social media scheduling is critical for your business growth in 2026.',
      media: ['https://images.unsplash.com/photo-1454165833767-131f3696773a?w=400&h=300&fit=crop'],
      scheduledTime: new Date(Date.now() + 172800000).toISOString(),
      status: 'scheduled',
      tags: ['educational']
    }
  ],
  media: [],
  addPost: (post) => set((state) => ({ posts: [post, ...state.posts] })),
  removePost: (id) => set((state) => ({ posts: state.posts.filter((p) => p.id !== id) })),
}))
