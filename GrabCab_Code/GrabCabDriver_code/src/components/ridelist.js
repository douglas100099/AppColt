import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, AsyncStorage } from 'react-native';
import { Icon } from 'react-native-elements'
import { colors } from '../common/theme';
import dateStyle from '../common/dateStyle';
export default class RideList extends React.Component {

    constructor(props) {
        super(props);
        this.state={
            currency:{
                code:'',
                symbol:''
            }
        };
        this._retrieveCurrency();
    }

    _retrieveCurrency = async () => {
        try {
          const value = await AsyncStorage.getItem('currency');
          if (value !== null) {
            this.setState({currency:JSON.parse(value)});
          }
        } catch (error) {
            console.log("Asyncstorage issue 1");
        }
    };

    //on press of each item function
    onPressButton(item, index) {
        const { onPressButton } = this.props;
        onPressButton(item, index)
    }


    //flatlist return function
    newData = ({ item, index }) => {
        return (
            <TouchableOpacity style={styles.iconClickStyle} onPress={() => this.onPressButton(item, index)}>
                <View style={styles.flexViewStyle}>
                    <View style={styles.textView1}>
                        <View style={{ flexDirection: 'row' }}>
                            <Text style={[styles.textStyle, styles.dateStyle]}>{item.bookingDate ? new Date(item.bookingDate).toLocaleString(dateStyle) : ''}</Text>
                            {
                                item.status == 'CANCELLED' ?
                                    <Text style={[styles.textStyle2, styles.dateStyle2]}>CANCELADO</Text>
                                    :
                                    null
                            }
                        </View>

                        <Text style={[styles.textStyle, styles.dateStyle]}>{new Date(item.tripdate).toLocaleString(dateStyle)}</Text>
                        <View style={[styles.picupStyle, styles.position]}>
                            <View style={styles.greenDot} />
                            <Text style={[styles.picPlaceStyle, styles.placeStyle]}>{item.pickup.add ? item.pickup.add : ""}</Text>
                        </View>
                        <View style={[styles.dropStyle, styles.textViewStyle]}>
                            <View style={[styles.redDot, styles.textPosition]} />
                            <Text style={[styles.dropPlaceStyle, styles.placeStyle]}>{item.drop.add ? item.drop.add : ""}</Text>
                        </View>

                    </View>
                    <View style={styles.textView2}>
                        <Text style={[styles.fareStyle, styles.dateStyle]}>{item.status == 'END' && item.payment_status == 'PAID' ? item.trip_cost > 0 ? this.state.currency.symbol + parseFloat(item.trip_cost).toFixed(2) : this.state.currency.symbol + parseFloat(item.estimate).toFixed(2) : null}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        )
    }

    render() {
        const { data } = this.props;
        return (
            <View style={styles.textView3}>
                <FlatList
                    keyExtractor={(item, index) => index.toString()}
                    data={data}
                    renderItem={this.newData}
                />
            </View>
        );
    }
};

//style for this component
const styles = StyleSheet.create({
    textStyle: {
        fontSize: 13,
    },
    textStyle2:{
        fontSize: 13,
    },
    fareStyle: {
        fontSize: 18,
    },
    carNoStyle: {
        marginLeft: 45,
        fontSize: 13,
        marginTop: 10,
    },
    picupStyle: {
        flexDirection: 'row',
    },
    picPlaceStyle: {
        color: colors.BLACK
    },
    dropStyle: {
        flexDirection: 'row',
    },
    drpIconStyle: {
        color: colors.RED,
        fontSize: 20
    },
    dropPlaceStyle: {
        color: colors.BLACK,
        
    },
    greenDot: {
        alignSelf: 'center',
        borderRadius: 10,
        width: 10,
        height: 10,
        backgroundColor: colors.DEEPBLUE
    },
    redDot: {
        borderRadius: 10,
        width: 10,
        height: 10,
        backgroundColor: colors.BLACK,
        marginLeft: 20,


    },
    logoStyle: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    iconClickStyle: {
        flex: 1,
        flexDirection: 'row'
    },
    flexViewStyle: {
        backgroundColor: colors.WHITE,
        flex: 7,
        elevation: 2,
        flexDirection: 'row',
        borderRadius: 15,
        marginTop: 20,
        marginLeft: 20,
        marginRight: 20
    },
    dateStyle: {
        fontFamily: 'Inter-Bold',
        color: colors.BLACK,
        marginLeft: 20,
        marginTop: 5,
    },
    dateStyle2: {
        fontFamily: 'Inter-Bold',
        color: colors.RED,
        marginLeft: 20,
        marginTop: 5,

    },
    carNoStyle: {
        fontFamily: 'Inter-Light',
        fontSize: 13,
        marginTop: 8,
        paddingBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: colors.GREY1,
        marginLeft: 20,
        color: colors.BLACK,
    },
    placeStyle: {
        marginLeft: 10,
        fontFamily: 'Inter-Regular',
        fontSize: 15,
        alignSelf: 'center',
        
    },
    textViewStyle: {
        marginTop: 10,
        marginBottom: 10,
        
    },
    cancelImageStyle: {
        width: 50,
        height: 50,
        marginRight: 20,
        marginTop: 18,
        alignSelf:'flex-end',
        backgroundColor: colors.TRANSPARENT
        
        
    },
    iconViewStyle: {
        flex: 1, marginTop: 10
    },
    textView1: {
        flex: 5,
        backgroundColor: colors.TRANSPARENT
    },
    textView2: {
        flex: 2,
        backgroundColor: colors.TRANSPARENT
    },
    textView3: {
        flex: 1,
        backgroundColor: colors.TRANSPARENT
    },
    position: {
        marginTop: 20,
        marginLeft: 20,
        
    },
    textPosition: {
        alignSelf: 'center',
        
    }
});