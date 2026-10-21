import * as React from "react";
import { cn } from "cn";
import { fieldBase } from "./field-styles";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        fieldBase,
        "h-10 px-3 py-2",
        "file:me-3 file:inline-flex file:h-7 file:rounded-sm file:border-0 file:bg-surface-muted file:px-2 file:text-xs file:font-medium file:text-ink",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
