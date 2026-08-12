import { Megaphone } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router';

import SelectField from '@/components/form/select-field';
import Button from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogCloseButton,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import Text from '@/components/ui/text';
import { RouteConfig } from '@/config/route-config';
import type { OrderItem } from '@/features/orders/schemas/catalog/order';
import { useOfflinePaymentsQuery } from '@/services/payment';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type MarkAsPaidFormValues = {
  payment_provider: string;
};

type MarkAsPaidDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderItem;
  isSaving?: boolean;
  onSubmit: (paymentMethod: string) => void;
};

const MarkAsPaidDialog = ({ open, onOpenChange, order, isSaving, onSubmit }: MarkAsPaidDialogProps) => {
  const navigate = useNavigate();
  const form = useForm<MarkAsPaidFormValues>({ defaultValues: { payment_provider: '' } });

  const { data: paymentMethods = [], isLoading } = useOfflinePaymentsQuery();
  const availablePaymentMethods = paymentMethods.filter((method) => method.is_enabled);
  const paymentMethodOptions = availablePaymentMethods.map((method) => ({
    label: method.name ?? '',
    value: String(method.id),
  }));

  const paymentMethod = useWatch({ control: form.control, name: 'payment_provider' });

  const handleSubmit = form.handleSubmit((values) => {
    if (!values.payment_provider) {
      return;
    }

    onSubmit(values.payment_provider);
  });

  if (!isLoading && availablePaymentMethods.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent cssOverride={{ width: '440px' }}>
          <DialogCloseButton />
          <DialogBody>
            <Flex direction="column" gap={4} align="center" cssOverride={styles.emptyState}>
              <span css={scoped(styles.emptyIcon)}>
                <Megaphone size={28} />
              </span>
              <Flex direction="column" gap={1} align="center">
                <Text weight="semibold">{__('No payment option available', 'kirki-ecommerce')}</Text>
                <Text variant="small" color="secondary" cssOverride={styles.emptyDescription}>
                  {__('To proceed with your transaction, please add a payment option.', 'kirki-ecommerce')}
                </Text>
              </Flex>
            </Flex>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {__('Dismiss', 'kirki-ecommerce')}
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate(RouteConfig.Settings.get('PaymentSettings').buildLink())}
            >
              {__('Include a payment option', 'kirki-ecommerce')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent cssOverride={{ width: '440px' }}>
        <DialogHeader>
          <DialogTitle>
            {`${__('Mark order', 'kirki-ecommerce')} #${order.order_number} ${__('as paid?', 'kirki-ecommerce')}`}
          </DialogTitle>
          <DialogCloseButton />
        </DialogHeader>
        <Form {...form}>
          <DialogBody>
            <SelectField
              name="payment_provider"
              label={__('Payment method', 'kirki-ecommerce')}
              placeholder={__('Select an option', 'kirki-ecommerce')}
              options={paymentMethodOptions}
            />
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {__('Cancel', 'kirki-ecommerce')}
            </Button>
            <Button
              variant="primary"
              disabled={!paymentMethod}
              loading={isSaving}
              onClick={handleSubmit}
            >
              {__('Mark as paid', 'kirki-ecommerce')}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

MarkAsPaidDialog.displayName = 'MarkAsPaidDialog';

export default MarkAsPaidDialog;

const styles = defineStyles({
  emptyState: {
    padding: `${theme.spacing[6]} 0`,
  },
  emptyIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '56px',
    height: '56px',
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background.surfaceSecondary,
    color: theme.colors.text.secondary,
  },
  emptyDescription: {
    textAlign: 'center',
  },
});
