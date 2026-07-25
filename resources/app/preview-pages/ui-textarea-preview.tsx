import { css } from '@emotion/react';

import {
  Field,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import Flex from '@/components/ui/flex';
import Textarea from '@/components/ui/textarea';

const UiTextareaPreview = () => {
  return (
    <Flex direction="column" gap={3} css={css({ maxWidth: 320 })}>
      <Field>
        <FieldLabel htmlFor="ui-textarea-default">Default</FieldLabel>
        <Textarea id="ui-textarea-default" placeholder="Write something..." />
      </Field>
      <Field data-invalid>
        <FieldLabel htmlFor="ui-textarea-error">With error</FieldLabel>
        <Textarea
          id="ui-textarea-error"
          placeholder="Invalid value"
          error
          aria-invalid
        />
        <FieldError>Invalid value</FieldError>
      </Field>
    </Flex>
  );
};

UiTextareaPreview.displayName = 'UiTextareaPreview';

export default UiTextareaPreview;
