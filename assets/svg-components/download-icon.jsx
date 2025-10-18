import * as React from 'react';
import Svg, { G, Path, Defs, ClipPath } from 'react-native-svg';
const SvgComponent = () => (
  <Svg xmlns="http://www.w3.org/2000/svg" width={27} height={27} fill="none">
    <G clipPath="url(#a)">
      <Path
        fill="#F45303"
        d="M4.5 11.25H18v2.25H4.5v-2.25Zm0-4.5H18V9H4.5V6.75Zm0 9h9V18h-9v-2.25Zm11.25 0v6.75l5.625-3.375-5.625-3.375Z"
      />
    </G>
    <Defs>
      <ClipPath id="a">
        <Path fill="#fff" d="M0 0h27v27H0z" />
      </ClipPath>
    </Defs>
  </Svg>
);
export default SvgComponent;
