import type { CSSObject } from '@emotion/react';
import { MinusCircle, PlusCircle } from 'lucide-react';
import { type ReactNode, useState } from 'react';

import Button from '@/components/ui/button';
import { FieldLabel } from '@/components/ui/field';
import { theme } from '@/theme';
import { defineStyles, itemCenter, scoped, scopedMerge } from '@/theme/mixins';

type CollapsibleFieldProps = {
  /** Label for the link shown while the field is collapsed. */
  addLabel: string;
  /**
   * Whether the bound value is already set. Read once, when the component
   * first renders: a merchant who clears the field while working in it
   * should not have it collapse out from under the cursor.
   */
  hasValue?: boolean;
  /**
   * Heading shown once expanded, alongside the remove control. Supply
   * `labelFor` so it associates with the field's own input.
   */
  label?: ReactNode;
  labelFor?: string;
  /** Clears the field's value. Collapsing back is handled here. */
  onRemove?: () => void;
  removeLabel?: string;
  children: ReactNode;
  cssOverride?: CSSObject;
};

/**
 * Hides an optional field behind a link until a merchant asks for it, so a
 * narrow panel is not padded out with fields most products never use.
 *
 * @param props Component props.
 *
 * @returns CollapsibleField element.
 */
const CollapsibleField = ({
  addLabel,
  hasValue = false,
  label,
  labelFor,
  onRemove,
  removeLabel,
  children,
  cssOverride,
}: CollapsibleFieldProps) => {
  const [isOpen, setIsOpen] = useState(hasValue);

  if (!isOpen) {
    return (
      <Button variant="ghost" cssOverride={styles.addButton} onClick={() => setIsOpen(true)}>
        <PlusCircle size={14} aria-hidden="true" />
        {addLabel}
      </Button>
    );
  }

  return (
    <div css={scopedMerge(styles.body, cssOverride)}>
      {onRemove && (
        <div css={scoped(styles.header)}>
          {label && <FieldLabel htmlFor={labelFor}>{label}</FieldLabel>}
          <Button
            variant="ghost"
            size="icon"
            aria-label={removeLabel ?? addLabel}
            onClick={() => {
              onRemove();
              setIsOpen(false);
            }}
          >
            <MinusCircle size={16} aria-hidden="true" />
          </Button>
        </div>
      )}
      {children}
    </div>
  );
};

CollapsibleField.displayName = 'CollapsibleField';

export default CollapsibleField;
export type { CollapsibleFieldProps };

const styles = defineStyles({
  addButton: {
    width: '100%',
    alignSelf: 'flex-start',
    justifyContent: 'flex-start',
    paddingLeft: theme.spacing[1],
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing[2],
  },
  header: {
    ...itemCenter(),
    justifyContent: 'space-between',
    gap: theme.spacing[2],
  },
});
