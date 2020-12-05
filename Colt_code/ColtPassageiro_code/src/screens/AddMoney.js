
import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  FlatList,
  AsyncStorage
} from 'react-native';
import { colors } from '../common/theme';
import BtnVoltar from '../components/BtnVoltar';
import PaymentWebView from '../components/PaymentWebView';

import languageJSON from '../common/language';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { color } from 'react-native-reanimated';

export default class AddMoneyScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      amount: '10',
      qickMoney: [{ amount: '10', selected: false }, { amount: '15', selected: false }, { amount: '20', selected: false }, { amount: '30', selected: false }, { amount: '50', selected: false }],
      settings: {
        code: '',
        symbol: '',
        cash: false,
        wallet: false
      },
      payNow: false
    }
  }

  _retrieveSettings = async () => {
    try {
      const value = await AsyncStorage.getItem('settings');
      if (value !== null) {
        this.setState({ settings: JSON.parse(value) });
      }
    } catch (error) {
      console.log("Asyncstorage issue 4");
    }
  };

  onSuccessHandler = (order_details) => {
    let tDate = new Date();
    let Walletballance = this.state.userdata.walletBalance + parseInt(this.state.payData.amount)
    firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/walletBalance').set(Walletballance).then(() => {
      firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/walletHistory').push({
        type: 'Credit',
        amount: parseInt(this.state.payData.amount),
        date: tDate.toString(),
        txRef: this.state.payData.order_id,
        gateway: order_details.gateway,
        transaction_id: order_details.transaction_id
      })

      setTimeout(() => {
        this.props.navigation.navigate('wallet')
      }, 3000)
    })
  }

  onCanceledHandler = () => {
      setTimeout(() => {
        this.props.navigation.navigate('wallet')
      }, 5000)
  }

  componentDidMount() {
    let getParamData = this.props.navigation.getParam('allData');
    this.setState({ allData: getParamData })
    this._retrieveSettings();
  }

  quckAdd(index) {
    let quickM = this.state.qickMoney;
    for (let i = 0; i < quickM.length; i++) {
      quickM[i].selected = false;
      if (i == index) {
        quickM[i].selected = true;
      }
    }
    this.setState({
      amount: quickM[index].amount,
      qickMoney: quickM
    })
  }

  payNow() {
    this.setState({ payNow: true })
    var currentDate = new Date();
    var time = currentDate.getTime();
    let payData = {
      email: this.state.allData.email,
      amount: this.state.amount,
      time_order_ms: time.toString(),
      name: "Adicionar Saldo Carteira",
      description: languageJSON.wallet_ballance,
      currency: this.state.settings.code,
      quantity: 1,
    }
    this.setState({ payData: payData })
  }

  newData = ({ item, index }) => {
    return (
      <TouchableOpacity style={[styles.boxView, { backgroundColor: item.selected ? colors.DEEPBLUE : colors.WHITE, borderWidth: item.selected ? 0 : 1, borderColor: item.selected ? 'transparent' : colors.GREY2 }]} onPress={() => { this.quckAdd(index); }}><Text style={styles.quckMoneyText, { color: item.selected ? '#fff' : '#000' }} >{this.state.settings.symbol}{item.amount}</Text></TouchableOpacity>
    )
  }

  goBack = () => {
    this.props.navigation.goBack();
  }

  render() {
    return (
      <View style={[styles.mainView, { backgroundColor: this.state.payNow == false ? colors.WHITE : colors.DEEPBLUE }]}>

        { this.state.payNow ?
          <PaymentWebView payData={this.state.payData} onSuccess={this.onSuccessHandler} onCancel={this.onCanceledHandler} /> 
          : null}

        {this.state.payNow == false ?
          <View>
            <View style={styles.viewHeader}>
              <BtnVoltar style={{ backgroundColor: colors.WHITE, position: 'absolute', left: 0, marginLeft: 10, marginBottom: 5 }} btnClick={this.goBack} />
              <Text style={{ fontFamily: 'Inter-Bold', fontSize: 20 }}> Selecione o Valor </Text>
            </View>
            <View style={styles.bodyContainer}>
              <Text style={styles.walletbalText}>{languageJSON.Balance}: <Text style={styles.ballance}>{this.state.settings.symbol}{this.state.allData ? parseFloat(this.state.allData.walletBalance).toFixed(2) : ''}</Text></Text>

              <TextInput
                style={styles.inputTextStyle}
                editable={false}
                placeholder={languageJSON.addMoneyTextInputPlaceholder + " (" + this.state.settings.symbol + ")"}
                keyboardType={'number-pad'}
                onChangeText={(text) => this.setState({ amount: text })}
                value={this.state.amount}
              />
              <View style={styles.quickMoneyContainer}>
                <ScrollView showsHorizontalScrollIndicator={false} horizontal={true}>
                  <FlatList
                    keyExtractor={(item, index) => index.toString()}
                    data={this.state.qickMoney}
                    renderItem={this.newData}
                    horizontal={true}
                  />
                </ScrollView>
              </View>
              <TouchableOpacity
                style={styles.buttonWrapper2}
                onPress={() => { this.payNow() }}>
                <Text style={styles.buttonTitle}>Confirmar valor</Text>
              </TouchableOpacity>
            </View>
          </View>
          : null}
      </View>
    );
  }
}

const styles = StyleSheet.create({

  headerStyle: {
    backgroundColor: colors.GREY.default,
    borderBottomWidth: 0
  },
  headerTitleStyle: {
    color: colors.WHITE,
    fontFamily: 'Roboto-Bold',
    fontSize: 20
  },

  mainView: {
    flex: 1,
  },
  viewHeader: {
    top: Platform.OS == 'ios' ? 50 : 30,
    backgroundColor: colors.WHITE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around'
  },
  bodyContainer: {
    top: Platform.OS == 'ios' ? 80 : 60,
    flexDirection: 'column',
    marginTop: 10,
    paddingHorizontal: 12
  },
  walletbalText: {
    fontSize: 17,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  ballance: {
    fontFamily: 'Inter-Bold'
  },
  inputTextStyle: {
    marginTop: 10,
    textAlign: 'center',
    height: 50,
    borderBottomColor: colors.GREY1,
    borderBottomWidth: 1,
    marginHorizontal: 100,
    justifyContent: 'center',
    fontSize: 35
  },
  buttonWrapper2: {
    marginBottom: 10,
    marginTop: 18,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.DEEPBLUE,
    borderRadius: 10,
  },
  buttonTitle: {
    fontFamily: 'Inter-Bold',
    color: '#fff',
    fontSize: 18,
  },
  quickMoneyContainer: {
    marginTop: 18,
    flexDirection: 'row',
    paddingVertical: 4,
    paddingLeft: 4,
  },
  boxView: {
    height: 40,
    width: 60,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8
  },
  quckMoneyText: {
    fontSize: 16,
  }

});
