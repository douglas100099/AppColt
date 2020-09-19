
import React from 'react';
import { WTransactionHistory } from '../components';

import {
  StyleSheet,
  View,
  Text,
  TouchableWithoutFeedback,
  ScrollView, Dimensions,
  AsyncStorage
} from 'react-native';
import { Header, Icon } from 'react-native-elements';
import { colors } from '../common/theme';
var { height } = Dimensions.get('window');
import * as firebase from 'firebase';
import languageJSON from '../common/language';
import {cloud_function_server_url} from '../common/serverUrl';

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
      providers:null
    };
  }

  _retrieveSettings = async () => {
    try {
      const value = await AsyncStorage.getItem('settings');
      if (value !== null) {
        this.setState({ settings: JSON.parse(value) });
      }
    } catch (error) {
      console.log("Asyncstorage issue 12");
    }
  };

  componentDidMount() {
    const root = firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/');
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
    this.getProviders();
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
        console.log(error);
      });
  }

  doReacharge() {
    if(this.state.providers){
      this.props.navigation.push('addMoney', { allData: this.state.allData, providers:this.state.providers });
    }else{
      alert('No Payment Providers Found.')
    }
  }

  render() {
    const walletBar = height / 4;
    return (
      <View style={styles.mainView}>
        <Header
          backgroundColor={colors.WHITE}
          leftComponent={{ icon: 'chevron-left', type: 'MaterialIcons', color: colors.BLACK, size: 35, component: TouchableWithoutFeedback, onPress: () => { this.props.navigation.goBack(); } }}
          centerComponent={<Text style={styles.headerTitleStyle}>{languageJSON.my_wallet_tile}</Text>}
          containerStyle={styles.headerStyle}
          innerContainerStyles={{ marginLeft: 10, marginRight: 10 }}
        />

        <View style={{ flex: 1, flexDirection: 'column' }}>
          <View style={{ height: walletBar, marginBottom: 12 }}>
            <View >
              <View style={{ flexDirection: 'row', justifyContent: "space-around", marginTop: 8 }}>
                <View style={{ height: walletBar - 10, width: '48%', backgroundColor: '#FFFF', borderRadius: 8, elevation: 5 ,justifyContent: 'center', flexDirection: 'column' }}>
                  <Text style={{ textAlign: 'center', fontSize: 18, fontFamily: 'Inter-Regular' }}>Saldo</Text>
                  <Text style={{ textAlign: 'center', fontSize: 25, fontWeight: '500', fontFamily: 'Inter-Bold' ,color: '#1CA84F' }}>{this.state.settings.symbol}{this.state.allData ? parseFloat(this.state.allData.walletBalance).toFixed(2) : ''}</Text>
                </View>
                <View style={{ height: walletBar - 10, width: '48%', backgroundColor: '#1CA84F', borderRadius: 8, justifyContent: 'center', flexDirection: 'column', elevation: 5 }}>
                  <Icon
                    name='add-circle'
                    type='MaterialIcons'
                    color='#fff'
                    size={45}
                    iconStyle={{ lineHeight: 48 }}
                    onPress={() => this.doReacharge()}
                  />
                  <Text style={{ textAlign: 'center', fontSize: 18, color: '#fff', fontFamily: 'Inter-Bold'}}>Adicionar saldo</Text>

                </View>
              </View>
            </View>
            <View style={{ marginVertical: 10 }}>
              <Text style={{ paddingHorizontal: 10, fontSize: 18, fontWeight: '500', marginTop: 8 }}>Historico de movimentação</Text>
            </View>
          </View>

          <View style={{}}>
            <ScrollView style={{ height: (height - walletBar) - 110 }}>
              <WTransactionHistory />
            </ScrollView>
          </View>
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

});
