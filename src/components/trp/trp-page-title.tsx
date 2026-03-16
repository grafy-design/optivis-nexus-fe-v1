type TrpPageTitleProps = {
  title: string;
  subtitle?: string;
};

export default function TrpPageTitle({ title, subtitle }: TrpPageTitleProps) {
  return (
    <div className="flex h-[84px] max-h-[84px] flex-col gap-3 px-3">
      <h1 className="m-0 font-[Poppins,Inter,sans-serif] text-[48px] leading-none font-semibold tracking-[-0.05em] text-[#111111]">
        {title}
      </h1>
      {subtitle ? (
        <p className="m-0 truncate font-[Inter,sans-serif] text-[16px] leading-[1.2] font-semibold tracking-[-0.03em] text-[#787776]">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
