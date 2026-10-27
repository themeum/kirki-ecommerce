import type { AppConfigUser } from '@/schemas/catalog/app-config';

const getWelcomeName = (user: AppConfigUser | null) => {
  const firstName = user?.first_name?.trim();

  if (firstName) {
    return firstName;
  }

  return user?.display_name?.trim() || null;
};

export { getWelcomeName };
