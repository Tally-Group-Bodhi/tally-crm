"use client";

import React from "react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/Card/Card";
import Badge from "@/components/Badge/Badge";
import Button from "@/components/Button/Button";
import Progress from "@/components/Progress/Progress";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { dataVisualizationColors } from "@/lib/tokens/colors";
import { mockCases } from "@/lib/mock-data/cases";
import { mockOpportunities, formatCurrency } from "@/lib/mock-data/pipeline";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { PipelineStage, CaseType } from "@/types/crm";

const CHART_COLORS = [
  dataVisualizationColors.dataASolid.hex,
  dataVisualizationColors.dataBSolid.hex,
  dataVisualizationColors.dataCSolid.hex,
  dataVisualizationColors.dataDSolid.hex,
  dataVisualizationColors.dataESolid.hex,
  dataVisualizationColors.dataFSolid.hex,
];

// ── Computed dashboard data ─────────────────────────────────────────────────

const openCases = mockCases.filter(
  (c) => c.status !== "Closed" && c.status !== "Resolved"
);
const breachedCases = mockCases.filter((c) => c.slaStatus === "Breached");
const atRiskCases = mockCases.filter((c) => c.slaStatus === "At Risk");
const resolvedCases = mockCases.filter(
  (c) => c.status === "Resolved" || c.status === "Closed"
);

const slaCompliance =
  mockCases.length > 0
    ? Math.round(
        ((mockCases.length - breachedCases.length) / mockCases.length) * 100
      )
    : 100;

const activeOpps = mockOpportunities.filter(
  (o) => o.stage !== "Closed Won" && o.stage !== "Closed Lost"
);
const totalPipelineValue = activeOpps.reduce((sum, o) => sum + o.value, 0);

// Cases by type
const casesByType: { name: string; count: number }[] = (
  ["Complaint", "Enquiry", "EWR", "Onboarding", "Dunning"] as CaseType[]
).map((type) => ({
  name: type,
  count: mockCases.filter((c) => c.type === type).length,
}));

// Pipeline by stage
const pipelineByStage: { name: string; value: number; count: number }[] = (
  [
    "Leads",
    "Qualification",
    "Proposal",
    "Negotiation",
    "Closed Won",
    "Closed Lost",
  ] as PipelineStage[]
).map((stage) => {
  const opps = mockOpportunities.filter((o) => o.stage === stage);
  return {
    name: stage,
    value: opps.reduce((sum, o) => sum + o.value, 0),
    count: opps.length,
  };
});

// SLA distribution (pie chart)
const slaDistribution = [
  {
    name: "On Track",
    value: mockCases.filter((c) => c.slaStatus === "On Track").length,
    color: "#008000",
  },
  {
    name: "At Risk",
    value: mockCases.filter((c) => c.slaStatus === "At Risk").length,
    color: "#C53B00",
  },
  {
    name: "Breached",
    value: mockCases.filter((c) => c.slaStatus === "Breached").length,
    color: "#C40000",
  },
];

// Team workload
const teamWorkload = [
  {
    name: "Priya Sharma",
    cases: mockCases.filter((c) => c.owner === "Priya Sharma").length,
  },
  {
    name: "Daniel Cooper",
    cases: mockCases.filter((c) => c.owner === "Daniel Cooper").length,
  },
  {
    name: "Unassigned",
    cases: mockCases.filter((c) => c.owner === "Unassigned").length,
  },
];

// Recent activity (last 8 activities across all cases)
const recentActivity = mockCases
  .flatMap((c) =>
    c.activities.map((a) => ({
      ...a,
      caseNumber: c.caseNumber,
      caseId: c.id,
    }))
  )
  .sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
  .slice(0, 8);

// ── KPI Card (matching Glass pattern exactly) ──────────────────────────

