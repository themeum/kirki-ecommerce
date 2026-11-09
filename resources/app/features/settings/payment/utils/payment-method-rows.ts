import type { OnlinePayment } from '@/features/settings/payment/schemas/catalog/payment';

type PaymentMethodRowStatus = 'not-added' | 'added' | 'update-available' | 'update-blocked';

const getGatewayRowStatus = (gateway: OnlinePayment): PaymentMethodRowStatus => {
  if (gateway.is_installed !== true) {
    return 'not-added';
  }

  if (gateway.update_blocked_reason) {
    return 'update-blocked';
  }

  if (gateway.update_available === true) {
    return 'update-available';
  }

  return 'added';
};

type GatewayId = string | number;

const getGatewayIdsWithUpdate = (gateways: OnlinePayment[]): Set<GatewayId> =>
  new Set(
    gateways.flatMap((gateway) => {
      const status = getGatewayRowStatus(gateway);
      const hasUpdate = status === 'update-available' || status === 'update-blocked';

      return hasUpdate && gateway.id !== undefined ? [gateway.id] : [];
    }),
  );

const orderInstalledFirst = (gateways: OnlinePayment[]): GatewayId[] => {
  const idsOf = (installed: boolean) =>
    gateways.flatMap((gateway) =>
      gateway.id !== undefined && (gateway.is_installed === true) === installed ? [gateway.id] : [],
    );

  return [...idsOf(true), ...idsOf(false)];
};

const filterRowsByName = <Row extends { name?: string | null }>(
  rows: Row[],
  query: string,
): Row[] => {
  const needle = query.trim().toLowerCase();

  if (needle === '') {
    return rows;
  }

  return rows.filter((row) => (row.name ?? '').toLowerCase().includes(needle));
};

export {
  filterRowsByName,
  type GatewayId,
  getGatewayIdsWithUpdate,
  getGatewayRowStatus,
  orderInstalledFirst,
  type PaymentMethodRowStatus,
};
