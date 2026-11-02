import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  type Modifier,
  PointerSensor,
  type UniqueIdentifier,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { PlusIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import ActionGroup from '@/components/ui/action-group';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Flex from '@/components/ui/flex';
import { StackedItems } from '@/components/ui/stacked-items';
import Text from '@/components/ui/text';
import OfflinePaymentPopup from '@/features/settings/payment/components/dialogs/offline-payment-dialog';
import OnlinePaymentPopup from '@/features/settings/payment/components/dialogs/online-payment-dialog';
import OnlinePaymentEditPopup from '@/features/settings/payment/components/dialogs/online-payment-edit-dialog';
import PaymentMethodDragOverlay from '@/features/settings/payment/components/list/payment-method-drag-overlay';
import SortablePaymentMethod from '@/features/settings/payment/components/list/sortable-payment-method';
import type {
  OfflinePayment,
  OnlinePayment,
  PaymentMethod,
} from '@/features/settings/payment/schemas/catalog/payment';
import {
  getOnlinePayment,
  useDeleteOfflinePaymentMutation,
  useReorderPaymentMethodsMutation,
  useSetEnabledOfflinePaymentMutation,
  useSetEnabledOnlinePaymentMutation,
} from '@/features/settings/payment/services/payment';
import { useConfirmDelete } from '@/hooks';
import { getPortalContainer } from '@/libs/portal-container';
import { cardStyles } from '@/theme/card-styles';
import { __ } from '@/wpi18n';

type PaymentMethodsProps = {
  paymentMethods: PaymentMethod[];
};

const PaymentMethods = (props: PaymentMethodsProps) => {
  const { paymentMethods } = props;

  const [isOfflineDialogOpen, setIsOfflineDialogOpen] = useState(false);
  const [editingOfflineMethod, setEditingOfflineMethod] = useState<OfflinePayment | null>(null);
  const [isOnlineInstallDialogOpen, setIsOnlineInstallDialogOpen] = useState(false);
  const [isOnlineEditDialogOpen, setIsOnlineEditDialogOpen] = useState(false);
  const [editingOnlineMethod, setEditingOnlineMethod] = useState<OnlinePayment | null>(null);

  const { mutate: setEnabledOfflinePayment } = useSetEnabledOfflinePaymentMutation();
  const { mutate: deleteOfflinePayment } = useDeleteOfflinePaymentMutation();
  const { mutate: setEnabledOnlinePayment } = useSetEnabledOnlinePaymentMutation();
  const { mutate: reorderPaymentMethods } = useReorderPaymentMethodsMutation();
  const { confirmDelete, deleteConfirmation } = useConfirmDelete();

  const [orderedMethods, setOrderedMethods] = useState<PaymentMethod[]>(paymentMethods);
  const listRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<UniqueIdentifier | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    setOrderedMethods(paymentMethods);
  }, [paymentMethods]);

  const restrictToList: Modifier = ({ transform, draggingNodeRect }) => {
    const listRect = listRef.current?.getBoundingClientRect();

    if (!listRect || !draggingNodeRect) {
      return transform;
    }

    const minY = listRect.top - draggingNodeRect.top;
    const maxY = listRect.bottom - draggingNodeRect.bottom;

    return { ...transform, y: Math.min(Math.max(transform.y, minY), maxY) };
  };

  const handleToggle = (method: PaymentMethod) => {
    const isEnabled = Boolean(method.is_enabled);

    if (method.is_offline) {
      setEnabledOfflinePayment({ id: method.id, data: { is_enabled: !isEnabled } });
      return;
    }

    setEnabledOnlinePayment({ id: method.id, data: { is_enabled: !isEnabled } });
  };

  const handleDelete = (method: PaymentMethod) => {
    if (method.is_offline) {
      confirmDelete(
        {
          title: __('Delete payment method?', 'kirki-ecommerce'),
          description: __(
            'Customers will no longer be able to choose this method at checkout. This cannot be undone.',
            'kirki-ecommerce',
          ),
        },
        () => {
          deleteOfflinePayment(method.id);
        },
      );
      return;
    }

    // @todo: there is no endpoint for deleting online payment methods
  };

  const handleEdit = async (method: PaymentMethod) => {
    if (method.is_offline) {
      setEditingOfflineMethod(method);
      setIsOfflineDialogOpen(true);
      return;
    }

    const onlineMethod = await getOnlinePayment(method.id);

    if (onlineMethod) {
      setEditingOnlineMethod(onlineMethod);
      setIsOnlineEditDialogOpen(true);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setDraggingId(event.active.id);

    if (
      !(event.activatorEvent instanceof KeyboardEvent) &&
      document.activeElement instanceof HTMLElement
    ) {
      document.activeElement.blur();
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggingId(null);

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = orderedMethods.findIndex((method) => method.id === active.id);
    const newIndex = orderedMethods.findIndex((method) => method.id === over.id);
    const reordered = arrayMove(orderedMethods, oldIndex, newIndex);

    setOrderedMethods(reordered);
    reorderPaymentMethods(reordered.map((method) => method.id));
  };

  const draggingMethod = orderedMethods.find((method) => method.id === draggingId);

  return (
    <>
      <Card
        data-search-id="payments.methods"
        data-search-keywords="cash on delivery, bank transfer, cheque, offline payment, payment gateways, stripe, paypal, credit card, digital wallet, processor"
        cssOverride={cardStyles.formCard}
      >
        <CardContent>
          <Flex direction="column" gap={4}>
            <Flex gap={2} align="flex-start">
              <Flex direction="column">
                <Text variant="heading6" weight="semibold" color="primary">
                  {__('Payment methods', 'kirki-ecommerce')}
                </Text>
                <Text variant="small" color="secondary">
                  {__("Set up and manage your online store's payment options.", 'kirki-ecommerce')}
                </Text>
              </Flex>
              <ActionGroup>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="sm">
                      <PlusIcon />
                      {__('Add', 'kirki-ecommerce')}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" cssOverride={{ width: 'max-content' }}>
                    <DropdownMenuItem onSelect={() => setIsOnlineInstallDialogOpen(true)}>
                      {__('Payment Gateways', 'kirki-ecommerce')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => {
                        setEditingOfflineMethod(null);
                        setIsOfflineDialogOpen(true);
                      }}
                    >
                      {__('Manual Payment', 'kirki-ecommerce')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </ActionGroup>
            </Flex>

            {orderedMethods.length > 0 && (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                modifiers={[restrictToVerticalAxis, restrictToList]}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={() => setDraggingId(null)}
              >
                <StackedItems ref={listRef}>
                  <SortableContext
                    items={orderedMethods.map((method) => method.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {orderedMethods.map((method) => (
                      <SortablePaymentMethod
                        key={method.id}
                        method={method}
                        onEdit={(editedMethod) => void handleEdit(editedMethod)}
                        onDelete={handleDelete}
                        onToggle={handleToggle}
                      />
                    ))}
                  </SortableContext>
                </StackedItems>
                {createPortal(
                  <DragOverlay>
                    {draggingMethod && <PaymentMethodDragOverlay method={draggingMethod} />}
                  </DragOverlay>,
                  getPortalContainer(),
                )}
              </DndContext>
            )}
          </Flex>
        </CardContent>
      </Card>

      <OfflinePaymentPopup
        openPopup={isOfflineDialogOpen}
        setOpenPopup={setIsOfflineDialogOpen}
        editingMethod={editingOfflineMethod}
        setEditingMethod={setEditingOfflineMethod}
      />

      {isOnlineInstallDialogOpen && (
        <OnlinePaymentPopup
          openPopup={isOnlineInstallDialogOpen}
          setOpenPopup={setIsOnlineInstallDialogOpen}
        />
      )}

      <OnlinePaymentEditPopup
        editedItem={editingOnlineMethod}
        isOpen={isOnlineEditDialogOpen}
        onClose={() => setIsOnlineEditDialogOpen(false)}
      />
      {deleteConfirmation}
    </>
  );
};

PaymentMethods.displayName = 'PaymentMethods';

export default PaymentMethods;
