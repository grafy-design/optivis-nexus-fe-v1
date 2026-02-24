"use client";

import * as Dialog from "@radix-ui/react-dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import Image from "next/image";

interface HypothesisTypeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function HypothesisTypeModal({
  open,
  onOpenChange,
}: HypothesisTypeModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/80 z-[110]" />
        <Dialog.Content className="opacity-94 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[120] w-[880px] h-[522px] p-0 border-0 bg-transparent">
          <VisuallyHidden.Root>
            <Dialog.Title>Hypothesis Type Overview</Dialog.Title>
            <Dialog.Description>
              Choose the hypothesis based on your study goal and margin
              assumptions
            </Dialog.Description>
          </VisuallyHidden.Root>
          {/* Background Image */}
          <div className="relative w-full h-full">
            <Image
              src="/assets/simulation/hypothesis-overview.png"
              alt="Hypothesis Type Overview"
              width={880}
              height={522}
              className="w-full h-full object-cover"
              priority
            />
            {/* Close Button - 우측 상단 */}
            <Dialog.Close asChild>
              <button className="absolute top-6 right-6 w-[120px] h-12 flex items-center justify-center hover:opacity-70 transition-opacity cursor-pointer z-10">
                <Image
                  src="/assets/simulation/close-button.png"
                  alt="Close"
                  width={120}
                  height={48}
                  className="flex-shrink-0 w-full h-full object-contain"
                />
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
