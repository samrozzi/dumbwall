import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StatusSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const statuses = [
  { value: "available", label: "Available", color: "text-green-500" },
  { value: "busy", label: "Busy", color: "text-red-500" },
  { value: "away", label: "Away", color: "text-yellow-500" },
  { value: "offline", label: "Offline", color: "text-gray-400" }
];

export const StatusSelector = ({ value, onChange }: StatusSelectorProps) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {statuses.map((status) => (
          <SelectItem key={status.value} value={status.value}>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${status.color.replace('text-', 'bg-')}`} />
              {status.label}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
