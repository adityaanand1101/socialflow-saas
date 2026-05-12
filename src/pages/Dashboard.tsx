import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Eye, 
  MoreVertical, 
  Calendar as CalendarIcon,
  Plus
} from 'lucide-react'
import { Instagram, Linkedin, Twitter } from '@/components/icons'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'

const data = [
  { name: 'Mon', engagement: 4000, reach: 2400 },
  { name: 'Tue', engagement: 3000, reach: 1398 },
  { name: 'Wed', engagement: 2000, reach: 9800 },
  { name: 'Thu', engagement: 2780, reach: 3908 },
  { name: 'Fri', engagement: 1890, reach: 4800 },
  { name: 'Sat', engagement: 2390, reach: 3800 },
  { name: 'Sun', engagement: 3490, reach: 4300 },
]

export const Dashboard = () => {
  const { channels, posts } = useStore()

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening across your social channels.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <CalendarIcon className="w-4 h-4" />
            Last 7 Days
          </Button>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Create Post
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Total Reach', value: '1.2M', change: '+12.5%', icon: Eye, color: 'text-blue-400' },
          { title: 'Engagement', value: '45.2K', change: '+8.2%', icon: TrendingUp, color: 'text-purple-400' },
          { title: 'New Followers', value: '2,840', change: '+15.3%', icon: Users, color: 'text-pink-400' },
          { title: 'Avg. CTR', value: '4.8%', change: '-2.1%', icon: MessageSquare, color: 'text-orange-400' },
        ].map((stat, i) => (
          <Card key={i} className="hover:border-white/20 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {stat.title}
              </CardTitle>
              <stat.icon className={cn("w-4 h-4", stat.color)} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <p className={cn(
                "text-xs mt-1",
                stat.change.startsWith('+') ? "text-green-400" : "text-red-400"
              )}>
                {stat.change} <span className="text-muted-foreground ml-1">vs last period</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upcoming Posts */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Upcoming Posts</CardTitle>
                <CardDescription>Your next scheduled content across all platforms.</CardDescription>
              </div>
              <Button variant="ghost" size="sm">View Calendar</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {posts.map((post) => (
                <div key={post.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all group">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0">
                    <img src={post.media[0]} alt="Post preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{post.caption}</p>
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
                        {new Date(post.scheduledTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-400 text-[10px] font-bold">
                      {post.status.toUpperCase()}
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full mt-4 border-dashed border-white/20 hover:border-white/40 bg-transparent text-muted-foreground">
                + Add New Content
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Channel Stats */}
        <div className="space-y-6">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Channel Health</CardTitle>
              <CardDescription>Performance metrics per platform.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {channels.map((channel) => (
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
                    <div 
                      className="h-full bg-gradient-primary rounded-full" 
                      style={{ width: `${channel.engagementRate * 20}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Analytics Mini View */}
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
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#141218', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="engagement" 
                  stroke="#7C3AED" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#7C3AED', strokeWidth: 0 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="reach" 
                  stroke="#EC4899" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#EC4899', strokeWidth: 0 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
