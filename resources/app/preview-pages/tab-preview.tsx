import { useState } from 'react';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlignLeftIcon } from '@/icons';

const TabPreview = () => {
  const [activeTab, setActiveTab] = useState('0');

  return (
    <>
      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value);
          console.log(Number(value));
        }}
      >
        <TabsList>
          <TabsTrigger value="0">Search Engines</TabsTrigger>
          <TabsTrigger value="1">Social Share</TabsTrigger>
          <TabsTrigger value="2">Schema</TabsTrigger>
        </TabsList>
      </Tabs>
      <Tabs defaultValue="1">
        <TabsList>
          <TabsTrigger value="0">
            <AlignLeftIcon />
          </TabsTrigger>
          <TabsTrigger value="1">
            <AlignLeftIcon />
          </TabsTrigger>
          <TabsTrigger value="2">
            <AlignLeftIcon />
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </>
  );
};

TabPreview.displayName = 'TabPreview';

export default TabPreview;
