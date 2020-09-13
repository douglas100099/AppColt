import React from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import { DiverReg } from '../components';
import * as firebase from 'firebase';
import languageJSON from '../common/language';
export default class DriverRegistrationPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      approval_required: false,
      uid: null
    }
  }

  componentDidMount() {
    const settings = firebase.database().ref('settings');
    settings.once('value', settingsData => {
      if (settingsData.val() && settingsData.val().driver_approval) {
        this.setState({ approval_required: true });
      } else {
        this.setState({ approval_required: false });
      }
    });
    this.setState({ uid: firebase.auth().currentUser.uid });
  }

  //register button click after all validation
  async clickRegister(fname, lname, mobile, email, vehicleNum, vehicleName, image, CarType) {
    var regData = {
      firstName: fname,
      lastName: lname,
      mobile: mobile,
      email: email,
      vehicleNumber: vehicleNum,
      vehicleModel: vehicleName,
      licenseImage: image,
      usertype: 'driver',
      approved: false,
      queue: false,
      carType: CarType,
      createdAt: new Date().toISOString()
    }
    firebase.auth().currentUser.updateProfile({
      displayName:regData.firstName + ' '+ regData.lastName,
    }).then(()=>{
      firebase.database().ref(`users/${this.state.uid}`).set(regData).then(() => {
        if (this.state.approval_required) {
          firebase.auth().signOut();
          this.props.navigation.navigate("Intro");
          alert(languageJSON.account_successful_done);
        }
        else {
          firebase.database().ref(`users/${this.state.uid}`).update({
            approved: true,
            driverActiveStatus: true,
            queue: false,
          });
          this.props.navigation.navigate("DriverRoot");
        }
      }).catch((error) => {
        console.log(error);
      });
    });

  }

  //upload of picture
  async uploadmultimedia(fname, lname, mobile, email, vehicleNum, vehicleName, url, CarType) {
    this.setState({ loading: true })
    const blob = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function () {
        resolve(xhr.response); // when BlobModule finishes reading, resolve with the blob
      };
      xhr.onerror = function () {
        reject(new TypeError('Image blob conversion issue'));
        //this.setState({ loading: false });
        alert(languageJSON.upload_image_error);
      };
      xhr.responseType = 'blob'; // use BlobModule's UriHandler
      xhr.open('GET', url, true); // fetch the blob from uri in async mode
      xhr.send(null); // no initial data
    });

    if ((blob.size / 1000000) > 2) {
      this.setState({ loading: false }, () => { alert(languageJSON.image_size_error) })
    }
    else {
      var timestamp = new Date().getTime()
      var imageRef = firebase.storage().ref().child(`users/driver_licenses/` + timestamp + `/`);
      return imageRef.put(blob).then(() => {
        blob.close()
        return imageRef.getDownloadURL()
      }).then((dwnldurl) => {
        this.clickRegister(fname, lname, mobile, email, vehicleNum, vehicleName, dwnldurl, CarType);
      }).catch(error=>{
        console.log(error);
      });
    }

  }


  render() {
    const registrationData = this.props.navigation.getParam("requireData");
    return (
      <View style={styles.containerView}>
        <DiverReg reqData={registrationData ? registrationData : ""} onPressRegister={(fname, lname, mobile, email, vehicleNum, vehicleName, image, CarType) => this.uploadmultimedia(fname, lname, mobile, email, vehicleNum, vehicleName, image, CarType)} onPressBack={() => { this.props.navigation.goBack() }} loading={this.state.loading}></DiverReg>
      </View>
    );
  }
}

//Screen Styling
const styles = StyleSheet.create({
  containerView: {
    flex: 1,
  },
  textContainer: { textAlign: "center" },
});