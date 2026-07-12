import { useState, useEffect, type ReactNode } from 'react';

import Card from '@/molecules/card';
import Flex from '@/molecules/flex';
import HeaderActionsCard from '@/components/header-actions-card';
import GroupOptionCard from '@/components/group-option-card';
import { BoxOpenIcon, BoxClosedIcon } from '@/icons';
import { CLASS_PREFIX } from '@/conf';
import { __ } from '@/wpi18n';
import {
  deleteTaxProfileById,
  getTaxProfileListAPI,
  setKeyValue,
} from '@/store/settingsSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useGetListAPI } from '@/hooks';
import { dispatchToastMessage } from '@/pages/utils';
import type { TaxProfile as TaxProfileType } from '@/types';
import { isApiSuccess } from '@/types';

import { TaxProfilePopup } from '@/pages/settings/tax-settings/tax-profile/tax-profile-popup';

type TaxProfileListItem = TaxProfileType & {
  icon?: ReactNode;
};

const TaxProfile = () => {
  const dispatch = useAppDispatch();
  const [showPopup, setShowPopup] = useState(false);
  const [editingProfile, setEditingProfile] =
    useState<TaxProfileListItem | null>(null);
  const [taxProfileList, setTaxProfileList] = useState<TaxProfileListItem[]>(
    [],
  );
  useGetListAPI({
    reducerName: 'settings',
    apiCallBack: getTaxProfileListAPI,
    nestedToggler: ['tax', 'taxProfile'],
  });
  const { data: taxProfile } = useAppSelector(
    (state) => state.settings?.tax?.taxProfile,
  );

  useEffect(() => {
    fetchTaxProfileList();
  }, [taxProfile]);

  const fetchTaxProfileList = async () => {
    const updatedData = taxProfile?.map((item) => ({
      ...item,
      icon: <BoxClosedIcon />,
    }));

    setTaxProfileList(updatedData ?? []);
  };

  useEffect(() => {
    if (taxProfile && taxProfile?.length) {
      fetchTaxProfileList();
    }
  }, [taxProfile?.length]);

  const handleDeleteTaxProfile = async (item: TaxProfileListItem) => {
    const initialList = [...taxProfileList];

    setTaxProfileList((prev) =>
      prev.filter((profile) => profile?.id !== item?.id),
    );
    dispatchToastMessage('delete', {
      title: __('Tax profile deleted', 'kirki-ecommerce'),
      duration: 5000,
      undoAction: () => {
        setTaxProfileList(initialList);
      },
      onSuccess: async () => {
        const result = await deleteTaxProfileById(item?.id);
        if (isApiSuccess(result)) {
          dispatch(
            setKeyValue({
              key: 'toggler',
              value: Date.now(),
              nestedToggler: ['tax', 'taxProfile'],
            }),
          );
        }
      },
    });
  };

  const handleEditTaxProfile = (item: TaxProfileListItem) => {
    setEditingProfile(item);
  };

  return (
    <div>
      <Card type="large">
        <HeaderActionsCard
          header={__('Tax Profiles', 'kirki-ecommerce')}
          subHeader={__(
            'Used to create tax rates for different product groups, like heavy items needing higher fees.',
            'kirki-ecommerce',
          )}
          buttonText={__('Create Profile', 'kirki-ecommerce')}
          onAdd={() => setShowPopup(true)}
        />

        {!taxProfileList?.length ? (
          <Card type="innerDark" style={{ padding: '36px 0' }}>
            <Flex direction="column" gap={8} style={{ alignItems: 'center' }}>
              <BoxOpenIcon />
              <span style={{ color: '#878593' }}>
                {__(
                  'Added shipping profiles will appear here',
                  'kirki-ecommerce',
                )}
              </span>
            </Flex>
          </Card>
        ) : (
          <Flex direction="column" className={`${CLASS_PREFIX}-box-wrapper`}>
            <GroupOptionCard
              dataArr={taxProfileList}
              handleDeleteItem={(item) =>
                handleDeleteTaxProfile(item as TaxProfileListItem)
              }
              handleEditItem={(item) =>
                handleEditTaxProfile(item as TaxProfileListItem)
              }
            />
          </Flex>
        )}
      </Card>
      {showPopup && (
        <TaxProfilePopup
          isOpen={showPopup}
          onClose={() => setShowPopup(false)}
          fetchTaxProfileList={fetchTaxProfileList}
        />
      )}
      {editingProfile && (
        <TaxProfilePopup
          isOpen={editingProfile}
          onClose={() => setEditingProfile(null)}
          fetchTaxProfileList={fetchTaxProfileList}
          from="edit"
          taxProfile={editingProfile}
        />
      )}
    </div>
  );
};

TaxProfile.displayName = 'TaxProfile';

export default TaxProfile;
