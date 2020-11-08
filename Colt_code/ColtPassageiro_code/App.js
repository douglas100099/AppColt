import React from 'react';
import { Asset } from 'expo-asset';
import * as Font from 'expo-font';
import AppContainer from './src/navigation/AppNavigator';
import Constants from 'expo-constants';
import * as firebase from 'firebase';
import * as Notifications from 'expo-notifications';
import * as Updates from 'expo-updates';
import { 
  LogBox, 
  ImageBackground, 
  ActivityIndicator,  
  StyleSheet,
  Dimensions,
  View,
  Text,
  Image,
  Platform,
} from 'react-native';
import _ from 'lodash';

var firebaseConfig = Constants.manifest.extra.firebaseConfig;
!firebase.apps.length ? firebase.initializeApp(firebaseConfig) : firebase.app();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

LogBox.ignoreLogs(['Setting a timer']);
const _console = _.clone(console);
console.warn = message => {
  if (message.indexOf('Setting a timer') <= -1) {
    _console.warn(message);
  }
};

export default class App extends React.Component {

  state = {
    assetsLoaded: false,
  };

  constructor() {
    super();
    LogBox.ignoreAllLogs(true)
  }

  _loadResourcesAsync = async () => {
    return Promise.all([
      Asset.loadAsync([
        require('./assets/images/searchDrivers.gif'),
      ]),

      Font.loadAsync({
        'Roboto-Bold': require('./assets/fonts/Roboto-Bold.ttf'),
        'Roboto-Regular': require('./assets/fonts/Roboto-Regular.ttf'),
        'Roboto-Medium': require('./assets/fonts/Roboto-Medium.ttf'),
        'Roboto-Light': require('./assets/fonts/Roboto-Light.ttf'),
        'Inter-Black': require('./assets/fonts/Inter-Black.ttf'),
        'Inter-Bold': require('./assets/fonts/Inter-Bold.ttf'),
        'Inter-ExtraBold': require('./assets/fonts/Inter-ExtraBold.ttf'),
        'Inter-ExtraLight': require('./assets/fonts/Inter-ExtraLight.ttf'),
        'Inter-Light': require('./assets/fonts/Inter-Light.ttf'),
        'Inter-Medium': require('./assets/fonts/Inter-Medium.ttf'),
        'Inter-Regular': require('./assets/fonts/Inter-Regular.ttf'),
        'Inter-SemiBold': require('./assets/fonts/Inter-SemiBold.ttf'),
        'Inter-Thin': require('./assets/fonts/Inter-Thin.ttf'),
      }),
    ]);
  };

  async componentDidMount() {
    if (__DEV__) {
      this.setState({ updateMsg: "Carregando arquivos" });
      this._loadResourcesAsync().then(() => {
        this.setState({ assetsLoaded: true });
      });
    } else {
      try {
        this.setState({ updateMsg: "Verificando atualizações" })
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          this.setState({ updateMsg: "Baixando atualizações" })
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        } else {
          this.setState({ updateMsg: "Carregando arquivos..." });
          this._loadResourcesAsync().then(() => {
            this.setState({ assetsLoaded: true });
          });
        }
      } catch (e) {
        alert('Não foi possível verificar as atualizações')
      }
    }
  }

  render() {
    return (
      this.state.assetsLoaded ?
        <AppContainer />
        :
        <View style={styles.container}>
          <ImageBackground
            source={require("./assets/images/splash.png")}
            resizeMode={'contain'}
            style={styles.imagebg}
          >
            <ActivityIndicator />
            <Text style={{ paddingBottom: 100, fontWeight:'600', color: '#fff' }}> {this.state.updateMsg} </Text>
          </ImageBackground>
        </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: 'center',
    backgroundColor: "#1152FD"
  },
  imagebg: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    justifyContent: "flex-end",
    alignItems: 'center'
  }
})