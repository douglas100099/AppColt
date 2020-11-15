import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    Dimensions,
    TouchableOpacity,
    Image,
    Platform,
    TextInput,
    Modal,
    AsyncStorage
} from 'react-native';
var { height, width } = Dimensions.get('window');
import { Icon, Input } from 'react-native-elements';
import * as firebase from 'firebase';
import { colors } from '../common/theme';
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
            },
            loadingModal: false,
            loderTick: false,
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
            }, () => {
                //console.log(this.state.paramData.rating);
                this.forceUpdate();
            })


        }
    }

    enviarProblema(){
        this.setState({loaderTick: true})
        let dbRef = firebase.database().ref('users/' + this.state.curUid + '/my_bookings/' + this.state.paramData.bookingUid + '/');
        dbRef.once('value',(snap)=> {
            let checkTick = snap.val()
            if(checkTick && !checkTick.ticket){
                if( this.state.msgProblema && this.state.msgProblema.length > 5 ){
                    firebase.database().ref('tickets/' + 'corridas/').push({
                        id: this.state.paramData ? this.state.paramData.bookingUid : null, 
                        msg: this.state.msgProblema ? this.state.msgProblema : null,
                    }).then(() =>
                        {firebase.database().ref('users/' + this.state.curUid + '/my_bookings/' + this.state.paramData.bookingUid + '/' ).update({
                            ticket: true
                        })
                    }).then(
                        () => {this.setState({loadingModal: false, loaderTick: false})}
                    )
                } else {
                    alert('Digite corretamente o problema.')
                    this.setState({loaderTick: false})
                }
            } else {
                alert('Você já possuí um ticket aberto para essa corrida, aguarde seu ticket ser resolvido.')
                this.setState({loadingModal: false})
            }
        })
    }

    loading() {
        return (
            <Modal
                animationType="fade"
                transparent={true}
                visible={this.state.loadingModal}
                onRequestClose={() => {
                    this.setState({ loadingModal: false })
                }}
            >
                <View style={{ flex: 1, backgroundColor: "rgba(22,22,22,0.8)", justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{ width: '85%', backgroundColor: colors.WHITE, borderRadius: 10, flex: 1, maxHeight: 350 }}>
                        <View style={{ flexDirection: 'column', flex: 1 }}>
                            <View>
                                <Text style={{ color: colors.BLACK, fontSize: 20, fontFamily: 'Inter-Bold', marginTop: 15, textAlign: 'center' }}>Informe o problema.</Text>
                                <TextInput
                                    style={{ marginTop: 10, marginBottom: 22, paddingTop: 10, paddingLeft: 8, marginHorizontal: 15, borderWidth: 1, borderColor: colors.GREY1, borderRadius: 10, height: 200, textAlignVertical: 'top', fontSize: 14, color: colors.BLACK, fontFamily: 'Inter-Regular' }}
                                    maxLength={150}
                                    onChangeText={(text) => this.setState({ msgProblema: text})}
                                    editable={this.state.loaderTick}
                                    multiline={true}
                                    numberOfLines={6}
                                />
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 20}}>
                                <TouchableOpacity 
                                    style={{justifyContent: 'center', alignItems: 'center', height: 50, paddingHorizontal: 15,borderRadius: 15, backgroundColor: colors.RED}} 
                                    onPress={() => this.setState({ loadingModal: false })}
                                    disabled={this.state.loderTick}
                                >
                                    <Text style={{ fontSize: 16, color: colors.WHITE, fontFamily: 'Inter-Bold' }}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={{justifyContent: 'center', alignItems: 'center', height: 50, borderRadius: 15, paddingHorizontal: 15, backgroundColor: colors.DEEPBLUE}} 
                                    onPress={() => this.enviarProblema()}
                                    disabled={this.state.loderTick}
                                >
                                    <Text style={{ fontSize: 16, color: colors.WHITE, fontFamily: 'Inter-Bold' }}>Enviar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        )
    }

    //go back
    goBack() {
        this.props.navigation.goBack();
    }

    //tracking the ride
    trackNow(item) {
        console.log('item', item)
        if (item.status == 'START' || item.status == 'END') {
            firebase.database().ref('bookings/' + item.bookingUid + '/').once('value', (snap) => {
                if (snap.val()) {
                    AsyncStorage.getItem('startTime', (err, result) => {
                        if (result) {
                            let bookingData = snap.val()
                            bookingData.bookingId = item.bookingUid;
                            this.props.navigation.navigate('DriverTripComplete', { allDetails: bookingData, startTime: parseInt(result) })
                        }
                    });
                }
            })

        } else if (item.status == 'ACCEPTED') {
            firebase.database().ref('bookings/' + item.bookingUid + '/').once('value', (snap) => {
                if (snap.val()) {
                    let bookingData = snap.val();
                    bookingData.bookingId = item.bookingUid;
                    this.props.navigation.navigate('DriverTripStart', { allDetails: bookingData })
                }
            })

        }

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
                <ScrollView>
                    <View style={styles.mainMap}>
                        <Text style={{ marginRight: 20, fontSize: 14, fontFamily: 'Inter-Bold', color: colors.BLACK, alignSelf: 'flex-end' }}>{this.state.paramData ? this.dataAtualFormatada() : null}</Text>
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
                                        <ProfileSVG />
                                        :
                                        <ProfileSVG />
                                    }
                                </View>
                                <View style={styles.infoPassageiro}>
                                    <Text style={styles.txtNomePassageiro}>{this.state.paramData ? this.state.paramData.firstNameRider : null}</Text>
                                    <View style={{ flexDirection: 'row' }}>
                                        <Icon
                                            name='ios-star'
                                            size={18}
                                            type='ionicon'
                                            color={colors.YELLOW.primary}
                                        />
                                        <Text style={{ fontSize: 14, fontFamily: 'Inter-Regular', color: colors.BLACK, marginLeft: 5}}>{this.state.paramData ? this.state.paramData.ratingRider : '5.0'}</Text>
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
                                    <Text style={styles.txtMetodo}>{this.state.paramData && this.state.paramData.pagamento.payment_mode ? this.state.paramData.pagamento.payment_mode : 'Indefinido'}</Text>
                                </View>
                                <Text style={styles.txtDinheiro}>R$ {this.state.paramData ? parseFloat(this.state.paramData.pagamento.trip_cost).toFixed(2) : ' 0'}</Text>
                            </View>
                        </View>
                    </View>
                    <View style={{ marginTop: 10 }}>
                        <View style={{ marginLeft: 15 }}>
                            <Text style={styles.txtPagamento}>Detalhes</Text>
                        </View>
                        <View style={{ marginTop: 5, backgroundColor: colors.GREY1, paddingVertical: 20, borderRadius: 15, marginHorizontal: 15, }}>
                            <Text style={styles.itemDetalhes}>Preço da corrida: R$ {this.state.paramData && this.state.paramData.pagamento.trip_cost ? parseFloat(this.state.paramData.pagamento.trip_cost).toFixed(2) : ' 0'}</Text>

                            <Text style={styles.itemDetalhes}>Preço estimado da corrida: R$ {this.state.paramData && this.state.paramData.pagamento.estimate ? parseFloat(this.state.paramData.pagamento.estimate).toFixed(2) : ' 0'}</Text>

                            {this.state.paramData ?
                                (this.state.paramData.pagamento.discount_amount > 0 ?
                                    <Text style={styles.itemDetalhes}>Desconto aplicado: R$ {parseFloat(this.state.paramData.pagamento.discount_amount).toFixed(2)}</Text>
                                    : null)
                                : null}

                            {this.state.paramData ?
                                (this.state.paramData.pagamento.cashPaymentAmount > 0 ?
                                    <Text style={styles.itemDetalhes}>Valor pago dinheiro: R$ {parseFloat(this.state.paramData.pagamento.cashPaymentAmount).toFixed(2)}</Text>
                                    : null)
                                : null}

                            {this.state.paramData ?
                                (this.state.paramData.pagamento.usedWalletMoney > 0 ?
                                    <Text style={styles.itemDetalhes}>Valor pago carteira: R$ {parseFloat(this.state.paramData.pagamento.usedWalletMoney).toFixed(2)}</Text>
                                    : null)
                                : null}

                            {this.state.paramData ?
                                (this.state.paramData.pagamento.customer_paid > 0 ?
                                    <Text style={styles.itemDetalhes}>Pago pelo passageiro: R$ {parseFloat(this.state.paramData.pagamento.customer_paid).toFixed(2)}</Text>
                                    : null)
                                : null}

                            <Text style={styles.itemDetalhes}>Ganho do motorista: R$ {this.state.paramData && this.state.paramData.pagamento.driver_share ? parseFloat(this.state.paramData.pagamento.driver_share).toFixed(2) : ' 0'}</Text>

                            <Text style={styles.itemDetalhes}>Taxa do Colt: R$ {this.state.paramData && this.state.paramData.pagamento.convenience_fees ? parseFloat(this.state.paramData.pagamento.convenience_fees).toFixed(2) : ' 0'}</Text>
                        </View>
                    </View>
                    <View style={styles.viewBtn}>
                        <View style={{ justifyContent: 'flex-end' }}>
                            <TouchableOpacity style={styles.btn} onPress={() => this.setState({ loadingModal: true })}>
                                <Text style={{ fontSize: 16, color: colors.WHITE, fontFamily: 'Inter-Bold' }}>Relatar problema</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
                {this.loading()}
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
        //flex: 2,
        height: 180,
        marginBottom: 15,
    },

    viewEndereco: {
        flex: 2,
        justifyContent: 'center',
    },

    endereco: {
        flex: 1,
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
        height: 120,
        marginBottom: 15,
    },

    viewPassageiro: {
        flex: 0.4,
        justifyContent: 'center',
    },

    txtPassageiro: {
        fontSize: 18,
        marginLeft: 15,
        color: colors.BLACK,
        fontFamily: 'Inter-Bold',
    },

    viewInfoPassageiro: {
        flex: 1,
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
        height: 60,
        width: 60,
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
        height: 110,
        justifyContent: 'center',
    },

    viewPagamento: {
        marginLeft: 15,
    },

    txtPagamento: {
        fontSize: 18,
        color: colors.BLACK,
        fontFamily: 'Inter-Bold',
    },

    viewInfosPgt: {
        flex: 0.7,
        marginHorizontal: 15,
        marginTop: 5,
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
        marginTop: 20,
        paddingBottom: 10,
        justifyContent: 'flex-end',
    },

    btn: {
        height: 60,
        borderRadius: 15,
        marginHorizontal: 15,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.DEEPBLUE,
    },

    itemDetalhes: {
        fontFamily: 'Inter-Regular',
        marginBottom: 5,
        fontSize: 14,
        color: colors.BLACK,
        marginLeft: 15,
    }

});