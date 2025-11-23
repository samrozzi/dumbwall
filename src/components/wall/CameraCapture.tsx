import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, X } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

const CameraCapture = ({ onCapture, onClose }: CameraCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>("");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    // Detect available cameras - need to request permission first
    const detectCameras = async () => {
      try {
        // Request camera access first to populate device labels
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setAvailableCameras(videoDevices);
        console.log("Available cameras:", videoDevices.length);
        // Stop temp stream
        tempStream.getTracks().forEach(track => track.stop());
      } catch (err) {
        console.error("Error detecting cameras:", err);
        // If permission denied, still try to get device list
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter(device => device.kind === 'videoinput');
          setAvailableCameras(videoDevices);
        } catch (e) {
          console.error("Could not enumerate devices:", e);
        }
      }
    };

    detectCameras();
  }, []);

  useEffect(() => {
    let mediaStream: MediaStream | null = null;
    
    const startCamera = async () => {
      try {
        // Stop existing stream if any
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }

        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
          audio: false,
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        setError("Unable to access camera. Please check permissions.");
        console.error("Camera error:", err);
      }
    };

    startCamera();

    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode]);

  const toggleCamera = () => {
    setFacingMode(prev => prev === "environment" ? "user" : "environment");
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0);
    
    canvas.toBlob((blob) => {
      if (!blob) return;
      
      const file = new File([blob], `camera-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });
      
      onCapture(file);
      
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    }, "image/jpeg", 0.95);
  };

  if (error) {
    return (
      <div className="text-center p-4">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={onClose} variant="outline">Close</Button>
      </div>
    );
  }

  return (
    <div className="relative">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full rounded-lg"
      />
      <div className="flex gap-2 mt-4 justify-center flex-wrap">
        {availableCameras.length > 1 && (
          <Button onClick={toggleCamera} variant="secondary" size="lg">
            🔄 Switch Camera
          </Button>
        )}
        <Button onClick={capturePhoto} size="lg">
          <Camera className="w-5 h-5 mr-2" />
          Capture Photo
        </Button>
        <Button onClick={onClose} variant="outline" size="lg">
          <X className="w-5 h-5 mr-2" />
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default CameraCapture;
