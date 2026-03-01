"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import Image from "next/image";

import { cn } from "@/lib/utils";

type IconType = "play" | "plus" | string;

const buttonSizes = {
  xs: "h-[30px] rounded-full px-4 text-body4",
  sm: "h-8 rounded-lg px-3 text-body5",
  md: "h-[42px] px-5 text-body3 rounded-[21px] [&_*]:text-inherit",
  lg: "h-14 rounded-xl px-6 text-body4",
  iconSm: "size-8 rounded-[8px]",
  icon: "size-12 rounded-[20px]",
} as const;

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 cursor-pointer disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[#262255] text-white hover:bg-[#1a1a3e]",
        primary: "bg-[#262255] text-white hover:bg-[#1a1a3e]",
        orange:
          "bg-[#f16600] text-white hover:bg-[#d85a00] disabled:opacity-50 disabled:hover:bg-[#f16600]",
        neutral: "bg-neutral-70 text-white hover:bg-neutral-60",
        ghost: "bg-transparent hover:bg-gray-100",
        outline: "border border-gray-300 bg-transparent hover:bg-gray-50",
        glass:
          "bg-[rgba(36,36,36,0.3)] backdrop-blur-[10px] text-[black] hover:bg-[rgba(36,36,36,0.4)]",
        tabActive: "bg-primary-20 text-white",
        tabInactive: "bg-transparent text-neutral-30 hover:bg-neutral-95",
        destructive: "bg-error-40 text-white hover:bg-error-35",
      },
      size: buttonSizes,
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

const PlayIcon = ({ className }: { className?: string }) => (
  <svg
    width="11"
    height="13"
    viewBox="0 0 11 13"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M0 11.2324V1.06641C0 0.700195 0.090332 0.431641 0.270996 0.260742C0.45166 0.0849609 0.666504 -0.00292969 0.915527 -0.00292969C1.13525 -0.00292969 1.35986 0.0605469 1.58936 0.1875L10.1221 5.17529C10.4248 5.35107 10.6348 5.50977 10.752 5.65137C10.874 5.78809 10.9351 5.9541 10.9351 6.14941C10.9351 6.33984 10.874 6.50586 10.752 6.64746C10.6348 6.78906 10.4248 6.94775 10.1221 7.12354L1.58936 12.1113C1.35986 12.2383 1.13525 12.3018 0.915527 12.3018C0.666504 12.3018 0.45166 12.2139 0.270996 12.0381C0.090332 11.8623 0 11.5938 0 11.2324Z"
      fill="currentColor"
    />
  </svg>
);

const PlusIcon = ({ className }: { className?: string }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M8 3V13M3 8H13"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  icon?: IconType;
  iconPosition?: "left" | "right";
}

function renderIcon(icon: IconType) {
  if (icon === "play") return <PlayIcon className="shrink-0" />;
  if (icon === "plus") return <PlusIcon className="shrink-0" />;

  return (
    <Image
      src={icon}
      alt=""
      width={20}
      height={20}
      className="h-5 w-5 object-contain shrink-0"
    />
  );
}

function Button({
  className,
  variant = "primary",
  size = "md",
  asChild = false,
  icon,
  iconPosition = "right",
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  if (asChild) {
    return (
      <Comp
        data-slot="button"
        data-variant={variant}
        data-size={size}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {children}
      </Comp>
    );
  }

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {icon && iconPosition === "left" && (
        <span className="shrink-0 text-inherit">{renderIcon(icon)}</span>
      )}
      <span className="text-inherit">{children}</span>
      {icon && iconPosition === "right" && (
        <span className="shrink-0 text-inherit">{renderIcon(icon)}</span>
      )}
    </Comp>
  );
}

export { Button, buttonVariants, buttonSizes };
export default Button;

