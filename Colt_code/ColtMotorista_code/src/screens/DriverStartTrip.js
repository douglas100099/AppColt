import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    Modal,
    Image,
    Dimensions,
    AsyncStorage,
    Linking,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
    Platform,
    StatusBar,
} from 'react-native';
import { Icon, Button } from 'react-native-elements';
import Constants from 'expo-constants'
import ActionSheet from 'react-native-actionsheet';
import { colors } from '../common/theme';
import getDirections from 'react-native-google-maps-directions'
import { RequestPushMsg } from '../common/RequestPushMsg';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import * as Permissions from 'expo-permissions';
import { NavigationActions, StackActions } from 'react-navigation';
import * as Location from 'expo-location';
import * as firebase from 'firebase';
import distanceCalc from '../common/distanceCalc';
import languageJSON from '../common/language';
import CellphoneSVG from '../SVG/CellphoneSVG';
import NetInfo from '@react-native-community/netinfo';
import MarkerPicSVG from '../SVG/MarkerPicSVG';
var { width, height } = Dimensions.get('window');
import { google_map_key } from '../common/key';
import dateStyle from '../common/dateStyle';
import * as IntentLauncher from 'expo-intent-launcher';
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
import RadioForm from 'react-native-simple-radio-button';
import * as Animatable from 'react-native-animatable';
import Directions from "../components/Directions";
import customMapStyle from "../../mapstyle.json";
import customMapStyleDark from "../../mapstyleDark.json";

const LATITUDE = 0;
const LONGITUDE = 0;
const LATITUDE_DELTA = 0.0043;
const LONGITUDE_DELTA = 0.0034;
const HEADING = 0;

export default class DriverStartTrip extends React.Component {

    myAbort = new AbortController()
    _isMounted = false;

    constructor(props) {
        super(props);
        this.state = {
            region: {
                latitude: LATITUDE,
                longitude: LONGITUDE,
                latitudeDelta: LATITUDE_DELTA,
                longitudeDelta: LONGITUDE_DELTA,
                angle: HEADING,
            },
            mediaSelectModal: false,
            allData: "",
            inputCode: "",
            coords: [],
            radio_props: [],
            value: 0,
            notificarChegada: false,
            followMap: true,
            fitCordinates: false,
            loader: false,
            modalCancel: false,
            viewInfos: false,
            loaderCancel: false,
            kmRestante: 0,
            tempoRestante: 0,
            isAtrasado: false,
        }
        /*this.checkInternet();*/
    }

    _activate = () => {
        activateKeepAwake();
    };

    _deactivate = () => {
        deactivateKeepAwake();
    };

    /*checkInternet() {
        this.unsubscribe = NetInfo.addEventListener(state => {
            if (state.isConnected) {
                firebase.database().goOnline()
                this.setState({ isConnected: state.isConnected })
                
            } else {
                firebase.database().goOffline()
                this.setState({ isConnected: state.isConnected })
            }
        });
    }*/

    async UNSAFE_componentWillMount() {
        console.log('ENTROU NA TELA START TRIP')
        const allDetails = this.props.navigation.getParam('allDetails')
        console.log(allDetails)
        const regionUser = this.props.navigation.getParam('regionUser') ? this.props.navigation.getParam('regionUser') : null
        this.setState({
            rideDetails: allDetails,
            region: regionUser != null ? regionUser : this.state.region,
            curUid: firebase.auth().currentUser.uid
        }, () => {
            this.checkStatus()
        })
        const { status } = await Permissions.askAsync(Permissions.LOCATION);
        const gpsActived = await Location.hasServicesEnabledAsync()
        if (status === "granted" && gpsActived) {
            this._getLocationAsync();
        } else {
            this.openAlert()
        }
        this._activate();
    }

    componentDidMount() {
        this._isMounted = true
        this.getCancelReasons()
    }

    componentWillUnmount() {
        this.myAbort.abort()
        this._isMounted = false;
        if (this.location != undefined) {
            console.log('REMOVEU O WATCH STARTTRIP')
            this.location.remove()
        }
        //this.unsubscribe();
        console.log('DESMONTOU A TELA START TRIP')
    }

    openAlert() {
        Alert.alert(
            'Localização necessária',
            'Precisamos de sua localização ativa, por favor ative-a em configurações.',
            [{
                text: "Cancelar",
                onPress: () => console.log("Cancel Pressed"),
                style: "cancel"
            },
            { text: 'IR PARA CONFIGURAÇÕES', onPress: () => { IntentLauncher.startActivityAsync(IntentLauncher.ACTION_LOCATION_SOURCE_SETTINGS) } }
            ],
            { cancelable: false }
        );
    }

    _getLocationAsync = async () => {

        this.location = await Location.watchPositionAsync({
            accuracy: Location.Accuracy.Highest,
            distanceInterval: 1,
            timeInterval: 2000
        },
            newLocation => {
                let { coords } = newLocation;
                let region = {
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                    latitudeDelta: 0.0043,
                    longitudeDelta: 0.0034,
                    angle: coords.heading
                }
                if(this._isMounted){
                    this.setState({ region: region });
                    this.setLocationDB(region.latitude, region.longitude, region.angle);
                    //this.checkDistKM();
                }
            },
            error => console.log(error)
        )
        this.updateAdress(region.latitude, region.longitude)
        return this.location
    };

    /*checkDistKM() {
        var location1 = [this.state.region.latitude, this.state.region.longitude];    //Rider Lat and Lang
        var location2 = [this.state.rideDetails.pickup.lat, this.state.rideDetails.pickup.lng];   //Driver lat and lang
        var distance = distanceCalc(location1, location2);
        if(this._isMounted){
            this.setState({ kmRestante: distance })
        }
    }*/

