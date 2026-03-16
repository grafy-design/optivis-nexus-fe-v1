import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";

type TrpSubsectionCardProps = {
  title: ReactNode;
  children: ReactNode;
  className?: string;
  titleClassName?: string;
  style?: CSSProperties;
  titleStyle?: CSSProperties;
};

export default function TrpSubsectionCard({
  title,
  children,
  className,
  titleClassName,
  style,
  titleStyle,
}: TrpSubsectionCardProps) {
  return (
    <section
      className={cn(
        "rounded-[20px] border border-white/70 bg-[rgba(255,255,255,0.62)] px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.42)] backdrop-blur-[12px]",
        className
      )}
      style={style}
    >
      <h3
        className={cn(
          "mb-[36px] font-[Inter,sans-serif] text-[15px] font-bold tracking-[-0.03em] text-[#4E4A57]",
          titleClassName
        )}
        style={titleStyle}
      >
        {title}
      </h3>
      {children}
    </section>
  );
}
