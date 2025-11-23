import { useParams } from "react-router-dom";
import Navigation from "@/components/Navigation";

const Chat = () => {
  const { circleId } = useParams();

  return (
    <div className="min-h-screen bg-background">
      <Navigation circleId={circleId} />
      <div className="pl-24 pr-8 pt-8">
        <h1 className="text-3xl font-bold mb-6">Chat</h1>
        <p className="text-muted-foreground">Chat feature coming soon!</p>
      </div>
    </div>
  );
};

export default Chat;
