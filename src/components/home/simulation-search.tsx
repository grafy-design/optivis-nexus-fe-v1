"use client";

import Input from "@/components/ui/input";
import Image from "next/image";
import { ChangeEventHandler } from "react";

interface SimulationSearchProps {
  keyword: string;
  onChangeKeyword: ChangeEventHandler<HTMLInputElement>;
}

export default function SimulationSearch({ keyword, onChangeKeyword }: SimulationSearchProps) {
  return (
    <div className="min-w-[356px]">
      <Input
        placeholder="Search"
        value={keyword}
        onChange={onChangeKeyword}
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
