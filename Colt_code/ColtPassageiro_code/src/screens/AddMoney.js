
import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableWithoutFeedback,
  ScrollView,
  TextInput,
  FlatList,
  AsyncStorage
} from 'react-native';
import { Header } from 'react-native-elements';
import { colors } from '../common/theme';
import BtnVoltar from '../components/BtnVoltar';

import languageJSON from '../common/language';
import { TouchableOpacity } from 'react-native-gesture-handler';

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
      providers: null
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


  componentDidMount() {
    let getParamData = this.props.navigation.getParam('allData');
    let providers = this.props.navigation.getParam('providers');
    this.setState({ allData: getParamData, providers: providers })
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
    var d = new Date();
    var time = d.getTime();
    let payData = {
      email: this.state.allData.email,
      amount: this.state.amount,
      order_id: time.toString(),
      name: "Adicionar Saldo Carteira",
      description: languageJSON.wallet_ballance,
      currency: this.state.settings.code,
      quantity: 1,
    }
    if (payData) {
      this.props.navigation.navigate("paymentMethod", {
        payData: payData,
        allData: this.state.allData,
        settings: this.state.settings,
        providers: this.state.providers
      });
    }
  }

  newData = ({ item, index }) => {
    return (
      <TouchableOpacity style={[styles.boxView, { backgroundColor: item.selected ? colors.DEEPBLUE : colors.WHITE, borderWidth: item.selected ? 0 : 1, borderColor: item.selected ? 'transparent' : colors.GREY2 }]} onPress={() => { this.quckAdd(index); }}><Text style={styles.quckMoneyText, { color: item.selected ? '#fff' : '#000' }} >{this.state.settings.symbol}{item.amount}</Text></TouchableOpacity>
    )
  }


  //go back
  goBack = () => {
    this.props.navigation.goBack();
  }
  render() {
    return (
      <View style={styles.mainView}>
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
            onPress={() => {
              this.payNow();
            }}>
            <Text style={styles.buttonTitle}>Confirmar valor</Text>
          </TouchableOpacity>
        </View>
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
    backgroundColor: colors.WHITE,
  },
  viewHeader: {
    top: Platform.OS == 'ios' ? 50 : 30,
    backgroundColor: colors.WHITE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around'
  },
  bodyContainer: {
    top: Platform.OS == 'ios' ? 65 : 45,
    flexDirection: 'column',
    marginTop: 10,
    paddingHorizontal: 12
  },
  walletbalText: {
    fontSize: 17,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
  },
  ballance: {
    fontWeight: 'bold'
  },
  inputTextStyle: {
    marginTop: 10,
    textAlign: 'center',
    height: 50,
    borderBottomColor: colors.GREY1,
    borderBottomWidth: 1,
    marginHorizontal: 85,
    justifyContent: 'center',
    fontSize: 30
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
