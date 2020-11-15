import React from "react";
import {
  Text,
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  AsyncStorage
} from "react-native";
import { Avatar, Button } from "react-native-elements";
import { colors } from "../common/theme";
import * as firebase from 'firebase'
import languageJSON from '../common/language';

export default class PromoComp extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      data: [],
      settings: {
        code: '',
        symbol: '',
        cash: false,
        wallet: false
      },
      btnDisable: false
    };
    this.loadPromos();
  }

  componentDidMount() {
    this._retrieveSettings();
  }

  _retrieveSettings = async () => {
    try {
      const value = await AsyncStorage.getItem('settings');
      if (value !== null) {
        this.setState({ settings: JSON.parse(value) });
      }
    } catch (error) {
      console.log("Asyncstorage issue 1");
    }
  };


  loadPromos() {
    const getpromo = firebase.database().ref('offers/');
    getpromo.once('value', getpromo => {
      if (getpromo.val()) {
        let promoObj = getpromo.val();
        var allPromoData = [];
        for (key in promoObj) {
          if (promoObj[key].visible) {
            if (promoObj[key].visible == true) {
              promoObj[key].promoKey = key;
              allPromoData.push(promoObj[key]);
            }
          }
        }
        if (allPromoData) {
          this.setState({
            data: allPromoData
          }, () => {
           
          })
        }
      }
    })
  }



  onPressButton(item, index) {
    this.setState({ btnDisable: true })
    const { onPressButton } = this.props;
    onPressButton(item, index)
  }


  newData = ({ item, index }) => {
    return (
      <View style={styles.container} >
        <View style={styles.promoViewStyle}>
          <View style={styles.promoPosition}>
            <View style={styles.avatarPosition}>
              <Avatar
                size={40}
                rounded
                source={{
                  uri: item.promo_discount_type ?
                    item.promo_discount_type == 'flat' ? "https://cdn1.iconfinder.com/data/icons/service-maintenance-icons/512/tag_price_label-512.png" :
                      "https://cdn4.iconfinder.com/data/icons/icoflat3/512/discount-512.png" : null
                }}
              />
            </View>
            <View style={styles.textViewStyle}>
              <Text style={styles.textStyle}>
                <Text style={styles.couponCode}>{item.promo_name}</Text> - {item.promo_description}
              </Text>
              <Text style={styles.timeTextStyle}>Valor mínimo da corrida {this.state.settings.symbol}{item.min_order}</Text>

            </View>
            <View style={styles.applyBtnPosition} >
              <TouchableOpacity disabled={this.state.btnDisable } style={{ justifyContent: 'center', alignItems: 'center', borderRadius: 5, backgroundColor: 'rgba(63,220,90,0.6)', height: 30 }} onPress={() => this.onPressButton(item, index)}>
                <Text style={{ alignSelf: 'center', fontFamily: 'Inter-Bold', color: colors.WHITE }}> {languageJSON.apply} </Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.borderBottomStyle} />
        </View>
      </View>
    );
  };
  render() {
    return (
      <View>
        <FlatList
          keyExtractor={(item, index) => index.toString()}
          data={this.state.data}
          renderItem={this.newData}
        />
      </View>
    );
  }
}
//Screen Styling
const styles = StyleSheet.create({
  container: {
    width: "95%",
    alignSelf: "center",
    paddingTop: 10,
    paddingBottom: 10
  },
  viewStyle: {
    flexDirection: "row",
    backgroundColor: colors.WHITE
  },
  borderBottomStyle: {
    borderBottomWidth: 1,
    marginTop: 5,
    borderBottomColor: colors.GREY.border,
    opacity: 0.3
  },
  promoViewStyle: {
    flex: 1
  },
  promoPosition: {
    flexDirection: "row"
  },
  avatarPosition: {
    justifyContent: "flex-start",
    flex: 1.5
  },
  textViewStyle: {
    justifyContent: "center",
    flex: 6
  },
  applyBtnPosition: {
    justifyContent: "flex-start",
    flex: 2.5
  },
  textStyle: {
    fontSize: 15,
    flexWrap: "wrap"
  },
  couponCode: {
    fontWeight: 'bold'
  },
  timeTextStyle: {
    //color: "#a6a6a6",
    marginTop: 2
  },
  buttonContainerStyle: {
    flexDirection: "row",
    marginTop: 4
  },
  buttonTitleStyle: {
    textAlign: "center",
    //color: '#fff',
    fontFamily: 'Inter-Bold',
    fontSize: 11,
    paddingBottom: 0,
    paddingTop: 0
  },
  confButtonStyle: {
    borderRadius: 6,
    height: 29,
    width: 65,
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(63,220,90,0.7)',
    elevation: 0,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { x: 0, y: 0 },
    shadowRadius: 5,
  },
  deleteButtonStyle: {
    backgroundColor: colors.WHITE,
    borderRadius: 6,
    height: 29,
    marginLeft: 8,
    borderColor: colors.GREY.Dim_Grey,
    borderWidth: 1,
    width: 85
  },
});
