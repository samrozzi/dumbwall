import { Card } from "@/components/ui/card";

interface DoodleCanvasProps {
  content: {
    imageUrl: string;
  };
}

export const DoodleCanvas = ({ content }: DoodleCanvasProps) => {
  return (
    <Card className="p-2 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20 border-2 border-teal-200 dark:border-teal-800 w-[320px]">
      <img
        src={content.imageUrl}
        alt="Doodle"
        className="w-full h-auto rounded"
      />
    </Card>
  );
};
