"use client";

interface RadioButtonProps {
  checked: boolean;
  onChange?: () => void;
  label?: string;
  size?: number;
  className?: string;
}

export default function RadioButton({
  checked,
  onChange,
  label,
  size = 14,
  className = "",
}: RadioButtonProps) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`flex items-center gap-[8px] cursor-pointer bg-transparent border-none p-0 ${className}`}
      aria-checked={checked}
      role="radio"
    >
      <div
        className="flex items-center justify-center shrink-0"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: "50%",
          border: `2px solid ${checked ? "var(--tertiary-40)" : "var(--text-disabled)"}`,
          background: checked ? "var(--tertiary-40)" : "transparent",
        }}
      >
        {checked && (
          <div
            className="shrink-0"
            style={{
              width: `${Math.max(5, Math.round(size * 0.43))}px`,
              height: `${Math.max(5, Math.round(size * 0.43))}px`,
              borderRadius: "50%",
              background: "var(--white)",
            }}
          />
        )}
      </div>
      {label && (
        <span className="text-body4m text-[var(--text-secondary)]">
          {label}
        </span>
      )}
    </button>
  );
}
