import React from "react";
import * as Components from "@/Icons";
import { Grid } from "@/molecules";

const IconsPreview = () => {
  return (
    <Grid columns={6} gap="20px">
      {Object.keys(Components).map((iconName, index) => {
        const Icon = Components[iconName];
        return (
          <div key={index}>
            <p>{iconName}</p>
            <Icon key={iconName} />
          </div>
        );
      })}
    </Grid>
  );
};

export default IconsPreview;
