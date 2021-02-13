
import React from 'react';
import { WTransactionHistory } from '../components';

import {
  StyleSheet,
  View,
  Text,
  TouchableWithoutFeedback,
  ScrollView, Dimensions,
  AsyncStorage,
  Platform
} from 'react-native';
import { Header, Icon } from 'react-native-elements';
import { colors } from '../common/theme';
var { height, width } = Dimensions.get('window');
import * as firebase from 'firebase';
import languageJSON from '../common/language';
import { cloud_function_server_url } from '../common/serverUrl';
import { TouchableOpacity } from 'react-native-gesture-handler';
import BtnVoltar from '../components/BtnVoltar';

export default class WalletDetails extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      settings: {
        code: '',
        symbol: '',
        cash: false,
        wallet: false
      },
      hiddenSaldo: false,
    };
  }

  _retrieveSettings = async () => {
    try {
      const value = await AsyncStorage.getItem('settings')
      if (value !== null) {
        this.setState({ settings: JSON.parse(value) })
      }
    } catch (error) {
      console.log("Asyncstorage issue 12")
    }
  };

  componentDidMount() {
    const root = firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/')
    root.on('value', walletData => {
      if (walletData.val()) {
        let udata = walletData.val()
        this.setState({
          allData: udata
        }, () => {

        })
      }
    })
    this._retrieveSettings();
    //this.getProviders();
  }


  getProviders = async () => {
    fetch(cloud_function_server_url + '/get_providers', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((response) => response.json())
      .then((responseJson) => {
        if (responseJson.length > 0) {
          this.setState({ providers: responseJson })
        }
      })
      .catch((error) => {
        console.log(error)
      });
  }

  doReacharge() {
    this.props.navigation.push('addMoney', { allData: this.state.allData, providers: this.state.providers });
  }

  goBack = () => {
    this.props.navigation.goBack()
  }

  render() {
    const walletBar = height / 4;
    return (
      <View style={styles.mainView}>
        <View style={styles.viewHeader}>
          <BtnVoltar style={{ backgroundColor: colors.WHITE, position: 'absolute', left: 0, marginLeft: 10, marginBottom: 5 }} btnClick={this.goBack} />
          <Text style={{ fontFamily: 'Inter-Bold', fontSize: 20 }}> Carteira Colt </Text>
        </View>
        <View style={{ flex: 3 }}>
          <View style={{ flexDirection: 'row', justifyContent: "space-around", marginTop: 25 }}>
            <TouchableOpacity style={styles.btnSaldo} onPress={() => { this.setState({ hiddenSaldo: !this.state.hiddenSaldo })}}>
                <Text style={styles.txtSaldo}>Saldo</Text>
                {this.state.hiddenSaldo ? 
                <View
                  style={{ height: 25, marginTop:10, marginBottom: 5, width: 110, alignSelf: 'center', backgroundColor: colors.GREY1 }}
                />
                : 
                <Text style={styles.valorSaldo}>{this.state.settings.symbol}{this.state.allData ? parseFloat(this.state.allData.walletBalance > 0 ? this.state.allData.walletBalance : 0).toFixed(2) : ''}</Text>
                }
                <Icon
                  name='visibility'
                  type='MaterialIcons'
                  color={colors.GREY2}
                  size={30}
                //iconStyle={{ lineHeight: 48 }}
                />
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnAddMoney} onPress={() => this.doReacharge()}>
              <View >
                <Icon
                  name='add-circle'
                  type='MaterialIcons'
                  color='#fff'
                  size={45}
                  iconStyle={{ lineHeight: 48 }}
                />
                <Text style={{ textAlign: 'center', fontSize: 18, color: '#fff', fontFamily: 'Inter-Bold' }}>Adicionar saldo</Text>
              </View>
            </TouchableOpacity>

          </View>

          <View style={styles.viewHistorico}>
            <Text style={{ paddingHorizontal: 10, color: colors.BLACK, fontFamily: 'Inter-Bold', textAlign: 'center', fontSize: 16 }}>Historico de movimentação</Text>
          </View>
        </View>

        <View style={{ flex: 4.5, backgroundColor: colors.GREY.background }}>
          <WTransactionHistory />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  headerStyle: {
    backgroundColor: colors.WHITE,
    borderBottomWidth: 0
  },
  headerTitleStyle: {
    color: colors.BLACK,
    fontFamily: 'Roboto-Bold',
    fontSize: 20
  },

  textContainer: {
    textAlign: "center"
  },
  mainView: {
    flex: 1,
    backgroundColor: colors.WHITE,
  },
  viewHeader: {
    flex: 1,
    top: Platform.OS == 'ios' ? 30 : 20,
    backgroundColor: colors.WHITE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around'
  },
  bordaIconeVoltar: {
    position: 'absolute',
    backgroundColor: colors.WHITE,
    width: 40,
    height: 40,
    borderRadius: 50,
    elevation: 5,
    justifyContent: 'center',
    alignItems: 'center',
    left: 15,
    shadowColor: '#000',
    shadowOffset: { x: 0, y: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  btnSaldo: {
    width: (width / 2) - 10,
    height: (height / 4) - 10,
    backgroundColor: colors.WHITE,
    borderRadius: 8,
    justifyContent: 'center',
    flexDirection: 'column',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { x: 0, y: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  txtSaldo: {
    textAlign: 'center',
    fontSize: 18,
    fontFamily: 'Inter-Regular'
  },
  valorSaldo: {
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '500',
    fontFamily: 'Inter-Bold',
    color: '#1CA84F'
  },
  btnAddMoney: {
    width: (width / 2) - 10,
    height: (height / 4) - 10,
    backgroundColor: '#1CA84F',
    borderRadius: 8,
    justifyContent: 'center',
    flexDirection: 'column',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { x: 0, y: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  viewHistorico: {
    position: 'absolute',
    bottom: Platform.OS == 'ios' ? 10 : 0,
    width: width,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.GREY3,
  },
});
