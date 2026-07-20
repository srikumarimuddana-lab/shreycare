interface AnnouncementBarProps {
  text?: string | null;
}

const DEFAULT_ANNOUNCEMENT =
  "Handcrafted in Regina, SK · Free carbon-neutral shipping across Canada over $45";

export function AnnouncementBar({ text }: AnnouncementBarProps) {
  const message = text?.trim() || DEFAULT_ANNOUNCEMENT;

  return (
    <div className="bg-primary text-on-primary text-center py-2.5 px-4 text-[11px] md:text-[12.5px] tracking-[0.16em] uppercase font-medium">
      {message}
    </div>
  );
}
