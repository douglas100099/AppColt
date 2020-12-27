import React, { Component } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Dimensions,
  Image,
  Keyboard,
  TextInput,
  TouchableWithoutFeedback,
  Platform
} from "react-native";
import { colors } from "../common/theme";
import { Icon, Header } from "react-native-elements";
import * as firebase from 'firebase'
import { Audio, AVPlaybackStatus } from 'expo-av';
import languageJSON from '../common/language';
var { height, width } = Dimensions.get('window');
import * as Permissions from 'expo-permissions';
import { RequestPushMsg } from '../common/RequestPushMsg';
import AvatarUser from "../../assets/svg/AvatarUser";
import * as Animatable from 'react-native-animatable';

// DOUG PASSOU POR AQUI NA SURDINA
const recordingOptions = {
  // android not currently in use. Not getting results from speech to text with .m4a
  // but parameters are required
  android: {
    extension: '.m4a',
    outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
    audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
  },
  ios: {
    extension: '.wav',
    audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    playsInSilentModeIOS: true,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
};

export default class OnlineChat extends Component {
  getParamData;
  currentScreen
  _isMounted = false;
  constructor(props) {
    super(props);
    this.state = {
      search: "",
      text: "",
      data: "",
      tempData: [],
      persons: [],
      messages: [],
      driverName: "",
      inputmessage: "",
      messegeData: [],
      user: "",
      flag: false,
      position: 'absolute',
      paddingHeight: 0,
      messageCntHeight: height - 150,
      carbookedInfo: "",
      id: "",
      chat: false,
      allChat: [],
      messegesData: [],
      showReaded: true,
      isRecording: false,
      isRecord: false,
      uri: null,
      isPlaying: false,
      duration: 0,
      timeTimeout: null,
      isloaded: false,
    };
  }


  componentDidMount() {
    this._isMounted = true;
    this.currentScreen = true
    this.checkPermissions() // DOOUG PASSOU AQUI
    this.getParamData = this.props.navigation.getParam('passData');
    let firstName = this.props.navigation.getParam('firstNameRider');
    this.listenerReaded()

    let bookingData = firebase.database().ref('bookings/' + this.getParamData.bokkingId)
    bookingData.on('value', response => {
      if (response.val()) {
        this.setState({ carbookedInfo: response.val(), firstNameRider: firstName })
      }
    })
    let msgData = firebase.database().ref(`chat/` + this.getParamData.bokkingId + '/message')
    msgData.on('value', msgData => {
      let rootEntry = msgData.val();
      let allMesseges = []
      for (let key in rootEntry) {
        let entryKey = rootEntry[key]
        for (let msgKey in entryKey) {
          entryKey[msgKey].smsId = msgKey
          allMesseges.push(entryKey[msgKey])
        }

      }
      if (allMesseges.length > 0 && allMesseges[allMesseges.length - 1].source == 'driver') {
        this.setState({ showReaded: false })
      }
      this.setState({ allChat: allMesseges.reverse() }) // DOOUG ARRUMOU AQUI OH .REVERSE
    })

    this.keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      this._keyboardDidShow,
    );
    this.keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      this._keyboardDidHide,
    );
  }


  componentWillUnmount() {
    this._isMounted = false;
    this.keyboardDidShowListener.remove();
    this.keyboardDidHideListener.remove();
    // DOOUG LARGOU UM PIN CASH ONGUEIME
    if (this.sound && this.state.isloaded) {
      this.sound.unloadAsync()
      console.log('STOP AUDIO')
    }
    if (this.state.timeTimeout != null) {
      clearTimeout(this.state.timeTimeout)
    }
  }

  // NOVA FUNCÇÕES RECORDING AUDIO
  // LARGARAM AI OH
  // AQUI SE O CARA APERTAR CHAMA ESSA FUNÇÃO PARA PREPARAR E INICIAR A GRAVAÇÃO COM O DEDO APERTADO E CLARO
  startRecording = async () => {
    if (this.state.statusPermi) {
      this.recording = new Audio.Recording();

      if (this._isMounted) {
        this.setState({ isRecording: true, isRecord: false });
      }
      // some of these are not applicable, but are required
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        playThroughEarpieceAndroid: false,
      });
      try {
        await this.recording.prepareToRecordAsync(recordingOptions);
        await this.recording.startAsync();
        console.log('ESTÁ GRAVANDO')
      } catch (error) {
        console.log(error);
        this.stopRecording();
      }
    }
  }

  // DOOUG
  // AQUI QUANDO O CARA SOLTA O BOTÃO, ELE STOPA E TIRA DA MEMORIA SALVANDO O URI DAQUELE RECORDING
  stopRecording = async () => {
    this.setState({ isRecording: false, isRecord: true });
    try {
      if (this._isMounted) {
        this.setState({ uri: this.recording.getURI() })
      }
      console.log(this.recording.getURI())
      await this.recording.stopAndUnloadAsync().then((result) => {
        if (this._isMounted) {

          this.setState({ duration: result.durationMillis })
        }
      });
      console.log('PAROU A GRAVAÇÃO')
    } catch (error) {
    }
  }

  //DOOUG
  // AQUI TOCA O SOM DO AUDIO GRAVADO
  // TIMOUT FEITO PARA PEGAR A DURAÇÃO E PARAR O SOM AUTOMATICAMENTE QUANDO ACABAR
  playSound(audio) {
    if (this.state.isPlaying === false) {
      const status = {
        shouldPlay: true
      };
      this.sound = new Audio.Sound();
      if (this._isMounted) {
        this.setState({ isPlaying: true })
      }
      let duration = 0

      this.sound.loadAsync({ uri: audio }, status, false).then((result) => {
        duration = result.durationMillis;
        this.setState({ isloaded: result.isLoaded });
      }).then(() => {
        if (this._isMounted) {
          this.setState({ timeTimeout: setTimeout(() => { this.setState({ isPlaying: false }), this.sound.stopAsync() }, duration) })
        }
      })
    } else {
      this.stopSound()
    }
  }

  // DOOUG
  // AQUI STOP O SOM DO QUANDO FOR PLAY, UTILIZEI TIMEOUT PARA VER SE O DE CIMA ESTA EM PLAY MSM
  stopSound() {
    if (this.state.timeTimeout != null) {
      console.log('REMOVEU')
      clearTimeout(this.state.timeTimeout)
      this.sound.stopAsync();
      if (this._isMounted) {
        this.setState({ isPlaying: false })
      }
    }
  }

  //FUNÇÃO DOOUG LARGOU AI
  // CHECA AS PERMI PRA MANDAR AUDIO
  checkPermissions = async () => {
    const { status } = await Permissions.askAsync(Permissions.AUDIO_RECORDING);
    if (status === 'granted') {
      if (this._isMounted) {
        this.setState({ statusPermi: true })
      }
    }
  }

  // DOOUG
  // AQUI CONVERTE O AUDIO CACHED PARA O FIREBASE
  async convertAudioDB() {
    this.setState({ loading: true })
    const blob = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function () {
        resolve(xhr.response); // when BlobModule finishes reading, resolve with the blob
      };
      xhr.onerror = function () {
        reject(new TypeError('Erro na conversão do áudio'));
        //this.setState({ loading: false });
        alert("ERROR 1");
      };
      let audioURI = this.recording.getURI()
      xhr.responseType = 'blob'; // use BlobModule's UriHandler
      xhr.open('GET', audioURI, true); // fetch the blob from uri in async mode
      xhr.send(null); // no initial data
    });

    if ((blob.size / 1000000) > 3) {
      this.setState({ loading: false }, () => { alert("ERROR 2") })
    }
    else {
      var timestamp = new Date().getTime()
      var audioRef = firebase.storage().ref().child(`chat/audio/` + timestamp + `/`);
      return audioRef.put(blob).then(() => {
        blob.close()
        this.setState({ isRecord: false, isRecording: false })
        return audioRef.getDownloadURL()
      }).then((audioURL) => {
        this.verifyMessage(null, audioURL);
      }).catch(error => {
        console.log(error);
        alert('Ops, tivemos um problema.');
      });
    }
  }

  // YURI
  // AQUI VC QUE FEZ MSM FODA-SE
  // SO QUE TAVA ERRADO AINDA MEU DEV AI O MOTORISTA CONTROLOU A EMBREAGEM E NÃO MORREU MAIS
  verifyMessage(inputmessage, audio) {
    if (inputmessage == '' || inputmessage == undefined || inputmessage == null) {
      if (audio != undefined || audio != null) {
        this.sendMessege(null, audio)
        console.log('POSSUI AUDIO E NÃO MSG')
      } else {
        alert("Por favor, digite algo...");
      }
    } else {
      this.sendMessege(inputmessage, null)
      console.log('POSSUI MSG E NÃO ADUDIO')
    }
  }

  _keyboardDidShow = (e) => {
    if (this.state.position !== 'relative') {
      this.setState({
        position: 'relative', paddingHeight: e.endCoordinates.height
      }, () => {

      })
    }
  }

  _keyboardDidHide = (e) => {
    if (this.state.position !== 'absolute') {
      this.setState({
        position: 'absolute', paddingHeight: 0
      }, () => {
      })
    }
  }

  listenerReaded() {
    let read = firebase.database().ref(`chat/` + this.getParamData.bokkingId + '/readed_rider');
    read.on('value', readChat => {
      let readInfo = readChat.val()
      if (readInfo == false && this.currentScreen && this._isMounted) {

        firebase.database().ref(`chat/` + this.getParamData.bokkingId + '/readed_rider').set(true)
      }
    })

    let readChat = firebase.database().ref(`chat/` + this.getParamData.bokkingId + '/readed_driver');
    readChat.on('value', readChat => {
      let readInfo = readChat.val()
      if (readInfo) {
        this.setState({ readed_driver: readInfo })
      }
    })
  }

  // DOOUG
  // FIZ ALTERAÇÕES AQUI RECEBENDO UM SEGUNDO PARAMS, QUE NO CASO E O AUDIO NE CLARO COM CERTEZA
  sendMessege(inputmessage, audioURL) {
    var today = new Date();
    var time = today.toLocaleTimeString('pt-BR').split(':')[0] + ':' + today.toLocaleTimeString('pt-BR').split(':')[1];
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();
    today = dd + '/' + mm + '/' + yyyy;

    let totalId = this.state.carbookedInfo.customer + ',' + this.state.carbookedInfo.driver
    this.setState({ id: totalId })

    let chat = firebase.database().ref('chat')
    chat.once('value', chat => {
      if (chat.val()) {
        let allChat = chat.val();
        for (let key in allChat) {
          if (this.getParamData.bokkingId == key) {
            this.setState({ chat: true })
          }
        }
        if (this.state.chat == true) {
          firebase.database().ref('chat' + '/' + this.getParamData.bokkingId + '/' + 'message' + '/' + this.state.id).push({
            message: inputmessage ? inputmessage : null,
            audio: audioURL ? audioURL : null,
            from: this.state.carbookedInfo.customer,
            type: "msg",
            msgDate: today,
            msgTime: time,
            source: "rider"
          }).then(() => {
            this.setState({ readed_driver: false, showReaded: true })
            firebase.database().ref(`chat/` + this.getParamData.bokkingId + '/').update({
              readed_driver: false,
              notify_driver: false
            })
          })
          audioURL ?
            this.sendPushNotification(this.state.carbookedInfo.driver, this.state.firstNameRider + ' enviou um áudio')
            :
            this.sendPushNotification(this.state.carbookedInfo.driver, this.state.firstNameRider + ': ' + inputmessage)
        }
        else {
          firebase.database().ref('chat' + '/' + this.getParamData.bokkingId + '/').update({
            distance: this.state.carbookedInfo.distance,
            car: this.state.carbookedInfo.carType,
            bookingId: this.getParamData.bokkingId,
            readed_driver: false,
            notify_driver: false
          }).then(() => {
            firebase.database().ref('chat' + '/' + this.getParamData.bokkingId + '/' + 'message' + '/' + this.state.id).push({
              message: inputmessage ? inputmessage : null,
              audio: audioURL ? audioURL : null,
              from: this.state.carbookedInfo.customer,
              type: "msg",
              msgDate: today,
              msgTime: time,
              source: "rider"
            })
            this.setState({ readed_driver: false, showReaded: true })
            audioURL ?
              this.sendPushNotification(this.state.carbookedInfo.driver, this.state.firstNameRider + ' enviou um áudio')
              :
              this.sendPushNotification(this.state.carbookedInfo.driver, this.state.firstNameRider + ': ' + inputmessage)
          })
        }
      } else {
        firebase.database().ref('chat' + '/' + this.getParamData.bokkingId + '/').update({
          distance: this.state.carbookedInfo.distance,
          car: this.state.carbookedInfo.carType,
          bookingId: this.getParamData.bokkingId,
          readed_driver: false,
          notify_driver: false
        }).then(() => {
          if (this.state.id) {
            firebase.database().ref('chat' + '/' + this.getParamData.bokkingId + '/' + 'message' + '/' + this.state.id).push({
              message: inputmessage ? inputmessage : null,
              audio: audioURL ? audioURL : null,
              from: this.state.carbookedInfo.customer,
              type: "msg",
              msgDate: today,
              msgTime: time,
              source: "rider"
            })
            this.setState({ readed_driver: false, showReaded: true })
            audioURL ?
              this.sendPushNotification(this.state.carbookedInfo.driver, this.state.firstNameRider + ' enviou um áudio')
              :
              this.sendPushNotification(this.state.carbookedInfo.driver, this.state.firstNameRider + ': ' + inputmessage)
          }
        })
      }
    })
    this.setState({ inputmessage: "" });
  }

  sendPushNotification(customerUID, msg) {
    const customerRoot = firebase.database().ref('users/' + customerUID);
    customerRoot.once('value', customerData => {
      if (customerData.val()) {
        let allData = customerData.val()
        RequestPushMsg(allData.pushToken ? allData.pushToken : null, msg)
      }
    })
  }

  // O PROBLEMA DE DAR UNDEFINED LA FOI O QUE TE FALEI, O RENDER PRECISA ESTA NA JSX DEIXEI ESSA FUNÇÃO SO
  // PARA TE MOSTRAR QUE OS INDIAS ESQUECEU DE CANTAR SIRIGAITA PRA NAGA SUBIR
  renderItem({ item, index }) {

  }

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.viewHeader}>
          <View style={styles.bordaIconeVoltar}>
            <TouchableOpacity onPress={() => {
              this.currentScreen = false,
                console.log(this.currentScreen)
              this.props.navigation.goBack()
            }}>
              <Icon
                name='chevron-left'
                type='MaterialIcons'
                size={width < 375 ? 35 : 40}
              />
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'column', alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Inter-Bold', fontSize: 20, }}> {this.state.carbookedInfo.driver_firstName}</Text>
            <Text style={{ fontFamily: 'Inter-Medium', color: colors.GREY2, fontSize: width < 375 ? 14 : 16, marginBottom: 10 }}> {this.state.carbookedInfo.vehicle_number}</Text>
          </View>
          <View style={{ backgroundColor: colors.BLACK, width: 53, justifyContent: 'center', alignItems: 'center', height: 53, position: 'absolute', bottom: 5, right: 10, borderRadius: 100 }}>
            {this.state.carbookedInfo.driver_image ?
              <Image
                source={{ uri: this.state.carbookedInfo.driver_image }}
                style={{ width: 50, height: 50, borderRadius: 50, }}
              />
              :
              <AvatarUser
                width={50}
                height={50}
              />
            }
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <FlatList
            data={this.state.allChat} // RETIREI O REVERSE DAQUI ELE ESTA LA EM CIMA CE VIU ? RESOLVE O PROBLEMA DA FLAT LIST CHEIO DE DROGA
            inverted
            keyExtractor={(item, index) => index.toString()} // VOLTAMOS COM O KEYEXTRACTOR
            // O QUE ESTÁ EM BAIXO E O NOVO RENDER ITEM ARRUMADO INCLUSIVE ELE PRECISA FICAR AQUI
            renderItem={({ item, index }) => {
              return (
                item.source == "rider" ?
                  <View style={styles.drivermsgStyle}>
                    {item.audio ?
                      <View style={styles.msgTextStyle2}>
                        <View style={{ paddingTop: 10, paddingLeft: 10, flexDirection: 'row', alignItems: 'center' }}>
                          <TouchableOpacity
                            onPress={() => this.playSound(item.audio)}
                            disable={this.state.isPlaying}
                            style={{ height: 40, width: 40, backgroundColor: colors.WHITE, elevation: 4, borderRadius: 50, justifyContent: 'center', alignItems: 'center' }}
                          >
                            <Icon
                              name='ios-play'
                              type='ionicon'
                              color={colors.DEEPBLUE}
                              size={35}
                            />
                          </TouchableOpacity>
                          <View style={{ height: 10, backgroundColor: colors.WHITE, width: 80, left: -5, }} />
                        </View>
                      </View>
                      :
                      <Text style={styles.msgTextStyle}>{item ? item.message : languageJSON.chat_not_found}</Text>
                    }
                    <Text style={styles.msgTimeStyle}>{item ? item.msgTime : null}</Text>
                  </View>
                  :
                  <View style={styles.riderMsgStyle}>
                    {item.audio ?
                      <View style={styles.riderMsgText2}>
                        <View>
                          <TouchableOpacity
                            onPress={() => this.playSound(item.audio)}
                            disable={this.state.isPlaying}
                            style={{ height: 40, width: 40, backgroundColor: colors.DEEPBLUE, elevation: 4, borderRadius: 50, justifyContent: 'center', alignItems: 'center' }}
                          >
                            <Icon
                              name='ios-play'
                              type='ionicon'
                              color={colors.WHITE}
                              size={35}
                            />
                          </TouchableOpacity>
                        </View>
                        <View style={{ height: 30, width: 85, justifyContent: 'center' }}></View>
                      </View>
                      :
                      <Text style={styles.riderMsgText}>{item ? item.message : languageJSON.chat_not_found}</Text>
                    }
                    <Text style={styles.riderMsgTime}>{item ? item.msgTime : null}</Text>
                  </View>
              );
            }}
          />
        </View>

        {this.state.allChat.length > 0 && this.state.showReaded ?
          (this.state.readed_driver ?
            <View style={{ flexDirection: 'row', alignSelf: 'flex-end', alignItems: 'center' }}>
              <Text style={{ color: colors.GREY2, marginRight: 5, fontFamily: 'Inter-Regular', fontSize: 13 }}>Lida</Text>
              <View style={{ height: 20, height: 20, marginRight: 10 }}>
                <Icon
                  name='check-circle'
                  type='feather'
                  color={colors.DEEPBLUE}
                  size={15}
                />
              </View>
            </View>
            :
            <View style={{ flexDirection: 'row', alignSelf: 'flex-end' }}>
              <Text style={{ color: colors.GREY2, textAlign: 'right', marginRight: 10, fontFamily: 'Inter-Regular', fontSize: 13 }}>Não lida</Text>
              <View style={{ height: 20, height: 20, alignSelf: 'flex-end', marginRight: 10 }}>
                <Icon
                  name='check'
                  type='feather'
                  color={colors.GREY2}
                  size={20}
                />
              </View>
            </View>
          )
          : null}

        <KeyboardAvoidingView behavior={Platform.OS == 'ios' ? 'padding' : 'height'}>
          <View style={styles.footer}>
            {!this.state.isRecording && this.state.isRecord === false ?
              <TextInput
                value={this.state.inputmessage}
                style={styles.input}
                autoFocus={false}
                underlineColorAndroid="transparent"
                placeholder={languageJSON.chat_input_title}
                onChangeText={text => this.setState({ inputmessage: text })}
              />
              : null}

            {this.state.isRecord ?
              <Text style={styles.input2}>Áudio gravado!</Text>
              :
              null}
            {this.state.isRecord == false && this.state.isRecording ?
              <Animatable.Text animation='flash' iterationCount="infinite" useNativeDriver={true} style={styles.input2}>Gravando audio ...</Animatable.Text>
              : null}

            {!this.state.isRecord ?
              <TouchableOpacity style={{ justifyContent: 'center', alignItems: 'center', top: 5, right: 20, width: 45, height: 45, }} onPressIn={() => this.startRecording()} onPressOut={() => this.stopRecording()}>
                <Icon
                  name='ios-mic'
                  type='ionicon'
                  color={colors.DARK}
                  size={35}
                />
              </TouchableOpacity>
              :
              <TouchableOpacity style={{ justifyContent: 'center', alignItems: 'center', top: 5, right: 30, backgroundColor: colors.WHITE, borderWidth: 1, borderColor: colors.RED, width: 45, height: 45, borderRadius: 50 }} onPressIn={() => this.setState({ isRecording: false })} onPressOut={() => this.setState({ isRecord: false })}>
                <Icon
                  name='ios-trash'
                  type='ionicon'
                  color={colors.RED}
                  size={25}
                />
              </TouchableOpacity>}

            {!this.state.isRecording && !this.state.isRecord ?
              <TouchableOpacity style={{ justifyContent: 'center', alignItems: 'center', top: 5, right: 10, backgroundColor: colors.DEEPBLUE, width: 45, height: 45, borderRadius: 50 }} disabled={this.state.loading} onPress={() => this.verifyMessage(this.state.inputmessage, null)}>
                <Icon
                  name='ios-paper-plane'
                  type='ionicon'
                  color={colors.WHITE}
                  size={25}
                  containerStyle={{ paddingEnd: 3 }}
                />
              </TouchableOpacity>
              :
              <TouchableOpacity style={{ justifyContent: 'center', alignItems: 'center', top: 5, right: 10, backgroundColor: colors.DEEPBLUE, width: 45, height: 45, borderRadius: 50 }} disabled={this.state.loading} onPress={() => this.convertAudioDB()}>
                <Icon
                  name='ios-checkmark'
                  type='ionicon'
                  color={colors.WHITE}
                  size={45}
                />
              </TouchableOpacity>
            }

          </View>
        </KeyboardAvoidingView>
      </View>
    );
  }
}

//Screen Styling
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.WHITE,
    //marginTop: StatusBar.currentHeight,
  },
  viewHeader: {
    backgroundColor: colors.WHITE,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: Platform.OS == 'ios' ? 100 : 85,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { x: 0, y: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  bordaIconeVoltar: {
    position: 'absolute',
    backgroundColor: colors.WHITE,
    width: width < 375 ? 35 : 40,
    height: width < 375 ? 35 : 40,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    bottom: 10,
    left: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { x: 0, y: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  container1: {
    height: height - 150
  },
  container2: {
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth
  },
  backIconStyle: {
    alignSelf: 'flex-start',
    marginLeft: 20
  },
  contentContainerStyle: {
    flexGrow: 1
  },
  headerTitleStyle: {
    color: colors.WHITE,
    fontSize: 17,
    textAlign: 'center',
  },
  headerStyle: {
    backgroundColor: colors.GREY.default,
    borderBottomWidth: 0
  },
  input2: {
    //marginEnd: 50,
    marginLeft: 10,
    //height: 50,
    fontSize: 16,
    color: colors.BLACK,
    justifyContent: 'center',
    fontFamily: 'Inter-Medium',
    flex: 1,
  },

  inrContStyle: {
    marginLeft: 10,
    marginRight: 10
  },
  row: {
    flexDirection: 'row',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  avatar: {
    borderRadius: 20,
    width: 40,
    height: 40,
    marginRight: 10
  },
  rowText: {
    flex: 1
  },
  message: {
    fontSize: 18
  },
  sender: {
    fontWeight: 'bold',
    paddingRight: 10
  },
  footer: {
    flexDirection: 'row',
    backgroundColor: colors.WHITE,
    marginBottom: 20,
    height: 50,
    alignItems: 'center',
    borderTopWidth: 4,
    borderColor: colors.GREY.background,
  },
  input: {
    marginEnd: 20,
    marginLeft: 10,
    height: 50,
    fontSize: 18,
    flex: 1
  },
  send: {
    alignSelf: 'center',
    color: 'lightseagreen',
    fontSize: 16,
    fontWeight: 'bold',
    padding: 20
  },
  drivermsgStyle: {
    backgroundColor: colors.DEEPBLUE,
    marginBottom: 5,
    marginTop: 10,
    marginRight: 10,
    borderBottomLeftRadius: 10,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 15,
    maxWidth: width - 20,

    alignSelf: 'flex-end',
    flex: 1,
    elevation: 3,
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowColor: "#fff",
    shadowOffset: { height: 1, width: 0 },
  },
  msgTextStyle: {
    paddingTop: 4,
    paddingHorizontal: 15,
    textAlign: "right",
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: "#fff"
  },

  msgTextStyle2: {
    justifyContent: 'center',
    flexDirection: 'row',

    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    borderTopRightRadius: 10,
    borderTopLeftRadius: 0,
  },

  msgTimeStyle: {
    paddingHorizontal: 15,
    paddingBottom: 4,
    textAlign: "right",
    fontFamily: 'Inter-Medium',

    fontSize: 12,
    color: "#fff"
  },
  riderMsgStyle: {
    backgroundColor: colors.WHITE,
    marginBottom: 5,
    marginTop: 5,
    marginLeft: 10,
    flex: 1,
    alignSelf: 'flex-start',

    maxWidth: width - 20,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 10,
    elevation: 3,
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowColor: colors.GREY.Deep_Nobel,
    shadowOffset: { height: 1, width: 0 },
  },
  riderMsgText: {
    paddingTop: 4,
    paddingHorizontal: 15,
    textAlign: "left",
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: colors.DEEPBLUE,
  },
  riderMsgText2: {
    justifyContent: 'center',
    flexDirection: 'row',
    margin: 5,
    backgroundColor: colors.DEEPBLUE,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 15,
    borderTopRightRadius: 15,
    borderTopLeftRadius: 50,
  },
  riderMsgTime: {
    paddingHorizontal: 15,
    paddingBottom: 4,
    fontFamily: 'Inter-Medium',
    textAlign: "left",
    fontSize: 12,
    color: colors.DEEPBLUE,
  }
});
