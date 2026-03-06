"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
} from "@/components/Card/Card";
import Badge from "@/components/Badge/Badge";
import Button from "@/components/Button/Button";
import Checkbox from "@/components/Checkbox/Checkbox";
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
import { useCaseClassification } from "@/lib/case-classification-context";
import type { CaseGroupItem, CaseTypeInGroup } from "@/lib/mock-data/case-types";
import type { CaseType } from "@/types/crm";

const SETTINGS_TABS = [
  { key: "users", label: "Users", icon: "group" },
  { key: "roles", label: "Roles", icon: "admin_panel_settings" },
  { key: "permissions", label: "Permissions", icon: "lock" },
  { key: "opportunityStages", label: "Opportunity Stages", icon: "layers" },
  { key: "caseClasses", label: "Case Classes", icon: "sell" },
  { key: "caseTypes", label: "Case Types", icon: "folder" },
  { key: "slaPolicies", label: "SLA Policies", icon: "timer" },
  { key: "businessHours", label: "Business Hours", icon: "work_history" },
  { key: "coolOffPeriod", label: "Cool Off Period", icon: "schedule" },
  { key: "templates", label: "Email Templates", icon: "drafts" },
  { key: "noteTemplates", label: "Note Templates", icon: "sticky_note_2" },
  { key: "inboxes", label: "Inboxes", icon: "inbox" },
  { key: "audit", label: "Audit Log", icon: "history" },
  { key: "general", label: "General", icon: "tune" },
];

