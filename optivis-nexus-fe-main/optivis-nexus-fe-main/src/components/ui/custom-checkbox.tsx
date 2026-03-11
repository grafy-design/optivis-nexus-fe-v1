"use client";

interface CustomCheckboxProps {
  checked: boolean;
  onChange: () => void;
  size?: number;
  className?: string;
  disabled?: boolean;
}

export default function CustomCheckbox({
  checked,
  onChange,
  size = 16,
  className = "",
  disabled = false,
}: CustomCheckboxProps) {
  const stateIcon = checked
    ? encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 17 17" fill="none">
          <rect
            x="0.5"
            y="0.5"
            width="16"
            height="16"
            rx="3.5"
            fill="${disabled ? "#B8B7BD" : "#3A11D8"}"
            stroke="${disabled ? "#B8B7BD" : "#3A11D8"}"
          />
          <path
            d="M4 8.5L7.1 11.55L13 5.45"
            stroke="white"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      `)
    : encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 17 17" fill="none">
          <rect
            x="0.5"
            y="0.5"
            width="16"
            height="16"
            rx="3.5"
            fill="${disabled ? "#F0EFF3" : "white"}"
            stroke="${disabled ? "#D7D6DB" : "#C9C8CF"}"
          />
        </svg>
      `);

  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={() => onChange()}
      disabled={disabled}
      className={className}
      style={{
        width: size,
        height: size,
        margin: 0,
        flexShrink: 0,
        cursor: disabled ? "default" : "pointer",
        appearance: "none",
        WebkitAppearance: "none",
        MozAppearance: "none",
        border: "none",
        borderRadius: 4,
        outline: "none",
        backgroundColor: "transparent",
        backgroundImage: `url("data:image/svg+xml,${stateIcon}")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundSize: "100% 100%",
      }}
    />
  );
}
