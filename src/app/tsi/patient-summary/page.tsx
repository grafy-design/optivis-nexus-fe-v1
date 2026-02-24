"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import "simplebar-react/dist/simplebar.min.css";

// 데이터 패칭
// /api/nexus/subgroup/patient/summary/
// Patient Summary 조회

export default function TSIPage() {
  return (
    <AppLayout headerType="tsi">
      <div className="w-full flex flex-col items-center">
        <div className="w-[1772px] h-[980px] flex-shrink-0 mx-auto flex flex-col gap-3">
          {/* Main Card with Glass Background */}

          <div
            className="relative rounded-[36px] overflow-hidden"
            style={{
              width: "1772px",
              backgroundImage: "url(/assets/tsi/default-setting-bg.png)",
              backgroundSize: "100% 100%",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div className="relative p-6 flex flex-col gap-6">
              {/* Header */}
              <div className="flex flex-col gap-[12px] mb-[22px]">
                <h1 className="text-title text-neutral-5">Patient Summary</h1>
                <p className="text-body2m text-neutral-50 max-w-[600px]">
                  Number Analyzed 480 participants{" "}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
