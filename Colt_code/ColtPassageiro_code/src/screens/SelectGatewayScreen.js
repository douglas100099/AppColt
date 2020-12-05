import React from 'react';
import { View, StyleSheet, TouchableHighlight, Image, TouchableWithoutFeedback, AsyncStorage, Text, } from 'react-native';
import { Header, } from 'react-native-elements';
import languageJSON from '../common/language';
import { colors } from '../common/theme';
import * as firebase from 'firebase';
import PaymentWebView from '../components/PaymentWebView';
import { ScrollView } from 'react-native-gesture-handler';
import BtnVoltar from '../components/BtnVoltar';


export default class SelectGatewayPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      payData: null,
      providers: null,
      userdata: null,
      settings: null,
      selectedProvider: null
    };
  }

  componentDidMount() {
    let payData = this.props.navigation.getParam('payData');
    let uData = this.props.navigation.getParam('allData');
    let Settings = this.props.navigation.getParam('settings');
    let providers = this.props.navigation.getParam('providers');
    this.setState({ payData: payData, userdata: uData, settings: Settings, providers: providers });
  }


  onSuccessHandler = (order_details) => {
    let tDate = new Date();
    let Walletballance = this.state.userdata.walletBalance + parseInt(this.state.payData.amount)
    firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/walletBalance').set(Walletballance).then(() => {
      firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/walletHistory').push({
        type: 'Credit',
        amount: parseInt(this.state.payData.amount),
        date: tDate.toString(),
        txRef: this.state.payData.order_id,
        getway: order_details.gateway,
        transaction_id: order_details.transaction_id
      })

      setTimeout(() => {
        this.props.navigation.navigate('wallet')
      }, 3000)
    });

  };

  onCanceledHandler = () => {
    if (this.state.userdata.paymentType) {
      setTimeout(() => {
        //this.props.navigation.navigate('CardDetails')
      }, 5000)
    } else {
      setTimeout(() => {
        this.props.navigation.navigate('wallet')
      }, 5000)
    }
  };

  goBack() {
    this.setState({ selectedProvider: null });
    this.props.navigation.goBack();
  }

  selectProvider = (provider) => {
    this.setState({ selectedProvider: provider });
  };

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.viewHeader}>
          <BtnVoltar style={{ backgroundColor: colors.WHITE, position: 'absolute', left: 0, marginLeft: 10, marginBottom: 5 }} btnClick={this.goBack} />
          <Text style={{ fontFamily: 'Inter-Bold', fontSize: 20 }}> Carteira  </Text>
        </View>
        {this.state.selectedProvider ?
          <PaymentWebView provider={this.state.selectedProvider} payData={this.state.payData} onSuccess={this.onSuccessHandler} onCancel={this.onCanceledHandler} /> : null}
        {this.state.providers && this.state.selectedProvider == null ?
          <ScrollView>
            {
              this.state.providers.map((provider) => {
                return (
                  <TouchableHighlight onPress={this.selectProvider.bind(this, provider)} underlayColor='#fff'>
                    <View style={[styles.box, { marginTop: 80 }]} key={provider.name}>
                      <Image
                        style={styles.thumb}
                        source={{ uri: provider.image }}
                      />
                    </View>
                  </TouchableHighlight>
                );
              })
            }
          </ScrollView>
          : null
        }
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.WHITE,
    flex: 1
  },
  viewHeader: {
    top: Platform.OS == 'ios' ? 50 : 30,
    backgroundColor: colors.WHITE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around'
  },
  headerStyle: {
    backgroundColor: colors.GREY.default,
    borderBottomWidth: 0
  },
  headerTitleStyle: {
    color: colors.WHITE,
    fontFamily: 'Roboto-Bold',
    fontSize: 20
  },
  box: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ededed',
    borderRadius: 8,
    marginBottom: 4,
    marginHorizontal: 20,
    marginTop: 8
  },

  thumb: {
    height: 35,
    width: 100,
    resizeMode: 'contain'

  }
});