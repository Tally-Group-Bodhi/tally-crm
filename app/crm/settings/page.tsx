"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
} from "@/components/Card/Card";
import Badge from "@/components/Badge/Badge";
import Button from "@/components/Button/Button";
import Input from "@/components/Input/Input";
import Select from "@/components/Select/Select";
import Switch from "@/components/Switch/Switch";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/Sheet/Sheet";
import { Icon } from "@/components/ui/icon";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/Table/Table";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/AlertDialog/AlertDialog";
import { cn } from "@/lib/utils";

const SETTINGS_TABS = [
  { key: "users", label: "Users", icon: "group" },
  { key: "roles", label: "Roles", icon: "admin_panel_settings" },
  { key: "permissions", label: "Permissions", icon: "lock" },
  { key: "opportunityStages", label: "Opportunity Stages", icon: "layers" },
  { key: "caseTypes", label: "Case Types", icon: "sell" },
  { key: "slaPolicies", label: "SLA Policies", icon: "timer" },
  { key: "businessHours", label: "Business Hours", icon: "work_history" },
  { key: "templates", label: "Email Templates", icon: "drafts" },
  { key: "inboxes", label: "Inboxes", icon: "inbox" },
  { key: "audit", label: "Audit Log", icon: "history" },
  { key: "general", label: "General", icon: "tune" },
];

const USERS_DATA = [
  { id: "1", name: "Sarah Mitchell", email: "sarah.mitchell@tally.com", initials: "SM", role: "sales-manager", roleLabel: "Sales Manager", team: "Sales", status: "active", lastActive: "Today, 10:14 AM", showDelete: false },
  { id: "2", name: "John Davis", email: "john.davis@tally.com", initials: "JD", role: "sales-rep", roleLabel: "Sales Rep", team: "Sales", status: "active", lastActive: "Yesterday, 4:30 PM", showDelete: false },
  { id: "3", name: "Lisa Chen", email: "lisa.chen@tally.com", initials: "LC", role: "ops-supervisor", roleLabel: "Ops Supervisor", team: "Operations", status: "pending", lastActive: "Dec 8, 2024", showDelete: false },
  { id: "4", name: "Alex Morgan", email: "alex.morgan@tally.com", initials: "AM", role: "admin", roleLabel: "Administrator", team: "Admin", status: "inactive", lastActive: "Nov 30, 2024", showDelete: true },
];

const ROLES_DATA = [
  { name: "Administrator", count: 2, description: "Full system access, configuration, and audit privileges.", badges: [{ label: "All Access", active: true }, { label: "Audit", active: true }, { label: "RBAC", active: true }] },
  { name: "Sales Manager", count: 4, description: "Manage sales pipeline, approve contracts, oversee team performance.", badges: [{ label: "Opportunities", active: true }, { label: "Contracts", active: true }, { label: "Reports", active: false }] },
  { name: "Ops Supervisor", count: 3, description: "Manage case triage, SLA policies, and escalation workflows.", badges: [{ label: "Cases", active: true }, { label: "SLA", active: true }, { label: "Audit", active: false }] },
  { name: "Sales Rep", count: 12, description: "Manage assigned opportunities and activity logs.", badges: [{ label: "Opportunities", active: true }, { label: "Activities", active: false }, { label: "Documents", active: false }] },
];

const PERMISSIONS_MATRIX = [
  { resource: "Cases", admin: "check", manager: "check", agent: "check", viewer: "visibility" },
  { resource: "Opportunities", admin: "check", manager: "check", agent: "check", viewer: "visibility" },
  { resource: "Contracts", admin: "check", manager: "check", agent: "remove", viewer: "visibility" },
  { resource: "Admin", admin: "check", manager: "remove", agent: "close", viewer: "close" },
];

type SLARuleType = "regulatory" | "internal";
type SLARuleStatus = "active" | "inactive";

interface SLARule {
  id: number;
  name: string;
  caseType: string;
  reason: string;
  duration: string;
  warning: string;
  type: SLARuleType;
  status: SLARuleStatus;
}

const SLA_RULES_DATA: SLARule[] = [
  { id: 1, name: "Complaint — Resolution", caseType: "Complaint", reason: "All", duration: "20 business days", warning: "75%", type: "regulatory", status: "active" },
  { id: 2, name: "Complaint — Acknowledgement", caseType: "Complaint", reason: "All", duration: "2 business days", warning: "75%", type: "regulatory", status: "active" },
  { id: 3, name: "Life Support — Acknowledgement", caseType: "Life Support", reason: "All", duration: "1 business day", warning: "60%", type: "regulatory", status: "active" },
  { id: 4, name: "General Enquiry — Resolution", caseType: "General Enquiry", reason: "All", duration: "5 business days", warning: "80%", type: "internal", status: "active" },
  { id: 5, name: "EWR — Initial Response", caseType: "EWR", reason: "All", duration: "4 business hours", warning: "70%", type: "internal", status: "active" },
  { id: 6, name: "General Enquiry — Acknowledgement", caseType: "General Enquiry", reason: "All", duration: "4 business hours", warning: "75%", type: "internal", status: "active" },
  { id: 7, name: "Billing Dispute — Resolution", caseType: "General Enquiry", reason: "Billing dispute", duration: "10 business days", warning: "75%", type: "internal", status: "inactive" },
];

const CASE_TYPES = ["Complaint", "General Enquiry", "EWR", "Life Support", "Service Order"];
const CONTACT_REASONS = ["All contact reasons", "Billing dispute", "Meter fault", "New connection", "Supply interruption", "Contract query"];
const DURATION_UNITS = ["business days", "calendar days", "business hours"];
const ESCALATE_OPTIONS = ["No escalation", "Team Leader", "Manager", "Compliance Officer"];

