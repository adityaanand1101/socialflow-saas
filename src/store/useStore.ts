import { create } from 'zustand'
import { apiFetch } from '@/lib/api'
import { cookieStorage } from '@/lib/cookies'

export type SocialPlatform = 
  | 'instagram' | 'linkedin' | 'x' | 'youtube' | 'gmb' 
  | 'facebook' | 'threads' | 'bluesky' | 'slack' | 'pinterest' 
  | 'mastodon' | 'reddit' | 'discord' | 'telegram' | 'tumblr'

export interface ThreadPost {
  id: string
  content: string
  delayMinutes: number
  media?: string[]
}

export interface Post {
  id: string
  platforms: SocialPlatform[]
  caption: string
  media: string[]
  scheduledTime: string
  scheduledAt?: string
  status: 'scheduled' | 'draft' | 'failed' | 'published'
  tags: string[]
  socialAccountIds?: string[]
  structuredContent?: Record<string, Record<string, string>>
  postTypes?: Record<string, string>
  thread?: ThreadPost[]
  firstComments?: Record<string, string>
  repostUrl?: string
  repostEnabled?: boolean
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

  fetchData: async (token: string, _folderId = null) => {
    set({ loading: true })
    try {
      const [channelsRes, postsRes] = await Promise.all([
        apiFetch('/api/channels', { headers: { Authorization: `Bearer ${token}` } }),
        apiFetch('/api/posts', { headers: { Authorization: `Bearer ${token}` } }),
      ])
      if (channelsRes.ok) {
        const channelsData = await channelsRes.json()
        if (Array.isArray(channelsData)) set({ channels: channelsData })
      }
      if (postsRes.ok) {
        const postsData = await postsRes.json()
        if (Array.isArray(postsData)) set({ posts: postsData })
        else if (postsData?.posts && Array.isArray(postsData.posts)) set({ posts: postsData.posts })
      }
    } catch (e) {
      console.error("Failed to fetch dashboard data", e)
    } finally {
      set({ loading: false })
    }
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
      const body: any = {
        content: postData.caption,
        mediaUrls: postData.media,
        socialAccountIds: postData.socialAccountIds || [],
        scheduledAt: postData.scheduledTime,
        status: postData.status?.toUpperCase()
      }
      if (postData.structuredContent) body.structuredContent = postData.structuredContent
      if (postData.postTypes) body.postTypes = postData.postTypes
      if (postData.thread) body.thread = postData.thread
      if (postData.tags) body.tags = postData.tags
      if (postData.platforms) body.platforms = postData.platforms
      if (postData.firstComments) body.firstComments = postData.firstComments
      if (postData.repostUrl !== undefined) body.repostUrl = postData.repostUrl
      if (postData.repostEnabled !== undefined) body.repostEnabled = postData.repostEnabled
      const res = await apiFetch('/api/posts', {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      if (res.ok) {
        const data = await res.json()
        set((state) => ({ posts: [data, ...state.posts] }))
      } else {
        throw new Error(`Failed to add post: ${res.status}`)
      }
    } catch (e) {
      console.error("Failed to add post", e)
      throw e
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
      } else {
        throw new Error(`Failed to remove post: ${res.status}`)
      }
    } catch (e) {
      console.error("Failed to remove post", e)
      throw e
    }
  },

  updatePost: async (token: string, id: string, updates) => {
    try {
      const payload: any = {}
      if (updates.scheduledTime !== undefined) payload.scheduledAt = updates.scheduledTime;
      if (updates.caption !== undefined) payload.content = updates.caption;
      if (updates.media !== undefined) payload.mediaUrls = updates.media;
      if (updates.socialAccountIds !== undefined) payload.socialAccountIds = updates.socialAccountIds;
      if (updates.status !== undefined) payload.status = updates.status.toUpperCase();
      if (updates.structuredContent !== undefined) payload.structuredContent = updates.structuredContent;
      if (updates.postTypes !== undefined) payload.postTypes = updates.postTypes;
      if (updates.thread !== undefined) payload.thread = updates.thread;
      if (updates.platforms !== undefined) payload.platforms = updates.platforms;
      if (updates.tags !== undefined) payload.tags = updates.tags;
      if (updates.firstComments !== undefined) payload.firstComments = updates.firstComments;
      if (updates.repostUrl !== undefined) payload.repostUrl = updates.repostUrl;
      if (updates.repostEnabled !== undefined) payload.repostEnabled = updates.repostEnabled;

      const res = await apiFetch(`/api/posts/${id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        const data = await res.json()
        set((state) => ({
          posts: state.posts.map((p) => p.id === id ? {
            ...p,
            scheduledTime: data.scheduledAt || data.scheduledTime || updates.scheduledTime,
            scheduledAt: data.scheduledAt || data.scheduledTime || updates.scheduledTime,
            caption: data.content || data.caption || updates.caption,
            content: data.content || data.caption || updates.caption,
            media: data.mediaUrls || data.media || updates.media,
            status: data.status?.toLowerCase() || updates.status,
            platforms: data.platforms || updates.platforms,
            structuredContent: data.structuredContent || updates.structuredContent,
            postTypes: data.postTypes || updates.postTypes,
            thread: data.thread || updates.thread,
            socialAccountIds: data.socialAccountIds || updates.socialAccountIds,
            tags: data.tags || updates.tags,
            firstComments: data.firstComments || updates.firstComments,
            repostUrl: data.repostUrl !== undefined ? data.repostUrl : updates.repostUrl,
            repostEnabled: data.repostEnabled !== undefined ? data.repostEnabled : updates.repostEnabled,
            id: data.id || id
          } : p)
        }))
      } else {
        throw new Error(`Failed to update post: ${res.status}`)
      }
    } catch (e) {
      console.error("Failed to update post", e)
      throw e
    }
  },

  uploadMedia: async (token: string, file: File, folderId?: string | null) => {
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
            URL.revokeObjectURL(localPreviewUrl)
            set((state) => ({
              media: state.media.map(m => m.id === optimisticId ? data : m)
            }))
            return data;
          } else {
            throw new Error('Failed to register media')
          }
        } else {
          throw new Error('Failed to upload file to storage')
        }
      } else {
        throw new Error('Failed to get presigned URL')
      }
    } catch (error) {
      console.error("Failed to upload media", error);
    }

    URL.revokeObjectURL(localPreviewUrl)
    set((state) => ({ media: state.media.filter(m => m.id !== optimisticId) }))
    throw new Error('Media upload failed')
  },

  removeMedia: async (token: string, id: string): Promise<boolean> => {
    try {
      const res = await apiFetch(`/api/media/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        set((state) => ({ media: state.media.filter((m) => m.id !== id) }))
        return true
      }
      console.error('Failed to remove media:', await res.text().catch(() => res.status))
    } catch (error) {
      console.error("Failed to remove media", error);
    }
    return false
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

  removeFolder: async (token, id): Promise<boolean> => {
    try {
      const res = await apiFetch(`/api/media/folders/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        set((state) => ({ folders: state.folders.filter(f => f.id !== id) }))
        return true
      }
      console.error('Failed to remove folder:', await res.text().catch(() => res.status))
    } catch (error) {
      console.error("Failed to remove folder", error);
    }
    return false
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
