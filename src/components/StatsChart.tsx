import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import type { DailyStats } from '@/types';

interface StatsChartProps {
  data: DailyStats[];
  title: string;
  description?: string;
  dataKey: 'wpm' | 'accuracy' | 'sessions';
  color?: string;
}

const chartConfig = {
  wpm: {
    label: 'WPM',
    color: 'hsl(var(--chart-1))',
  },
  accuracy: {
    label: 'Accuracy %',
    color: 'hsl(var(--chart-2))',
  },
  sessions: {
    label: 'Sessions',
    color: 'hsl(var(--chart-3))',
  },
};

export default function StatsChart({ data, title, description, dataKey, color }: StatsChartProps) {
  const config = chartConfig[dataKey];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ChartContainer config={{ [dataKey]: config }} className="h-[300px] w-full">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color || config.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color || config.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
              className="text-xs"
            />
            <YAxis className="text-xs" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color || config.color}
              fill={`url(#gradient-${dataKey})`}
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
