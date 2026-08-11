import { useState } from 'react';

import ProgressBar from '@/components/ui/progressbar';

const ProgressBarPreview = () => {
  const [value, setValue] = useState(46);

  const handleProgress = (nextValue: number) => {
    setValue(nextValue);
  };

  return (
    <div>
      <ProgressBar
        value={value}
        onChange={handleProgress}
        label="Progress Bar"
        rightText={value}
      />
    </div>
  );
};

ProgressBarPreview.displayName = 'ProgressBarPreview';

export default ProgressBarPreview;
