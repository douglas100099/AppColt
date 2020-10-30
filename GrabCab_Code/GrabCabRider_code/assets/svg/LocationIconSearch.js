import * as React from "react"
import Svg, { Path } from "react-native-svg"

function LocationIconSearch(props) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Path fill="#fff" fillOpacity={0.01} d="M0 0h24v24H0z" />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11.25 4a6.25 6.25 0 103.656 11.32l3.95 3.95a1 1 0 001.414-1.415l-3.95-3.95A6.25 6.25 0 0011.25 4zM7 10.25a4.25 4.25 0 118.5 0 4.25 4.25 0 01-8.5 0z"
        fill="#1152FD"
      />
    </Svg>
  )
}

export default LocationIconSearch
