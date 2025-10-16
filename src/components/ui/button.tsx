import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[inset_0_0_0_2px_#000000,-4px_4px_0_0_#000000] hover:bg-[#f3ede8] hover:shadow-[inset_0_0_0_2px_#000000,0_0_0_0_#000000] active:shadow-[inset_0_0_0_2px_#000000,0_0_0_0_#000000]",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "bg-white text-black shadow-[inset_0_0_0_2px_#000000,-4px_4px_0_0_#000000] hover:bg-[#f3ede8] hover:shadow-[inset_0_0_0_2px_#000000,0_0_0_0_#000000]",
        secondary:
          "bg-secondary text-black shadow-[inset_0_0_0_2px_#000000,-4px_4px_0_0_#000000] hover:bg-[#f3ede8] hover:shadow-[inset_0_0_0_2px_#000000,0_0_0_0_#000000]",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
        connectkit:
          "bg-background text-black shadow-[var(--ck-connectbutton-box-shadow)] rounded-[var(--ck-connectbutton-border-radius)] hover:bg-[var(--ck-connectbutton-hover-background)] active:shadow-[var(--ck-connectbutton-active-box-shadow)] text-[var(--ck-connectbutton-font-size)]",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
