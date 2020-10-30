import * as React from "react"
import Svg, { Path } from "react-native-svg"

function LocationUser(props) {
  return (
    <Svg width={41} height={40} viewBox="0 0 41 40" fill="none" {...props}>
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M20.4 0C9.354 0 .4 8.954.4 20s8.954 20 20 20 20-8.954 20-20-8.954-20-20-20z"
        fill="#1152FD"
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M20.5 29.425c2.916 0 6.5-8.494 6.5-12.027C27 13.864 24.033 11 20.5 11c-3.534 0-6.5 2.864-6.5 6.398 0 3.533 3.583 12.027 6.5 12.027zm.15-8.701a3.07 3.07 0 100-6.142 3.07 3.07 0 000 6.142z"
        fill="#fff"
      />
    </Svg>
  )
}

export default LocationUser
