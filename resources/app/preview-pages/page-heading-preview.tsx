import Button from '@/molecules/button';
import PageHeading from '@/molecules/page-heading';

const PageHeadingPreview = () => {
  const actionButtons = (
    <>
      <Button text="Import" type="ghost" />
      <Button text="Export" type="ghost" />
      <Button text="Add Product" type="primary" />
    </>
  );

  return (
    <div>
      <PageHeading text="Products Table" actions={actionButtons} />
    </div>
  );
};

PageHeadingPreview.displayName = 'PageHeadingPreview';

export default PageHeadingPreview;
