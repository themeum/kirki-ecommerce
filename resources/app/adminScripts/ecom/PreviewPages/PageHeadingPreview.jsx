import { Button, PageHeading } from "molecules";

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

export default PageHeadingPreview;
