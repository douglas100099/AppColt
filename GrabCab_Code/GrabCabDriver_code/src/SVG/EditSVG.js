import * as React from "react"
import Svg, { Circle, Path, G, Defs } from "react-native-svg"
/* SVGR has dropped some elements not supported by react-native-svg: filter */

function EditSVG(props) {
  return (
    <Svg width={54} height={54} viewBox="0 0 54 54" fill="none" {...props}>
      <Circle cx={20.5} cy={29.5} r={12.5} fill="#1152FD" />
      <Path
        d="M20.58 42C13.634 42 8 36.367 8 29.42c0-1.006.118-1.983.34-2.92"
        stroke="#D5DDE0"
        strokeWidth={0.5}
      />
      <G filter="url(#prefix__filter0_d)">
        <Path
          d="M36.12 12.953a3.254 3.254 0 00-4.602 0l-12.9 12.9a.723.723 0 00-.186.318l-1.696 6.124a.723.723 0 00.89.89l6.124-1.696a.723.723 0 00.318-.186l12.9-12.9a3.257 3.257 0 000-4.601l-.849-.849z"
          fill="#fff"
        />
        <Path
          d="M36.12 12.953a3.254 3.254 0 00-4.602 0l-12.9 12.9a.723.723 0 00-.186.318l-1.696 6.124a.723.723 0 00.89.89l6.124-1.696a.723.723 0 00.318-.186l12.9-12.9a3.257 3.257 0 000-4.601l-.849-.849z"
          stroke="#3E4958"
          strokeWidth={2}
          strokeLinecap="round"
        />
      </G>
      <Path
        d="M19.129 25.548l4.839 4.84M30.258 14.903l4.839 4.839"
        stroke="#3E4958"
        strokeWidth={2}
      />
      <Defs></Defs>
    </Svg>
  )
}

export default EditSVG
