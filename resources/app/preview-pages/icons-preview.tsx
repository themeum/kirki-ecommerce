import * as Components from '@/icons';
import Grid from '@/components/ui/grid';

import { theme } from '@/theme';

type IconComponent = (typeof Components)[keyof typeof Components];

const iconNames = Object.keys(Components) as Array<keyof typeof Components>;

const IconsPreview = () => {
  return (
    <Grid columns={6} gap={theme.spacing[5]}>
      {iconNames.map((iconName) => {
        const Icon = Components[iconName] as IconComponent;
        return (
          <div key={iconName}>
            <p>{iconName}</p>
            <Icon />
          </div>
        );
      })}
    </Grid>
  );
};

IconsPreview.displayName = 'IconsPreview';

export default IconsPreview;
