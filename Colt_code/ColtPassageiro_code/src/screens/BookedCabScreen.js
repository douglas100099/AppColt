import React from 'react';
import {
    StyleSheet,
    View,
    Image,
    Dimensions,
    TouchableOpacity,
    Text,
    Modal,
    AsyncStorage,
    Alert,
    Linking,
    ActivityIndicator,
    Animated,
    Platform,
} from 'react-native';
import { Icon } from 'react-native-elements';
import RadioForm from 'react-native-simple-radio-button';
import { colors } from '../common/theme';
import * as firebase from 'firebase';
var { width, height } = Dimensions.get('window');
var smallDevice = width < 375;
import { RequestPushMsg } from '../common/RequestPushMsg';
import { google_map_key } from '../common/key';
import languageJSON from '../common/language';
import distanceCalc from '../common/distanceCalc';
import { TrackNow } from '../components';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import mapStyleAndroid from '../../mapStyleAndroid.json';
import { getPixelSize } from '../common/utils';
import ColtEconomicoCar from '../../assets/svg/ColtEconomicoCar';
import ColtConfortCar from '../../assets/svg/ColtConfortCar';
import AvatarUser from '../../assets/svg/AvatarUser';
import { NavigationActions, StackActions } from 'react-navigation';
import { ScrollView } from 'react-native-gesture-handler';
import { Pulse, Wander } from 'react-native-animated-spinkit'
import IconCarMap from '../../assets/svg/IconCarMap';

import BackgroundTask from "../common/BackgroundTask";
import Reanimated from 'react-native-reanimated';
import BottomSheet from 'reanimated-bottom-sheet';

import LocationDrop from '../../assets/svg/LocationDrop';
import LocationUser from '../../assets/svg/LocationUser';
import LocationWaypoint from '../../assets/svg/LocationWaypoint';

import BottomSheetComponent from '../components/BottomSheetComponent';

const COLT_ECONOMICO = "Colt econômico"
const COLT_CONFORT = "Colt confort"

export default class BookedCabScreen extends React.Component {
    _isMounted = false;
    getParamData;
    constructor(props) {
        super(props);
        this.state = {
            region: null,
            starCount: 5,
            modalVisible: false,
            alertModalVisible: false,
            coords: [],
            radio_props: [],
            settings: {
                cancell_value: '',
                code: '',
                symbol: '',
                cash: false,
                wallet: false,
                otp_secure: false
            },
            value: 0,
            driverSearch: false,
            bookingDataState: null,
            punisherCancell: false,
            embarque: false,
            modalInfoVisible: false,
            searchDisabled: false,
            showBtnCancel: false
        }
        this.searchDriverQueue = false
        this.driverObj = {
            driverUid: 0,
            driverLat: 0,
            driverLng: 0,
            driverAngle: 0
        }
        this.driverFound = false
        this.fadeAnim = new Animated.Value(0)
    }


    componentDidMount() {
        this._isMounted = true;
        this.state.bookingDataState == null ? this.getParamData = this.props.navigation.getParam('passData') : this.getParamData = this.state.bookingDataState
        let param = this.props.navigation.getParam('byMapScreen') ? this.props.navigation.getParam('byMapScreen') : null
        if (param == null) {
            this.setState({ driverSearch: true, showBtnCancel: true })
        }

        let curuser = firebase.auth().currentUser
        const bookingResponse = firebase.database().ref(`users/` + curuser.uid + '/my-booking/' + this.getParamData.bokkingId)
        bookingResponse.on('value', currUserBookings => {
            if (currUserBookings.val()) {
                let currUserBooking = currUserBookings.val()
                let region = {
                    wherelatitude: currUserBooking.pickup.lat,
                    wherelongitude: currUserBooking.pickup.lng,
                    droplatitude: currUserBooking.drop.lat,
                    droplongitude: currUserBooking.drop.lng,
                    whereText: currUserBooking.pickup.add,
                    droptext: currUserBooking.drop.add
                }
                this.setState({
                    payment: currUserBooking.pagamento,
                    waypoint: currUserBooking.waypoint != null ? currUserBooking.waypoint : null,
                    firstNameRider: currUserBooking.firstNameRider,
                    driver_firstName: currUserBooking.driver_firstName,
                    corVeiculo: currUserBooking.corVeh,
                    coords: this.getParamData.coords,
                    region: region,
                    currentBookingId: this.getParamData.bokkingId,
                    currentUser: curuser.uid,
                    bookingStatus: currUserBooking.status,
                    carType: currUserBooking.carType,
                    driverUID: currUserBooking.driver,
                    driverName: currUserBooking.driver_name,
                    driverPic: currUserBooking.driver_image,
                    driverContact: currUserBooking.driver_contact,
                    carModel: currUserBooking.vehicleModelName,
                    carNo: currUserBooking.vehicle_number,
                    starCount: currUserBooking.driverRating,
                }, () => {
                    this.getCancelReasons();
                })
            }
        })
        this._retrieveSettings
    }

    componentWillUnmount() {
        this._isMounted = false
    }

    _retrieveSettings = async () => {
        try {
            const value = await AsyncStorage.getItem('settings')
            if (value !== null) {
                this.setState({ settings: JSON.parse(value) })
            }
        } catch (error) {
            console.log("Asyncstorage issue 8 ")
        }
    }

