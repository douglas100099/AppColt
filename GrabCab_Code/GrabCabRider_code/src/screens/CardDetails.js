import React from 'react';
import {
  StyleSheet,
  View,
  Image,
  Dimensions,
  Text,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
  Modal,
  AsyncStorage,
  TouchableOpacityBase
} from 'react-native';

import { Header, CheckBox } from 'react-native-elements';
import { colors } from '../common/theme';
var { width, height } = Dimensions.get('window');
import * as firebase from 'firebase';
import { PromoComp } from "../components";
import languageJSON from '../common/language';
import { cloud_function_server_url } from '../common/serverUrl';

export default class CardDetailsScreen extends React.Component {

  constructor(props) {
    super(props);
    this._isMounted = false
    this.state = {
      loadingModal: false,
      walletBalance: 0,
      settings: {
        code: '',
        symbol: '',
        cash: false,
        wallet: false
      },
      loadingPayment: false,
    }
  }

  _retrieveSettings = async () => {
    try {
      const value = await AsyncStorage.getItem('settings');
      if (value !== null) {
        this.setState({ settings: JSON.parse(value) });
      }
    } catch (error) {
      console.log("Asyncstorage issue 6");
    }
  };

  componentDidMount() {
    this._isMounted = true
    this._retrieveSettings();
    this.setValueToDB()
  }

  async UNSAFE_componentWillMount() {
    var pdata = this.props.navigation.getParam('data');
    if (pdata) {
      data = {
        amount: pdata.trip_cost,
        payableAmmount: pdata.trip_cost,
        txRef: pdata.bookingKey // booking id
      }
      this.setState({
        userData: pdata,
        payDetails: data,
        loadingPayment: true,
        usedWalletAmmount: pdata.usedWalletMoney
      })
      if (pdata.promoCodeApplied != "") {
        this.addDetailsToPromo(pdata.promoCodeApplied, firebase.auth().currentUser.uid)
      }
    } 
    this.loadWalletCash()
  }

  componentWillUnmount() {
    this._isMounted = false
  }

  addDetailsToPromo(offerkey, curUId) {
    const promoData = firebase.database().ref('offers/' + offerkey);
    promoData.once('value', promo => {
      if (promo.val()) {
        let promoData = promo.val();
        let user_avail = promoData.user_avail;
        if (user_avail) {
          firebase.database().ref('offers/' + offerkey + '/user_avail/details').push({
            userId: curUId
          }).then(() => {
            firebase.database().ref('offers/' + offerkey + '/user_avail/').update({ count: user_avail.count + 1 })
          })
        } else {
          firebase.database().ref('offers/' + offerkey + '/user_avail/details').push({
            userId: curUId
          }).then(() => {
            firebase.database().ref('offers/' + offerkey + '/user_avail/').update({ count: 1 })
          })
        }
      }
    })
  }

  loadWalletCash() {
    const uRoot = firebase.database().ref('users/' + firebase.auth().currentUser.uid);
    uRoot.on('value', uval => {
      if (uval.val()) {
        let data = uval.val()
        if (data.walletBalance && data.walletBalance > 0) {
          this.setState({ walletBalance: data.walletBalance })
        }
      }
    })
  }

  setValueToDB() {
    let paramData = this.state.userData;
    firebase.database().ref('users/' + paramData.driver + '/my_bookings/' + paramData.bookingKey + '/').update({
      payment_status: "PAID",
    }).then(() => {
      firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/my-booking/' + paramData.bookingKey + '/').update({
        payment_status: "PAID",
      }).then(() => {
        firebase.database().ref('bookings/' + paramData.bookingKey + '/').update({
          payment_status: "PAID",
        }).then(() => {
          this.setState({ loadingPayment: false });

          if (this.state.usedWalletAmmount) {
            if (this.state.usedWalletAmmount > 0) {
              let tDate = new Date();
              firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/walletHistory').push({
                type: 'Debit',
                amount: this.state.usedWalletAmmount,
                date: tDate.toString(),
                txRef: this.state.payDetails.txRef,
              }).then(() => {
                firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/').update({
                  walletBalance: this.state.walletBalance - this.state.usedWalletAmmount
                })
              })
            }
          }
        })
        setTimeout(() => {
          alert(languageJSON.success_payment);
        }, 1000)
        this.props.navigation.navigate('ratingPage', { data: paramData });
      })
    })
  }

  loadingPaymentModal() {
    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={this.state.loadingPayment}
        onRequestClose={() => {
          this.setState({ loadingPayment: false })
        }}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.4)", justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: '85%', backgroundColor: "#DBD7D9", borderRadius: 10, flex: 1, maxHeight: 80 }}>
            <View style={{ alignItems: 'center', flexDirection: 'row', flex: 1, justifyContent: "center" }}>
              <Image
                style={{ width: 80, height: 80, backgroundColor: colors.TRANSPARENT }}
                source={require('../../assets/images/loader.gif')}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#000", fontSize: 16, }}> Processando seu pagamento, aguarde... </Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    )
  }

  render() {
    return (
      <View style={styles.mainView}>
        {
          this.loadingPaymentModal()
        }
      </View>
    );
  }
}

const styles = StyleSheet.create({

  mainView: {
    flex: 1,
    backgroundColor: colors.WHITE,
  },
});