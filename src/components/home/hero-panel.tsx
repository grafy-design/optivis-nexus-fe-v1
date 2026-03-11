"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import SolidButton from "@/components/ui/solid-button";

interface HeroPanelProps {
  title: string;
  description: string;
  imageUrl: string;
  videoUrl?: string;
  videoPlaybackRate?: number;
  videoScale?: number;
  videoReverseLoop?: boolean;
  serviceId?: string | null;
}

/**
 * Figma 스펙 기반 HeroPanel
 *
 * Frame 1618873789: 1396×400px, HORIZONTAL, gap=288px
 * Left (Frame 1618872474): 492×363px, VERTICAL, gap=72px
 *   - 제목 텍스트: Poppins 600 50px #111111, letterSpacing -3px
 *   - 설명: Inter 400 20px #484646
 *   - 버튼 (Solid Buttons): 218×48px, bg #FF6B00, r=32, padding 28px 24px
 *     텍스트 Inter 600 19.5px white
 * Right (image 8579): 675×400px r=24
 */
export default function HeroPanel({
  title,
  description,
  imageUrl,
  videoUrl,
  videoPlaybackRate = 1,
  videoScale = 1,
  videoReverseLoop = false,
  serviceId,
}: HeroPanelProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const reverseAnimationFrameRef = useRef<number | null>(null);
  const reverseLastTimestampRef = useRef<number | null>(null);
  const isReversingRef = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    const stopReverseAnimation = () => {
      if (reverseAnimationFrameRef.current !== null) {
        cancelAnimationFrame(reverseAnimationFrameRef.current);
        reverseAnimationFrameRef.current = null;
      }
      reverseLastTimestampRef.current = null;
      isReversingRef.current = false;
    };

    const startForwardPlayback = () => {
      stopReverseAnimation();
      video.playbackRate = videoPlaybackRate;
      void video.play();
    };

    const runReversePlayback = (timestamp: number) => {
      if (!isReversingRef.current) {
        return;
      }

      if (reverseLastTimestampRef.current === null) {
        reverseLastTimestampRef.current = timestamp;
      }

      const deltaSeconds = (timestamp - reverseLastTimestampRef.current) / 1000;
      reverseLastTimestampRef.current = timestamp;
      const nextTime = video.currentTime - deltaSeconds * Math.abs(videoPlaybackRate);

      if (nextTime <= 0) {
        video.currentTime = 0;
        startForwardPlayback();
        return;
      }

      video.currentTime = nextTime;
      reverseAnimationFrameRef.current = requestAnimationFrame(runReversePlayback);
    };

    const startReversePlayback = () => {
      if (!videoReverseLoop || isReversingRef.current) {
        return;
      }

      video.pause();
      isReversingRef.current = true;
      reverseLastTimestampRef.current = null;
      reverseAnimationFrameRef.current = requestAnimationFrame(runReversePlayback);
    };

    const applyPlaybackRate = () => {
      video.playbackRate = videoPlaybackRate;
    };

    const handleTimeUpdate = () => {
      if (!videoReverseLoop || !Number.isFinite(video.duration)) {
        return;
      }

      if (video.currentTime >= video.duration - 0.05) {
        startReversePlayback();
      }
    };

    applyPlaybackRate();
    video.addEventListener("loadedmetadata", applyPlaybackRate);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", startReversePlayback);

    return () => {
      video.removeEventListener("loadedmetadata", applyPlaybackRate);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", startReversePlayback);
      stopReverseAnimation();
    };
  }, [videoUrl, videoPlaybackRate, videoReverseLoop]);

  const isDisabled = serviceId === "7" || serviceId === "8" || serviceId === "9";

  const getSimulationPath = () => {
    if (serviceId === "4") return "/ats/simulation";
    if (serviceId === "5") return "/tsi";
    if (serviceId === "6") return "/drd";
    return "/simulation";
  };

  const handleNewSimulation = () => {
    if (!isDisabled) {
      router.push(getSimulationPath());
    }
  };

  return (
    <div
      className="flex w-full items-start flex-wrap"
      style={{
        gap: "clamp(20px, 4%, 288px)",
      }}
    >
      {/* Left - 텍스트 영역 (Figma 492px → 42% 비율) */}
      <div
        className="flex flex-col min-w-0  pl-1 pt-1"
        style={{ gap: "clamp(20px, 6%, 72px)", flex: "1 1 350px" }}
      >
        {/* Text group: VERTICAL gap=21.99px */}
        <div className="flex flex-col gap-3">
          {/* 제목*/}
          <h2
            className="text-page-title"
            style={{
              fontSize: "32px",
              fontWeight: "600",
              letterSpacing: "-0.8px",
            }}
          >
            {title}
          </h2>
          {/* 설명: Inter 400 20px #484646 */}
          <p
            className="home-hero-desc text-body4m text-text-secondary m-0"
            style={{
              lineHeight: "120%",
              letterSpacing: "-0.3px",
            }}
          >
            {description}
          </p>
        </div>

        <SolidButton className="shrink-0"
          variant="primary"
          size="m"
          onClick={handleNewSimulation}
          disabled={isDisabled}
          iconPosition="right"
          icon="play"
        >
          New Simulation
        </SolidButton>
      </div>

      {/* Right - 이미지 또는 비디오: Figma 675×400px r=24 (58% 비율) */}
      <div
        className="overflow-hidden bg-black rounded-[20px] max-w-[675px] aspect-[675/400]"
        style={{
          flex: "1 1 400px",
        }}
      >
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            autoPlay
            loop={!videoReverseLoop}
            muted
            playsInline
            className="w-full h-full object-cover origin-center"
            style={{
              transform: `scale(${videoScale})`,
            }}
          />
        ) : (
          <Image
            src={imageUrl}
            alt={title}
            width={675}
            height={400}
            className="w-full h-full object-cover"
            priority
          />
        )}
      </div>

      <style jsx>{`
        /* [TEMP_SCALE_MODE_DISABLE] 차후 반응형 작업 시 복구
        @media (max-width: 1800px) {
          .home-hero-title {
            font-size: clamp(25px, 3.2vw, 47px) !important;
          }

          .home-hero-desc {
            font-size: clamp(12px, 1.1vw, 17px) !important;
          }

          .home-hero-btn-text {
            font-size: 16.5px !important;
          }

          .home-hero-btn-icon {
            width: 18px !important;
            height: 18px !important;
          }
        }
        */
      `}</style>
    </div>
  );
}
