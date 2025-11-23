import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CircleSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  circleId: string;
  circleName: string;
  currentPermission?: 'anyone' | 'owner_only';
  onSuccess: () => void;
}

export function CircleSettingsDialog({
  open,
  onOpenChange,
  circleId,
  circleName,
  currentPermission = 'owner_only',
  onSuccess,
}: CircleSettingsDialogProps) {
  const [invitePermission, setInvitePermission] = useState<'anyone' | 'owner_only'>(currentPermission);
  const [saving, setSaving] = useState(false);

  // Sync state with prop when dialog opens or permission changes
  useEffect(() => {
    if (open) {
      setInvitePermission(currentPermission);
    }
  }, [open, currentPermission]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Check if settings exist
      const { data: existing } = await supabase
        .from('circle_settings')
        .select('circle_id')
        .eq('circle_id', circleId)
        .maybeSingle();

      if (existing) {
        // Update existing settings
        const { error } = await supabase
          .from('circle_settings')
          .update({ invite_permission: invitePermission })
          .eq('circle_id', circleId);
        
        if (error) throw error;
      } else {
        // Insert new settings
        const { error } = await supabase
          .from('circle_settings')
          .insert({ circle_id: circleId, invite_permission: invitePermission });
        
        if (error) throw error;
      }

      toast.success('Circle settings updated!');
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error('Failed to update settings: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Circle Settings: {circleName}</DialogTitle>
          <DialogDescription>
            Configure who can invite new members to this circle.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="invite-permission">Invite Permissions</Label>
            <Select
              value={invitePermission}
              onValueChange={(value: 'anyone' | 'owner_only') => setInvitePermission(value)}
            >
              <SelectTrigger id="invite-permission">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="owner_only">Owner Only</SelectItem>
                <SelectItem value="anyone">Anyone in Circle</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {invitePermission === 'owner_only' 
                ? 'Only the circle owner can send invitations.' 
                : 'All circle members can send invitations directly.'}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
