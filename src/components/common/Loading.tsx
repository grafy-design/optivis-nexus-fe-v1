import React from "react";

interface LoadingProps {
  isLoading?: boolean;
}

export function Loading({ isLoading = true }: LoadingProps) {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#787776]/70">
      <div className="flex flex-col items-center justify-center">
        <img src="/assets/loading.gif" alt="Loading..." className="w-32 h-32" />
      </div>
    </div>
  );
}