function RoleBadge({ role, label }: { role: string; label?: string }) {
  const config: Record<string, "default" | "info" | "warning"> = {
    admin: "default",
    "sales-rep": "info",
    "sales-manager": "info",
    "ops-supervisor": "warning",
  };
  const variant = config[role] ?? "default";
  return <Badge variant={variant}>{label ?? role}</Badge>;
}

function StatusDot({ status }: { status: "active" | "inactive" | "pending" }) {
  const color =
    status === "active"
      ? "bg-[#008000]"
      : status === "inactive"
        ? "bg-[#C40000]"
        : "bg-[#C53B00]";
  return <span className={cn("mr-1.5 inline-block h-2 w-2 rounded-full", color)} />;
}

function SectionHeader({
  title,
  description,
  action,
  borderless,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  borderless?: boolean;
}) {
  return (
    <div className={cn("flex items-center justify-between p-density-lg", !borderless && "border-b border-border dark:border-gray-700")}>
      <div>
        <h3
          className="font-bold uppercase tracking-wider text-gray-900 dark:text-gray-100"
          style={{ fontSize: "var(--tally-font-size-sm)" }}
        >
          {title}
        </h3>
        <p
          className="mt-density-xs text-muted-foreground"
          style={{ fontSize: "var(--tally-font-size-xs)" }}
        >
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}

const defaultSLAForm = {
  ruleName: "",
  caseClass: "",
  contactReason: "",
  duration: 20,
  durationUnit: "business days",
  warningThreshold: 75,
  pauseOnHold: true,
  businessHoursOnly: true,
  resetOnReassign: false,
  escalateTo: "",
  escalateAt: 90,
  active: true,
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("users");
  const [slaRules, setSlaRules] = useState<SLARule[]>(SLA_RULES_DATA);
  const [slaFilterTab, setSlaFilterTab] = useState<"all" | "regulatory" | "internal" | "inactive">("all");
  const [slaSearch, setSlaSearch] = useState("");
  const [slaCaseTypeFilter, setSlaCaseTypeFilter] = useState("");
  const [slaSheetOpen, setSlaSheetOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<number | null>(null);
  const [slaForm, setSlaForm] = useState(defaultSLAForm);
  const [slaToast, setSlaToast] = useState({ show: false, message: "" });
  const [slaRuleToDelete, setSlaRuleToDelete] = useState<number | null>(null);

  const showSlaToast = (message: string) => {
    setSlaToast({ show: true, message });
    setTimeout(() => setSlaToast({ show: false, message: "" }), 3000);
  };

  const filteredSlaRules = useMemo(() => {
    let list = [...slaRules];
    if (slaFilterTab === "regulatory") list = list.filter((r) => r.type === "regulatory");
    else if (slaFilterTab === "internal") list = list.filter((r) => r.type === "internal");
    else if (slaFilterTab === "inactive") list = list.filter((r) => r.status === "inactive");
    if (slaSearch) {
      const s = slaSearch.toLowerCase();
      list = list.filter((r) => r.name.toLowerCase().includes(s) || r.caseType.toLowerCase().includes(s));
    }
    if (slaCaseTypeFilter) list = list.filter((r) => r.caseType === slaCaseTypeFilter);
    return list;
  }, [slaRules, slaFilterTab, slaSearch, slaCaseTypeFilter]);

  const slaCounts = useMemo(() => ({
    all: slaRules.length,
    regulatory: slaRules.filter((r) => r.type === "regulatory").length,
    internal: slaRules.filter((r) => r.type === "internal").length,
    inactive: slaRules.filter((r) => r.status === "inactive").length,
  }), [slaRules]);

  const openSlaPanel = (mode: "new" | "edit", id?: number) => {
    if (mode === "edit" && id) {
      const rule = slaRules.find((r) => r.id === id);
      if (rule) {
        setEditingRuleId(id);
        setSlaForm({
          ruleName: rule.name,
          caseClass: rule.caseType,
          contactReason: rule.reason === "All" ? "" : rule.reason,
          duration: parseInt(rule.duration, 10) || 20,
          durationUnit: rule.duration.includes("hours") ? "business hours" : rule.duration.includes("calendar") ? "calendar days" : "business days",
          warningThreshold: parseInt(rule.warning.replace("%", ""), 10) || 75,
          pauseOnHold: true,
          businessHoursOnly: true,
          resetOnReassign: false,
          escalateTo: "",
          escalateAt: 90,
          active: rule.status === "active",
        });
      }
    } else {
      setEditingRuleId(null);
      setSlaForm(defaultSLAForm);
    }
    setSlaSheetOpen(true);
  };

  const closeSlaPanel = () => {
    setSlaSheetOpen(false);
    setEditingRuleId(null);
  };

  const saveSlaRule = () => {
    if (!slaForm.ruleName.trim()) return;
    if (editingRuleId) {
      setSlaRules((prev) =>
        prev.map((r) =>
          r.id === editingRuleId
            ? {
                ...r,
                name: slaForm.ruleName,
                caseType: slaForm.caseClass,
                reason: slaForm.contactReason || "All",
                duration: `${slaForm.duration} ${slaForm.durationUnit}`,
                warning: `${slaForm.warningThreshold}%`,
                status: slaForm.active ? "active" : "inactive",
              }
            : r
        )
      );
      showSlaToast("SLA rule updated");
    } else {
      setSlaRules((prev) => [
        ...prev,
        {
          id: Date.now(),
          name: slaForm.ruleName,
          caseType: slaForm.caseClass,
          reason: slaForm.contactReason || "All",
          duration: `${slaForm.duration} ${slaForm.durationUnit}`,
          warning: `${slaForm.warningThreshold}%`,
          type: "internal",
          status: slaForm.active ? "active" : "inactive",
        },
      ]);
      showSlaToast("SLA rule created");
    }
    closeSlaPanel();
  };

  const duplicateSlaRule = (id: number) => {
    const rule = slaRules.find((r) => r.id === id);
    if (!rule) return;
    const newRule: SLARule = { ...rule, id: Date.now(), name: `${rule.name} (copy)`, type: "internal", status: "inactive" };
    setSlaRules((prev) => [...prev, newRule]);
    showSlaToast("Rule duplicated — edit to customise");
  };

  const deleteSlaRule = (id: number) => {
    setSlaRules((prev) => prev.filter((r) => r.id !== id));
    showSlaToast("Rule deleted");
  };

  const isRegulatoryCaseClass = slaForm.caseClass === "Complaint" || slaForm.caseClass === "Life Support";

  return (
    <div className="min-w-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-[1600px] p-density-xl">
        {/* Page header */}
        <div className="mb-density-xl flex items-center justify-between">
          <div>
            <h1
              className="font-bold text-gray-900 dark:text-gray-100"
              style={{
                fontSize: "var(--tally-font-size-3xl)",
                lineHeight: "var(--tally-line-height-tight)",
              }}
            >
              Settings &amp; User Access
            </h1>
            <p
              className="mt-density-xs text-muted-foreground"
              style={{ fontSize: "var(--tally-font-size-sm)" }}
            >
              Configure users, roles, and CRM settings
            </p>
          </div>
          <div className="flex items-center gap-density-sm">
            <div className="relative">
              <Icon
                name="search"
                size="var(--tally-icon-size-md)"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Search users..."
                className="h-10 w-[280px] rounded-density-md border border-border bg-white pl-9 pr-3 outline-none placeholder:text-muted-foreground focus:border-[#2C365D] focus:ring-1 focus:ring-[#2C365D] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                style={{ fontSize: "var(--tally-font-size-sm)" }}
              />
            </div>
            <Button size="sm" className="gap-1.5">
              <Icon name="person_add" size="var(--tally-icon-size-sm)" />
              Add User
            </Button>
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-[minmax(160px,240px)_1fr] gap-density-lg">
          {/* Settings nav */}
          <Card className="h-fit min-w-0 shrink-0 shadow-none">
            <div className="p-density-sm">
              {SETTINGS_TABS.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      "flex w-full items-center gap-density-md rounded-density-md px-density-md py-density-md transition-colors",
                      isActive
                        ? "bg-[#2C365D]/10 font-semibold text-[#2C365D] dark:bg-[#7c8cb8]/10 dark:text-[#7c8cb8]"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                    )}
                    style={{ fontSize: "var(--tally-font-size-sm)" }}
                  >
                    <Icon name={tab.icon} size="var(--tally-icon-size-md)" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Content area */}
          <div className="flex min-w-0 flex-col gap-density-lg">
            {/* Users */}
            {activeTab === "users" && (
              <Card className="shadow-none">
                <SectionHeader
                  title="User Management"
                  description="Manage CRM users and roles"
                  action={
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Icon name="download" size="var(--tally-icon-size-sm)" />
                      Export
                    </Button>
                  }
                />
                <div>
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="bg-gray-50 font-medium uppercase tracking-wider text-muted-foreground dark:bg-gray-800/50" style={{ fontSize: "var(--tally-font-size-xs)" }}>
                          User
                        </TableHead>
                        <TableHead className="bg-gray-50 font-medium uppercase tracking-wider text-muted-foreground dark:bg-gray-800/50" style={{ fontSize: "var(--tally-font-size-xs)" }}>
                          Role
                        </TableHead>
                        <TableHead className="bg-gray-50 font-medium uppercase tracking-wider text-muted-foreground dark:bg-gray-800/50" style={{ fontSize: "var(--tally-font-size-xs)" }}>
                          Team
                        </TableHead>
                        <TableHead className="bg-gray-50 font-medium uppercase tracking-wider text-muted-foreground dark:bg-gray-800/50" style={{ fontSize: "var(--tally-font-size-xs)" }}>
                          Status
                        </TableHead>
                        <TableHead className="bg-gray-50 font-medium uppercase tracking-wider text-muted-foreground dark:bg-gray-800/50" style={{ fontSize: "var(--tally-font-size-xs)" }}>
                          Last Active
                        </TableHead>
                        <TableHead className="w-10 bg-gray-50 dark:bg-gray-800/50" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {USERS_DATA.map((user) => (
                        <TableRow key={user.id} className="group">
                          <TableCell>
                            <div className="flex items-center gap-density-md">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2C365D] text-white dark:bg-[#7c8cb8]">
                                <span className="font-semibold" style={{ fontSize: "var(--tally-font-size-xs)" }}>
                                  {user.initials}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 dark:text-gray-100">
                                  {user.name}
                                </div>
                                <div className="text-muted-foreground" style={{ fontSize: "var(--tally-font-size-xs)" }}>
                                  {user.email}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <RoleBadge role={user.role} label={user.roleLabel} />
                          </TableCell>
                          <TableCell className="text-gray-700 dark:text-gray-300">
                            {user.team}
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center capitalize">
                              <StatusDot status={user.status as "active" | "inactive" | "pending"} />
                              {user.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-gray-700 dark:text-gray-300">
                            {user.lastActive}
                          </TableCell>
                          <TableCell className="w-10 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn(
                                "h-7 w-7",
                                user.showDelete && "hover:bg-[#C40000]/10 hover:text-[#C40000]"
                              )}
                            >
                              <Icon
                                name={user.showDelete ? "delete" : "more_vert"}
                                size="var(--tally-icon-size-sm)"
                              />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            )}

            {/* Roles */}
            {activeTab === "roles" && (
              <Card className="shadow-none">
                <SectionHeader
                  title="Role Management"
                  description="Define roles and access levels"
                  borderless
                  action={
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Icon name="add" size="var(--tally-icon-size-sm)" />
                      Create Role
                    </Button>
                  }
                />
                <CardContent className="p-density-lg">
                  <div className="grid grid-cols-1 gap-density-lg sm:grid-cols-2">
                    {ROLES_DATA.map((role) => (
                      <div
                        key={role.name}
                        className="rounded-density-md border border-border p-density-lg transition-colors hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                      >
                        <div className="mb-density-sm flex items-center justify-between">
                          <span
                            className="font-bold text-gray-900 dark:text-gray-100"
                            style={{ fontSize: "var(--tally-font-size-base)" }}
                          >
                            {role.name}
                          </span>
                          <Badge variant="outline" className="text-muted-foreground">
                            {role.count} users
                          </Badge>
                        </div>
                        <p
                          className="mb-density-md leading-relaxed text-muted-foreground"
                          style={{ fontSize: "var(--tally-font-size-xs)" }}
                        >
                          {role.description}
                        </p>
                        <div className="flex flex-wrap gap-density-xs">
                          {role.badges.map((b) => (
                            <Badge
                              key={b.label}
                              variant={b.active ? "success" : "outline"}
                              className={!b.active ? "text-muted-foreground" : ""}
                            >
                              {b.label}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Permissions */}
            {activeTab === "permissions" && (
              <Card className="shadow-none">
                <SectionHeader
                  title="Permissions Matrix"
                  description="RBAC permissions by role"
                  action={
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Icon name="download" size="var(--tally-icon-size-sm)" />
                      Export
                    </Button>
                  }
                />
                <div>
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="bg-gray-50 font-medium uppercase tracking-wider text-muted-foreground dark:bg-gray-800/50" style={{ fontSize: "var(--tally-font-size-xs)" }}>
                          Resource
                        </TableHead>
                        <TableHead className="bg-gray-50 text-center font-medium uppercase tracking-wider text-muted-foreground dark:bg-gray-800/50" style={{ fontSize: "var(--tally-font-size-xs)" }}>
                          Administrator
                        </TableHead>
                        <TableHead className="bg-gray-50 text-center font-medium uppercase tracking-wider text-muted-foreground dark:bg-gray-800/50" style={{ fontSize: "var(--tally-font-size-xs)" }}>
                          Manager
                        </TableHead>
                        <TableHead className="bg-gray-50 text-center font-medium uppercase tracking-wider text-muted-foreground dark:bg-gray-800/50" style={{ fontSize: "var(--tally-font-size-xs)" }}>
                          Agent
                        </TableHead>
                        <TableHead className="bg-gray-50 text-center font-medium uppercase tracking-wider text-muted-foreground dark:bg-gray-800/50" style={{ fontSize: "var(--tally-font-size-xs)" }}>
                          Viewer
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {PERMISSIONS_MATRIX.map((row) => (
                        <TableRow key={row.resource}>
                          <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                            {row.resource}
                          </TableCell>
                          {(["admin", "manager", "agent", "viewer"] as const).map((col) => {
                            const icon = row[col];
                            const colorClass =
                              icon === "check"
                                ? "text-[#008000]"
                                : icon === "visibility"
                                  ? "text-[#0074C4]"
                                  : icon === "remove"
                                    ? "text-[#C53B00]"
                                    : "text-[#C40000]";
                            return (
                              <TableCell key={col} className="text-center">
                                <Icon name={icon} size="var(--tally-icon-size-sm)" className={colorClass} />
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            )}

            {/* SLA Policies */}
            {activeTab === "slaPolicies" && (
              <Card className="shadow-none">
                <SectionHeader
                  title="SLA Rules"
                  description="Configure service level agreements by case type. Regulatory rules enforce minimum timeframes required by the AER."
                  action={
                    <Button size="sm" className="gap-1.5" onClick={() => openSlaPanel("new")}>
                      <Icon name="add" size="var(--tally-icon-size-sm)" />
                      New Rule
                    </Button>
                  }
                />
                <div className="px-density-lg pb-density-lg">
                  <div className="mt-density-lg mb-density-md flex items-start gap-density-sm rounded-density-md border border-[#2C365D]/30 bg-[#2C365D]/5 px-density-md py-density-sm dark:border-[#7c8cb8]/30 dark:bg-[#7c8cb8]/10">
                    <Icon name="info" size="var(--tally-icon-size-sm)" className="mt-0.5 shrink-0 text-[#2C365D] dark:text-[#7c8cb8]" />
                    <p className="text-muted-foreground" style={{ fontSize: "var(--tally-font-size-xs)", lineHeight: "var(--tally-line-height-normal)" }}>
                      Regulatory SLAs are marked with a <strong className="text-[#2C365D] dark:text-[#7c8cb8]">Regulatory</strong> badge and enforce AER-mandated minimum timeframes. Duration cannot be shortened below the legal minimum, but warning thresholds and escalation settings can still be adjusted.
                    </p>
                  </div>

                  <div className="mb-density-md flex border-b border-border dark:border-gray-700">
                    {[
                      { key: "all" as const, label: "All Rules", count: slaCounts.all },
                      { key: "regulatory" as const, label: "Regulatory", count: slaCounts.regulatory },
                      { key: "internal" as const, label: "Internal", count: slaCounts.internal },
                      { key: "inactive" as const, label: "Inactive", count: slaCounts.inactive },
                    ].map(({ key, label, count }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSlaFilterTab(key)}
                        className={cn(
                          "flex items-center gap-density-sm border-b-2 px-density-md py-density-sm font-medium transition-colors",
                          slaFilterTab === key
                            ? "border-[#2C365D] text-[#2C365D] dark:border-[#7c8cb8] dark:text-[#7c8cb8]"
                            : "border-transparent text-muted-foreground hover:text-gray-900 dark:hover:text-gray-100"
                        )}
                        style={{ fontSize: "var(--tally-font-size-sm)" }}
                      >
                        {label}
                        <span
                          className={cn(
                            "inline-flex min-w-[18px] items-center justify-center rounded-full px-density-sm font-semibold",
                            slaFilterTab === key ? "bg-[#2C365D]/10 text-[#2C365D] dark:bg-[#7c8cb8]/10 dark:text-[#7c8cb8]" : "bg-gray-200 text-muted-foreground dark:bg-gray-700 dark:text-gray-400"
                          )}
                          style={{ height: "var(--tally-spacing-lg)", fontSize: "var(--tally-font-size-xs)" }}
                        >
                          {count}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="mb-density-md flex flex-wrap items-center gap-density-md">
                    <div className="relative max-w-[320px] flex-1">
                      <Icon name="search" size="var(--tally-icon-size-sm)" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search rules..."
                        value={slaSearch}
                        onChange={(e) => setSlaSearch(e.target.value)}
                        className="h-9 w-full rounded-density-md border border-border bg-white pl-9 pr-density-sm outline-none placeholder:text-muted-foreground focus:border-[#2C365D] focus:ring-1 focus:ring-[#2C365D] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                        style={{ fontSize: "var(--tally-font-size-sm)", paddingTop: "var(--tally-spacing-sm)", paddingBottom: "var(--tally-spacing-sm)" }}
                      />
                    </div>
                    <div className="w-[180px]">
                      <Select
                        value={slaCaseTypeFilter}
                        onChange={(e) => setSlaCaseTypeFilter(e.target.value)}
                        className="h-9 border-border bg-white dark:border-gray-700 dark:bg-gray-900"
                      >
                        <option value="">All case types</option>
                        {CASE_TYPES.map((ct) => (
                          <option key={ct} value={ct}>{ct}</option>
                        ))}
                      </Select>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-density-md border border-border dark:border-gray-700">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="bg-gray-50 font-medium uppercase tracking-wider text-muted-foreground dark:bg-gray-800/50" style={{ fontSize: "var(--tally-font-size-xs)" }}>Rule name</TableHead>
                          <TableHead className="bg-gray-50 font-medium uppercase tracking-wider text-muted-foreground dark:bg-gray-800/50" style={{ fontSize: "var(--tally-font-size-xs)" }}>Case type</TableHead>
                          <TableHead className="bg-gray-50 font-medium uppercase tracking-wider text-muted-foreground dark:bg-gray-800/50" style={{ fontSize: "var(--tally-font-size-xs)" }}>Duration</TableHead>
                          <TableHead className="bg-gray-50 font-medium uppercase tracking-wider text-muted-foreground dark:bg-gray-800/50" style={{ fontSize: "var(--tally-font-size-xs)" }}>Warning at</TableHead>
                          <TableHead className="bg-gray-50 font-medium uppercase tracking-wider text-muted-foreground dark:bg-gray-800/50" style={{ fontSize: "var(--tally-font-size-xs)" }}>Type</TableHead>
                          <TableHead className="bg-gray-50 font-medium uppercase tracking-wider text-muted-foreground dark:bg-gray-800/50" style={{ fontSize: "var(--tally-font-size-xs)" }}>Status</TableHead>
                          <TableHead className="w-10 bg-gray-50 dark:bg-gray-800/50" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSlaRules.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="py-density-xl text-center text-muted-foreground" style={{ fontSize: "var(--tally-font-size-sm)" }}>
                              No rules match your filters.
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredSlaRules.map((r) => (
                            <TableRow key={r.id} className="group">
                              <TableCell>
                                <div className="font-medium text-gray-900 dark:text-gray-100" style={{ fontSize: "var(--tally-font-size-sm)" }}>
                                  {r.name}
                                  {r.type === "regulatory" && (
                                    <Icon name="lock" size="var(--tally-icon-size-sm)" className="ml-density-sm inline-block text-violet-500 dark:text-violet-400" />
                                  )}
                                </div>
                                <div className="text-muted-foreground" style={{ fontSize: "var(--tally-font-size-xs)" }}>
                                  {r.reason !== "All" ? r.reason : "All contact reasons"}
                                </div>
                              </TableCell>
                              <TableCell className="text-muted-foreground" style={{ fontSize: "var(--tally-font-size-sm)" }}>{r.caseType}</TableCell>
                              <TableCell className="text-gray-900 dark:text-gray-100" style={{ fontSize: "var(--tally-font-size-xs)" }}>{r.duration}</TableCell>
                              <TableCell className="align-top">
                                <div className="space-y-1">
                                  <span className="text-amber-600 dark:text-amber-400" style={{ fontSize: "var(--tally-font-size-xs)" }}>{r.warning}</span>
                                  <div className="relative h-1 w-16 min-w-16 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                                    <div className="h-full w-full rounded-full bg-gradient-to-r from-green-500 via-amber-500 to-red-500" />
                                    <div
                                      className="absolute top-1/2 -translate-y-1/2 rounded-full bg-black shadow-sm dark:bg-white"
                                      style={{ left: `${parseInt(r.warning, 10) || 0}%`, marginLeft: -1.5, height: "6px", width: "3px" }}
                                    />
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={r.type === "regulatory" ? "default" : "outline"} className={r.type === "internal" ? "text-muted-foreground" : undefined}>
                                  {r.type === "regulatory" ? "⬡ Regulatory" : "Internal"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={r.status === "active" ? "success" : "outline"} className={r.status === "inactive" ? "text-muted-foreground" : undefined}>
                                  {r.status === "active" ? "● Active" : "○ Inactive"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-density-xs opacity-0 transition-opacity group-hover:opacity-100">
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openSlaPanel("edit", r.id)} title="Edit">
                                    <Icon name="edit" size="var(--tally-icon-size-sm)" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => duplicateSlaRule(r.id)} title="Duplicate">
                                    <Icon name="content_copy" size="var(--tally-icon-size-sm)" />
                                  </Button>
                                  {r.type !== "regulatory" && (
                                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-[#C40000]/10 hover:text-[#C40000]" onClick={() => setSlaRuleToDelete(r.id)} title="Delete">
                                      <Icon name="delete" size="var(--tally-icon-size-sm)" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </Card>
            )}

            {/* Placeholder tabs */}
            {activeTab !== "users" &&
              activeTab !== "roles" &&
              activeTab !== "permissions" &&
              activeTab !== "slaPolicies" && (
                <Card className="shadow-none">
                  <SectionHeader
                    title={SETTINGS_TABS.find((t) => t.key === activeTab)?.label ?? ""}
                    description="Configuration panel"
                  />
                  <CardContent className="p-density-xl">
                    <p className="text-muted-foreground" style={{ fontSize: "var(--tally-font-size-sm)" }}>
                      This section will be wired to configuration APIs in Phase 2. For now, use the CRM API/DB spec to align the fields and validation rules.
                    </p>
                  </CardContent>
                </Card>
              )}
          </div>
        </div>
      </div>

      {/* Confirm delete SLA rule */}
      <AlertDialog open={slaRuleToDelete !== null} onOpenChange={(open) => !open && setSlaRuleToDelete(null)}>
        <AlertDialogContent className="dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-gray-100">Delete SLA rule</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-gray-400">
              Are you sure you want to delete the rule &quot;{slaRuleToDelete != null ? slaRules.find((rule) => rule.id === slaRuleToDelete)?.name : ""}&quot;? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="hover:bg-[#C40000]/90 bg-[#C40000] text-white focus-visible:ring-[#C40000] dark:hover:bg-[#C40000]/80"
              onClick={() => {
                if (slaRuleToDelete != null) {
                  deleteSlaRule(slaRuleToDelete);
                  setSlaRuleToDelete(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* SLA Rule slide-over panel */}
      <Sheet open={slaSheetOpen} onOpenChange={setSlaSheetOpen}>
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 border-l border-border bg-white p-0 dark:border-gray-700 dark:bg-gray-900 sm:!max-w-[600px]"
          style={{ maxWidth: "min(600px, 100vw)" }}
        >
          <SheetHeader className="flex flex-row items-start justify-between gap-density-md border-b border-border px-density-lg py-density-md dark:border-gray-700">
            <div>
              <SheetTitle className="font-semibold text-gray-900 dark:text-gray-100" style={{ fontSize: "var(--tally-font-size-base)", lineHeight: "var(--tally-line-height-tight)" }}>
                {editingRuleId ? "Edit SLA Rule" : "New SLA Rule"}
              </SheetTitle>
              <SheetDescription className="mt-density-xs text-muted-foreground" style={{ fontSize: "var(--tally-font-size-xs)", lineHeight: "var(--tally-line-height-normal)" }}>
                {editingRuleId ? slaRules.find((r) => r.id === editingRuleId)?.name : "Define duration, thresholds, and escalation behaviour"}
              </SheetDescription>
            </div>
            <SheetClose className="relative right-0 top-0 rounded-density-md p-density-sm hover:bg-gray-100 dark:hover:bg-gray-800" />
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-density-lg py-density-lg">
            <div className="mb-density-xl">
              <div className="border-b border-border pb-density-xs font-semibold uppercase tracking-wider text-muted-foreground dark:border-gray-700" style={{ fontSize: "var(--tally-font-size-xs)", letterSpacing: "0.08em", marginBottom: "var(--tally-spacing-md)" }}>Identity</div>
              <div className="space-y-density-md">
                <div>
                  <label className="mb-density-xs block font-medium text-gray-700 dark:text-gray-300" style={{ fontSize: "var(--tally-font-size-sm)" }}>Rule name <span className="text-[#C40000]">*</span></label>
                  <Input
                    value={slaForm.ruleName}
                    onChange={(e) => setSlaForm((f) => ({ ...f, ruleName: e.target.value }))}
                    placeholder="e.g. Complaint — Initial Response"
                    className="h-9"
                  />
                  <p className="mt-density-xs text-muted-foreground" style={{ fontSize: "var(--tally-font-size-xs)", lineHeight: 1.4 }}>Use a clear name that describes the case type and milestone this SLA applies to.</p>
                </div>
                <div className="grid grid-cols-2 gap-density-md">
                  <div>
                    <label className="mb-density-xs block font-medium text-gray-700 dark:text-gray-300" style={{ fontSize: "var(--tally-font-size-sm)" }}>Case class <span className="text-[#C40000]">*</span></label>
                    <Select
                      value={slaForm.caseClass}
                      onChange={(e) => setSlaForm((f) => ({ ...f, caseClass: e.target.value }))}
                      className="h-9"
                    >
                      <option value="">Select…</option>
                      {CASE_TYPES.map((ct) => (
                        <option key={ct} value={ct}>{ct}</option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <label className="mb-density-xs block font-medium text-gray-700 dark:text-gray-300" style={{ fontSize: "var(--tally-font-size-sm)" }}>Contact reason <span className="font-normal text-muted-foreground">(optional)</span></label>
                    <Select
                      value={slaForm.contactReason}
                      onChange={(e) => setSlaForm((f) => ({ ...f, contactReason: e.target.value }))}
                      className="h-9"
                    >
                      <option value="">All contact reasons</option>
                      {CONTACT_REASONS.slice(1).map((cr) => (
                        <option key={cr} value={cr}>{cr}</option>
                      ))}
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {isRegulatoryCaseClass && (
              <div className="mb-density-md flex gap-density-sm rounded-density-md border border-violet-200 bg-violet-50 px-density-md py-density-sm dark:border-violet-800 dark:bg-violet-900/20">
                <Icon name="star" size="var(--tally-icon-size-sm)" className="mt-0.5 shrink-0 text-violet-600 dark:text-violet-400" />
                <p className="text-gray-700 dark:text-gray-300" style={{ fontSize: "var(--tally-font-size-xs)", lineHeight: "var(--tally-line-height-normal)" }}>
                  <strong className="text-violet-700 dark:text-violet-300">Regulatory SLA applies.</strong> Under the National Energy Retail Rules, complaint resolution must occur within <strong>20 business days</strong> and initial acknowledgement within <strong>2 business days</strong>. The duration below cannot be set lower than the legal minimum.
                </p>
              </div>
            )}

            <div className="mb-density-xl">
              <div className="border-b border-border pb-density-xs font-semibold uppercase tracking-wider text-muted-foreground dark:border-gray-700" style={{ fontSize: "var(--tally-font-size-xs)", letterSpacing: "0.08em", marginBottom: "var(--tally-spacing-md)" }}>Duration &amp; Thresholds</div>
              <div className="space-y-density-md">
                <div>
                  <label className="mb-density-xs block font-medium text-gray-700 dark:text-gray-300" style={{ fontSize: "var(--tally-font-size-sm)" }}>SLA duration <span className="text-[#C40000]">*</span></label>
                  <div className="flex gap-density-sm">
                    <Input
                      type="number"
                      min={1}
                      value={slaForm.duration}
                      onChange={(e) => setSlaForm((f) => ({ ...f, duration: parseInt(e.target.value, 10) || 0 }))}
                      disabled={editingRuleId != null && slaRules.find((r) => r.id === editingRuleId)?.type === "regulatory"}
                      className="h-9 flex-1"
                    />
                    <Select
                      value={slaForm.durationUnit}
                      onChange={(e) => setSlaForm((f) => ({ ...f, durationUnit: e.target.value }))}
                      disabled={editingRuleId != null && slaRules.find((r) => r.id === editingRuleId)?.type === "regulatory"}
                      className="h-9 w-[140px] shrink-0"
                    >
                      {DURATION_UNITS.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </Select>
                  </div>
                  <p className="mt-density-xs text-muted-foreground" style={{ fontSize: "var(--tally-font-size-xs)", lineHeight: 1.4 }}>The clock starts when the case is created and pauses based on hold rules.</p>
                </div>
                <div>
                  <label className="mb-density-xs block font-medium text-gray-700 dark:text-gray-300" style={{ fontSize: "var(--tally-font-size-sm)" }}>Warning threshold</label>
                  <div className="flex gap-density-sm">
                    <Input
                      type="number"
                      min={1}
                      max={99}
                      value={slaForm.warningThreshold}
                      onChange={(e) => setSlaForm((f) => ({ ...f, warningThreshold: Math.min(99, Math.max(1, parseInt(e.target.value, 10) || 75)) }))}
                      className="h-9 flex-1"
                    />
                    <Select className="h-9 w-[100px] shrink-0" value="pct" onChange={() => {}}>
                      <option value="pct">% elapsed</option>
                    </Select>
                  </div>
                  <p className="mt-density-xs text-muted-foreground" style={{ fontSize: "var(--tally-font-size-xs)", lineHeight: 1.4 }}>Cases will display an amber warning when this percentage of the SLA duration has elapsed.</p>
                  <div className="relative mt-density-sm h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700" style={{ height: "var(--tally-spacing-sm)" }}>
                    <div className="h-full w-full rounded-full bg-gradient-to-r from-green-500 via-amber-500 to-red-500" />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 rounded-full bg-white shadow-sm"
                      style={{ left: `${slaForm.warningThreshold}%`, marginLeft: -1, height: "var(--tally-spacing-md)", width: "2px" }}
                    />
                  </div>
                  <div className="mt-density-xs flex justify-between" style={{ fontSize: "var(--tally-font-size-xs)" }}>
                    <span className="text-green-600 dark:text-green-400">0%</span>
                    <span className="text-amber-600 dark:text-amber-400">{slaForm.warningThreshold}% warn</span>
                    <span className="text-red-600 dark:text-red-400">100% breach</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-density-xl">
              <div className="border-b border-border pb-density-xs font-semibold uppercase tracking-wider text-muted-foreground dark:border-gray-700" style={{ fontSize: "var(--tally-font-size-xs)", letterSpacing: "0.08em", marginBottom: "var(--tally-spacing-md)" }}>Clock Behaviour</div>
              <div className="space-y-density-sm">
                {[
                  { key: "pauseOnHold", label: "Pause on hold", desc: "SLA clock pauses when case status is set to On Hold or Awaiting Customer" },
                  { key: "businessHoursOnly", label: "Business hours only", desc: "Clock only counts during configured business hours (excludes weekends and public holidays)" },
                  { key: "resetOnReassign", label: "Reset on reassignment", desc: "SLA clock resets when a case is reassigned to a different team or operator" },
                ].map(({ key, label, desc }) => (
                  <div
                    key={key}
                    className="flex cursor-pointer items-center justify-between rounded-density-md border border-border bg-gray-50 px-density-md py-density-sm dark:border-gray-700 dark:bg-gray-800"
                    onClick={() => setSlaForm((f) => ({ ...f, [key]: !(f[key as keyof typeof slaForm] as boolean) }))}
                  >
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100" style={{ fontSize: "var(--tally-font-size-sm)" }}>{label}</div>
                      <div className="text-muted-foreground" style={{ fontSize: "var(--tally-font-size-xs)", marginTop: "var(--tally-spacing-xs)" }}>{desc}</div>
                    </div>
                    <div className="shrink-0">
                      <Switch
                        checked={slaForm[key as keyof typeof slaForm] as boolean}
                        onChange={(e) => setSlaForm((f) => ({ ...f, [key]: (e.target as HTMLInputElement).checked }))}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-density-xl">
              <div className="border-b border-border pb-density-xs font-semibold uppercase tracking-wider text-muted-foreground dark:border-gray-700" style={{ fontSize: "var(--tally-font-size-xs)", letterSpacing: "0.08em", marginBottom: "var(--tally-spacing-md)" }}>Escalation</div>
              <div className="grid grid-cols-2 gap-density-md">
                <div>
                  <label className="mb-density-xs block font-medium text-gray-700 dark:text-gray-300" style={{ fontSize: "var(--tally-font-size-sm)" }}>Escalate to</label>
                  <Select value={slaForm.escalateTo} onChange={(e) => setSlaForm((f) => ({ ...f, escalateTo: e.target.value }))} className="h-9">
                    <option value="">No escalation</option>
                    {ESCALATE_OPTIONS.slice(1).map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="mb-density-xs block font-medium text-gray-700 dark:text-gray-300" style={{ fontSize: "var(--tally-font-size-sm)" }}>Escalate at</label>
                  <div className="flex gap-density-sm">
                    <Input type="number" min={1} max={99} value={slaForm.escalateAt} onChange={(e) => setSlaForm((f) => ({ ...f, escalateAt: parseInt(e.target.value, 10) || 90 }))} className="h-9 flex-1" />
                    <Select className="h-9 w-[100px] shrink-0" value="pct" onChange={() => {}}>
                    <option value="pct">% elapsed</option></Select>
                  </div>
                </div>
              </div>
              <p className="mt-density-md text-muted-foreground" style={{ fontSize: "var(--tally-font-size-xs)", lineHeight: 1.4 }}>Cases will be escalated when this percentage of the SLA duration has elapsed.</p>
              <div className="relative mt-density-sm h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700" style={{ height: "var(--tally-spacing-sm)" }}>
                <div className="h-full w-full rounded-full bg-gradient-to-r from-green-500 via-amber-500 to-red-500" />
                <div
                  className="absolute top-1/2 -translate-y-1/2 rounded-full bg-white shadow-sm"
                  style={{ left: `${slaForm.escalateAt}%`, marginLeft: -1, height: "var(--tally-spacing-md)", width: "2px" }}
                />
              </div>
              <div className="mt-density-xs flex justify-between" style={{ fontSize: "var(--tally-font-size-xs)" }}>
                <span className="text-green-600 dark:text-green-400">0%</span>
                <span className="text-amber-600 dark:text-amber-400">{slaForm.escalateAt}% escalate</span>
                <span className="text-red-600 dark:text-red-400">100% breach</span>
              </div>
            </div>

            <div>
              <div className="border-b border-border pb-density-xs font-semibold uppercase tracking-wider text-muted-foreground dark:border-gray-700" style={{ fontSize: "var(--tally-font-size-xs)", letterSpacing: "0.08em", marginBottom: "var(--tally-spacing-md)" }}>Status</div>
              <div
                className="flex cursor-pointer items-center justify-between rounded-density-md border border-border bg-gray-50 px-density-md py-density-sm dark:border-gray-700 dark:bg-gray-800"
                onClick={() => setSlaForm((f) => ({ ...f, active: !f.active }))}
              >
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100" style={{ fontSize: "var(--tally-font-size-sm)" }}>Active</div>
                  <div className="text-muted-foreground" style={{ fontSize: "var(--tally-font-size-xs)", marginTop: "var(--tally-spacing-xs)" }}>Rule is applied to matching cases</div>
                </div>
                <Switch checked={slaForm.active} onChange={(e) => setSlaForm((f) => ({ ...f, active: (e.target as HTMLInputElement).checked }))} onClick={(e) => e.stopPropagation()} />
              </div>
            </div>
          </div>

          <SheetFooter className="flex flex-row justify-end gap-density-sm border-t border-border px-density-lg py-density-md dark:border-gray-700">
            <Button variant="outline" size="sm" onClick={closeSlaPanel}>Cancel</Button>
            <Button size="sm" className="gap-1.5" onClick={saveSlaRule}>
              <Icon name="check" size="var(--tally-icon-size-sm)" />
              Save rule
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {slaToast.show && (
        <div
          className="fixed z-[200] flex items-center gap-density-sm rounded-density-md border border-green-500 bg-white shadow-lg dark:border-green-600 dark:bg-gray-900"
          style={{
            bottom: "var(--tally-spacing-xl)",
            right: "var(--tally-spacing-xl)",
            fontSize: "var(--tally-font-size-sm)",
            padding: "var(--tally-spacing-md) var(--tally-spacing-lg)",
            lineHeight: "var(--tally-line-height-normal)",
          }}
        >
          <Icon name="check" size="var(--tally-icon-size-md)" className="shrink-0 text-green-600 dark:text-green-400" />
          <span>{slaToast.message}</span>
        </div>
      )}
    </div>
  );
}
