export const DATE_FORMATS = {
  ATOM: "yyyy-MM-dd'T'HH:mm:ssxxx",
  YEAR_MONTH_DAY: 'yyyy/MM/dd',
  HUMAN_READABLE: 'MMMM d, yyyy',
  HUMAN_READABLE_WITH_TIME: 'MMMM d, yyyy HH:mm a',
  DATE_TIME_INPUT: 'yyyy-MM-dd HH:mm',
  DATE_INPUT: 'yyyy-MM-dd',
  TIME_INPUT: 'HH:mm',
} as const;

export const START_OF_DAY_TIME = '00:00';
export const END_OF_DAY_TIME = '23:59';
