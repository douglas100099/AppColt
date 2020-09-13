import React from 'react';
import {
  StyleSheet,
  View,
  Dimensions,
  ImageBackground,
  ActivityIndicator,
  Text
} from 'react-native';
import * as firebase from 'firebase'
import GetPushToken from '../common/GetPushToken/';
import languageJSON from '../common/language';
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';

const LOCATION_TASK_NAME = 'background-location-task';

TaskManager.defineTask(LOCATION_TASK_NAME, ({ data: { locations }, error }) => {
  if (error) {
    console.log("Task Error");
    return;
  }
  let uid = firebase.auth().currentUser.uid;
  if(locations.length>0){
    let location = locations[locations.length - 1];
    firebase.database().ref('users/' + uid + '/location').update({
      lat: location.coords.latitude,
      lng: location.coords.longitude
    });
  }
});

export class AuthLoadingScreen extends React.Component {
  constructor(props) {
    super(props);
    this._bootstrapAsync();
  }

  async StartBackgroundLocation() {
    const { status } = await Location.requestPermissionsAsync();
    if (status === 'granted') {
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.High
      });
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
                firebase.database().ref('users/' + user.uid +'/driverActiveStatus').on('value',status=>{
                  let activeStatus = status.val();
                  if(activeStatus){
                    this.StartBackgroundLocation();
                  }
                  else{
                    Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
                  }
                });
                this.props.navigation.navigate('DriverRoot');
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
                name:user.name?user.name:'',
                last_name:user.last_name?user.last_name:'',
                first_name:user.first_name?user.first_name:'',
                email:user.email?user.email:'',
                mobile:user.phoneNumber?user.phoneNumber.replace('"',''):'',
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