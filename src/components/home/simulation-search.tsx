"use client";

import Input from "@/components/ui/input";
import Image from "next/image";

export default function SimulationSearch() {
  return (
    <div className="w-[356px]">
      <Input
        placeholder="Search"
        icon={
          <Image
            src="/assets/main/search.svg"
            alt="Search"
            width={16}
            height={16}
            className="object-contain"
          />
        }
      />
    </div>
  );
}
