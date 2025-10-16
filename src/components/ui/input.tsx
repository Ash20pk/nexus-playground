import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full rounded-md bg-white text-black px-3 py-2 text-base shadow-[inset_0_0_0_2px_#000000] file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-black placeholder:text-gray-500 focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_#000000,0_0_0_3px_rgba(0,0,0,0.1)] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
