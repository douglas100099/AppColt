import * as React from "react"
import Svg, { Circle, Path } from "react-native-svg"

function CellphoneSVG(props) {
  return (
    <Svg width={40} height={40} viewBox="0 0 40 40" fill="none" {...props}>
      <Circle cx={20} cy={20} r={20} fill="#fff" />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M20 3.5c9.113 0 16.5 7.387 16.5 16.5S29.113 36.5 20 36.5 3.5 29.113 3.5 20 10.887 3.5 20 3.5zm-4.502 22.595a1 1 0 01-1.398-.918v-3.101a.5.5 0 01.427-.495l9.287-1.38-9.287-1.382a.5.5 0 01-.427-.494v-3.102a1 1 0 011.398-.917L28.04 19.74a.5.5 0 010 .918l-12.543 5.436z"
        fill="#1152FD"
      />
    </Svg>
  )
}

export default CellphoneSVG
