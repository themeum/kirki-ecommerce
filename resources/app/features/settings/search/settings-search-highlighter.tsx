import { useSearchHighlight } from '@/features/settings/search/use-search-highlight';

const SettingsSearchHighlighter = () => {
  useSearchHighlight();

  return null;
};

SettingsSearchHighlighter.displayName = 'SettingsSearchHighlighter';

export default SettingsSearchHighlighter;
