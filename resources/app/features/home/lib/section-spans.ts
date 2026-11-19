import type { SectionKey } from '@/features/home/lib/layout';

type SectionSpan = 'full' | 'half';

const FULL_WIDTH_SECTIONS: SectionKey[] = ['key_numbers'];

const getSectionSpans = (keys: SectionKey[]) => {
  const spans = new Map<SectionKey, SectionSpan>();
  let run: SectionKey[] = [];

  const closeRun = () => {
    run.forEach((key, index) => {
      const isLoneLast = run.length % 2 === 1 && index === run.length - 1;

      spans.set(key, isLoneLast ? 'full' : 'half');
    });
    run = [];
  };

  keys.forEach((key) => {
    if (FULL_WIDTH_SECTIONS.includes(key)) {
      closeRun();
      spans.set(key, 'full');

      return;
    }

    run.push(key);
  });
  closeRun();

  return spans;
};

export { getSectionSpans };
