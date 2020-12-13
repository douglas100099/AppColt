import * as React from "react"
import Svg, { Path } from "react-native-svg"

function SvgComponent(props) {
  return (
    <Svg
      width={41}
      height={60}
      viewBox="0 0 41 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <Path opacity={0.01} fill="#fff" d="M0 0h40v60H0z" />
      <Path
        d="M20.022 58.728a4.17 4.17 0 100-8.34 4.17 4.17 0 000 8.34z"
        fill="#3E4958"
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M20.021 51.414a3.145 3.145 0 100 6.29 3.145 3.145 0 000-6.29zm-5.195 3.144a5.196 5.196 0 1110.391 0 5.196 5.196 0 01-10.391 0z"
        fill="#FDFDFD"
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M19.01 39.952h1.86v13.87h-1.86v-13.87z"
        fill="#3E4958"
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M20.4 0C9.354 0 .4 8.954.4 20s8.954 20 20 20 20-8.954 20-20-8.954-20-20-20z"
        fill="#1152FD"
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M20.291 27c2.375 0 5.292-6.915 5.292-9.792 0-2.876-2.415-5.208-5.292-5.208C17.415 12 15 14.332 15 17.208 15 20.085 17.917 27 20.291 27zm.123-7.084a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"
        fill="#fff"
      />
    </Svg>
  )
}

export default SvgComponent
