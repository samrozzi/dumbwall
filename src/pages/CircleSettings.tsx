import { useParams } from "react-router-dom";
import Navigation from "@/components/Navigation";

const CircleSettings = () => {
  const { circleId } = useParams();

  return (
    <div className="min-h-screen bg-background">
      <Navigation circleId={circleId} />
      <div className="pl-24 pr-8 pt-8">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        <p className="text-muted-foreground">Settings coming soon!</p>
      </div>
    </div>
  );
};

export default CircleSettings;
