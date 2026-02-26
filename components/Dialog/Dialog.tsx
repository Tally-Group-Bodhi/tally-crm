"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface DialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export interface DialogTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export interface DialogContentProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export interface DialogHeaderProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export interface DialogFooterProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export interface DialogTitleProps
  extends React.HTMLAttributes<HTMLHeadingElement> {}

export interface DialogDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {}

export interface DialogCloseProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

const DialogContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
}>({ open: false, setOpen: () => {} });

const Dialog = ({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  children,
}: DialogProps) => {
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
    <DialogContext.Provider value={{ open, setOpen }}>
      {children}
    </DialogContext.Provider>
  );
};

const DialogTrigger = React.forwardRef<
  HTMLButtonElement,
  DialogTriggerProps
>(({ className, asChild, children, ...props }, ref) => {
  const { setOpen } = React.useContext(DialogContext);

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
DialogTrigger.displayName = "DialogTrigger";

const DialogContent = React.forwardRef<
  HTMLDivElement,
  DialogContentProps
>(({ className, children, ...props }, ref) => {
  const { open, setOpen } = React.useContext(DialogContext);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-white/70 dark:bg-black/70 backdrop-blur-[0.5px]"
        onClick={() => setOpen(false)}
      />
      <div
        ref={ref}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-white p-6 shadow-lg duration-200 sm:rounded-lg dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </>
  );
});
DialogContent.displayName = "DialogContent";

const DialogHeader = ({
  className,
  ...props
}: DialogHeaderProps) => {
  return (
    <div
      className={cn(
        "flex flex-col space-y-1.5 text-center sm:text-left",
        className
      )}
      {...props}
    />
  );
};
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
  className,
  ...props
}: DialogFooterProps) => {
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
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  DialogTitleProps
>(({ className, ...props }, ref) => {
  return (
    <h2
      ref={ref}
      className={cn(
        "text-lg font-semibold leading-none tracking-tight text-gray-900 dark:text-gray-100",
        className
      )}
      {...props}
    />
  );
});
DialogTitle.displayName = "DialogTitle";

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  DialogDescriptionProps
>(({ className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn("text-sm text-gray-600 dark:text-gray-400", className)}
      {...props}
    />
  );
});
DialogDescription.displayName = "DialogDescription";

const DialogClose = React.forwardRef<HTMLButtonElement, DialogCloseProps>(
  ({ className, asChild, children, ...props }, ref) => {
    const { setOpen } = React.useContext(DialogContext);

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
          "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#2C365D] focus:ring-offset-2 dark:ring-offset-gray-900 dark:text-gray-100",
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
DialogClose.displayName = "DialogClose";

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
};

