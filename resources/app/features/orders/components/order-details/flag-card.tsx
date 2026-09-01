import ChipsInputField from '@/components/form/chips-input-field';
import { Card, CardContent } from '@/components/ui/card';
import { cardStyles } from '@/theme/card-styles';
import { __ } from '@/wpi18n';

type FlagCardProps = {
  onSave: () => void;
};

const FlagCard = ({ onSave }: FlagCardProps) => {
  return (
    <Card cssOverride={cardStyles.formCard}>
      <CardContent>
        <ChipsInputField
          name="flags"
          label={__('Flag', 'kirki-ecommerce')}
          placeholder={__('i.e Backorder, Urgent', 'kirki-ecommerce')}
          onCommit={onSave}
        />
      </CardContent>
    </Card>
  );
};

FlagCard.displayName = 'FlagCard';

export default FlagCard;
