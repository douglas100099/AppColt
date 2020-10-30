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
    Linking,
} from 'react-native';
import { Icon, Button } from 'react-native-elements';
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
import Polyline from '@mapbox/polyline';

import ColtEconomicoCar from '../../assets/svg/ColtEconomicoCar';
import ColtConfortCar from '../../assets/svg/ColtConfortCar';
import AvatarUser from '../../assets/svg/AvatarUser';
import { NavigationActions, StackActions } from 'react-navigation';

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
            value: 0,
            driverSerach: true,
            bookingDataState: null,
            punisherCancell: false,
            embarque: false,
            modalInfoVisible: false,
            searchDisabled: false,
        }
    }

    componentDidMount() {
        this._isMounted = true;
        this.state.bookingDataState == null ? this.getParamData = this.props.navigation.getParam('passData') : this.getParamData = this.state.bookingDataState
        this.props.navigation.getParam('riderName') ? this.state.riderName = this.props.navigation.getParam('riderName') : null

        this.searchDriver(this.getParamData.bokkingId)

        var curuser = firebase.auth().currentUser;
        let bookingResponse = firebase.database().ref(`users/` + curuser.uid + '/my-booking/' + this.getParamData.bokkingId);
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
                    coords: this.getParamData.coords,
                    region: region,
                    distance: currUserBooking.estimateDistance,
                    estimateFare: this.getParamData.estimate,
                    estimateTime: 0,
                    currentBookingId: this.getParamData.bokkingId,
                    currentUser: curuser,
                    customer_name: currUserBooking.customer_name,
                    bookingStatus: currUserBooking.status,
                    carType: currUserBooking.carType,
                    driverUID: currUserBooking.driver,
                    driverName: currUserBooking.driver_name,
                    driverPic: currUserBooking.driver_image,
                    carImage: currUserBooking.carImage,
                    driverContact: currUserBooking.driver_contact,
                    carModel: currUserBooking.vehicleModelName,
                    carNo: currUserBooking.vehicle_number,
                    starCount: currUserBooking.driverRating,
                    otp: currUserBooking.otp,


                    imageRider: currUserBooking.imageRider ? currUserBooking.imageRider : null,
                }, () => {
                    this.getCancelReasons();
                    //this.getDirections('"' + this.state.region.wherelatitude + ', ' + this.state.region.wherelongitude + '"', '"' + this.state.region.droplatitude + ', ' + this.state.region.droplongitude + '"')
                })

                //Checando o status da corrida 
                if (currUserBooking.status == "ACCEPTED") {
                    this.setState({
                        bookingStatus: currUserBooking.status,
                        driverSerach: false
                    })
                    if (currUserBooking.status == "CANCELLED") {
                        this.props
                            .navigation
                            .dispatch(StackActions.reset({
                                index: 0,
                                actions: [
                                    NavigationActions.navigate({
                                        routeName: 'Map',
                                    }),
                                ],
                            }))
                    }
                    //AsyncStorage.setItem('startTripTime', new Date().getTime());
                } else if (currUserBooking.status == "EMBARQUE") {
                    this.setState({ embarque: true })
                } else if (currUserBooking.status == "START") {

                    this.props.navigation.replace('trackRide', { data: currUserBooking, bId: this.getParamData.bokkingId, });
                } else if (currUserBooking.status == "REJECTED") {
                    this.searchDriver(this.getParamData.bokkingId);
                }
            }
        })
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    verificarRejected(driverUid, currentBooking) {
        let checkRejected = true;
        const rejectedDrivers = firebase.database().ref('bookings/' + currentBooking + '/rejectedDrivers');
        rejectedDrivers.once('value', drivers => {
            if (drivers.val()) {
                let rejectedDrivers = drivers.val();
                for (reject in rejectedDrivers) {
                    if (reject == driverUid) {
                        checkRejected = false;
                    }
                }
            }
        })
        return checkRejected;
    }

    async searchDriver(param) {
        const userData = firebase.database().ref('users/');
        var driverUidnovo = 0;
        var distanciaValue = 10;

        userData.once('value', driverData => {
            if (driverData.val()) {
                var allUsers = driverData.val();

                for (key in allUsers) {
                    //Verifica se o motorista rejeitou a corrida
                    if (this.verificarRejected(key, param) == true) {
                        if (allUsers[key].usertype == 'driver' && allUsers[key].approved == true && allUsers[key].queue == false && allUsers[key].driverActiveStatus == true) {
                            if (allUsers[key].location) {
                                var location1 = [this.state.region.wherelatitude, this.state.region.wherelongitude];    //Rider Lat and Lang
                                var location2 = [allUsers[key].location.lat, allUsers[key].location.lng];   //Driver lat and lang

                                //Calcula a distancia entre dois pontos
                                var distance = distanceCalc(location1, location2);
                                var originalDistance = distance;
                                if (originalDistance <= 5) { //5KM

                                    if (allUsers[key].carType == this.state.carType) {
                                        //Salva sempre o mais proximo
                                        if (distance < distanciaValue) {
                                            distanciaValue = distance;
                                            driverUidnovo = key;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                this.getBookingData(param)
                let bookingData = {
                    bokkingId: param,
                    coords: this.state.coords,
                }

                if (driverUidnovo != 0) {
                    setTimeout(() => {
                        firebase.database().ref('users/' + driverUidnovo + '/waiting_riders_list/' + param + '/').set(this.state.bookingdataDetails);
                        this.sendPushNotification(driverUidnovo, param, languageJSON.new_booking_request_push_notification)

                        //Atualiza o Bookings do firebase com os dados do motorista selecionado
                        firebase.database().ref('bookings/' + param + '/').update({
                            requestedDriver: driverUidnovo
                        }).then((res) => {
                            this.setState({ bookingDataState: bookingData })
                        })
                    }, 500)
                }
            }
        })
    }

    getBookingData(param) {
        const ref = firebase.database().ref('bookings/' + param + '/');
        ref.on('value', snapshot => {
            this.setState({
                bookingdataDetails: snapshot.val()
            })
        })
    }

    getCancelReasons() {
        const reasonListPath = firebase.database().ref('/cancel_reason/');
        reasonListPath.on('value', reasons => {
            if (reasons.val()) {
                this.setState({
                    radio_props: reasons.val()
                })
            }
        })
    }

    //Encontra seu ponto de origem e destinoo e passa pro metodo 
    /*async getDirections(startLoc, destinationLoc) {
        try {
            let resp = await fetch(`https://maps.googleapis.com/maps/api/directions/json?origin=${startLoc}&destination=${destinationLoc}&key=${google_map_key}`)
            let respJson = await resp.json();
            let points = Polyline.decode(respJson.routes[0].overview_polyline.points);
            let coords = points.map((point, index) => {
                return {
                    latitude: point[0],
                    longitude: point[1]
                }
            })
            this.setState({ coords: coords }, () => {
                // setTimeout(() => {
                //     this.map.fitToCoordinates([{latitude: this.state.region.wherelatitude, longitude: this.state.region.wherelongitude}, {latitude: this.state.region.droplatitude, longitude: this.state.region.droplongitude}], {
                //         edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
                //         animated: true,
                //      })  
                // }, 1500);
            })
            return coords
        }
        catch (error) {
            alert(error)
            return error
        }
    }*/

    //Cancell Button Press
    async onPressCancellBtn() {
        const value = await AsyncStorage.getItem('startTripTime');
        firebase.database().ref(`/users/` + this.state.driverUID + '/my_bookings/' + this.state.currentBookingId + '/').on('value', curbookingData => {
            if (curbookingData.val()) {
                if (curbookingData.val().status == 'ACCEPTED' || curbookingData.val().status == 'EMBARQUE') {
                    const timeCurrent = new Date().getTime();


                    if (timeCurrent - value >= 30000) {
                        this.setState({ modalInfoVisible: true })
                    } else {
                        this.setState({ modalVisible: true })
                    }
                }
                else if (curbookingData.val().status == 'NEW') {
                    this.onCancellSearchBooking()
                }
            }
        })
    }

    dissMissCancel() {
        this.setState({ modalVisible: false, modalInfoVisible: false })
    }

    //Cancelar corrida antes do motorista ter aceito
    onCancellSearchBooking() {

        //Remove a corrida do perfil do passageiro
        firebase.database().ref(`/users/` + this.state.currentUser.uid + '/my-booking/' + this.state.currentBookingId + '/').remove()
            .then(() => {
                //Remove booking request do requested drivers no firebase
                const requestedDriver = firebase.database().ref('bookings/' + this.state.currentBookingId + '/requestedDriver');
                requestedDriver.once('value', drivers => {
                    if (drivers.val()) {
                        let requestedDriver = drivers.val();
                        var ref = firebase.database().ref(`/users/` + requestedDriver + '/waiting_riders_list/' + this.state.currentBookingId + '/')
                        if (ref) {
                            ref.remove();
                        }
                        firebase.database().ref('bookings/' + this.state.currentBookingId + '/requestedDriver/').remove();
                    }
                })
            })
        //Atualiza o status da corrida em "bookings" no firebase
        firebase.database().ref(`bookings/` + this.state.currentBookingId + '/').update({
            status: 'CANCELLED',
        })
            .then(() => {
                this.setState({ driverSerach: false }, () => this.props.navigation.replace('FareDetails', { data : this.state.region} ))
            })
    }

    onCancelConfirm() {
        //Atualiza o status da corrida em "bookings" no firebase
        firebase.database().ref(`bookings/` + this.state.currentBookingId + '/').update({
            status: 'CANCELLED',
        })
        firebase.database().ref(`/users/` + this.state.currentUser.uid + '/my-booking/' + this.state.currentBookingId + '/').update({
            status: 'CANCELLED',
            reason: this.state.radio_props[this.state.value].label
        })
            .then(() => {
                //Essa parte serve pra caso o motorista ter aceito a corrida e o passageiro cancelar em seguida
                firebase.database().ref(`/users/` + this.state.driverUID + '/my_bookings/' + this.state.currentBookingId + '/').on('value', curbookingData => {
                    if (curbookingData.val()) {
                        if (curbookingData.val().status == 'ACCEPTED') {
                            this.setState({ modalVisible: false })
                            firebase.database().ref(`/users/` + curbookingData.val().driver + '/my_bookings/' + this.state.currentBookingId + '/').update({
                                status: 'CANCELLED',
                                reason: this.state.radio_props[this.state.value].label
                            }).then(() => {
                                if (this.state.punisherCancell) {
                                    firebase.database().ref(`/users/` + this.state.currentUser.uid + '/cancell_details/').update({
                                        bookingId: this.state.currentBookingId,
                                        data: new Date().toString(),
                                        value: 6
                                    })
                                }
                            }).then(() => {
                                firebase.database().ref(`/users/` + this.state.driverUID + '/').update({ queue: false })
                                this.sendPushNotification(curbookingData.val().driver, this.state.currentBookingId, curbookingData.val().firstNameRider + ' cancelou a corrida atual!')
                            }).then(() => {
                                firebase.database().ref('users/' + this.state.driverUID + '/emCorrida').remove()
                            }).then(() => {
                                this.props
                                    .navigation
                                    .dispatch(StackActions.reset({
                                        index: 0,
                                        actions: [
                                            NavigationActions.navigate({
                                                routeName: 'Map',
                                            }),
                                        ],
                                    }))
                                //this.props.navigation.replace('Map')
                            })
                        }
                    }
                })
            })
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

    sendPushNotification(customerUID, bookingId, msg) {
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
                transparent={false}
                visible={this.state.modalVisible}
                onRequestClose={() => {
                    this.setState({ modalVisible: false })
                }}>
                <View style={styles.cancelModalContainer}>
                    <View style={styles.cancelModalInnerContainer}>
                        <View style={styles.cancelContainer}>
                            <View style={styles.cancelReasonContainer}>
                                <Text style={styles.cancelReasonText}>{languageJSON.cancel_reason_modal_title}</Text>
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
                                <TouchableOpacity onPress={() => this.onCancelConfirm()}>
                                    <View style={{ width: width - 150, justifyContent: 'center', alignItems: 'center', height: 35, backgroundColor: colors.DEEPBLUE, borderRadius: 50 }}>
                                        <Text style={{ fontFamily: "Inter-Bold", color: colors.WHITE, fontSize: 17 }}> Confirmar </Text>
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => this.dissMissCancel()}>
                                    <Text style={{ marginBottom: 15, marginTop: 15, fontFamily: 'Inter-Medium', color: colors.RED, fontSize: 17 }}> Voltar </Text>
                                </TouchableOpacity>
                            </View>
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
                transparent={false}
                visible={this.state.modalInfoVisible}
                onRequestClose={() => {
                    this.setState({ modalInfoVisible: false })
                }}
            >
                <View style={{ flex: 1, backgroundColor: colors.BLACK, opacity: 0.5, width: width, height: height, justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{ height: 400, backgroundColor: colors.WHITE, borderRadius: 25, marginHorizontal: 20 }}>
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
                            <Text style={{ marginHorizontal: 10, fontSize: 15, textAlign: 'center', fontFamily: 'Inter-Medium' }}> Essa corrida já está em andamento e você já ultrapassou o tempo máximo de cancelamento. </Text>
                            <Text style={{ marginHorizontal: 10, fontSize: 15, marginTop: 10, textAlign: 'center', fontFamily: 'Inter-Medium' }}> Ao cancelar, será cobrada uma taxa no valor de R$6,00 na próxima corrida! </Text>
                        </View>

                        <View style={{}}>
                            <Text style={{ marginHorizontal: 10, fontSize: 17, textAlign: "center", marginBottom: 10, fontFamily: 'Inter-Medium' }}> Deseja continuar? </Text>
                            <TouchableOpacity onPress={() => { this.setState({ punisherCancell: true, modalVisible: true, modalInfoVisible: false }) }}>
                                <View style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: colors.RED, marginHorizontal: 30, height: 40, borderRadius: 50 }}>
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
                visible={this.state.driverSerach}
                onRequestClose={() => {
                    this.setState({ driverSerach: false })
                }}
            >
                <View style={{ flex: 1, backgroundColor: colors.WHITE, width: width, height: height, justifyContent: 'center', alignItems: 'center' }}>
                    <Image source={require('../../assets/images/searchDrivers.gif')} style={styles.styleGif} />
                    <Text style={styles.textGif}> Procurando motoristas próximos </Text>
                    <TouchableOpacity disabled={this.state.searchDisabled} style={styles.touchView} onPress={() => { this.setState({ searchDisabled: true }), this.onCancellSearchBooking() }}>
                        <Text style={styles.textCancel}> Cancelar </Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        )
    }

    chat() {
        this.props.navigation.navigate("onlineChat", { passData: this.getParamData })
    }

    render() {
        return (
            <View style={styles.mainContainer}>
                <View style={styles.mapcontainer}>
                    {this.state.driverUID && this.state.region && this.state.bookingStatus && this.state.driverSerach == false ?
                        <TrackNow duid={this.state.driverUID} alldata={this.state.region} bookingStatus={this.state.bookingStatus} />
                        : null}

                    {this.state.driverSerach == false ?
                        <View>
                            <TouchableOpacity style={styles.btnTeste}>
                                <Icon
                                    name="navigation"
                                    type="feather"
                                    // icon: 'chat', color: '#fff',
                                    size={23}
                                    color={colors.DEEPBLUE}
                                />
                            </TouchableOpacity>


                            <TouchableOpacity style={styles.btnChatMotorista} onPress={() => this.chat()}>
                                <View>
                                    <Text style={styles.txtChatMotorista}> Chat </Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                        : null}
                </View>

                {this.state.driverSerach == false ?
                    <View style={{ backgroundColor: colors.GREY2, opacity: 0.6, height: 20, justifyContent: 'center', alignItems: 'center' }}>
                        <View style={styles.viewInfo}>
                            <Text style={{ color: colors.WHITE, fontFamily: 'Inter-Bold', fontSize: 14, alignSelf: 'center' }}> Confira as informações e a placa do carro!</Text>
                        </View>
                    </View>
                    : null}

                {this.state.embarque ?
                    <View style={{ borderBottomWidth: 2, borderColor: colors.GREY.background, backgroundColor: colors.GREY3, opacity: 0.6, height: 60, justifyContent: 'center', alignItems: 'center' }}>
                        <View style={styles.viewInfo}>
                            <Text style={{ color: colors.BLACK, fontFamily: 'Inter-Medium', fontSize: 20, textAlign: 'center' }}> Encontre o motorista em {this.state.region.whereText.split("-")[0]} </Text>
                        </View>
                    </View>
                    : null}

                {this.state.driverSerach == false ?
                    <View style={[styles.containerBottom, { flex: this.state.embarque ? 4.5 : 3.5 }]}>
                        <View style={styles.containerFoto}>
                            <View style={{ borderWidth: 1.5, borderColor: colors.DEEPBLUE, borderRadius: 100 }}>
                                <AvatarUser
                                    style={{ margin: 3 }}
                                />
                            </View>

                            <Text style={styles.nameDriver}> {this.state.driverName ? this.state.driverName.split(" ")[0] : null} </Text>
                            <View style={styles.rating}>
                                <Icon
                                    name="star"
                                    type="feather"
                                    // icon: 'chat', color: '#fff',
                                    size={23}
                                    color={colors.YELLOW.secondary}
                                />
                                <Text style={{ fontFamily: 'Inter-Bold', fontSize: 15, fontWeight: '600' }}> {this.state.starCount ? this.state.starCount : null} </Text>
                            </View>
                        </View>

                        <View style={styles.containerCarDetails}>
                            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                                {this.state.carType == "Colt econômico" ?
                                    <ColtEconomicoCar />
                                    :
                                    <ColtConfortCar />
                                }
                                <Text style={{ fontSize: 18, fontFamily: 'Inter-Medium', fontWeight: "500", textAlign: 'center', marginBottom: 5 }}> {this.state.carType} </Text>
                            </View>

                            <View style={styles.boxPlacaCarro}>
                                <Text style={styles.placaCarro} > {this.state.carNo ? this.state.carNo : null} </Text>
                            </View>
                            <View style={styles.containerTxtCarro}>
                                <Text style={styles.marcaCarro}> {this.state.carModel ? this.state.carModel : null} </Text>
                            </View>
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
    mapcontainer: {
        flex: 7,
        width: width,
    },
    btnChatMotorista: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        right: 0,
        height: 30,
        borderRadius: 50,
        backgroundColor: colors.WHITE,
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
        height: 50,
        borderRadius: 50,
        backgroundColor: colors.WHITE,
        width: 50,
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
        fontSize: 16,
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
        backgroundColor: colors.LIGHT_RED,
        opacity: 0.5,
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
        fontFamily: 'Inter-SemiBold',
        fontSize: 18,
    },
    textGif: {
        color: "#fff",
        top: 55,
        position: 'absolute',
        fontSize: 20,
        fontFamily: 'Inter-SemiBold',
        opacity: 0.6,
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
        backgroundColor: colors.BLACK,
    },
    cancelModalInnerContainer: {
        height: 450,
        width: width * 0.90,
        padding: 0,
        backgroundColor: colors.WHITE,
        alignItems: 'center',
        alignSelf: 'center',
        borderRadius: 7
    },
    cancelContainer: {
        flex: 1,
        justifyContent: 'space-between',
        width: (width * 0.85)
    },
    cancelReasonContainer: {
        flex: 1
    },
    cancelReasonText: {
        top: 10,
        color: colors.BLACK,
        fontFamily: 'Inter-Bold',
        fontSize: 20,
        alignSelf: 'center'
    },
    radioContainer: {
        flex: 8,
        alignItems: 'center'
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
        flex: 2,
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
    viewInfo: {

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
        fontSize: 17,
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
    },
    containerCarDetails: {
        position: 'absolute',
        right: 40,
        top: 0,
        flexDirection: 'column',
    },
    containerBtn: {
        position: 'absolute',
        bottom: 0,
        marginBottom: 30,
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center',
    },
    btnLigarMotorista: {
        backgroundColor: colors.WHITE,
        borderWidth: 2,
        borderColor: colors.DEEPBLUE,
        height: 45,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        width: 250
    },
    btnCancelarCorrida: {
        backgroundColor: colors.RED,
        opacity: 0.5,
        width: 50,
        height: 50,
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
        fontSize: 19,
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
        marginTop: 10,
    },
    placaCarro: {
        fontSize: 25,
        fontFamily: 'Inter-Bold',
        fontWeight: '500',

    },
    containerTxtCarro: {
        marginTop: 7,
        width: 150,
    },
    marcaCarro: {
        fontFamily: 'Inter-Regular',
        color: colors.BLACK,
        fontSize: 18,
        position: 'absolute',
        right: 0
    },
});