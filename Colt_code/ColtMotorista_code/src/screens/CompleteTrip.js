import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    ActivityIndicator,
    FlatList,
    TouchableOpacity,
    AsyncStorage,
    Image,
    Modal,
    Dimensions,
    Alert,
    StatusBar,
} from 'react-native';
import { Button, Icon } from 'react-native-elements';
import NetInfo from '@react-native-community/netinfo';
import { colors } from '../common/theme';
import * as firebase from 'firebase'
import Constants from 'expo-constants'
import { farehelper } from '../common/fareCalculator';
import ActionSheet, { ActionSheetCustom } from 'react-native-actionsheet';
import Polyline from '@mapbox/polyline';
import distanceCalc from '../common/distanceCalc';
import * as Location from 'expo-location';
import getDirections from 'react-native-google-maps-directions'
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import * as Permissions from 'expo-permissions';
import { RequestPushMsg } from '../common/RequestPushMsg';
import { google_map_key } from '../common/key';
import dateStyle from '../common/dateStyle';
import CellphoneSVG from '../SVG/CellphoneSVG';
import MarkerDropSVG from '../SVG/MarkerDropSVG';
import MarkerPicSVG from '../SVG/MarkerPicSVG';
import IconCloseSVG from '../SVG/IconCloseSVG';
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
import * as Animatable from 'react-native-animatable';
import { Audio } from 'expo-av';
import * as Linking from 'expo-linking';
import Directions from "../components/Directions";
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { getPixelSize } from '../constants/utils';
import customMapStyle from "../../mapstyle.json";
import customMapStyleDark from "../../mapstyleDark.json";
var { width, height } = Dimensions.get('window');

const LATITUDE = 0;
const LONGITUDE = 0;
const LATITUDE_DELTA = 0.0043;
const LONGITUDE_DELTA = 0.0034;
const HEADING = 0;


export default class DriverCompleteTrip extends React.Component {

    myAbort = new AbortController()
    _isMounted = false;

    constructor(props) {
        super(props);
        this.state = {
            coords: [],
            loadingModal: false,
            region: {
                latitude: LATITUDE,
                longitude: LONGITUDE,
                latitudeDelta: LATITUDE_DELTA,
                longitudeDelta: LONGITUDE_DELTA,
                angle: HEADING,
            },
            followMap: true,
            kmRestante: 0,
            tempoRestante: 0,
            distance: 0,
            acceptBtnDisable: false,
            tasklist: [],
            chegouCorridaQueue: false,
            loader: false,
            duration: null,
            isSound: false,
            recalculou: false,
            objectQueue: false,
            timeoutCenter: null,
            statusConexao: false,
            waypoint: "",
            loaderWaypoint: false,
        }
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
        const allDetails = this.props.navigation.getParam('allDetails')
        const regionUser = this.props.navigation.getParam('regionUser') ? this.props.navigation.getParam('regionUser') : null
        this.setState({
            rideDetails: allDetails,
            region: regionUser,
            curUid: firebase.auth().currentUser.uid
        }, () => {
            //checking status
            this.checking()
        })
        const { status } = await Permissions.askAsync(Permissions.LOCATION);
        const gpsActived = await Location.hasServicesEnabledAsync()
        if (status === "granted" && gpsActived) {
            this._getLocationAsync();
        } else {
            this.setState({ error: "Locations services needed" });
            this.openAlert()
        }
        this.checkWaypoint();
    }

    getRidersQueue() {
        var curuid = firebase.auth().currentUser.uid;
        let ref = firebase.database().ref('users/' + curuid + '/');
        ref.on('value', (snapshot) => {
            this.setState({ driverDetails: snapshot.val() })
            var ridersAvailable = [];
            if (snapshot.val() && snapshot.val().waiting_queue_riders) {
                let waiting_queueData = snapshot.val().waiting_queue_riders
                for (let key in waiting_queueData) {
                    waiting_queueData[key].bookingId = key;
                    ridersAvailable.push(waiting_queueData[key]);

                    var location1 = [waiting_queueData[key].pickup.lat, waiting_queueData[key].pickup.lng];
                    var location2 = [this.state.region.latitude, this.state.region.longitude];
                    var distancee = distanceCalc(location1, location2);
                    this.setState({ distance: distancee, acceptBtnDisable: false })
                }
                this.setState({ chegouCorridaQueue: true })
                if (this.state.isSound == false) {
                    this.playSound()
                    Linking.openURL('coltappmotorista://');
                }
            } else if (this.state.chegouCorridaQueue == true) {
                this.setState({ chegouCorridaQueue: false })
                if (this.state.isSound) {
                    this.stopSound()
                }
            }
            this.setState({ tasklist: ridersAvailable.reverse() });
            this.ridersAvailable = ridersAvailable;
        })
    }

    checkingRidersQueue() {
        let curUid = firebase.auth().currentUser.uid
        const checkwaiting = firebase.database().ref('users/' + curUid + '/');
        checkwaiting.on('value', snap => {
            if (snap.val().rider_waiting_object) {
                this.setState({ objectQueue: true })
            }
            this.setState({ objectQueue: false })
        })
    }

    playSound() {
        this.setState({ isSound: true })
        this.sound.getStatusAsync().then((result) => {
            if (result.isLoaded && !result.isPlaying) {
                this.sound.playAsync().then((result) => {
                    if (result.isLoaded) {
                        this.sound.setIsLoopingAsync(true)
                        this.sound.setVolumeAsync(1)
                    }
                }).catch((err) => {
                    console.log(err)
                })
            }
        }).catch((err) => {
            console.log(err)
        })
        console.log('PLAY SOUND')
    }

    stopSound() {
        if (this._isMounted) {
            this.setState({ isSound: false })
            this.sound.getStatusAsync().then((result) => {
                if (result.isPlaying) {
                    this.sound.stopAsync()
                }
            }).catch((err) => {
                console.log(err)
            })
            console.log('STOP SOUND')
        }
    }

    configAudio() {
        console.log('CONFIGURANDO AUDIO')
        Audio.setAudioModeAsync({
            staysActiveInBackground: true,
            shouldDuckAndroid: true,
        })
    }

    chat() {
        if (this.state.driverDetails) {
            if (this._isMounted) {
                this.setState({ viewInfos: false })
            }
            this.props.navigation.navigate("Chat", { passData: this.state.driverDetails });
        } else {
            alert('Você não possui mais uma corrida em espera')
        }
    }


    componentDidMount() {
        this._isMounted = true;
        const startTime = this.props.navigation.getParam('startTime');
        const allDetails = this.props.navigation.getParam('allDetails')
        this.getRidersQueue();
        this._activate();
        this.sound = new Audio.Sound()
        const status = {
            shouldPlay: false
        };
        this.sound.loadAsync(require('../../assets/sounds/alerta.mp3'), status, false)
        if (startTime && this._isMounted) {
            let time = startTime.toString()
            AsyncStorage.setItem('startTime', time)
            if (this._isMounted) {
                this.setState({ startTime: startTime })
            }
        }
        const Data = firebase.database().ref('rates/');
        Data.once('value', rates => {
            if (rates.val()) {
                var carTypeWiseRate = rates.val();
                for (var i = 0; i < carTypeWiseRate.car_type.length; i++) {
                    if (carTypeWiseRate.car_type[i].name == allDetails.carType) {
                        var rates = carTypeWiseRate.car_type[i];
                        if (this._isMounted) {
                            this.setState({
                                rateDetails: rates
                            })
                        }
                    }
                }
            }
        })
        this.checkingRidersQueue()
        this.setQueueAvailable(true)
    }

