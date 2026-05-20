import { Heading } from "molecules";

const HeadingPreview = () => {
  return (
    <>
      <Heading text="This is default heading" />
      <Heading text="This is primary heading" type="primary" />
      <Heading text="This is secondary heading" type="secondary" />
      <Heading text="This is tertiary heading" type="tertiary" />
    </>
  );
};

export default HeadingPreview;
