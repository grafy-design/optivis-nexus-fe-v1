"use client";

interface InfoIconProps {
  className?: string;
  color?: string;
}

export default function InfoIcon({ className, color = "#484646" }: InfoIconProps) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g clipPath="url(#clip0_46_5844)">
        <rect width="10" height="10" fill="white" />
        <path
          d="M4.99967 9.16732C7.30086 9.16732 9.16634 7.30184 9.16634 5.00065C9.16634 2.69946 7.30086 0.833984 4.99967 0.833984C2.69849 0.833984 0.833008 2.69946 0.833008 5.00065C0.833008 7.30184 2.69849 9.16732 4.99967 9.16732Z"
          stroke={color}
          strokeWidth="1.25488"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4.99609 7.19189L4.99609 4.48242"
          stroke={color}
          strokeWidth="1.25488"
          strokeLinejoin="round"
        />
        <path
          d="M5 3.33398H5.00418"
          stroke={color}
          strokeWidth="1.25488"
          strokeLinejoin="round"
        />
        <rect
          x="4.35059"
          y="2.79297"
          width="1.28405"
          height="1.28405"
          fill={color}
        />
      </g>
      <defs>
        <clipPath id="clip0_46_5844">
          <rect width="10" height="10" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

