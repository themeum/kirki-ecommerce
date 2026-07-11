import { useEffect, useState } from 'react';

import OptionAccordion from '@/components/option-accordion';
import { ReplaceIcon, FlagIcon, WrenchIcon } from '@/icons';
import ActionGroup from '@/molecules/action-group';
import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Flex from '@/molecules/flex';
import { Select } from '@/molecules/select';
import Text from '@/molecules/text';
import ToggleButton from '@/molecules/toggle-button';
import { getCurrencyAPIProviderListAPI } from '@/store/currenciesSlice';
import type { FormErrors, SettingsSectionData } from '@/types';
import { isApiSuccess } from '@/types/pages/api-guards';
import { __ } from '@/wpi18n';

import ApiConfigurationCard from './api-configuration-card';
import ApiConfigurationPopup from './api-configuration-popup';

type ApiProvider = {
  id: string | number;
  name: string;
};

type ApiConfigData = {
  api_key?: string;
  update_frequency?: string;
  fallback_behaviour?: string;
  is_cache_enabled?: boolean;
  [key: string]: unknown;
};

type ApiConfigProps = {
  dataObj: SettingsSectionData;
  handleOnChange: (value: unknown, key: string) => void;
  errors: FormErrors;
};

const ApiConfig = ({ dataObj, handleOnChange, errors }: ApiConfigProps) => {
  const [selectedAPI, setSelectedAPI] = useState('');
  const [apiProviderList, setAPIProviderList] = useState<ApiProvider[]>([]);
  const [apiConfigObj, setApiConfigObj] = useState<ApiConfigData>({});
  const [openPopup, setOpenPopup] = useState(false);

  useEffect(() => {
    setSelectedAPI((dataObj?.api_provider as string) || '');
    fetchAPIProviderList();
  }, [dataObj]);

  useEffect(() => {
    if (selectedAPI === dataObj?.api_provider) {
      setApiConfigObj((dataObj?.api_config as ApiConfigData) || {});
    } else {
      setApiConfigObj({});
    }
  }, [selectedAPI, dataObj]);

  const fetchAPIProviderList = async () => {
    const result = await getCurrencyAPIProviderListAPI();
    if (isApiSuccess(result)) {
      setAPIProviderList((result?.data as ApiProvider[]) || []);
    } else {
      setAPIProviderList([]);
    }
  };

  const rightActions = () => (
    <ActionGroup gap={8} style={{ alignItems: 'center' }}>
      <ToggleButton
        value={Boolean(dataObj['is_automatic_update_enabled'])}
        onChange={(value) =>
          handleOnChange(value, 'is_automatic_update_enabled')
        }
      />
    </ActionGroup>
  );

  const hasAPIConfiguration = apiConfigObj?.api_key;

  return (
    <>
      <OptionAccordion
        header={__('Automatic Updates', 'kirki-ecommerce')}
        subHeader={__(
          'Configure automatic exchange rate providers for real-time currency conversion',
          'kirki-ecommerce',
        )}
        leftIcon={<ReplaceIcon />}
        rightActions={rightActions()}
      >
        <Select
          label={__('Select API Provider', 'kirki-ecommerce')}
          value={selectedAPI}
          onChange={(value) => setSelectedAPI(String(value))}
          optionsArray={apiProviderList?.map((item) => ({
            title: item?.name,
            value: item?.id,
          }))}
        />
        {selectedAPI &&
          (hasAPIConfiguration ? (
            <ApiConfigurationCard
              setOpenPopup={setOpenPopup}
              selectedAPI={selectedAPI}
              apiConfigObj={apiConfigObj}
              dataObj={dataObj}
            />
          ) : (
            <Card type="inner">
              <Flex
                style={{
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Flex direction={'column'} gap={8}>
                  <Text header={selectedAPI} leftIcon={<FlagIcon />} />
                  <Text
                    subHeader={__(
                      'Configure your API key and connection settings for ExchangeRate API',
                      'kirki-ecommerce',
                    )}
                  />
                </Flex>
                <ActionGroup>
                  <Button
                    text={__('Configure', 'kirki-ecommerce')}
                    size="small"
                    type="outlined"
                    leftIcon={<WrenchIcon />}
                    onClick={() => setOpenPopup(true)}
                  />
                </ActionGroup>
              </Flex>
            </Card>
          ))}
      </OptionAccordion>
      <ApiConfigurationPopup
        isOpen={openPopup}
        onClose={() => setOpenPopup(false)}
        dataObj={apiConfigObj}
        handleOnChange={handleOnChange}
        selectedAPI={selectedAPI}
        errors={errors}
      />
    </>
  );
};

export default ApiConfig;
