import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';

const UiTextPreview = () => {
  return (
    <Flex direction="column" gap={24}>
      <Flex direction="column" gap={8}>
        <Text variant="heading1">Heading 1</Text>
        <Text variant="heading2">Heading 2</Text>
        <Text variant="heading3">Heading 3</Text>
        <Text variant="heading4">Heading 4</Text>
        <Text variant="heading5">Heading 5</Text>
        <Text variant="heading6">Heading 6</Text>
        <Text variant="lead">Lead text</Text>
        <Text variant="paragraph">Paragraph text</Text>
        <Text variant="small">Small text</Text>
        <Text variant="tiny">Tiny text</Text>
      </Flex>

      <Flex direction="column" gap={8}>
        <Text color="primary">Primary</Text>
        <Text color="secondary">Secondary</Text>
        <Text color="subdued">Subdued</Text>
        <Text color="emphasis">Emphasis</Text>
        <Text color="critical">Critical</Text>
        <Text color="success">Success</Text>
        <Text color="disabled">Disabled</Text>
      </Flex>

      <Flex direction="column" gap={8}>
        <Text weight="normal">Paragraph normal</Text>
        <Text weight="medium">Paragraph medium</Text>
        <Text weight="semibold">Paragraph semibold</Text>
        <Text weight="bold">Paragraph bold</Text>
        <Text weight="extrabold">Paragraph extrabold</Text>
      </Flex>
    </Flex>
  );
};

UiTextPreview.displayName = 'UiTextPreview';

export default UiTextPreview;
