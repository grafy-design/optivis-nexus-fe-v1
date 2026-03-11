"use client";

import { cn } from "@/lib/cn";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "glass" | "solid" | "purple";
  children: React.ReactNode;
}

export default function Card({
  variant = "glass",
  children,
  className,
  ...props
}: CardProps) {
  const variants = {
    glass: "bg-white",
    solid: "bg-[#2d1067]",
    purple: "bg-[#c5c0fe]",
  };

  return (
    <div
      className={cn(
        "relative rounded-[18px] overflow-hidden",
        variants[variant],
        className
      )}
      style={{
        boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)",
      }}
      {...props}
    >
      {/* Glass Effect Overlay */}
      <div
        className="absolute top-0 left-0 right-0 bottom-0 rounded-[18px] pointer-events-none"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.004)",
          mixBlendMode: "normal",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

