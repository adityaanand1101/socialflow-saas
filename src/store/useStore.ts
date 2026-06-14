import { create } from 'zustand'
import { apiFetch } from '@/lib/api'

export type SocialPlatform = 
  | 'instagram' | 'linkedin' | 'x' | 'youtube' | 'gmb' 
  | 'facebook' | 'threads' | 'bluesky' | 'slack' | 'pinterest' 
  | 'mastodon' | 'reddit' | 'medium' | 'discord' | 'telegram' | 'tumblr'

export interface Post {
  id: string
  platforms: SocialPlatform[]
  caption: string
  media: string[]
  scheduledTime: string
  scheduledAt?: string
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
  loading: boolean
  fetchData: (token: string) => Promise<void>
  fetchChannels: (token: string) => Promise<void>
  addPost: (token: string, post: Omit<Post, 'id'>) => Promise<void>
  removePost: (token: string, id: string) => Promise<void>
  updatePost: (token: string, id: string, updates: Partial<Post>) => Promise<void>
  uploadMedia: (token: string, file: File) => Promise<void>
  removeMedia: (token: string, id: string) => Promise<void>
}

export const useStore = create<SocialFlowStore>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  channels: [],
  posts: [],
  media: [],
  loading: false,

  fetchData: async (token: string) => {
    set({ loading: true })
    try {
      const [postsRes, mediaRes] = await Promise.all([
        apiFetch('/api/posts', { headers: { Authorization: `Bearer ${token}` } }),
        apiFetch('/api/media', { headers: { Authorization: `Bearer ${token}` } })
      ])
      
      let posts = [], media = []
      if (postsRes.ok) posts = await postsRes.json()
      if (mediaRes.ok) media = await mediaRes.json()
      
      set({ 
        posts: Array.isArray(posts) ? posts : [], 
        media: Array.isArray(media) ? media : []
      })
    } catch (e) {
      console.error("Failed to fetch data", e)
      set({ posts: [], media: [] })
    } finally {
      set({ loading: false })
    }
  },

  fetchChannels: async (token: string) => {
    try {
      const res = await apiFetch('/api/channels', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) set({ channels: data })
      }
    } catch (e) {
      console.error("Failed to fetch channels", e)
    }
  },

  addPost: async (token: string, postData) => {
    try {
      const res = await apiFetch('/api/posts', {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: postData.caption,
          mediaUrls: postData.media,
          socialAccountIds: [], 
          scheduledAt: postData.scheduledTime,
          status: postData.status?.toUpperCase()
        })
      })

      if (res.ok) {
        const data = await res.json()
        set((state) => ({ posts: [data as any, ...state.posts] }))
      }
    } catch (e) {
      console.error("Failed to add post", e)
    }
  },

  removePost: async (token: string, id: string) => {
    try {
      const res = await apiFetch(`/api/posts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        set((state) => ({ posts: state.posts.filter((p) => p.id !== id) }))
      }
    } catch (e) {
      console.error("Failed to remove post", e)
    }
  },

  updatePost: async (token: string, id: string, updates) => {
    try {
      const payload: any = {}
      if (updates.scheduledTime) payload.scheduledAt = updates.scheduledTime;
      if (updates.caption) payload.content = updates.caption;
      
      const res = await apiFetch(`/api/posts/${id}`, {
        method: 'PATCH',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        set((state) => ({
          posts: state.posts.map((p) => p.id === id ? { ...p, ...updates } : p)
        }))
      }
    } catch (e) {
      console.error("Failed to update post", e)
    }
  },

  uploadMedia: async (token: string, file: File) => {
    try {
      const presignedRes = await apiFetch('/api/media/presigned-url', {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size
        })
      });

      if (presignedRes.ok) {
        const { uploadUrl, fileUrl } = await presignedRes.json();

        const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          }
        });

        if (uploadRes.ok) {
          const registerRes = await apiFetch('/api/media/register', {
            method: 'POST',
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              fileName: file.name,
              fileUrl,
              fileType: file.type,
              fileSize: file.size,
              tags: []
            })
          });

          if (registerRes.ok) {
            const data = await registerRes.json();
            set((state) => ({ media: [data, ...state.media] }))
          }
        }
      }
    } catch (error) {
      console.error("Failed to upload media", error);
    }
  },

  removeMedia: async (token: string, id: string) => {
    try {
      const res = await apiFetch(`/api/media/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        set((state) => ({ media: state.media.filter((m) => m.id !== id) }))
      }
    } catch (error) {
      console.error("Failed to remove media", error);
    }
  },
}))