const SETTINGS_CATEGORIES: { label: string; tabKeys: string[] }[] = [
  { label: "User & access", tabKeys: ["users", "roles", "permissions"] },
  { label: "Cases", tabKeys: ["caseClasses", "caseTypes", "slaPolicies", "businessHours", "coolOffPeriod"] },
  { label: "Sales pipeline", tabKeys: ["opportunityStages"] },
  { label: "Templates", tabKeys: ["templates", "noteTemplates"] },
  { label: "Channels", tabKeys: ["inboxes"] },
  { label: "System", tabKeys: ["audit", "general"] },
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

const CONTACT_REASONS = ["All contact reasons", "Billing dispute", "Meter fault", "New connection", "Supply interruption", "Contract query"];
const DURATION_UNITS = ["business days", "calendar days", "business hours"];

/** Case type config (C-042: configurable; CS-045: optional primary contact reason per type) */
interface CaseTypeItem {
  id: string;
  name: string;
  primaryContactReason: string;
  active: boolean;
}

const CASE_TYPES_INITIAL: CaseTypeItem[] = [
  { id: "ct-1", name: "Complaint", primaryContactReason: "", active: true },
  { id: "ct-2", name: "General Enquiry", primaryContactReason: "", active: true },
  { id: "ct-3", name: "EWR", primaryContactReason: "", active: true },
  { id: "ct-4", name: "Life Support", primaryContactReason: "", active: true },
  { id: "ct-5", name: "Service Order", primaryContactReason: "", active: true },
];

/** Case class options for Case Group config (maps to API CaseType) */
const CASE_CLASS_OPTIONS: CaseType[] = ["Enquiry", "Onboarding", "Complaint", "Dunning", "EWR"];
const ESCALATE_OPTIONS = ["No escalation", "Team Leader", "Manager", "Compliance Officer"];

interface NoteTemplateItem {
  id: string;
  name: string;
  title: string;
  body: string;
  category: string;
  description: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

const NOTE_TEMPLATE_CATEGORIES = ["Closing", "Field", "Internal", "Billing", "Escalation", "Onboarding", "Technical"];

const defaultNoteTemplateForm = {
  name: "",
  title: "",
  body: "",
  category: "",
  description: "",
  active: true,
};

interface EmailTemplateItem {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: string;
  description: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

const EMAIL_TEMPLATE_CATEGORIES = ["General", "Billing", "Closing", "Escalation", "Field", "Onboarding", "Technical", "Commercial"];

const defaultEmailTemplateForm = {
  name: "",
  subject: "",
  body: "",
  category: "",
  description: "",
  active: true,
};

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
  const caseClassification = useCaseClassification();
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

  const [coolOffDuration, setCoolOffDuration] = useState(48);
  const [coolOffUnit, setCoolOffUnit] = useState("hours");
  const [coolOffEnabled, setCoolOffEnabled] = useState(true);
  // Business Hours (SLA clock, auto-ack inside/outside hours; CSE: national/state holidays)
  const [businessHoursTimezone, setBusinessHoursTimezone] = useState("Australia/Brisbane");
  const [businessHoursDays, setBusinessHoursDays] = useState<Record<string, boolean>>({
    mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false,
  });
  const [businessHoursStart, setBusinessHoursStart] = useState("09:00");
  const [businessHoursEnd, setBusinessHoursEnd] = useState("17:00");
  const [businessHoursHolidayCalendar, setBusinessHoursHolidayCalendar] = useState("national");

  // Case Types state (C-042 configurable types; CS-045 primary contact reason)
  const [caseTypes, setCaseTypes] = useState<CaseTypeItem[]>(CASE_TYPES_INITIAL);
  const [caseTypeFilterTab, setCaseTypeFilterTab] = useState<"all" | "active" | "inactive">("all");
  const [caseTypeSearch, setCaseTypeSearch] = useState("");
  const [caseTypeSheetOpen, setCaseTypeSheetOpen] = useState(false);
  const [editingCaseTypeId, setEditingCaseTypeId] = useState<string | null>(null);
  const [caseTypeForm, setCaseTypeForm] = useState({ name: "", primaryContactReason: "", active: true });
  const [caseTypeToast, setCaseTypeToast] = useState({ show: false, message: "" });
  const [caseTypeToDelete, setCaseTypeToDelete] = useState<string | null>(null);

  // Case Types tab (groups + reasons from context)
  const [groupSheetOpen, setGroupSheetOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupForm, setGroupForm] = useState<{ name: string; caseClass: CaseType; types: CaseTypeInGroup[] }>({ name: "", caseClass: "Enquiry", types: [] });
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);
  const [groupToast, setGroupToast] = useState({ show: false, message: "" });

  // Note Templates state
  const [noteTemplates, setNoteTemplates] = useState<NoteTemplateItem[]>([]);
  const [noteTemplatesLoading, setNoteTemplatesLoading] = useState(false);
  const [noteTemplateSearch, setNoteTemplateSearch] = useState("");
  const [noteTemplateFilterTab, setNoteTemplateFilterTab] = useState<"all" | "active" | "inactive">("all");
  const [noteTemplateSheetOpen, setNoteTemplateSheetOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [noteTemplateForm, setNoteTemplateForm] = useState(defaultNoteTemplateForm);
  const [noteTemplateToast, setNoteTemplateToast] = useState({ show: false, message: "" });
  const [noteTemplateToDelete, setNoteTemplateToDelete] = useState<string | null>(null);
  const [noteTemplateSaving, setNoteTemplateSaving] = useState(false);

  // Email Templates state
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplateItem[]>([]);
  const [emailTemplatesLoading, setEmailTemplatesLoading] = useState(false);
  const [emailTemplateSearch, setEmailTemplateSearch] = useState("");
  const [emailTemplateFilterTab, setEmailTemplateFilterTab] = useState<"all" | "active" | "inactive">("all");
  const [emailTemplateSheetOpen, setEmailTemplateSheetOpen] = useState(false);
  const [editingEmailTemplateId, setEditingEmailTemplateId] = useState<string | null>(null);
  const [emailTemplateForm, setEmailTemplateForm] = useState(defaultEmailTemplateForm);
  const [emailTemplateToast, setEmailTemplateToast] = useState({ show: false, message: "" });
  const [emailTemplateToDelete, setEmailTemplateToDelete] = useState<string | null>(null);
  const [emailTemplateSaving, setEmailTemplateSaving] = useState(false);

  const showNoteTemplateToast = useCallback((message: string) => {
    setNoteTemplateToast({ show: true, message });
    setTimeout(() => setNoteTemplateToast({ show: false, message: "" }), 3000);
  }, []);

  const fetchNoteTemplates = useCallback(async () => {
    setNoteTemplatesLoading(true);
    try {
      const res = await fetch("/api/note-templates");
      if (res.ok) {
        const data = await res.json();
        setNoteTemplates(data);
      }
    } catch {
      /* silently fail for now */
    } finally {
      setNoteTemplatesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "noteTemplates" && noteTemplates.length === 0) {
      fetchNoteTemplates();
    }
  }, [activeTab, noteTemplates.length, fetchNoteTemplates]);

  const filteredNoteTemplates = useMemo(() => {
    let list = [...noteTemplates];
    if (noteTemplateFilterTab === "active") list = list.filter((t) => t.active);
    else if (noteTemplateFilterTab === "inactive") list = list.filter((t) => !t.active);
    if (noteTemplateSearch) {
      const s = noteTemplateSearch.toLowerCase();
      list = list.filter((t) => t.name.toLowerCase().includes(s) || t.title.toLowerCase().includes(s));
    }
    return list;
  }, [noteTemplates, noteTemplateFilterTab, noteTemplateSearch]);

  const noteTemplateCounts = useMemo(() => ({
    all: noteTemplates.length,
    active: noteTemplates.filter((t) => t.active).length,
    inactive: noteTemplates.filter((t) => !t.active).length,
  }), [noteTemplates]);

  const openNoteTemplatePanel = (mode: "new" | "edit", id?: string) => {
    if (mode === "edit" && id) {
      const tpl = noteTemplates.find((t) => t.id === id);
      if (tpl) {
        setEditingTemplateId(id);
        setNoteTemplateForm({
          name: tpl.name,
          title: tpl.title,
          body: tpl.body,
          category: tpl.category,
          description: tpl.description,
          active: tpl.active,
        });
      }
    } else {
      setEditingTemplateId(null);
      setNoteTemplateForm(defaultNoteTemplateForm);
    }
    setNoteTemplateSheetOpen(true);
  };

  const closeNoteTemplatePanel = () => {
    setNoteTemplateSheetOpen(false);
    setEditingTemplateId(null);
  };

  const saveNoteTemplate = async () => {
    if (!noteTemplateForm.name.trim()) return;
    setNoteTemplateSaving(true);
    try {
      if (editingTemplateId) {
        const res = await fetch(`/api/note-templates/${editingTemplateId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(noteTemplateForm),
        });
        if (res.ok) {
          await fetchNoteTemplates();
          showNoteTemplateToast("Template updated");
        }
      } else {
        const res = await fetch("/api/note-templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(noteTemplateForm),
        });
        if (res.ok) {
          await fetchNoteTemplates();
          showNoteTemplateToast("Template created");
        }
      }
      closeNoteTemplatePanel();
    } finally {
      setNoteTemplateSaving(false);
    }
  };

  const duplicateNoteTemplate = async (id: string) => {
    const tpl = noteTemplates.find((t) => t.id === id);
    if (!tpl) return;
    const res = await fetch("/api/note-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `${tpl.name} (copy)`,
        title: tpl.title,
        body: tpl.body,
        active: false,
      }),
    });
    if (res.ok) {
      await fetchNoteTemplates();
      showNoteTemplateToast("Template duplicated — edit to customise");
    }
  };

  const deleteNoteTemplate = async (id: string) => {
    const res = await fetch(`/api/note-templates/${id}`, { method: "DELETE" });
    if (res.ok) {
      await fetchNoteTemplates();
      showNoteTemplateToast("Template deleted");
    }
  };

  // Email template helpers
  const showEmailTemplateToast = useCallback((message: string) => {
    setEmailTemplateToast({ show: true, message });
    setTimeout(() => setEmailTemplateToast({ show: false, message: "" }), 3000);
  }, []);

  const fetchEmailTemplates = useCallback(async () => {
    setEmailTemplatesLoading(true);
    try {
      const res = await fetch("/api/email-templates");
      if (res.ok) {
        const data = await res.json();
        setEmailTemplates(data);
      }
    } catch {
      /* silently fail */
    } finally {
      setEmailTemplatesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "templates" && emailTemplates.length === 0) {
      fetchEmailTemplates();
    }
  }, [activeTab, emailTemplates.length, fetchEmailTemplates]);

  const filteredEmailTemplates = useMemo(() => {
    let list = [...emailTemplates];
    if (emailTemplateFilterTab === "active") list = list.filter((t) => t.active);
    else if (emailTemplateFilterTab === "inactive") list = list.filter((t) => !t.active);
    if (emailTemplateSearch) {
      const s = emailTemplateSearch.toLowerCase();
      list = list.filter((t) => t.name.toLowerCase().includes(s) || t.subject.toLowerCase().includes(s));
    }
    return list;
  }, [emailTemplates, emailTemplateFilterTab, emailTemplateSearch]);

  const emailTemplateCounts = useMemo(() => ({
    all: emailTemplates.length,
    active: emailTemplates.filter((t) => t.active).length,
    inactive: emailTemplates.filter((t) => !t.active).length,
  }), [emailTemplates]);

  const openEmailTemplatePanel = (mode: "new" | "edit", id?: string) => {
    if (mode === "edit" && id) {
      const tpl = emailTemplates.find((t) => t.id === id);
      if (tpl) {
        setEditingEmailTemplateId(id);
        setEmailTemplateForm({
          name: tpl.name,
          subject: tpl.subject,
          body: tpl.body,
          category: tpl.category,
          description: tpl.description,
          active: tpl.active,
        });
      }
    } else {
      setEditingEmailTemplateId(null);
      setEmailTemplateForm(defaultEmailTemplateForm);
    }
    setEmailTemplateSheetOpen(true);
  };

  const closeEmailTemplatePanel = () => {
    setEmailTemplateSheetOpen(false);
    setEditingEmailTemplateId(null);
  };

  const saveEmailTemplate = async () => {
    if (!emailTemplateForm.name.trim()) return;
    setEmailTemplateSaving(true);
    try {
      if (editingEmailTemplateId) {
        const res = await fetch(`/api/email-templates/${editingEmailTemplateId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(emailTemplateForm),
        });
        if (res.ok) {
          await fetchEmailTemplates();
          showEmailTemplateToast("Template updated");
        }
      } else {
        const res = await fetch("/api/email-templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(emailTemplateForm),
        });
        if (res.ok) {
          await fetchEmailTemplates();
          showEmailTemplateToast("Template created");
        }
      }
      closeEmailTemplatePanel();
    } finally {
      setEmailTemplateSaving(false);
    }
  };

  const duplicateEmailTemplate = async (id: string) => {
    const tpl = emailTemplates.find((t) => t.id === id);
    if (!tpl) return;
    const res = await fetch("/api/email-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `${tpl.name} (copy)`,
        subject: tpl.subject,
        body: tpl.body,
        category: tpl.category,
        description: tpl.description,
        active: false,
      }),
    });
    if (res.ok) {
      await fetchEmailTemplates();
      showEmailTemplateToast("Template duplicated — edit to customise");
    }
  };

  const deleteEmailTemplate = async (id: string) => {
    const res = await fetch(`/api/email-templates/${id}`, { method: "DELETE" });
    if (res.ok) {
      await fetchEmailTemplates();
      showEmailTemplateToast("Template deleted");
    }
  };

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

  // Case Types: derived list for SLA dropdown (active names only)
  const caseTypeNames = useMemo(() => caseTypes.filter((ct) => ct.active).map((ct) => ct.name), [caseTypes]);
  const filteredCaseTypes = useMemo(() => {
    let list = [...caseTypes];
    if (caseTypeFilterTab === "active") list = list.filter((ct) => ct.active);
    else if (caseTypeFilterTab === "inactive") list = list.filter((ct) => !ct.active);
    if (caseTypeSearch.trim()) {
      const q = caseTypeSearch.toLowerCase();
      list = list.filter(
        (ct) =>
          ct.name.toLowerCase().includes(q) ||
          (ct.primaryContactReason && ct.primaryContactReason.toLowerCase().includes(q))
      );
    }
    return list;
  }, [caseTypes, caseTypeFilterTab, caseTypeSearch]);
  const caseTypeCounts = useMemo(
    () => ({
      all: caseTypes.length,
      active: caseTypes.filter((ct) => ct.active).length,
      inactive: caseTypes.filter((ct) => !ct.active).length,
    }),
    [caseTypes]
  );
  const showCaseTypeToast = (message: string) => {
    setCaseTypeToast({ show: true, message });
    setTimeout(() => setCaseTypeToast({ show: false, message: "" }), 3000);
  };
  const openCaseTypePanel = (mode: "new" | "edit", id?: string) => {
    if (mode === "edit" && id) {
      const ct = caseTypes.find((c) => c.id === id);
      if (ct) {
        setEditingCaseTypeId(id);
        setCaseTypeForm({
          name: ct.name,
          primaryContactReason: ct.primaryContactReason || "",
          active: ct.active,
        });
      }
    } else {
      setEditingCaseTypeId(null);
      setCaseTypeForm({ name: "", primaryContactReason: "", active: true });
    }
    setCaseTypeSheetOpen(true);
  };
  const closeCaseTypePanel = () => {
    setCaseTypeSheetOpen(false);
    setEditingCaseTypeId(null);
  };
  const saveCaseType = () => {
    const name = caseTypeForm.name.trim();
    if (!name) return;
    if (editingCaseTypeId) {
      setCaseTypes((prev) =>
        prev.map((ct) =>
          ct.id === editingCaseTypeId
            ? { ...ct, name, primaryContactReason: caseTypeForm.primaryContactReason, active: caseTypeForm.active }
            : ct
        )
      );
      showCaseTypeToast("Case type updated");
    } else {
      setCaseTypes((prev) => [
        ...prev,
        {
          id: `ct-${Date.now()}`,
          name,
          primaryContactReason: caseTypeForm.primaryContactReason,
          active: caseTypeForm.active,
        },
      ]);
      showCaseTypeToast("Case type created");
    }
    closeCaseTypePanel();
  };
  const duplicateCaseType = (id: string) => {
    const ct = caseTypes.find((c) => c.id === id);
    if (!ct) return;
    setCaseTypes((prev) => [
      ...prev,
      { ...ct, id: `ct-${Date.now()}`, name: `${ct.name} (copy)`, active: false },
    ]);
    showCaseTypeToast("Case type duplicated — edit to customise");
  };
  const deleteCaseType = (id: string) => {
    setCaseTypes((prev) => prev.filter((ct) => ct.id !== id));
    showCaseTypeToast("Case type deleted");
    setCaseTypeToDelete(null);
  };

  // Case Groups (context)
  const groups = caseClassification?.groups ?? [];
  const setGroups = caseClassification?.setGroups ?? (() => {});
  const showGroupToast = (message: string) => {
    setGroupToast({ show: true, message });
    setTimeout(() => setGroupToast({ show: false, message: "" }), 3000);
  };
  const openGroupPanel = (mode: "new" | "edit", id?: string) => {
    if (mode === "edit" && id) {
      const g = groups.find((x) => x.id === id);
      if (g) {
        setEditingGroupId(id);
        setGroupForm({ name: g.name, caseClass: g.caseClass, types: g.types.map((t) => ({ label: t.label })) });
      }
    } else {
      setEditingGroupId(null);
      setGroupForm({ name: "", caseClass: "Enquiry", types: [{ label: "" }] });
    }
    setGroupSheetOpen(true);
  };
  const closeGroupPanel = () => {
    setGroupSheetOpen(false);
    setEditingGroupId(null);
  };
  const addGroupFormTypeRow = () => {
    setGroupForm((f) => ({ ...f, types: [...f.types, { label: "" }] }));
  };
  const removeGroupFormTypeRow = (index: number) => {
    setGroupForm((f) => ({ ...f, types: f.types.filter((_, i) => i !== index) }));
  };
  const updateGroupFormTypeLabel = (index: number, value: string) => {
    setGroupForm((f) => ({
      ...f,
      types: f.types.map((t, i) => (i === index ? { ...t, label: value } : t)),
    }));
  };
  const saveGroup = () => {
    const name = groupForm.name.trim();
    if (!name || !caseClassification) return;
    const types = groupForm.types.map((t) => ({ label: t.label.trim() })).filter((t) => t.label);
    if (editingGroupId) {
      setGroups((prev) =>
        prev.map((g) =>
          g.id === editingGroupId ? { ...g, name, caseClass: groupForm.caseClass, types } : g
        )
      );
      showGroupToast("Case group updated");
    } else {
      setGroups((prev) => [
        ...prev,
        { id: `cg-${Date.now()}`, name, caseClass: groupForm.caseClass, types: types.length ? types : [{ label: "New type" }] },
      ]);
      showGroupToast("Case group created");
    }
    closeGroupPanel();
  };
  const deleteGroup = (id: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== id));
    showGroupToast("Case group deleted");
    setGroupToDelete(null);
  };

  const isRegulatoryCaseClass = slaForm.caseClass === "Complaint" || slaForm.caseClass === "Life Support";

  return (
    <div className="min-w-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-[1600px] p-density-xl">
        {/* Page header */}
        <div className="mb-density-xl">
          <h1
            className="font-bold text-gray-900 dark:text-gray-100"
            style={{
              fontSize: "var(--tally-font-size-3xl)",
              lineHeight: "var(--tally-line-height-tight)",
            }}
          >
            Settings &amp; User Access
          </h1>
        </div>

        <div className="grid min-w-0 grid-cols-[minmax(160px,240px)_1fr] gap-density-lg">
          {/* Settings nav */}
          <nav className="sticky top-0 min-w-0 shrink-0 self-start overflow-y-auto" style={{ maxHeight: "calc(100vh - 4rem)" }}>
            <div className="flex flex-col gap-0">
              {SETTINGS_CATEGORIES.map((category) => {
                const tabs = category.tabKeys
                  .map((key) => SETTINGS_TABS.find((t) => t.key === key))
                  .filter(Boolean) as typeof SETTINGS_TABS;
                return (
                  <div key={category.label} className="pt-4 first:pt-0">
                    <p
                      className="mb-1.5 px-density-md py-0.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                      style={{ fontSize: "var(--tally-font-size-xs)" }}
                    >
                      {category.label}
                    </p>
                    <div className="flex flex-col gap-0">
                      {tabs.map((tab) => {
                        const isActive = activeTab === tab.key;
                        return (
                          <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActiveTab(tab.key)}
                            className={cn(
                              "flex w-full items-center gap-density-md rounded-density-md px-density-md py-2 transition-colors",
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
                  </div>
                );
              })}
            </div>
          </nav>

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

            {/* Case Classes (SLA / case class: Complaint, General Enquiry, EWR, etc.) */}
            {activeTab === "caseClasses" && (
              <Card className="shadow-none">
                <SectionHeader
                  title="Case Classes"
                  description="Configure case classes and optional primary contact reason for reporting, routing, and SLA."
                  action={
                    <Button size="sm" className="gap-1.5" onClick={() => openCaseTypePanel("new")}>
                      <Icon name="add" size="var(--tally-icon-size-sm)" />
                      New Case Type
                    </Button>
                  }
                />
                <div className="px-density-lg pb-density-lg">
                  <div className="mb-density-md mt-density-lg flex flex-wrap items-center gap-density-md">
                    <div className="flex border-b border-border dark:border-gray-700">
                      {[
                        { key: "all" as const, label: "All", count: caseTypeCounts.all },
                        { key: "active" as const, label: "Active", count: caseTypeCounts.active },
                        { key: "inactive" as const, label: "Inactive", count: caseTypeCounts.inactive },
                      ].map(({ key, label, count }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setCaseTypeFilterTab(key)}
                          className={cn(
                            "flex items-center gap-density-sm border-b-2 px-density-md py-density-sm font-medium transition-colors",
                            caseTypeFilterTab === key
                              ? "border-[#2C365D] text-[#2C365D] dark:border-[#7c8cb8] dark:text-[#7c8cb8]"
                              : "border-transparent text-muted-foreground hover:text-gray-900 dark:hover:text-gray-100"
                          )}
                          style={{ fontSize: "var(--tally-font-size-sm)" }}
                        >
                          {label}
                          <span
                            className={cn(
                              "inline-flex min-w-[18px] items-center justify-center rounded-full px-density-sm font-semibold",
                              caseTypeFilterTab === key ? "bg-[#2C365D]/10 text-[#2C365D] dark:bg-[#7c8cb8]/10 dark:text-[#7c8cb8]" : "bg-gray-200 text-muted-foreground dark:bg-gray-700 dark:text-gray-400"
                            )}
                            style={{ height: "var(--tally-spacing-lg)", fontSize: "var(--tally-font-size-xs)" }}
                          >
                            {count}
                          </span>
                        </button>
                      ))}
                    </div>
                    <div className="relative max-w-[320px] flex-1">
                      <Icon name="search" size="var(--tally-icon-size-sm)" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search case types..."
                        value={caseTypeSearch}
                        onChange={(e) => setCaseTypeSearch(e.target.value)}
                        className="h-9 w-full rounded-density-md border border-border bg-white pl-9 pr-density-sm outline-none placeholder:text-muted-foreground focus:border-[#2C365D] focus:ring-1 focus:ring-[#2C365D] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                        style={{ fontSize: "var(--tally-font-size-sm)", paddingTop: "var(--tally-spacing-sm)", paddingBottom: "var(--tally-spacing-sm)" }}
                      />
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-density-md border border-border dark:border-gray-700">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="bg-gray-50 font-medium uppercase tracking-wider text-muted-foreground dark:bg-gray-800/50" style={{ fontSize: "var(--tally-font-size-xs)" }}>Name</TableHead>
                          <TableHead className="bg-gray-50 font-medium uppercase tracking-wider text-muted-foreground dark:bg-gray-800/50" style={{ fontSize: "var(--tally-font-size-xs)" }}>Primary contact reason</TableHead>
                          <TableHead className="w-24 bg-gray-50 font-medium uppercase tracking-wider text-muted-foreground dark:bg-gray-800/50" style={{ fontSize: "var(--tally-font-size-xs)" }}>Status</TableHead>
                          <TableHead className="w-24 bg-gray-50 dark:bg-gray-800/50" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCaseTypes.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="py-density-xl text-center text-muted-foreground" style={{ fontSize: "var(--tally-font-size-sm)" }}>
                              {caseTypes.length === 0 ? "No case types yet. Create one to get started." : "No case types match your filters."}
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredCaseTypes.map((ct) => (
                            <TableRow key={ct.id} className="group">
                              <TableCell>
                                <div className="font-medium text-gray-900 dark:text-gray-100" style={{ fontSize: "var(--tally-font-size-sm)" }}>
                                  {ct.name}
                                </div>
                              </TableCell>
                              <TableCell className="text-muted-foreground" style={{ fontSize: "var(--tally-font-size-sm)" }}>
                                {ct.primaryContactReason || "—"}
                              </TableCell>
                              <TableCell>
                                <Badge variant={ct.active ? "success" : "outline"} className={cn("whitespace-nowrap", !ct.active && "text-muted-foreground")}>
                                  {ct.active ? "● Active" : "○ Inactive"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-density-xs opacity-0 transition-opacity group-hover:opacity-100">
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openCaseTypePanel("edit", ct.id)} title="Edit">
                                    <Icon name="edit" size="var(--tally-icon-size-sm)" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => duplicateCaseType(ct.id)} title="Duplicate">
                                    <Icon name="content_copy" size="var(--tally-icon-size-sm)" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-[#C40000]/10 hover:text-[#C40000]" onClick={() => setCaseTypeToDelete(ct.id)} title="Delete">
                                    <Icon name="delete" size="var(--tally-icon-size-sm)" />
                                  </Button>
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

            {/* Case Types (Group → Type → Reason: New Case dropdown config) */}
            {activeTab === "caseTypes" && (
              <Card className="shadow-none">
                <SectionHeader
                  title="Case Types"
                  description="Configure case groups and their types for the New Case form (Group → Type)."
                  action={
                    caseClassification ? (
                      <Button size="sm" className="gap-1.5" onClick={() => openGroupPanel("new")}>
                        <Icon name="add" size="var(--tally-icon-size-sm)" />
                        New Group
                      </Button>
                    ) : null
                  }
                />
                <div className="px-density-lg pb-density-lg space-y-density-xl">
                  {!caseClassification ? (
                    <p className="py-density-lg text-muted-foreground" style={{ fontSize: "var(--tally-font-size-sm)" }}>
                      Case classification is not available. Ensure you are within the CRM layout.
                    </p>
                  ) : (
                    <>
                      <div>
                        <h3 className="mb-density-xs font-semibold text-gray-900 dark:text-gray-100" style={{ fontSize: "var(--tally-font-size-sm)" }}>Case groups & types</h3>
                        <p className="mb-density-md text-muted-foreground" style={{ fontSize: "var(--tally-font-size-xs)" }}>Groups are the top-level dropdown in New Case; each group contains types.</p>
                        <div className="overflow-hidden rounded-density-md border border-border dark:border-gray-700">
                          <Table>
                            <TableHeader>
                              <TableRow className="hover:bg-transparent">
                                <TableHead className="bg-gray-50 font-medium uppercase tracking-wider text-muted-foreground dark:bg-gray-800/50" style={{ fontSize: "var(--tally-font-size-xs)" }}>Group</TableHead>
                                <TableHead className="bg-gray-50 font-medium uppercase tracking-wider text-muted-foreground dark:bg-gray-800/50" style={{ fontSize: "var(--tally-font-size-xs)" }}>Types</TableHead>
                                <TableHead className="w-28 bg-gray-50 font-medium uppercase tracking-wider text-muted-foreground dark:bg-gray-800/50" style={{ fontSize: "var(--tally-font-size-xs)" }}>Case class</TableHead>
                                <TableHead className="w-24 bg-gray-50 dark:bg-gray-800/50" />
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {groups.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={4} className="py-density-xl text-center text-muted-foreground" style={{ fontSize: "var(--tally-font-size-sm)" }}>No case groups. Add one to configure the New Case dropdown.</TableCell>
                                </TableRow>
                              ) : (
                                groups.map((g) => (
                                  <TableRow key={g.id} className="group">
                                    <TableCell className="font-medium text-gray-900 dark:text-gray-100" style={{ fontSize: "var(--tally-font-size-sm)" }}>{g.name}</TableCell>
                                    <TableCell className="text-muted-foreground" style={{ fontSize: "var(--tally-font-size-xs)" }}>
                                      {g.types.length} type{g.types.length !== 1 ? "s" : ""}
                                    </TableCell>
                                    <TableCell><Badge variant="outline" className="text-muted-foreground">{g.caseClass}</Badge></TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex items-center justify-end gap-density-xs opacity-0 transition-opacity group-hover:opacity-100">
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openGroupPanel("edit", g.id)} title="Edit"><Icon name="edit" size="var(--tally-icon-size-sm)" /></Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-[#C40000]/10 hover:text-[#C40000]" onClick={() => setGroupToDelete(g.id)} title="Delete"><Icon name="delete" size="var(--tally-icon-size-sm)" /></Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </>
                  )}
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
                        {caseTypeNames.map((ct) => (
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

            {/* Email Templates */}
            {activeTab === "templates" && (
              <Card className="shadow-none">
                <SectionHeader
                  title="Email Templates"
                  description="Create reusable templates to prefill emails when composing from a case."
                  action={
                    <Button size="sm" className="gap-1.5" onClick={() => openEmailTemplatePanel("new")}>
                      <Icon name="add" size="var(--tally-icon-size-sm)" />
                      New Template
                    </Button>
                  }
                />
                <div className="px-density-lg pb-density-lg">
                  <div className="mb-density-md mt-density-lg flex border-b border-border dark:border-gray-700">
                    {([
                      { key: "all" as const, label: "All", count: emailTemplateCounts.all },
                      { key: "active" as const, label: "Active", count: emailTemplateCounts.active },
                      { key: "inactive" as const, label: "Inactive", count: emailTemplateCounts.inactive },
                    ]).map(({ key, label, count }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setEmailTemplateFilterTab(key)}
                        className={cn(
                          "flex items-center gap-density-sm border-b-2 px-density-md py-density-sm font-medium transition-colors",
                          emailTemplateFilterTab === key
                            ? "border-[#2C365D] text-[#2C365D] dark:border-[#7c8cb8] dark:text-[#7c8cb8]"
                            : "border-transparent text-muted-foreground hover:text-gray-900 dark:hover:text-gray-100"
                        )}
                        style={{ fontSize: "var(--tally-font-size-sm)" }}
                      >
                        {label}
                        <span
                          className={cn(
                            "inline-flex min-w-[18px] items-center justify-center rounded-full px-density-sm font-semibold",
                            emailTemplateFilterTab === key ? "bg-[#2C365D]/10 text-[#2C365D] dark:bg-[#7c8cb8]/10 dark:text-[#7c8cb8]" : "bg-gray-200 text-muted-foreground dark:bg-gray-700 dark:text-gray-400"
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
                        placeholder="Search templates..."
                        value={emailTemplateSearch}
                        onChange={(e) => setEmailTemplateSearch(e.target.value)}
                        className="h-9 w-full rounded-density-md border border-border bg-white pl-9 pr-density-sm outline-none placeholder:text-muted-foreground focus:border-[#2C365D] focus:ring-1 focus:ring-[#2C365D] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                        style={{ fontSize: "var(--tally-font-size-sm)", paddingTop: "var(--tally-spacing-sm)", paddingBottom: "var(--tally-spacing-sm)" }}
                      />
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-density-md border border-border dark:border-gray-700">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="bg-gray-50 font-medium uppercase tracking-wider text-muted-foreground dark:bg-gray-800/50" style={{ fontSize: "var(--tally-font-size-xs)" }}>Template name</TableHead>
                          <TableHead className="w-28 bg-gray-50 font-medium uppercase tracking-wider text-muted-foreground dark:bg-gray-800/50" style={{ fontSize: "var(--tally-font-size-xs)" }}>Category</TableHead>
                          <TableHead className="bg-gray-50 font-medium uppercase tracking-wider text-muted-foreground dark:bg-gray-800/50" style={{ fontSize: "var(--tally-font-size-xs)" }}>Default subject</TableHead>
                          <TableHead className="w-24 bg-gray-50 font-medium uppercase tracking-wider text-muted-foreground dark:bg-gray-800/50" style={{ fontSize: "var(--tally-font-size-xs)" }}>Status</TableHead>
                          <TableHead className="w-24 bg-gray-50 dark:bg-gray-800/50" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {emailTemplatesLoading ? (
                          <TableRow>
                            <TableCell colSpan={5} className="py-density-xl text-center text-muted-foreground" style={{ fontSize: "var(--tally-font-size-sm)" }}>
                              Loading…
                            </TableCell>
                          </TableRow>
                        ) : filteredEmailTemplates.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="py-density-xl text-center text-muted-foreground" style={{ fontSize: "var(--tally-font-size-sm)" }}>
                              {emailTemplates.length === 0 ? "No templates yet. Create one to get started." : "No templates match your filters."}
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredEmailTemplates.map((tpl) => (
                            <TableRow key={tpl.id} className="group">
                              <TableCell>
                                <div className="font-medium text-gray-900 dark:text-gray-100" style={{ fontSize: "var(--tally-font-size-sm)" }}>
                                  {tpl.name}
                                </div>
                                {tpl.description && (
                                  <div className="line-clamp-1 text-muted-foreground" style={{ fontSize: "var(--tally-font-size-xs)" }}>
                                    {tpl.description.slice(0, 80)}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                {tpl.category ? (
                                  <Badge variant="outline" className="text-muted-foreground">{tpl.category}</Badge>
                                ) : (
                                  <span className="text-muted-foreground" style={{ fontSize: "var(--tally-font-size-sm)" }}>—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-muted-foreground" style={{ fontSize: "var(--tally-font-size-sm)" }}>
                                {tpl.subject || "—"}
                              </TableCell>
                              <TableCell>
                                <Badge variant={tpl.active ? "success" : "outline"} className={cn("whitespace-nowrap", !tpl.active && "text-muted-foreground")}>
                                  {tpl.active ? "● Active" : "○ Inactive"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-density-xs opacity-0 transition-opacity group-hover:opacity-100">
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEmailTemplatePanel("edit", tpl.id)} title="Edit">
                                    <Icon name="edit" size="var(--tally-icon-size-sm)" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => duplicateEmailTemplate(tpl.id)} title="Duplicate">
                                    <Icon name="content_copy" size="var(--tally-icon-size-sm)" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-[#C40000]/10 hover:text-[#C40000]" onClick={() => setEmailTemplateToDelete(tpl.id)} title="Delete">
                                    <Icon name="delete" size="var(--tally-icon-size-sm)" />
                                  </Button>
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

            {/* Note Templates */}
            {activeTab === "noteTemplates" && (
              <Card className="shadow-none">
                <SectionHeader
                  title="Note Templates"
                  description="Create reusable templates to prefill notes when adding them to a case."
                  action={
                    <Button size="sm" className="gap-1.5" onClick={() => openNoteTemplatePanel("new")}>
                      <Icon name="add" size="var(--tally-icon-size-sm)" />
                      New Template
                    </Button>
                  }
                />
                <div className="px-density-lg pb-density-lg">
                  <div className="mb-density-md mt-density-lg flex border-b border-border dark:border-gray-700">
                    {([
                      { key: "all" as const, label: "All", count: noteTemplateCounts.all },
                      { key: "active" as const, label: "Active", count: noteTemplateCounts.active },
                      { key: "inactive" as const, label: "Inactive", count: noteTemplateCounts.inactive },
                    ]).map(({ key, label, count }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setNoteTemplateFilterTab(key)}
                        className={cn(
                          "flex items-center gap-density-sm border-b-2 px-density-md py-density-sm font-medium transition-colors",
                          noteTemplateFilterTab === key
                            ? "border-[#2C365D] text-[#2C365D] dark:border-[#7c8cb8] dark:text-[#7c8cb8]"
                            : "border-transparent text-muted-foreground hover:text-gray-900 dark:hover:text-gray-100"
                        )}
                        style={{ fontSize: "var(--tally-font-size-sm)" }}
                      >
                        {label}
                        <span
                          className={cn(
                            "inline-flex min-w-[18px] items-center justify-center rounded-full px-density-sm font-semibold",
                            noteTemplateFilterTab === key ? "bg-[#2C365D]/10 text-[#2C365D] dark:bg-[#7c8cb8]/10 dark:text-[#7c8cb8]" : "bg-gray-200 text-muted-foreground dark:bg-gray-700 dark:text-gray-400"
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
                        placeholder="Search templates..."
                        value={noteTemplateSearch}
                        onChange={(e) => setNoteTemplateSearch(e.target.value)}
                        className="h-9 w-full rounded-density-md border border-border bg-white pl-9 pr-density-sm outline-none placeholder:text-muted-foreground focus:border-[#2C365D] focus:ring-1 focus:ring-[#2C365D] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                        style={{ fontSize: "var(--tally-font-size-sm)", paddingTop: "var(--tally-spacing-sm)", paddingBottom: "var(--tally-spacing-sm)" }}
                      />
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-density-md border border-border dark:border-gray-700">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="bg-gray-50 font-medium uppercase tracking-wider text-muted-foreground dark:bg-gray-800/50" style={{ fontSize: "var(--tally-font-size-xs)" }}>Template name</TableHead>
                          <TableHead className="w-28 bg-gray-50 font-medium uppercase tracking-wider text-muted-foreground dark:bg-gray-800/50" style={{ fontSize: "var(--tally-font-size-xs)" }}>Category</TableHead>
                          <TableHead className="bg-gray-50 font-medium uppercase tracking-wider text-muted-foreground dark:bg-gray-800/50" style={{ fontSize: "var(--tally-font-size-xs)" }}>Default title</TableHead>
                          <TableHead className="w-24 bg-gray-50 font-medium uppercase tracking-wider text-muted-foreground dark:bg-gray-800/50" style={{ fontSize: "var(--tally-font-size-xs)" }}>Status</TableHead>
                          <TableHead className="w-24 bg-gray-50 dark:bg-gray-800/50" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {noteTemplatesLoading ? (
                          <TableRow>
                            <TableCell colSpan={5} className="py-density-xl text-center text-muted-foreground" style={{ fontSize: "var(--tally-font-size-sm)" }}>
                              Loading…
                            </TableCell>
                          </TableRow>
                        ) : filteredNoteTemplates.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="py-density-xl text-center text-muted-foreground" style={{ fontSize: "var(--tally-font-size-sm)" }}>
                              {noteTemplates.length === 0 ? "No templates yet. Create one to get started." : "No templates match your filters."}
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredNoteTemplates.map((tpl) => (
                            <TableRow key={tpl.id} className="group">
                              <TableCell>
                                <div className="font-medium text-gray-900 dark:text-gray-100" style={{ fontSize: "var(--tally-font-size-sm)" }}>
                                  {tpl.name}
                                </div>
                                {tpl.description && (
                                  <div className="line-clamp-1 text-muted-foreground" style={{ fontSize: "var(--tally-font-size-xs)" }}>
                                    {tpl.description.slice(0, 80)}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                {tpl.category ? (
                                  <Badge variant="outline" className="text-muted-foreground">{tpl.category}</Badge>
                                ) : (
                                  <span className="text-muted-foreground" style={{ fontSize: "var(--tally-font-size-sm)" }}>—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-muted-foreground" style={{ fontSize: "var(--tally-font-size-sm)" }}>
                                {tpl.title || "—"}
                              </TableCell>
                              <TableCell>
                                <Badge variant={tpl.active ? "success" : "outline"} className={cn("whitespace-nowrap", !tpl.active && "text-muted-foreground")}>
                                  {tpl.active ? "● Active" : "○ Inactive"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-density-xs opacity-0 transition-opacity group-hover:opacity-100">
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openNoteTemplatePanel("edit", tpl.id)} title="Edit">
                                    <Icon name="edit" size="var(--tally-icon-size-sm)" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => duplicateNoteTemplate(tpl.id)} title="Duplicate">
                                    <Icon name="content_copy" size="var(--tally-icon-size-sm)" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-[#C40000]/10 hover:text-[#C40000]" onClick={() => setNoteTemplateToDelete(tpl.id)} title="Delete">
                                    <Icon name="delete" size="var(--tally-icon-size-sm)" />
                                  </Button>
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

            {/* Business Hours (Cases) */}
            {activeTab === "businessHours" && (
              <Card className="shadow-none">
                <SectionHeader
                  title="Business Hours"
                  description="Define when the organisation is considered open. Used for SLA clock (business hours only), auto-acknowledgement (inside vs outside hours), and after-hours behaviour."
                />
                <CardContent className="p-density-lg pt-density-xl">
                  <div className="space-y-density-xl">
                    <div className="max-w-[380px]">
                      <label className="mb-density-sm block font-medium text-gray-700 dark:text-gray-300" style={{ fontSize: "var(--tally-font-size-sm)" }}>
                        Timezone
                      </label>
                      <Select
                        value={businessHoursTimezone}
                        onChange={(e) => setBusinessHoursTimezone(e.target.value)}
                        className="h-9 w-full border-border bg-white dark:border-gray-700 dark:bg-gray-900"
                      >
                        <option value="Australia/Brisbane">Australia/Brisbane (AEST/AEDT)</option>
                        <option value="Australia/Sydney">Australia/Sydney</option>
                        <option value="Australia/Melbourne">Australia/Melbourne</option>
                        <option value="Australia/Adelaide">Australia/Adelaide</option>
                        <option value="Australia/Perth">Australia/Perth</option>
                        <option value="UTC">UTC</option>
                      </Select>
                      <p className="mt-density-xs text-muted-foreground" style={{ fontSize: "var(--tally-font-size-xs)", lineHeight: 1.4 }}>
                        All business hours and SLA calculations use this timezone.
                      </p>
                    </div>

                    <div>
                      <label className="mb-density-sm block font-medium text-gray-700 dark:text-gray-300" style={{ fontSize: "var(--tally-font-size-sm)" }}>
                        Working days
                      </label>
                      <div className="flex flex-wrap gap-x-density-lg gap-y-density-sm">
                        {[
                          { key: "mon", label: "Mon" },
                          { key: "tue", label: "Tue" },
                          { key: "wed", label: "Wed" },
                          { key: "thu", label: "Thu" },
                          { key: "fri", label: "Fri" },
                          { key: "sat", label: "Sat" },
                          { key: "sun", label: "Sun" },
                        ].map(({ key, label }) => (
                          <Checkbox
                            key={key}
                            id={`business-hours-day-${key}`}
                            label={label}
                            checked={businessHoursDays[key] ?? false}
                            onChange={(e) => setBusinessHoursDays((prev) => ({ ...prev, [key]: e.target.checked }))}
                            className="shrink-0"
                          />
                        ))}
                      </div>
                      <p className="mt-density-xs text-muted-foreground" style={{ fontSize: "var(--tally-font-size-xs)", lineHeight: 1.4 }}>
                        Days outside this set are treated as non-business (e.g. weekends).
                      </p>
                    </div>

                    <div className="flex flex-wrap items-end gap-density-lg">
                      <div>
                        <label className="mb-density-xs block font-medium text-gray-700 dark:text-gray-300" style={{ fontSize: "var(--tally-font-size-sm)" }}>
                          Start time
                        </label>
                        <Input
                          type="time"
                          value={businessHoursStart}
                          onChange={(e) => setBusinessHoursStart(e.target.value)}
                          className="h-9 w-[140px]"
                        />
                      </div>
                      <div>
                        <label className="mb-density-xs block font-medium text-gray-700 dark:text-gray-300" style={{ fontSize: "var(--tally-font-size-sm)" }}>
                          End time
                        </label>
                        <Input
                          type="time"
                          value={businessHoursEnd}
                          onChange={(e) => setBusinessHoursEnd(e.target.value)}
                          className="h-9 w-[140px]"
                        />
                      </div>
                    </div>
                    <p className="text-muted-foreground" style={{ fontSize: "var(--tally-font-size-xs)", lineHeight: 1.4 }}>
                      Business hours window each working day. Outside this window, cases are treated as outside business hours (e.g. for auto-ack variants and after-hours service orders).
                    </p>

                    <div className="max-w-[380px]">
                      <label className="mb-density-sm block font-medium text-gray-700 dark:text-gray-300" style={{ fontSize: "var(--tally-font-size-sm)" }}>
                        Public holiday calendar
                      </label>
                      <Select
                        value={businessHoursHolidayCalendar}
                        onChange={(e) => setBusinessHoursHolidayCalendar(e.target.value)}
                        className="h-9 w-full border-border bg-white dark:border-gray-700 dark:bg-gray-900"
                      >
                        <option value="national">National (gazetted public holidays)</option>
                        <option value="QLD">Queensland</option>
                        <option value="NSW">New South Wales</option>
                        <option value="VIC">Victoria</option>
                        <option value="SA">South Australia</option>
                        <option value="WA">Western Australia</option>
                        <option value="TAS">Tasmania</option>
                        <option value="ACT">Australian Capital Territory</option>
                        <option value="NT">Northern Territory</option>
                      </Select>
                      <div className="mt-density-sm flex items-start gap-density-sm rounded-density-md border border-[#2C365D]/30 bg-[#2C365D]/5 px-density-md py-density-sm dark:border-[#7c8cb8]/30 dark:bg-[#7c8cb8]/10">
                        <Icon name="info" size="var(--tally-icon-size-sm)" className="mt-0.5 shrink-0 text-[#2C365D] dark:text-[#7c8cb8]" />
                        <p className="text-muted-foreground" style={{ fontSize: "var(--tally-font-size-xs)", lineHeight: "var(--tally-line-height-normal)" }}>
                          National and state-based holidays are maintained by Tally as part of global system updates. Regional public holidays are not supported via automated calendars.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Cool Off Period (Cases) */}
            {activeTab === "coolOffPeriod" && (
              <Card className="shadow-none">
                <SectionHeader
                  title="Cool-Off Period"
                  description="When a customer replies to a closed case, control whether to reopen it or create a new child case."
                />
                <CardContent className="p-density-lg pt-density-xl">
                  <div className="space-y-density-lg">
                    <div
                      className="flex cursor-pointer items-center justify-between rounded-density-md border border-border bg-gray-50 px-density-md py-density-sm dark:border-gray-700 dark:bg-gray-800"
                      onClick={() => setCoolOffEnabled((v) => !v)}
                    >
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100" style={{ fontSize: "var(--tally-font-size-sm)" }}>
                          Enable cool-off period
                        </div>
                        <div className="text-muted-foreground" style={{ fontSize: "var(--tally-font-size-xs)", marginTop: "var(--tally-spacing-xs)" }}>
                          When enabled, replies to closed cases are evaluated against the cool-off window to decide behaviour
                        </div>
                      </div>
                      <div className="shrink-0">
                        <Switch
                          checked={coolOffEnabled}
                          onChange={(e) => setCoolOffEnabled((e.target as HTMLInputElement).checked)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>

                    {coolOffEnabled && (
                      <>
                        <div>
                          <label className="mb-density-xs block font-medium text-gray-700 dark:text-gray-300" style={{ fontSize: "var(--tally-font-size-sm)" }}>
                            Cool-off window
                          </label>
                          <div className="flex gap-density-sm">
                            <Input
                              type="number"
                              min={1}
                              value={coolOffDuration}
                              onChange={(e) => setCoolOffDuration(parseInt(e.target.value, 10) || 1)}
                              className="h-9 flex-1"
                            />
                            <Select
                              value={coolOffUnit}
                              onChange={(e) => setCoolOffUnit(e.target.value)}
                              className="h-9 w-[160px] shrink-0"
                            >
                              <option value="hours">hours</option>
                              <option value="business hours">business hours</option>
                              <option value="calendar days">calendar days</option>
                              <option value="business days">business days</option>
                            </Select>
                          </div>
                          <p className="mt-density-xs text-muted-foreground" style={{ fontSize: "var(--tally-font-size-xs)", lineHeight: 1.4 }}>
                            Time after case closure before a reply triggers the outside-window behaviour.
                          </p>
                        </div>

                        <div>
                          <label className="mb-density-sm block font-medium text-gray-700 dark:text-gray-300" style={{ fontSize: "var(--tally-font-size-sm)" }}>
                            How it works
                          </label>
                          <p className="mb-density-md text-muted-foreground" style={{ fontSize: "var(--tally-font-size-sm)", lineHeight: 1.5 }}>
                            The system applies different behaviour depending on when the customer replies:
                          </p>
                          <ul className="space-y-density-sm">
                            <li className="flex items-center gap-density-md rounded-density-md border border-border bg-gray-50 px-density-md py-density-sm dark:border-gray-700 dark:bg-gray-800">
                              <span className="h-2 w-2 shrink-0 rounded-full bg-[#006180] dark:bg-[#80E0FF]" aria-hidden />
                              <div>
                                <span className="font-medium text-gray-900 dark:text-gray-100" style={{ fontSize: "var(--tally-font-size-sm)" }}>
                                  Within {coolOffDuration} {coolOffUnit} of closure
                                </span>
                                <span className="text-muted-foreground" style={{ fontSize: "var(--tally-font-size-xs)" }}> — The original case is reopened with a new SLA clock.</span>
                              </div>
                            </li>
                            <li className="flex items-center gap-density-md rounded-density-md border border-border bg-gray-50 px-density-md py-density-sm dark:border-gray-700 dark:bg-gray-800">
                              <span className="h-2 w-2 shrink-0 rounded-full bg-[#006180] dark:bg-[#80E0FF]" aria-hidden />
                              <div>
                                <span className="font-medium text-gray-900 dark:text-gray-100" style={{ fontSize: "var(--tally-font-size-sm)" }}>
                                  After {coolOffDuration} {coolOffUnit}
                                </span>
                                <span className="text-muted-foreground" style={{ fontSize: "var(--tally-font-size-xs)" }}> — A new child case is auto-created and linked to the original. The parent case stays closed and child cases get their own SLA tracking.</span>
                              </div>
                            </li>
                          </ul>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* General */}
            {activeTab === "general" && (
              <Card className="shadow-none">
                <SectionHeader
                  title="General"
                  description="General CRM settings."
                />
                <CardContent className="p-density-xl">
                  <p className="text-muted-foreground" style={{ fontSize: "var(--tally-font-size-sm)" }}>
                    General settings will be available here shortly.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Placeholder tabs */}
            {activeTab !== "users" &&
              activeTab !== "roles" &&
              activeTab !== "permissions" &&
              activeTab !== "caseClasses" &&
              activeTab !== "caseTypes" &&
              activeTab !== "slaPolicies" &&
              activeTab !== "businessHours" &&
              activeTab !== "templates" &&
              activeTab !== "noteTemplates" &&
              activeTab !== "general" &&
              activeTab !== "coolOffPeriod" && (
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

      {/* Confirm delete Case Type */}
      <AlertDialog open={caseTypeToDelete !== null} onOpenChange={(open) => !open && setCaseTypeToDelete(null)}>
        <AlertDialogContent className="dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-gray-100">Delete case type</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-gray-400">
              Are you sure you want to delete the case type &quot;{caseTypeToDelete != null ? caseTypes.find((ct) => ct.id === caseTypeToDelete)?.name : ""}&quot;? This cannot be undone. SLA rules that reference this type may need to be updated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="hover:bg-[#C40000]/90 bg-[#C40000] text-white focus-visible:ring-[#C40000] dark:hover:bg-[#C40000]/80"
              onClick={() => caseTypeToDelete != null && deleteCaseType(caseTypeToDelete)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Case Type slide-over panel */}
      <Sheet open={caseTypeSheetOpen} onOpenChange={setCaseTypeSheetOpen}>
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 border-l border-border bg-white p-0 dark:border-gray-700 dark:bg-gray-900 sm:!max-w-[480px]"
          style={{ maxWidth: "min(480px, 100vw)" }}
        >
          <SheetHeader className="flex flex-row items-start justify-between gap-density-md border-b border-border px-density-lg py-density-md dark:border-gray-700">
            <div>
              <SheetTitle className="font-semibold text-gray-900 dark:text-gray-100" style={{ fontSize: "var(--tally-font-size-base)", lineHeight: "var(--tally-line-height-tight)" }}>
                {editingCaseTypeId ? "Edit Case Type" : "New Case Type"}
              </SheetTitle>
              <SheetDescription className="mt-density-xs text-muted-foreground" style={{ fontSize: "var(--tally-font-size-xs)", lineHeight: "var(--tally-line-height-normal)" }}>
                {editingCaseTypeId ? caseTypes.find((ct) => ct.id === editingCaseTypeId)?.name : "Configure name and optional primary contact reason for reporting, routing, and SLA (CS-045)."}
              </SheetDescription>
            </div>
            <SheetClose className="relative right-0 top-0 rounded-density-md p-density-sm hover:bg-gray-100 dark:hover:bg-gray-800" />
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-density-lg py-density-lg">
            <div className="space-y-density-md">
              <div>
                <label className="mb-density-xs block font-medium text-gray-700 dark:text-gray-300" style={{ fontSize: "var(--tally-font-size-sm)" }}>Name <span className="text-[#C40000]">*</span></label>
                <Input
                  value={caseTypeForm.name}
                  onChange={(e) => setCaseTypeForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. General Enquiry"
                  className="h-9"
                />
              </div>
              <div>
                <label className="mb-density-xs block font-medium text-gray-700 dark:text-gray-300" style={{ fontSize: "var(--tally-font-size-sm)" }}>Primary contact reason <span className="font-normal text-muted-foreground">(optional)</span></label>
                <Select
                  value={caseTypeForm.primaryContactReason}
                  onChange={(e) => setCaseTypeForm((f) => ({ ...f, primaryContactReason: e.target.value }))}
                  className="h-9"
                >
                  <option value="">None</option>
                  {CONTACT_REASONS.slice(1).map((cr) => (
                    <option key={cr} value={cr}>{cr}</option>
                  ))}
                </Select>
                <p className="mt-density-xs text-muted-foreground" style={{ fontSize: "var(--tally-font-size-xs)", lineHeight: 1.4 }}>Used for reporting, routing, and SLA measurement (CS-045).</p>
              </div>
              <div className="flex items-center justify-between rounded-density-md border border-border bg-gray-50 px-density-md py-density-sm dark:border-gray-700 dark:bg-gray-800">
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100" style={{ fontSize: "var(--tally-font-size-sm)" }}>Active</div>
                  <div className="text-muted-foreground" style={{ fontSize: "var(--tally-font-size-xs)", marginTop: "var(--tally-spacing-xs)" }}>Inactive types are hidden from case creation and SLA case type lists.</div>
                </div>
                <Switch
                  checked={caseTypeForm.active}
                  onChange={(e) => setCaseTypeForm((f) => ({ ...f, active: (e.target as HTMLInputElement).checked }))}
                />
              </div>
            </div>
          </div>
          <SheetFooter className="flex flex-row justify-end gap-density-sm border-t border-border px-density-lg py-density-md dark:border-gray-700">
            <Button variant="outline" onClick={closeCaseTypePanel}>Cancel</Button>
            <Button onClick={saveCaseType} disabled={!caseTypeForm.name.trim()}>Save</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Case Group slide-over panel */}
      <Sheet open={groupSheetOpen} onOpenChange={setGroupSheetOpen}>
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 border-l border-border bg-white p-0 dark:border-gray-700 dark:bg-gray-900 sm:!max-w-[520px]"
          style={{ maxWidth: "min(520px, 100vw)" }}
        >
          <SheetHeader className="flex flex-row items-start justify-between gap-density-md border-b border-border px-density-lg py-density-md dark:border-gray-700">
            <div>
              <SheetTitle className="font-semibold text-gray-900 dark:text-gray-100" style={{ fontSize: "var(--tally-font-size-base)", lineHeight: "var(--tally-line-height-tight)" }}>
                {editingGroupId ? "Edit Case Group" : "New Case Group"}
              </SheetTitle>
              <SheetDescription className="mt-density-xs text-muted-foreground" style={{ fontSize: "var(--tally-font-size-xs)", lineHeight: "var(--tally-line-height-normal)" }}>
                Group name is the first dropdown in New Case; types listed below are the options under it.
              </SheetDescription>
            </div>
            <SheetClose className="relative right-0 top-0 rounded-density-md p-density-sm hover:bg-gray-100 dark:hover:bg-gray-800" />
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-density-lg py-density-lg">
            <div className="space-y-density-md">
              <div>
                <label className="mb-density-xs block font-medium text-gray-700 dark:text-gray-300" style={{ fontSize: "var(--tally-font-size-sm)" }}>Group name <span className="text-[#C40000]">*</span></label>
                <Input
                  value={groupForm.name}
                  onChange={(e) => setGroupForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Move-In / Move-Out & Account Changes"
                  className="h-9"
                />
              </div>
              <div>
                <label className="mb-density-xs block font-medium text-gray-700 dark:text-gray-300" style={{ fontSize: "var(--tally-font-size-sm)" }}>Case class</label>
                <Select
                  value={groupForm.caseClass}
                  onChange={(e) => setGroupForm((f) => ({ ...f, caseClass: e.target.value as CaseType }))}
                  className="h-9"
                >
                  {CASE_CLASS_OPTIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Select>
              </div>
              <div>
                <div className="mb-density-xs flex items-center justify-between">
                  <label className="block font-medium text-gray-700 dark:text-gray-300" style={{ fontSize: "var(--tally-font-size-sm)" }}>Types</label>
                  <Button type="button" variant="outline" size="sm" className="h-7 gap-1" onClick={addGroupFormTypeRow}>
                    <Icon name="add" size={14} />
                    Add type
                  </Button>
                </div>
                <p className="mb-density-sm text-muted-foreground" style={{ fontSize: "var(--tally-font-size-xs)" }}>Each type appears in the Case Type dropdown when its group is selected.</p>
                <div className="space-y-density-sm">
                  {groupForm.types.map((t, idx) => (
                    <div key={idx} className="flex items-center gap-density-sm rounded-density-md border border-border bg-gray-50/50 px-density-sm py-density-xs dark:border-gray-700 dark:bg-gray-800/50">
                      <Input
                        value={t.label}
                        onChange={(e) => updateGroupFormTypeLabel(idx, e.target.value)}
                        placeholder="Type label"
                        className="h-8 flex-1 min-w-[140px]"
                        style={{ fontSize: "var(--tally-font-size-sm)" }}
                      />
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0 hover:bg-[#C40000]/10 hover:text-[#C40000]" onClick={() => removeGroupFormTypeRow(idx)} title="Remove type">
                        <Icon name="delete" size="var(--tally-icon-size-sm)" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <SheetFooter className="flex flex-row justify-end gap-density-sm border-t border-border px-density-lg py-density-md dark:border-gray-700">
            <Button variant="outline" onClick={closeGroupPanel}>Cancel</Button>
            <Button onClick={saveGroup} disabled={!groupForm.name.trim()}>Save</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Confirm delete Case Group */}
      <AlertDialog open={groupToDelete !== null} onOpenChange={(open) => !open && setGroupToDelete(null)}>
        <AlertDialogContent className="dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-gray-100">Delete case group</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-gray-400">
              Are you sure you want to delete the group &quot;{groupToDelete != null ? groups.find((g) => g.id === groupToDelete)?.name : ""}&quot;? This will remove it from the New Case dropdown.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="hover:bg-[#C40000]/90 bg-[#C40000] text-white focus-visible:ring-[#C40000] dark:hover:bg-[#C40000]/80"
              onClick={() => groupToDelete != null && deleteGroup(groupToDelete)}
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
                      {caseTypeNames.map((ct) => (
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

      {caseTypeToast.show && (
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
          <span>{caseTypeToast.message}</span>
        </div>
      )}

      {groupToast.show && (
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
          <span>{groupToast.message}</span>
        </div>
      )}

      {/* Confirm delete note template */}
      <AlertDialog open={noteTemplateToDelete !== null} onOpenChange={(open) => !open && setNoteTemplateToDelete(null)}>
        <AlertDialogContent className="dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-gray-100">Delete template</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-gray-400">
              Are you sure you want to delete &quot;{noteTemplateToDelete != null ? noteTemplates.find((t) => t.id === noteTemplateToDelete)?.name : ""}&quot;? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="hover:bg-[#C40000]/90 bg-[#C40000] text-white focus-visible:ring-[#C40000] dark:hover:bg-[#C40000]/80"
              onClick={() => {
                if (noteTemplateToDelete != null) {
                  deleteNoteTemplate(noteTemplateToDelete);
                  setNoteTemplateToDelete(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Note Template slide-over panel */}
      <Sheet open={noteTemplateSheetOpen} onOpenChange={setNoteTemplateSheetOpen}>
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 border-l border-border bg-white p-0 dark:border-gray-700 dark:bg-gray-900 sm:!max-w-[600px]"
          style={{ maxWidth: "min(600px, 100vw)" }}
        >
          <SheetHeader className="flex flex-row items-start justify-between gap-density-md border-b border-border px-density-lg py-density-md dark:border-gray-700">
            <div>
              <SheetTitle className="font-semibold text-gray-900 dark:text-gray-100" style={{ fontSize: "var(--tally-font-size-base)", lineHeight: "var(--tally-line-height-tight)" }}>
                {editingTemplateId ? "Edit Template" : "New Template"}
              </SheetTitle>
              <SheetDescription className="mt-density-xs text-muted-foreground" style={{ fontSize: "var(--tally-font-size-xs)", lineHeight: "var(--tally-line-height-normal)" }}>
                {editingTemplateId ? noteTemplates.find((t) => t.id === editingTemplateId)?.name : "Create a reusable note template"}
              </SheetDescription>
            </div>
            <SheetClose className="relative right-0 top-0 rounded-density-md p-density-sm hover:bg-gray-100 dark:hover:bg-gray-800" />
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-density-lg py-density-lg">
            <div className="mb-density-xl">
              <div className="border-b border-border pb-density-xs font-semibold uppercase tracking-wider text-muted-foreground dark:border-gray-700" style={{ fontSize: "var(--tally-font-size-xs)", letterSpacing: "0.08em", marginBottom: "var(--tally-spacing-md)" }}>Template Details</div>
              <div className="space-y-density-md">
                <div>
                  <label className="mb-density-xs block font-medium text-gray-700 dark:text-gray-300" style={{ fontSize: "var(--tally-font-size-sm)" }}>Template name <span className="text-[#C40000]">*</span></label>
                  <Input
                    value={noteTemplateForm.name}
                    onChange={(e) => setNoteTemplateForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Escalation Follow-up"
                    className="h-9"
                  />
                  <p className="mt-density-xs text-muted-foreground" style={{ fontSize: "var(--tally-font-size-xs)", lineHeight: 1.4 }}>Internal name shown in the template picker when adding a note.</p>
                </div>
                <div>
                  <label className="mb-density-xs block font-medium text-gray-700 dark:text-gray-300" style={{ fontSize: "var(--tally-font-size-sm)" }}>Default title</label>
                  <Input
                    value={noteTemplateForm.title}
                    onChange={(e) => setNoteTemplateForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Follow-up Required"
                    className="h-9"
                  />
                  <p className="mt-density-xs text-muted-foreground" style={{ fontSize: "var(--tally-font-size-xs)", lineHeight: 1.4 }}>Pre-fills the note title field. Users can edit it before saving.</p>
                </div>
                <div className="grid grid-cols-2 gap-density-md">
                  <div>
                    <label className="mb-density-xs block font-medium text-gray-700 dark:text-gray-300" style={{ fontSize: "var(--tally-font-size-sm)" }}>Category</label>
                    <Select
                      value={noteTemplateForm.category}
                      onChange={(e) => setNoteTemplateForm((f) => ({ ...f, category: e.target.value }))}
                      className="h-9"
                    >
                      <option value="">None</option>
                      {NOTE_TEMPLATE_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <label className="mb-density-xs block font-medium text-gray-700 dark:text-gray-300" style={{ fontSize: "var(--tally-font-size-sm)" }}>Description</label>
                    <Input
                      value={noteTemplateForm.description}
                      onChange={(e) => setNoteTemplateForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder="Brief description of when to use this template"
                      className="h-9"
                    />
                    <p className="mt-density-xs text-muted-foreground" style={{ fontSize: "var(--tally-font-size-xs)", lineHeight: 1.4 }}>Shown in the template picker to help users choose the right one.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-density-xl">
              <div className="border-b border-border pb-density-xs font-semibold uppercase tracking-wider text-muted-foreground dark:border-gray-700" style={{ fontSize: "var(--tally-font-size-xs)", letterSpacing: "0.08em", marginBottom: "var(--tally-spacing-md)" }}>Content</div>
              <div>
                <label className="mb-density-xs block font-medium text-gray-700 dark:text-gray-300" style={{ fontSize: "var(--tally-font-size-sm)" }}>Note body</label>
                <textarea
                  value={noteTemplateForm.body}
                  onChange={(e) => setNoteTemplateForm((f) => ({ ...f, body: e.target.value }))}
                  placeholder="Enter the template content…"
                  rows={8}
                  className="w-full rounded-density-md border border-border bg-white px-density-md py-density-sm text-gray-900 outline-none placeholder:text-muted-foreground focus:border-[#2C365D] focus:ring-1 focus:ring-[#2C365D] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  style={{ fontSize: "var(--tally-font-size-sm)", lineHeight: "var(--tally-line-height-normal)", resize: "vertical" }}
                />
                <p className="mt-density-xs text-muted-foreground" style={{ fontSize: "var(--tally-font-size-xs)", lineHeight: 1.4 }}>Pre-fills the note body. Users can edit the content before saving.</p>
              </div>
            </div>

            <div>
              <div className="border-b border-border pb-density-xs font-semibold uppercase tracking-wider text-muted-foreground dark:border-gray-700" style={{ fontSize: "var(--tally-font-size-xs)", letterSpacing: "0.08em", marginBottom: "var(--tally-spacing-md)" }}>Status</div>
              <div
                className="flex cursor-pointer items-center justify-between rounded-density-md border border-border bg-gray-50 px-density-md py-density-sm dark:border-gray-700 dark:bg-gray-800"
                onClick={() => setNoteTemplateForm((f) => ({ ...f, active: !f.active }))}
              >
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100" style={{ fontSize: "var(--tally-font-size-sm)" }}>Active</div>
                  <div className="text-muted-foreground" style={{ fontSize: "var(--tally-font-size-xs)", marginTop: "var(--tally-spacing-xs)" }}>Only active templates appear in the note template picker</div>
                </div>
                <Switch checked={noteTemplateForm.active} onChange={(e) => setNoteTemplateForm((f) => ({ ...f, active: (e.target as HTMLInputElement).checked }))} onClick={(e) => e.stopPropagation()} />
              </div>
            </div>
          </div>

          <SheetFooter className="flex flex-row justify-end gap-density-sm border-t border-border px-density-lg py-density-md dark:border-gray-700">
            <Button variant="outline" size="sm" onClick={closeNoteTemplatePanel}>Cancel</Button>
            <Button size="sm" className="gap-1.5" onClick={saveNoteTemplate} disabled={noteTemplateSaving || !noteTemplateForm.name.trim()}>
              <Icon name="check" size="var(--tally-icon-size-sm)" />
              {noteTemplateSaving ? "Saving…" : "Save template"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {noteTemplateToast.show && (
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
          <span>{noteTemplateToast.message}</span>
        </div>
      )}

      {/* Email Template delete confirmation */}
      <AlertDialog open={emailTemplateToDelete != null} onOpenChange={(open) => !open && setEmailTemplateToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete email template?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The template will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="hover:bg-[#C40000]/90 bg-[#C40000] text-white focus-visible:ring-[#C40000] dark:hover:bg-[#C40000]/80"
              onClick={() => {
                if (emailTemplateToDelete != null) {
                  deleteEmailTemplate(emailTemplateToDelete);
                  setEmailTemplateToDelete(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Email Template slide-over panel */}
      <Sheet open={emailTemplateSheetOpen} onOpenChange={setEmailTemplateSheetOpen}>
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 border-l border-border bg-white p-0 dark:border-gray-700 dark:bg-gray-900 sm:!max-w-[600px]"
          style={{ maxWidth: "min(600px, 100vw)" }}
        >
          <SheetHeader className="flex flex-row items-start justify-between gap-density-md border-b border-border px-density-lg py-density-md dark:border-gray-700">
            <div>
              <SheetTitle className="font-semibold text-gray-900 dark:text-gray-100" style={{ fontSize: "var(--tally-font-size-base)", lineHeight: "var(--tally-line-height-tight)" }}>
                {editingEmailTemplateId ? "Edit Template" : "New Template"}
              </SheetTitle>
              <SheetDescription className="mt-density-xs text-muted-foreground" style={{ fontSize: "var(--tally-font-size-xs)", lineHeight: "var(--tally-line-height-normal)" }}>
                {editingEmailTemplateId ? emailTemplates.find((t) => t.id === editingEmailTemplateId)?.name : "Create a reusable email template"}
              </SheetDescription>
            </div>
            <SheetClose className="relative right-0 top-0 rounded-density-md p-density-sm hover:bg-gray-100 dark:hover:bg-gray-800" />
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-density-lg py-density-lg">
            <div className="mb-density-xl">
              <div className="border-b border-border pb-density-xs font-semibold uppercase tracking-wider text-muted-foreground dark:border-gray-700" style={{ fontSize: "var(--tally-font-size-xs)", letterSpacing: "0.08em", marginBottom: "var(--tally-spacing-md)" }}>Template Details</div>
              <div className="space-y-density-md">
                <div>
                  <label className="mb-density-xs block font-medium text-gray-700 dark:text-gray-300" style={{ fontSize: "var(--tally-font-size-sm)" }}>Template name <span className="text-[#C40000]">*</span></label>
                  <Input
                    value={emailTemplateForm.name}
                    onChange={(e) => setEmailTemplateForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Case Acknowledgement"
                    className="h-9"
                  />
                  <p className="mt-density-xs text-muted-foreground" style={{ fontSize: "var(--tally-font-size-xs)", lineHeight: 1.4 }}>Internal name shown in the template picker when composing an email.</p>
                </div>
                <div>
                  <label className="mb-density-xs block font-medium text-gray-700 dark:text-gray-300" style={{ fontSize: "var(--tally-font-size-sm)" }}>Default subject</label>
                  <Input
                    value={emailTemplateForm.subject}
                    onChange={(e) => setEmailTemplateForm((f) => ({ ...f, subject: e.target.value }))}
                    placeholder="e.g. Re: Your enquiry — {{caseNumber}}"
                    className="h-9"
                  />
                  <p className="mt-density-xs text-muted-foreground" style={{ fontSize: "var(--tally-font-size-xs)", lineHeight: 1.4 }}>Pre-fills the email subject line. Users can edit it before sending.</p>
                </div>
                <div className="grid grid-cols-2 gap-density-md">
                  <div>
                    <label className="mb-density-xs block font-medium text-gray-700 dark:text-gray-300" style={{ fontSize: "var(--tally-font-size-sm)" }}>Category</label>
                    <Select
                      value={emailTemplateForm.category}
                      onChange={(e) => setEmailTemplateForm((f) => ({ ...f, category: e.target.value }))}
                      className="h-9"
                    >
                      <option value="">None</option>
                      {EMAIL_TEMPLATE_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <label className="mb-density-xs block font-medium text-gray-700 dark:text-gray-300" style={{ fontSize: "var(--tally-font-size-sm)" }}>Description</label>
                    <Input
                      value={emailTemplateForm.description}
                      onChange={(e) => setEmailTemplateForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder="Brief description of when to use this template"
                      className="h-9"
                    />
                    <p className="mt-density-xs text-muted-foreground" style={{ fontSize: "var(--tally-font-size-xs)", lineHeight: 1.4 }}>Shown in the template picker to help users choose the right one.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-density-xl">
              <div className="border-b border-border pb-density-xs font-semibold uppercase tracking-wider text-muted-foreground dark:border-gray-700" style={{ fontSize: "var(--tally-font-size-xs)", letterSpacing: "0.08em", marginBottom: "var(--tally-spacing-md)" }}>Content</div>
              <div>
                <label className="mb-density-xs block font-medium text-gray-700 dark:text-gray-300" style={{ fontSize: "var(--tally-font-size-sm)" }}>Email body</label>
                <textarea
                  value={emailTemplateForm.body}
                  onChange={(e) => setEmailTemplateForm((f) => ({ ...f, body: e.target.value }))}
                  placeholder="Enter the template content…"
                  rows={10}
                  className="w-full rounded-density-md border border-border bg-white px-density-md py-density-sm text-gray-900 outline-none placeholder:text-muted-foreground focus:border-[#2C365D] focus:ring-1 focus:ring-[#2C365D] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  style={{ fontSize: "var(--tally-font-size-sm)", lineHeight: "var(--tally-line-height-normal)", resize: "vertical" }}
                />
                <p className="mt-density-xs text-muted-foreground" style={{ fontSize: "var(--tally-font-size-xs)", lineHeight: 1.4 }}>Pre-fills the email body. Use placeholders like {"{{customerName}}"}, {"{{caseNumber}}"}, {"{{agentName}}"}.</p>
              </div>
            </div>

            <div>
              <div className="border-b border-border pb-density-xs font-semibold uppercase tracking-wider text-muted-foreground dark:border-gray-700" style={{ fontSize: "var(--tally-font-size-xs)", letterSpacing: "0.08em", marginBottom: "var(--tally-spacing-md)" }}>Status</div>
              <div
                className="flex cursor-pointer items-center justify-between rounded-density-md border border-border bg-gray-50 px-density-md py-density-sm dark:border-gray-700 dark:bg-gray-800"
                onClick={() => setEmailTemplateForm((f) => ({ ...f, active: !f.active }))}
              >
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100" style={{ fontSize: "var(--tally-font-size-sm)" }}>Active</div>
                  <div className="text-muted-foreground" style={{ fontSize: "var(--tally-font-size-xs)", marginTop: "var(--tally-spacing-xs)" }}>Only active templates appear in the email template picker</div>
                </div>
                <Switch checked={emailTemplateForm.active} onChange={(e) => setEmailTemplateForm((f) => ({ ...f, active: (e.target as HTMLInputElement).checked }))} onClick={(e) => e.stopPropagation()} />
              </div>
            </div>
          </div>

          <SheetFooter className="flex flex-row justify-end gap-density-sm border-t border-border px-density-lg py-density-md dark:border-gray-700">
            <Button variant="outline" size="sm" onClick={closeEmailTemplatePanel}>Cancel</Button>
            <Button size="sm" className="gap-1.5" onClick={saveEmailTemplate} disabled={emailTemplateSaving || !emailTemplateForm.name.trim()}>
              <Icon name="check" size="var(--tally-icon-size-sm)" />
              {emailTemplateSaving ? "Saving…" : "Save template"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {emailTemplateToast.show && (
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
          <span>{emailTemplateToast.message}</span>
        </div>
      )}
    </div>
  );
}
