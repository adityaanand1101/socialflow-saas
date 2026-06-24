import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Plus, AlertCircle, RefreshCw } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { KpiCards } from '@/components/dashboard/KpiCards'
import { UpcomingPosts } from '@/components/dashboard/UpcomingPosts'
import { ChannelHealth } from '@/components/dashboard/ChannelHealth'
import { GrowthTrendChart } from '@/components/dashboard/GrowthTrendChart'
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const Dashboard = () => {
  const navigate = useNavigate()
  const { channels, posts, loading } = useStore()

  const kpiData = useMemo(() => {
    const totalFollowers = channels.reduce((sum, c) => sum + c.followers, 0)
    const totalEngagement = channels.reduce((sum, c) => sum + Math.round(c.followers * (c.engagementRate / 100)), 0)
    const totalImpressions = channels.reduce((sum, c) => sum + Math.round(c.followers * ((c.engagementRate / 100) * 3)), 0)
    const totalPosts = posts.length

    return {
      totalFollowers,
      totalEngagement,
      totalImpressions,
      totalPosts,
      followerGrowth: channels.length > 0 ? 2.4 : 0,
      engagementGrowth: channels.length > 0 ? 1.8 : 0,
      impressionGrowth: channels.length > 0 ? 3.2 : 0,
      postGrowth: posts.filter(p => p.status === 'published').length > 0 ? 5.1 : 0,
    }
  }, [channels, posts])

  const chartData = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 12 }, (_, i) => {
      const monthIdx = (now.getMonth() - 11 + i + 12) % 12
      const followers = channels.reduce((sum, c) => sum + Math.round(c.followers * (0.85 + Math.random() * 0.3)), 0)
      const engagement = channels.reduce((sum, c) => sum + Math.round(c.followers * (c.engagementRate / 100) * (0.8 + Math.random() * 0.4)), 0)
      const reach = channels.reduce((sum, c) => sum + Math.round(c.followers * (2 + Math.random() * 3)), 0)
      return { month: MONTHS[monthIdx], followers, engagement, reach }
    })
  }, [channels])

  if (loading) {
    return (
      <div className="space-y-8 pb-10">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-1">Loading your data...</p>
        </div>
        <DashboardSkeleton />
      </div>
    )
  }

  if (!loading && channels.length === 0 && posts.length === 0) {
    return (
      <div className="space-y-8 pb-10">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening across your social channels.</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">No Data Yet</h2>
            <p className="text-muted-foreground text-sm mb-6 text-center max-w-md">
              Connect your social media accounts and create your first post to see dashboard insights.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate('/app/channels')} aria-label="Connect social channels">
                <RefreshCw className="w-4 h-4 mr-2" />
                Connect Channels
              </Button>
              <Button onClick={() => navigate('/app/compose')} aria-label="Create your first post">
                <Plus className="w-4 h-4 mr-2" />
                Create Post
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening across your social channels.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2" onClick={() => navigate('/app/calendar')} aria-label="View calendar">
            <Calendar className="w-4 h-4" />
            View Calendar
          </Button>
          <Button className="gap-2" onClick={() => navigate('/app/compose')} aria-label="Create new post">
            <Plus className="w-4 h-4" />
            Create Post
          </Button>
        </div>
      </div>

      <KpiCards {...kpiData} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <UpcomingPosts posts={posts} />
        </div>
        <div>
          <ChannelHealth channels={channels} />
        </div>
      </div>

      <GrowthTrendChart data={chartData} />
    </div>
  )
}
