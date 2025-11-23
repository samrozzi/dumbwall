import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RateThisMetadata } from "@/types/games";
import { Star } from "lucide-react";

interface RateThisGameProps {
  gameId: string;
  title: string | null;
  metadata: RateThisMetadata;
  userId: string;
  onRate: (rating: number) => void;
  isFinished: boolean;
}

export const RateThisGame = ({
  gameId,
  title,
  metadata,
  userId,
  onRate,
  isFinished,
}: RateThisGameProps) => {
  const [hoveredRating, setHoveredRating] = useState(0);
  const userRating = metadata.ratings.find(r => r.userId === userId);
  const hasRated = !!userRating;

  const averageRating = metadata.ratings.length > 0
    ? metadata.ratings.reduce((sum, r) => sum + r.rating, 0) / metadata.ratings.length
    : 0;

  const handleRate = (rating: number) => {
    if (!hasRated && !isFinished) {
      onRate(rating);
    }
  };

  return (
    <Card className="w-80 shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg text-center">
          {title || "Rate This"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center space-y-2">
          <h3 className="text-xl font-bold">{metadata.subject}</h3>
          {metadata.imageUrl && (
            <div className="aspect-video bg-muted rounded-lg overflow-hidden">
              <img 
                src={metadata.imageUrl} 
                alt={metadata.subject}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        <div className="flex justify-center gap-2 py-4">
          {Array.from({ length: metadata.maxRating }, (_, i) => i + 1).map((rating) => (
            <button
              key={rating}
              onClick={() => handleRate(rating)}
              onMouseEnter={() => !hasRated && setHoveredRating(rating)}
              onMouseLeave={() => !hasRated && setHoveredRating(0)}
              disabled={hasRated || isFinished}
              className="transition-transform hover:scale-110 disabled:cursor-not-allowed"
            >
              <Star
                className={`w-8 h-8 ${
                  hasRated
                    ? rating <= (userRating?.rating || 0)
                      ? "fill-primary text-primary"
                      : "text-muted-foreground"
                    : rating <= hoveredRating
                    ? "fill-primary text-primary"
                    : "text-muted-foreground"
                }`}
              />
            </button>
          ))}
        </div>

        {hasRated && (
          <div className="text-center space-y-2 bg-primary/10 p-4 rounded-lg">
            <div className="flex items-center justify-center gap-2">
              <Star className="w-6 h-6 fill-primary text-primary" />
              <span className="text-2xl font-bold">
                {averageRating.toFixed(1)}
              </span>
              <span className="text-muted-foreground">/ {metadata.maxRating}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {metadata.ratings.length} {metadata.ratings.length === 1 ? 'rating' : 'ratings'}
            </p>
            {userRating && (
              <p className="text-xs text-muted-foreground">
                You rated: {userRating.rating} stars
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
