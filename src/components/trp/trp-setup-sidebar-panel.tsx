import TrpFramePanel from "@/components/trp/trp-frame-panel";
import TrpSetupSidebar from "@/components/trp/trp-setup-sidebar";
import type { TrpSetupSidebarStep } from "@/components/trp/setup-steps";

type TrpSetupSidebarPanelProps = {
  steps: readonly TrpSetupSidebarStep[];
  panelVariant?: "left" | "middle" | "right";
};

export default function TrpSetupSidebarPanel({
  steps,
  panelVariant = "middle",
}: TrpSetupSidebarPanelProps) {
  return (
    <TrpFramePanel variant={panelVariant} className="flex min-h-0 min-w-[356px] flex-col">
      <TrpSetupSidebar steps={steps} />
    </TrpFramePanel>
  );
}
