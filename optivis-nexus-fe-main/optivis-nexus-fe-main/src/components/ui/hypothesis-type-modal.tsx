"use client";

import * as Dialog from "@radix-ui/react-dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

interface HypothesisTypeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type HypothesisVariant = "superiority" | "equivalence" | "non-inferiority";

interface HypothesisCardData {
  title: string;
  purpose: string;
  sampleSize: string;
  variant: HypothesisVariant;
}

const HYPOTHESIS_CARDS: HypothesisCardData[] = [
  {
    title: "Superiority",
    purpose:
      "Selected when the objective is to demonstrate that the new treatment is superior to the existing one.",
    sampleSize:
      "A larger treatment effect allows a smaller sample size and a more efficient trial.",
    variant: "superiority",
  },
  {
    title: "Equivalence",
    purpose:
      "Selected when the objective is to demonstrate the new has essentially the same efficacy comparable to the standard.",
    sampleSize:
      "Because the equivalence margin is small, this design requires the largest sample size.",
    variant: "equivalence",
  },
  {
    title: "Non-inferiority",
    purpose:
      "Selected when the objective is to demonstrate that the new treatment is not inferior to the standard, while offering similar efficacy with improved safety, tolerability, or convenience.",
    sampleSize: "When the treatment difference is more pronounced, fewer patients are required.",
    variant: "non-inferiority",
  },
];

function HypothesisVisual({ variant }: { variant: HypothesisVariant }) {
  const blueSegments = {
    superiority: { x1: 121, x2: 231 },
    equivalence: { x1: 52, x2: 191 },
    "non-inferiority": { x1: 52, x2: 231 },
  }[variant];

  return (
    <svg
      aria-hidden="true"
      width="244"
      height="130"
      viewBox="0 0 244 130"
      className="block h-full w-full"
    >
      <rect width="244" height="130" rx="18" fill="#EFEFF4" />
      <line
        x1="24"
        y1="60"
        x2="220"
        y2="60"
        stroke="#C4C2C5"
        strokeLinecap="round"
        strokeWidth="9"
      />
      <line
        x1={blueSegments.x1}
        y1="60"
        x2={blueSegments.x2}
        y2="60"
        stroke="#231F52"
        strokeLinecap="round"
        strokeWidth="9"
      />
      <line
        x1="92"
        y1="40"
        x2="92"
        y2="78"
        stroke="#D1D0D6"
        strokeDasharray="2 3"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <line
        x1="140"
        y1="38"
        x2="140"
        y2="78"
        stroke="#C9C8D1"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <line
        x1="188"
        y1="40"
        x2="188"
        y2="78"
        stroke="#D1D0D6"
        strokeDasharray="2 3"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <text
        x="92"
        y="97"
        fill="#B8B7C1"
        fontFamily="Inter"
        fontSize="12"
        fontWeight="500"
        textAnchor="middle"
      >
        +Δ
      </text>
      <text
        x="140"
        y="97"
        fill="#B8B7C1"
        fontFamily="Inter"
        fontSize="12"
        fontWeight="500"
        textAnchor="middle"
      >
        0
      </text>
      <text
        x="188"
        y="97"
        fill="#B8B7C1"
        fontFamily="Inter"
        fontSize="12"
        fontWeight="500"
        textAnchor="middle"
      >
        +Δ
      </text>
    </svg>
  );
}

