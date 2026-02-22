"use client";

import React from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";

const BASE_CARD = {
  background: "#ffffff",
  borderRadius: 8,
  boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.06)",
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "10px 14px",
  fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
  cursor: "default",
  transition: "box-shadow 0.15s",
} as const;

const AVATAR_HEX = ["#8b5cf6", "#3b82f6", "#6366f1", "#ec4899", "#f59e0b", "#10b981", "#06b6d4"] as const;

export function getInitials(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  if (parts[0].length >= 2) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0]?.[0] ?? "?").toUpperCase();
}

export function getAvatarHex(name: string, index: number): string {
  const hash = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_HEX[(hash + index) % AVATAR_HEX.length];
}

export function SummaryCard({
  icon,
  title,
  count,
  countLabel,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  countLabel: string;
}) {
  return (
    <div
      style={{
        ...BASE_CARD,
        width: "100%",
        maxWidth: 380,
        height: 72,
        borderLeft: "3px solid #6264a7",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1), 0 0 0 1px rgba(98,100,167,0.15)",
        marginBottom: 24,
      }}
    >
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: 8,
          background: "#ede9fe",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#252423", lineHeight: 1.3 }}>{title}</div>
        <div style={{ fontSize: 11, color: "#8a8886", marginTop: 2 }}>
          {count} {countLabel}
        </div>
      </div>
    </div>
  );
}

type EntityType = "org" | "account" | "contact";

export function EntityCard({
  type,
  name,
  sublabel,
  href,
  selected,
  onClick,
}: {
  type: EntityType;
  name: string;
  sublabel?: string;
  href?: string;
  selected?: boolean;
  onClick?: () => void;
}) {
  const isOrg = type === "org";
  const isAccount = type === "account";
  const isContact = type === "contact";

  const content = (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
      onClick={onClick}
      style={{
        ...BASE_CARD,
        width: "100%",
        minHeight: 68,
        borderLeft: `3px solid ${selected ? "#6264a7" : "#c7c7c7"}`,
        boxShadow: selected
          ? "0 0 0 2px #dce0f5, 0 2px 8px rgba(98,100,167,0.15)"
          : "0 1px 3px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.06)",
        cursor: onClick || href ? "pointer" : "default",
      }}
    >
      {isOrg && (
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            background: "#ede9fe",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon name="apartment" size={20} className="text-[#5b21b6]" />
        </div>
      )}
      {(isAccount || isContact) && (
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: getAvatarHex(name, isContact ? 1 : 0),
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 600,
            flexShrink: 0,
            letterSpacing: "0.3px",
          }}
        >
          {getInitials(name)}
        </div>
      )}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#252423",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {name}
        </div>
        {sublabel && (
          <div style={{ fontSize: 11, color: "#8a8886", marginTop: 2 }}>{sublabel}</div>
        )}
      </div>
    </div>
  );

  if (href && !onClick) {
    return (
      <Link href={href} className="block text-left">
        {content}
      </Link>
    );
  }
  return content;
}

export function CardGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={["grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4", className].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}
