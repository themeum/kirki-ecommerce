import classNames from "classnames";
import { CLASS_PREFIX } from "conf";
import { __ } from "wpi18n";

const Heading = (props) => {
  const {
    type = "",
    text = __("Heading", "kirki-ecommerce"),
    className = "",
    style = {},
  } = props;
  const headingVariants = {
    type: {
      primary: `${CLASS_PREFIX}-heading-primary`,
      secondary: `${CLASS_PREFIX}-heading-secondary`,
      tertiary: `${CLASS_PREFIX}-heading-tertiary`,
    },
    default: `${CLASS_PREFIX}-heading`,
  };

  const allClassNames = classNames(
    headingVariants.default,
    headingVariants.type[type],
    className,
  );
  return (
    <span className={allClassNames} style={style}>
      {text}
    </span>
  );
};

export default Heading;
