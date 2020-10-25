import React from 'react';
import {
  StyleSheet,
  View,
  Dimensions,
  ImageBackground,
  ActivityIndicator,
  AsyncStorage,
  Text
} from 'react-native';
import * as firebase from 'firebase'
import GetPushToken from '../common/GetPushToken/';
import languageJSON from '../common/language';
import { google_map_key } from '../common/key';
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';

const LOCATION_TASK_NAME = 'background-location-task';

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data: { locations }, error }) => {
  if (error) {
    console.log("Task Error");
    return;
  }
  let location = locations[locations.length - 1];
  let uid = firebase.auth().currentUser.uid;
  var latlng = location.coords.latitude + ',' + location.coords.longitude;
  fetch('https://maps.googleapis.com/maps/api/geocode/json?latlng=' + latlng + '&key=' + google_map_key)
    .then((response) => response.json())
    .then((responseJson) => {
      if (responseJson.results[0] && responseJson.results[0].formatted_address) {
        let address = responseJson.results[0].formatted_address;
        if (locations.length > 0) {
          firebase.database().ref('users/' + uid + '/location').update({
            add: address,
            lat: location.coords.latitude,
            lng: location.coords.longitude
          });
        }
      }
    }).catch((error) => {
      console.error(error);
    });
});

export class AuthLoadingScreen extends React.Component {
  constructor(props) {
    super(props);
    this._bootstrapAsync();
  }


  async StartBackgroundLocation() {
    const { status } = await Location.requestPermissionsAsync();
    let verificarGPS = await Location.hasServicesEnabledAsync();
    console.log("STATUS " + status)
    if (status === 'granted') {
      console.log('Setando update do background')
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.Highest,
        timeInterval: 2000,
        showsBackgroundLocationIndicator: true,
      });
      let verificar = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME)
      console.log(verificar)
    } else {
      alert('Localização desativada, habilite sua localização')
    }
  }

  // Fetch the token from storage then navigate to our appropriate place
  _bootstrapAsync = () => {
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        if (user.displayName) {
          const userData = firebase.database().ref('users/' + user.uid);
          userData.once('value', userData => {
            if (userData.val()) {
              if (userData.val().usertype == 'driver' && userData.val().approved == true) {
                GetPushToken();
                firebase.database().ref('users/' + user.uid + '/driverActiveStatus').on('value', status => {
                  let activeStatus = status.val();
                  let verificarGPS = Location.hasServicesEnabledAsync();
                  if (activeStatus && verificarGPS) {
                    this.StartBackgroundLocation();
                  }
                  else {
                    Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
                  }
                });
                if (userData.val().emCorrida) {
                  console.log('ENTROU NO START')
                  let bookingData = firebase.database().ref('bookings/' + userData.val().emCorrida + '/')
                  bookingData.once('value', item => {
                    var item = item.val()
                    if (item.status == 'START' || item.status == 'END') {
                      firebase.database().ref('bookings/' + userData.val().emCorrida + '/').once('value', (snap) => {
                        if (snap.val()) {
                          AsyncStorage.getItem('startTime', (err, result) => {
                            if (result) {
                              let bookingData = snap.val()
                              bookingData.bookingId = userData.val().emCorrida;
                              this.props.navigation.navigate('DriverTripComplete', { allDetails: bookingData, startTime: parseInt(result) })
                            }
                          });
                        }
                      })

                    } else if (item.status == 'ACCEPTED') {
                      console.log('ENTROU NO ACCEPTED')
                      firebase.database().ref('bookings/' + userData.val().emCorrida + '/').once('value', (snap) => {
                        if (snap.val()) {
                          let bookingData = snap.val();
                          bookingData.bookingId = userData.val().emCorrida;
                          this.props.navigation.navigate('DriverTripStart', { allDetails: bookingData })
                        }
                      })

                    }
                  })
                } else if (userData.val().emCorrida == null && userData.val().in_reject_progress == null) {
                  console.log('ENTROU NA INTRO')
                  this.props.navigation.navigate('DriverRoot');
                } else if (userData.val().emCorrida == null && userData.val().in_reject_progress) {
                  this.props.navigation.navigate('BookingCancel');
                }
              }
              else {
                const settings = firebase.database().ref('settings');
                settings.once('value', settingsData => {
                  if (settingsData.val() && settingsData.val().driver_approval) {
                    firebase.auth().signOut();
                    this.props.navigation.navigate("Intro");
                    alert(languageJSON.driver_account_approve_err);
                  }
                  else {
                    firebase.database().ref('users/' + user.uid).update({
                      approved: true,
                      driverActiveStatus: true,
                      queue: false,
                    });
                    this.props.navigation.navigate("DriverRoot");
                  }
                });
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
              this.props.navigation.navigate("DriverReg", { requireData: data })
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
              this.props.navigation.navigate("DriverReg", { requireData: data })
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