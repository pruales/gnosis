import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  // Calculate height based on rows - each row is roughly 1.5rem (24px) + add padding
  const rowHeight = 24; // 1.5rem in pixels
  const paddingHeight = 16; // 1rem in pixels for top and bottom padding combined

  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-vertical",
        className
      )}
      style={{
        height: props.rows
          ? `${(props.rows as number) * rowHeight + paddingHeight}px`
          : undefined,
        minHeight: props.rows ? undefined : "4rem",
        ...(props.style || {}),
      }}
      {...props}
    />
  );
}

export { Textarea };
