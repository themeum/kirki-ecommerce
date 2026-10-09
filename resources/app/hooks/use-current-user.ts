import { useAppConfig } from '@/contexts/app-config-context';

const useCurrentUser = () => {
  const { settings } = useAppConfig();

  return settings?.current_user ?? null;
};

export default useCurrentUser;
