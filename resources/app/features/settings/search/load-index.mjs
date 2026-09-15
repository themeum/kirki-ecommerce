export const loadSearchIndex = async () => {
  const module = await import('./settings-search-index.json');

  return module.default;
};
