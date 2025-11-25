import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { MoreVertical, Edit, Trash2, Pin, Forward, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface MessageActionsProps {
  messageId: string;
  isOwn: boolean;
  isPinned: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onDeleteForMe: () => void;
  onPin: () => void;
  onForward: () => void;
  onCopy: () => void;
}

export const MessageActions = ({
  messageId,
  isOwn,
  isPinned,
  onEdit,
  onDelete,
  onDeleteForMe,
  onPin,
  onForward,
  onCopy
}: MessageActionsProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteType, setDeleteType] = useState<'me' | 'everyone'>('me');

  const handleDeleteForMe = () => {
    setDeleteType('me');
    setShowDeleteDialog(true);
  };

  const handleDeleteForEveryone = () => {
    setDeleteType('everyone');
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (deleteType === 'everyone') {
      onDelete();
    } else {
      onDeleteForMe();
    }
    setShowDeleteDialog(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onCopy}>
            <Copy className="w-4 h-4 mr-2" />
            Copy
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onForward}>
            <Forward className="w-4 h-4 mr-2" />
            Forward
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onPin}>
            <Pin className="w-4 h-4 mr-2" />
            {isPinned ? 'Unpin' : 'Pin'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDeleteForMe} className="text-destructive">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete for Me
          </DropdownMenuItem>
          {isOwn && (
            <>
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDeleteForEveryone} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete for Everyone
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteType === 'everyone' 
                ? "This message will be deleted for everyone. This action cannot be undone."
                : "This message will be removed from your view only."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
