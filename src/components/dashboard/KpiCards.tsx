import { memo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface KpiCardProps {
  title: string
  value: string
  change: string
  trend: 'up' | 'down'
  icon: React.ReactNode
  accent: string
}

function KpiCard({ title, value, change, trend, icon, accent }: KpiCardProps) {
  return (
    <Card className="relative overflow-hidden group hover:border-white/20 transition-colors">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</span>
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            accent
          )}>
            {icon}
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-3xl font-bold tracking-tight text-white">{value}</span>
          <span className={cn(
            "flex items-center gap-1 text-xs font-semibold",
            trend === 'up' ? 'text-green-400' : 'text-red-400'
          )}>
            {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {change}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

interface KpiCardsProps {
  totalFollowers: number
  totalEngagement: number
  totalImpressions: number
  totalPosts: number
  followerGrowth: number
  engagementGrowth: number
  impressionGrowth: number
  postGrowth: number
}

export const KpiCards = memo(function KpiCards({
  totalFollowers,
  totalEngagement,
  totalImpressions,
  totalPosts,
  followerGrowth,
  engagementGrowth,
  impressionGrowth,
  postGrowth,
}: KpiCardsProps) {
  const formatNumber = (n: number) => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
    return n.toLocaleString()
  }

  const cards = [
    {
      title: 'Total Followers',
      value: formatNumber(totalFollowers),
      change: `${followerGrowth >= 0 ? '+' : ''}${followerGrowth.toFixed(1)}%`,
      trend: followerGrowth >= 0 ? 'up' : 'down' as const,
      icon: (
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      accent: 'bg-blue-500/20 text-blue-400',
    },
    {
      title: 'Engagement',
      value: formatNumber(totalEngagement),
      change: `${engagementGrowth >= 0 ? '+' : ''}${engagementGrowth.toFixed(1)}%`,
      trend: engagementGrowth >= 0 ? 'up' : 'down' as const,
      icon: (
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
        </svg>
      ),
      accent: 'bg-purple-500/20 text-purple-400',
    },
    {
      title: 'Impressions',
      value: formatNumber(totalImpressions),
      change: `${impressionGrowth >= 0 ? '+' : ''}${impressionGrowth.toFixed(1)}%`,
      trend: impressionGrowth >= 0 ? 'up' : 'down' as const,
      icon: (
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      accent: 'bg-green-500/20 text-green-400',
    },
    {
      title: 'Total Posts',
      value: formatNumber(totalPosts),
      change: `${postGrowth >= 0 ? '+' : ''}${postGrowth.toFixed(1)}%`,
      trend: postGrowth >= 0 ? 'up' : 'down' as const,
      icon: (
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      ),
      accent: 'bg-orange-500/20 text-orange-400',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <KpiCard key={card.title} {...card} />
      ))}
    </div>
  )
})