    componentWillUnmount() {
        this.myAbort.abort()
        this._isMounted = false;
        this.sound.unloadAsync();
        if (this.location != undefined) {
            console.log('REMOVEU O WATCH COMPLETE TRIP')
            this.location.remove()
        }
        console.log('DESMONTOU A TELA COMPLETE TRIP')
        if (this.state.timeoutCenter != null) {
            clearInterval(this.state.timeoutCenter)
        }
        //this.unsubscribe();
    }


    checking() {
        if (this.state.rideDetails.bookingId) {
            let curUid = firebase.auth().currentUser.uid
            let bookingId = this.state.rideDetails.bookingId;
            const userData = firebase.database().ref('users/' + curUid + '/my_bookings/' + bookingId + '/');
            userData.on('value', bookingDetails => {
                if (bookingDetails.val()) {
                    let curstatus = bookingDetails.val().status;
                    this.setState({ status: curstatus })
                }
            })
        }
    }

    setQueueAvailable(param) {
        firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/queueAvailable/').set(param)
    }

    _getLocationAsync = async () => {
        this.location = await Location.watchPositionAsync({
            accuracy: Location.Accuracy.Highest,
            distanceInterval: 1,
            timeInterval: 2000
        },
            newLocation => {
                let { coords } = newLocation;
                // console.log(coords);
                let region = {
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                    latitudeDelta: 0.0043,
                    longitudeDelta: 0.0034,
                    angle: coords.heading,
                };
                if (this._isMounted) {
                    this.setState({ region: region });
                    this.setLocationDB(region.latitude, region.longitude, region.angle);
                    //this.checkDistKM();
                }
            },
            error => console.log(error)
        );
        this.updateAdress(region.latitude, region.longitude)
        return this.location
    };

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
            var keys = this.state.rideDetails.bookingId
            firebase.database().ref('bookings/' + keys + '/current/').update({
                lat: lat,
                lng: lng,
                angle: angle,
            })
        }).catch((error) => {
            console.error(error);
        });
    }

    openAlert() {
        Alert.alert(
            'Localização necessária',
            'Para receber corrida e ficar online, precisamos de sua localização ativa, por favor ative-a em configurações.',
            [
                { text: 'OK', onPress: () => console.log('OK Pressed') }
            ],
            { cancelable: false }
        );
    }

    /*checkDistKM() {
        var location1 = [this.state.region.latitude, this.state.region.longitude];    //Rider Lat and Lang
        var location2 = [this.state.rideDetails.drop.lat, this.state.rideDetails.drop.lng];   //Driver lat and lang
        //calculate the distance of two locations
        var distance = distanceCalc(location1, location2);
        if (this._isMounted) {
            this.setState({ kmRestante: distance })
        }
    }*/

    checkDist(item) {
        if (this._isMounted) {
            this.setState({ rideDetails: item, loaderWaypoint: true },
                async () => {
                    var location1 = [this.state.region.latitude, this.state.region.longitude];   //Rider Lat and Lang
                    var location2 = [this.state.rideDetails.drop.lat, this.state.rideDetails.drop.lng];
                    var location3 = [this.state.rideDetails.waypoint ? this.state.rideDetails.waypoint.lat : 0, this.state.rideDetails.waypoint ? this.state.rideDetails.waypoint.lng : 0];   //Driver lat and lang
                    //calculate the distance of two locations
                    var distance = distanceCalc(location1, location2);
                    var distance2 = distanceCalc(location1, location3);
                    var originalDistance = (distance);
                    var originalDistance2 = (distance2);
                    if (this.state.waypoint != "" && this.state.waypoint != "CONFIRMED") {
                        if (originalDistance2 <= 0.8) {
                            this.confirmedWaypoint()
                        } else {
                            this.showActionSheet()
                        }
                    } else {
                        if (originalDistance <= 0.8) {
                            this.onPressEndTrip(this.state.rideDetails)
                        } else {
                            this.showActionSheet()
                        }
                    }
                })
        }
    }

    showActionSheet = () => {
        this.ActionSheet.show()
    }

    showActionSheett = () => {
        this.RefActionSheet.show()
    }

    confirmedWaypoint = async () => {
        if (this.state.waypoint != "" && this.state.waypoint != "CONFIRMED") {
            await AsyncStorage.setItem('waypoint', "CONFIRMED").then(() => {
                this.setState({ waypoint: "CONFIRMED", loaderWaypoint: false })
            })
        }
    }

    // checkar internet
    onPressEndTrip = async (item) => {
        this.setState({ loaderWaypoint: false })
        let location = await Location.getCurrentPositionAsync({});
        var pos = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
        };
        AsyncStorage.getItem('statusCorrida', (err, result) => {
            if (result) {
                NetInfo.fetch().then(state => {
                    if (state.isConnected) {
                        this.setState({ loadingModal: true })
                        this.setQueueAvailable(false)
                        console.log('FINALIZAR CORRIDA: VOCE JA TENTOU FINALIZAR')
                        let convenienceFee = (this.state.rideDetails.pagamento.estimate * this.state.rateDetails.convenience_fees / 100);
                        this.finalCostStore(item, this.state.rideDetails.pagamento.estimate, pos, 0, convenienceFee,
                            this.state.rideDetails.pagamento.discount_amount ? this.state.rideDetails.pagamento.discount_amount : 0,
                            this.state.rideDetails.pagamento.usedWalletMoney ? this.state.rideDetails.pagamento.usedWalletMoney : 0, false, false)
                    } else {
                        Alert.alert(
                            "Problema ao finalizar corrida",
                            "Houve um problema ao finalizar sua corrida, verifique o status de conexão com a internet.",
                            [
                                { text: "OK", onPress: () => console.log("OK Pressed") }
                            ],
                            { cancelable: false }
                        )
                        this.setState({ loadingModal: false })
                    }
                })
            } else {
                AsyncStorage.setItem('statusCorrida', "finalizada").then(() => {
                    NetInfo.fetch().then(state => {
                        if (state.isConnected) {
                            console.log('FINALIZAR CORRIDA: VOCÊ POSSUI INTERNET')
                            this.endFinal(pos, item)
                        } else {
                            console.log('FINALIZAR CORRIDA: VOCÊ NÃO POSSUI INTERNET')
                            this.setState({ statusConexao: true, loadingModal: true })
                            let convenienceFee = (this.state.rideDetails.pagamento.estimate * this.state.rateDetails.convenience_fees / 100);
                            this.finalCostStore(item, this.state.rideDetails.pagamento.estimate, pos, 0, convenienceFee,
                                this.state.rideDetails.pagamento.discount_amount ? this.state.rideDetails.pagamento.discount_amount : 0,
                                this.state.rideDetails.pagamento.usedWalletMoney ? this.state.rideDetails.pagamento.usedWalletMoney : 0, false, false)
                        }
                    })
                })
            }
        })
    }

    checkWaypoint = async () => {
        if (this.state.rideDetails.waypoint) {
            console.log('EXISTE PARADA NESSA CORRIDA')
            await AsyncStorage.getItem('waypoint', (err, result) => {
                if (result) {
                    if (result === 'CONFIRMED') {
                        this.setState({ waypoint: "CONFIRMED" })
                    } else {
                        this.setState({ waypoint: "NOCONFIRMED" })
                    }
                } else {
                    this.setState({ waypoint: "NOCONFIRMED" })
                }
            })
        }
    }

    //End trip and fare calculation function
    // 1 ETAPA DE CALCULO
    async endFinal(pos, item) {
        this.setQueueAvailable(false)
        this.setState({ loadingModal: true })
        var diff = ((this.state.startTime) - (new Date().getTime())) / 1000;
        diff /= (60 * 1);
        var totalTimeTaken = Math.abs(Math.round(diff));
        console.log(totalTimeTaken + 'Start Time da tela Comple trip')
        let startLoc = '"' + this.state.rideDetails.pickup.lat + ', ' + this.state.rideDetails.pickup.lng + '"';
        let destLoc = '"' + pos.latitude + ', ' + pos.longitude + '"';
        var resp = await fetch(`https://maps.googleapis.com/maps/api/directions/json?origin=${startLoc}&destination=${destLoc}&key=${google_map_key}`)
        var respJson = await resp.json();
        var location1 = [this.state.rideDetails.drop.lat, this.state.rideDetails.drop.lng];    //Rider Lat and Lang
        var location2 = [pos.latitude, pos.longitude];   //Driver lat and lang
        //calculate the distance of two locations
        var distance = distanceCalc(location1, location2);
        var originalDistance = (distance);
        if (originalDistance <= 0.8) {
            let convenienceFee = (this.state.rideDetails.pagamento.estimate * this.state.rateDetails.convenience_fees / 100);
            this.finalCostStore(item, this.state.rideDetails.pagamento.estimate, pos, respJson.routes[0].legs[0].distance.value, convenienceFee,
                this.state.rideDetails.pagamento.discount_amount ? this.state.rideDetails.pagamento.discount_amount : 0,
                this.state.rideDetails.pagamento.usedWalletMoney ? this.state.rideDetails.pagamento.usedWalletMoney : 0, false, true)
        } else {
            var fareCalculation = farehelper(respJson.routes[0].legs[0].distance.value, totalTimeTaken, this.state.rateDetails ? this.state.rateDetails : 1, this.state.rideDetails.pagamento.cancellValue);
            if (fareCalculation) {
                this.finalCostStore(item, fareCalculation.grandTotal, pos, respJson.routes[0].legs[0].distance.value, fareCalculation.convenience_fees,
                    this.state.rideDetails.pagamento.discount_amount ? this.state.rideDetails.pagamento.discount_amount : 0,
                    this.state.rideDetails.pagamento.usedWalletMoney ? this.state.rideDetails.pagamento.usedWalletMoney : 0, true, true)
            }
        }
    }

    locationAdd(pos) {
        var latlng = pos.latitude + ',' + pos.longitude;
        return fetch('https://maps.googleapis.com/maps/api/geocode/json?latlng=' + latlng + '&key=' + google_map_key, { signal: this.myAbort.signal })
    }

    //driver current location fetching
    finalCostStore(item, finalFare, pos, distance, convenience_fees, discount, wallet, recalculo, possuiNet) {
        NetInfo.fetch().then(state => {
            if (state.isConnected) {
                let tripCost = finalFare;
                let customerPaid = (finalFare - discount);
                let cashPaymentAmount = (finalFare - discount - wallet);
                let driverShare = (finalFare - convenience_fees);
                let usedWalletMoney = item.pagamento.usedWalletMoney;

                var pagamentoObj = {
                    trip_cost: tripCost > 0 ? parseFloat(tripCost) : 0,
                    convenience_fees: parseFloat(convenience_fees),
                    customer_paid: customerPaid > 0 ? customerPaid : 0,
                    payment_status: "IN_PROGRESS",
                    driver_share: driverShare,
                    cashPaymentAmount: cashPaymentAmount > 0 ? cashPaymentAmount : 0,
                    estimate: item.pagamento.estimate,
                    payment_mode: item.pagamento.payment_mode,
                    usedWalletMoney: usedWalletMoney,
                    discount_amount: item.pagamento.discount_amount,
                    promoCodeApplied: item.pagamento.promoCodeApplied,
                    promoKey: item.pagamento.promoKey,
                    cancellValue: item.pagamento.cancellValue,
                    recalculo: recalculo,
                    possuiNet: possuiNet,
                    //finalCalcBooking: true,
                    //manageMoney: true,
                }
                var data = {
                    status: "END",
                    trip_end_time: new Date().toLocaleTimeString(dateStyle),
                    finaldistance: distance,
                    pagamento: pagamentoObj,
                }
                var riderData = {
                    status: "END",
                    trip_end_time: new Date().toLocaleTimeString(dateStyle),
                    finaldistance: distance,
                    pagamento: pagamentoObj,
                }

                firebase.database().ref('bookings/' + item.bookingId + '/pagamento').update({

                })

                console.log('Distancia Final: ' + data.finaldistance)
                console.log('Trip cost: ' + pagamentoObj.trip_cost)
                console.log('Motorista ganhou: ' + pagamentoObj.driver_share)
                console.log('Taxa: ' + pagamentoObj.convenience_fees)
                console.log('Valor Pago: ' + pagamentoObj.customer_paid)

                this.locationAdd(pos).then((response) => response.json()).then((responseJson) => {
                    data.drop = { add: responseJson.results[0].formatted_address, lat: pos.latitude, lng: pos.longitude };
                    riderData.drop = { add: responseJson.results[0].formatted_address, lat: pos.latitude, lng: pos.longitude };
                    item.drop = { add: responseJson.results[0].formatted_address, lat: pos.latitude, lng: pos.longitude };
                    if (data.drop) {
                        this.saveData(item, data, riderData);
                        this.updateDriverLocation(data.drop)
                    }
                });
            } else {
                Alert.alert(
                    "Problema ao concluir corrida",
                    "Houve um problema ao concluir sua corrida, verifique o status de conexão com a internet.",
                    [
                        { text: "OK", onPress: () => console.log("OK Pressed") }
                    ],
                    { cancelable: false }
                )
                this.setState({ loadingModal: false })
            }
        })
    }

    //Final cost and status set to database
    saveData(item, data, riderData) {
        let dbRef = firebase.database().ref('users/' + this.state.curUid + '/my_bookings/' + item.bookingId + '/');
        dbRef.update(data).then(() => {
            firebase.database().ref('users/' + item.customer + '/my-booking/' + item.bookingId + '/').update(riderData).then(() => {
                let bookingDbRef = firebase.database().ref('bookings/' + item.bookingId + '/');
                data.pagamento.finalCalcBooking = true
                //data.pagamento.manageMoney = true
                console.log('CHAMOU A FUNCTION')
                bookingDbRef.update(data).then(() => {
                    this.sendPushNotification(item.customer)
                    this.navegaFinal(item, data, riderData);
                })
            })
        })
    }

    navegaFinal(item, data, riderData) {
        const userData = firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/my_bookings/' + item.bookingId + '/');
        userData.on('value', statusDetails => {
            let statusDetail = statusDetails.val()
            if (statusDetail) {
                if (statusDetail.pagamento.payment_mode === 'Dinheiro') {
                    if (this._isMounted) {
                        this.setState({ loadingModal: false, statusConexao: false })
                    }
                    AsyncStorage.removeItem('startTime');
                    AsyncStorage.removeItem('statusCorrida');
                    this.props.navigation.replace('DriverFare', { allDetails: item, trip_cost: data.pagamento.trip_cost, trip_end_time: data.trip_end_time })
                } else if (statusDetail.status === 'END' && statusDetail.pagamento.payment_status === 'PAID') {
                    if (this._isMounted) {
                        this.setState({ loadingModal: false, statusConexao: false })
                    }
                    AsyncStorage.removeItem('startTime');
                    AsyncStorage.removeItem('statusCorrida');
                    this.props.navigation.replace('DriverFare', { allDetails: item, trip_cost: data.pagamento.trip_cost, trip_end_time: data.trip_end_time })
                }
            }
        })
    }

    //update driver location
    updateDriverLocation(location) {
        firebase.database().ref('users/' + this.state.curUid + '/location').update({
            add: location.add,
            lat: location.lat,
            lng: location.lng
        })
    }
    sendPushNotification(customerUID) {
        const customerRoot = firebase.database().ref('users/' + customerUID);
        customerRoot.once('value', customerData => {
            if (customerData.val()) {
                let allData = customerData.val()
                RequestPushMsg(allData.pushToken ? allData.pushToken : null, 'O motorista chegou ao local de destino')
            }
        })
    }

    // accept button press function
    onPressAccept(item) {
        this.stopSound()
        this.setState({ loader: true })
        if (false) {
            Alert.alert('Ops, essa corrida foi cancelada pelo passageiro')
            this.setState({ loader: false })
        } else {
            var pagamentoObj = {
                estimate: item.pagamento.estimate,
                trip_cost: item.pagamento.trip_cost,
                payment_mode: item.pagamento.payment_mode,
                cashPaymentAmount: item.pagamento.cashPaymentAmount,
                usedWalletMoney: item.pagamento.usedWalletMoney,
                discount_amount: item.pagamento.discount_amount,
                promoCodeApplied: item.pagamento.promoCodeApplied,
                promoKey: item.pagamento.promoKey,
                cancellValue: item.pagamento.cancellValue,
            }
            var data = {
                carType: item.carType,
                customer: item.customer,
                customer_name: item.customer_name,
                otp: item.otp,
                distance: item.distance,
                driver: this.state.curUid,
                driver_image: this.state.driverDetails.driver_image ? this.state.driverDetails.driver_image : "",
                driver_name: this.state.driverDetails.firstName + ' ' + this.state.driverDetails.lastName,
                driver_firstName: this.state.driverDetails.firstName,
                driver_contact: this.state.driverDetails.mobile,
                vehicle_number: this.state.driverDetails.vehicleNumber,
                vehicleModelName: this.state.driverDetails.vehicleModel,
                driverRating: this.state.driverDetails.ratings ? this.state.driverDetails.ratings.userrating : "5.0",
                drop: item.drop,
                ratingRider: item.ratingRider,
                pickup: item.pickup,
                waypoint: item.waypoint ? item.waypoint : null,
                imageRider: item.imageRider ? item.imageRider : null,
                estimateDistance: item.estimateDistance,
                serviceType: item.serviceType,
                status: "ACCEPTED",
                firstNameRider: item.firstNameRider,
                total_trip_time: item.total_trip_time,
                trip_end_time: item.trip_end_time,
                trip_start_time: item.trip_start_time,
                tripdate: item.tripdate,
                pagamento: pagamentoObj,
                data_accept: new Date().getTime(),
            }

            var riderData = {
                carType: item.carType,
                distance: item.distance,
                imageRider: item.imageRider ? item.imageRider : null,
                driver: this.state.curUid,
                driver_image: this.state.driverDetails.driver_image ? this.state.driverDetails.driver_image : "",
                driver_name: this.state.driverDetails.firstName + ' ' + this.state.driverDetails.lastName,
                driver_firstName: this.state.driverDetails.firstName,
                driver_contact: this.state.driverDetails.mobile,
                vehicle_number: this.state.driverDetails.vehicleNumber,
                vehicleModelName: this.state.driverDetails.vehicleModel,
                driverRating: this.state.driverDetails.ratings ? this.state.driverDetails.ratings.userrating : "5.0",
                drop: item.drop,
                firstNameRider: item.firstNameRider,
                ratingRider: item.ratingRider,
                otp: item.otp,
                pickup: item.pickup,
                waypoint: item.waypoint ? item.waypoint : null,
                estimateDistance: item.estimateDistance,
                serviceType: item.serviceType,
                status: "ACCEPTED",
                total_trip_time: item.total_trip_time,
                trip_end_time: item.trip_end_time,
                trip_start_time: item.trip_start_time,
                tripdate: item.tripdate,
                pagamento: pagamentoObj,
                data_accept: new Date().getTime(),
            }

            if (this._isMounted) {
                let dbRef = firebase.database().ref('users/' + this.state.curUid + '/my_bookings/' + item.bookingId + '/');
                dbRef.update(data).then(() => {
                    firebase.database().ref('bookings/' + item.bookingId + '/').update(data).then(() => {
                        firebase.database().ref('bookings/' + item.bookingId).once('value', (snap) => {
                            let requestedDriver = snap.val().requestedDriver;
                            if (requestedDriver) {
                                firebase.database().ref('users/' + requestedDriver + '/waiting_queue_riders/' + item.bookingId + '/').remove()
                                    .then(() => {
                                        this.setState({ loader: false, chegouCorridaQueue: false })
                                    }).then(() => {
                                        let dbRefW = firebase.database().ref('users/' + requestedDriver + '/rider_waiting_object/' + item.bookingId + '/')
                                        dbRefW.update(data)
                                    })
                            }
                        })
                    })
                    this.sendPushNotification(item.customer, this.state.driverDetails.firstName + ' está terminando uma corrida por perto, aguarde.')
                }).catch((error) => {
                    console.log(error)
                    alert('Ops, tivemos um problema.')
                })
                firebase.database().ref('users/' + item.customer + '/my-booking/' + item.bookingId + '/').update(riderData);
                this.setQueueAvailable(false)
            }
        }


    }

    //ignore button press function
    onPressIgnore(item) {
        this.setState({ loader: true });
        var arr = [];
        this.stopSound()
        if (this._isMounted) {
            firebase.database().ref('bookings/' + item.bookingId + '/').once('value', data => {
                if (data.val()) {
                    let mainBookingData = data.val();
                    if (mainBookingData.rejectedDrivers) {
                        arr = mainBookingData.rejectedDrivers
                        arr.push(firebase.auth().currentUser.uid)
                    } else {
                        arr.push(firebase.auth().currentUser.uid)
                    }
                    firebase.database().ref(`bookings/` + item.bookingId + '/').update({
                        rejectedDrivers: arr,
                        status: "REJECTED",
                    }).then(() => {
                        let userDbRef = firebase.database().ref('users/' + item.customer + '/my-booking/' + item.bookingId + '/');
                        userDbRef.update({
                            status: "REJECTED",
                        });
                        this.setState({ loader: false, chegouCorridaQueue: false });
                    })
                    firebase.database().ref('bookings/' + item.bookingId + '/requestedDriver/').remove();
                }
            });
            firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/waiting_queue_riders/' + item.bookingId + '/').remove()
        }
    }

    loading() {
        return (
            <Modal
                animationType="fade"
                transparent={true}
                visible={this.state.loadingModal}
            >
                <View style={{ flex: 1, backgroundColor: "rgba(22,22,22,0.8)", justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{ width: '85%', backgroundColor: colors.WHITE, borderRadius: 10, flex: 1, maxHeight: 280 }}>
                        <View style={{ alignItems: 'center', flexDirection: 'column', flex: 1, justifyContent: "center" }}>
                            <Image
                                style={{ backgroundColor: colors.TRANSPARENT, resizeMode: 'contain', flex: 1 }}
                                source={require('../../assets/images/loaderCar.gif')}
                            />
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: colors.BLACK, fontSize: 20, fontFamily: 'Inter-Bold', textAlign: 'center' }}>Calculando preço, aguarde.</Text>
                                {this.state.statusConexao === true ?
                                    <View style={{ justifyContent: 'center', marginTop: 15, alignItems: 'center', flexDirection: 'column' }}>
                                        <View style={{ flexDirection: 'row' }}>
                                            <Icon
                                                name='warning'
                                                type='Ionicons'
                                                color={colors.RED}
                                                iconStyle={{ marginRight: 5 }}
                                            />
                                            <Text style={{ color: colors.RED, fontSize: 16, fontFamily: 'Inter-Bold', textAlign: 'center' }}>Sem conexão com a internet.</Text>
                                        </View>
                                    </View>
                                    : null}
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        )
    }

    choiceNavigation(allDetails) {
        Alert.alert(
            'Escolha o app para navegação',
            '',
            [
                {
                    text: "Waze",
                    onPress: () => this.openWaze(allDetails),
                    style: "cancel"
                },
                { text: "Google Maps", onPress: () => this.handleGetDirections(allDetails) }
            ],
            { cancelable: true }
        );
    }

    openWaze(allDetails) {
        if (this.state.waypoint === "NOCONFIRMED") {
            Linking.openURL('https://www.waze.com/ul?q=' + allDetails.drop.lat + ',' + allDetails.drop.lng + '&navigate=yes');
        } else {
            Linking.openURL('https://www.waze.com/ul?q=' + allDetails.waypoint.lat + ',' + allDetails.waypoint.lng + '&navigate=yes');
        }
    }

    // google navigations now it not implemented in client side
    handleGetDirections(allDetails) {
        if (this.state.waypoint === "NOCONFIRMED") {
            let data = {
                source: {
                    latitude: this.state.region.latitude,
                    longitude: this.state.region.longitude
                },
                destination: {
                    latitude: allDetails.waypoint.lat,
                    longitude: allDetails.waypoint.lng
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
        } else {
            let data = {
                source: {
                    latitude: this.state.region.latitude,
                    longitude: this.state.region.longitude
                },
                destination: {
                    latitude: allDetails.drop.lat,
                    longitude: allDetails.drop.lng
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
    }

    /*checkMap() {
        if (this.state.followMap && this.state.region) {
            return this.state.region;
        }
    }*/

    centerFollowMap() {
        this.map.animateCamera({
            center: {
                latitude: this.state.region.latitude,
                longitude: this.state.region.longitude,
            },
            altitude: 0,
            heading: this.state.region.angle,
            pitch: 0,
            zoom: 17
        }, 200)
        this.setState({ timeoutCenter: setTimeout(() => { this.setState({ followMap: true, fitCordinates: false }) }, 1100) })
    }

    animateToDestination() {
        this.setState({ fitCordinates: true, followMap: false })
        setTimeout(() => {
            this.map.fitToCoordinates([{ latitude: this.state.region.latitude, longitude: this.state.region.longitude }, { latitude: this.state.waypoint === "NOCONFIRMED" ? this.state.rideDetails.waypoint.lat : this.state.rideDetails.drop.lat, longitude: this.state.waypoint === "NOCONFIRMED" ? this.state.rideDetails.waypoint.lng : this.state.rideDetails.drop.lng }], {
                edgePadding: { top: 80, right: 65, bottom: 50, left: 50 },
                animated: true,
            })
        }, 200);
    }

    mapStyle() {
        var dataAgr = new Date().getHours()
        if (dataAgr >= 0 && dataAgr <= 5 || dataAgr >= 18 && dataAgr <= 23) {
            this.colorStatus = 'light-content'
            return customMapStyleDark
        } else {
            this.colorStatus = 'dark-content'
            return customMapStyle
        }
    }

    render() {
        return (
            <View style={styles.containerView}>
                <StatusBar barStyle={this.colorStatus ? this.colorStatus : 'default'} translucent backgroundColor={colors.TRANSPARENT} />

                {this.state.chegouCorridaQueue == false ?

                    <View style={{ flex: 1 }}>
                        <View style={{ flex: 1 }}>
                            {this.state.region ?
                                <MapView
                                    ref={map => { this.map = map }}
                                    style={styles.map}
                                    rotateEnabled={false}
                                    provider={PROVIDER_GOOGLE}
                                    showsUserLocation={false}
                                    showsCompass={false}
                                    showsScale={false}
                                    customMapStyle={this.mapStyle()}
                                    loadingEnabled
                                    showsMyLocationButton={false}
                                    //region={this.checkMap()}
                                    camera={{
                                        center: {
                                            latitude: this.state.region.latitude,
                                            longitude: this.state.region.longitude
                                        },
                                        altitude: 0,
                                        heading: this.state.region.angle,
                                        pitch: 0,
                                        zoom: 17
                                    }}
                                >
                                    <Marker.Animated
                                        coordinate={{ latitude: this.state.region ? this.state.region.latitude : 0.00, longitude: this.state.region ? this.state.region.longitude : 0.00 }}
                                        //style={{ transform: [{ rotate: this.state.region.angle ? this.state.region.angle + "deg" : '0' + "deg" }] }}
                                        anchor={{ x: 0.5, y: 0.5 }}
                                    >
                                        <CellphoneSVG
                                            width={40}
                                            height={40}
                                        />
                                    </Marker.Animated>
                                    {this.state.waypoint === "NOCONFIRMED" ?
                                        <Marker.Animated
                                            coordinate={{ latitude: this.state.rideDetails.waypoint.lat, longitude: this.state.rideDetails.waypoint.lng, }}
                                            anchor={{ x: 0.5, y: 1 }}
                                        >
                                            <MarkerPicSVG
                                                width={40}
                                                height={40}
                                            />
                                        </Marker.Animated>
                                        :
                                        <Marker.Animated
                                            coordinate={{ latitude: this.state.rideDetails.drop.lat, longitude: this.state.rideDetails.drop.lng, }}
                                            anchor={{ x: 0.5, y: 1 }}
                                        >
                                            <MarkerDropSVG
                                                width={40}
                                                height={40}
                                            />
                                        </Marker.Animated>
                                    }
                                    {this.state.waypoint === "NOCONFIRMED" ?
                                        <Directions
                                            origin={{ latitude: this.state.region.latitude, longitude: this.state.region.longitude }}
                                            destination={{ latitude: this.state.rideDetails.waypoint.lat, longitude: this.state.rideDetails.waypoint.lng }}
                                            onReady={result => { this.setState({ kmRestante: result.distance, tempoRestante: result.duration }) }}
                                        />
                                        :
                                        <Directions
                                            origin={{ latitude: this.state.region.latitude, longitude: this.state.region.longitude }}
                                            destination={{ latitude: this.state.rideDetails.drop.lat, longitude: this.state.rideDetails.drop.lng }}
                                            onReady={result => { this.setState({ kmRestante: result.distance, tempoRestante: result.duration }) }}
                                        />
                                    }
                                </MapView>
                                :
                                null}
                            <View>
                                <ActionSheetCustom
                                    ref={o => this.ActionSheet = o}
                                    style={styles}
                                    title={<Text style={{ color: colors.BLACK, fontSize: 20, fontFamily: 'Inter-Bold' }}>Longe do destino</Text>}
                                    message={<Text style={{ color: colors.BLACK, fontSize: 14, fontFamily: 'Inter-Regular', textAlign: 'center' }}>Você está distante do ponto de destino, tem certeza que deseja continuar?</Text>}
                                    options={['Continuar', 'Voltar']}
                                    cancelButtonIndex={1}
                                    destructiveButtonIndex={0}
                                    onPress={(index) => {
                                        if (index == 0) {
                                            if (this.state.waypoint != "" && this.state.waypoint != "CONFIRMED") {
                                                this.confirmedWaypoint()
                                            } else {
                                                this.onPressEndTrip(this.state.rideDetails)
                                            }
                                        } else {
                                            //console.log('actionsheet close')
                                        }
                                    }}
                                />
                            </View>
                            {this.state.objectQueue ?
                                <View style={{ flex: 1 }}>
                                    <View style={{ position: 'absolute', top: 90, width: width / 1.6, height: 35, backgroundColor: colors.WHITE, elevation: 3, borderRadius: 15, alignItems: 'center', alignSelf: 'center', justifyContent: 'center' }}>
                                        <Text style={{ color: colors.BLACK, fontFamily: 'Inter-Bold', fontSize: 13, textAlign: 'center' }}>Você possui uma corrida em espera</Text>
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
                                </View>
                                :
                                null}
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
                            {/*<TouchableOpacity style={styles.iconeNav} onPress={() => { this.handleGetDirections(this.state.rideDetails) }}>
                                <Icon
                                    name="navigation"
                                    type="feather"
                                    size={30}
                                    color={colors.BLACK}
                                />
                            </TouchableOpacity>*/}
                            <View style={{ position: 'absolute', alignSelf: 'center', top: Constants.statusBarHeight + 3, height: 70, width: width / 1.2, backgroundColor: colors.WHITE, elevation: 4, borderTopLeftRadius: 15, borderTopRightRadius: 15 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                        {this.state.waypoint === "NOCONFIRMED" ?
                                            <Text style={{ textAlign: 'center', color: colors.BLACK, fontSize: 14, fontFamily: 'Inter-Regular' }}>{this.state.rideDetails.waypoint.add}</Text>
                                            :
                                            <Text style={{ textAlign: 'center', color: colors.BLACK, fontSize: 14, fontFamily: 'Inter-Regular' }}>{this.state.rideDetails.drop.add}</Text>
                                        }
                                    </View>
                                    <View style={{ borderWidth: 0.6, borderColor: colors.GREY1, height: 70, width: 1 }}></View>
                                    <View style={{ flex: 0.2, justifyContent: 'center', alignItems: 'center' }}>
                                        <TouchableOpacity onPress={() => { this.choiceNavigation(this.state.rideDetails) }}>
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
                                <View style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: colors.WHITE, borderBottomLeftRadius: 15, borderBottomRightRadius: 15, borderTopWidth: 1, borderTopColor: colors.DEEPBLUE, height: 30 }}>
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
                            <View style={styles.valorEstimado}>
                                <Text style={{ fontFamily: 'Inter-Bold', fontSize: 12, color: colors.BLACK }}>Valor estimado: </Text>
                                <Text style={{ fontFamily: 'Inter-Bold', fontSize: 15, color: colors.DEEPBLUE }}>R$ {this.state.rideDetails.pagamento.estimate}</Text>
                            </View>
                        </View>
                        <View style={styles.buttonViewStyle}>
                            <TouchableOpacity
                                title='Finalizar corrida'
                                onPress={() => {
                                    this.checkDist(this.state.rideDetails)
                                }}
                                disabled={this.state.loaderWaypoint}
                                style={styles.buttonStyleView}
                            >
                                <View style={{ flexDirection: 'row' }}>
                                    {this.state.waypoint != "" && this.state.waypoint != "CONFIRMED" ?
                                        <View style={{ alignItems: 'center', justifyContent: 'center', marginRight: 5 }}>
                                            <Text style={{ color: colors.WHITE, fontSize: 16, fontFamily: 'Inter-Bold' }}>Confirmar parada</Text>
                                        </View>
                                        :
                                        <View style={{ alignItems: 'center', justifyContent: 'center', marginRight: 5 }}>
                                            <Text style={{ color: colors.WHITE, fontSize: 16, fontFamily: 'Inter-Bold' }}>Finalizar corrida</Text>
                                        </View>
                                    }
                                    <View style={{ paddingHorizontal: 4, paddingVertical: 2, backgroundColor: colors.WHITE, borderRadius: 10 }}>
                                        {this.state.rideDetails.pagamento.payment_mode === 'Dinheiro' ?
                                            <Text style={{ color: colors.BLACK, fontSize: 14, fontFamily: 'Inter-Bold' }}>Dinheiro</Text>
                                            : null}
                                        {this.state.rideDetails.pagamento.payment_mode === 'Carteira' ?
                                            <Text style={{ color: colors.BLACK, fontSize: 14, fontFamily: 'Inter-Bold' }}>Cartão</Text>
                                            : null}
                                        {this.state.rideDetails.pagamento.payment_mode === 'Dinheiro/Cartiera' ?
                                            <Text style={{ color: colors.BLACK, fontSize: 14, fontFamily: 'Inter-Bold' }}>Cartão/Dinheiro</Text>
                                            : null}
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>

                    :

                    <View style={{ flex: 1 }}>
                        <FlatList
                            data={this.state.tasklist}
                            keyExtractor={(item, index) => index.toString()}
                            renderItem={({ item, index }) => {
                                return (

                                    <Modal
                                        animationType="slide"
                                        transparent={true}
                                        visible={true}
                                        onRequestClose={() => {
                                            alert("Modal has been closed.");
                                        }}
                                    >
                                        <View>
                                            <ActionSheetCustom
                                                ref={o => this.RefActionSheet = o}
                                                style={styles}
                                                title={<Text style={{ color: colors.RED, fontSize: 20, fontFamily: 'Inter-Bold' }}>Rejeitar corrida?</Text>}
                                                message={<Text style={{ color: colors.BLACK, fontSize: 14, fontFamily: 'Inter-Regular', textAlign: 'center' }}>Você pode reijetar sem afetar sua taxa</Text>}
                                                options={['Cancelar', 'Voltar']}
                                                cancelButtonIndex={1}
                                                destructiveButtonIndex={0}
                                                onPress={(index) => {
                                                    if (index == 0) {
                                                        this.onPressIgnore(item)
                                                    } else {
                                                        //console.log('actionsheet close')
                                                    }
                                                }}
                                            />
                                        </View>
                                        <View style={{ flex: 1.3 }}>
                                            <MapView
                                                ref={map2 => { this.map2 = map2 }}
                                                style={styles.map}
                                                rotateEnabled={false}
                                                provider={PROVIDER_GOOGLE}
                                                zoomControlEnabled={false}
                                                zoomEnabled={false}
                                                scrollEnabled={false}
                                                showsCompass={false}
                                                customMapStyle={this.mapStyle()}
                                                showsScale={false}
                                                showsMyLocationButton={false}
                                                region={this.checkMap()}

                                            >
                                                <Marker.Animated
                                                    ref={marker => { this.marker = marker }}
                                                    coordinate={{ latitude: item.pickup.lat, longitude: item.pickup.lng }}
                                                    anchor={{ x: 0.5, y: 0.5 }}
                                                >
                                                    <MarkerPicSVG
                                                        width={35}
                                                        height={35}
                                                    />
                                                </Marker.Animated>
                                                <Marker
                                                    coordinate={{ latitude: item.waypoint ? item.waypoint.lat : item.drop.lat, longitude: item.waypoint ? item.waypoint.lng : item.drop.lng }}
                                                    anchor={{ x: 0.5, y: 1 }}
                                                >
                                                    <MarkerDropSVG
                                                        width={40}
                                                        height={40}
                                                    />
                                                </Marker>

                                                <Directions
                                                    origin={{ latitude: item.pickup.lat, longitude: item.pickup.lng }}
                                                    destination={{ latitude: item.waypoint ? item.waypoint.lat : item.drop.lat, longitude: item.waypoint ? item.waypoint.lng : item.drop.lng }}
                                                    onReady={result => {
                                                        this.setState({ duration: Math.floor(result.duration) });

                                                        this.map2.fitToCoordinates(result.coordinates, {
                                                            edgePadding: {
                                                                right: getPixelSize(10),
                                                                left: getPixelSize(10),
                                                                top: getPixelSize(10),
                                                                bottom: getPixelSize(50)
                                                            },
                                                            animated: true,
                                                        });
                                                    }}
                                                />
                                            </MapView>
                                        </View>

                                        <View style={styles.modalMain}>
                                            <View style={styles.modalContainer}>
                                                <View style={styles.tituloModalView}>
                                                    <Text style={styles.txtTitulo}>Nova corrida</Text>
                                                    <View style={styles.viewDetalhesTempo}>
                                                        <View style={styles.tempoCorrida}>
                                                            <View style={styles.iconBack}>
                                                                <Icon
                                                                    size={15}
                                                                    name='schedule'
                                                                    type='material'
                                                                    color={colors.DEEPBLUE}
                                                                />
                                                            </View>
                                                            <Text style={styles.txtTempo}>{item.estimateDistance}</Text>
                                                        </View>
                                                        <View style={styles.tempoKM}>
                                                            <View style={styles.iconBack}>
                                                                <Icon
                                                                    size={15}
                                                                    name='map-pin'
                                                                    type='feather'
                                                                    color={colors.DEEPBLUE}
                                                                />
                                                            </View>
                                                            <Text style={styles.txtTempo}>{parseFloat(this.state.distance).toFixed(2)} KM</Text>
                                                        </View>
                                                    </View>
                                                    <View style={styles.viewBtnRejeitar}>
                                                        <TouchableOpacity style={styles.btnRejeitar} onPress={() => { this.showActionSheett() }}>
                                                            <AnimatedCircularProgress
                                                                style={{ position: 'absolute' }}
                                                                ref={(ref) => this.circularProgress = ref}
                                                                size={47}
                                                                width={5}
                                                                fill={15000}
                                                                tintColor="#FF2121"
                                                                backgroundColor="#3d5875">
                                                            </AnimatedCircularProgress>
                                                            <IconCloseSVG height={25} width={25} />
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                                <View style={styles.viewEndereco}>
                                                    <View style={styles.enderecoPartida}>
                                                        <Icon
                                                            size={15}
                                                            name='arrow-right-circle'
                                                            type='feather'
                                                            color={colors.DEEPBLUE}
                                                        />
                                                        <Text style={styles.txtPartida}>{item.pickup.add}</Text>
                                                    </View>
                                                    {item.waypoint ?
                                                        <View style={styles.enderecoPartida}>
                                                            <Icon
                                                                size={15}
                                                                name='disc'
                                                                type='feather'
                                                                color={colors.DARK}
                                                            />
                                                            <Text style={styles.txtPartida}>{item.waypoint.add}</Text>
                                                        </View>
                                                        :
                                                        null}
                                                    <View style={styles.enderecoDestino}>
                                                        <Icon
                                                            size={15}
                                                            name='arrow-down-circle'
                                                            type='feather'
                                                            color={colors.RED}
                                                        />
                                                        <Text style={styles.txtDestino}>{item.drop.add}</Text>
                                                    </View>
                                                </View>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
                                                    <View style={styles.imgModalView}>
                                                        <Image source={item.imageRider ? { uri: item.imageRider } : require('../../assets/images/profilePic.png')} style={styles.imagemModal} />
                                                        <Text style={styles.nomePessoa}>{item.firstNameRider}</Text>
                                                        <View style={{ marginLeft: 5, height: 25, paddingHorizontal: 10, backgroundColor: colors.GREY1, borderRadius: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                                                            <Icon
                                                                size={18}
                                                                name='ios-star'
                                                                type='ionicon'
                                                                color={colors.YELLOW.primary}
                                                            />
                                                            <Text style={{ fontSize: 14, fontFamily: 'Inter-Bold', color: colors.BLACK, marginLeft: 5, }}>{item.ratingRider}</Text>
                                                        </View>
                                                    </View>
                                                    <View style={styles.iconPgt}>
                                                        <View style={styles.formaPgt}>
                                                            <Icon
                                                                size={14}
                                                                name='credit-card'
                                                                type='feather'
                                                                color={colors.DEEPBLUE}
                                                            />
                                                        </View>
                                                        <Text style={styles.txtTempo}>{item.pagamento.payment_mode}</Text>
                                                    </View>
                                                </View>
                                                <View style={styles.viewmainBtn}>
                                                    <View style={styles.viewBtn}>
                                                        <TouchableOpacity style={styles.btnAceitar} onPress={() => { this.onPressAccept(item) }} disabled={this.state.loader || this.state.acceptBtnDisable}>
                                                            <Text style={styles.txtBtnAceitar}>Aceitar</Text>
                                                            <ActivityIndicator animating={this.state.loader} size="large" color={colors.WHITE} style={{ position: 'absolute', right: 35 }} />
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                            </View>
                                        </View>
                                    </Modal>
                                )
                            }
                            }
                        />
                    </View>
                }
                {this.loading()}
            </View>
        );
    }
}

//Screen Styling
const styles = StyleSheet.create({
    containerView: {
        flex: 1,
        //marginTop: StatusBar.currentHeight
    },
    textContainer: {
        textAlign: "center",
        fontSize: 16.2,
        color: colors.BLUE.default.dark,
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
    valorEstimado: {
        position: 'absolute',
        alignSelf: 'center',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        bottom: 12,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
        backgroundColor: colors.WHITE,
        elevation: 2,
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
    map: {
        flex: 1,
        ...StyleSheet.absoluteFillObject,
    },
    segment2: {
        flex: 10,
        width: '97.4%',
        alignSelf: 'center',
        borderRadius: 10,
        backgroundColor: colors.WHITE,
        marginLeft: 5,
        marginRight: 5,
        marginTop: 5,
        paddingTop: 12,
        paddingBottom: 12,
        paddingRight: 8,
        paddingLeft: 8,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        position: 'relative'
    },
    segment3: {
        flex: 2,
        borderRadius: 10,
        marginLeft: 5,
        marginRight: 5,
        marginTop: 5,
        marginBottom: 5,
        paddingTop: 3,
        paddingBottom: 3,
        paddingRight: 8,
        paddingLeft: 8,
        alignItems: 'center',

    },
    map: {
        flex: 1,
        ...StyleSheet.absoluteFillObject,
    },
    buttonViewStyle: {
        justifyContent: 'flex-end',
        height: 60,
    },
    innerStyle: {
        marginLeft: 10,
        marginRight: 10
    },
    buttonStyleView: {
        backgroundColor: colors.DEEPBLUE,
        alignItems: 'center',
        justifyContent: 'center',
        borderColor: colors.TRANSPARENT,
        borderWidth: 0,
        borderRadius: 0,
        elevation: 0,
        height: 60,
    },
    titleViewStyle: {
        fontFamily: 'Inter-Bold',
        fontSize: 16,
        color: colors.WHITE,
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

    btnLigar: {
        height: 60,
        width: 60,
        backgroundColor: colors.WHITE,
        borderRadius: 50,
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        bottom: 125,
        left: 22,
        elevation: 5
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
        top: Constants.statusBarHeight + 3,
        right: 22,
    },

    iconeKm: {
        height: 25,
        flexDirection: 'row',
        paddingHorizontal: 10,
        borderRadius: 15,
        position: 'absolute',
        backgroundColor: colors.DEEPBLUE,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        bottom: 65,
        left: 22,
    },

    // CSS DO MODAL //

    modalMain: {
        flex: 1,
        backgroundColor: colors.TRANSPARENT,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },

    modalContainer: {
        width: '100%',
        flex: 1,
        backgroundColor: colors.WHITE,
        flexDirection: 'column',
        paddingTop: 15,
    },

    tituloModalView: {
        flex: 1,
        borderBottomWidth: 0.6,
        borderBottomColor: colors.GREY1,
        paddingBottom: 16,
        marginBottom: 5,
    },

    txtTitulo: {
        marginLeft: 15,
        fontFamily: 'Inter-Light',
        fontSize: 20,
        marginBottom: 8,
        color: colors.BLACK,
    },

    viewDetalhesTempo: {
        flex: 1,
        marginLeft: 15,
        flexDirection: "row",
    },

    tempoCorrida: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 10,
        borderRadius: 50,
        height: 25,
        backgroundColor: colors.GREY1,
    },

    iconBack: {
        marginLeft: 2,
        height: 23,
        alignItems: 'center',
        justifyContent: 'center',
        width: 23,
        backgroundColor: colors.WHITE,
        borderRadius: 50,
    },

    txtTempo: {
        fontFamily: 'Inter-ExtraBold',
        opacity: 0.6,
        marginLeft: 5,
        fontSize: 12,
    },

    tempoKM: {
        marginLeft: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 50,
        height: 25,
        backgroundColor: colors.GREY1,
        paddingRight: 10,
    },

    viewBtnRejeitar: {
        position: 'absolute',
        width: 50,
        height: 50,
        borderRadius: 50,
        justifyContent: 'center',
        alignSelf: 'flex-end',
        alignItems: 'center',
        right: 10,
    },

    btnRejeitar: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: colors.RED,
        alignItems: 'center',
        borderRadius: 50,
        backgroundColor: colors.WHITE,
        elevation: 3,
    },

    viewEndereco: {
        flex: 1,
        marginTop: 15,
        justifyContent: 'center',
        borderBottomWidth: 0.6,
        borderBottomColor: colors.GREY1,
        paddingBottom: 16,
        marginBottom: 5,
    },

    enderecoPartida: {
        flex: 1,
        flexDirection: 'row',
        alignContent: 'center',
        alignItems: 'center',
        marginLeft: 15,
        marginBottom: 5,
    },

    txtPartida: {
        marginLeft: 4,
        fontFamily: 'Inter-Regular',
        fontSize: 13,
    },

    enderecoDestino: {
        flex: 1,
        flexDirection: 'row',
        marginTop: 5,
        alignContent: 'center',
        alignItems: 'center',
        marginLeft: 15,
    },

    txtDestino: {
        marginLeft: 4,
        fontFamily: 'Inter-Regular',
        fontSize: 13,
    },

    imgModalView: {
        marginTop: 10,
        marginLeft: 15,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },

    nomePessoa: {
        fontFamily: 'Inter-Bold',
        fontSize: 14,
        color: colors.BLACK,
        marginLeft: 8,
        marginRight: 8,
    },

    imagemModal: {
        height: 35,
        width: 35,
        borderRadius: 50,
    },

    iconPgt: {
        flexDirection: 'row',
        marginRight: 15,
        alignItems: 'center',
        paddingHorizontal: 15,
        borderRadius: 50,
        height: 25,
        backgroundColor: colors.GREY1,
    },

    formaPgt: {
        marginLeft: 2,
        height: 23,
        alignItems: 'center',
        justifyContent: 'center',
        width: 23,
        backgroundColor: colors.WHITE,
        borderRadius: 50,
    },

    viewmainBtn: {
        flex: 1,
    },

    viewBtn: {
        position: 'absolute',
        alignContent: 'center',
        alignItems: 'center',
        bottom: 10,
        left: 0,
        right: 0,
    },

    btnAceitar: {
        width: '95%',
        borderRadius: 50,
        flexDirection: 'row',
        height: 50,
        backgroundColor: colors.DEEPBLUE,
        alignItems: 'center',
        justifyContent: 'center',
    },

    txtBtnAceitar: {
        fontFamily: 'Inter-Bold',
        color: colors.WHITE,
        fontSize: 18,
    },
});
