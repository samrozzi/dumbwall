import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreateMusicDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (songTitle: string, artist: string, musicUrl: string, albumArt?: string) => void;
}

export const CreateMusicDialog = ({ open, onOpenChange, onCreate }: CreateMusicDialogProps) => {
  const [songTitle, setSongTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [musicUrl, setMusicUrl] = useState("");
  const [albumArt, setAlbumArt] = useState("");

  const handleCreate = () => {
    if (songTitle.trim() && artist.trim() && musicUrl.trim()) {
      onCreate(songTitle, artist, musicUrl, albumArt || undefined);
      setSongTitle("");
      setArtist("");
      setMusicUrl("");
      setAlbumArt("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Music</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Song Title</Label>
            <Input
              value={songTitle}
              onChange={(e) => setSongTitle(e.target.value)}
              placeholder="Bohemian Rhapsody"
            />
          </div>
          <div>
            <Label>Artist</Label>
            <Input
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Queen"
            />
          </div>
          <div>
            <Label>Music Link</Label>
            <Input
              value={musicUrl}
              onChange={(e) => setMusicUrl(e.target.value)}
              placeholder="Spotify, YouTube, or Apple Music URL"
              type="url"
            />
          </div>
          <div>
            <Label>Album Art URL (optional)</Label>
            <Input
              value={albumArt}
              onChange={(e) => setAlbumArt(e.target.value)}
              placeholder="https://..."
              type="url"
            />
          </div>
          <Button onClick={handleCreate} className="w-full">
            Share Song
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
