import { PenLine } from 'lucide-react';
import { useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import TextareaField from '@/components/form/textarea-field';
import Button from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import type { OrderFormInput } from '@/features/orders/schemas/forms/order-form';
import { theme } from '@/theme';
import { __ } from '@/wpi18n';

type NotesCardProps = {
  mode?: 'create' | 'edit';
  onSave?: () => Promise<boolean>;
  isSaving?: boolean;
};

const NotesCard = ({ mode = 'create', onSave, isSaving = false }: NotesCardProps) => {
  const form = useFormContext<OrderFormInput>();
  const savedNotes = useWatch({ control: form.control, name: 'order_notes' });
  const [isEditing, setIsEditing] = useState(false);

  const handleCancel = () => {
    form.resetField('order_notes');
    setIsEditing(false);
  };

  const handleSave = async () => {
    const isSaved = await onSave?.();

    if (isSaved) {
      setIsEditing(false);
    }
  };

  return (
    <Card cssOverride={{ gap: theme.spacing[2] }}>
      <CardHeader>
        <CardTitle>
          <Flex cssOverride={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="small" weight="medium">
              {__('Notes', 'kirki-ecommerce')}
            </Text>
            {mode === 'edit' && !isEditing && (
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={__('Edit notes', 'kirki-ecommerce')}
                onClick={() => setIsEditing(true)}
              >
                <PenLine size={16} color={theme.colors.icon.secondary} />
              </Button>
            )}
          </Flex>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {mode === 'create' || isEditing ? (
          <TextareaField
            name="order_notes"
            placeholder={__('Write a note...', 'kirki-ecommerce')}
            rows={3}
          />
        ) : (
          <Text variant="small">{savedNotes}</Text>
        )}
      </CardContent>
      {mode !== 'create' && isEditing && (
        <CardFooter cssOverride={{ justifyContent: 'flex-end' }}>
          <Button variant="outline" disabled={isSaving} onClick={handleCancel}>
            {__('Cancel', 'kirki-ecommerce')}
          </Button>
          <Button loading={isSaving} onClick={handleSave}>
            {__('Save', 'kirki-ecommerce')}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

NotesCard.displayName = 'NotesCard';

export default NotesCard;
