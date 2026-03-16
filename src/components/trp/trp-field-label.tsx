import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import Typography from "../ui/typography";

export type TrpFieldLabelProps = {
  label: string;
  helper?: string;
  light?: boolean;
  required?: boolean;
  tone?: "default" | "danger";
  helperContent?: ReactNode;
};

export default function TrpFieldLabel({
  label,
  helper,
  light = false,
  required = false,
  tone = "default",
  helperContent,
}: TrpFieldLabelProps) {
  return (
    <div className="mb-0.5 flex flex-col gap-0">
      <Typography
        variant="body3"
        className={cn(
          "text-[#5B5866]",
          light && "text-[rgba(255,255,255,0.76)]",
          tone === "danger" && "text-[#F05245]"
        )}
      >
        {label}
        {required ? <span className="text-[#6A4CFF]">*</span> : null}
      </Typography>

      {helper || helperContent ? (
        <span
          className={cn(
            "font-[Inter,sans-serif] text-[9px] font-medium tracking-[-0.02em] text-[#A6A2B2]",
            light && "text-[rgba(255,255,255,0.52)]",
            tone === "danger" && "text-[rgba(240,82,69,0.78)]"
          )}
        >
          {helperContent ?? helper}
        </span>
      ) : null}
    </div>
  );
}
