import { useState, type Dispatch, type SetStateAction } from 'react';

import Card from '@/molecules/card';
import Tab from '@/molecules/tab';
import Text from '@/molecules/text';
import type { FormErrors } from '@/types';
import { __ } from '@/wpi18n';

import AEO from './aeo';
import Schema from './schema';
import SearchEngines from './search-engines';
import SocialShare from './social-share';

type SEOSettingsProps = {
  errors: FormErrors;
  setErrors: Dispatch<SetStateAction<FormErrors>>;
};

const SEOSettings = ({ errors, setErrors }: SEOSettingsProps) => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (index: number) => {
    setActiveTab(index);
  };

  return (
    <Card type="form">
      <Text
        header={__('AI & Web Presence', 'kirki-ecommerce')}
        type="primary"
      />
      <Tab activeIndex={activeTab} onChange={handleTabChange}>
        <div>{__('Search Engines', 'kirki-ecommerce')}</div>
        <div>{__('AEO', 'kirki-ecommerce')}</div>
        <div>{__('Social Share', 'kirki-ecommerce')}</div>
        <div>{__('Schema', 'kirki-ecommerce')}</div>
      </Tab>

      {activeTab === 0 && (
        <SearchEngines errors={errors} setErrors={setErrors} />
      )}
      {activeTab === 1 && <AEO errors={errors} setErrors={setErrors} />}
      {activeTab === 2 && <SocialShare errors={errors} setErrors={setErrors} />}
      {activeTab === 3 && <Schema errors={errors} setErrors={setErrors} />}
    </Card>
  );
};

SEOSettings.displayName = 'SEOSettings';

export default SEOSettings;