function KPICard({
  title,
  value,
  change,
  changeType,
  icon,
}: {
  title: string;
  value: string | number;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  icon: string;
}) {
  return (
    <Card className="shadow-none">
      <CardContent className="p-density-xl pt-density-xl">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p
              className="font-medium text-muted-foreground"
              style={{ fontSize: "var(--tally-font-size-sm)" }}
            >
              {title}
            </p>
            <p
              className="mt-density-sm font-bold leading-tight text-gray-900 dark:text-gray-100"
              style={{ fontSize: "var(--tally-font-size-3xl)" }}
            >
              {value}
            </p>
            <div className="mt-density-sm flex items-center gap-density-xs">
              <Icon
                name={
                  changeType === "positive"
                    ? "trending_up"
                    : changeType === "negative"
                      ? "trending_down"
                      : "trending_flat"
                }
                size="var(--tally-icon-size-sm)"
                className={
                  changeType === "positive"
                    ? "text-green-600 dark:text-green-400"
                    : changeType === "negative"
                      ? "text-red-600 dark:text-red-400"
                      : "text-gray-500 dark:text-gray-400"
                }
              />
              <span
                className={`font-medium ${
                  changeType === "positive"
                    ? "text-green-600 dark:text-green-400"
                    : changeType === "negative"
                      ? "text-red-600 dark:text-red-400"
                      : "text-muted-foreground"
                }`}
                style={{ fontSize: "var(--tally-font-size-xs)" }}
              >
                {change}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center justify-center rounded-density-md bg-[#2C365D]/10 p-density-md dark:bg-[#7c8cb8]/20">
            <Icon
              name={icon}
              size="var(--tally-icon-size-lg)"
              className="text-[#2C365D] dark:text-[#7c8cb8]"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CRMDashboardPage() {
  return (
    <div className="min-w-0 flex-1 overflow-y-auto">
    <div className="mx-auto max-w-[1600px] p-density-xl">
      {/* Page header */}
      <div className="mb-density-xl flex items-center justify-between">
        <div>
          <h1
            className="font-bold text-gray-900 dark:text-gray-100"
            style={{ fontSize: "var(--tally-font-size-3xl)", lineHeight: "var(--tally-line-height-tight)" }}
          >
            CRM Dashboard
          </h1>
          <p
            className="mt-density-xs text-muted-foreground"
            style={{ fontSize: "var(--tally-font-size-sm)" }}
          >
            Cases, SLA performance, pipeline, and team metrics
          </p>
        </div>
        <div className="flex items-center gap-density-sm">
          <Button size="md" className="gap-1.5">
            <Icon name="download" size="var(--tally-icon-size-sm)" className="mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mb-density-xl grid grid-cols-1 gap-density-lg sm:grid-cols-2 xl:grid-cols-4">
        <KPICard
          title="Open Cases"
          value={openCases.length}
          change={`${breachedCases.length} breached, ${atRiskCases.length} at risk`}
          changeType={breachedCases.length > 0 ? "negative" : "neutral"}
          icon="inbox"
        />
        <KPICard
          title="SLA Compliance"
          value={`${slaCompliance}%`}
          change={slaCompliance >= 90 ? "Good performance" : "Needs attention"}
          changeType={slaCompliance >= 90 ? "positive" : "negative"}
          icon="timer"
        />
        <KPICard
          title="Pipeline Value"
          value={formatCurrency(totalPipelineValue)}
          change={`${activeOpps.length} active opportunities`}
          changeType="positive"
          icon="trending_up"
        />
        <KPICard
          title="Resolved Cases"
          value={resolvedCases.length}
          change="This period"
          changeType="positive"
          icon="task_alt"
        />
      </div>

      {/* Charts row */}
      <div className="mb-density-lg grid grid-cols-1 gap-density-lg lg:grid-cols-3">
        {/* Cases by Type */}
        <Card className="shadow-none lg:col-span-1">
          <CardHeader>
            <CardTitle>Cases by Type</CardTitle>
            <CardDescription>Open and resolved case breakdown</CardDescription>
          </CardHeader>
          <div className="px-density-xl pb-density-xl">
            <div style={{ height: "220px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={casesByType} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    width={90}
                  />
                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 8,
                      border: "1px solid #E5E7EB",
                    }}
                  />
                  <Bar dataKey="count" fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* SLA Performance */}
        <Card className="shadow-none lg:col-span-1">
          <CardHeader>
            <CardTitle>SLA Performance</CardTitle>
            <CardDescription>Distribution by SLA status</CardDescription>
          </CardHeader>
          <div className="px-density-xl pb-density-xl">
            <div className="flex items-center justify-center" style={{ height: "220px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={slaDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name} (${value})`}
                    labelLine={false}
                  >
                    {slaDistribution.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 8,
                      border: "1px solid #E5E7EB",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="mt-density-sm flex items-center justify-center gap-density-lg">
              {slaDistribution.map((item) => (
                <div key={item.name} className="flex items-center gap-density-xs">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-muted-foreground" style={{ fontSize: "var(--tally-font-size-xs)" }}>
                    {item.name}
                  </span>
                  <span
                    className="font-medium text-gray-900 dark:text-gray-100"
                    style={{ fontSize: "var(--tally-font-size-xs)" }}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Pipeline by Stage */}
        <Card className="shadow-none lg:col-span-1">
          <CardHeader>
            <CardTitle>Pipeline by Stage</CardTitle>
            <CardDescription>Opportunity value by stage</CardDescription>
          </CardHeader>
          <div className="px-density-xl pb-density-xl">
            <div style={{ height: "220px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineByStage}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 9 }}
                    angle={-20}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 8,
                      border: "1px solid #E5E7EB",
                    }}
                    formatter={(value) => [
                      formatCurrency(value as number),
                      "Value",
                    ]}
                  />
                  <Bar dataKey="value" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      </div>

      {/* Bottom row: Team workload + Recent activity */}
      <div className="grid grid-cols-1 gap-density-lg lg:grid-cols-2">
        {/* Team Workload */}
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Team Workload</CardTitle>
            <CardDescription>Case distribution by team member</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-density-md">
              {teamWorkload.map((member) => (
                <div key={member.name}>
                  <div className="mb-density-xs flex items-center justify-between">
                    <span
                      className="font-medium text-gray-900 dark:text-gray-100"
                      style={{ fontSize: "var(--tally-font-size-sm)" }}
                    >
                      {member.name}
                    </span>
                    <span
                      className="text-muted-foreground"
                      style={{ fontSize: "var(--tally-font-size-xs)" }}
                    >
                      {member.cases} cases
                    </span>
                  </div>
                  <Progress
                    value={
                      (member.cases / Math.max(...teamWorkload.map((m) => m.cases), 1)) *
                      100
                    }
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="shadow-none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest case updates</CardDescription>
              </div>
              <Link
                href="/crm/cases"
                className="inline-flex items-center font-medium text-[#2C365D] hover:underline dark:text-[#7c8cb8]"
                style={{ fontSize: "var(--tally-font-size-sm)" }}
              >
                View All
                <Icon name="chevron_right" size="var(--tally-icon-size-sm)" className="ml-1" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border dark:divide-gray-700">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-density-md py-density-md"
                >
                  <div
                    className="mt-0.5 flex shrink-0 items-center justify-center rounded-density-sm bg-[#2C365D]/10 p-density-xs dark:bg-[#7c8cb8]/20"
                  >
                    <Icon
                      name={
                        activity.type === "Email Received"
                          ? "inbox"
                          : activity.type === "Email Sent"
                            ? "send"
                            : activity.type === "Status Change"
                              ? "swap_horiz"
                              : activity.type === "Created"
                                ? "add_circle"
                                : activity.type === "SLA Update"
                                  ? "timer"
                                  : "info"
                      }
                      size="var(--tally-icon-size-md)"
                      className="text-[#2C365D] dark:text-[#7c8cb8]"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className="font-medium text-gray-900 dark:text-gray-100"
                      style={{ fontSize: "var(--tally-font-size-sm)" }}
                    >
                      {activity.description}
                    </p>
                    <p
                      className="mt-density-xs text-muted-foreground"
                      style={{ fontSize: "var(--tally-font-size-xs)" }}
                    >
                      <Link
                        href={`/crm/cases/${activity.caseId}`}
                        className="font-medium text-[#2C365D] hover:underline dark:text-[#7c8cb8]"
                      >
                        {activity.caseNumber}
                      </Link>{" "}
                      · {activity.user} · {activity.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </div>
  );
}
