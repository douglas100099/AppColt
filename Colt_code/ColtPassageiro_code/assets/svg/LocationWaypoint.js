import * as React from "react"
import Svg, { Path } from "react-native-svg"

function LocationWaypoint(props) {
  return (
    <Svg
      width={24}
      height={23}
      viewBox="0 0 24 23"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <Path
        d="M12.022 22.464c5.988 0 10.843-4.854 10.843-10.842S18.01.779 12.022.779C6.034.78 1.18 5.634 1.18 11.622c0 5.988 4.854 10.842 10.842 10.842z"
        fill="#3E4958"
        stroke="#000"
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12.022 1.292c-5.705 0-10.33 4.625-10.33 10.33s4.625 10.33 10.33 10.33 10.33-4.625 10.33-10.33-4.625-10.33-10.33-10.33zM.667 11.622C.667 5.35 5.75.267 12.022.267c6.271 0 11.355 5.083 11.355 11.355 0 6.271-5.084 11.355-11.355 11.355-6.271 0-11.355-5.084-11.355-11.355z"
        fill="#F2F2F2"
      />
      <Path
        d="M12.022 14.958a3.336 3.336 0 100-6.672 3.336 3.336 0 000 6.672z"
        fill="#F9FFFF"
      />
    </Svg>
  )
}

export default LocationWaypoint
