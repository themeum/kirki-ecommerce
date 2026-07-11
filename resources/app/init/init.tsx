import type { ReactNode } from 'react';

import { useGetListAPI } from '@/hooks';
import { useAppDispatch } from '@/store/hooks';
import { getAttributesAPI } from '@/store/attributesSlice';
import { getDefaultSettingsAPI } from '@/store/settingsSlice';

type InitProps = {
  children: ReactNode;
};

const Init = ({ children }: InitProps) => {
  const dispatch = useAppDispatch();
  const handleMigration = async () => {
    try {
      const result = await dispatch(getDefaultSettingsAPI());
      if (result) {
        console.log(result, 'initial data fetch successful');
      } else {
        console.log('data fetch failed');
      }
    } catch (error) {
      console.error('data fetch error:', error);
    }
  };
  handleMigration();
  useGetListAPI({
    reducerName: 'attributes',
    apiCallBack: getAttributesAPI,
    limit: -1,
  });
  return children;
};

export default Init;
