import * as Components from '@/icons';
import Grid from '@/components/ui/grid';

type IconComponent = (typeof Components)[keyof typeof Components];

const iconNames = Object.keys(Components) as Array<keyof typeof Components>;

const IconsPreview = () => {
  return (
    <Grid columns={6} gap="20px">
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
