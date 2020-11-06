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

  componentDidMount() {
    this._isMounted = true
  }

  async UNSAFE_componentWillMount() {
    var pdata = this.props.navigation.getParam('data');
    console.log(pdata.driver + 'pdata')
    if (pdata) {
      data = {
        amount: pdata.pagamento.trip_cost,
        payableAmmount: pdata.pagamento.trip_cost,
        txRef: pdata.bookingKey // booking id
      }
      this.setState({
        userData: pdata,
        payDetails: data,
        loadingPayment: true,
        usedWalletAmmount: pdata.pagamento.usedWalletMoney
      })
    }
  }

  componentWillUnmount() {
    this._isMounted = false
  }

  setValueToDB() {
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

  render() {
    return (
      <View>
        <Text> TESTE </Text>
      </View>
    )
  }
}

const styles = StyleSheet.create({

  mainView: {
    flex: 1,
    backgroundColor: colors.WHITE,
  },
});