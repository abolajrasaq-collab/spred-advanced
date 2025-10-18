import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
const SvgComponent = () => (
  <Svg xmlns="http://www.w3.org/2000/svg" width={23} height={19} fill="none">
    <Path
      fill="#F45303"
      d="M20.5.5h-18A2.233 2.233 0 0 0 .261 2.75L.25 16.25A2.242 2.242 0 0 0 2.5 18.5h18a2.242 2.242 0 0 0 2.25-2.25V2.75A2.242 2.242 0 0 0 20.5.5ZM7.562 12.875h-1.35L3.345 8.937v3.938H1.938v-6.75h1.406l2.812 3.938V6.124h1.407v6.75Zm5.625-5.332h-2.812v1.26h2.813v1.417h-2.813v1.249h2.813v1.406h-4.5v-6.75h4.5v1.418Zm7.876 4.207c0 .619-.507 1.125-1.125 1.125h-4.5a1.128 1.128 0 0 1-1.126-1.125V6.125h1.407v5.074h1.271v-3.96h1.406v3.949h1.26V6.125h1.407v5.625Z"
    />
  </Svg>
);
export default SvgComponent;
