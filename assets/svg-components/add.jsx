import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
const SvgComponent = () => (
  <Svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} fill="none">
    <Path
      fill="#F45303"
      d="M10 0C4.477 0 0 4.477 0 10s4.477 10 10 10 10-4.477 10-10S15.523 0 10 0Zm5 11h-4v4H9v-4H5V9h4V5h2v4h4v2Z"
    />
  </Svg>
);
export default SvgComponent;
