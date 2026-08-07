export type MoneyObject = {
  display: string;
  raw: number;
  currency: {
    code: string;
    symbol: string;
  }
}

const displayMoney = (key: string, data: Record<string, unknown>): string => {
  const preparedKey = `${key}_money_object`;

  if (!(preparedKey in data)) {
    return '--';
  }

  const moneyObject = data[preparedKey] as MoneyObject;

  return moneyObject.display;
}

export {
  displayMoney
};
