import * as React from "react"
import Svg, { G, Circle, Path, Defs, ClipPath } from "react-native-svg"

function CellphoneSVG(props) {
  return (
    <Svg width={40} height={40} viewBox="0 0 40 40" fill="none" {...props}>
      <G clipPath="url(#prefix__clip0)">
        <Circle
          cx={20}
          cy={20}
          r={20}
          transform="rotate(-90 20 20)"
          fill="#fff"
        />
        <Path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M3.5 20c0-9.113 7.387-16.5 16.5-16.5S36.5 10.887 36.5 20 29.113 36.5 20 36.5 3.5 29.113 3.5 20zm22.894 4.602A1 1 0 0125.477 26h-3.101a.5.5 0 01-.495-.427l-1.38-9.287-1.382 9.287a.5.5 0 01-.494.427h-3.102a1 1 0 01-.917-1.398L20.04 12.06a.5.5 0 01.918 0l5.435 12.543z"
          fill="#1152FD"
        />
      </G>
      <Defs>
        <ClipPath id="prefix__clip0">
          <Path
            d="M20 0C8.954 0 0 8.954 0 20s8.954 20 20 20 20-8.954 20-20S31.046 0 20 0z"
            fill="#fff"
          />
        </ClipPath>
      </Defs>
    </Svg>
  )
}

export default CellphoneSVG
