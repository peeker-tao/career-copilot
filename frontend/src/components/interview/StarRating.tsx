export interface StarRatingProps {
  rating?: number | null
}

export default function StarRating({ rating }: StarRatingProps) {
  if (!rating) return null
  return (
    <span className="star-rating">
      {'⭐'.repeat(rating)}
      <span className="star-score">{rating}/5</span>
    </span>
  )
}
