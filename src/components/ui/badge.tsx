import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border-2 border-black px-2.5 py-0.5 text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-white text-black shadow-[-2px_2px_0_0_#000000] hover:shadow-[0_0_0_0_#000000]",
        secondary:
          "bg-white text-black shadow-[-2px_2px_0_0_#000000] hover:shadow-[0_0_0_0_#000000]",
        destructive:
          "bg-destructive text-white shadow-[-2px_2px_0_0_#000000] hover:shadow-[0_0_0_0_#000000]",
        outline: "bg-white text-black shadow-[-2px_2px_0_0_#000000] hover:shadow-[0_0_0_0_#000000]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
