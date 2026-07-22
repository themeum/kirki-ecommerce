import { useRef } from 'react';
import { Minus } from 'lucide-react';
import classNames from 'classnames';

import Button from '@/components/ui/button';
import { CLASS_PREFIX } from '@/conf';
import { Select } from '@/molecules/select';
import type { SelectOption } from '@/types';

type CapsuleProps = {
  optionsArray?: SelectOption[];
  value?: string | number | Array<string | number>;
  onClearItem?: () => void;
  onValueChange?: (value: string | number | Array<string | number>) => void;
  hasDropdown?: boolean;
  uniqueKey?: string | number;
  multiple?: boolean;
  className?: string;
};

const Capsule = ({
  optionsArray,
  value,
  onClearItem = () => {},
  onValueChange = () => [],
  hasDropdown = true,
  uniqueKey,
  multiple,
  className,
}: CapsuleProps) => {
  const triggerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className={classNames(`${CLASS_PREFIX}-ui-capsule`, className)}
      ref={triggerRef}
      key={uniqueKey}
    >
      <Select
        invisible
        optionsArray={optionsArray}
        value={value}
        onChange={onValueChange}
        anchorRef={triggerRef}
        hasDropdown={hasDropdown}
        multiple={multiple}
      />
      <div
        className={`${CLASS_PREFIX}-ui-capsule-separator`}
        aria-hidden="true"
      />
      <Button
        variant="ghost"
        size="sm"
        aria-label="Clear"
        onClick={onClearItem}
      >
        <Minus size={16} aria-hidden="true" />
      </Button>
    </div>
  );
};

Capsule.displayName = 'Capsule';

export default Capsule;
