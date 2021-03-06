import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Dimensions, Image, AsyncStorage, Platform } from 'react-native';
import { Icon } from 'react-native-elements'
import { colors } from '../common/theme';
var { width } = Dimensions.get('window');
import languageJSON from '../common/language';
import dateStyle from '../common/dateStyle';

import CircleLineTriangle from '../../assets/svg/CircleLineTriangle';
import { color } from 'react-native-reanimated';

export default class RideList extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            settings: {
                code: '',
                symbol: '',
                cash: false,
                wallet: false
            },
        }
    }

    _retrieveSettings = async () => {
        try {
            const value = await AsyncStorage.getItem('settings');
            if (value !== null) {
                this.setState({ settings: JSON.parse(value) });
            }
        } catch (error) {
            console.log("Asyncstorage issue 2");
        }
    };

    componentDidMount() {
        this._retrieveSettings();
    }

    dataAtualFormatada(item) {
        var data = new Date(item.tripdate),
            dia = data.getDate().toString().padStart(2, '0'),
            mes = (data.getMonth() + 1).toString().padStart(2, '0'), //+1 pois no getMonth Janeiro começa com zero.
            ano = data.getFullYear();
        return dia + "/" + mes + "/" + ano;
    }

    //flatlist return function
    newData = ({ item, index }) => {
        const { onPressButton } = this.props;
        return (
            <TouchableOpacity style={styles.iconClickStyle} onPress={() => onPressButton(item, index)}>
                <View style={styles.flexViewStyle}>
                    <View style={{ flexDirection: 'row' }}>
                        <View style={styles.textView1}>
                            <View style={{ flexDirection: 'row', marginTop: 10 }}>
                                <Text style={[styles.textStyle, styles.dateRide]}>
                                    {item.bookingDate ?
                                        Platform.OS == 'ios' ?
                                            item.bookingDate.split(' ')[0] + ' - ' + item.bookingDate.split(' ')[1].split(':')[0] + ':' + item.bookingDate.split(' ')[1].split(':')[1]
                                            : this.dataAtualFormatada(item) + ' - ' + item.trip_end_time
                                        : ''
                                    }
                                </Text>
                                
                                <Text style={styles.dateStyleTimeout}>{item.status == 'TIMEOUT' ? "Tempo esgotado" : null}</Text>
                                <Text style={styles.dateStyleCancelled}>{item.status == 'CANCELLED' ? "Cancelada" : null}</Text>

                                <Text style={[styles.dateStyleAccepted, { fontSize: 16, color: colors.DEEPBLUE }]}>{item.status == 'ACCEPTED' ? "Em andamento" : null}</Text>
                                <Text style={[styles.dateStyleAccepted, { fontSize: 16, color: colors.DEEPBLUE }]}>{item.status == 'START' ? "Em andamento" : null}</Text>

                                <Text style={styles.dateStyleEndPaid}>{item.status == 'END' && item.pagamento.payment_status == 'PAID' ? item.pagamento.customer_paid ? this.state.settings.symbol + parseFloat(item.pagamento.customer_paid).toFixed(2) : this.state.settings.symbol + parseFloat(item.pagamento.estimate).toFixed(2) : null}</Text>
                                
                                <Text style={styles.dateStyleEndProgress}>{item.status == 'END' && item.pagamento.payment_status == 'IN_PROGRESS' ? "Processando" : null}</Text>

                            </View>
                            <Text style={[styles.textStyle, styles.carNoStyle]}>{item.carType ? item.carType : null} - {item.vehicle_number ? item.vehicle_number : null}</Text>
                        </View>
                    </View>
                    <View style={{ backgroundColor: colors.GREY1, height: 1, marginHorizontal: 15 }} />

                    <View style={{ flex: 5, flexDirection: 'row', alignItems: 'center', marginLeft: 10 }}>
                        <CircleLineTriangle />
                        <View style={{ flexDirection: 'column' }}>
                            <View style={styles.picupStyle}>
                                <Text style={styles.picPlaceStyle}>{item.pickup ? item.pickup.add : languageJSON.not_found_text}</Text>
                            </View>

                            <View style={styles.dropStyle}>
                                <Text style={styles.dropPlaceStyle}>{item.drop ? item.drop.add : languageJSON.not_found_text}</Text>
                            </View>
                        </View>
                    </View>

                </View>
            </TouchableOpacity>
        )
    }

    render() {
        const { data } = this.props

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

const styles = StyleSheet.create({
    textStyle: {
        fontSize: 13,
    },
    picupStyle: {
        flexDirection: 'row',
        marginTop: 20,
        paddingLeft: 10,
        paddingRight: 10
    },
    picPlaceStyle: {
        color: colors.BLACK,
        fontFamily: 'Inter-Regular',
        paddingEnd: 20,
        fontSize: 14,
        alignSelf: 'center',
    },
    dropStyle: {
        flexDirection: 'row',
        marginTop: 10,
        marginBottom: 20,
        paddingLeft: 10,
        paddingEnd: 30,
    },
    drpIconStyle: {
        color: colors.RED,
        fontSize: 20
    },
    dropPlaceStyle: {
        color: colors.BLACK,
        fontFamily: 'Inter-Regular',
        fontSize: 14,
        alignSelf: 'center',
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
        flexDirection: 'column',
        borderRadius: 15,
        marginTop: 20,
        marginLeft: 15,
        marginRight: 15,
        shadowColor: '#000',
        shadowOffset: { x: 0, y: 5 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },

    dateStyleEndProgress: {
        fontFamily: 'Inter-Bold',
        color: colors.BLACK,
        marginLeft: 20,
        fontSize: 16,
        right: 10,
        top: 5,
    },
    dateStyleEndPaid: {
        fontFamily: 'Inter-Bold',
        color: colors.BLACK,
        fontSize: 20,
        right: 10,
        top: 5,
        position: 'absolute',
    },
    dateStyleAccepted: {
        fontFamily: 'Inter-Bold',
        color: colors.BLACK,
        fontSize: 20,
        right: 10,
        top: 5,
        position: 'absolute',
    },
    dateStyleTimeout: {
        fontFamily: 'Inter-Bold',
        color: colors.REDCLEAN,
        right: 10,
        top: 5,
        position: 'absolute',
        fontSize: 16,
    },
    dateRide: {
        fontFamily: 'Inter-Bold',
        color: colors.BLACK,
        marginLeft: 20,
        marginTop: 5,
        fontSize: width < 375 ? 16 : 18,
    },
    dateStyleCancelled: {
        fontFamily: 'Inter-Bold',
        color: colors.REDCLEAN,
        right: 10,
        top: 5,
        position: 'absolute',
        fontSize: 15,
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
    textViewStyle: {
        marginTop: 10,
        marginBottom: 10,

    },
    cancelImageStyle: {
        width: 50,
        height: 50,
        marginRight: 20,
        marginTop: 18,
        alignSelf: 'flex-end',
        backgroundColor: colors.TRANSPARENT


    },
    iconViewStyle: {
        flex: 1, marginTop: 10
    },
    textView1: {
        flex: 2,
        backgroundColor: colors.TRANSPARENT
    },
    textView2: {
        height: 50,
        backgroundColor: colors.TRANSPARENT,
        paddingRight: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.DEEP_SKY
    },
    textView3: {
        flex: 6,
        backgroundColor: colors.TRANSPARENT
    },
    position: {
        marginTop: 20,
        marginLeft: 20,

    },
});