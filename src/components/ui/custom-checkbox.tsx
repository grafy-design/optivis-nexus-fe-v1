"use client";

interface CustomCheckboxProps {
  checked: boolean;
  onChange: () => void;
  className?: string;
}

export default function CustomCheckbox({
  checked,
  onChange,
  className = "",
}: CustomCheckboxProps) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`cursor-pointer ${className}`}
      aria-checked={checked}
    >
      <svg
        width="17"
        height="16"
        viewBox="0 0 17 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          width="16"
          height="16"
          rx="2"
          transform="matrix(1 0 -0.000785067 0.999998 0.0125611 0)"
          fill={checked ? "#cfbcff" : "#C7C5C9"}
        />
        <path
          d="M2.85987 7.92307L5.52327 10.4036C5.95181 10.8028 6.16608 11.0023 6.43253 11.0023C6.69899 11.0023 6.91357 10.8028 7.34273 10.4036L13.1552 4.99805"
          stroke="#E9E9E9"
          strokeWidth="1.41979"
          strokeLinejoin="bevel"
        />
      </svg>
    </button>
  );
}
