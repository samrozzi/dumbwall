import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Zap, Image as ImageIcon, MessageSquare, ChevronDown, ChevronUp, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ChallengeCardProps {
  content: {
    prompt: string;
    category: string;
    responses?: Array<{ userId: string; text?: string; imageUrl?: string; username?: string }>;
  };
  itemId: string;
  currentUserId?: string;
  onDelete?: () => void;
  isCreator?: boolean;
}

export const ChallengeCard = ({ content, itemId, currentUserId, onDelete, isCreator }: ChallengeCardProps) => {
  const [showRespond, setShowRespond] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showResponses, setShowResponses] = useState(false);
  const { toast } = useToast();

  const responses = content.responses || [];
  const hasResponded = responses.some(r => r.userId === currentUserId);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUserId) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${currentUserId}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-images')
        .getPublicUrl(filePath);

      await handleSubmitResponse(publicUrl);
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Could not upload image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitResponse = async (imageUrl?: string) => {
    if (!currentUserId) return;
    if (!responseText && !imageUrl) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', currentUserId)
      .single();

    const newResponse = {
      userId: currentUserId,
      username: profile?.username || 'Unknown',
      text: responseText || undefined,
      imageUrl: imageUrl || undefined,
    };

    const updatedResponses = [...responses, newResponse];

    const { error } = await supabase
      .from('wall_items')
      .update({
        content: {
          ...content,
          responses: updatedResponses,
        }
      })
      .eq('id', itemId);

    if (error) {
      toast({
        title: "Error",
        description: "Could not submit response",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Response added!",
        description: "Your response has been posted",
      });
      setResponseText("");
      setShowRespond(false);
    }
  };

  return (
    <>
      <Card className="p-4 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20 border-2 border-rose-200 dark:border-rose-800 w-[320px] relative">
        {isCreator && onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/80 dark:bg-black/80 hover:bg-white dark:hover:bg-black flex items-center justify-center transition-colors z-10"
          >
            <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        )}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="bg-rose-500 rounded-full p-2 flex-shrink-0">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base mb-2 break-words text-gray-900 dark:text-white">{content.prompt}</h3>
              <div className="flex gap-2 flex-wrap">
                {!hasResponded && (
                  <Button
                    size="sm"
                    onClick={() => setShowRespond(true)}
                    className="bg-rose-500 hover:bg-rose-600 text-white"
                  >
                    Respond Now
                  </Button>
                )}
                {responses.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowResponses(!showResponses)}
                    className="border-rose-300"
                  >
                    {responses.length} {responses.length === 1 ? 'Response' : 'Responses'}
                    {showResponses ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {showResponses && responses.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {responses.map((response, idx) => (
                <div key={idx} className="bg-white/50 dark:bg-black/20 rounded p-2 text-sm">
                  <p className="font-semibold text-xs text-rose-600">{response.username}</p>
                  {response.imageUrl && (
                    <img src={response.imageUrl} alt="Response" className="w-full rounded mt-1 mb-1" />
                  )}
                  {response.text && <p className="mt-1">{response.text}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      <Dialog open={showRespond} onOpenChange={setShowRespond}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Respond to Challenge</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="font-semibold">{content.prompt}</p>
            
            {content.category === "photo" ? (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="challenge-image"
                  disabled={uploading}
                />
                <label htmlFor="challenge-image">
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={uploading}
                    asChild
                  >
                    <span>
                      <ImageIcon className="w-4 h-4 mr-2" />
                      {uploading ? "Uploading..." : "Upload Photo"}
                    </span>
                  </Button>
                </label>
              </div>
            ) : (
              <>
                <Textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Type your response..."
                  rows={4}
                />
                <Button
                  onClick={() => handleSubmitResponse()}
                  disabled={!responseText.trim()}
                  className="w-full"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Submit Response
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
