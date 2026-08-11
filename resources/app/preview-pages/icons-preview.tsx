import Grid from '@/components/ui/grid';
import * as Components from '@/icons';

const iconNames = Object.keys(Components) as (keyof typeof Components)[];

const IconsPreview = () => {
  return (
    <Grid columns={6} gap={5}>
      {iconNames.map((iconName) => {
        const Icon = Components[iconName];
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