    listenerStatus() {
        console.log("ENTROU NO LISTENER DO STATUS")
        const bookingResponse = firebase.database().ref(`users/` + this.state.currentUser + '/my-booking/' + this.state.currentBookingId);
        bookingResponse.on('value', currUserBookings => {
            let currUserBooking = currUserBookings.val()

            if (currUserBooking) {
                if (currUserBooking.status == "ACCEPTED") {
                    this.driverFound = false
                    this.setState({
                        data_accept: currUserBooking.data_accept ? currUserBooking.data_accept : null,
                        bookingStatus: currUserBooking.status,
                        driverSearch: false,
                    })
                }
                else if (currUserBooking.status == "CANCELLED") {
                    this.driverFound = false
                    this.props.navigation.replace('FareDetails', { data: this.state.region, waypoint: this.state.waypoint ? this.state.waypoint : null })
                }
                else if (currUserBooking.status == "TIMEOUT") {
                    this.driverFound = false
                    this.onCancellSearchBooking()
                }
                else if (currUserBooking.status == "EMBARQUE") {
                    this.setState({
                        embarque: true,
                        bookingStatus: currUserBooking.status
                    })
                }
                else if (currUserBooking.status == "START") {
                    this.props.navigation.replace('trackRide', { data: currUserBooking, bId: this.getParamData.bokkingId, });
                }
                else if (currUserBooking.status == "REJECTED") {
                    console.log("ENTROU NO REJECTED")
                    this.setState({ driverSearch: true, showBtnCancel: true })
                    this.driverFound = false
                    this.driverObj.driverUid = 0
                    this.selectNearbyDriver()
                }
            }
        })
    }

    checkRejected(bookingId, driverId) {
        return new Promise(function (result, reject) {
            firebase.database().ref('bookings/' + bookingId + '/rejectedDrivers').once('value', drivers => {
                if (drivers.val()) {
                    let rejectedDrivers = []
                    rejectedDrivers = drivers.val()

                    const check = Object.keys(rejectedDrivers).filter(i => rejectedDrivers[i] === driverId).map(i => {
                        rejectedDrivers[i] === driverId
                        return rejectedDrivers[i]
                    })

                    if (check.length == 0) {
                        result(false)
                    } else {
                        result(true)
                    }

                } else {
                    result(false)
                }
            })
        })
    }

    getLocations(bookingId) {
        return new Promise(function (result, reject) {
            firebase.database().ref('bookings/' + bookingId + '/').once('value', snapshot => {
                let dataBooking = snapshot.val()
                if (dataBooking) {
                    result({
                        locDrop: [dataBooking.drop.lat, dataBooking.drop.lng],
                        locDriver: [dataBooking.current.lat, dataBooking.current.lng]
                    })
                } else {
                    reject(console.log("ERRO AO PEGAR LOCATION EM CORRIDA"))
                }
            })
        })
    }