    updateAdress(lat, lng) {
        let uid = firebase.auth().currentUser.uid;
        var latlng = lat + ',' + lng;
        fetch('https://maps.googleapis.com/maps/api/geocode/json?latlng=' + latlng + '&key=' + google_map_key, { signal: this.myAbort.signal })
            .then((response) => response.json())
            .then((responseJson) => {
                if (responseJson.results[0] && responseJson.results[0].formatted_address) {
                    let address = responseJson.results[0].formatted_address;
                    firebase.database().ref('users/' + uid + '/location').update({
                        add: address,
                    });
                }
            }).catch((error) => {
                console.error(error);
            });
    }

    setLocationDB(lat, lng, angle) {
        let uid = firebase.auth().currentUser.uid;
        firebase.database().ref('users/' + uid + '/location').update({
            lat: lat,
            lng: lng,
            angle: angle,
        }).then(() => {
            firebase.database().ref('bookings/' + this.state.rideDetails.bookingId + '/current/').update({
                lat: lat,
                lng: lng,
                angle: angle,
            })
        }).catch((error) => {
            console.error(error);
        });
    }

    checkStatus() {
        let tripRef = firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/my_bookings/' + this.state.rideDetails.bookingId + '/');
        tripRef.on('value', (snap) => {
            let tripData = snap.val();
            if (tripData) {
                if(this._isMounted){
                    this.setState({ status: tripData.status })
                    if (tripData.status == "CANCELLED") {
                        AsyncStorage.getItem('horaEmbarque', (err, result) => {
                            if (result) {
                                AsyncStorage.removeItem('horaEmbarque').then(() => {
                                    this.props
                                        .navigation
                                        .dispatch(StackActions.reset({
                                        index: 0,
                                        actions: [
                                            NavigationActions.navigate({
                                                routeName: 'DriverTripAccept',
                                            }),
                                        ],
                                    }))
                                })
                            } else {
                                firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/emCorrida').remove().then(() => {
                                    this.props
                                        .navigation
                                        .dispatch(StackActions.reset({
                                            index: 0,
                                            actions: [
                                                NavigationActions.navigate({
                                                    routeName: 'DriverTripAccept',
                                                }),
                                            ],
                                        }))
                                    alert('Corrida atual foi cancelada')
                                })
                            }
                        })
                    }
                    if (tripData.status == "EMBARQUE") {
                        AsyncStorage.getItem('horaEmbarque', (err, result) => {
                            if (result) {
                                var horaEmbarqueAsync = result
                                var horaAsycnInt = parseInt(horaEmbarqueAsync)
                                var horaEmbarque = new Date(horaAsycnInt)
                                if (horaEmbarque) {
                                    var somarMin = horaEmbarque.setMinutes(horaEmbarque.getMinutes() + 5)
                                    var horaFim = new Date(somarMin)
                                    var horaFormatada = horaFim.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                                    console.log(horaFormatada)
                                }
                                this.setState({ horaEmbarque: parseInt(horaEmbarqueAsync), horaFim: horaFormatada })
                            } else {
                                var horaEmbarque = new Date().getTime().toString()
                                AsyncStorage.setItem('horaEmbarque', horaEmbarque)
                                var horaAtual = new Date()
                                var somarMin = horaAtual.setMinutes(horaAtual.getMinutes() + 5)
                                var horaFim = new Date(somarMin)
                                var horaFormatada = horaFim.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                                this.setState({ horaEmbarque: parseInt(horaEmbarque), horaFim: horaFormatada })
                                console.log(horaFormatada)
                            }
                        })
                    }
                }
            }
        })
    }

    checkDist(item) {
        if(this._isMounted){
            this.setState({ allData: item, loader: true },
                () => {
                    var location1 = [this.state.region.latitude, this.state.region.longitude];    //Rider Lat and Lang
                    var location2 = [this.state.rideDetails.pickup.lat, this.state.rideDetails.pickup.lng];   //Driver lat and lang
                    //calculate the distance of two locations
                    var distance = distanceCalc(location1, location2);
                    var originalDistance = (distance);
                    if (originalDistance <= 0.8) {
                        //this.onPressStartTrip(this.state.allData)
                        this.embarque();
                    } else {
                        this.showActionSheet()
                    }
                })
        }
    }

    //start trip button press function
    onPressStartTrip(item) {
        NetInfo.fetch().then(state => {
            if(state.isConnected){
                if(this._isMounted){
                    this.setState({ allData: item }, () => {
                        console.log(this.state.allData);
                        if (this.state.allData.otp) {
                            this.setState({ mediaSelectModal: true })
                        } else {
                            this.codeEnter(false, this.state.allData.otp);
                        }
                        //this.setState({mediaSelectModal:true})
                    });
                }
            } else {
                Alert.alert(
                    "Problema ao iniciar corrida",
                    "Houve um problema ao iniciar sua corrida, verifique o status de conexão com a internet.",
                    [
                        { text: "OK", onPress: () => console.log("OK Pressed") }
                    ],
                    { cancelable: false }
                )
            }
        })
    }

    showActionSheet = () => {
        this.ActionSheet.show()
    }

    closeModal() {
        this.setState({ mediaSelectModal: false })
    }

    chat() {
        if(this._isMounted){
            this.setState({ viewInfos: false })
        }
        this.props.navigation.navigate("Chat", { passData: this.state.rideDetails });
    }

    callToCustomer(data) {
        if (data.customer) {
            this.setState({ viewInfos: false })
            const cusData = firebase.database().ref('users/' + data.customer);
            cusData.once('value', customerData => {
                if (customerData.val() && customerData.val().mobile) {
                    var customerPhoneNo = customerData.val().mobile
                    Linking.canOpenURL('tel:' + customerPhoneNo).then(supported => {
                        if (!supported) {
                            console.log('Can\'t handle Phone Number: ' + customerPhoneNo);
                        } else {
                            return Linking.openURL('tel:' + customerPhoneNo);
                        }
                    }).catch(err => {
                        console.error('An error occurred', err)
                        alert('Ops, tivemos um problema.')
                    });
                } else {
                    alert(languageJSON.mobile_no_found)
                }
            })
        }

    }
    //Promo code enter function
    codeEnter(codeRequired, inputCode) {
        if (codeRequired && (inputCode == "" || inputCode == undefined || inputCode == null)) {
            alert("Please enter OTP");
        } else {
            if (this.state.allData) {
                if ((codeRequired && inputCode == this.state.allData.otp) || !codeRequired) {

                    var data = {
                        status: "START",
                        pagamento: {
                            estimate: this.state.allData.pagamento.estimate,
                            trip_cost: this.state.allData.pagamento.trip_cost,
                            payment_mode: this.state.allData.pagamento.payment_mode,
                            cashPaymentAmount: this.state.allData.pagamento.cashPaymentAmount,
                            usedWalletMoney: this.state.allData.pagamento.usedWalletMoney,
                            discount_amount: this.state.allData.pagamento.discount_amount,
                            promoCodeApplied: this.state.allData.pagamento.promoCodeApplied,
                            promoKey: this.state.allData.pagamento.promoKey,
                            payment_status: 'DUE',
                            cancellValue: this.state.allData.pagamento.cancellValue,
                        },
                        trip_start_time: new Date().toLocaleTimeString(dateStyle),
                    }

                    var riderData = {
                        status: "START",
                        pagamento: {
                            estimate: this.state.allData.pagamento.estimate,
                            trip_cost: this.state.allData.pagamento.trip_cost,
                            payment_mode: this.state.allData.pagamento.payment_mode,
                            cashPaymentAmount: this.state.allData.pagamento.cashPaymentAmount,
                            usedWalletMoney: this.state.allData.pagamento.usedWalletMoney,
                            discount_amount: this.state.allData.pagamento.discount_amount,
                            promoCodeApplied: this.state.allData.pagamento.promoCodeApplied,
                            promoKey: this.state.allData.pagamento.promoKey,
                            payment_status: 'DUE',
                        },
                        trip_start_time: new Date().toLocaleTimeString(dateStyle),
                    }

                    let dbRef = firebase.database().ref('users/' + this.state.curUid + '/my_bookings/' + this.state.allData.bookingId + '/');
                    dbRef.update(data).then(() => {
                        firebase.database().ref('bookings/' + this.state.allData.bookingId + '/').update(data).then(() => {
                            let userDbRef = firebase.database().ref('users/' + this.state.allData.customer + '/my-booking/' + this.state.allData.bookingId + '/');
                            userDbRef.update(riderData).then(() => {
                                this.closeModal();
                                let startTime = new Date().getTime().toString();
                                AsyncStorage.setItem('startTime', startTime);
                                this.setState({ notificarChegada: false })
                                this.setState({ loader: false })
                                AsyncStorage.removeItem('horaEmbarque')
                                this.props.navigation.replace('DriverTripComplete', { allDetails: this.state.allData, startTime: startTime, regionUser: this.state.region });
                                this.sendPushNotification2(this.state.allData.customer, 'O motorista iniciou sua corrida.');
                            })
                        })
                    })

                } else {
                    alert(languageJSON.otp_error);
                }

            }
        }

    }

    sendPushNotification2(customerUID, msg) {
        const customerRoot = firebase.database().ref('users/' + customerUID);
        customerRoot.once('value', customerData => {
            if (customerData.val()) {
                let allData = customerData.val()
                RequestPushMsg(allData.pushToken ? allData.pushToken : null, msg)
            }
        })
    }

    animateToDestination() {
        if(this._isMounted){
            this.setState({ fitCordinates: true, followMap: false })
            setTimeout(() => {
                this.map.fitToCoordinates([{ latitude: this.state.region.latitude, longitude: this.state.region.longitude }, { latitude: this.state.rideDetails.pickup.lat, longitude: this.state.rideDetails.pickup.lng }], {
                    edgePadding: { top: 80, right: 65, bottom: 50, left: 50 },
                    animated: true,
                })
            }, 200);
        }
    }

    centerFollowMap() {
        if(this._isMounted){
            this.map.animateToRegion(this.state.region, 500)
            setTimeout(() => { this.setState({ followMap: true, fitCordinates: false }) }, 1100)
        }
    }

    checkMap() {
        if (this.state.followMap) {
            return this.state.region;
        }
    }

    handleGetDirections() {
        const data = {
            source: {
                latitude: this.state.region.latitude,
                longitude: this.state.region.longitude
            },
            destination: {
                latitude: this.state.rideDetails.pickup.lat,
                longitude: this.state.rideDetails.pickup.lng
            },
            params: [
                {
                    key: "travelmode",
                    value: "driving"        // may be "walking", "bicycling" or "transit" as well
                },
                {
                    key: "dir_action",
                    value: "navigate"       // this instantly initializes navigation using the given travel mode
                }
            ],
        }

        getDirections(data)
    }

    embarque() {
        NetInfo.fetch().then(state => {
            if(state.isConnected){
                // ATUALIZANDO STATUS BOOKINGS
                firebase.database().ref(`bookings/` + this.state.allData.bookingId + '/').update({
                    status: 'EMBARQUE',
                }).then(() => {
                    // ATUALIZANDO STATUS DRIVER
                    firebase.database().ref(`/users/` + this.state.curUid + '/my_bookings/' + this.state.allData.bookingId + '/').update({
                        status: 'EMBARQUE',
                    })
                }).then(() => {
                    // ATUALIZANDO STATUS RIDER
                    firebase.database().ref(`/users/` + this.state.rideDetails.customer + '/my-booking/' + this.state.allData.bookingId + '/').update({
                        status: 'EMBARQUE',
                    })
                    this.sendPushNotification2(this.state.rideDetails.customer, 'O motorista chegou ao local de embarque.')
                    if(this._isMounted){
                        this.setState({ loader: false })
                    }
                })
            } else {
                Alert.alert(
                    "Problema ao sinalizar embarque",
                    "Houve um problema ao sinalizar seu embarque, verifique o status de conexão com a internet.",
                    [
                        { text: "OK", onPress: () => console.log("OK Pressed") }
                    ],
                    { cancelable: false }
                )
                this.setState({ loader: false })
            }
        })
    }

    getCancelReasons() {
        const reasonListPath = firebase.database().ref('/cancel_reason_driver/');
        reasonListPath.once('value', reasons => {
            if (reasons.val()) {
                this.setState({
                    radio_props: reasons.val()
                })
            }
        })
    }

    checkTime = async () => {
        this.setState({ loaderCancel: true })
        try {
            let endTimeEmbarque = new Date().getTime();
            await AsyncStorage.getItem('horaEmbarque', (err, resultt) => {
                if (resultt) {
                    let resultStart = parseInt(resultt)
                    let resultEnd = endTimeEmbarque
                    let result = resultEnd - resultStart
                    console.log(result / 60000)
                    if (parseInt(result / 60000) < 1) {
                        firebase.database().ref(`/users/` + this.state.curUid + '/in_reject_progress').update({
                            punido: false,
                        }).then(() => {
                            firebase.database().ref(`/users/` + this.state.curUid + '/').update({ driverActiveStatus: false })
                        }).then(() => this.onCancelConfirm())
                    } else {
                        this.onCancelConfirm()
                    }
                } else {
                    firebase.database().ref(`/users/` + this.state.curUid + '/in_reject_progress').update({
                        punido: false,
                    }).then(() => {
                        firebase.database().ref(`/users/` + this.state.curUid + '/').update({ driverActiveStatus: false })
                    }).then(() => this.onCancelConfirm())
                }
            })
        } catch (error) {
            console.log(error)
            alert('Ops, tivemos um problema')
        }
    }

    onCancelConfirm() {
        firebase.database().ref(`bookings/` + this.state.rideDetails.bookingId + '/').update({
            status: 'CANCELLED',
        })
        firebase.database().ref(`/users/` + this.state.curUid + '/my_bookings/' + this.state.rideDetails.bookingId + '/').update({
            status: 'CANCELLED',
            reason: this.state.radio_props[this.state.value].label
        }).then(() => {
            this.setState({ modalCancel: false })
            firebase.database().ref(`/users/` + this.state.rideDetails.customer + '/my-booking/' + this.state.rideDetails.bookingId + '/').update({
                status: 'CANCELLED',
                reason: this.state.radio_props[this.state.value].label,
                cancelledByDriver: true,
            }).then(() => {
                firebase.database().ref(`/users/` + this.state.curUid + '/emCorrida').remove()
            }).then(() => {
                firebase.database().ref(`/users/` + this.state.curUid + '/').update({
                    queue: false
                })
            })
        })
        this.setState({ loaderCancel: false })
        this.sendPushNotification2(this.state.rideDetails.customer, 'O motorista cancelou a corrida atual!')
    }

    dissMissCancel() {
        this.setState({ modalCancel: false })
    }

    mapStyle(){
        var dataAgr = new Date().getHours()
        if(dataAgr >= 0 && dataAgr <= 5 || dataAgr >= 18 && dataAgr <= 23){
            this.colorStatus = 'light-content'
            return customMapStyleDark
        } else {
            this.colorStatus = 'dark-content'
            return customMapStyle
        }
    }

    viewInfos() {
        return (
            <Modal
                animationType='slide'
                transparent={true}
                visible={this.state.viewInfos}
                onRequestClose={() => {
                    this.setState({ viewInfos: false })
                }}>
                <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: colors.GREY.background }}>
                    <View style={{ flex: 0.4, borderRadius: 25, marginBottom: 10, }}>
                        <View style={styles.viewEndereco}>
                            <TouchableOpacity
                                style={{ height: 50, width: 50, borderRadius: 100, top: -25, position: 'absolute', justifyContent: 'center', alignSelf: 'center', alignItems: 'center', backgroundColor: colors.WHITE, elevation: 3 }}
                                onPress={() => this.setState({ viewInfos: false })}
                            >
                                <Icon
                                    name='arrow-down'
                                    type='feather'
                                    size={32}
                                    color={colors.BLACK}
                                />
                            </TouchableOpacity>
                            <View style={styles.viewPartidaEndereco}>
                                <View style={{ width: 8, height: 8, borderRadius: 8, backgroundColor: colors.DEEPBLUE, marginRight: 5, marginLeft: 5 }}></View>
                                <Text style={styles.TxtEnderecoPartida}>{this.state.rideDetails.pickup.add}</Text>
                            </View>
                            <View style={styles.viewDestinoEndereco}>
                                <View style={{ width: 8, height: 8, borderRadius: 8, backgroundColor: colors.RED, marginRight: 5, marginLeft: 5 }}></View>
                                <Text style={styles.TxtEnderecoDestino}>{this.state.rideDetails.drop.add}</Text>
                            </View>
                            <Text style={{ color: colors.WHITE, fontFamily: 'Inter-Bold', fontSize: 14, textAlign: 'center', backgroundColor: colors.DEEPBLUE, borderBottomLeftRadius: 10,borderBottomRightRadius: 10, padding: 3 }}>Valor estimado: R$ {this.state.rideDetails.pagamento.estimate}</Text>
                        </View>
                        <View style={styles.viewIcones}>
                            <View style={{ flex: 1 }}>
                                <TouchableOpacity
                                    style={styles.btnLigar}
                                    onPress={() => this.callToCustomer(this.state.rideDetails)}
                                >
                                    <Icon
                                        name="phone-call"
                                        type="feather"
                                        size={30}
                                        color={colors.BLACK}
                                    />
                                </TouchableOpacity>
                            </View>

                            <View style={{ flex: 1 }}>
                                <TouchableOpacity
                                    style={styles.btnLigar}
                                    onPress={() => this.chat()}
                                >
                                    <Icon
                                        name="message-circle"
                                        type="feather"
                                        size={30}
                                        color={colors.BLACK}
                                    />
                                </TouchableOpacity>
                            </View>

                            <View style={{ flex: 1 }}>
                                <TouchableOpacity
                                    style={styles.btnLigar}
                                    onPress={() => this.setState({ modalCancel: true, viewInfos: false, })}
                                >
                                    <Icon
                                        name="x"
                                        type="feather"
                                        size={30}
                                        color={colors.RED}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        )
    }

    cancelModal() {
        return (
            <Modal
                animationType='fade'
                transparent={true}
                visible={this.state.modalCancel}
                onRequestClose={() => {
                    this.setState({ modalCancel: false })
                }}>
                <View style={styles.cancelModalContainer}>
                    <View style={styles.cancelModalInnerContainer}>

                        <View style={styles.cancelContainer}>
                            <View style={styles.cancelReasonContainer}>
                                <Text style={styles.cancelReasonText}>Qual o motivo do cancelamento?</Text>
                            </View>

                            <View style={styles.radioContainer}>
                                <RadioForm
                                    radio_props={this.state.radio_props ? this.state.radio_props : null}
                                    initial={5}
                                    animation={true}
                                    buttonColor={colors.GREY2}
                                    selectedButtonColor={colors.DEEPBLUE}
                                    buttonSize={10}
                                    buttonOuterSize={20}
                                    style={styles.radioContainerStyle}
                                    labelStyle={styles.radioText}
                                    radioStyle={styles.radioStyle}
                                    onPress={(value) => { this.setState({ value: value }) }}
                                />
                            </View>
                            <View style={styles.cancelModalButtosContainer}>
                                <Button
                                    title='Não cancelar'
                                    titleStyle={styles.signInTextStyle}
                                    onPress={() => { this.dissMissCancel() }}
                                    disabled={this.state.loaderCancel}
                                    loading={this.state.loaderCancel}
                                    buttonStyle={styles.cancelModalButttonStyle}
                                    containerStyle={styles.cancelModalButtonContainerStyle}
                                />

                                <View style={styles.buttonSeparataor} />

                                <Button
                                    title='OK'
                                    titleStyle={styles.signInTextStyle}
                                    onPress={() => { this.checkTime() }}
                                    disabled={this.state.loaderCancel}
                                    loading={this.state.loaderCancel}
                                    buttonStyle={styles.cancelModalButttonStyle2}
                                    containerStyle={styles.cancelModalButtonContainerStyle}
                                />
                            </View>

                        </View>


                    </View>
                </View>

            </Modal>
        )
    }

    render() {
        return (
            <View style={styles.containerView}>
            <StatusBar barStyle={this.colorStatus ? this.colorStatus : 'default'} translucent backgroundColor={colors.TRANSPARENT}/>
                <View>
                    <ActionSheet
                        ref={o => this.ActionSheet = o}
                        style={styles}
                        title={<Text style={{ color: colors.BLACK, fontSize: 20, fontFamily: 'Inter-Bold' }}>Passageiro distante</Text>}
                        message={<Text style={{ color: colors.BLACK, fontSize: 14, fontFamily: 'Inter-Regular', textAlign: 'center' }}>Você está distante do passageiro, tem certeza que deseja iniciar corrida?</Text>}
                        options={['Continuar', 'Voltar']}
                        cancelButtonIndex={1}
                        destructiveButtonIndex={0}
                        onPress={(index) => {
                            if (index == 0) {
                                this.embarque()
                            } else {
                                this.setState({ loader: false })
                            }
                        }}
                    />
                </View>

                {/* MAPA VIEW AQUI */}

                <View style={styles.viewMap}>
                    <MapView
                        ref={map => { this.map = map }}
                        style={styles.map}
                        rotateEnabled={false}
                        provider={PROVIDER_GOOGLE}
                        showsUserLocation={false}
                        showsCompass={false}
                        customMapStyle={this.mapStyle()}
                        showsScale={false}
                        loadingEnabled
                        showsMyLocationButton={false}
                        region={this.checkMap()}
                    >
                        {/* O RABO DE SETA ESTAVA AQUI, PROBLEMA ENCONTRADO DO MODO PRODUÇÃO, MARKER NO AIRMAP */}
                        <Marker.Animated
                            coordinate={{ latitude: this.state.region ? this.state.region.latitude : 0.00, longitude: this.state.region ? this.state.region.longitude : 0.00 }}
                            style={{ transform: [{ rotate: this.state.region.angle ? this.state.region.angle + "deg" : '0' + "deg"}] }}
                            anchor={{ x: 0.5, y: 0.5 }}
                        >
                            <CellphoneSVG
                                width={40}
                                height={40}
                            />
                        </Marker.Animated>
                        <Marker.Animated
                            coordinate={{ latitude: this.state.rideDetails.pickup.lat, longitude: this.state.rideDetails.pickup.lng, }}
                            anchor={{ x: 0.5, y: 1 }}
                        >
                            <MarkerPicSVG
                                width={40}
                                height={40}
                            />
                        </Marker.Animated>
                        <Directions
                            origin={{ latitude: this.state.region.latitude, longitude: this.state.region.longitude }}
                            destination={{ latitude: this.state.rideDetails.pickup.lat, longitude: this.state.rideDetails.pickup.lng }}
                            onReady={result => {this.setState({ kmRestante: result.distance, tempoRestante: result.duration })}}
                        />
                    </MapView>
                    <View style={{ position: 'absolute', alignSelf: 'center',top: Constants.statusBarHeight + 3, height: 70, width: width/1.2, backgroundColor: colors.WHITE, elevation: 4, borderTopLeftRadius: 15, borderTopRightRadius: 15}}>
                        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                <Text style={{ textAlign: 'center', color: colors.BLACK, fontSize: 14, fontFamily: 'Inter-Regular' }}>{this.state.rideDetails.pickup.add}</Text>
                            </View>
                            <View style={{ borderWidth: 0.6, borderColor: colors.GREY1, height: 70, width: 1 }}></View>
                            <View style={{ flex: 0.2, justifyContent: 'center', alignItems: 'center' }}>
                                <TouchableOpacity onPress={() => { this.handleGetDirections() }}>
                                <Icon
                                    name="navigation"
                                    type="feather"
                                    size={30}
                                    color={colors.BLACK}
                                    iconStyle={{ marginTop: 2, marginRight: 2 }}
                                />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: colors.WHITE, borderBottomLeftRadius: 15, borderBottomRightRadius: 15, borderTopWidth: 1, borderTopColor: colors.DEEPBLUE,height: 30  }}>
                            <View style={{ flex: 1, flexDirection: 'row' }}>
                                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                    <Text style={{ fontFamily: 'Inter-Bold', fontSize: 15, color: colors.DEEPBLUE }}>{parseInt(this.state.tempoRestante)} Min.</Text>
                                </View>
                                <View style={{ borderWidth: 0.6, borderColor: colors.GREY1, height: 29, width: 1 }}></View>
                                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                    <Text style={{ fontFamily: 'Inter-Bold', fontSize: 15, color: colors.DEEPBLUE }}>{parseFloat(this.state.kmRestante).toFixed(2)} KM</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.iconeMap} onPress={() => { this.centerFollowMap() }}>
                        <Icon
                            name="crosshair"
                            type="feather"
                            size={30}
                            color={colors.BLACK}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconeFit} onPress={() => { this.animateToDestination() }}>
                        <Icon
                            name="map-pin"
                            type="feather"
                            size={30}
                            color={colors.BLACK}
                        />
                    </TouchableOpacity>
                    {!this.state.viewInfos ?
                        <TouchableOpacity style={styles.iconeChat} onPress={() => this.chat()}>
                            <Icon
                                name="message-circle"
                                type="feather"
                                size={30}
                                color={colors.BLACK}
                            />
                        </TouchableOpacity>
                        : null}
                    {this.state.status != 'ACCEPTED' ?
                        <Animatable.View animation='fadeInLeft' useNativeDriver={true} style={styles.alertView}>
                            {this.state.isAtrasado == false ?
                                <Text style={styles.txtAlert}>Informamos de sua chegada, aguarde até {this.state.horaFim}.</Text>
                                :
                                <Text style={styles.txtAlert2}>Passageiro atrasado, cancelamento sem punição.</Text>
                            }
                        </Animatable.View>
                        : null}
                </View>

                {/* MODAL DOS DETALHES AQUI */}

                <View style={styles.viewDetails}>

                    <View style={styles.viewPhotoName}>
                        <View style={styles.viewPhoto}>
                            <Image source={this.state.rideDetails.imageRider ? { uri: this.state.rideDetails.imageRider } : require('../../assets/images/profilePic.png')} style={styles.fotoPassageiro} />
                            <Text style={styles.nomePassageiro}>{this.state.rideDetails.firstNameRider}</Text>
                        </View>
                        <View style={{ position: 'absolute', top: -25, right: 5, left: 0, bottom: 0 }}>
                            <View style={{ height: 55, width: 55, borderRadius: 100, backgroundColor: colors.WHITE, elevation: 2, alignItems: 'center', alignSelf: 'center', justifyContent: 'center' }}>
                                {this.state.viewInfos ? null :
                                    <TouchableOpacity
                                        style={{ height: 55, width: 55, borderRadius: 100, justifyContent: 'center', alignItems: 'center' }}
                                        onPress={() => this.setState({ viewInfos: true })}
                                    >
                                        <Icon
                                            name='arrow-up'
                                            type='feather'
                                            size={32}
                                            color={colors.BLACK}
                                        />
                                    </TouchableOpacity>
                                }
                            </View>
                        </View>
                    </View>


                    {/*<View style={styles.viewEndereco}>
                            <View style={styles.viewPartidaEndereco}>
                                <View style={{ width: 8, height: 8, borderRadius: 8, backgroundColor: colors.DEEPBLUE, marginRight: 5, marginLeft: 5 }}></View>
                                <Text style={styles.TxtEnderecoPartida}>{this.state.rideDetails.pickup.add}</Text>
                            </View>
                            <View style={styles.viewDestinoEndereco}>
                                <View style={{ width: 8, height: 8, borderRadius: 8, backgroundColor: colors.RED, marginRight: 5, marginLeft: 5 }}></View>
                                <Text style={styles.TxtEnderecoDestino}>{this.state.rideDetails.drop.add}</Text>
                            </View>
                        </View>*/}

                    {/*<View style={styles.viewIcones}>
                            <View style={{ flex: 1 }}>
                                <TouchableOpacity
                                    style={styles.btnLigar}
                                    onPress={() => this.callToCustomer(this.state.rideDetails)}
                                >
                                    <Icon
                                        name="phone-call"
                                        type="feather"
                                        size={30}
                                        color={colors.BLACK}
                                    />
                                </TouchableOpacity>
                            </View>

                            <View style={{ flex: 1 }}>
                                <TouchableOpacity
                                    style={styles.btnLigar}
                                    onPress={() => this.chat()}
                                >
                                    <Icon
                                        name="message-circle"
                                        type="feather"
                                        size={30}
                                        color={colors.BLACK}
                                    />
                                </TouchableOpacity>
                            </View>

                            <View style={{ flex: 1 }}>
                                <TouchableOpacity
                                    style={styles.btnLigar}
                                    onPress={() => this.setState({ modalCancel: true })}
                                >
                                    <Icon
                                        name="x"
                                        type="feather"
                                        size={30}
                                        color={colors.RED}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>*/}
                    <View style={{ flex: 1 }}>
                        {this.state.status == 'ACCEPTED' ?
                            <TouchableOpacity style={{ backgroundColor: colors.DEEPBLUE, position: 'absolute', right: 0, left: 0, bottom: 0, top: 0, alignItems: 'center', justifyContent: "center" }}
                                onPress={() => {
                                    this.checkDist(this.state.rideDetails)
                                }}
                                disabled={this.state.loader}
                            >
                                <Text style={{ fontSize: 16, fontFamily: 'Inter-Bold', color: colors.WHITE }}>Cheguei ao local</Text>
                                <ActivityIndicator animating={this.state.loader} size="large" color={colors.WHITE} style={{ position: 'absolute', right: 25 }} />
                            </TouchableOpacity>
                            : null}
                        {this.state.status != 'ACCEPTED' ?
                            <TouchableOpacity style={{ backgroundColor: colors.DEEPBLUE, position: 'absolute', right: 0, left: 0, bottom: 0, top: 0, alignItems: 'center', justifyContent: "center" }}
                                onPress={() => {
                                    this.onPressStartTrip(this.state.rideDetails)
                                }}
                                disabled={this.state.loader}
                            >
                                <Text style={{ fontSize: 16, fontFamily: 'Inter-Bold', color: colors.WHITE }}>Iniciar a corrida</Text>
                                <ActivityIndicator animating={this.state.loader} size="large" color={colors.WHITE} style={{ position: 'absolute', right: 25 }} />
                            </TouchableOpacity>
                            : null}
                    </View>
                </View>
                {this.viewInfos()}
                {
                    this.cancelModal()
                }
            </View>
        );
    }
}

