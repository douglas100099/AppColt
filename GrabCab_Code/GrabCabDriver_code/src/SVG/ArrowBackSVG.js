import * as React from "react"
import Svg, { Path } from "react-native-svg"

function ArrowBackSVG(props) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M14.707 4.793a1 1 0 010 1.414L8.914 12l5.793 5.793a1 1 0 01-1.414 1.414l-6.5-6.5a1 1 0 010-1.414l6.5-6.5a1 1 0 011.414 0z"
        fill="#3E4958"
      />
    </Svg>
  )
}

export default ArrowBackSVG
