import { useEffect, useState } from 'react'
import {
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  AlertCircle,
} from 'lucide-react'
import { useAuth } from '@clerk/react'
import { cn } from '@/lib/utils'
import { apiFetch } from '@/lib/api'

const COLORS = ['#E4405F', '#0A66C2', '#000000', '#FF0000', '#FFC107', '#00BCD4', '#9C27B0', '#4CAF50', '#FF5722', '#607D8B']

interface PlatformData {
  platform: string
  accountId: string
  accountName: string
  avatarUrl?: string
  followers: number
  following: number
  postsCount: number
  engagement: number
  impressions: number
  reach: number
  profileViews: number
  error?: string
}

interface KpiMetric {
  total: number
  growth: number
}

interface AnalyticsData {
  platforms: PlatformData[]
  metrics: {
    followers: KpiMetric
    engagements: KpiMetric
    impressions: KpiMetric
    linkClicks: KpiMetric
    shares: KpiMetric
  }
  timeline: Array<Record<string, any>>
  platformDistribution: Array<{ name: string; value: number }>
  topPosts: Array<{
    id: string
    content: string
    platform: string
    publishedAt: string
    reach: number
    engagement: number
    rate: string
  }>
}

export const Analytics = () => {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { getToken } = useAuth()

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        setError(null)
        const token = await getToken()
        const res = await apiFetch('/api/analytics', { headers: { Authorization: `Bearer ${token}` } })
        if (!res.ok) throw new Error(`API error: ${res.statusText}`)
        const json = await res.json()
        setData(json)
      } catch (e: any) {
        setError(e.message || 'Failed to load analytics')
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [getToken])

  const formatNumber = (n: number) => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
    return String(n)
  }

  const kpiItems = data ? [
    { label: 'Impressions', value: formatNumber(data.metrics.impressions.total), growth: data.metrics.impressions.growth + '%', up: data.metrics.impressions.growth >= 0 },
    { label: 'Engagements', value: formatNumber(data.metrics.engagements.total), growth: data.metrics.engagements.growth + '%', up: data.metrics.engagements.growth >= 0 },
    { label: 'Link Clicks', value: formatNumber(data.metrics.linkClicks.total), growth: data.metrics.linkClicks.growth + '%', up: data.metrics.linkClicks.growth >= 0 },
    { label: 'Shares', value: formatNumber(data.metrics.shares.total), growth: data.metrics.shares.growth + '%', up: data.metrics.shares.growth >= 0 },
    { label: 'Net Followers', value: formatNumber(data.metrics.followers.total), growth: data.metrics.followers.growth + '%', up: data.metrics.followers.growth >= 0 },
  ] : []

  const totalFollowers = data?.platforms.reduce((s, p) => s + p.followers, 0) || 0
  const connectedCount = data?.platforms.length || 0

  if (error) {
    return (
      <div className="space-y-8 pb-10">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-1">Deep dive into your social performance.</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="w-10 h-10 text-red-400 mb-4" />
            <p className="text-white font-medium">Failed to load analytics</p>
            <p className="text-muted-foreground text-sm mt-1">{error}</p>
            <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            {loading
              ? 'Loading your social performance...'
              : `Deep dive into your social performance across ${connectedCount} connected ${connectedCount === 1 ? 'account' : 'accounts'}.`
            }
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </Button>
          <Button variant="outline" className="gap-2" disabled>
            <Download className="w-4 h-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Analytics KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-3 w-24 bg-white/10 rounded mb-3" />
              <div className="h-8 w-16 bg-white/10 rounded" />
            </Card>
          ))
        ) : (
          kpiItems.map((item, i) => (
            <Card key={i} className="p-4 flex flex-col justify-between">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{item.label}</p>
              <div className="flex items-end justify-between mt-2">
                <span className="text-2xl font-bold text-white">{item.value}</span>
                <span className={cn(
                  "flex items-center text-xs font-bold",
                  item.up ? "text-green-400" : "text-red-400"
                )}>
                  {item.up ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                  {item.growth}
                </span>
              </div>
            </Card>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Engagement Over Time Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Engagement Over Time</CardTitle>
            <CardDescription>Multi-platform performance across the current period.</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            {loading ? (
              <div className="w-full h-full animate-pulse bg-white/5 rounded-lg" />
            ) : data && data.timeline.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.timeline}>
                  <defs>
                    <linearGradient id="colorPosts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#141218', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="_count" stroke="#7C3AED" fillOpacity={1} fill="url(#colorPosts)" name="Posts" />
                  {data.platforms.slice(0, 3).map((p, i) => {
                    const colors = ['#E4405F', '#0A66C2', '#000000']
                    return (
                      <Area key={p.platform} type="monotone" dataKey={p.platform} stroke={colors[i]} fillOpacity={0} name={p.platform} />
                    )
                  })}
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-white font-medium">No performance data yet</p>
                <p className="text-muted-foreground text-sm mt-1">Publish posts to see trends over time</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reach Split by Platform */}
        <Card>
          <CardHeader>
            <CardTitle>Reach Split by Platform</CardTitle>
            <CardDescription>How your audience is distributed across channels.</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px] flex items-center justify-center relative">
            {loading ? (
              <div className="w-48 h-48 rounded-full animate-pulse bg-white/5" />
            ) : data && data.platformDistribution.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.platformDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {data.platformDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-bold text-white">{formatNumber(totalFollowers)}</span>
                  <span className="text-xs text-muted-foreground uppercase">Followers</span>
                </div>
              </>
            ) : (
              <div className="text-center">
                <p className="text-muted-foreground text-sm">No audience data available</p>
                <p className="text-muted-foreground text-xs mt-1">Connect accounts to see split</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Platform Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Breakdown</CardTitle>
          <CardDescription>Detailed metrics per connected account.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4 animate-pulse">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-white/5 rounded-lg" />
              ))}
            </div>
          ) : data && data.platforms.length > 0 ? (
            <div className="space-y-4">
              {data.platforms.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                      {p.avatarUrl && !p.avatarUrl.includes('shadcn.png') ? (
                        <img src={p.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg font-bold text-white/60">{p.platform.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white capitalize">{p.accountName}</p>
                      <p className="text-xs text-muted-foreground">{p.platform} {p.error && <span className="text-red-400 ml-2">· {p.error}</span>}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-right">
                      <p className="text-white font-medium">{formatNumber(p.followers)}</p>
                      <p className="text-xs text-muted-foreground">Followers</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">{formatNumber(p.following)}</p>
                      <p className="text-xs text-muted-foreground">Following</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">{formatNumber(p.postsCount)}</p>
                      <p className="text-xs text-muted-foreground">Posts</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">No connected accounts found.</p>
              <p className="text-muted-foreground text-xs mt-1">Connect your social accounts in the Channels page.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Performing Posts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Posts</CardTitle>
          <CardDescription>A breakdown of your most engaging content.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10 text-xs text-muted-foreground uppercase font-bold tracking-widest">
                  <th className="pb-4 font-bold">Post</th>
                  <th className="pb-4 font-bold">Platform</th>
                  <th className="pb-4 font-bold text-right">Reach</th>
                  <th className="pb-4 font-bold text-right">Engagement</th>
                  <th className="pb-4 font-bold text-right">Rate</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={5} className="py-3"><div className="h-8 bg-white/5 rounded w-full animate-pulse" /></td>
                    </tr>
                  ))
                ) : data && data.topPosts.length > 0 ? (
                  data.topPosts.map((post) => (
                    <tr key={post.id} className="border-b border-white/5">
                      <td className="py-3 pr-4">
                        <p className="text-white truncate max-w-[250px]">{post.content}</p>
                      </td>
                      <td className="py-3 pr-4 capitalize">{post.platform}</td>
                      <td className="py-3 text-right">{post.reach}</td>
                      <td className="py-3 text-right">{post.engagement}</td>
                      <td className="py-3 text-right font-medium">{post.rate}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-muted-foreground italic">
                      No published posts found to analyze performance.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
