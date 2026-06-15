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
  uploadMedia: (token: string, file: File) => Promise<any>
  removeMedia: (token: string, id: string) => Promise<void>
}

export const useStore = create<SocialFlowStore>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  channels: [],
  posts: [],
  media: [],
  loading: false,

  fetchData: async (token: string, force = false) => {
    // If we already have media and it's not a forced refresh, don't show the global loader
    const { media } = useStore.getState()
    if (media.length > 0 && !force) {
      // Background refresh
      apiFetch('/api/media', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => set({ media: Array.isArray(data) ? data : [] }))
      
      const postsRes = await apiFetch('/api/posts', { headers: { Authorization: `Bearer ${token}` } })
      if (postsRes.ok) {
        const posts = await postsRes.json()
        set({ posts: Array.isArray(posts) ? posts : [] })
      }
      return
    }

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
    // 1. Create Optimistic Preview
    const optimisticId = Math.random().toString(36).substring(7);
    const localPreviewUrl = URL.createObjectURL(file);
    const optimisticAsset = {
      id: optimisticId,
      fileName: file.name,
      fileUrl: localPreviewUrl,
      fileType: file.type,
      fileSize: file.size,
      createdAt: new Date().toISOString(),
      optimistic: true
    };

    // Add to UI immediately
    set((state) => ({ media: [optimisticAsset, ...state.media] }))

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
          body: file
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
            // Replace optimistic asset with real data
            set((state) => ({ 
              media: state.media.map(m => m.id === optimisticId ? data : m) 
            }))
            return data;
          }
        }
      }
    } catch (error) {
      console.error("Failed to upload media", error);
    }
    
    // If failed, remove optimistic asset
    set((state) => ({ media: state.media.filter(m => m.id !== optimisticId) }))
    return null;
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
