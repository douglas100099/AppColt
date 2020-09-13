import React from 'react';
import {
  StyleSheet,
  View,
  AsyncStorage,
  Dimensions,
  ImageBackground,
  ActivityIndicator,
  Text
} from 'react-native';

import * as firebase from 'firebase'
import GetPushToken from '../common/GetPushToken';
import languageJSON from '../common/language';


export class AuthLoadingScreen extends React.Component {
  constructor(props) {
    super(props);
    this.bootstrapAsync();
  }

  _setSettings = async () => {
    try {
      const settings = firebase.database().ref('settings');
      settings.once('value', settingsData => {
        if (settingsData.val()) {
          AsyncStorage.setItem('settings', JSON.stringify(settingsData.val()));
        }
      });
    } catch (error) {
      console.log("Asyncstorage issue 5");
    }
  };

  // Fetch the token from storage then navigate to our appropriate place
  bootstrapAsync = () => {
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        if (user.displayName) {
          const userData = firebase.database().ref('users/' + user.uid);
          userData.once('value', userData => {
            if (userData.val()) {
              if (userData.val().usertype == 'rider') {
                GetPushToken();
                this._setSettings();
                this.props.navigation.navigate('Root');
              }
              else {
                firebase.auth().signOut();
                alert(languageJSON.valid_rider);
              }
            } else {
              var data = {};
              data.profile = {
                name: user.name ? user.name : '',
                last_name: user.last_name ? user.last_name : '',
                first_name: user.first_name ? user.first_name : '',
                email: user.email ? user.email : '',
                mobile: user.phoneNumber ? user.phoneNumber.replace('"', '') : '',
              };
              this.props.navigation.navigate("Reg", { requireData: data })
            }
          })
        } else {
          firebase.database().ref("settings").once("value", settingdata => {
            let settings = settingdata.val();
            if ((user.providerData[0].providerId === "password" && settings.email_verify && user.emailVerified) || !settings.email_verify) {
              var data = {};
              data.profile = {
                name: user.name ? user.name : '',
                last_name: user.last_name ? user.last_name : '',
                first_name: user.first_name ? user.first_name : '',
                email: user.email ? user.email : '',
                mobile: user.phoneNumber ? user.phoneNumber.replace('"', '') : '',
              };
              this.props.navigation.navigate("Reg", { requireData: data })
            }
            else {
              alert(languageJSON.email_verify_message);
              user.sendEmailVerification();
              firebase.auth().signOut();
              this.props.navigation.navigate('Intro');
            }
          });
        }
      } else {

        this.props.navigation.navigate('Intro');
      }
    })

  };

  // Render any loading content that you like here
  render() {
    return (
      <View style={styles.container}>
        <ImageBackground
          source={require("../../assets/images/intro.jpg")}
          resizeMode="stretch"
          style={styles.imagebg}
        >
          <ActivityIndicator />
          <Text style={{ paddingBottom: 100 }}>{languageJSON.fetching_data}</Text>
        </ImageBackground>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: 'center'
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
});