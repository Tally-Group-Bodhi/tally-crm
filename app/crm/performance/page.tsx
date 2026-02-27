import React from "react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/Card/Card";
import Badge from "@/components/Badge/Badge";
import Button from "@/components/Button/Button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/Table/Table";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

const SLA_TYPES = [
  {
    name: "Enquiry",
    desc: "General customer enquiries",
    responseTarget: "Immediate",
    resolutionTarget: "24h",
    performance: 96,
    performanceClass: "excellent" as const,
  },
  {
    name: "Meter Transfer",
    desc: "Meter transfer requests",
    responseTarget: "4h",
    resolutionTarget: "48h",
    performance: 88,
    performanceClass: "good" as const,
  },
  {
    name: "New Site Roll-in",
    desc: "New site onboarding",
    responseTarget: "24h",
    resolutionTarget: "5 business days",
    performance: 92,
    performanceClass: "excellent" as const,
  },
  {
    name: "Billing Query",
    desc: "Billing and payment queries",
    responseTarget: "4h",
    resolutionTarget: "24h",
    performance: 78,
    performanceClass: "warning" as const,
  },
];

const OVERDUE_ACTIONS = [
  { case: "CASE-2024-0891", type: "Response", owner: "John Smith", overdue: "2h" },
  { case: "CASE-2024-0887", type: "Resolution", owner: "Daniel Cooper", overdue: "1d" },
  { case: "CASE-2024-0882", type: "Response", owner: "Unassigned", overdue: "3h" },
];

const slaBarColor: Record<string, string> = {
  excellent: "#008000",
  good: "#0074C4",
  warning: "#C53B00",
  danger: "#C40000",
};

const slaCardBefore: Record<string, string> = {
  excellent: "before:bg-[#008000]",
  good: "before:bg-[#0074C4]",
  warning: "before:bg-[#C53B00]",
  danger: "before:bg-[#C40000]",
};

const perfValueColor: Record<string, string> = {
  excellent: "text-[#008000]",
  good: "text-[#0074C4]",
  warning: "text-[#C53B00]",
  danger: "text-[#C40000]",
};

