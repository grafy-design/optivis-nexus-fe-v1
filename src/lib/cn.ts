import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// globals.css @layer base에 정의된 커스텀 타이포그래피 클래스들
// (text-body4 등이 text-white와 충돌하지 않도록 별도 그룹으로 등록)
const customTwMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "custom-typography": [
        "text-h0", "text-h1", "text-h2", "text-h3", "text-h4",
        "text-body1", "text-body2", "text-body3", "text-body4", "text-body5",
        "text-body1m", "text-body2m", "text-body3m", "text-body4m", "text-body5m",
        "text-small1", "text-small2",
        "text-caption", "text-captionm",
        "text-page-title", "text-page-subtitle",
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return customTwMerge(clsx(inputs));
}
