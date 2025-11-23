import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, Upload, X, Send } from "lucide-react";
import CameraCapture from "@/components/wall/CameraCapture";
import { compressImage, formatFileSize } from "@/lib/imageCompression";
import { toast } from "sonner";

interface ChatPhotoUploadProps {
  onPhotoSelected: (file: File, caption: string) => Promise<void>;
  onClose: () => void;
}

const ChatPhotoUpload = ({ onPhotoSelected, onClose }: ChatPhotoUploadProps) => {
  const [activeTab, setActiveTab] = useState<"camera" | "upload">("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [caption, setCaption] = useState("");
  const [compressionInfo, setCompressionInfo] = useState<{
    original: number;
    compressed: number;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (5MB max)
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      toast.error("Image too large. Maximum size is 5MB");
      return;
    }

    try {
      // Compress image
      const { blob, originalSize, compressedSize } = await compressImage(file);
      const compressedFile = new File([blob], file.name, { type: "image/jpeg" });

      setSelectedFile(compressedFile);
      setPreviewUrl(URL.createObjectURL(blob));
      setCompressionInfo({ original: originalSize, compressed: compressedSize });
    } catch (error) {
      console.error("Error compressing image:", error);
      toast.error("Failed to process image");
    }
  };

  const handleCameraCapture = (file: File) => {
    handleFileSelect(file);
    setActiveTab("upload"); // Switch to upload tab to show preview
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSend = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      await onPhotoSelected(selectedFile, caption);
      onClose();
    } catch (error) {
      console.error("Error sending photo:", error);
      toast.error("Failed to send photo");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "camera" | "upload")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="camera">
            <Camera className="w-4 h-4 mr-2" />
            Camera
          </TabsTrigger>
          <TabsTrigger value="upload">
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </TabsTrigger>
        </TabsList>

        <TabsContent value="camera" className="space-y-4">
          <CameraCapture onCapture={handleCameraCapture} onClose={onClose} />
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          {!selectedFile ? (
            <div className="text-center py-8">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
              <Button onClick={handleUploadClick} size="lg">
                <Upload className="w-5 h-5 mr-2" />
                Choose from Gallery
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                Maximum file size: 5MB
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Image Preview */}
              <div className="relative rounded-lg overflow-hidden border-2 border-border">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full max-h-64 object-contain bg-black"
                />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl("");
                    setCompressionInfo(null);
                    setCaption("");
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Compression Info */}
              {compressionInfo && (
                <div className="text-sm text-muted-foreground text-center">
                  {formatFileSize(compressionInfo.original)} →{" "}
                  {formatFileSize(compressionInfo.compressed)}
                </div>
              )}

              {/* Caption Input */}
              <div className="space-y-2">
                <Label htmlFor="caption">Caption (optional)</Label>
                <Input
                  id="caption"
                  placeholder="Add a caption..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                />
              </div>

              {/* Send Button */}
              <Button
                onClick={handleSend}
                disabled={uploading}
                className="w-full"
                size="lg"
              >
                <Send className="w-4 h-4 mr-2" />
                {uploading ? "Sending..." : "Send Photo"}
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ChatPhotoUpload;
