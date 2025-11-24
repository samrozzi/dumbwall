import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface LinkPreviewData {
  url: string;
  title?: string;
  description?: string;
  image_url?: string;
  site_name?: string;
}

interface LinkPreviewProps {
  url: string;
  onLoad?: (preview: LinkPreviewData) => void;
}

export const LinkPreview = ({ url, onLoad }: LinkPreviewProps) => {
  const [preview, setPreview] = useState<LinkPreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchPreview();
  }, [url]);

  const fetchPreview = async () => {
    try {
      // In a real app, you'd call your backend endpoint that fetches OpenGraph data
      // For now, we'll show a simple preview with the URL
      const domain = new URL(url).hostname;

      // Simulated preview data - in production, use a metadata scraping service
      const previewData: LinkPreviewData = {
        url,
        title: domain,
        description: url,
        site_name: domain
      };

      setPreview(previewData);
      if (onLoad) {
        onLoad(previewData);
      }
      setLoading(false);
    } catch (err) {
      setError(true);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-3 max-w-md">
        <div className="flex gap-3">
          <Skeleton className="w-20 h-20 rounded flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      </Card>
    );
  }

  if (error || !preview) {
    return null;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block max-w-md hover:opacity-90 transition-opacity"
    >
      <Card className="p-3 hover:bg-accent/50 transition-colors">
        <div className="flex gap-3">
          {preview.image_url && (
            <img
              src={preview.image_url}
              alt={preview.title || ''}
              className="w-20 h-20 object-cover rounded flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            {preview.title && (
              <h4 className="font-medium text-sm line-clamp-1 mb-1">{preview.title}</h4>
            )}
            {preview.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                {preview.description}
              </p>
            )}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <ExternalLink className="w-3 h-3" />
              <span className="truncate">{preview.site_name || new URL(url).hostname}</span>
            </div>
          </div>
        </div>
      </Card>
    </a>
  );
};
