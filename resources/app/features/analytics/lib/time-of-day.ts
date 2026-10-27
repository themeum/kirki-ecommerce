type HourCounts = number[][];

type TimeOfDaySummary = {
  busiestDay: number;
  busiestHour: number;
  busiestHourDay: number;
  dayTotals: number[];
  total: number;
  afterPercent: number;
};

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

const summarizeTimeOfDay = (counts: HourCounts): TimeOfDaySummary => {
  const dayTotals = counts.map(sum);
  const total = sum(dayTotals);
  let busiestDay = 0;
  let busiestHourDay = 0;
  let busiestHour = 0;

  counts.forEach((row, day) => {
    if (dayTotals[day] > dayTotals[busiestDay]) {
      busiestDay = day;
    }

    row.forEach((count, hour) => {
      if (count > counts[busiestHourDay][busiestHour]) {
        busiestHourDay = day;
        busiestHour = hour;
      }
    });
  });

  const after = sum(counts.map((row) => sum(row.slice(busiestHour))));

  return {
    busiestDay,
    busiestHour,
    busiestHourDay,
    dayTotals,
    total,
    afterPercent: total === 0 ? 0 : Math.round((after / total) * 100),
  };
};

const dotScale = (value: number, max: number) => (max <= 0 ? 0 : Math.sqrt(Math.abs(value) / max));

const formatHour = (hour: number) => `${hour % 12 === 0 ? 12 : hour % 12}${hour < 12 ? 'am' : 'pm'}`;

const formatHourSpan = (hour: number) => `${formatHour(hour)}–${formatHour((hour + 1) % 24)}`;

export { dotScale, formatHour, formatHourSpan, type HourCounts, summarizeTimeOfDay };