    async selectNearbyDriver() {
        console.log("PROCURANDO MOTORISTA")
        try {
            if (this._isMounted) {
                const userData = firebase.database().ref('users/').orderByChild("usertype").equalTo('driver')
                let distanciaValue = 10
                let distTotal = 50

                userData.once('value', async driverData => {
                    let drivers = driverData.val();
                    for (let key in drivers) {
                        if (drivers[key].driverActiveStatus && drivers[key].carType == this.state.carType && !drivers[key].waiting_queue_riders && !drivers[key].waiting_riders_list) {

                            //Verifica se o motorista rejeitou a corrida
                            let userRejected = await this.checkRejected(this.state.currentBookingId, key)
                            if (userRejected == false) {
                                if (this.searchDriverQueue ? drivers[key].queue == true : drivers[key].queue == false) {
                                    if (this.searchDriverQueue ? drivers[key].queueAvailable == true : true) {
                                        let locRider = [this.state.region.wherelatitude, this.state.region.wherelongitude];    //Rider Lat and Lang

                                        if (this.searchDriverQueue) {
                                            let locationsBooking = await this.getLocations(drivers[key].emCorrida)
                                            if (locationsBooking) {
                                                let distanceDrop = distanceCalc(locRider, locationsBooking.locDrop)
                                                let distanceTotal = distanceDrop + distanceCalc(locationsBooking.locDrop, locationsBooking.locDriver)

                                                if (distanceDrop <= 4 && distanceTotal < distTotal) {
                                                    distTotal = distanceTotal
                                                    this.driverObj.driverUid = key
                                                    this.driverObj.driverLat = drivers[key].location.lat
                                                    this.driverObj.driverLng = drivers[key].location.lng
                                                    this.driverObj.driverAngle = drivers[key].location.angle
                                                }
                                            }
                                        }
                                        else {
                                            let locDriver = [drivers[key].location.lat, drivers[key].location.lng];   //Driver lat and lang

                                            //Calcula a distancia entre dois pontos
                                            let distance = distanceCalc(locRider, locDriver);
                                            if (distance <= 4 && distance < distanciaValue) { //4KM
                                                distanciaValue = distance
                                                this.driverObj.driverUid = key
                                                this.driverObj.driverLat = drivers[key].location.lat
                                                this.driverObj.driverLng = drivers[key].location.lng
                                                this.driverObj.driverAngle = drivers[key].location.angle
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }).then(() => {
                    this.confirmBookingDriver()
                })
            }
        }
        catch (err) {
            console.log(err)
        }
    }

    confirmBookingDriver() {
        try {
            let bookingData = {
                bokkingId: this.state.currentBookingId,
                coords: this.state.coords
            }
            if (this.driverObj.driverUid != 0) {
                this.driverFound = true
                this.setState({ driverSearch: false })
                this.sendPushNotification(this.state.currentUser, "Estamos conectando você ao motorista.")
                //this.fitDriverUser()
                Linking.openURL('coltpassageiro://')

                const driverRef = firebase.database().ref('users/' + this.driverObj.driverUid + '/')
                driverRef.once('value', snap => {
                    const data = snap.val()
                    if (data.queue == true && data.queueAvailable == true && data.driverActiveStatus == true) {
                        this.setState({ searchDriverQueue: true })
                        this.setBookingDriver("waiting_queue_riders", this.state.currentBookingId, bookingData, this.driverObj.driverUid)
                    }
                    else if (data.queue == false && data.driverActiveStatus == true) {
                        this.setState({ searchDriverQueue: false })
                        this.setBookingDriver("waiting_riders_list", this.state.currentBookingId, bookingData, this.driverObj.driverUid)
                    }
                })
            }
            else {
                this.searchDriverQueue = !this.searchDriverQueue
                this.driverObj.driverUid = 0

                if (this.state.driverSearch)
                    this.selectNearbyDriver()
            }
        }
        catch (err) {
            console.log(err)
        }
    }

    async setBookingDriver(name, bookingId, bookingData, driverUID) {
        let dataBooking = await this.getBookingData(bookingId)

        if (dataBooking != null) {
            firebase.database().ref('users/' + driverUID + '/' + name + '/' + bookingId + '/').set(dataBooking)
                .then(() => {
                    firebase.database().ref(`users/` + this.state.currentUser + '/my-booking/' + this.getParamData.bokkingId).update({ status: "NEW" })
                        .then(() => {
                            firebase.database().ref('bookings/' + bookingId + '/').update({
                                status: "NEW",
                                requestedDriver: driverUID
                            })
                                .then(() => {
                                    this.setState({ bookingDataState: bookingData })
                                    this.sendPushNotification(driverUID, languageJSON.new_booking_request_push_notification)
                                })
                                .catch((err) => {
                                    console.log(err)
                                })
                        })
                        .catch((err) => {
                            console.log(err)
                        })
                })
                .catch((err) => {
                    console.log(err)
                })
        }
    }

    async getBookingData(param) {
        const ref = firebase.database().ref('bookings/' + param + '/');

        return new Promise(function (result, reject) {
            ref.on('value', snapshot => {
                let dataBooking = snapshot.val();
                if (dataBooking.status == "REJECTED") {
                    dataBooking.status = "NEW"
                }
                if (dataBooking) {
                    result(dataBooking)
                } else {
                    reject(console.log("ERRO AO CARREGAR CORRIDA"))
                }
            })
        })
    }

    getCancelReasons() {
        const reasonListPath = firebase.database().ref('/cancel_reason/');
        reasonListPath.once('value', reasons => {
            if (reasons.val()) {
                this.setState({
                    radio_props: reasons.val()
                })
            }
        })
    }

    //Cancell Button Press
    async onPressCancellBtn() {
        if (this.searchDriverQueue && this.state.driverSearch == false) {
            Alert.alert(
                'Alerta!',
                'Deseja cancelar a corrida atual?',
                [
                    {
                        style: 'default',
                        text: 'Voltar',
                    },
                    {
                        style: 'destructive',
                        text: 'Continuar',
                        onPress: () => this.onCancellBookingQueue()
                    },
                ],
                { cancelable: true },
            );
        } else {
            if (this.state.bookingStatus == 'NEW' || this.state.bookingStatus == 'REJECTED') {
                this.onCancellSearchBooking(true)
            }
            else if (this.state.bookingStatus == 'ACCEPTED') {
                if (this.state.data_accept != null) {
                    const timeCurrent = new Date().getTime();

                    if (timeCurrent - this.state.data_accept >= 60000) {
                        this.setState({ modalInfoVisible: true })
                    } else {
                        Alert.alert(
                            'Alerta!',
                            'Deseja cancelar a corrida atual?',
                            [
                                {
                                    style: 'default',
                                    text: 'Voltar',
                                },
                                {
                                    style: 'destructive',
                                    text: 'Continuar',
                                    onPress: () => this.onCancelConfirm()
                                },
                            ],
                            { cancelable: true },
                        );
                    }
                } else {
                    this.setState({ modalVisible: true })
                }
            }
            else if (this.state.bookingStatus == 'EMBARQUE') {
                this.setState({ modalInfoVisible: true })
            }
        }
    }

    dissMissCancel() {
        this.setState({ modalVisible: false, modalInfoVisible: false, punisherCancell: false })
    }

    onCancellBookingQueue() {
        //Essa parte serve pra caso o motorista ter aceito a corrida e o passageiro cancelar em seguida
        firebase.database().ref('users/' + this.state.currentUser + '/my-booking/' + this.state.currentBookingId + '/').on('value', curbookingData => {
            if (curbookingData.val()) {
                if (this.state.bookingStatus == 'ACCEPTED' || this.state.bookingStatus == 'EMBARQUE') {
                    firebase.database().ref('bookings/' + this.state.currentBookingId + '/').update({
                        cancel_time: new Date().toString(),
                        status: 'CANCELLED',
                    }).then(() => {
                        firebase.database().ref('users/' + curbookingData.val().driver + '/my_bookings/' + this.state.currentBookingId + '/').update({
                            cancel_time: new Date().toString(),
                            status: 'CANCELLED',
                        }).then(() => {
                            firebase.database().ref('users/' + this.state.currentUser + '/my-booking/' + this.state.currentBookingId + '/').update({
                                cancel_time: new Date().toString(),
                                status: 'CANCELLED',
                            }).then(() => {
                                firebase.database().ref('users/' + curbookingData.val().driver + '/rider_waiting_object/' + this.state.currentBookingId + '/').remove().then(() => {
                                    firebase.database().ref('users/' + curbookingData.val().requestedDriver + '/').update({
                                        queueAvailable: true,
                                    })
                                })
                                this.sendPushNotification(curbookingData.val().driver, this.state.firstNameRider + ' cancelou a corrida em espera!')
                            })
                        })
                    })
                }
                else if (this.state.bookingStatus == 'NEW' || this.state.bookingStatus == "START") {
                    alert("Não foi possível cancelar a corrida pois ela ja iniciou!")
                }
            }
        })
    }

    //Cancelar corrida antes do motorista ter aceito
    onCancellSearchBooking(params) {
        if (params) {
            //Atualiza o status da corrida em "bookings" no firebase
            firebase.database().ref(`bookings/` + this.state.currentBookingId + '/').update({
                cancel_time: new Date().toString(),
                status: 'CANCELLED',
            })
        }
        //Remove a corrida do perfil do passageiro
        firebase.database().ref(`/users/` + this.state.currentUser + '/my-booking/' + this.state.currentBookingId + '/').remove()
            .then(() => {
                //Remove booking request do requested drivers no firebase
                const requestedDriver = firebase.database().ref('bookings/' + this.state.currentBookingId + '/requestedDriver');
                requestedDriver.once('value', drivers => {
                    if (drivers.val()) {
                        let requestedDriver = drivers.val();
                        this.searchDriverQueue ?
                            firebase.database().ref('users/' + requestedDriver + '/waiting_queue_riders/' + this.state.currentBookingId + '/').remove()
                            :
                            firebase.database().ref('users/' + requestedDriver + '/waiting_riders_list/' + this.state.currentBookingId + '/').remove()
                    }
                }).then(() => {
                    firebase.database().ref('bookings/' + this.state.currentBookingId + '/requestedDriver/').remove()
                })
            })

        this.setState({ driverSearch: false })
        this.props.navigation.replace('FareDetails', { data: this.state.region, waypoint: this.state.waypoint ? this.state.waypoint : null })
    }

    onCancelConfirm() {
        const dataCustomer = firebase.database().ref('users/' + this.state.currentUser + '/my-booking/' + this.state.currentBookingId + '/')

        //Essa parte serve pra caso o motorista ter aceito a corrida e o passageiro cancelar em seguida
        dataCustomer.on('value', curbookingData => {
            if (curbookingData.val()) {
                if (curbookingData.val().status == 'ACCEPTED' || curbookingData.val().status == 'EMBARQUE') {
                    firebase.database().ref('bookings/' + this.state.currentBookingId + '/').update({
                        cancel_time: new Date().toString(),
                        status: 'CANCELLED',
                    }).then(() => {
                        firebase.database().ref('users/' + curbookingData.val().driver + '/my_bookings/' + this.state.currentBookingId + '/').update({
                            cancel_time: new Date().toString(),
                            status: 'CANCELLED',
                            reason: this.state.radio_props[this.state.value].label
                        }).then(() => {
                            if (this.state.punisherCancell) {
                                firebase.database().ref('users/' + this.state.currentUser + '/cancell_details/').update({
                                    bookingId: this.state.currentBookingId,
                                    data: new Date().toString(),
                                    value: 3
                                })
                            }
                        }).then(() => {
                            firebase.database().ref('users/' + curbookingData.val().driver + '/').update({ queue: false }).then(() => {
                                this.sendPushNotification(curbookingData.val().driver, this.state.firstNameRider + ' cancelou a corrida atual!')
                            })
                        }).then(() => {
                            dataCustomer.update({
                                cancel_time: new Date().toString(),
                                status: 'CANCELLED',
                                reason: this.state.radio_props[this.state.value].label
                            })
                        })
                    })
                }
                else if (curbookingData.val().status == 'START') {
                    alert("Não foi possível cancelar essa corrida, ela ja iniciou!")
                }
            }
        })

        this.setState({ modalVisible: false })
    }

    //Botao ligar pro motorista
    onPressCall(phoneNumber) {
        Linking.canOpenURL(phoneNumber).then(supported => {
            if (!supported) {
                console.log('Can\'t handle Phone Number: ' + phoneNumber);
            } else {
                return Linking.openURL(phoneNumber);
            }
        }).catch(err => console.error('An error occurred', err));
    }

    sendPushNotification(customerUID, msg) {
        const customerRoot = firebase.database().ref('users/' + customerUID);
        customerRoot.once('value', customerData => {
            if (customerData.val()) {
                let allData = customerData.val()
                RequestPushMsg(allData.pushToken ? allData.pushToken : null, msg)
            }
        })
    }

    //Modal cancelar corrida
    cancelModal() {
        return (
            <Modal
                animationType='slide'
                transparent={true}
                visible={this.state.modalVisible}
                onRequestClose={() => {
                    this.setState({ modalVisible: false })
                }}>
                <View style={styles.cancelModalContainer}>
                    <View style={styles.cancelModalInnerContainer}>
                        <View style={styles.cancelReasonContainer}>
                            <Text style={styles.cancelReasonText}>{languageJSON.cancel_reason_modal_title}</Text>
                        </View>

                        <View style={styles.radioContainer}>
                            <ScrollView>
                                <RadioForm
                                    radio_props={this.state.radio_props ? this.state.radio_props : null}
                                    initial={0}
                                    animation={false}
                                    buttonColor={colors.GREY2}
                                    selectedButtonColor={colors.DEEPBLUE}
                                    buttonSize={10}
                                    buttonOuterSize={20}
                                    style={styles.radioContainerStyle}
                                    labelStyle={styles.radioText}
                                    radioStyle={styles.radioStyle}
                                    onPress={(value) => { this.setState({ value: value }) }}
                                />
                            </ScrollView>
                        </View>
                        <View style={styles.cancelModalButtosContainer}>
                            <TouchableOpacity onPress={() => this.onCancelConfirm()}>
                                <View style={{ width: width - 150, justifyContent: 'center', alignItems: 'center', height: 45, backgroundColor: colors.DEEPBLUE, borderRadius: 50 }}>
                                    <Text style={{ fontFamily: "Inter-Bold", color: colors.WHITE, fontSize: 17 }}> Confirmar </Text>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => this.dissMissCancel()}>
                                <Text style={{ marginBottom: 15, marginTop: 17, fontFamily: 'Inter-Medium', color: colors.RED, fontSize: width < 375 ? 17 : 20 }}> Voltar </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

            </Modal>
        )
    }

    infoModal() {
        return (
            <Modal
                animationType="slide"
                transparent={true}
                visible={this.state.modalInfoVisible}
                onRequestClose={() => {
                    this.setState({ modalInfoVisible: false })
                }}
            >
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{ height: 400, backgroundColor: colors.WHITE, borderRadius: 15, marginHorizontal: 20 }}>
                        <View style={{ flex: 2, flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                            <Icon
                                name="ios-alert"
                                type="ionicon"
                                size={60}
                                color={colors.RED}
                            />
                            <Text style={{ fontFamily: 'Inter-Bold', fontSize: 20 }}> Cuidado! </Text>
                        </View>
                        <View style={{ flex: 3, flexDirection: 'column', }}>
                            <Text style={{ marginHorizontal: 10, fontSize: 15, textAlign: 'center', fontFamily: 'Inter-Medium' }}> Essa corrida já está em andamento e você já ultrapassou o tempo máximo de cancelamento (1 min). </Text>
                            <Text style={{ marginHorizontal: 10, fontSize: 15, marginTop: 10, textAlign: 'center', fontFamily: 'Inter-Medium' }}> Ao cancelar, será cobrada uma taxa no valor de R$3,00 na próxima corrida! </Text>
                        </View>

                        <View style={{}}>
                            <Text style={{ marginHorizontal: 10, fontSize: 17, textAlign: "center", marginBottom: 10, fontFamily: 'Inter-Bold' }}> Deseja continuar? </Text>
                            <TouchableOpacity onPress={() => { this.setState({ punisherCancell: true, modalVisible: true, modalInfoVisible: false }) }}>
                                <View style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: colors.RED, marginHorizontal: 40, height: 45, borderRadius: 50 }}>
                                    <Text style={{ fontFamily: 'Inter-Bold', fontSize: 17, color: colors.WHITE }}> Continuar </Text>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => this.dissMissCancel()}>
                                <View style={{ marginTop: 15, flexDirection: 'column', alignItems: 'center' }}>
                                    <Text style={{ fontFamily: 'Inter-Bold', fontSize: 20, marginBottom: 15, color: colors.DEEPBLUE }}> Voltar </Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        )
    }

    searchModal() {
        return (
            <Modal
                animationType="fade"
                transparent={false}
                visible={this.state.driverSearch}
                onRequestClose={() => {
                    this.setState({ driverSearch: false })
                }}
            >
                <View style={{ flex: 1, backgroundColor: colors.WHITE, width: width, height: height, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={styles.textGif}> Procurando motoristas próximos </Text>

                    <View style={{ justifyContent: 'center', alignItems: 'center', alignSelf: 'center', }}>
                        <Pulse
                            size={350}
                            color={colors.GREY2}
                        />
                        <IconCarMap
                            width={120}
                            height={190}
                            style={{
                                position: 'absolute',
                                shadowColor: '#000',
                                shadowOffset: { x: 0, y: 5 },
                                shadowOpacity: 0.1,
                                shadowRadius: 5,
                            }}
                        />
                    </View>
                    {this.state.showBtnCancel ?
                        <TouchableOpacity disabled={this.state.searchDisabled} style={styles.touchView} onPress={() => { this.setState({ searchDisabled: true }), this.onPressCancellBtn() }}>
                            <Text style={styles.textCancel}> Cancelar </Text>
                        </TouchableOpacity>
                        : null}
                </View>
            </Modal>
        )
    }

    chat() {
        this.props.navigation.navigate("onlineChat", { passData: this.getParamData, firstNameRider: this.state.firstNameRider })
    }

    fitDriverUser() {
        if (this.driverObj.driverLat && this.driverObj.driverLng) {
            this.mapView.fitToCoordinates([{ latitude: this.driverObj.driverLat, longitude: this.driverObj.driverLng }, { latitude: this.state.region.wherelatitude, longitude: this.state.region.wherelongitude }], {
                edgePadding: { top: getPixelSize(50), right: getPixelSize(50), bottom: getPixelSize(50), left: getPixelSize(50) },
                animated: true,
            })
        }
    }

    fadeIn() {
        Animated.timing(this.fadeAnim, {
            toValue: .3,
            duration: 250,
            useNativeDriver: false,
        }).start()
    }

    fadeOut() {
        Animated.timing(this.fadeAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: false,
        }).start()
    }

    render() {
        return (
            <View style={styles.mainContainer}>
                <View style={{
                    flex: this.state.driverSearch == false && this.driverFound == false ? 7 : 1
                }}>
                    {this.state.driverUID && this.state.region && this.state.bookingStatus && this.state.driverSearch == false ?
                        <TrackNow setTimeEstimate={(timeEstimate) => { this.setState({ timeDriverEstimate: timeEstimate }) }} duid={this.state.driverUID} alldata={this.state.region} bookingStatus={this.state.bookingStatus} />
                        :
                        <View style={{ flex: 1 }}>
                            <View style={{ flex: 1, zIndex: 99 }}>

                                <MapView
                                    provider={PROVIDER_GOOGLE}
                                    showsUserLocation={true}
                                    ref={(ref) => this.mapView = ref}
                                    loadingEnabled
                                    showsMyLocationButton={false}
                                    style={styles.map}
                                    //initialRegion={this.state.region}
                                    //onRegionChange={() => { this.setState({ showsMyLocationBtn: true }) }}
                                    enablePoweredByContainer={false}
                                    //zoomControlEnabled={false}
                                    scrollEnabled={false}
                                    showsCompass={false}
                                    showsScale={false}
                                    rotateEnabled={false}
                                    customMapStyle={mapStyleAndroid}
                                    region={{
                                        latitude: this.driverObj.driverLat ? this.driverObj.driverLat : 0,
                                        longitude: this.driverObj.driverLng ? this.driverObj.driverLng : 0,
                                        latitudeDelta: 0.0043,
                                        longitudeDelta: 0.0034,
                                    }}
                                >
                                    {this.driverFound && this.driverObj.driverLat != 0 && this.driverObj.driverLng != 0 ?
                                        <Marker
                                            coordinate={{ latitude: this.driverObj.driverLat, longitude: this.driverObj.driverLng }}
                                            centerOffset={{ x: 0.1, y: 0.1 }}
                                            anchor={{ x: 0.1, y: 0.1 }}
                                        >
                                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', }}>
                                                {/*<Pulse
                                                    size={350}
                                                    color={colors.DEEPBLUE}
                                                    style={{ position: 'absolute' }}
                                                />*/}
                                                <IconCarMap
                                                    width={40}
                                                    height={40}
                                                    style={{
                                                        transform: [{ rotate: this.driverObj.driverAngle + "deg" }],
                                                        shadowColor: colors.BLACK,
                                                        shadowOpacity: 0.2,
                                                        shadowOffset: { x: 0.1, y: 0.1 },
                                                        shadowRadius: 5,
                                                        elevation: 3
                                                    }}
                                                />
                                            </View>
                                        </Marker>
                                        : null}
                                </MapView>

                                <Animated.View
                                    style={
                                        {
                                            width: '100%',
                                            height: '100%',
                                            backgroundColor: colors.DARK,
                                            opacity: this.fadeAnim
                                        }
                                    }
                                >
                                </Animated.View>

                                <BottomSheet
                                    //ref={ref => sheetRef}
                                    //onOpenEnd={() => console.log("TETSE")}
                                    onCloseEnd={() => this.fadeOut()}
                                    onOpenEnd={() => this.fadeIn()}
                                    snapPoints={[100, '45%', 100]}
                                    borderRadius={20}
                                    renderContent={() =>
                                        <BottomSheetComponent
                                            customStyle={{ height: height * 0.45 }}
                                            region={this.state.region ? this.state.region : null}
                                            waypoint={this.state.waypoint ? this.state.waypoint : null}
                                            payment={this.state.payment ? this.state.payment : null}
                                            carType={this.state.carType ? this.state.carType : ""}
                                        />
                                    }
                                />

                            </View>
                            <View style={{ backgroundColor: colors.DARK, height: 0, width: 0 }}>
                                <BackgroundTask
                                    interval={300}
                                    function={() => {
                                        console.log("CHAMOU AS FUNÇOES DO BACKGROUND")
                                        this.selectNearbyDriver()
                                        this.listenerStatus()
                                    }}
                                />
                            </View>
                        </View>
                    }

                    {this.state.driverSearch == false && this.driverFound == false ?
                        <View>
                            <TouchableOpacity style={styles.btnChatMotorista} onPress={() => this.chat()}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={styles.txtChatMotorista}> Chat </Text>
                                    <Icon
                                        name="message-circle"
                                        type="feather"
                                        // icon: 'chat', color: '#fff',
                                        size={20}
                                        color={colors.DEEPBLUE}
                                    />
                                </View>
                            </TouchableOpacity>
                        </View>
                        : null}

                    {this.searchDriverQueue ?
                        <View style={styles.viewQueueBooking}>
                            <Text style={{ textAlign: 'center', paddingHorizontal: 5, fontFamily: 'Inter-Medium', fontSize: 15, color: colors.WHITE }}> O motorista está terminando uma corrida próxima a você, aguarde. </Text>
                        </View>
                        : null}
                </View>

                {this.state.driverSearch == false && this.driverFound == false ?
                    <View style={styles.viewInfo}>
                        <Text style={{ color: colors.WHITE, fontFamily: 'Inter-Bold', fontSize: 14, alignSelf: 'center' }}> Confira as informações e a placa do carro!</Text>
                    </View>
                    : null}

                {this.state.embarque ?
                    <View style={styles.viewEmbarque}>
                        <Text style={{ color: colors.BLACK, fontFamily: 'Inter-Medium', fontSize: width < 375 ? 15 : 17, textAlign: 'center' }}> Encontre o motorista em {this.state.region.whereText.split("-")[0]} </Text>
                    </View>
                    : null}

                {this.state.driverSearch == false && this.driverFound == false ?
                    <View style={[styles.containerBottom, { flex: this.state.embarque ? 4.5 : width < 375 ? 4.5 : 4 }]}>
                        <View style={{ flex: 3 }}>
                            <View style={styles.containerFoto}>
                                <View style={{ borderWidth: 1.5, borderColor: colors.GREY2, borderRadius: 100 }}>
                                    {this.state.driverPic ?
                                        <Image source={{ uri: this.state.driverPic }} style={{ width: 72, height: 72, borderRadius: 50 }} />
                                        :
                                        <AvatarUser
                                            style={{ margin: 3 }}
                                        />
                                    }
                                </View>

                                <View style={styles.rating}>
                                    <Text style={{ fontFamily: 'Inter-Bold', fontSize: 15, top: 1, paddingStart: 7 }}> {this.state.starCount ? this.state.starCount : null} </Text>
                                    <Icon
                                        name="ios-star"
                                        type="ionicon"
                                        // icon: 'chat', color: '#fff',
                                        size={18}
                                        color={colors.DARK}
                                        containerStyle={{ paddingEnd: 7 }}
                                    />
                                </View>
                                <Text style={styles.nameDriver}> {this.state.driver_firstName ? this.state.driver_firstName : null} </Text>
                            </View>

                            <View style={styles.containerCarDetails}>
                                <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                                    {this.state.carType == "Colt econômico" ?
                                        width < 375 ?
                                            <ColtEconomicoCar
                                                width={80}
                                                height={50}
                                            />
                                            :
                                            <ColtEconomicoCar />
                                        :
                                        width < 375 ?
                                            <ColtConfortCar
                                                width={80}
                                                height={50}
                                            />
                                            :
                                            <ColtConfortCar />
                                    }
                                    <Text style={{ fontSize: width < 375 ? 16 : 18, fontFamily: 'Inter-Medium', fontWeight: "500", textAlign: 'center', marginBottom: 5 }}> {this.state.carType} </Text>
                                </View>

                                <View style={styles.boxPlacaCarro}>
                                    <Text style={styles.placaCarro} > {this.state.carNo ? this.state.carNo : null} </Text>
                                </View>
                                <View style={styles.containerTxtCarro}>
                                    <Text style={styles.marcaCarro}> {this.state.carModel ? this.state.carModel : null} </Text>
                                    <Text style={styles.corVeiculo}> • {this.state.corVeiculo ? this.state.corVeiculo : null} </Text>
                                </View>
                            </View>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{ backgroundColor: colors.DEEPBLUE, height: 50, width: 70, marginLeft: 25, marginBottom: 10, alignItems: 'center', justifyContent: 'center' }}>
                                {this.state.timeDriverEstimate ?
                                    <Text style={{ fontFamily: 'Inter-Bold', paddingHorizontal: 5, color: '#fff', fontSize: 17 }}> {this.state.timeDriverEstimate} </Text>
                                    :
                                    <ActivityIndicator
                                        size={'small'}
                                        color={colors.WHITE}
                                    />
                                }
                            </View>
                            <Text style={{ fontFamily: 'Inter-Bold', color: colors.GREY2, fontSize: 17, marginLeft: 10 }}> Tempo estimado do motorista </Text>
                        </View>

                        <View style={{ justifyContent: 'center', alignItems: 'center', flex: .1, alignSelf: 'center' }}>
                            <View style={{ height: 1, width: width - 30, backgroundColor: colors.GREY2 }} />
                        </View>

                        <View style={styles.containerBtn}>
                            <TouchableOpacity style={styles.btnLigarMotorista} onPress={() => { this.onPressCall('tel: ' + this.state.driverContact) }}>
                                <View>
                                    <Text style={styles.txtLigarMotorista}> Ligar pro motorista </Text>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.btnCancelarCorrida} onPress={() => { this.onPressCancellBtn() }}>
                                <View style={styles.bordaIcon}>
                                    <Icon
                                        name="x"
                                        type="feather"
                                        // icon: 'chat', color: '#fff',
                                        size={35}
                                        color={colors.WHITE}
                                    />
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                    : null}

                {
                    this.infoModal()
                }
                {
                    this.searchModal()
                }
                {
                    this.cancelModal()
                }
            </View>
        );
    }
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: colors.WHITE,
    },

    ///////////////////////////
    btnChatMotorista: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        right: 0,
        height: 30,
        borderRadius: 50,
        backgroundColor: colors.WHITE,
        borderWidth: 1,
        borderColor: colors.DEEPBLUE,
        width: 100,
        bottom: 0,
        marginBottom: 8,
        marginRight: 10,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowOffset: { x: 0, y: 0 },
        shadowRadius: 10,
        elevation: 5
    },
    carEconomico: {
        marginHorizontal: 20,
        top: 0,
        width: 100,
        height: 40,
        opacity: 0.4
    },
    btnTeste: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        right: 0,
        height: 45,
        width: 45,
        borderRadius: 50,
        backgroundColor: colors.WHITE,
        bottom: 50,
        marginBottom: 8,
        marginRight: 10,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowOffset: { x: 0, y: 0 },
        shadowRadius: 10,
        elevation: 5
    },
    txtChatMotorista: {
        fontFamily: 'Inter-Bold',
        fontSize: width < 375 ? 14 : 16,
        color: colors.BLACK,
    },
    bottomContainer: {
        flex: 2.5,
        alignItems: 'center'
    },
    map: {
        flex: 1,
        ...StyleSheet.absoluteFillObject,
    },
    touchView: {
        borderRadius: 50,
        height: 50,
        backgroundColor: colors.REDCLEAN,
        opacity: 0.7,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        position: 'absolute',
        right: 70,
        left: 70,
        bottom: 25,
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowOffset: { x: 0, y: 0 },
        shadowRadius: 15,
    },
    textCancel: {
        color: '#fff',
        fontFamily: 'Inter-Bold',
        fontSize: 18,
    },
    textGif: {
        color: colors.DARK,
        top: 75,
        position: 'absolute',
        fontSize: 22,
        fontFamily: 'Inter-SemiBold',
        opacity: 0.8,
    },
    textGif2: {
        color: colors.DARK,
        top: 100,
        textAlign: 'center',
        position: 'absolute',
        fontSize: 17,
        fontFamily: 'Inter-Medium',
        opacity: 0.5,
    },
    styleGif: {
        width: '100%',
        height: '100%',
        position: 'absolute',
        flex: 1
    },

    //alert modal
    alertModalContainer: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: colors.GREY.background
    },
    alertModalInnerContainer: {
        height: 200,
        width: (width * 0.85),
        backgroundColor: colors.WHITE,
        alignItems: 'center',
        alignSelf: 'center',
        borderRadius: 7
    },
    alertContainer: {
        flex: 2,
        justifyContent: 'space-between',
        width: (width - 100)
    },
    rideCancelText: {
        flex: 1,
        top: 15,
        color: colors.BLACK,
        fontFamily: 'Inter-Bold',
        fontSize: 20,
        alignSelf: 'center'
    },
    horizontalLLine: {
        width: (width - 110),
        height: 0.5,
        backgroundColor: colors.BLACK,
        alignSelf: 'center',
    },
    msgContainer: {
        flex: 2.5,
        alignItems: 'center',
        justifyContent: 'center'
    },
    cancelMsgText: {
        color: colors.BLACK,
        fontFamily: 'Inter-Bold',
        fontSize: 15,
        alignSelf: 'center',
        textAlign: 'center'
    },
    okButtonContainer: {
        flex: 1,
        width: (width * 0.85),
        flexDirection: 'row',
        backgroundColor: colors.GREY.iconSecondary,
        alignSelf: 'center'
    },
    okButtonStyle: {
        flexDirection: 'row',
        backgroundColor: colors.GREY.iconSecondary,
        alignItems: 'center',
        justifyContent: 'center'
    },
    okButtonContainerStyle: {
        flex: 1,
        width: (width * 0.85),
        backgroundColor: colors.GREY.iconSecondary,
    },

    //cancel modal
    cancelModalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',

    },
    cancelModalInnerContainer: {
        height: 450,
        width: width * 0.90,
        padding: 0,
        backgroundColor: colors.WHITE,
        alignItems: 'center',
        alignSelf: 'center',
        borderRadius: 7,
        elevation: 4,
        shadowColor: colors.BLACK,
        shadowOpacity: 0.2,
        shadowOffset: { x: 0, y: 0 },
        shadowRadius: 15,
    },
    cancelReasonContainer: {
        flex: 2
    },
    cancelReasonText: {
        top: 10,
        color: colors.BLACK,
        fontFamily: 'Inter-Bold',
        fontSize: width < 375 ? 17 : 20,
        alignSelf: 'center'
    },
    radioContainer: {
        flex: 10,
        alignItems: 'center'
    },
    radioText: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
        color: colors.BLACK,
    },
    radioContainerStyle: {
        paddingTop: 30,
        marginLeft: 20
    },
    radioStyle: {
        paddingBottom: 25
    },
    cancelModalButtosContainer: {
        flex: 4,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
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
    viewQueueBooking: {
        backgroundColor: colors.transparent,
        height: 45,
        width: '100%',
        alignSelf: 'center',
        borderRadius: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { x: 0, y: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 3,
    },
    viewInfo: {
        backgroundColor: colors.GREY2,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { x: 0, y: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 3,
    },
    viewEmbarque: {
        borderBottomWidth: 2,
        borderColor: colors.GREY.background,
        backgroundColor: colors.GREY3,
        opacity: 0.6, height: 60,
        justifyContent: 'center',
        alignItems: 'center'
    },
    containerBottom: {
        width: width,
        shadowColor: '#000',
        shadowOffset: { x: 0, y: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 5,
        backgroundColor: colors.WHITE,
        flex: 3.5,
        alignSelf: 'center',
    },
    containerFoto: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        left: 40,
        top: 15,
    },
    ImageStyle: {
        width: 90,
        height: 90,
        borderColor: colors.GREY1,
        borderWidth: 2,
        borderRadius: 100
    },
    nameDriver: {
        fontFamily: 'Inter-Bold',
        fontSize: width < 375 ? 17 : 19,
        fontWeight: "600",
    },
    reLocation: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.WHITE,
        width: 60,
        height: 60,
        borderRadius: 100
    },
    rating: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 50,
        backgroundColor: colors.WHITE,
        top: -10,
        shadowColor: '#000',
        shadowOffset: { x: 0, y: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 5,
    },
    containerCarDetails: {
        position: 'absolute',
        right: 15,
        top: 0,
        flexDirection: 'column',
        //backgroundColor: colors.RED
    },
    containerBtn: {
        flex: 1.3,
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center',
    },
    btnLigarMotorista: {
        backgroundColor: colors.WHITE,
        borderWidth: 2,
        borderColor: colors.DEEPBLUE,
        height: width < 375 ? 40 : 45,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        width: width < 375 ? 220 : 250
    },
    btnCancelarCorrida: {
        backgroundColor: colors.RED,
        opacity: 0.5,
        width: width < 375 ? 40 : 50,
        height: width < 375 ? 40 : 50,
        borderRadius: 100,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 30,
        shadowColor: '#000',
        shadowOffset: { x: 0, y: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 5,

    },
    txtLigarMotorista: {
        fontFamily: 'Inter-Bold',
        color: colors.DEEPBLUE,
        fontSize: width < 375 ? 17 : 19,
    },
    boxPlacaCarro: {
        width: 150,
        backgroundColor: colors.WHITE,
        borderRadius: 50,
        borderWidth: 1.5,
        borderColor: colors.GREY2,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.5,
        height: 30,
        marginTop: 0,
    },
    placaCarro: {
        fontSize: width < 375 ? 20 : 23,
        fontFamily: 'Inter-Bold',
        fontWeight: '500',

    },
    containerTxtCarro: {
        marginTop: 7,
        alignItems: 'center',
        flexDirection: 'row'
        //width: 150,
    },
    marcaCarro: {
        fontFamily: 'Inter-Regular',
        color: colors.DARK,
        fontSize: width < 375 ? 16 : 18,
        //position: 'absolute',
        //right: 0
    },
    corVeiculo: {
        fontFamily: 'Inter-ExtraBold',
        fontSize: 11
    }
});