import { format, isToday, isYesterday, isThisYear } from 'date-fns';

interface DateSeparatorProps {
  date: Date;
}

export const DateSeparator = ({ date }: DateSeparatorProps) => {
  const getDateLabel = () => {
    if (isToday(date)) {
      return 'Today';
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else if (isThisYear(date)) {
      return format(date, 'MMMM d'); // e.g., "November 24"
    } else {
      return format(date, 'MMMM d, yyyy'); // e.g., "November 24, 2024"
    }
  };

  return (
    <div className="flex items-center gap-4 my-4 px-4">
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {getDateLabel()}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
};
