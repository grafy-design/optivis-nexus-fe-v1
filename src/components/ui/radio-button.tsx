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
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: "50%",
          border: `2px solid ${checked ? "#3a11d8" : "#c6c5c9"}`,
          background: checked ? "#3a11d8" : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {checked && (
          <div
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#fff",
            }}
          />
        )}
      </div>
      {label && (
        <span
          style={{
            fontFamily: "Inter",
            fontWeight: 500,
            fontSize: "15px",
            color: "#484646",
            letterSpacing: "-0.45px",
            lineHeight: 1,
            textAlign: "left",
          }}
        >
          {label}
        </span>
      )}
    </button>
  );
}
