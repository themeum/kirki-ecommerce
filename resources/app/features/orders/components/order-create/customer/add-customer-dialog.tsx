import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

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
import type { CustomerFormInput, CustomerFormPayload } from '@/features/customers';
import {
  CustomerAddressCard,
  CustomerBasicInfo,
  CustomerFormSchema,
  useCreateCustomerMutation,
} from '@/features/customers';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { getDefaults } from '@/libs/zod';
import { __ } from '@/wpi18n';

type AddCustomerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSearch?: string;
  onCreated: (customerId: number) => void;
};

const AddCustomerDialog = ({
  open,
  onOpenChange,
  initialSearch = '',
  onCreated,
}: AddCustomerDialogProps) => {
  const createMutation = useCreateCustomerMutation();
  const trimmedSearch = initialSearch.trim();
  const isEmail = trimmedSearch.includes('@');

  const form = useForm<CustomerFormInput, unknown, CustomerFormPayload>({
    resolver: zodResolver(CustomerFormSchema),
    defaultValues: {
      ...getDefaults(CustomerFormSchema),
      email: isEmail ? trimmedSearch : '',
    },
  });

  const handleSubmit = async (values: CustomerFormPayload) => {
    try {
      const response = await createMutation.mutateAsync(values);
      onCreated(response.data.id);
    } catch (error) {
      applyServerErrors(form, error as ErrorResponse);
    }
  };

  return (
    <Form {...form}>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent cssOverride={{ width: '720px' }}>
          <DialogHeader>
            <DialogTitle>{__('Add customer', 'kirki-ecommerce')}</DialogTitle>
            <DialogCloseButton />
          </DialogHeader>
          <DialogBody>
            <Flex direction="column" gap={4}>
              <CustomerBasicInfo />
              <CustomerAddressCard />
            </Flex>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              {__('Cancel', 'kirki-ecommerce')}
            </Button>
            <Button
              variant="primary"
              onClick={form.handleSubmit(handleSubmit)}
              loading={createMutation.isPending}
            >
              {__('Create', 'kirki-ecommerce')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Form>
  );
};

AddCustomerDialog.displayName = 'AddCustomerDialog';

export default AddCustomerDialog;
