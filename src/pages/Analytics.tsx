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
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Empty data for now until we have real analytics backend
const data: any[] = []

const COLORS = ['#E4405F', '#0A66C2', '#000000', '#FF0000']

const pieData: any[] = []

export const Analytics = () => {
  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-1">Deep dive into your social performance.</p>
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
        {[
          { label: 'Impressions', value: '0', growth: '0%', up: true },
          { label: 'Engagements', value: '0', growth: '0%', up: true },
          { label: 'Link Clicks', value: '0', growth: '0%', up: true },
          { label: 'Shares', value: '0', growth: '0%', up: true },
          { label: 'Net Followers', value: '0', growth: '0%', up: true },
        ].map((item, i) => (
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
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Engagement Over Time Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Engagement Over Time</CardTitle>
            <CardDescription>Multi-platform performance across the current period.</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            {data.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-white font-medium">No performance data yet</p>
                <p className="text-muted-foreground text-sm mt-1">Connect your accounts to see trends</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorInsta" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E4405F" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#E4405F" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip 
                     contentStyle={{ backgroundColor: '#141218', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                     itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="instagram" stroke="#E4405F" fillOpacity={1} fill="url(#colorInsta)" />
                  <Area type="monotone" dataKey="linkedin" stroke="#0A66C2" fillOpacity={0} />
                </AreaChart>
              </ResponsiveContainer>
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
            {pieData.length === 0 ? (
               <div className="text-center">
                  <p className="text-muted-foreground text-sm">No audience data available</p>
               </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-bold text-white">0%</span>
                  <span className="text-xs text-muted-foreground uppercase">Reach</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

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
                 <tr>
                    <td colSpan={5} className="py-12 text-center text-muted-foreground italic">
                       No published posts found to analyze performance.
                    </td>
                 </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
