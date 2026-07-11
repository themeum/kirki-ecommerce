import type { CSSProperties } from 'react';

type SeparatorProps = {
  style?: CSSProperties;
  className?: string;
  marginTop?: string | number;
  marginBottom?: string | number;
  color?: string;
  height?: string | number;
};

const Separator = ({
  style = {},
  className = '',
  marginTop = '4px',
  marginBottom = '4px',
  color = '#E4E3E9',
  height = '1px',
}: SeparatorProps) => {
  return (
    <div
      className={className}
      style={{
        height: height,
        marginTop: marginTop,
        marginBottom: marginBottom,
        backgroundColor: color,
        ...style,
      }}
    ></div>
  );
};

export default Separator;
