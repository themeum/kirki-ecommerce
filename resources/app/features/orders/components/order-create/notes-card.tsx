import { PlusIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import TextareaField from '@/components/form/textarea-field';
import Button from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import type { OrderFormInput } from '@/features/orders/schemas/forms/order-form';
import { cardStyles } from '@/theme/card-styles';
import { __ } from '@/wpi18n';

type NotesCardProps = {
  onSave?: () => void;
  isSaving?: boolean;
};

const NotesCard = ({ onSave, isSaving }: NotesCardProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const snapshot = useRef('');
  const { control, getValues, setValue } = useFormContext<OrderFormInput>();
  const notes = useWatch({
    name: 'admin_notes',
    control,
  });

  const handleEdit = () => {
    snapshot.current = getValues('admin_notes') ?? '';
    setIsAdding(true);
  };

  const handleSave = () => {
    setIsAdding(false);
    onSave?.();
  };

  const handleClear = () => {
    setValue('admin_notes', snapshot.current);
    setIsAdding(false);
  }
  return (
    <Card cssOverride={cardStyles.formCard}>
      <CardHeader>
        <CardTitle><Text variant="small" weight="medium">{__('Notes', 'kirki-ecommerce')}</Text></CardTitle>
      </CardHeader>
      <CardContent>
        <Flex direction="column" gap={3}>
          {isAdding ? (
            <Flex direction="column" gap={2}>
              <TextareaField<OrderFormInput>
                name="admin_notes"
                placeholder={__('Write a note...', 'kirki-ecommerce')}
              />
              <Flex gap={2} justify="flex-end">
                <Button
                  variant="ghost"
                  onClick={() => handleClear()}
                >
                  {__('Cancel', 'kirki-ecommerce')}
                </Button>
                <Button variant="primary" loading={isSaving} onClick={handleSave}>
                  {__('Save', 'kirki-ecommerce')}
                </Button>
              </Flex>
            </Flex>
          ) : (
            <>
              {Boolean(notes) && <Text variant="tiny">{notes}</Text>}
              <Button variant="secondary" style={{ width: '100%' }} onClick={handleEdit}>
                <PlusIcon />
                {notes ? __('Edit note', 'kirki-ecommerce') : __('Add note', 'kirki-ecommerce')}
              </Button>
            </>
          )}
        </Flex>
      </CardContent>
    </Card >
  );
};

NotesCard.displayName = 'NotesCard';

export default NotesCard;
