import * as React from "react"
import Svg, { Path, G, Defs } from "react-native-svg"
/* SVGR has dropped some elements not supported by react-native-svg: filter */

function CashSVG(props) {
  return (
    <Svg width={54} height={44} viewBox="0 0 54 44" fill="none" {...props}>
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 1h30v30H12V1z"
        fill="#C4C4C4"
        fillOpacity={0.01}
      />
      <G filter="url(#prefix__filter0_d)">
        <Path
          d="M15 13a2 2 0 012-2h20a2 2 0 012 2v10a2 2 0 01-2 2H17a2 2 0 01-2-2V13z"
          fill="#fff"
        />
      </G>
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M17.76 7.5a1 1 0 100 2h18.8a1 1 0 000-2h-18.8zM17 13h20v10H17V13zm-2 0a2 2 0 012-2h20a2 2 0 012 2v10a2 2 0 01-2 2H17a2 2 0 01-2-2V13zm6.34 1.628c-.31.42-.589.683-1.014.89a1 1 0 00-.59.912v3.198a1 1 0 00.517.876l-.001.001c.536.293.837.54 1.06.89l.002-.002a1 1 0 00.846.465h9.68a.999.999 0 00.808-.41c.32-.437.603-.706 1.045-.916a1 1 0 00.571-.904V16.43a1 1 0 00-.546-.891c-.513-.283-.807-.526-1.025-.862a1 1 0 00-.853-.477h-9.68c-.34 0-.64.17-.82.428zm10.924 4.42v-2.05a4.4 4.4 0 01-.923-.798h-8.698c-.258.3-.55.572-.907.81v2.053c.332.22.642.475.919.795h8.702c.258-.299.55-.571.907-.81zM24 17.05a1 1 0 100 2h6a1 1 0 100-2h-6z"
        fill="#3E4958"
      />
      <Defs></Defs>
    </Svg>
  )
}

export default CashSVG
