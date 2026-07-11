import Tab from '@/molecules/tab';
import { AlignLeftIcon } from '@/icons';

const TabPreview = () => {
  return (
    <>
      <Tab activeIndex={0} onChange={(index) => {
        console.log(index);
      }}>
        <div>Search Engines</div>
        <div>Social Share</div>
        <div>Schema</div>
      </Tab>
      <Tab activeIndex={1}>
        <AlignLeftIcon />
        <AlignLeftIcon />
        <AlignLeftIcon />
      </Tab>
    </>
  );
};

TabPreview.displayName = 'TabPreview';

export default TabPreview;
