import React from 'react';
import {
  StyleSheet,
  View,
  AsyncStorage,
  Dimensions,
  ImageBackground, Platform
} from 'react-native';

import * as firebase from 'firebase';
import GetPushToken from '../common/GetPushToken';
import languageJSON from '../common/language';
import * as TaskManager from 'expo-task-manager';

import { google_map_key } from '../common/key';
import * as Location from 'expo-location';
import * as Permissions from 'expo-permissions';
import Geocoder from 'react-native-geocoding';

export class AuthLoadingScreen extends React.Component {
  constructor(props) {
    super(props);
    Geocoder.init(google_map_key);
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

  _getLocationAsync = async () => {
    let { status } = await Permissions.askAsync(Permissions.LOCATION);
    let gpsActived = await Location.hasServicesEnabledAsync()

    if (status !== 'granted') {
      alert("Para acessar sua localização, é necessário sua permissão!");
    }
    else if (!gpsActived) {
      alert("Ative seu GPS para permitir que a Colt determine sua localização");
      await Location.requestPermissionsAsync();
    }
    else {
      let location = Platform.OS === 'android' ? await Location.getCurrentPositionAsync({ enableHighAccuracy: true, maximumAge: 1000, timeout: 20000, }) :
        await Location.getCurrentPositionAsync({ enableHighAccuracy: true, maximumAge: 1000, timeout: 2000, })
      if (location) {
        var pos = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        if (pos) {
          let latlng = pos.latitude + ',' + pos.longitude;
          fetch('https://maps.googleapis.com/maps/api/geocode/json?latlng=' + latlng + '&key=' + google_map_key)
            .then((response) => response.json())
            .then((responseJson) => {
              //Setando a localização do usuario no firebase
              firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/location').update({
                add: responseJson.results[0].formatted_address,
                lat: pos.latitude,
                lng: pos.longitude
              }).then(() => {
                this._watchPosition()
              })
            })
            .catch((error) => {
              console.error(error);
            });
        }
      }
    }
  }

  _watchPosition = async () => {
    await Location.watchPositionAsync({
      accuracy: Location.Accuracy.Highest,
      distanceInterval: 10,
      timeInterval: 2000
    },
      newLocation => {
        let { coords } = newLocation;

        firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/location').update({
          lat: coords.latitude,
          lng: coords.longitude
        });
      },
      error => console.log(error)
    );
  }

  // Fetch the token from storage then navigate to our appropriate place
  bootstrapAsync = async () => {
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        if (user.displayName) {
          const userData = firebase.database().ref('users/' + user.uid);
          userData.once('value', userData => {
            if (userData.val()) {
              if (userData.val().usertype == 'rider') {
                GetPushToken();
                //this.StartBackgroundLocation();

                this._setSettings();
                this._getLocationAsync();
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
            if ((user.providerData[0].providerId === "password" && settings.email_verify && user.emailVerified) || !settings.email_verify || user.providerData[0].providerId !== "password") {
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
          source={require("../../assets/images/splash.png")}
          style={styles.imagebg}
        >
          {/*<ActivityIndicator />
          <Text style={{ paddingBottom: 100 }}>{languageJSON.fetching_data}</Text>*/}
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