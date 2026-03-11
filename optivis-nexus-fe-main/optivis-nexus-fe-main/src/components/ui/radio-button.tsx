"use client";

import { useId } from "react";

interface RadioButtonProps {
  checked: boolean;
  name: string;
  onChange?: () => void;
  label?: string;
  size?: number;
  className?: string;
  value?: string;
  id?: string;
  disabled?: boolean;
}

export default function RadioButton({
  checked,
  onChange,
  label,
  size = 14,
  className = "",
  name,
  value,
  id,
  disabled = false,
}: RadioButtonProps) {
  const reactId = useId();
  const normalizedId = reactId.replace(/[:]/g, "");
  const inputId = id ?? `radio-${normalizedId}`;

  return (
    <label
      htmlFor={inputId}
      className={`flex items-center gap-[8px] cursor-pointer bg-transparent border-none p-0 ${className}`}
    >
      <input
        id={inputId}
        type="radio"
        name={name}
        value={value ?? label ?? "on"}
        checked={checked}
        disabled={disabled}
        onChange={() => {
          onChange?.();
        }}
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          border: 0,
        }}
      />
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
    </label>
  );
}
