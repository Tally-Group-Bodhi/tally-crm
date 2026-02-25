"use client";

import React from "react";
import { cn } from "@/lib/utils";

type TabsVariant = "default" | "inline";

export interface TabsProps
  extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  variant?: TabsVariant;
}

export interface TabsListProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export interface TabsTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export interface TabsContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

const TabsContext = React.createContext<{
  value: string;
  onValueChange: (value: string) => void;
  variant: TabsVariant;
}>({ value: "", onValueChange: () => {}, variant: "default" });

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ className, defaultValue, value: controlledValue, onValueChange, variant = "default", children, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue || "");
    const value = controlledValue !== undefined ? controlledValue : internalValue;

    const handleValueChange = React.useCallback(
      (newValue: string) => {
        if (controlledValue === undefined) {
          setInternalValue(newValue);
        }
        onValueChange?.(newValue);
      },
      [controlledValue, onValueChange]
    );

    return (
      <TabsContext.Provider value={{ value, onValueChange: handleValueChange, variant }}>
        <div ref={ref} className={cn("w-full", className)} {...props}>
          {children}
        </div>
      </TabsContext.Provider>
    );
  }
);
Tabs.displayName = "Tabs";

const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, ...props }, ref) => {
    const { variant } = React.useContext(TabsContext);

    return (
      <div
        ref={ref}
        className={cn(
          variant === "inline"
            ? "inline-flex items-center gap-0 border-b border-border text-gray-600"
            : "inline-flex h-10 items-center justify-center rounded-lg bg-gray-100 p-1 text-gray-600",
          className
        )}
        {...props}
      />
    );
  }
);
TabsList.displayName = "TabsList";

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, children, ...props }, ref) => {
    const { value: selectedValue, onValueChange, variant } = React.useContext(TabsContext);
    const isSelected = selectedValue === value;

    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        aria-selected={isSelected}
        data-state={isSelected ? "active" : "inactive"}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C365D] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          variant === "inline"
            ? cn(
                "-mb-px px-4 py-2.5 border-b-2",
                isSelected
                  ? "border-[#2C365D] text-[#2C365D]"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
              )
            : cn(
                "rounded-md px-3 py-1.5 ring-offset-white",
                isSelected
                  ? "bg-white text-[#2C365D] shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              ),
          className
        )}
        onClick={() => onValueChange(value)}
        {...props}
      >
        {children}
      </button>
    );
  }
);
TabsTrigger.displayName = "TabsTrigger";

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, children, ...props }, ref) => {
    const { value: selectedValue } = React.useContext(TabsContext);
    const isSelected = selectedValue === value;

    if (!isSelected) return null;

    return (
      <div
        ref={ref}
        role="tabpanel"
        tabIndex={0}
        className={cn(
          "mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C365D] focus-visible:ring-offset-2",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent };

