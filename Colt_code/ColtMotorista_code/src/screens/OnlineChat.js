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
  Platform,
  StatusBar
} from "react-native";
import { colors } from "../common/theme";
import * as Permissions from 'expo-permissions';
import { Icon, Header } from "react-native-elements";
import * as firebase from 'firebase'
import { Audio, AVPlaybackStatus } from 'expo-av';
import languageJSON from '../common/language';
var { height, width } = Dimensions.get('window');
import { RequestPushMsg } from '../common/RequestPushMsg';
import Constants from 'expo-constants';
import ProfileSVG from "../SVG/ProfileSVG";
import { withNavigation } from 'react-navigation';
import * as Animatable from 'react-native-animatable';

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
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
};

export default class OnlineChat extends Component {
  _isMounted = false;
  currentScreen
  getParamData;
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
      readed_rider: false,
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
    this._isMounted = true
    this.currentScreen = true
    this.checkPermissions()
    this.getParamData = this.props.navigation.getParam('passData');
    let bookingData = firebase.database().ref('bookings/' + this.getParamData.bookingId)
    bookingData.on('value', response => {
      if (response.val()) {
        if (this._isMounted) {
          this.setState({ carbookedInfo: response.val() })
        }
      }
    })
    let msgData = firebase.database().ref(`chat/` + this.getParamData.bookingId + '/message')
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
      this.listenerReaded();
      if (allMesseges.length > 0 && allMesseges[allMesseges.length - 1].source == 'rider') {
        this.setState({ showReaded: false })
        //console.log('ENTROU AQUI')
      }
      this.setState({ allChat: allMesseges.reverse() })
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
    if(this.sound && this.state.isloaded){
      this.sound.unloadAsync()
      console.log('STOP AUDIO')
    }
    if(this.state.timeTimeout != null){
      clearTimeout(this.state.timeTimeout)
    }
  }

  // NOVA FUNCÇÕES RECORDING AUDIO
  startRecording = async () => {
    if(this.state.statusPermi){
      this.recording = new Audio.Recording();
  
      if(this._isMounted){
        this.setState({ isRecording: true, isRecord: false });
      }
      // some of these are not applicable, but are required
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        playsInSilentModeIOS: false,
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

  stopRecording = async () => {
    this.setState({ isRecording: false, isRecord: true });
    try {
      if(this._isMounted){
        this.setState({ uri: this.recording.getURI() })
      }
      console.log(this.recording.getURI())
      await this.recording.stopAndUnloadAsync().then((result) => {
        if(this._isMounted){
          this.setState({ duration: result.durationMillis })
        }
      });
      console.log('PAROU A GRAVAÇÃO')
    } catch (error) {
    }
  }

  playSound(audio) {
    if (this.state.isPlaying === false) {
      console.log('TOCOU')
      const status = {
        shouldPlay: true
      };
      this.sound = new Audio.Sound();
      if(this._isMounted){
        this.setState({ isPlaying: true })
      }
      let duration = 0
      this.sound.loadAsync({ uri: audio }, status, false).then((result) => {
        duration = result.durationMillis;
        this.setState({ isloaded: result.isLoaded });
      }).then(() => {
        if(this._isMounted){
          this.setState({ timeTimeout: setTimeout(() => {this.setState({ isPlaying: false }), this.sound.stopAsync()}, duration) })
        }
      })
    } else {
      this.stopSound()
    }
  }
  
  stopSound() {
    if(this.state.timeTimeout != null){
      console.log('REMOVEU')
      clearTimeout(this.state.timeTimeout)
      this.sound.stopAsync();
      if(this._isMounted){
        this.setState({ isPlaying: false })
      }
    } 
  }

  checkPermissions = async () => {
    const { status } = await Permissions.askAsync(Permissions.AUDIO_RECORDING);
    if (status === 'granted') {
      if(this._isMounted){
        this.setState({ statusPermi: true })
      }
    }
  }

  listenerReaded() {
    let read = firebase.database().ref(`chat/` + this.getParamData.bookingId + '/readed_driver');
    read.on('value', readChat => {
      let readInfo = readChat.val()
      if (readInfo == false && this.currentScreen && this._isMounted) {
        firebase.database().ref(`chat/` + this.getParamData.bookingId + '/readed_driver').set(true)
      }
    })

    let readChat = firebase.database().ref(`chat/` + this.getParamData.bookingId + '/readed_rider');
    readChat.on('value', readChat => {
      let readInfo = readChat.val()
      if (readInfo) {
        this.setState({ readed_rider: readInfo })
      }
    })
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
        alert(languageJSON.upload_image_error);
      };
      let audioURI = this.recording.getURI()
      xhr.responseType = 'blob'; // use BlobModule's UriHandler
      xhr.open('GET', audioURI, true); // fetch the blob from uri in async mode
      xhr.send(null); // no initial data
    });

    if ((blob.size / 1000000) > 3) {
      this.setState({ loading: false }, () => { alert(languageJSON.image_size_error) })
    }
    else {
      var timestamp = new Date().getTime()
      var imageRef = firebase.storage().ref().child(`chat/audio/` + timestamp + `/`);
      return imageRef.put(blob).then(() => {
        blob.close()
        this.setState({ isRecord: false, isRecording: false })
        return imageRef.getDownloadURL()
      }).then((audioURL) => {
        this.verifyMessage(null, audioURL);
      }).catch(error => {
        console.log(error);
        alert('Ops, tivemos um problema.');
      });
    }
  }

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

  sendMessege(inputmessage, audioURL) {
    var today = new Date();
    var time = today.toLocaleTimeString('pt-BR').split(':')[0] + ':' + today.toLocaleTimeString('pt-BR').split(':')[1]
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();
    today = dd + '/' + mm + '/' + yyyy;

    let customer = this.state.carbookedInfo.customer;
    let driver = this.state.carbookedInfo.driver
    let totalId = this.state.carbookedInfo.customer + ',' + this.state.carbookedInfo.driver
    this.setState({ id: totalId })

    let chat = firebase.database().ref('chat')
    chat.once('value', chat => {
      if (chat.val()) {
        let allChat = chat.val();
        for (let key in allChat) {
          if (this.getParamData.bookingId == key) {
            this.setState({ chat: true })
          }
        }
        if (this.state.chat == true) {
          firebase.database().ref('chat' + '/' + this.getParamData.bookingId + '/' + 'message' + '/' + this.state.id).push({
            message: inputmessage ? inputmessage : null,
            audio: audioURL ? audioURL : null,
            from: this.state.carbookedInfo.driver,
            type: "msg",
            msgDate: today,
            msgTime: time,
            source: "driver"
          }).then(() => {
            this.setState({ readed_rider: false, showReaded: true, loading: false })
            firebase.database().ref(`chat/` + this.getParamData.bookingId + '/').update({
              readed_rider: false
            })
          })
          inputmessage === null ?
          this.sendPushNotification(this.state.carbookedInfo.customer, this.state.carbookedInfo.driver_firstName + ' enviou um áudio')
          :
          this.sendPushNotification(this.state.carbookedInfo.customer, this.state.carbookedInfo.driver_firstName + ': ' + inputmessage)
        }
        else {
          firebase.database().ref('chat' + '/' + this.getParamData.bookingId + '/').update({
            distance: this.state.carbookedInfo.distance,
            car: this.state.carbookedInfo.carType,
            bookingId: this.getParamData.bookingId,
            readed_rider: false,
          }).then(() => {
            firebase.database().ref('chat' + '/' + this.getParamData.bookingId + '/' + 'message' + '/' + this.state.id).push({
              message: inputmessage ? inputmessage : null,
              audio: audioURL ? audioURL : null,
              from: this.state.carbookedInfo.driver,
              type: "msg",
              msgDate: today,
              msgTime: time,
              source: "driver"
            })
            this.setState({ readed_rider: false, showReaded: true, loading: false })
            inputmessage === null ?
            this.sendPushNotification(this.state.carbookedInfo.customer, this.state.carbookedInfo.driver_firstName + ' enviou um áudio')
            :
            this.sendPushNotification(this.state.carbookedInfo.customer, this.state.carbookedInfo.driver_firstName + ': ' + inputmessage)
          })
        }
      } else {
        firebase.database().ref('chat' + '/' + this.getParamData.bookingId + '/').update({
          distance: this.state.carbookedInfo.distance,
          car: this.state.carbookedInfo.carType,
          bookingId: this.getParamData.bookingId,
          readed_rider: false,
        }).then(() => {
          if (this.state.id) {
            firebase.database().ref('chat' + '/' + this.getParamData.bookingId + '/' + 'message' + '/' + this.state.id).push({
              message: inputmessage ? inputmessage : null,
              audio: audioURL ? audioURL : null,
              from: this.state.carbookedInfo.driver,
              type: "msg",
              msgDate: today,
              msgTime: time,
              source: "driver"
            })
            this.setState({ readed_rider: false, showReaded: true, loading: false })
            inputmessage === null ?
            this.sendPushNotification(this.state.carbookedInfo.customer, this.state.carbookedInfo.driver_firstName + ' enviou um áudio')
            :
            this.sendPushNotification(this.state.carbookedInfo.customer, this.state.carbookedInfo.driver_firstName + ': ' + inputmessage)
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

  render() {
    return (
      <View style={styles.container}>
      <StatusBar barStyle='dark-content' translucent backgroundColor={colors.TRANSPARENT}/>
        <View style={styles.viewHeader}>
          <View style={styles.bordaIconeVoltar}>
            <TouchableOpacity onPress={() => { this.currentScreen = false, this.props.navigation.goBack() }}>
              <Icon
                name='chevron-left'
                type='MaterialIcons'
                size={width < 375 ? 35 : 40}
              />
            </TouchableOpacity>
          </View>
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: 'Inter-Bold', fontSize: 20, }}> {this.state.carbookedInfo.firstNameRider}</Text>
          </View>
          <View style={{ backgroundColor: colors.BLACK, width: 42, justifyContent: 'center', alignItems: 'center', height: 42, bottom: 5, position: 'absolute', right: 20, borderRadius: 100 }}>
            {this.state.carbookedInfo.imageRider ?
              <Image
                source={{ uri: this.state.carbookedInfo.imageRider }}
                style={{ width: 40, height: 40, borderRadius: 50, }}
              />
              :
              <ProfileSVG
                width={40}
                height={40}
              />
            }
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <FlatList
            data={this.state.allChat}
            inverted
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item, index }) => {
              return (
                item.source == "driver" ?
                  <View style={styles.drivermsgStyle}>
                    <Text style={styles.msgTextStyle}>{item ? item.message : languageJSON.chat_history_not_found}</Text>
                    {item.audio ?
                      <View style={styles.msgTextStyle2}>
                        <View>
                          <TouchableOpacity
                          onPress={() => this.playSound(item.audio)}
                          disable={this.state.isPlaying}
                          style={{ height: 40, width: 40,backgroundColor: colors.WHITE, elevation: 4, borderRadius: 50, justifyContent:'center', alignItems: 'center' }}
                          >
                            <Icon
                              name='ios-play'
                              type='ionicon'
                              color={colors.DEEPBLUE}
                              size={35}
                            />
                          </TouchableOpacity>
                        </View>
                        <View style={{ height: 30, width: 85, justifyContent: 'center' }}></View>
                      </View>
                      : null}
                    <Text style={styles.msgTimeStyle}>{item ? item.msgTime : null}</Text>
                  </View>
                  :
                  <View style={styles.riderMsgStyle}>
                    <Text style={styles.riderMsgText}>{item ? item.message : languageJSON.chat_history_not_found}</Text>
                    {item.audio ?
                      <View style={styles.riderMsgText2}>
                        <View>
                          <TouchableOpacity
                          onPress={() => this.playSound(item.audio)}
                          disable={this.state.isPlaying}
                          style={{ height: 40, width: 40,backgroundColor: colors.WHITE, elevation: 4, borderRadius: 50, justifyContent:'center', alignItems: 'center' }}
                          >
                            <Icon
                              name='ios-play'
                              type='ionicon'
                              color={colors.DEEPBLUE}
                              size={35}
                            />
                          </TouchableOpacity>
                        </View>
                        <View style={{ height: 30, width: 85, justifyContent: 'center' }}></View>
                      </View>
                      : null}
                    <Text style={styles.riderMsgTime}>{item ? item.msgTime : null}</Text>
                  </View>
              );
            }}
          />
        </View>
        {this.state.allChat.length > 0 && this.state.showReaded ?
          (this.state.readed_rider ?
            <View style={{ flexDirection: 'row', alignSelf: 'flex-end' }}>
              <Text style={{ color: colors.GREY2, textAlign: 'right', marginRight: 10, fontFamily: 'Inter-Regular', fontSize: 13 }}>Lida</Text>
              <View style={{ height: 20, height: 20, alignSelf: 'flex-end', marginRight: 10 }}>
                <Icon
                  name='check-circle'
                  type='feather'
                  color={colors.DEEPBLUE}
                  size={20}
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
                placeholder='Converse com o passageiro...'
                onChangeText={text => this.setState({ inputmessage: text })}
              />
              : null}

            {this.state.isRecord ?
              <Text style={styles.input2}>Áudio gravado!</Text>
              :
              null}
            {this.state.isRecord == false && this.state.isRecording ?
              <Animatable.Text animation='flash' iterationCount="infinite" useNativeDriver={true} style={styles.input2}>Gravando áudio ...</Animatable.Text>
              : null}

            {!this.state.isRecord ?
              <TouchableOpacity style={{ justifyContent: 'center', alignItems: 'center', top: 5, right: 30, borderWidth: 2, borderColor: colors.GREEN.light, width: 45, height: 45, borderRadius: 50 }} onPressIn={() => this.startRecording()} onPressOut={() => this.stopRecording()}>
                <Icon
                  name='ios-mic'
                  type='ionicon'
                  color={colors.GREEN.light}
                  size={25}
                />
              </TouchableOpacity>
              :
              <TouchableOpacity style={{ justifyContent: 'center', alignItems: 'center', top: 5, right: 30, backgroundColor: colors.WHITE, borderWidth: 1, borderColor: colors.BLACK, width: 45, height: 45, borderRadius: 50 }} onPressIn={() => this.setState({ isRecording: false })} onPressOut={() => this.setState({ isRecord: false })}>
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

            {/*
            <TouchableOpacity style={{ justifyContent: 'center', alignItems: 'center', top: 5, right: 10, backgroundColor: colors.DEEPBLUE, width: 40, height: 40, borderRadius: 50 }} onPress={() => this.sendMessege(this.state.inputmessage)}>
              <Icon
                name='ios-paper-plane'
                type='ionicon'
                color={colors.WHITE}
                size={25}
                containerStyle={{ paddingEnd: 3 }}
              />
            </TouchableOpacity>*/}

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
    marginTop: Constants.statusBarHeight + 3,
    height: Platform.OS == 'ios' ? 100 : 60,
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
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderTopWidth: 3,
    borderTopColor: colors.GREY1,
    borderColor: colors.GREY.background,
  },
  input: {
    marginEnd: 50,
    marginLeft: 10,
    height: 50,
    fontSize: 18,
    flex: 1,
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
    borderBottomLeftRadius: 30,
    borderTopLeftRadius: 30,
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
    margin: 5,
    backgroundColor: colors.GREY3,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 15,
    borderTopRightRadius: 15,
    borderTopLeftRadius: 50,
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
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
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
  riderMsgTime: {
    paddingHorizontal: 15,
    paddingBottom: 4,
    fontFamily: 'Inter-Medium',
    textAlign: "left",
    fontSize: 12,
    color: colors.DEEPBLUE,
  }
});