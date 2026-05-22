export const mapEmailGroup = (group, prefix) => {
  if (!group) return [];

  return Object.entries(group).map(([id, email]) => ({
    key: `${prefix}_${id}`,
    ...email,
  }));
};

export const EMAIL_CONFIG = {
  customer_order: {
    root: "customer_emails",
    group: "order_notifications",
  },
  customer_user: {
    root: "customer_emails",
    group: "user_notifications",
  },
  admin_order: {
    root: "admin_emails",
    group: "order_notifications",
  },
  admin_user: {
    root: "admin_emails",
    group: "user_notifications",
  },
  admin_inventory: {
    root: "admin_emails",
    group: "inventory_notifications",
  },
};

export const findEmailKeyByName = (data = {}, name) => {
  return Object.keys(data).find((key) => data[key]?.name === name);
};

export const buildTogglePayload = ({
  baseData,
  rootKey,
  groupKey,
  selectedKey,
}) => {
  console.log({ selectedKey });
  const current = baseData?.[rootKey]?.[groupKey]?.[selectedKey];

  if (!current) return null;

  return {
    ...baseData,
    [rootKey]: {
      ...baseData[rootKey],
      [groupKey]: {
        ...baseData[rootKey][groupKey],
        [selectedKey]: {
          ...current,
          is_enabled: !current.is_enabled,
        },
      },
    },
  };
};
