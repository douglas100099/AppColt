import * as React from "react"
import Svg, { Path, G, Defs } from "react-native-svg"
/* SVGR has dropped some elements not supported by react-native-svg: filter */

function MarkerDropSVG(props) {
  return (
    <Svg width={56} height={56} viewBox="0 0 56 56" fill="none" {...props}>
      <Path fill="#fff" fillOpacity={0.01} d="M13 9h30v30H13z" />
      <G filter="url(#prefix__filter0_d)">
        <Path
          d="M38 24c0 5.523-4.477 10-10 10s-10-4.477-10-10 4.477-10 10-10 10 4.477 10 10z"
          fill="#fff"
        />
      </G>
      <G filter="url(#prefix__filter1_d)">
        <Path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M40 24c0 6.627-5.373 12-12 12s-12-5.373-12-12 5.373-12 12-12 12 5.373 12 12zM28 34c5.523 0 10-4.477 10-10s-4.477-10-10-10-10 4.477-10 10 4.477 10 10 10z"
          fill="#fff"
        />
      </G>
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M37.757 21.797C36.753 17.334 32.766 14 28 14c-5.523 0-10 4.477-10 10s4.477 10 10 10c4.766 0 8.753-3.334 9.757-7.797v-4.406z"
        fill="#4B545A"
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M18.078 22.748a9.95 9.95 0 012.007-4.86c.75.198 1.542.297 2.396.297.101 0 .202-.007.303-.014.075-.005.15-.01.226-.012h.006v5.276c-2.24 0-4.271-.503-4.938-.687zM23.016 28.718v-5.281c2.29 0 4.917-.688 5.151-.75l.017-.003v5.281s-2.952.753-5.168.753zM28.168 33.999L28 34c-.81 0-1.6-.096-2.354-.279 1.316-.205 2.361-.48 2.505-.517l.017-.004V34zM28.168 14.001L28 14c-1.821 0-3.53.487-5 1.338v2.697c2.215 0 5.168-.753 5.168-.753v-3.28z"
        fill="#fff"
      />
      <Path
        d="M33.347 16.632c-.073 0-.135-.01-.208-.01-1.676 0-3.336.334-4.955.69v5.376s1.598-.753 5.168-.753v-5.303h-.005z"
        fill="#fff"
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M23.01 32.669a10.043 10.043 0 01-4.054-4.397 18.4 18.4 0 004.055.446v3.95z"
        fill="#fff"
      />
      <Path
        d="M28.176 33.177c1.707-.376 3.331-.72 4.955-.72.073 0 .14.01.208.01v-5.26c-3.321 0-5.168.752-5.168.752v5.218h.005z"
        fill="#fff"
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M37.264 27.773a14.006 14.006 0 00-3.925-.562v-5.282c2.04 0 3.58.398 4.426.684v3.553a9.92 9.92 0 01-.501 1.607zM34.909 16.77a14 14 0 00-1.57-.088v-1.139c.564.357 1.09.768 1.57 1.227z"
        fill="#fff"
      />
      <Defs></Defs>
    </Svg>
  )
}

export default MarkerDropSVG
