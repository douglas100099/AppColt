import * as React from "react"
import Svg, { Circle, Path } from "react-native-svg"

function Verified(props) {
  return (
    <Svg width={82} height={82} viewBox="0 0 82 82" fill="none" {...props}>
      <Circle
        cx={41}
        cy={41}
        r={40}
        fill="#F7F8F9"
        stroke="#D5DDE0"
        strokeWidth={0.5}
      />
      <Path
        d="M28.334 44.437l10.4 7.896L54.334 31"
        stroke="#6FCF97"
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

export default Verified
