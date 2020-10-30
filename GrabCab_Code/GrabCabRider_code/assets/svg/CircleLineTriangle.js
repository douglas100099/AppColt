import * as React from "react"
import Svg, { Circle, Path } from "react-native-svg"

function CircleLineTriangle(props) {
  return (
    <Svg width={26} height={71} viewBox="0 0 16 61" fill="none" {...props}>
      <Circle cx={8} cy={7} r={4} fill="#1152FD" />
      <Path d="M8.094 14.998V48.5" stroke="#3E4958" />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.16 57.787a.2.2 0 01-.32 0l-4.1-5.467A.2.2 0 013.9 52h8.2a.2.2 0 01.16.32l-4.1 5.467z"
        fill="#3E4958"
      />
    </Svg>
  )
}

export default CircleLineTriangle