function HypothesisCard({ title, purpose, sampleSize, variant }: HypothesisCardData) {
  return (
    <article className="flex h-[360px] w-[268px] flex-col rounded-[26px] bg-white px-3 pt-3 pb-[14px]">
      <div className="h-[130px] w-[244px] shrink-0 overflow-hidden rounded-[18px]">
        <HypothesisVisual variant={variant} />
      </div>

      <h3
        className="m-0 mt-[18px] text-[#313030]"
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: "26.5px",
          fontWeight: 500,
          lineHeight: "26.5px",
          letterSpacing: "-0.8px",
        }}
      >
        {title}
      </h3>

      <div className="mt-2 h-px w-[242px] shrink-0 bg-[#E3E1E5]" />

      <section className="mt-3">
        <p
          className="m-0 text-[#313030]"
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "12.5px",
            fontWeight: 600,
            lineHeight: "12.5px",
            letterSpacing: "-0.375px",
          }}
        >
          Purpose
        </p>
        <p
          className="mt-1 mb-0 w-[236px] text-[#5F5E5E]"
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "11.5px",
            fontWeight: 400,
            lineHeight: "1.18",
            letterSpacing: "-0.345px",
            textWrap: "pretty",
          }}
        >
          {purpose}
        </p>
      </section>

      <section className="my-4">
        <p
          className="m-0 text-[#313030]"
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "12.5px",
            fontWeight: 600,
            lineHeight: "12.5px",
            letterSpacing: "-0.375px",
          }}
        >
          Sample Size
        </p>
        <p
          className="mt-1 mb-0 w-[236px] text-[#5F5E5E]"
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "11.5px",
            fontWeight: 400,
            lineHeight: "1.18",
            letterSpacing: "-0.345px",
            textWrap: "pretty",
          }}
        >
          {sampleSize}
        </p>
      </section>
    </article>
  );
}

function ClosePillButton() {
  return (
    <span className="pointer-events-none block h-full w-full">
      <svg
        aria-hidden="true"
        width="120"
        height="48"
        viewBox="0 0 120 48"
        className="block h-full w-full"
      >
        <defs>
          <linearGradient id="hypothesis-close-fill" x1="60" y1="0" x2="60" y2="48">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.08" />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity="0.04" />
          </linearGradient>
        </defs>
        <rect
          x="0.75"
          y="0.75"
          width="118.5"
          height="46.5"
          rx="23.25"
          fill="url(#hypothesis-close-fill)"
          stroke="#FFFFFF"
          strokeOpacity="0.22"
          strokeWidth="1.5"
        />
        <text
          x="42"
          y="29"
          fill="#FFFFFF"
          fontFamily="Inter"
          fontSize="19.5"
          fontWeight="600"
          letterSpacing="-0.58px"
          textAnchor="middle"
        >
          Close
        </text>
        <path
          d="M79 17 L89 27 M89 17 L79 27"
          stroke="#FFFFFF"
          strokeLinecap="round"
          strokeWidth="2.5"
        />
      </svg>
    </span>
  );
}

export default function HypothesisTypeModal({ open, onOpenChange }: HypothesisTypeModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[110] bg-black/80" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-[120] h-[522px] w-[880px] -translate-x-1/2 -translate-y-1/2 border-0 bg-transparent p-0 outline-none">
          <VisuallyHidden.Root>
            <Dialog.Title>Hypothesis Type Overview</Dialog.Title>
            <Dialog.Description>
              Choose the hypothesis based on your study goal and margin assumptions
            </Dialog.Description>
          </VisuallyHidden.Root>

          <div className="relative h-full w-full overflow-hidden rounded-[34px] bg-[#676766]">
            <div className="absolute top-[27px] left-[23px]">
              <h2
                className="m-0 text-white"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "40px",
                  fontWeight: 600,
                  lineHeight: "40px",
                  letterSpacing: "-1.2px",
                }}
              >
                Hypothesis Type Overview
              </h2>
              <p
                className="m-0 text-white/52"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "18.75px",
                  fontWeight: 500,
                  lineHeight: "22px",
                  letterSpacing: "-0.56px",
                  marginTop: "14px",
                }}
              >
                Choose the hypothesis based on your study goal and margin assumptions
              </p>
            </div>

            <div className="absolute top-[144px] left-[26px] flex gap-3">
              {HYPOTHESIS_CARDS.map((card) => (
                <HypothesisCard key={card.title} {...card} />
              ))}
            </div>

            <Dialog.Close asChild>
              <button className="absolute top-6 right-6 z-10 flex h-12 w-[120px] cursor-pointer items-center justify-center transition-opacity hover:opacity-70">
                <span className="sr-only">Close</span>
                <ClosePillButton />
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
