import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StatusSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const statuses = [
  { value: "auto", label: "Auto", color: "text-blue-500" },
  { value: "manual_online", label: "Online", color: "text-green-500" },
  { value: "manual_away", label: "Away", color: "text-yellow-500" },
  { value: "manual_dnd", label: "Do Not Disturb", color: "text-orange-500" },
  { value: "manual_offline", label: "Appear Offline", color: "text-gray-400" }
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
