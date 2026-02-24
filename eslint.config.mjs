import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    rules: {
      "@next/next/no-img-element": "off",
      // any 타입 사용을 에러에서 경고로 변경
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/exhaustive-deps": "off",
      // 사용하지 않는 변수 규칙 완화 (언더스코어로 시작하는 변수는 허용)
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      // 이스케이프되지 않은 엔티티 경고 비활성화 (작은따옴표 등은 문제없음)
      "react/no-unescaped-entities": "off",
      // React Hook 의존성 배열 경고 유지 (기존 설정 유지)
    },
  },
];

export default eslintConfig;




