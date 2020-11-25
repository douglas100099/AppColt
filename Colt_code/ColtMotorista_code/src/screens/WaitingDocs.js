import React from 'react';
import { View, StyleSheet, Platform, Text, TouchableOpacity, ScrollView, Image, BackHandler, ToastAndroid } from 'react-native';
import { colors } from '../common/theme';
import * as firebase from 'firebase';
import { Icon } from 'react-native-elements';
import { Camera } from 'expo-camera';

export default class WaitingDocs extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      curID: firebase.auth().currentUser.uid,
      isCamera: false,
      isPerfil: false,
      isCrlv: false,
      isCnh: false,
      isProgress: false,
      imagePerfil: null,
      imageCnh: null,
      imageCrlv: null,
      imageCnhValid: true,
      imageCrlvValid: true,
      imagePerfilValid: true,
    }
  }
  async componentDidMount() {
    const { status } = await Camera.requestPermissionsAsync();
    if (status === 'granted') {
      this.setState({ statusCamera: true })
    } else {
      this.setState({ statusCamera: false })
    }
    this.acessDBdocs();
    BackHandler.addEventListener('hardwareBackPress', this.handleBackButton);
  }

  componentWillUnmount() {
    BackHandler.removeEventListener('hardwareBackPress', this.handleBackButton);
  }

  handleBackButton() {
    ToastAndroid.show('Você ainda não foi aprovado', ToastAndroid.SHORT);
    return true;
  }


  acessDBdocs() {
    if (this.state.curID) {
      const dbRef = firebase.database().ref('users/' + this.state.curID + '/')
      dbRef.on('value', (snap) => {
        let detailsUser = snap.val()
        if (detailsUser) {
          let crlvStatus = detailsUser.crlvAproved;
          let cnhStatus = detailsUser.cnhAproved;
          let perfilStatus = detailsUser.perfilAproved;
          this.setState({
            crlvStatus: crlvStatus,
            cnhStatus: cnhStatus,
            perfilStatus: perfilStatus,
            detailsUser: detailsUser,
          })
        }
      })
    }
  }

  async uploadmultimediaCrlv(image) {
    console.log('CONVERTENDO')
    this.setState({ loading: true })
    const blob = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function () {
        resolve(xhr.response); // when BlobModule finishes reading, resolve with the blob
      };
      xhr.onerror = function () {
        console.log(image)
        reject(new TypeError('Erro na conversão da IMG do CRLV'));
        //this.setState({ loading: false });
        alert(languageJSON.upload_image_error);
      };
      xhr.responseType = 'blob'; // use BlobModule's UriHandler
      xhr.open('GET', image, true); // fetch the blob from uri in async mode
      xhr.send(null); // no initial data
    });

    if ((blob.size / 1000000) > 3) {
      this.setState({ loading: false }, () => { alert(languageJSON.image_size_error) })
    }
    else {
      var timestamp = new Date().getTime()
      var imageRef = firebase.storage().ref().child(`users/driver_licenses/` + timestamp + `/`);
      return imageRef.put(blob).then(() => {
        blob.close()
        return imageRef.getDownloadURL()
      }).then((dwnldurlCrlv) => {
        this.setState({ imageCrlv: dwnldurlCrlv });
        return dwnldurlCrlv
      }).catch(error => {
        console.log(error);
        alert('Ops, tivemos um problema.');
      });
    }

  }

  async uploadmultimediaPerfil(image) {
    console.log('CONVERTENDO')
    this.setState({ loading: true })
    const blob = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function () {
        resolve(xhr.response); // when BlobModule finishes reading, resolve with the blob
      };
      xhr.onerror = function () {
        console.log(image)
        reject(new TypeError('Erro na conversão da IMG do CRLV'));
        //this.setState({ loading: false });
        alert(languageJSON.upload_image_error);
      };
      xhr.responseType = 'blob'; // use BlobModule's UriHandler
      xhr.open('GET', image, true); // fetch the blob from uri in async mode
      xhr.send(null); // no initial data
    });

    if ((blob.size / 1000000) > 3) {
      this.setState({ loading: false }, () => { alert(languageJSON.image_size_error) })
    }
    else {
      var timestamp = new Date().getTime()
      var imageRef = firebase.storage().ref().child(`users/driver_licenses/` + timestamp + `/`);
      return imageRef.put(blob).then(() => {
        blob.close()
        return imageRef.getDownloadURL()
      }).then((dwnldurlCrlv) => {
        this.setState({ imageCrlv: dwnldurlCrlv });
        return dwnldurlCrlv
      }).catch(error => {
        console.log(error);
        alert('Ops, tivemos um problema.');
      });
    }

  }

  async uploadmultimediaCnh(image) {
    console.log('CONVERTENDO')
    this.setState({ loading: true })
    const blob = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function () {
        resolve(xhr.response); // when BlobModule finishes reading, resolve with the blob
      };
      xhr.onerror = function () {
        console.log(image)
        reject(new TypeError('Erro na conversão da IMG da CNH'));
        //this.setState({ loading: false });
        alert(languageJSON.upload_image_error);
      };
      xhr.responseType = 'blob'; // use BlobModule's UriHandler
      xhr.open('GET', image, true); // fetch the blob from uri in async mode
      xhr.send(null); // no initial data
    });

    if ((blob.size / 1000000) > 3) {
      this.setState({ loading: false }, () => { alert(languageJSON.image_size_error) })
    }
    else {
      var timestamp = new Date().getTime()
      var imageRef = firebase.storage().ref().child(`users/driver_licenses/` + timestamp + `/`);
      return imageRef.put(blob).then(() => {
        blob.close()
        return imageRef.getDownloadURL()
      }).then((dwnldurlCrlv) => {
        this.setState({ imageCrlv: dwnldurlCrlv });
        return dwnldurlCrlv
      }).catch(error => {
        console.log(error);
        alert('Ops, tivemos um problema.');
      });
    }

  }

  CapturePhoto = async () => {
    this.setState({ isProgress: true })
    if (this.camera && this.state.statusCamera) {
      let photo = await this.camera.takePictureAsync({
        quality: 0.8,
      })
      if (this.state.isPerfil) {
        this.setState({ imagePerfil: photo.uri, isCamera: false, isPerfil: false, isProgress: false });
      } else if (this.state.isCnh) {
        this.setState({ imageCnh: photo.uri, isCamera: false, isCnh: false, isProgress: false });
      } else if (this.state.isCrlv) {
        this.setState({ imageCrlv: photo.uri, isCamera: false, isCrlv: false, isProgress: false });
      }
    }
  }

  checkDocs() {
    const validCnh = this.validateImageCnh()
    const validCrlv = this.validateImageCrlv()
    const validPerfil = this.validateImagePerfil()

    if (this.state.crlvStatus === 'REENVIE') {
      if (validCrlv) {
        this.uploadmultimediaCrlv(this.state.imageCrlv).then((response) => {
          firebase.database().ref('users/' + this.state.curID + '/').update({
            imagemCrlv: response,
            crlvAproved: 'AGUARDANDO'
          })
        })
        alert('Foto do CRLV enviado com sucesso.')
      } else {
        alert('Reenvie a foto do CRLV.')
      }
    }
    if (this.state.cnhStatus === 'REENVIE') {
      if (validCnh) {
        this.uploadmultimediaCnh(this.state.imageCnh).then((response) => {
          firebase.database().ref('users/' + this.state.curID + '/').update({
            licenseImage: response,
            cnhAproved: 'AGUARDANDO'
          })
          alert('Foto da CNH enviada com sucesso.')
        })
      } else {
        alert('Reenvie a foto da CNH.')
      }
    }
    if (this.state.perfilStatus === 'REENVIE') {
      if (validPerfil) {
        this.uploadmultimediaPerfil(this.state.imagePerfil).then((response) => {
          firebase.database().ref('users/' + this.state.curID + '/').update({
            driver_image: response,
            perfilAproved: 'AGUARDANDO'
          })
          alert('Foto de PERFIL enviado com sucesso.')
        })
      } else {
        alert('Reenvie a foto de PERFIL.')
      }
    }
  }

  //upload cancel
  cancelPhotoCnh = () => {
    this.setState({ imageCnh: null });
  }

  //upload cancel
  cancelPhotoCrlv = () => {
    this.setState({ imageCrlv: null });
  }
  cancelPhotoPerfil = () => {
    this.setState({ imagePerfil: null });
  }
  validateImageCnh() {
    const { imageCnh } = this.state;
    const imageCnhValid = (imageCnh != null);
    //LayoutAnimation.easeInEaseOut()
    this.setState({ imageCnhValid })
    imageCnhValid;
    return imageCnhValid
  }

  validateImagePerfil() {
    const { imagePerfil } = this.state;
    const imagePerfilValid = (imagePerfil != null);
    //LayoutAnimation.easeInEaseOut()
    this.setState({ imagePerfilValid })
    imagePerfilValid;
    return imagePerfilValid
  }

  validateImageCrlv() {
    const { imageCrlv } = this.state;
    const imageCrlvValid = (imageCrlv != null);
    //LayoutAnimation.easeInEaseOut()
    this.setState({ imageCrlvValid })
    imageCrlvValid;
    return imageCrlvValid
  }

  render() {
    let { imageCrlv } = this.state
    let { imagePerfil } = this.state
    let { imageCnh } = this.state
    return (
      <View style={styles.mainView}>
        {this.state.isCamera == false ?

          <View style={styles.main}>
            <View style={styles.header}>
              <Text style={{ fontSize: 20, fontFamily: 'Inter-Bold', color: colors.BLACK, textAlign: 'center' }}>Confirmação de documentos</Text>
            </View>
            <ScrollView style={{ flex: 1 }}>

              <Text style={{ color: colors.BLACK, fontSize: 16, fontFamily: 'Inter-Medium', textAlign: 'center', marginBottom: 15, }}>CNH</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignSelf: 'center', height: 100, width: '85%', backgroundColor: colors.GREY3, elevation: 1, borderRadius: 15 }}>
                <View style={{ flex: 1, borderRightWidth: 0.6, borderRightColor: colors.GREY1, justifyContent: 'center', alignItems: 'center' }}>
                  {this.state.cnhStatus === 'REENVIE' &&  imageCnh === null ?
                    <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                      <Icon
                        name='camera'
                        type='feather'
                        color={colors.BLACK}
                        size={30}
                        onPress={() => this.setState({ isCamera: true, isCnh: true })}
                      />
                      <Text style={{ color: colors.BLACK, fontSize: 14, fontFamily: 'Inter-Bold' }}>Não enviado</Text>
                    </View>
                    :
                    <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                      <Icon
                        name='check-circle'
                        type='ionicons'
                        color={colors.GREEN.light}
                        size={30}
                      />
                      <Text style={{ color: colors.BLACK, fontSize: 14, fontFamily: 'Inter-Bold' }}>Enviado!</Text>
                    </View>
                  }
                </View>
                <View style={{ flex: 1, justifyContent: "center" }}>
                  {this.state.cnhStatus === 'AGUARDANDO'?
                    <View style={{ flexDirection: 'column', justifyContent: "center", alignItems: 'center' }}>
                      <Icon
                        name='clock'
                        type='feather'
                        color={colors.DEEPBLUE}
                        size={25}
                      />
                      <Text style={{ color: colors.BLACK, fontSize: 14, fontFamily: 'Inter-Bold', textAlign: 'center' }}>Aguardando aprovação</Text>
                    </View>
                    : null}

                  {this.state.cnhStatus === 'REENVIE' ?
                    <View style={{ flexDirection: 'column', justifyContent: "center", alignItems: 'center' }}>
                      <Icon
                        name='alert-circle'
                        type='feather'
                        color={colors.YELLOW.primary}
                        size={25}
                      />
                      <Text style={{ color: colors.BLACK, fontSize: 14, fontFamily: 'Inter-Bold', textAlign: 'center' }}>Favor, reenvie o documento</Text>
                    </View>
                    : null}

                  {this.state.cnhStatus === 'APROVADO' ?
                    <View style={{ flexDirection: 'column', justifyContent: "center", alignItems: 'center' }}>
                      <Icon
                        name='check-circle'
                        type='feather'
                        color={colors.GREEN.light}
                        size={25}
                      />
                      <Text style={{ color: colors.BLACK, fontSize: 14, fontFamily: 'Inter-Bold', textAlign: 'center' }}>Aprovado!</Text>
                    </View>
                    : null}

                </View>
              </View>

              <Text style={{ color: colors.BLACK, fontSize: 16, fontFamily: 'Inter-Medium', textAlign: 'center', marginBottom: 15, marginTop: 20 }}>CRLV</Text>
              <View style={{ flexDirection: 'row', alignSelf: 'center', height: 100, justifyContent: 'space-between', width: '85%', backgroundColor: colors.GREY3, elevation: 1, borderRadius: 15 }}>
                <View style={{ flex: 1, borderRightWidth: 0.6, borderRightColor: colors.GREY1, alignItems: 'center', justifyContent: 'center' }}>
                  {this.state.crlvStatus === 'REENVIE' &&  imageCrlv === null ?
                    <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                      <Icon
                        name='camera'
                        type='feather'
                        color={colors.BLACK}
                        size={30}
                        onPress={() => this.setState({ isCamera: true, isCnh: true })}
                      />
                      <Text style={{ color: colors.BLACK, fontSize: 14, fontFamily: 'Inter-Bold' }}>Não enviado</Text>
                    </View>
                    :
                    <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                      <Icon
                        name='check-circle'
                        type='ionicons'
                        color={colors.GREEN.light}
                        size={30}
                      />
                      <Text style={{ color: colors.BLACK, fontSize: 14, fontFamily: 'Inter-Bold' }}>Enviado!</Text>
                    </View>
                  }
                </View>
                <View style={{ flex: 1, justifyContent: "center" }}>
                  {this.state.crlvStatus === 'AGUARDANDO' ?
                    <View style={{ flexDirection: 'column', justifyContent: "center", alignItems: 'center' }}>
                      <Icon
                        name='clock'
                        type='feather'
                        color={colors.DEEPBLUE}
                        size={25}
                      />
                      <Text style={{ color: colors.BLACK, fontSize: 14, fontFamily: 'Inter-Bold', textAlign: 'center' }}>Aguardando aprovação</Text>
                    </View>
                    : null}

                  {this.state.crlvStatus === 'REENVIE' ?
                    <View style={{ flexDirection: 'column', justifyContent: "center", alignItems: 'center' }}>
                      <Icon
                        name='alert-circle'
                        type='feather'
                        color={colors.YELLOW.primary}
                        size={25}
                      />
                      <Text style={{ color: colors.BLACK, fontSize: 14, fontFamily: 'Inter-Bold', textAlign: 'center' }}>Favor, reenvie o documento</Text>
                    </View>
                    : null}

                  {this.state.crlvStatus === 'APROVADO' ?
                    <View style={{ flexDirection: 'column', justifyContent: "center", alignItems: 'center' }}>
                      <Icon
                        name='check-circle'
                        type='feather'
                        color={colors.GREEN.light}
                        size={25}
                      />
                      <Text style={{ color: colors.BLACK, fontSize: 14, fontFamily: 'Inter-Bold', textAlign: 'center' }}>Aprovado!</Text>
                    </View>
                    : null}

                </View>
              </View>

              <Text style={{ color: colors.BLACK, fontSize: 16, fontFamily: 'Inter-Medium', textAlign: 'center', marginBottom: 15, marginTop: 20 }}>PERFIL</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignSelf: 'center', marginBottom: 20, height: 100, width: '85%', backgroundColor: colors.GREY3, elevation: 1, borderRadius: 15 }}>
                <View style={{ flex: 1, borderRightWidth: 0.6, borderRightColor: colors.GREY1, justifyContent: 'center', alignItems: 'center' }}>
                  {this.state.perfilStatus === 'REENVIE' &&  imagePerfil === null ?
                    <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                      <Icon
                        name='camera'
                        type='feather'
                        color={colors.BLACK}
                        size={30}
                        onPress={() => this.setState({ isCamera: true, isCnh: true })}
                      />
                      <Text style={{ color: colors.BLACK, fontSize: 14, fontFamily: 'Inter-Bold' }}>Não enviado</Text>
                    </View>
                    :
                    <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                      <Icon
                        name='check-circle'
                        type='ionicons'
                        color={colors.GREEN.light}
                        size={30}
                      />
                      <Text style={{ color: colors.BLACK, fontSize: 14, fontFamily: 'Inter-Bold' }}>Enviado!</Text>
                    </View>
                  }
                </View>
                <View style={{ flex: 1, justifyContent: "center" }}>
                  {this.state.perfilStatus === 'AGUARDANDO' ?
                    <View style={{ flexDirection: 'column', justifyContent: "center", alignItems: 'center' }}>
                      <Icon
                        name='clock'
                        type='feather'
                        color={colors.DEEPBLUE}
                        size={25}
                      />
                      <Text style={{ color: colors.BLACK, fontSize: 14, fontFamily: 'Inter-Bold', textAlign: 'center' }}>Aguardando aprovação</Text>
                    </View>
                    : null}

                  {this.state.perfilStatus === 'REENVIE' ?
                    <View style={{ flexDirection: 'column', justifyContent: "center", alignItems: 'center' }}>
                      <Icon
                        name='alert-circle'
                        type='feather'
                        color={colors.YELLOW.primary}
                        size={25}
                      />
                      <Text style={{ color: colors.BLACK, fontSize: 14, fontFamily: 'Inter-Bold', textAlign: 'center' }}>Favor, reenvie o documento</Text>
                    </View>
                    : null}

                  {this.state.perfilStatus === 'APROVADO' ?
                    <View style={{ flexDirection: 'column', justifyContent: "center", alignItems: 'center' }}>
                      <Icon
                        name='check-circle'
                        type='feather'
                        color={colors.GREEN.light}
                        size={25}
                      />
                      <Text style={{ color: colors.BLACK, fontSize: 14, fontFamily: 'Inter-Bold', textAlign: 'center' }}>Aprovado!</Text>
                    </View>
                    : null}

                </View>
              </View>
              {this.state.crlvStatus === 'REENVIE' || this.state.perfilStatus === 'REENVIE' || this.state.cnhStatus === 'REENVIE' ?
                <View style={{ height: 150, marginTop: 15, justifyContent: 'center' }}>
                  <Text style={{ color: colors.BLACK, fontSize: 14, fontFamily: 'Inter-Bold', textAlign: 'center', marginHorizontal: 15 }}>Alguns documentos não foram validados, favor reenvie novamente para a análise</Text>
                  <TouchableOpacity
                    onPress={() => this.checkDocs()}
                    style={{ justifyContent: 'center', alignItems: 'center', height: 60, marginHorizontal: 50, backgroundColor: colors.DEEPBLUE, borderRadius: 15, marginTop: 15 }}
                  >
                    <Text style={{ color: colors.WHITE, fontFamily: 'Inter-Bold', fontSize: 14 }}>Enviar</Text>
                  </TouchableOpacity>
                </View>
                :
                <View style={{ alignItems: 'center', marginTop: 10 }}>
                  <Text style={{ color: colors.BLACK, fontSize: 14, fontFamily: 'Inter-Bold' }}>Documentos sendo analisados, aguarde.</Text>
                </View>
              }

            </ScrollView>
          </View>

          :

          <View style={styles.camera}>
            <Camera style={{ flex: 1 }} type={this.state.isPerfil ? Camera.Constants.Type.front : Camera.Constants.Type.back} ratio='16:9' ref={ref => { this.camera = ref }} >
              <View
                style={{
                  flex: 1,
                  backgroundColor: 'transparent',
                }}>
              </View>
            </Camera>
            <TouchableOpacity style={{ flex: 1, position: 'absolute', bottom: 20, alignSelf: 'center', justifyContent: 'center', alignItems: 'center', backgroundColor: colors.GREY3, height: 65, width: 65, borderRadius: 100, elevation: 3, }}
              onPress={() => this.CapturePhoto()}
              disabled={this.state.isProgress}
            >
              <Icon
                name='ios-camera'
                type='ionicon'
                color={colors.BLACK}
                size={40}
              />
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 1, position: 'absolute', top: 40, right: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.GREY3, height: 40, width: 40, borderRadius: 100, elevation: 3, }}
              onPress={() => this.setState({ isCamera: false, isCrlv: false, isCnh: false, isPerfil: false, })}
              disabled={this.state.isProgress}
            >
              <Icon
                name='x'
                type='feather'
                color={colors.RED}
                size={30}
              />
            </TouchableOpacity>
          </View>
        }
      </View>
    )
  }
}

const styles = StyleSheet.create({
  mainView: {
    flex: 1,
    backgroundColor: colors.WHITE,
  },
  main: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  header: {
    backgroundColor: colors.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
    marginTop: Platform.select({ ios: 55, android: 45 })
  },
});