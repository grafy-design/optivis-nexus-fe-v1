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
  size = 20,
  className = "",
  disabled = false,
}: CustomCheckboxProps) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onChange}
      className={`bg-transparent border-none p-0 flex items-center justify-center shrink-0 ${disabled ? "cursor-default" : "cursor-pointer"} ${className}`}
      aria-checked={checked}
      aria-disabled={disabled}
      role="checkbox"
    >
      <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
        {checked && !disabled ? (
          <>
            <rect width="20" height="20" rx="5" fill="#5B4EFF" />
            <path
              d="M5 10.5L8.5 14L15 7"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        ) : (
          <rect
            x="1"
            y="1"
            width="18"
            height="18"
            rx="4"
            stroke={disabled ? "#E2E1E5" : "#C7C5C9"}
            strokeWidth="1.5"
            fill={disabled ? "#F5F4F6" : "white"}
          />
        )}
      </svg>
    </button>
  );
}
