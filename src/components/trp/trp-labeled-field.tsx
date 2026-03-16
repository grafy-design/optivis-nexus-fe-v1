import type { ReactNode } from "react";
import type { TrpFieldLabelProps } from "@/components/trp/trp-field-label";
import TrpFieldLabel from "@/components/trp/trp-field-label";

type TrpLabeledFieldProps = Pick<
  TrpFieldLabelProps,
  "helper" | "helperContent" | "label" | "light" | "required" | "tone"
> & {
  control: ReactNode;
  extra?: ReactNode;
  labelWidth?: number | string;
};

export default function TrpLabeledField({
  label,
  helper,
  helperContent,
  control,
  light,
  required = false,
  tone,
  extra,
  labelWidth,
}: TrpLabeledFieldProps) {
  return (
    <div className="flex items-start gap-1">
      <div
        className={`${labelWidth === 58 || labelWidth === "58px" ? "w-[58px]" : "w-[96px]"} shrink-0 pr-3`}
      >
        <TrpFieldLabel
          label={label}
          helper={helper}
          helperContent={helperContent}
          light={light}
          required={required}
          tone={tone}
        />
      </div>

      <div className="min-w-0 flex-1">
        {control}
        {extra ? <div className="mt-1">{extra}</div> : null}
      </div>
    </div>
  );
}
