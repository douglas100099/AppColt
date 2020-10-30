import React from 'react';
import { View, Text, FlatList, StyleSheet, Image, AsyncStorage } from 'react-native';
import { Icon } from 'react-native-elements'
import { colors } from '../common/theme';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
export default class RideList extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            currency: {
                code: '',
                symbol: ''
            },
            loader: false,
        };
        this._retrieveCurrency();
    }

    _retrieveCurrency = async () => {
        try {
            const value = await AsyncStorage.getItem('currency');
            if (value !== null) {
                this.setState({ currency: JSON.parse(value) });
            }
        } catch (error) {
            console.log("Asyncstorage issue 1");
        }
    };

    //on press of each item function
    onPressButton(item, index) {
        this.setState({ loader: true })
        const { onPressButton } = this.props;
        onPressButton(item, index)
    }

    dataAtualFormatada(item) {
        var data = new Date(item.tripdate),
            dia = data.getDate().toString().padStart(2, '0'),
            mes = (data.getMonth() + 1).toString().padStart(2, '0'), //+1 pois no getMonth Janeiro começa com zero.
            ano = data.getFullYear();
        return dia + "/" + mes + "/" + ano;
    }

    loader() {
        return (
            <View style={[styles.loadingcontainer, styles.horizontal]}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        )
    }

    //flatlist return function
    newData = ({ item, index }) => {
        return (
            <TouchableWithoutFeedback style={{ backgroundColor: colors.WHITE, borderRadius: 0, borderWidth: 0, borderColor: colors.WHITE }} disabled={this.state.loader} onPress={() => this.onPressButton(item, index)}>
                <View style={styles.mainView} >
                    <View style={[styles.viewInfos, { borderLeftColor: item.status == 'CANCELLED' ? colors.RED : colors.GREEN.light, borderLeftWidth: 3 }]}>


                        {item.status == 'END' ?
                            <View style={{ position: 'absolute', right: 25, top: 5 }}>
                                <Icon
                                    name="check-circle"
                                    type="feather"
                                    size={25}
                                    color={colors.DEEPBLUE}
                                />
                            </View>
                            : null}
                        {item.status == 'CANCELLED' ?
                            <View style={{ position: 'absolute', right: 25, top: 5 }}>
                                <Icon
                                    name="x-circle"
                                    type="feather"
                                    size={25}
                                    color={colors.RED}
                                />
                            </View>
                            : null}
                        {item.status == 'START' ?
                            <View style={{ position: 'absolute', right: 25, top: 5 }}>
                                <Icon
                                    name="alert-circle"
                                    type="feather"
                                    size={25}
                                    color={colors.YELLOW.primary}
                                />
                            </View>
                            : null}


                        <View style={styles.headerView} onPress={() => this.onPressButton(item, index)}>
                            <View style={styles.nomePhoto}>
                                <Image source={item.imageRider ? { uri: item.imageRider } : require('../../assets/images/profilePic.png')} style={styles.fotoPassageiro} />
                                <Text style={styles.txtPassageiro}>{item.customer_name ? item.customer_name : 'Sem nome'}</Text>
                            </View>
                            <View style={{flexDirection: 'row'}}>
                                <View style={{ marginRight: 5 }}>
                                    <Text style={styles.txtHora}>{item.tripdate ? this.dataAtualFormatada(item) : 'Indefinido'}</Text>
                                </View>
                                <View style={{ marginRight: 30 }}>
                                    <Text style={styles.txtHora2}>{item.trip_start_time ? item.trip_start_time.split(':')[0] + ':' + item.trip_start_time.split(':')[1] : 'Indefinido'}</Text>
                                </View>
                            </View>
                        </View>
                        <View style={styles.viewDinheiro}>
                            <Text style={styles.txtMetodopgt}>{item.pagamento.payment_mode ? item.pagamento.payment_mode : 'Dinheiro'}</Text>
                            <Text style={styles.txtDinheiro}>R$ {item.pagamento.trip_cost ? parseFloat(item.pagamento.trip_cost).toFixed(2) : '0'}</Text>
                        </View>
                    </View>
                </View>
            </TouchableWithoutFeedback>
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
    /* NOVO CSS */

    mainView: {
        flex: 1,
        backgroundColor: colors.WHITE,
        marginHorizontal: 10,
        marginVertical: 5,
    },

    viewInfos: {
        flex: 1,
        backgroundColor: colors.WHITE,
        height: 80,
        borderRadius: 15,
        marginBottom: 5,
        elevation: 5,
    },

    headerView: {
        flex: 0.5,
        marginTop: 10,
        marginHorizontal: 25,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },

    txtHora: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        color: colors.BLACK,
    },

    txtHora2: {
        fontSize: 14,
        fontFamily: 'Inter-Bold',
        color: colors.BLACK,
    },

    nomePhoto: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    txtPassageiro: {
        fontSize: 12,
        fontFamily: 'Inter-Regular',
        color: colors.BLACK,
    },

    fotoPassageiro: {
        height: 25,
        width: 25,
        borderRadius: 50,
        marginRight: 5,
    },

    viewDinheiro: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 10,
        marginHorizontal: 25,

    },

    txtMetodopgt: {
        fontSize: 14,
        fontFamily: 'Inter-SemiBold',
        color: colors.BLACK,
    },

    txtDinheiro: {
        fontSize: 20,
        fontFamily: 'Inter-Bold',
        color: colors.BLACK,
    },




    /* FIM DO NOVO CSS */





    textStyle: {
        fontSize: 13,
    },
    textStyle2: {
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
        alignSelf: 'flex-end',
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