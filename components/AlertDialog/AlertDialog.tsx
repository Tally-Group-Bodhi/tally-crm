"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface AlertDialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export interface AlertDialogTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export interface AlertDialogContentProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export interface AlertDialogHeaderProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export interface AlertDialogFooterProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export interface AlertDialogTitleProps
  extends React.HTMLAttributes<HTMLHeadingElement> {}

export interface AlertDialogDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {}

export interface AlertDialogActionProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export interface AlertDialogCancelProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const AlertDialogContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
}>({ open: false, setOpen: () => {} });

const AlertDialog = ({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  children,
}: AlertDialogProps) => {
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
    <AlertDialogContext.Provider value={{ open, setOpen }}>
      {children}
    </AlertDialogContext.Provider>
  );
};

const AlertDialogTrigger = React.forwardRef<
  HTMLButtonElement,
  AlertDialogTriggerProps
>(({ className, asChild, children, ...props }, ref) => {
  const { setOpen } = React.useContext(AlertDialogContext);

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
AlertDialogTrigger.displayName = "AlertDialogTrigger";

const AlertDialogContent = React.forwardRef<
  HTMLDivElement,
  AlertDialogContentProps
>(({ className, children, ...props }, ref) => {
  const { open, setOpen } = React.useContext(AlertDialogContext);

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
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-white p-6 shadow-lg sm:rounded-lg",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </>
  );
});
AlertDialogContent.displayName = "AlertDialogContent";

const AlertDialogHeader = ({
  className,
  ...props
}: AlertDialogHeaderProps) => {
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
AlertDialogHeader.displayName = "AlertDialogHeader";

const AlertDialogFooter = ({
  className,
  ...props
}: AlertDialogFooterProps) => {
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
AlertDialogFooter.displayName = "AlertDialogFooter";

const AlertDialogTitle = React.forwardRef<
  HTMLHeadingElement,
  AlertDialogTitleProps
>(({ className, ...props }, ref) => {
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
});
AlertDialogTitle.displayName = "AlertDialogTitle";

const AlertDialogDescription = React.forwardRef<
  HTMLParagraphElement,
  AlertDialogDescriptionProps
>(({ className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn("text-sm text-gray-600", className)}
      {...props}
    />
  );
});
AlertDialogDescription.displayName = "AlertDialogDescription";

const AlertDialogAction = React.forwardRef<
  HTMLButtonElement,
  AlertDialogActionProps
>(({ className, ...props }, ref) => {
  const { setOpen } = React.useContext(AlertDialogContext);

  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-[#2C365D] px-4 py-2 text-sm font-semibold text-white ring-offset-white transition-colors hover:bg-[#1e2840] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C365D] focus-visible:ring-offset-2",
        className
      )}
      onClick={() => setOpen(false)}
      {...props}
    />
  );
});
AlertDialogAction.displayName = "AlertDialogAction";

const AlertDialogCancel = React.forwardRef<
  HTMLButtonElement,
  AlertDialogCancelProps
>(({ className, ...props }, ref) => {
  const { setOpen } = React.useContext(AlertDialogContext);

  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "mt-2 inline-flex h-10 items-center justify-center rounded-md border border-border bg-white px-4 py-2 text-sm font-semibold ring-offset-white transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C365D] focus-visible:ring-offset-2 sm:mt-0",
        className
      )}
      onClick={() => setOpen(false)}
      {...props}
    />
  );
});
AlertDialogCancel.displayName = "AlertDialogCancel";

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};

