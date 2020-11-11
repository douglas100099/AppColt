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
  async clickRegister(fname, lname, mobile, email, vehicleNum, vehicleName, imageCrlv, imageCnh, imagePerfil, CarType, cpfNum, cnh, dataValidade, orgaoEmissor, renavam) {
    var regData = {
      firstName: fname,
      lastName: lname,
      mobile: mobile,
      email: email,
      vehicleNumber: vehicleNum,
      vehicleModel: vehicleName,
      licenseImage: imageCnh,
      imagemCrlv: imageCrlv,
      driver_image: imagePerfil,
      usertype: 'driver',
      approved: false,
      queue: false,
      carType: CarType,
      createdAt: new Date().toISOString(),

      cpfNum: cpfNum,
      cnh: cnh,
      dataValidade: dataValidade,
      orgaoEmissor: orgaoEmissor,
      renavam: renavam,
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
            driverActiveStatus: false,
            queue: false,
          });
          this.props.navigation.navigate("DriverRoot");
        }
      }).catch((error) => {
        console.log(error);
        alert('Ops, tivemos um problema.');
      });
    });

  }

  //upload of picture
  async uploadmultimediaCrlv(fname, lname, mobile, email, vehicleNum, vehicleName, urlCrlv, urlCnh, urlPerfil, CarType, cpfNum, cnh, dataValidade, orgaoEmissor, renavam ) {
    this.setState({ loading: true })
    const blob = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function () {
        resolve(xhr.response); // when BlobModule finishes reading, resolve with the blob
      };
      xhr.onerror = function () {
        console.log(urlCrlv)
        reject(new TypeError('Erro na conversão da IMG do CRLV'));
        //this.setState({ loading: false });
        alert(languageJSON.upload_image_error);
      };
      xhr.responseType = 'blob'; // use BlobModule's UriHandler
      xhr.open('GET', urlCrlv, true); // fetch the blob from uri in async mode
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
      }).then((dwnldurlCrlv) => {
        this.uploadmultimediaCnh(fname, lname, mobile, email, vehicleNum, vehicleName, dwnldurlCrlv, urlCnh, urlPerfil,CarType, cpfNum, cnh, dataValidade, orgaoEmissor, renavam);
      }).catch(error=>{
        console.log(error);
        alert('Ops, tivemos um problema.');
      });
    }

  }

  async uploadmultimediaCnh(fname, lname, mobile, email, vehicleNum, vehicleName, urlCrlv, urlCnh, urlPerfil, CarType, cpfNum, cnh, dataValidade, orgaoEmissor, renavam ) {
    this.setState({ loading: true })
    const blob = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function () {
        resolve(xhr.response); // when BlobModule finishes reading, resolve with the blob
      };
      xhr.onerror = function () {
        reject(new TypeError('Erro na conversão da IMG da CNH'));
        //this.setState({ loading: false });
        alert(languageJSON.upload_image_error);
      };
      xhr.responseType = 'blob'; // use BlobModule's UriHandler
      xhr.open('GET', urlCnh, true); // fetch the blob from uri in async mode
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
      }).then((dwnldurlCnh) => {
        this.clickRegister(fname, lname, mobile, email, vehicleNum, vehicleName, urlCrlv, dwnldurlCnh, urlPerfil, CarType, cpfNum, cnh, dataValidade, orgaoEmissor, renavam);
      }).catch(error=>{
        console.log(error);
        alert('Ops, tivemos um problema.');
      });
    }

  }

  async uploadmultimediaPerfil(fname, lname, mobile, email, vehicleNum, vehicleName, urlCrlv, urlCnh, urlPerfil, CarType, cpfNum, cnh, dataValidade, orgaoEmissor, renavam ) {
    this.setState({ loading: true })
    const blob = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function () {
        resolve(xhr.response); // when BlobModule finishes reading, resolve with the blob
      };
      xhr.onerror = function () {
        reject(new TypeError('Erro na conversão da IMG da CNH'));
        //this.setState({ loading: false });
        alert(languageJSON.upload_image_error);
      };
      xhr.responseType = 'blob'; // use BlobModule's UriHandler
      xhr.open('GET', urlPerfil, true); // fetch the blob from uri in async mode
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
      }).then((dwnldurlPerfil) => {
        this.clickRegister(fname, lname, mobile, email, vehicleNum, vehicleName, urlCrlv, urlCnh, dwnldurlPerfil, CarType, cpfNum, cnh, dataValidade, orgaoEmissor, renavam);
      }).catch(error=>{
        console.log(error);
        alert('Ops, tivemos um problema.');
      });
    }

  }



  render() {
    const registrationData = this.props.navigation.getParam("requireData");
    return (
      <View style={styles.containerView}>
        <DiverReg reqData={registrationData ? registrationData : ""} onPressRegister={(fname, lname, mobile, email, vehicleNum, vehicleName, imageCrlv, imageCnh, imagePerfil, CarType, cpfNum, cnh, dataValidade, orgaoEmissor, renavam) => this.uploadmultimediaCrlv(fname, lname, mobile, email, vehicleNum, vehicleName, imageCrlv, imageCnh, imagePerfil, CarType, cpfNum, cnh, dataValidade, orgaoEmissor, renavam)} onPressBack={() => { this.props.navigation.goBack() }} loading={this.state.loading}></DiverReg>
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