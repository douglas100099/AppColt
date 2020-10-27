import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableWithoutFeedback,
    ImageBackground,
    ScrollView,
    Dimensions,
    TouchableOpacity,
    Image,
    Platform,
    AsyncStorage
} from 'react-native';
import Polyline from '@mapbox/polyline';
var { height } = Dimensions.get('window');
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import { Header, Rating, Avatar, Button, Icon } from 'react-native-elements';
import Dash from 'react-native-dash';
import * as firebase from 'firebase';
import { colors } from '../common/theme';
import { google_map_key } from '../common/key';
import languageJSON from '../common/language';
var { width } = Dimensions.get('window');
import ProfileSVG from '../SVG/ProfileSVG';

export default class RideDetails extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            coords: [],
            intialregion: {},
            starCount: null,
            infoVisible: false,
            currency: {
                code: '',
                symbol: ''
            }
        }
        this.getRideDetails = this.props.navigation.getParam('data');
        //console.log(this.getRideDetails)
        this._retrieveCurrency();
    }

    _retrieveCurrency = async () => {
        try {
            const value = await AsyncStorage.getItem('currency');
            if (value !== null) {
                this.setState({ currency: JSON.parse(value) });
            }
        } catch (error) {
            console.log("Asyncstorage issue 5");
            alert('Ops, tivemos um problema.')
        }
    };

    componentDidMount() {
        if (this.getRideDetails) {

            this.setState({
                paramData: this.getRideDetails,
                intialregion: {
                    latitude: this.getRideDetails.pickup.lat,
                    longitude: this.getRideDetails.pickup.lng,
                    latitudeDelta: 0.9922,
                    longitudeDelta: 0.9421,
                },
                curUid: firebase.auth().currentUser.uid,
                payButtonShow: (this.getRideDetails.payment_status == 'DUE' || this.getRideDetails.payment_status == 'IN_PROGRESS' || this.getRideDetails.status == 'ACCEPTED') ? true : false
            }, () => {
                //console.log(this.state.paramData.rating);
                this.forceUpdate();
            })


        }
    }

    //go back
    goBack() {
        this.props.navigation.replace('RideList');
    }

    info = () => {
        if (this.state.infoVisible) {
            this.setState({ infoVisible: false })
        } else {
            this.setState({ infoVisible: true })
        }

    }

    dataAtualFormatada() {
        var data = new Date(this.getRideDetails.tripdate),
            dia = data.getDate().toString().padStart(2, '0'),
            mes = (data.getMonth() + 1).toString().padStart(2, '0'),
            ano = data.getFullYear();
        return dia + "/" + mes + "/" + ano;
    }

    render() {
        return (
            <View style={styles.mainView}>
                <View style={styles.header}>
                    <Text style={{ fontSize: 20, fontFamily: 'Inter-Bold', color: colors.BLACK, textAlign: 'center' }}>Detalhes da corrida</Text>
                    <View style={{ position: 'absolute', zIndex: 999, left: 20 }}>
                        <TouchableOpacity style={{ height: 35, width: 35, borderRadius: 100, backgroundColor: colors.WHITE, elevation: 4, }} onPress={() => { this.props.navigation.goBack(); }}>
                            <Icon
                                name='ios-arrow-dropleft-circle'
                                size={35}
                                type='ionicon'
                                color={colors.BLACK}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={styles.mainMap}>
                    <Text style={{ marginLeft: 20 }}>{this.state.paramData ? this.dataAtualFormatada() : null}</Text>
                    <View style={styles.viewEndereco}>
                        <View style={styles.endereco}>
                            <View style={styles.partida}>
                                <Text style={styles.txtHrfim}>{this.state.paramData ? this.state.paramData.trip_start_time : null}</Text>
                                <Icon
                                    name='arrow-right-circle'
                                    size={15}
                                    type='feather'
                                    color={colors.DEEPBLUE}
                                />
                                <Text style={styles.txtPartida}>{this.state.paramData ? this.state.paramData.pickup.add : null}</Text>
                            </View>
                            <View style={styles.destino}>
                                <Text style={styles.txtHrfim}>{this.state.paramData ? this.state.paramData.trip_end_time : null}</Text>
                                <Icon
                                    name='arrow-down-circle'
                                    size={15}
                                    type='feather'
                                    color={colors.RED}
                                />
                                <Text style={styles.txtPartida}>{this.state.paramData ? this.state.paramData.drop.add : null}</Text>
                            </View>
                        </View>
                    </View>
                </View>
                <View style={styles.viewDriver}>
                    <View style={styles.viewPassageiro}>
                        <Text style={styles.txtPassageiro}>Passageiro</Text>
                    </View>
                    <View style={styles.viewInfoPassageiro}>
                        <View style={styles.viewSubInfo}>
                            <View style={styles.photoPassageiro}>
                                {this.state.paramData ? this.state.paramData.imageRider ? 
                                    <Image source={{ uri: this.state.paramData.imageRider }} style={styles.imagemPerfil} />
                                : 
                                    <ProfileSVG/>
                                :
                                    <ProfileSVG/>
                                }
                            </View>
                            <View style={styles.infoPassageiro}>
                                <Text style={styles.txtNomePassageiro}>{this.state.paramData ? this.state.paramData.customer_name : null}</Text>
                                <View style={{ flexDirection: 'row' }}>
                                    <Icon
                                        name='ios-star'
                                        size={18}
                                        type='ionicon'
                                        color={colors.YELLOW.primary}
                                    />
                                    <Text style={{ fontSize: 14, fontFamily: 'Inter-Regular', color: colors.BLACK, marginLeft: 5, }}>5.0</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
                <View style={styles.viewPgt}>
                    <View style={styles.viewPagamento}>
                        <Text style={styles.txtPagamento}>Pagamento</Text>
                    </View>
                    <View style={styles.viewInfosPgt}>
                        <View style={styles.mainPgt}>
                            <View style={{ flexDirection: 'row' }}>
                                <Icon
                                    name='ios-cash'
                                    size={25}
                                    type='ionicon'
                                    color={colors.DEEPBLUE}
                                />
                                <Text style={styles.txtMetodo}>{this.state.paramData ? this.state.paramData.payment_mode ? this.state.paramData.payment_mode : 'Indefinido' : 'Indefinido'}</Text>
                            </View>
                            <Text style={styles.txtDinheiro}>R$ {this.state.paramData ? this.state.paramData.trip_cost : ' 0'}</Text>
                        </View>
                    </View>
                </View>
                <View style={styles.viewBtn}>
                    <View style={{ flex: 0.8, justifyContent: 'flex-end' }}>
                        <TouchableOpacity style={styles.btn}>
                            <Text style={{ fontSize: 16, color: colors.WHITE, fontFamily: 'Inter-Bold' }}>Relatar problema</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        )
    }
}