export default function PerformancePage() {
  return (
    <div className="min-w-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-[1600px] p-density-xl">
        <div className="mb-density-xl flex items-center justify-between">
          <div>
            <h1
              className="font-bold text-gray-900 dark:text-gray-100"
              style={{
                fontSize: "var(--tally-font-size-3xl)",
                lineHeight: "var(--tally-line-height-tight)",
              }}
            >
              Performance &amp; SLA Management
            </h1>
            <p
              className="mt-density-xs text-muted-foreground"
              style={{ fontSize: "var(--tally-font-size-sm)" }}
            >
              Monitor SLA compliance and overdue actions
            </p>
          </div>
          <div className="flex items-center gap-density-md">
            <div className="relative min-w-[160px]">
              <select
                className="w-full cursor-pointer appearance-none rounded-density-md border border-border bg-white py-1.5 px-3 pr-9 outline-none focus:border-[#2C365D] focus:ring-1 focus:ring-[#2C365D] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                style={{ fontSize: "var(--tally-font-size-sm)" }}
              >
                <option>Last 30 days</option>
                <option>Last 7 days</option>
                <option>Last 90 days</option>
              </select>
              <Icon name="expand_more" size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>
            <Button size="md" className="gap-1.5">
              <Icon name="download" size="var(--tally-icon-size-sm)" className="mr-1" />
              Export Report
            </Button>
          </div>
        </div>

        {/* SLA Overview cards */}
        <div className="mb-density-xl grid grid-cols-1 gap-density-lg sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "First Response SLA", value: "94.2%", sub: "Target: 90%", trend: "+2.4%", trendUp: true, icon: "timer", barClass: "excellent", iconBg: "bg-[#008000]/10 dark:bg-[#008000]/20", iconColor: "text-[#008000] dark:text-green-400" },
            { label: "Resolution SLA", value: "88.5%", sub: "Target: 85%", trend: "+1.8%", trendUp: true, icon: "check_circle", barClass: "good", iconBg: "bg-[#0074C4]/10 dark:bg-[#0074C4]/20", iconColor: "text-[#0074C4] dark:text-blue-400" },
            { label: "Customer Satisfaction", value: "76.3%", sub: "Target: 80%", trend: "-1.2%", trendUp: false, icon: "sentiment_satisfied", barClass: "warning", iconBg: "bg-[#C53B00]/10 dark:bg-[#C53B00]/20", iconColor: "text-[#C53B00] dark:text-orange-400" },
            { label: "SLA Breaches", value: "3", sub: "Response/Resolution", trend: "+1", trendUp: false, icon: "warning", barClass: "danger", iconBg: "bg-[#C40000]/10 dark:bg-[#C40000]/20", iconColor: "text-[#C40000] dark:text-red-400" },
          ].map((card) => (
            <Card
              key={card.label}
              className={cn(
                "relative overflow-hidden shadow-none before:absolute before:left-0 before:right-0 before:top-0 before:h-[3px] before:content-['']",
                slaCardBefore[card.barClass]
              )}
            >
              <CardContent className="p-density-xl pt-density-xl">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p
                      className="font-medium text-muted-foreground"
                      style={{ fontSize: "var(--tally-font-size-sm)" }}
                    >
                      {card.label}
                    </p>
                    <p
                      className="mt-density-sm font-bold leading-tight text-gray-900 dark:text-gray-100"
                      style={{ fontSize: "var(--tally-font-size-3xl)" }}
                    >
                      {card.value}
                    </p>
                    <div className="mt-density-sm flex items-center gap-density-xs">
                      <Icon
                        name={card.trendUp ? "trending_up" : "trending_down"}
                        size="var(--tally-icon-size-sm)"
                        className={card.trendUp ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}
                      />
                      <span
                        className={cn(
                          "font-medium",
                          card.trendUp ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                        )}
                        style={{ fontSize: "var(--tally-font-size-xs)" }}
                      >
                        {card.trend}
                      </span>
                      <span
                        className="text-muted-foreground"
                        style={{ fontSize: "var(--tally-font-size-xs)" }}
                      >
                        · {card.sub}
                      </span>
                    </div>
                  </div>
                  <div className={cn("flex shrink-0 items-center justify-center rounded-density-md p-density-md", card.iconBg)}>
                    <Icon name={card.icon} size="var(--tally-icon-size-lg)" className={card.iconColor} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts grid */}
        <div className="grid grid-cols-1 gap-density-lg lg:grid-cols-[2fr_1fr]">
          {/* SLA Performance by Request Type */}
          <Card className="shadow-none">
            <CardHeader className="p-density-lg pb-0">
              <CardTitle
                className="uppercase tracking-wider text-gray-900 dark:text-gray-100"
                style={{ fontSize: "var(--tally-font-size-sm)" }}
              >
                SLA Performance by Request Type
              </CardTitle>
            </CardHeader>
            <CardContent className="p-density-lg pt-density-md">
              <Table>
                <TableHeader>
                  <TableRow className="border-border dark:border-gray-700">
                    <TableHead className="font-bold uppercase tracking-wider text-muted-foreground" style={{ fontSize: "var(--tally-font-size-xs)" }}>
                      Request Type
                    </TableHead>
                    <TableHead className="font-bold uppercase tracking-wider text-muted-foreground" style={{ fontSize: "var(--tally-font-size-xs)" }}>
                      Response Target
                    </TableHead>
                    <TableHead className="font-bold uppercase tracking-wider text-muted-foreground" style={{ fontSize: "var(--tally-font-size-xs)" }}>
                      Resolution Target
                    </TableHead>
                    <TableHead className="font-bold uppercase tracking-wider text-muted-foreground" style={{ fontSize: "var(--tally-font-size-xs)" }}>
                      Performance
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {SLA_TYPES.map((row) => (
                    <TableRow
                      key={row.name}
                      className="border-border dark:border-gray-700"
                    >
                      <TableCell className="text-gray-900 dark:text-gray-100">
                        <div className="font-medium">{row.name}</div>
                        <div
                          className="mt-density-xs text-muted-foreground"
                          style={{ fontSize: "var(--tally-font-size-xs)" }}
                        >
                          {row.desc}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-gray-900 dark:text-gray-100">
                        {row.responseTarget}
                      </TableCell>
                      <TableCell className="font-semibold text-gray-900 dark:text-gray-100">
                        {row.resolutionTarget}
                      </TableCell>
                      <TableCell className="text-gray-900 dark:text-gray-100">
                        <div className="flex items-center gap-density-md">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${row.performance}%`,
                                backgroundColor: slaBarColor[row.performanceClass],
                              }}
                            />
                          </div>
                          <span
                            className={cn(
                              "min-w-[36px] font-bold",
                              perfValueColor[row.performanceClass]
                            )}
                            style={{ fontSize: "var(--tally-font-size-xs)" }}
                          >
                            {row.performance}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Overdue Actions */}
          <Card className="shadow-none">
            <CardHeader className="p-density-lg pb-0">
              <CardTitle
                className="uppercase tracking-wider text-gray-900 dark:text-gray-100"
                style={{ fontSize: "var(--tally-font-size-sm)" }}
              >
                Overdue Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-density-lg pt-density-md">
              <Table>
                <TableHeader>
                  <TableRow className="border-border dark:border-gray-700">
                    <TableHead className="font-bold uppercase text-muted-foreground" style={{ fontSize: "var(--tally-font-size-xs)" }}>
                      Case
                    </TableHead>
                    <TableHead className="font-bold uppercase text-muted-foreground" style={{ fontSize: "var(--tally-font-size-xs)" }}>
                      Type
                    </TableHead>
                    <TableHead className="font-bold uppercase text-muted-foreground" style={{ fontSize: "var(--tally-font-size-xs)" }}>
                      Owner
                    </TableHead>
                    <TableHead className="font-bold uppercase text-muted-foreground" style={{ fontSize: "var(--tally-font-size-xs)" }}>
                      Overdue
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {OVERDUE_ACTIONS.map((row) => (
                    <TableRow
                      key={row.case}
                      className="border-border dark:border-gray-700"
                    >
                      <TableCell>
                        <Link
                          href={`/crm/cases/${row.case}`}
                          className="font-medium text-[#2C365D] no-underline hover:underline dark:text-[#7c8cb8]"
                        >
                          {row.case}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="error">{row.type}</Badge>
                      </TableCell>
                      <TableCell className="text-gray-900 dark:text-gray-100">
                        {row.owner}
                      </TableCell>
                      <TableCell className="text-gray-900 dark:text-gray-100">
                        {row.overdue}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-density-lg grid grid-cols-3 gap-density-md rounded-density-md bg-gray-50 p-density-lg dark:bg-gray-800">
                <div className="text-center">
                  <div
                    className="font-bold text-gray-900 dark:text-gray-100"
                    style={{ fontSize: "var(--tally-font-size-xl)" }}
                  >
                    12
                  </div>
                  <div
                    className="mt-density-xs text-muted-foreground"
                    style={{ fontSize: "var(--tally-font-size-xs)" }}
                  >
                    Overdue Responses
                  </div>
                </div>
                <div className="text-center">
                  <div
                    className="font-bold text-gray-900 dark:text-gray-100"
                    style={{ fontSize: "var(--tally-font-size-xl)" }}
                  >
                    6
                  </div>
                  <div
                    className="mt-density-xs text-muted-foreground"
                    style={{ fontSize: "var(--tally-font-size-xs)" }}
                  >
                    Overdue Resolutions
                  </div>
                </div>
                <div className="text-center">
                  <div
                    className="font-bold text-gray-900 dark:text-gray-100"
                    style={{ fontSize: "var(--tally-font-size-xl)" }}
                  >
                    18
                  </div>
                  <div
                    className="mt-density-xs text-muted-foreground"
                    style={{ fontSize: "var(--tally-font-size-xs)" }}
                  >
                    Total Overdue
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
