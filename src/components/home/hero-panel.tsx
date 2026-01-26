"use client";

import { useRouter } from "next/navigation";
import Button from "@/components/ui/button";
import Image from "next/image";

interface HeroPanelProps {
  title: string;
  description: string;
  imageUrl: string;
  serviceId?: string | null;
}

export default function HeroPanel({
  title,
  description,
  imageUrl,
  serviceId,
}: HeroPanelProps) {
  const router = useRouter();

  // Drug Response Prediction Dashboard (serviceId: "6")는 아직 비활성화
  const isDisabled = serviceId === "6";

  const handleNewSimulation = () => {
    if (!isDisabled) {
    router.push("/simulation");
    }
  };

  return (
    <div className="flex gap-4 w-full">
      {/* Left - Text */}
      <div className="flex flex-col gap-4 flex-1 justify-between">
        <div className="flex flex-col gap-4">
        <h2 className="text-title text-[#1b1b1b]">
          {title}
        </h2>
        <p className="text-body4 text-[#3c3f44]">
          {description}
        </p>
        </div>
        <Button 
          variant="orange" 
          size="md" 
          icon="play" 
          iconPosition="right"
          className="w-[188px]"
          onClick={handleNewSimulation}
          disabled={isDisabled}
        >
          New Simulation
        </Button>
      </div>

      {/* Right - Image */}
      <div className="flex-shrink-0 rounded-[18px] overflow-hidden w-[500px] h-[296px]">
        <Image
          src={imageUrl}
          alt={title}
          width={500}
          height={296}
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
}

