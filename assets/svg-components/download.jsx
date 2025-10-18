import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
const SvgComponent = () => (
  <Svg xmlns="http://www.w3.org/2000/svg" width={18} height={22} fill="none">
    <Path
      fill="#fff"
      d="M17.75 8.25h-5V.75h-7.5v7.5h-5L9 17l8.75-8.75Zm-10 2.5v-7.5h2.5v7.5h1.463L9 13.463 6.287 10.75H7.75ZM.25 19.5h17.5V22H.25v-2.5Z"
    />
  </Svg>
);
export default SvgComponent;
