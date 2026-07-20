interface AnnouncementBarProps {
  text?: string | null;
}

export function AnnouncementBar({ text }: AnnouncementBarProps) {
  if (!text) return null;

  return (
    <div className="bg-primary text-on-primary text-center py-2.5 px-4 text-xs md:text-[12.5px] tracking-[0.16em] uppercase font-medium">
      {text}
    </div>
  );
}
