import React, { useState } from 'react';
import { Star, X } from 'lucide-react';
import Button from './Button';
import { cn } from '../../lib/utils';

interface ReviewFormProps {
  caretakerId: string;
  caretakerName: string;
  onSubmit: (rating: number, comment: string) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  reviewerName?: string; // Name des eingeloggten Users
}

export function ReviewForm({ 
  caretakerId, 
  caretakerName, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  reviewerName
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      return; // Bewertung ist erforderlich
    }

    await onSubmit(rating, comment.trim());
  };

  const handleStarClick = (starRating: number) => {
    setRating(starRating);
  };

  const handleStarHover = (starRating: number) => {
    setHoveredRating(starRating);
  };

  const handleStarLeave = () => {
    setHoveredRating(0);
  };

  const displayRating = hoveredRating || rating;

  return (
    <div className="bg-gray-50 rounded-lg p-6 border">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Bewertung für {caretakerName}
          </h3>
          {reviewerName && (
            <p className="text-sm text-gray-600 mt-1">
              Bewertung von: {reviewerName}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={isLoading}
          className="p-1"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Sterne-Bewertung */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bewertung *
          </label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => handleStarClick(star)}
                onMouseEnter={() => handleStarHover(star)}
                onMouseLeave={handleStarLeave}
                disabled={isLoading}
                className="p-1 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 disabled:cursor-not-allowed"
              >
                <Star
                  className={cn(
                    "h-6 w-6 transition-colors",
                    star <= displayRating
                      ? "text-yellow-500 fill-yellow-500"
                      : "text-gray-300 hover:text-yellow-400"
                  )}
                />
              </button>
            ))}
            {rating > 0 && (
              <span className="ml-2 text-sm text-gray-600">
                {rating} von 5 Sternen
              </span>
            )}
          </div>
          {rating === 0 && (
            <p className="text-sm text-gray-500 mt-1">
              Bitte wähle eine Bewertung aus
            </p>
          )}
        </div>

        {/* Kommentar */}
        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
            Kommentar (optional)
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={isLoading}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="Teile deine Erfahrungen mit anderen Tierbesitzern..."
            maxLength={1000}
          />
          <div className="flex justify-between items-center mt-1">
            <p className="text-sm text-gray-500">
              Beschreibe deine Erfahrung mit {caretakerName}
            </p>
            <span className="text-sm text-gray-400">
              {comment.length}/1000
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Abbrechen
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={rating === 0 || isLoading}
            isLoading={isLoading}
          >
            {isLoading ? 'Wird gespeichert...' : 'Bewertung abgeben'}
          </Button>
        </div>
      </form>
    </div>
  );
} 