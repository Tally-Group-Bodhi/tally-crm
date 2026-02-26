"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface SheetProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export interface SheetTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export interface SheetContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  side?: "top" | "right" | "bottom" | "left";
}

export interface SheetHeaderProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export interface SheetFooterProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export interface SheetTitleProps
  extends React.HTMLAttributes<HTMLHeadingElement> {}

export interface SheetDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {}

export interface SheetCloseProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

const SheetContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
}>({ open: false, setOpen: () => {} });

const Sheet = ({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  children,
}: SheetProps) => {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const setOpen = React.useCallback(
    (newOpen: boolean) => {
      if (controlledOpen === undefined) {
        setInternalOpen(newOpen);
      }
      onOpenChange?.(newOpen);
    },
    [controlledOpen, onOpenChange]
  );

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <SheetContext.Provider value={{ open, setOpen }}>
      {children}
    </SheetContext.Provider>
  );
};

const SheetTrigger = React.forwardRef<
  HTMLButtonElement,
  SheetTriggerProps
>(({ className, asChild, children, ...props }, ref) => {
  const { setOpen } = React.useContext(SheetContext);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      ref,
      onClick: () => setOpen(true),
    } as React.Attributes & { onClick: () => void });
  }

  return (
    <button
      ref={ref}
      type="button"
      className={className}
      onClick={() => setOpen(true)}
      {...props}
    >
      {children}
    </button>
  );
});
SheetTrigger.displayName = "SheetTrigger";

const SheetContent = React.forwardRef<
  HTMLDivElement,
  SheetContentProps
>(({ className, side = "right", children, ...props }, ref) => {
  const { open, setOpen } = React.useContext(SheetContext);

  if (!open) return null;

  const sideClasses = {
    top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
    right:
      "top-3 right-3 bottom-3 w-3/4 rounded-2xl data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
    bottom:
      "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
    left: "top-3 left-3 bottom-3 w-3/4 rounded-2xl data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-white/70 dark:bg-black/70 backdrop-blur-[0.5px]"
        onClick={() => setOpen(false)}
      />
      <div
        ref={ref}
        className={cn(
          "fixed z-50 gap-4 bg-white p-6 shadow-2xl ring-1 ring-black/5 transition ease-in-out",
          sideClasses[side],
          className
        )}
        data-state={open ? "open" : "closed"}
        {...props}
      >
        {children}
      </div>
    </>
  );
});
SheetContent.displayName = "SheetContent";

const SheetHeader = ({
  className,
  ...props
}: SheetHeaderProps) => {
  return (
    <div
      className={cn(
        "flex flex-col space-y-2 text-center sm:text-left",
        className
      )}
      {...props}
    />
  );
};
SheetHeader.displayName = "SheetHeader";

const SheetFooter = ({
  className,
  ...props
}: SheetFooterProps) => {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
        className
      )}
      {...props}
    />
  );
};
SheetFooter.displayName = "SheetFooter";

const SheetTitle = React.forwardRef<HTMLHeadingElement, SheetTitleProps>(
  ({ className, ...props }, ref) => {
    return (
      <h2
        ref={ref}
        className={cn(
          "text-lg font-semibold text-gray-900",
          className
        )}
        {...props}
      />
    );
  }
);
SheetTitle.displayName = "SheetTitle";

const SheetDescription = React.forwardRef<
  HTMLParagraphElement,
  SheetDescriptionProps
>(({ className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn("text-sm text-gray-600", className)}
      {...props}
    />
  );
});
SheetDescription.displayName = "SheetDescription";

const SheetClose = React.forwardRef<HTMLButtonElement, SheetCloseProps>(
  ({ className, asChild, children, ...props }, ref) => {
    const { setOpen } = React.useContext(SheetContext);

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        ref,
        onClick: () => setOpen(false),
      } as React.Attributes & { onClick: () => void });
    }

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#2C365D] focus:ring-offset-2",
          className
        )}
        onClick={() => setOpen(false)}
        {...props}
      >
        {children || (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        )}
        <span className="sr-only">Close</span>
      </button>
    );
  }
);
SheetClose.displayName = "SheetClose";

export {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  SheetClose,
};

