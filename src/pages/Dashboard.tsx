import { useNavigate } from 'react-router-dom'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  TrendingUp, Users, MessageSquare, Eye, 
  Calendar as CalendarIcon, Plus, Clock, CheckCircle2, AlertCircle, Zap
} from 'lucide-react'
import { Instagram, Linkedin, Twitter } from '@/components/icons'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

const STATUS_STYLES: Record<string, string> = {
  scheduled: 'bg-purple-500/20 border-purple-500/30 text-purple-400',
  draft: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400',
  published: 'bg-green-500/20 border-green-500/30 text-green-400',
  failed: 'bg-red-500/20 border-red-500/30 text-red-400',
}

const STATUS_ICONS: Record<string, React.ElementType> = {
  scheduled: Clock,
  draft: AlertCircle,
  published: CheckCircle2,
  failed: AlertCircle,
}

export const Dashboard = () => {
  const navigate = useNavigate()
  const { channels, posts } = useStore()

  const scheduledCount = posts.filter(p => p.status === 'scheduled').length
  const publishedCount = posts.filter(p => p.status === 'published').length
  const totalFollowers = channels.reduce((sum, c) => sum + c.followers, 0)
  const avgEngagement = channels.length > 0
    ? (channels.reduce((sum, c) => sum + c.engagementRate, 0) / channels.length).toFixed(1)
    : '0'

  const kpiStats = [
    { title: 'Total Followers', value: totalFollowers.toLocaleString(), change: '0%', icon: Users, color: 'text-blue-400', up: true },
    { title: 'Avg Engagement', value: `${avgEngagement}%`, change: '0%', icon: TrendingUp, color: 'text-purple-400', up: true },
    { title: 'Posts Scheduled', value: scheduledCount.toString(), change: `${scheduledCount} upcoming`, icon: CalendarIcon, color: 'text-pink-400', up: true },
    { title: 'Posts Published', value: publishedCount.toString(), change: 'this month', icon: Eye, color: 'text-orange-400', up: true },
  ]

  const upcomingPosts = posts
    .filter(p => p.status === 'scheduled')
    .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime())
    .slice(0, 5)

  // Empty trend data for now until we have real analytics
  const engagementTrend = [
    { name: 'Mon', engagement: 0, reach: 0 },
    { name: 'Tue', engagement: 0, reach: 0 },
    { name: 'Wed', engagement: 0, reach: 0 },
    { name: 'Thu', engagement: 0, reach: 0 },
    { name: 'Fri', engagement: 0, reach: 0 },
    { name: 'Sat', engagement: 0, reach: 0 },
    { name: 'Sun', engagement: 0, reach: 0 },
  ]

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening across your social channels.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2" onClick={() => navigate('/calendar')}>
            <CalendarIcon className="w-4 h-4" />
            View Calendar
          </Button>
          <Button className="gap-2" onClick={() => navigate('/compose')}>
            <Plus className="w-4 h-4" />
            Create Post
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiStats.map((stat, i) => (
          <Card key={i} className="hover:border-white/20 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {stat.title}
              </CardTitle>
              <stat.icon className={cn("w-4 h-4", stat.color)} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <p className={cn("text-xs mt-1", stat.up ? "text-green-400" : "text-red-400")}>
                {stat.change} <span className="text-muted-foreground ml-1">vs last period</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upcoming Posts */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Upcoming Posts</CardTitle>
                <CardDescription>Your next scheduled content across all platforms.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/calendar')}>View Calendar</Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingPosts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <Zap className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-white font-medium">No scheduled posts yet</p>
                  <p className="text-muted-foreground text-sm mt-1">Create and schedule your first post</p>
                  <Button className="mt-4 gap-2" onClick={() => navigate('/compose')}>
                    <Plus className="w-4 h-4" /> Create Post
                  </Button>
                </div>
              ) : upcomingPosts.map((post) => {
                const StatusIcon = STATUS_ICONS[post.status] || Clock
                return (
                  <div key={post.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all group">
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-white/10">
                      {post.media[0] ? (
                        <img src={post.media[0]} alt="Post preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <MessageSquare className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{post.caption || 'Untitled post'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex -space-x-1">
                          {post.platforms.map((p) => (
                            <div key={p} className="w-4 h-4 rounded-full bg-navy-900 border border-[#0F1117] flex items-center justify-center">
                              {p === 'instagram' && <Instagram className="w-2.5 h-2.5 text-pink-400" />}
                              {p === 'linkedin' && <Linkedin className="w-2.5 h-2.5 text-blue-400" />}
                              {p === 'x' && <Twitter className="w-2.5 h-2.5 text-white" />}
                            </div>
                          ))}
                        </div>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                          {format(new Date(post.scheduledTime), 'MMM d, h:mm a')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={cn("px-2 py-0.5 rounded-full border text-[10px] font-bold flex items-center gap-1", STATUS_STYLES[post.status])}>
                        <StatusIcon className="w-3 h-3" />
                        {post.status.toUpperCase()}
                      </div>
                    </div>
                  </div>
                )
              })}
              <Button 
                variant="outline" 
                className="w-full border-dashed border-white/20 hover:border-white/40 bg-transparent text-muted-foreground"
                onClick={() => navigate('/compose')}
              >
                + Add New Content
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Channel Health */}
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Channel Health</CardTitle>
              <CardDescription>Performance metrics per platform.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {channels.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-sm">No channels connected</p>
                  <Button variant="outline" className="mt-3" size="sm" onClick={() => navigate('/channels')}>
                    Connect Channels
                  </Button>
                </div>
              ) : channels.map((channel) => (
                <div key={channel.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 border border-white/10">
                        <AvatarImage src={channel.avatar} />
                        <AvatarFallback>{channel.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-white">{channel.name}</p>
                        <p className="text-xs text-muted-foreground">{channel.followers.toLocaleString()} followers</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-400">{channel.engagementRate}%</p>
                      <p className="text-[10px] text-muted-foreground uppercase">Engagement</p>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-primary rounded-full" style={{ width: `${Math.min(channel.engagementRate * 20, 100)}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Growth Trend Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Growth Trends</CardTitle>
            <CardDescription>Engagement and reach across the last 7 days.</CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#7C3AED]" />
              <span className="text-[10px] text-muted-foreground uppercase">Engagement</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#EC4899]" />
              <span className="text-[10px] text-muted-foreground uppercase">Reach</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={engagementTrend}>
                <defs>
                  <linearGradient id="gradEngagement" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradReach" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EC4899" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#EC4899" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} dy={10} />
                <YAxis hide />
                <Tooltip contentStyle={{ backgroundColor: '#141218', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                <Area type="monotone" dataKey="engagement" stroke="#7C3AED" strokeWidth={3} fill="url(#gradEngagement)" dot={{ r: 4, fill: '#7C3AED', strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                <Area type="monotone" dataKey="reach" stroke="#EC4899" strokeWidth={3} fill="url(#gradReach)" dot={{ r: 4, fill: '#EC4899', strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
