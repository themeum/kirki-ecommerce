const pageKeys = {
  all: ['Pages'] as const,
  lists: () => [...pageKeys.all, 'list'] as const,
};

export { pageKeys };
