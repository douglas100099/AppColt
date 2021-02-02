import * as React from "react"
import { WebView } from "react-native-webview"

function BackgroundTask(props) {
  return (
    <WebView
      onMessage={props.function}
      source={{
        html: `<script>
          setTimeout(()=>{window.ReactNativeWebView.postMessage("");}, ${props.interval})
          </script>`,
      }}
    />
  )
}
export default BackgroundTask