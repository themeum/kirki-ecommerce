type ChangeDirection = 'up' | 'down' | 'flat';

type ChangeBadge = {
  text: string;
  direction: ChangeDirection;
};

const getChangeBadge = (change: number | null | undefined): ChangeBadge | null => {
  if (change === null || change === undefined) {
    return null;
  }

  let direction: ChangeDirection = 'flat';

  if (change > 0) {
    direction = 'up';
  } else if (change < 0) {
    direction = 'down';
  }

  return { text: `${Math.abs(change).toFixed(1)}%`, direction };
};

export { type ChangeBadge, type ChangeDirection, getChangeBadge };
