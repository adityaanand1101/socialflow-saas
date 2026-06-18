import { create } from 'zustand'
import { apiFetch } from '@/lib/api'
import { cookieStorage } from '@/lib/cookies'

export type SocialPlatform = 
  | 'instagram' | 'linkedin' | 'x' | 'youtube' | 'gmb' 
  | 'facebook' | 'threads' | 'bluesky' | 'slack' | 'pinterest' 
  | 'mastodon' | 'reddit' | 'discord' | 'telegram' | 'tumblr'

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
  mediaViewMode: 'grid' | 'list'
  toggleSidebar: () => void
  setMediaViewMode: (mode: 'grid' | 'list') => void
  channels: Channel[]
  posts: Post[]
  media: any[]
  folders: any[]
  currentFolderId: string | null
  loading: boolean
  fetchData: (token: string, folderId?: string | null) => Promise<void>
  fetchChannels: (token: string) => Promise<void>
  addPost: (token: string, post: Omit<Post, 'id'>) => Promise<void>
  removePost: (token: string, id: string) => Promise<void>
  updatePost: (token: string, id: string, updates: Partial<Post>) => Promise<void>
  uploadMedia: (token: string, file: File, folderId?: string | null) => Promise<any>
  removeMedia: (token: string, id: string) => Promise<void>
  createFolder: (token: string, name: string, parentId?: string | null) => Promise<void>
  updateFolder: (token: string, id: string, name: string) => Promise<void>
  removeFolder: (token: string, id: string) => Promise<void>
  moveAsset: (token: string, id: string, folderId: string | null) => Promise<void>
  setCurrentFolder: (folderId: string | null) => void
  workspaces: any[]
  activeWorkspaceId: string | null
  activeWorkspaceRole: string | null
  setWorkspaces: (workspaces: any[]) => void
  setActiveWorkspace: (id: string, role: string) => void
}

export const useStore = create<SocialFlowStore>((set) => ({
  sidebarCollapsed: cookieStorage.get('sidebarCollapsed') === true,
  mediaViewMode: cookieStorage.get('mediaViewMode') || 'grid',
  toggleSidebar: () => set((state) => {
    const newVal = !state.sidebarCollapsed
    cookieStorage.set('sidebarCollapsed', newVal)
    return { sidebarCollapsed: newVal }
  }),
  setMediaViewMode: (mode) => {
    cookieStorage.set('mediaViewMode', mode)
    set({ mediaViewMode: mode })
  },
  channels: [],
  posts: [],
  media: [],
  folders: [],
  currentFolderId: null,
  loading: false,

  setCurrentFolder: (folderId) => set({ currentFolderId: folderId }),
  workspaces: [],
  activeWorkspaceId: null,
  activeWorkspaceRole: null,

  setWorkspaces: (workspaces) => set({ workspaces }),
  setActiveWorkspace: (id, role) => set({ activeWorkspaceId: id, activeWorkspaceRole: role }),

  fetchData: async (_token: string, _folderId = null) => {
    // Redundant now that we use React Query, but keeping as placeholder for other data if needed
  },

  createFolder: async (token, name, parentId = null) => {
    try {
      await apiFetch('/api/media/folders', {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, parentId })
      });
    } catch (error) {
      console.error("Failed to create folder", error);
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

  uploadMedia: async (token: string, file: File, folderId?: string | null) => {
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
              folderId: folderId !== undefined ? folderId : useStore.getState().currentFolderId,
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

  updateFolder: async (token, id, name) => {
    try {
      const res = await apiFetch(`/api/media/folders/${id}`, {
        method: 'PATCH',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        const folder = await res.json();
        set((state) => ({
          folders: state.folders.map(f => f.id === id ? folder : f)
        }));
      }
    } catch (error) {
      console.error("Failed to update folder", error);
    }
  },

  removeFolder: async (token, id) => {
    try {
      const res = await apiFetch(`/api/media/folders/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        set((state) => ({ folders: state.folders.filter(f => f.id !== id) }))
      }
    } catch (error) {
      console.error("Failed to remove folder", error);
    }
  },

  moveAsset: async (token, id, folderId) => {
    try {
      const res = await apiFetch(`/api/media/${id}`, {
        method: 'PATCH',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ folderId })
      });
      if (res.ok) {
        set((state) => ({
          media: state.media.filter(m => m.id !== id) // Remove from current view
        }));
      }
    } catch (error) {
      console.error("Failed to move asset", error);
    }
  },
}))
