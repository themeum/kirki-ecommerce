import Button from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import Textarea from '@/components/ui/textarea';
import { cardStyles } from '@/theme/card-styles';
import { OrderFormInput } from '@/types';
import { __ } from '@/wpi18n';
import { PlusIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

const NotesCard = () => {
  const [isAdding, setIsAdding] = useState(false);
  const [message, setMessage] = useState('');
  const { control, setValue } = useFormContext<OrderFormInput>();
  const notes = useWatch({
    name: 'customer_notes',
    control
  });

  useEffect(() => {
    if (notes) {
      setMessage(notes);
    }
  }, [notes]);

  const handleSave = () => {
    setIsAdding(false);
    setMessage(message);
    setValue('customer_notes', message);
  };

  const handleClear = () => {
    setIsAdding(false);
    setMessage('');
  }
  return (
    <Card cssOverride={cardStyles.formCard}>
      <CardHeader>
        <CardTitle><Text variant='small' weight='medium'>{__('Notes', 'kirki-ecommerce')}</Text></CardTitle>
      </CardHeader>
      <CardContent>
        <Flex direction="column" gap={3}>
          {isAdding ? (
            <Flex direction="column" gap={2}>
              <Textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder={__('Write a note...', 'kirki-ecommerce')}
              />
              <Flex gap={2} justify="flex-end">
                <Button
                  variant="ghost"
                  onClick={() => handleClear()}
                >
                  {__('Cancel', 'kirki-ecommerce')}
                </Button>
                <Button variant="primary" onClick={handleSave}>
                  {__('Save', 'kirki-ecommerce')}
                </Button>
              </Flex>
            </Flex>
          ) : (
            <>
              {Boolean(message) && <Text variant="tiny">{message}</Text>}
              <Button variant="secondary" style={{ width: '100%' }} onClick={() => setIsAdding(true)}>
                <PlusIcon />
                {Boolean(message) ? __('Edit note', 'kirki-ecommerce') : __('Add note', 'kirki-ecommerce')}
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
