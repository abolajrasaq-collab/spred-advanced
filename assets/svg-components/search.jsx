import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
const SvgComponent = () => (
  <Svg xmlns="http://www.w3.org/2000/svg" width={23} height={23} fill="none">
    <Path
      fill="#fff"
      d="M16.375 14.5h-.988l-.35-.338a8.125 8.125 0 0 0 1.85-6.675C16.3 4.013 13.4 1.237 9.9.813A8.131 8.131 0 0 0 .812 9.9c.425 3.5 3.2 6.4 6.675 6.987a8.125 8.125 0 0 0 6.675-1.85l.338.35v.988l5.312 5.313a1.32 1.32 0 0 0 1.863 0 1.32 1.32 0 0 0 0-1.863l-5.3-5.325Zm-7.5 0A5.617 5.617 0 0 1 3.25 8.875 5.617 5.617 0 0 1 8.875 3.25 5.617 5.617 0 0 1 14.5 8.875 5.617 5.617 0 0 1 8.875 14.5Z"
    />
  </Svg>
);
export default SvgComponent;
