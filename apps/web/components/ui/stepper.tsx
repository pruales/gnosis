"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface StepperContextValue {
  value: number;
  onValueChange?: (value: number) => void;
}

const StepperContext = React.createContext<StepperContextValue | undefined>(
  undefined
);

function useStepperContext() {
  const context = React.useContext(StepperContext);
  if (!context) {
    throw new Error("useStepperContext must be used within a StepperProvider");
  }
  return context;
}

interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  onValueChange?: (value: number) => void;
  className?: string;
  children: React.ReactNode;
}

const Stepper = React.forwardRef<HTMLDivElement, StepperProps>(
  ({ value, onValueChange, className, children, ...props }, ref) => {
    return (
      <StepperContext.Provider value={{ value, onValueChange }}>
        <div
          ref={ref}
          className={cn("flex items-center w-full", className)}
          {...props}
        >
          {children}
        </div>
      </StepperContext.Provider>
    );
  }
);
Stepper.displayName = "Stepper";

interface StepperItemProps extends React.HTMLAttributes<HTMLDivElement> {
  step: number;
  className?: string;
  children: React.ReactNode;
}

const StepperItem = React.forwardRef<HTMLDivElement, StepperItemProps>(
  ({ step, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-center", className)}
        data-state={useStepperContext().value >= step ? "active" : "inactive"}
        {...props}
      >
        {children}
      </div>
    );
  }
);
StepperItem.displayName = "StepperItem";

interface StepperTriggerProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  asChild?: boolean;
  children: React.ReactNode;
}

const StepperTrigger = React.forwardRef<HTMLDivElement, StepperTriggerProps>(
  ({ className, asChild = false, children, ...props }, ref) => {
    const { value } = useStepperContext();

    if (asChild) {
      return <React.Fragment>{children}</React.Fragment>;
    }

    return (
      <div
        ref={ref}
        className={cn("relative", className)}
        data-state={value ? "active" : "inactive"}
        {...props}
      >
        {children}
      </div>
    );
  }
);
StepperTrigger.displayName = "StepperTrigger";

interface StepperIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  asChild?: boolean;
  children: React.ReactNode;
}

const StepperIndicator = React.forwardRef<
  HTMLDivElement,
  StepperIndicatorProps
>(({ className, asChild = false, children, ...props }, ref) => {
  if (asChild) {
    return <React.Fragment>{children}</React.Fragment>;
  }

  return (
    <div
      ref={ref}
      className={cn(
        "relative w-full h-1 rounded-full bg-muted overflow-hidden",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
StepperIndicator.displayName = "StepperIndicator";

export { Stepper, StepperItem, StepperTrigger, StepperIndicator };
