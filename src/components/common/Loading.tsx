"use client";

import React from "react";
import Lottie from "lottie-react";
import loadingJson from "../../../public/assets/loading.json";

interface LoadingProps {
  isLoading?: boolean;
}

export function Loading({ isLoading = true }: LoadingProps) {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#000000]/80">
      <Lottie animationData={loadingJson} loop className="w-32 h-32" />
    </div>
  );
}
