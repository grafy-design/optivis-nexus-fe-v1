import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";

const typographyClassNames = {
  h0: "text-h0",
  title: "text-title",
  logo: "text-logo",
  h1: "text-h1",
  h2: "text-h2",
  h3: "text-h3",
  h4: "text-h4",
  body1: "text-body1",
  body1m: "text-body1m",
  body2: "text-body2",
  body2m: "text-body2m",
  body3: "text-body3",
  body3m: "text-body3m",
  body4: "text-body4",
  body4m: "text-body4m",
  body5: "text-body5",
  body5m: "text-body5m",
  small1: "text-small1",
  small2: "text-small2",
  featureTitle: "text-feature-title",
  featureSearch: "text-feature-search",
  featureItem: "text-feature-item",
} as const;

const typographyVariantOptions = Object.keys(typographyClassNames) as Array<
  keyof typeof typographyClassNames
>;

const typographyVariants = cva("", {
  variants: {
    variant: typographyClassNames,
  },
  defaultVariants: {
    variant: "body3",
  },
});

type TypographyVariant = keyof typeof typographyClassNames;

const typographyDefaultElements: Record<TypographyVariant, keyof React.JSX.IntrinsicElements> = {
  h0: "h1",
  title: "h1",
  logo: "p",
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  body1: "p",
  body1m: "p",
  body2: "p",
  body2m: "p",
  body3: "p",
  body3m: "p",
  body4: "p",
  body4m: "p",
  body5: "p",
  body5m: "p",
  small1: "span",
  small2: "span",
  featureTitle: "p",
  featureSearch: "p",
  featureItem: "p",
};

const typographyStyleOverrides: Partial<Record<TypographyVariant, React.CSSProperties>> = {
  h2: {
    fontFeatureSettings: '"liga" off, "clig" off',
    fontVariantNumeric: "lining-nums tabular-nums",
  },
};

interface TypographyProps
  extends React.HTMLAttributes<HTMLElement>, VariantProps<typeof typographyVariants> {
  as?: React.ElementType;
  asChild?: boolean;
}

function Typography({
  className,
  variant = "body3",
  as,
  asChild = false,
  style,
  ...props
}: TypographyProps) {
  const resolvedVariant: TypographyVariant = variant ?? "body3";
  const Comp: React.ElementType = asChild
    ? Slot
    : (as ?? typographyDefaultElements[resolvedVariant]);
  const resolvedStyle = typographyStyleOverrides[resolvedVariant]
    ? { ...typographyStyleOverrides[resolvedVariant], ...style }
    : style;

  return (
    <Comp
      data-slot="typography"
      data-variant={resolvedVariant}
      className={clsx(typographyVariants({ variant: resolvedVariant }), className)}
      style={resolvedStyle}
      {...props}
    />
  );
}

Typography.displayName = "Typography";

export { Typography, typographyVariants, type TypographyProps, type TypographyVariant };
export { typographyClassNames, typographyVariantOptions };
export default Typography;