//Screen Styling
const styles = StyleSheet.create({
    containerView: {
        flex: 1,
        //backgroundColor: colors.WHITE,
        //marginTop: StatusBar.currentHeight
    },

    viewMap: {
        flex: 2.4
    },

    viewDetails: {
        backgroundColor: colors.WHITE,
        flex: 0.4,
    },

    viewPhotoName: {
        flex: 0.7,
        flexDirection: 'row',
        marginLeft: 12,
        justifyContent: 'space-between',
        alignItems: 'center'
    },

    fotoPassageiro: {
        width: 32,
        height: 32,
        borderRadius: 50,
    },

    viewPhoto: {
        paddingRight: 10,
        height: 32,
        borderRadius: 50,
        flexDirection: 'row',
        alignItems: 'center',
    },

    nomePassageiro: {
        fontFamily: 'Inter-SemiBold',
        marginLeft: 5,
        fontSize: 13,

        color: colors.BLACK,
    },

    viewEndereco: {
        flex: 2,
        borderWidth: 0.6,
        borderColor: colors.GREY1,
        backgroundColor: colors.WHITE,
        borderRadius: 15,
        marginHorizontal: 10,
    },

    viewPartidaEndereco: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 15,
        marginHorizontal: 10,
    },

    TxtEnderecoPartida: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 14,
        color: colors.BLACK
    },

    viewDestinoEndereco: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 10,
    },

    TxtEnderecoDestino: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 14,
        color: colors.BLACK
    },

    viewIcones: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.WHITE,
        borderRadius: 15,
        marginHorizontal: 10,
    },

    btnLigar: {
        height: 60,
        width: 60,
        backgroundColor: colors.WHITE,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        elevation: 5
    },

    viewButton: {
        flex: 0.5
    },

    btnEmbarque: {
        flex: 1,
        position: 'absolute',
        height: 60,
        bottom: 0,
        right: 0,
        left: 0,
        backgroundColor: colors.DEEPBLUE,
        justifyContent: 'center',
        alignItems: 'center'
    },

    txtBtn: {
        fontSize: 16,
        color: colors.WHITE,
        fontFamily: 'Inter-Bold',
    },

    iconeMap: {
        height: 45,
        width: 45,
        borderRadius: 50,
        position: 'absolute',
        backgroundColor: colors.WHITE,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        bottom: 65,
        right: 22,
    },

    iconeFit: {
        height: 45,
        width: 45,
        borderRadius: 50,
        position: 'absolute',
        backgroundColor: colors.WHITE,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        bottom: 125,
        right: 22,
    },

    iconeNav: {
        height: 45,
        width: 45,
        borderRadius: 50,
        position: 'absolute',
        backgroundColor: colors.WHITE,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        top: 40,
        right: 22,
    },

    iconeChat: {
        height: 45,
        width: 45,
        borderRadius: 50,
        position: 'absolute',
        backgroundColor: colors.WHITE,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        bottom: 65,
        left: 22,
    },

    alertView: {
        height: 30,
        position: 'absolute',
        marginHorizontal: 15,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.WHITE,
        borderRadius: 10,
        elevation: 2,
        bottom: 30,
        right: 0,
        left: 0,
    },

    txtAlert: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 12,
        color: colors.DEEPBLUE,
    },
    txtAlert2: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 12,
        color: colors.RED,
    },

    textContainer: {
        textAlign: "center",
        fontSize: 16.2,
        color: colors.BLUE.dark,
        fontFamily: 'Roboto-Medium',
        lineHeight: 22
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
    segment1: {
        width: '97.4%',
        flex: 1,
        justifyContent: 'center',
        borderRadius: 10,
        backgroundColor: colors.WHITE,
        marginLeft: 5,
        marginRight: 5,
        marginTop: 5,
        paddingTop: 12,
        paddingBottom: 12,
        paddingRight: 8,
        paddingLeft: 8
    },
    segment2: {
        flex: 7.5,
        width: '100%',
        alignSelf: 'center',
        backgroundColor: colors.WHITE,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden'
    },
    riderText: { alignSelf: "flex-start", fontSize: 14, color: colors.BLACK, fontFamily: 'Inter-Bold' },
    segment3: {
        flex: 2.5,
        backgroundColor: colors.WHITE,
    },
    map: {
        flex: 1,
        ...StyleSheet.absoluteFillObject,
    },
    innerContainerStyles: {
        marginLeft: 10,
        marginRight: 10
    },
    segment3Style: {
        flex: 0.5,
        flexDirection: 'row',
        alignItems: 'center'
    },
    segView: {
        marginLeft: 12,
    },
    riderTextStyle: {
        paddingLeft: 15
    },
    newViewStyle: {
        width: '100%',
        height: 1,
        backgroundColor: colors.GREY.secondary
    },
    fixContenStyle: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    myButtonStyle: {
        backgroundColor: colors.GREEN.default,
        width: width - 40,
        padding: 8,
        borderColor: colors.TRANSPARENT,
        borderWidth: 0,
        borderRadius: 5,
        elevation: 0,
        marginTop: 4
    },
    floatButtonStyle: {
        borderWidth: 1,
        borderColor: colors.BLACK,
        alignItems: "center",
        justifyContent: "center",
        width: 60,
        position: "absolute",
        bottom: 10,
        right: 10,
        height: 60,
        backgroundColor: colors.BLACK,
        borderRadius: 30
    },
    CallfloatButtonStyle: {
        borderWidth: 1,
        borderColor: colors.BLACK,
        alignItems: "center",
        justifyContent: "center",
        width: 60,
        position: "absolute",
        bottom: 80,
        right: 10,
        height: 60,
        backgroundColor: colors.BLACK,
        borderRadius: 30
    },
    //cancel modal
    cancelModalContainer: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: colors.GREY.background
    },
    cancelModalInnerContainer: {
        height: 430,
        width: width * 0.85,
        padding: 0,
        backgroundColor: colors.WHITE,
        alignItems: 'center',
        alignSelf: 'center',
        borderRadius: 15
    },
    cancelContainer: {
        flex: 1,
        justifyContent: 'space-between',
        width: (width * 0.85)
    },
    cancelReasonContainer: {
        flex: 1.5
    },
    cancelReasonText: {
        top: 10,
        color: colors.BLACK,
        fontFamily: 'Inter-Bold',
        fontSize: 20,
        alignSelf: 'center'
    },
    radioContainer: {
        flex: 7,
        alignItems: 'flex-start'
    },
    radioText: {
        fontSize: 15,
        fontFamily: 'Inter-Medium',
        color: colors.DARK,
    },
    radioContainerStyle: {
        paddingTop: 30,
        marginLeft: 20
    },
    radioStyle: {
        paddingBottom: 25
    },
    cancelModalButtosContainer: {
        flexDirection: 'row',
        backgroundColor: colors.GREY.WHITE,
        alignItems: 'flex-end',
        justifyContent: 'flex-end'
    },
    buttonSeparataor: {
        height: height / 35,
        width: 0.5,
        backgroundColor: colors.WHITE,
        alignItems: 'center',
        marginTop: 3
    },
    cancelModalButttonStyle: {
        backgroundColor: colors.DEEPBLUE,
        borderBottomLeftRadius: 15
    },
    cancelModalButttonStyle2: {
        backgroundColor: colors.DEEPBLUE,
        borderBottomRightRadius: 15
    },
    cancelModalButtonContainerStyle: {
        flex: 1,
        width: (width * 2) / 2,
        backgroundColor: colors.GREY.iconSecondary,
        alignSelf: 'center',
        margin: 0
    },
});