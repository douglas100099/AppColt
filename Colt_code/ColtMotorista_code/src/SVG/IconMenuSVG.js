import * as React from "react"
import Svg, { Path } from "react-native-svg"

function IconMenuSVG(props) {
    return (
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
        <Path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M15.75 19H5.25a1 1 0 110-2h10.5a1 1 0 110 2zM4.25 6a1 1 0 011-1h16.5a1 1 0 110 2H5.25a1 1 0 01-1-1zm1 7h13.5a1 1 0 100-2H5.25a1 1 0 100 2z"
          fill="#3E4958"
        />
      </Svg>
      )
    }
    

export default IconMenuSVG
