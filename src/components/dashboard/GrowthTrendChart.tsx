import { memo, useId } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface DataPoint {
  month: string
  followers: number
  engagement: number
  reach: number
}

interface GrowthTrendChartProps {
  data: DataPoint[]
}

const formatNumber = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return n.toString()
}

export const GrowthTrendChart = memo(function GrowthTrendChart({ data }: GrowthTrendChartProps) {
  const gradientId = useId().replace(/:/g, '')
  const engagementGradientId = `eng_${gradientId}`
  const reachGradientId = `reach_${gradientId}`

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Growth Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={engagementGradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id={reachGradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="month"
                stroke="rgba(255,255,255,0.3)"
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                tickLine={false}
              />
              <YAxis
                stroke="rgba(255,255,255,0.3)"
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                tickFormatter={formatNumber}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.8)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}
              />
              <Area
                type="monotone"
                dataKey="engagement"
                stroke="#8B5CF6"
                fill={`url(#${engagementGradientId})`}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="reach"
                stroke="#06B6D4"
                fill={`url(#${reachGradientId})`}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
})
