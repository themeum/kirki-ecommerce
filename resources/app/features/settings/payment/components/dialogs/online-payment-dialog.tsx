import { type Dispatch, type ReactNode, type SetStateAction, useRef, useState } from 'react';

import {
  Dialog,
  DialogBody,
  DialogCloseButton,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import EmptyState from '@/components/ui/empty-state';
import Image from '@/components/ui/image';
import QueryErrorState from '@/components/ui/query-error-state';
import Searchbox from '@/components/ui/searchbox';
import PaymentMethodRow from '@/features/settings/payment/components/dialogs/payment-method-row';
import { getManualPaymentPresets } from '@/features/settings/payment/presets/manual-payment-presets';
import {
  useCreateOfflinePaymentMutation,
  useInstallableOnlinePaymentsQuery,
  useInstallOnlinePaymentMutation,
  useOfflinePaymentsQuery,
  useUpdateOnlinePaymentPluginMutation,
} from '@/features/settings/payment/services/payment';
import PaymentMethodListSkeleton from '@/features/settings/payment/skeletons/payment-method-list-skeleton';
import {
  filterRowsByName,
  type GatewayId,
  getGatewayRowStatus,
  orderInstalledFirst,
  type PaymentMethodRowStatus,
} from '@/features/settings/payment/utils/payment-method-rows';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type OnlinePaymentPopupProps = {
  openPopup: boolean;
  setOpenPopup: Dispatch<SetStateAction<boolean>>;
};

type DialogRow = {
  key: string;
  name: string;
  icon: ReactNode;
  status: PaymentMethodRowStatus;
  blockedReason?: string | null;
  onAdd: () => void;
  onUpdate?: () => void;
};

const manualKey = (id: string | number | undefined) => `manual:${String(id)}`;
const gatewayKey = (id: string | number | undefined) => `gateway:${String(id)}`;

const OnlinePaymentPopup = ({ openPopup, setOpenPopup }: OnlinePaymentPopupProps) => {
  const searchRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');

  const gatewaysQuery = useInstallableOnlinePaymentsQuery();
  const offlineQuery = useOfflinePaymentsQuery();

  const [orderedGatewayIds, setOrderedGatewayIds] = useState<GatewayId[] | null>(null);

  if (orderedGatewayIds === null && gatewaysQuery.data) {
    setOrderedGatewayIds(orderInstalledFirst(gatewaysQuery.data));
  }

  const {
    mutate: createOfflinePayment,
    isPending: isCreating,
    variables: creatingVariables,
  } = useCreateOfflinePaymentMutation();
  const {
    mutate: installOnlinePayment,
    isPending: isInstalling,
    variables: installingVariables,
  } = useInstallOnlinePaymentMutation();
  const {
    mutate: updateOnlinePaymentPlugin,
    isPending: isUpdating,
    variables: updatingVariables,
  } = useUpdateOnlinePaymentPluginMutation();

  const getBusyKey = () => {
    if (isCreating) {
      return manualKey(creatingVariables?.id);
    }

    if (isInstalling) {
      return gatewayKey(installingVariables?.id);
    }

    if (isUpdating) {
      return gatewayKey(updatingVariables?.id);
    }

    return undefined;
  };

  const busyKey = getBusyKey();

  const addedOfflineIds = new Set((offlineQuery.data ?? []).map((method) => method.id));

  const manualRows: DialogRow[] = getManualPaymentPresets().map((preset) => {
    const PresetIcon = preset.icon;

    return {
      key: manualKey(preset.id),
      name: preset.name,
      icon: <PresetIcon size={20} />,
      status: addedOfflineIds.has(preset.id) ? 'added' : 'not-added',
      onAdd: () =>
        createOfflinePayment({
          id: preset.id,
          name: preset.name,
          instructions: preset.instructions,
          icon: null,
          is_offline: true,
          is_enabled: true,
        }),
    };
  });

  const gateways = gatewaysQuery.data ?? [];
  const gatewaysById = new Map(gateways.map((gateway) => [gateway.id, gateway]));
  const snapshotIds = orderedGatewayIds ?? [];
  const newIds = orderInstalledFirst(gateways).filter((id) => !snapshotIds.includes(id));

  const gatewayRows: DialogRow[] = [...snapshotIds, ...newIds]
    .flatMap((id) => {
      const gateway = gatewaysById.get(id);

      return gateway ? [{ id, gateway }] : [];
    })
    .map(({ id, gateway }) => ({
      key: gatewayKey(gateway.id),
      name: gateway.name ?? '',
      icon: gateway.icon ? (
        <Image
          src={gateway.icon}
          alt={gateway.name ?? ''}
          height={20}
          width={20}
          fit="contain"
          cssOverride={styles.gatewayIcon}
        />
      ) : null,
      status: getGatewayRowStatus(gateway),
      blockedReason: gateway.update_blocked_reason,
      onAdd: () => installOnlinePayment({ id }),
      onUpdate: () => updateOnlinePaymentPlugin({ id }),
    }));

  const visibleRows = filterRowsByName([...manualRows, ...gatewayRows], search);

  const isLoading = gatewaysQuery.isLoading || offlineQuery.isLoading;
  const isError = gatewaysQuery.isError || offlineQuery.isError;

  const retry = () => {
    void gatewaysQuery.refetch();
    void offlineQuery.refetch();
  };

  const renderBody = () => {
    if (isLoading) {
      return <PaymentMethodListSkeleton />;
    }

    if (isError) {
      return (
        <QueryErrorState
          onRetry={retry}
          isRetrying={gatewaysQuery.isFetching || offlineQuery.isFetching}
        />
      );
    }

    if (visibleRows.length === 0) {
      return <EmptyState text={__('No payment methods found', 'kirki-ecommerce')} />;
    }

    return visibleRows.map((row) => (
      <PaymentMethodRow
        key={row.key}
        name={row.name}
        icon={row.icon}
        status={row.status}
        blockedReason={row.blockedReason}
        isBusy={row.key === busyKey}
        isDisabled={busyKey !== undefined}
        onAdd={row.onAdd}
        onUpdate={row.onUpdate}
      />
    ));
  };

  return (
    <Dialog
      open={openPopup}
      onOpenChange={(next) => {
        if (!next) {
          setOpenPopup(false);
        }
      }}
    >
      <DialogContent
        cssOverride={{ height: '656px', maxWidth: '360px' }}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          searchRef.current?.focus();
        }}
      >
        <DialogCloseButton />
        <DialogHeader>
          <DialogTitle>{__('Add a payment method', 'kirki-ecommerce')}</DialogTitle>
        </DialogHeader>
        <div css={scoped(styles.search)}>
          <Searchbox
            ref={searchRef}
            value={search}
            delay={0}
            placeholder={__('Search...', 'kirki-ecommerce')}
            onChange={(value) => setSearch(String(value))}
            cssOverride={{
              backgroundColor: theme.colors.background.solidSurfaceAlt,
              borderColor: 'transparent',
            }}
          />
        </div>
        <DialogBody cssOverride={styles.body}>{renderBody()}</DialogBody>
      </DialogContent>
    </Dialog>
  );
};

OnlinePaymentPopup.displayName = 'OnlinePaymentPopup';

export default OnlinePaymentPopup;

const styles = defineStyles({
  search: {
    flexShrink: 0,
    padding: `${theme.spacing[3]} ${theme.spacing[4]} 0`,
  },
  body: {
    rowGap: 0,
    paddingTop: theme.spacing[2],
  },
  gatewayIcon: {
    width: 'auto',
    border: 'none',
    borderRadius: theme.radius.none,
    backgroundColor: 'transparent',
  },
});
