import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type TrpSubsectionDividerProps = {
  children: ReactNode;
  className?: string;
};

export default function TrpSubsectionDivider({ children, className }: TrpSubsectionDividerProps) {
  return <div className={cn("mt-3 border-t border-[#DAD7E2] pt-3", className)}>{children}</div>;
}