//Screen Styling
const styles = StyleSheet.create({

    mainView: {
        flex: 1,
        backgroundColor: colors.WHITE,
    },

    header: {
        backgroundColor: colors.WHITE,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 25,
        marginTop: Platform.select({ ios: 55, android: 45 })
    },

    viewMap: {
        flex: 1,
    },

    map: {
        flex: 1,
        ...StyleSheet.absoluteFillObject,
    },

    mainMap: {
        flex: 0.5,
    },

    viewEndereco: {
        flex: 0.8,
        justifyContent: 'center',
    },

    endereco: {
        flex: 0.7,
        borderRadius: 15,
        marginHorizontal: 15,
        borderWidth: 1,
        borderColor: colors.GREY1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    partida: {
        flex: 1,
        marginHorizontal: 7,
        alignItems: 'center',
        flexDirection: 'row',
    },

    txtHrfim: {
        flex: 0.3,
        fontSize: 13,
        color: colors.GREY2,
        fontFamily: 'Inter-Regular',
    },

    txtPartida: {
        flex: 1,
        fontSize: 15,
        color: colors.BLACK,
        marginLeft: 10,
        fontFamily: 'Inter-Regular',
    },

    destino: {
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 7,
        flexDirection: 'row',
    },

    viewDriver: {
        flex: 0.4,
    },

    viewPassageiro: {
        flex: 0.2,
        justifyContent: 'center',
    },

    txtPassageiro: {
        fontSize: 18,
        marginLeft: 15,
        color: colors.BLACK,
        fontFamily: 'Inter-Bold',
    },

    viewInfoPassageiro: {
        flex: 0.5,
        justifyContent: 'center',
    },

    viewSubInfo: {
        flex: 1,
        marginHorizontal: 15,
        backgroundColor: colors.WHITE,
        flexDirection: 'row',
        borderRadius: 15,
        elevation: 5,
        alignItems: 'center',
        justifyContent: 'center',
    },

    photoPassageiro: {
        flex: 0.3,
        justifyContent: 'center',
        alignItems: 'center',
    },

    imagemPerfil: {
        height: 70,
        width: 70,
        borderWidth: 2,
        borderColor: colors.GREY2,
        borderRadius: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },

    infoPassageiro: {
        flex: 0.7,
        flexDirection: 'column',
        alignItems: 'flex-start'
    },

    txtNomePassageiro: {
        fontSize: 18,
        marginBottom: 5,
        color: colors.BLACK,
        fontFamily: 'Inter-Bold',
    },

    viewPgt: {
        flex: 0.3,

    },

    viewPagamento: {
        flex: 0.2,
        marginBottom: 15,
        marginLeft: 15,

    },

    txtPagamento: {
        fontSize: 18,
        color: colors.BLACK,
        fontFamily: 'Inter-Bold',
    },

    viewInfosPgt: {
        flex: 0.5,
        marginHorizontal: 15,
        borderRadius: 15,
        backgroundColor: colors.GREY1,
    },

    mainPgt: {
        flex: 1,
        flexDirection: 'row',
        marginHorizontal: 15,
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    txtMetodo: {
        fontSize: 15,
        marginLeft: 15,
        color: colors.BLACK,
        fontFamily: 'Inter-Regular',
    },

    txtDinheiro: {
        fontSize: 25,
        color: colors.DEEPBLUE,
        fontFamily: 'Inter-Bold',
    },

    viewBtn: {
        flex: 0.4,
        justifyContent: 'flex-end',
    },

    btn: {
        flex: 0.5,
        maxHeight: 60,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.DEEPBLUE,
    },

});