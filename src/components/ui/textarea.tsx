import * as React from "react";
import { cn } from "cn";
import { fieldBase } from "./field-styles";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(fieldBase, "flex min-h-24 resize-y px-3 py-2.5 leading-relaxed", className)}
      {...props}
    />
  );
}

export { Textarea };
