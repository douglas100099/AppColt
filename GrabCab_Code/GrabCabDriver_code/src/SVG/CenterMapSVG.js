import * as React from "react"
import Svg, { G, Rect, Circle, Path, Defs } from "react-native-svg"
/* SVGR has dropped some elements not supported by react-native-svg: filter */

function CenterMapSVG(props) {
  return (
    <Svg width={80} height={80} viewBox="0 0 80 80" fill="none" {...props}>
      <G filter="url(#prefix__filter0_d)">
        <Rect x={15} y={11} width={50} height={50} rx={25} fill="#fff" />
      </G>
      <G filter="url(#prefix__filter1_d)">
        <Circle cx={40} cy={36} r={9.75} fill="#fff" />
      </G>
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M39.8 30a1 1 0 01-1-1v-.658a7.754 7.754 0 00-6.51 6.858H33a1 1 0 110 2h-.658a7.756 7.756 0 006.458 6.458V43a1 1 0 112 0v.71a7.754 7.754 0 006.858-6.51H47a1 1 0 110-2h.71a7.753 7.753 0 00-6.91-6.91V29a1 1 0 01-1 1zm1 15.718a9.753 9.753 0 008.877-8.518H51a1 1 0 100-2h-1.282a9.752 9.752 0 00-8.918-8.918V25a1 1 0 10-2 0v1.323a9.753 9.753 0 00-8.518 8.877H29a1 1 0 100 2h1.323a9.755 9.755 0 008.477 8.477V47a1 1 0 102 0v-1.282zM40 38.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"
        fill="#3E4958"
      />
      <Defs></Defs>
    </Svg>
  )
}

export default CenterMapSVG
