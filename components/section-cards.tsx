import { IconCalendar, IconClock, IconListCheck, IconTrendingUp } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function SectionCards() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-4 px-4 lg:px-6 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-all shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-2">
          <CardDescription className="text-xs font-medium">Total Meetings</CardDescription>
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <IconCalendar className="h-4 w-4" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
          128
        </CardTitle>
        <CardFooter className="p-0 pt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>+12% this month</span>
          <Badge variant="outline" className="text-[10px] text-primary bg-primary/10 border-primary/20">
            <IconTrendingUp className="h-3 w-3 mr-0.5" /> +12.5%
          </Badge>
        </CardFooter>
      </Card>

      <Card className="p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-all shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-2">
          <CardDescription className="text-xs font-medium">Total Duration</CardDescription>
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <IconClock className="h-4 w-4" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
          48h 30m
        </CardTitle>
        <CardFooter className="p-0 pt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>Across all channels</span>
          <Badge variant="outline" className="text-[10px] text-primary bg-primary/10 border-primary/20">
            Recorded
          </Badge>
        </CardFooter>
      </Card>

      <Card className="p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-all shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-2">
          <CardDescription className="text-xs font-medium">Action Items</CardDescription>
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <IconListCheck className="h-4 w-4" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
          342
        </CardTitle>
        <CardFooter className="p-0 pt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>88% completed</span>
          <Badge variant="outline" className="text-[10px] text-primary bg-primary/10 border-primary/20">
            <IconTrendingUp className="h-3 w-3 mr-0.5" /> High Sync
          </Badge>
        </CardFooter>
      </Card>

      <Card className="p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-all shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-2">
          <CardDescription className="text-xs font-medium">Productivity Rate</CardDescription>
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <IconTrendingUp className="h-4 w-4" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
          92.4%
        </CardTitle>
        <CardFooter className="p-0 pt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>Top percentile</span>
          <Badge variant="outline" className="text-[10px] text-primary bg-primary/10 border-primary/20">
            Optimal
          </Badge>
        </CardFooter>
      </Card>
    </div>
  )
}

