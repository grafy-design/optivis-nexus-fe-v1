"use client";

import React from "react";
import Lottie from "lottie-react";
import loaderAnimation from "../../../public/lottie/loader.json";

interface LoadingProps {
  isLoading?: boolean;
}

export function Loading({ isLoading = true }: LoadingProps) {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#787776]/70">
      <div className="flex flex-col items-center justify-center">
        <Lottie
          animationData={loaderAnimation}
          autoplay
          loop
          className="h-32 w-32"
        />
      </div>
    </div>
  );
}
