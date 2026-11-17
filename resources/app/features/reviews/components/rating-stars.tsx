import Flex from '@/components/ui/flex';
import { StarRatingIcon } from '@/icons/common';

export interface RatingStarsProps {
  rating: number;
  size?: number;
  interactive?: boolean;
  onRate?: (val: number) => void;
}

export const RatingStars = ({
  rating,
  size = 16,
  interactive = false,
  onRate,
}: RatingStarsProps) => {
  return (
    <Flex align="center" gap={1} style={{ display: 'inline-flex' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <StarRatingIcon
          key={star}
          width={size}
          height={size}
          fill={star <= rating ? '#f59e0b' : 'none'}
          stroke={star <= rating ? '#f59e0b' : '#cbd5e1'}
          style={{ cursor: interactive ? 'pointer' : 'default' }}
          onClick={() => interactive && onRate && onRate(star)}
        />
      ))}
    </Flex>
  );
};

export default RatingStars;
