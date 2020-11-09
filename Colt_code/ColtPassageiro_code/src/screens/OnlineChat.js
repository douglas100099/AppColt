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
import languageJSON from '../common/language';
var { height, width } = Dimensions.get('window');
import { RequestPushMsg } from '../common/RequestPushMsg';
import AvatarUser from "../../assets/svg/AvatarUser";
export default class OnlineChat extends Component {
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
      messegesData: []

    };
  }


  componentDidMount() {
    this.getParamData = this.props.navigation.getParam('passData');
    let firstName = this.props.navigation.getParam('firstNameRider');
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
      this.setState({ allChat: allMesseges })
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
    this.keyboardDidShowListener.remove();
    this.keyboardDidHideListener.remove();
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

  sendMessege(inputmessage) {
    var today = new Date();
    var time = today.toLocaleTimeString('pt-BR').split(':')[0] + ':' + today.toLocaleTimeString('pt-BR').split(':')[1];
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();
    today = mm + ':' + dd + ':' + yyyy;

    let customer = this.state.carbookedInfo.customer;
    let driver = this.state.carbookedInfo.driver
    let totalId = this.state.carbookedInfo.customer + ',' + this.state.carbookedInfo.driver
    this.setState({ id: totalId })

    if (inputmessage == '' || inputmessage == undefined || inputmessage == null) {
      alert("Por favor, digite algo...");
    } else {
      let chat = firebase.database().ref('chat')
      // if(chat){
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
              message: inputmessage,
              from: this.state.carbookedInfo.customer,
              type: "msg",
              msgDate: today,
              msgTime: time,
              source: "rider"
            })
            this.sendPushNotification(this.state.carbookedInfo.driver, this.state.firstNameRider + ': ' + inputmessage)
          }
          else {
            firebase.database().ref('chat' + '/' + this.getParamData.bokkingId + '/').update({
              distance: this.state.carbookedInfo.distance,
              car: this.state.carbookedInfo.carType,
              bookingId: this.getParamData.bokkingId
            }).then(() => {
              firebase.database().ref('chat' + '/' + this.getParamData.bokkingId + '/' + 'message' + '/' + this.state.id).push({
                message: inputmessage,
                from: this.state.carbookedInfo.customer,
                type: "msg",
                msgDate: today,
                msgTime: time,
                source: "rider"
              })
              this.sendPushNotification(this.state.carbookedInfo.driver, this.state.firstNameRider + ': ' + inputmessage)
            })
          }
        } else {
          firebase.database().ref('chat' + '/' + this.getParamData.bokkingId + '/').update({
            distance: this.state.carbookedInfo.distance,
            car: this.state.carbookedInfo.carType,
            bookingId: this.getParamData.bokkingId
          }).then(() => {
            if (this.state.id) {
              firebase.database().ref('chat' + '/' + this.getParamData.bokkingId + '/' + 'message' + '/' + this.state.id).push({
                message: inputmessage,
                from: this.state.carbookedInfo.customer,
                type: "msg",
                msgDate: today,
                msgTime: time,
                source: "rider"
              })
              this.sendPushNotification(this.state.carbookedInfo.driver, this.state.firstNameRider + ': ' + inputmessage)
            }
          })
        }
      })
      this.setState({ inputmessage: "" });
    }
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
  renderItem({ item, index }) {
    return (
      item.source == "rider" ?
        <View style={styles.drivermsgStyle}>
            <Text style={styles.msgTextStyle}>{item ? item.message : languageJSON.chat_not_found}</Text>
            <Text style={styles.msgTimeStyle}>{item ? item.msgTime : null}</Text>
        </View>
        :
        <View style={styles.riderMsgStyle}>
          <Text style={styles.riderMsgText}>{item ? item.message : languageJSON.chat_not_found}</Text>
          <Text style={styles.riderMsgTime}>{item ? item.msgTime : null}</Text>
        </View>
    );
  }

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.viewHeader}>
          <View style={styles.bordaIconeVoltar}>
            <TouchableOpacity onPress={() => { this.props.navigation.goBack() }}>
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
        <View style={{flex: 1 }}>
          <FlatList
            data={this.state.allChat.reverse()}
            renderItem={this.renderItem}
            //keyExtractor={(item, index) => index.toString()}
            inverted
          />
        </View>
        <KeyboardAvoidingView behavior={Platform.OS == 'ios' ? 'padding' : 'height'}>
          <View style={styles.footer}>
            <TextInput
              value={this.state.inputmessage}
              style={styles.input}
              underlineColorAndroid="transparent"
              placeholder={languageJSON.chat_input_title}
              onChangeText={text => this.setState({ inputmessage: text })}
            />

            <TouchableOpacity style={{ justifyContent: 'center', alignItems: 'center', top: 5, right: 10, backgroundColor: colors.DEEPBLUE, width: 40, height: 40, borderRadius: 50 }} onPress={() => this.sendMessege(this.state.inputmessage)}>
              <Icon
                name='ios-paper-plane'
                type='ionicon'
                color={colors.WHITE}
                size={25}
                containerStyle={{ paddingEnd: 3 }}
              />
            </TouchableOpacity>
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
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
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
