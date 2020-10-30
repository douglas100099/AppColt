import * as React from "react"
import Svg, { Path } from "react-native-svg"

function MarkerPicSVG(props) {
  return (
    <Svg width={40} height={40} viewBox="0 0 40 40" fill="none" {...props}>
      <Path opacity={0.01} fill="#fff" d="M0 0h40v40H0z" />
      <Path
        d="M20.022 38.728a4.17 4.17 0 100-8.34 4.17 4.17 0 000 8.34z"
        fill="#3E4958"
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M20.021 31.413a3.145 3.145 0 100 6.29 3.145 3.145 0 000-6.29zm-5.195 3.145a5.196 5.196 0 1110.391 0 5.196 5.196 0 01-10.391 0z"
        fill="#FDFDFD"
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M19.01 21.951h1.86v11.87h-1.86v-11.87z"
        fill="#3E4958"
      />
      <Path
        d="M20.022 22.464c5.988 0 10.843-4.854 10.843-10.842S26.01.779 20.022.779C14.034.78 9.18 5.634 9.18 11.622c0 5.988 4.854 10.842 10.842 10.842z"
        fill="#1152FD"
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M20.022 1.292c-5.705 0-10.33 4.625-10.33 10.33s4.625 10.33 10.33 10.33 10.33-4.625 10.33-10.33-4.625-10.33-10.33-10.33zM8.667 11.622C8.667 5.35 13.75.267 20.022.267c6.271 0 11.355 5.083 11.355 11.355 0 6.271-5.084 11.355-11.355 11.355-6.271 0-11.355-5.084-11.355-11.355z"
        fill="#1152FD"
      />
      <Path
        d="M20.022 14.958a3.336 3.336 0 100-6.672 3.336 3.336 0 000 6.672z"
        fill="#F9FFFF"
      />
    </Svg>
  )
}

export default MarkerPicSVG
