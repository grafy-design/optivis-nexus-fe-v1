"use client";

import { useEffect, useRef } from "react";

interface PackageVideoPanelProps {
  title: string;
  description: string;
  videoUrl: string;
  videoStartOffsetSeconds?: number;
  videoPlaybackRate?: number;
  videoScale?: number;
  videoReverseLoop?: boolean;
}

export default function PackageVideoPanel({
  title,
  description,
  videoUrl,
  videoStartOffsetSeconds,
  videoPlaybackRate = 0.7,
  videoScale = 1,
  videoReverseLoop = false,
}: PackageVideoPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasAppliedStartOffsetRef = useRef(false);
  const reverseAnimationFrameRef = useRef<number | null>(null);
  const reverseLastTimestampRef = useRef<number | null>(null);
  const isReversingRef = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    hasAppliedStartOffsetRef.current = false;

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

    const applyPlaybackConfig = () => {
      video.playbackRate = videoPlaybackRate;

      if (
        !hasAppliedStartOffsetRef.current &&
        typeof videoStartOffsetSeconds === "number" &&
        videoStartOffsetSeconds > 0 &&
        Number.isFinite(video.duration)
      ) {
        const maxStart = Math.max(0, video.duration - 0.1);
        video.currentTime = Math.min(videoStartOffsetSeconds, maxStart);
        hasAppliedStartOffsetRef.current = true;
      }
    };

    const handleTimeUpdate = () => {
      if (!videoReverseLoop || !Number.isFinite(video.duration)) {
        return;
      }

      if (video.currentTime >= video.duration - 0.05) {
        startReversePlayback();
      }
    };

    applyPlaybackConfig();
    video.addEventListener("loadedmetadata", applyPlaybackConfig);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", startReversePlayback);

    return () => {
      video.removeEventListener("loadedmetadata", applyPlaybackConfig);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", startReversePlayback);
      stopReverseAnimation();
    };
  }, [videoUrl, videoPlaybackRate, videoStartOffsetSeconds, videoReverseLoop]);

  return (
    <div
      className="relative flex flex-col w-full h-full overflow-hidden"
      style={{
        borderRadius: "24px", // Matching internal radius of HeroPanel's image/right section approx or just rounding it nicely
        backgroundColor: "#000",
      }}
    >
      {/* Video Background */}
      <video
        ref={videoRef}
        src={videoUrl}
        autoPlay
        loop={!videoReverseLoop}
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover object-center"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${videoScale})`,
          transformOrigin: "center center",
        }}
      />

      {/* Text Overlay */}
      {/* 
        Positioning: Top-Left
        Style: Matching FeatureCard/HeroPanel text styles but adapted for overlay visibility.
        Using a gradient overlay for text readability if needed, or just placing it. 
        User request: "Text selected content... Twin Predict, Simulate..."
        I'll add a subtle gradient to ensure text pops against the video.
      */}
      <div
        className="relative z-10 flex flex-col items-start justify-start p-8"
        style={{
          background: "linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%)",
          width: "100%",
          padding: "40px", // Giving some space
          gap: "16px",
        }}
      >
        <h2
          className="home-package-video-title"
          style={{
            fontFamily: "Poppins",
            fontSize: "clamp(32px, 4vw, 48px)",
            fontWeight: 600,
            lineHeight: "1.1",
            letterSpacing: "-0.02em",
            color: "#FFFFFF",
            margin: 0,
            maxWidth: "80%",
            textShadow: "0px 2px 4px rgba(0,0,0,0.3)",
          }}
        >
          {title}
        </h2>
        <p
          className="home-package-video-desc"
          style={{
            fontFamily: "Inter",
            fontSize: "clamp(16px, 1.5vw, 20px)",
            fontWeight: 400,
            lineHeight: "1.65",
            color: "rgba(255, 255, 255, 0.9)",
            margin: 0,
            maxWidth: "600px",
            textShadow: "0px 1px 2px rgba(0,0,0,0.3)",
          }}
        >
          {description}
        </p>
      </div>

      <style jsx>{`
        /* [TEMP_SCALE_MODE_DISABLE] 차후 반응형 작업 시 복구
        @media (max-width: 1800px) {
          .home-package-video-title {
            font-size: clamp(29px, 3.7vw, 45px) !important;
          }

          .home-package-video-desc {
            font-size: clamp(13px, 1.2vw, 17px) !important;
          }
        }
        */
      `}</style>
    </div>
  );
}
