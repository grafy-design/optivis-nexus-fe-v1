"use client";

import { usePathname, useRouter } from "next/navigation";

const TRP_HEADER_STEPS = [
  {
    key: "default-settings",
    label: "Default Settings",
    path: "/trp",
  },
  {
    key: "dashboard",
    label: "Dash Board",
    path: "/trp/simulation-result",
  },
] as const;

function getTrpActiveStepIndex(pathname: string): number {
  return pathname.startsWith("/trp/simulation-result") ? 1 : 0;
}

function getTrpPreviousPath(pathname: string): string {
  if (pathname === "/trp/simulation-result") return "/trp/view-summary";
  if (pathname === "/trp/view-summary") return "/trp/simulation-setting";
  if (pathname === "/trp/simulation-setting") return "/trp/treatment-info";
  if (pathname === "/trp/treatment-info") return "/trp";
  return "/";
}

export const TrpHeader = () => {
  const router = useRouter();
  const pathname = usePathname();
  const activeStepIndex = getTrpActiveStepIndex(pathname);

  return (
    <header className="sticky top-0 z-[90] h-[90px] w-full shrink-0 bg-[#e7e5e7] px-[28px] py-[17px]">
      <div className="flex h-full items-center justify-between">
        <div className="flex items-center gap-[36px]">
          {TRP_HEADER_STEPS.map((step, index) => {
            const isActive = activeStepIndex === index;
            const isFutureStep = index > activeStepIndex;

            return (
              <div key={step.key} className="flex items-center gap-[36px]">
                {index > 0 ? (
                  <span className="block h-[6px] w-[6px] rounded-full bg-[#C0BEC5]" aria-hidden="true" />
                ) : null}

                <button
                  type="button"
                  disabled={isFutureStep}
                  onClick={() => {
                    if (isFutureStep) return;
                    router.push(step.path);
                  }}
                  className={`flex items-center gap-[8px] border-none bg-transparent p-0 ${
                    isFutureStep
                      ? "cursor-not-allowed"
                      : "cursor-pointer transition-opacity hover:opacity-70"
                  }`}
                >
                  <span
                    className={`block h-[10px] w-[10px] rounded-full ${
                      isActive ? "bg-[#262255]" : "bg-[#B6B4BB]"
                    }`}
                    aria-hidden="true"
                  />
                  <span
                    className={`text-[19.5px] font-semibold tracking-[-0.78px] ${
                      isActive ? "text-[#262255]" : "text-[#787776]"
                    }`}
                  >
                    {step.label}
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-0">
          <button
            type="button"
            aria-label="Go to previous TRP step"
            onClick={() => router.push(getTrpPreviousPath(pathname))}
            className="relative flex h-[55px] w-[55px] cursor-pointer items-center justify-center border-none p-0 transition-opacity hover:opacity-70"
            style={{
              backgroundImage: "url('/assets/sidebar-folder-button.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              className="relative z-10"
              aria-hidden="true"
            >
              <path
                d="M19 12H5M5 12L12 19M5 12L12 5"
                stroke="#262255"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <button
            type="button"
            aria-label="Help"
            title="Help"
            onClick={() => console.log("[TRP] help clicked")}
            className="relative flex h-[55px] w-[55px] cursor-pointer items-center justify-center border-none p-0 transition-opacity hover:opacity-70"
            style={{
              backgroundImage: "url('/assets/sidebar-folder-button.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          >
            <span className="relative z-10 text-[22px] leading-none font-bold text-[#262255]">
              ?
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
