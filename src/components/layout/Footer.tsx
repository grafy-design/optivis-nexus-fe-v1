"use client";

import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full min-w-full flex flex-col items-center" style={{ background: 'var(--BG, linear-gradient(0deg, rgba(227, 225, 225, 0.45) 0%, rgba(227, 225, 225, 0.45) 100%), linear-gradient(0deg, #E0E5FE 0%, #F7F8FA 100%))' }}>
      <div className="w-full min-w-full flex justify-center">
        <div className="w-[1320px] min-w-[1320px] flex-shrink-0 flex flex-col">
          {/* Footer 영역이 스크롤 영역만큼 차지하도록 */}
        </div>
      </div>
    </footer>
  );
};

