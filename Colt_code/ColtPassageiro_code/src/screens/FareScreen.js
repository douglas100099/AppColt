import React, { Fragment, useRef } from 'react';
import {
    StyleSheet,
    View,
    Dimensions,
    TouchableOpacity,
    ActivityIndicator,
    Text,
    Modal,
    Platform,
    AsyncStorage,
    Alert,
    Animated
} from 'react-native';
import { Icon, Button, Input } from 'react-native-elements';
import Polyline from '@mapbox/polyline';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import { colors } from '../common/theme';
var { width, height } = Dimensions.get('window');
import * as firebase from 'firebase';
import { farehelper } from '../common/FareCalculator';
import { checkCPF } from '../common/checkCPF';
import distanceCalc from '../common/distanceCalc';
import { getPixelSize } from '../common/utils';
import { PromoComp } from "../components";
import { RequestPushMsg } from '../common/RequestPushMsg';
import { google_map_key } from '../common/key';
import languageJSON from '../common/language';

import LocationUser from '../../assets/svg/LocationUser';
import LocationDrop from '../../assets/svg/LocationDrop';
import ColtEconomicoCar from '../../assets/svg/ColtEconomicoCar';
import ColtConfortCar from '../../assets/svg/ColtConfortCar';
import { VerifyCupom } from '../common/VerifyCupom';
import mapStyleAndroid from '../../mapStyleAndroid.json';
import PromoModal from '../components/PromoModal';

import { TextInputMask } from 'react-native-masked-text'
import { ScrollView } from 'react-native-gesture-handler';

export default class FareScreen extends React.Component {
    myAbort = new AbortController()
    constructor(props) {
        super(props);
        this._isMounted = false;
        this.state = {
            alertModalVisible: false,
            region: {},
            coords: [],
            rateDetailsObjects: [],
            detailsBooking: [],
            rateType: [],
            settings: {
                cancell_value: '',
                code: '',
                symbol: '',
                cash: false,
                wallet: false,
                otp_secure: false
            },
            buttonDisabled: false,
            carType: '',
            carImage: '',
            metodoPagamento: 'Dinheiro',
            openModalPayment: false,
            walletBallance: null,
            promodalVisible: false,
            promoCode: null,
            promoCodeValid: true,
            usedWalletMoney: 0,
            infoModal: false,
            showViewInfo: true,
            cpfModalVisible: false,
            dateInput: '',
            txtCPF: '',
            cancellValue: 0,
            longDistance: false,
        },
        this.fadeAnim = new Animated.Value(0)
    }

    async componentDidMount() {
        this._isMounted = true;
        var getCroods = await this.props.navigation.getParam('data') ? await this.props.navigation.getParam('data') : null;
        var arrayRates = [];

        this.setState({
            intervalDriversTime: setInterval(() => {
                if (this._isMounted) {
                    this.getDrivers()
                }
            }, 10000)
        })

        const Data = firebase.database().ref('rates/');
        Data.once('value', rates => {
            if (rates.val()) {
                var carTypeWiseRate = rates.val();
                for (var i = 0; i < carTypeWiseRate.car_type.length; i++) {
                    var ratesObject = carTypeWiseRate.car_type[i]
                    arrayRates.push(ratesObject)
                }
                this.setState({
                    minTimeEconomico: null,
                    minTimeConfort: null,
                    rateDetailsObjects: arrayRates,
                    region: getCroods,
                    curUID: firebase.auth().currentUser,
                    buttonDisabled: false,
                    selected: 0
                })
            }
        }).then(() => {
            if (this._isMounted = true) {
                let distance = distanceCalc([-22.224650, -43.867618], [this.state.region.wherelatitude, this.state.region.wherelongitude])
                if (distance > 50) {
                    this.setState({ longDistance: true })
                } else {
                    this.getDetailsRider();
                    this.getDirections('"' + this.state.region.wherelatitude + ', ' + this.state.region.wherelongitude + '"', '"' + this.state.region.droplatitude + ', ' + this.state.region.droplongitude + '"')
                    const userData = firebase.database().ref('users/' + this.state.curUID.uid);
                    userData.once('value', userData => {
                        this.setState({ userDetails: userData.val() });
                    })
                }
            }
        })

        this._retrieveSettings();
    }

    fadeIn(params) {
        this.setState({ showViewInfo: !this.state.showViewInfo })
        if (params) {
            Animated.timing(this.fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: false,
            }).start();
        } else {
            Animated.timing(this.fadeAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: false,
            }).start();
        }
    };


    _retrieveSettings = async () => {
        try {
            const value = await AsyncStorage.getItem('settings');
            if (value !== null) {
                this.setState({ settings: JSON.parse(value) });
            }
        } catch (error) {
            console.log("Asyncstorage issue 8 ");
        }
    };

    componentWillUnmount() {
        this.myAbort.abort()
        this._isMounted = false;
    }

    //Pega a direção e detalhes da corrida 
    async getDirections(startLoc, destLoc) {
        try {
            var resp = await fetch(`https://maps.googleapis.com/maps/api/directions/json?origin=${startLoc}&destination=${destLoc}&key=${google_map_key}`, { signal: this.myAbort.signal })
            var respJson = await resp.json();

            var arrayDetails = []
            for (let i = 0; i < this.state.rateDetailsObjects.length; i++) {
                var fareCalculation = farehelper(respJson.routes[0].legs[0].distance.value, respJson.routes[0].legs[0].duration.value, this.state.rateDetailsObjects[i] ? this.state.rateDetailsObjects[i] : 1)
                var detailsBooking = {
                    distance: respJson.routes[0].legs[0].distance.value,
                    fareCost: fareCalculation ? parseFloat(fareCalculation.totalCost).toFixed(2) : 0,
                    estimateFare: fareCalculation ? parseFloat(fareCalculation.grandTotal).toFixed(2) : 0,
                    estimateTime: respJson.routes[0].legs[0].duration.value,
                    convenience_fees: fareCalculation ? parseFloat(fareCalculation.convenience_fees).toFixed(2) : 0
                }
                arrayDetails.push(detailsBooking);
                i == 0 ? this.setState({ estimatePrice1: detailsBooking.estimateFare, estimatedTimeBooking: detailsBooking.estimateTime })
                    : this.setState({ estimatePrice2: detailsBooking.estimateFare, estimatedTimeBooking: detailsBooking.estimateTime })
            }
            this.setState({
                detailsBooking: arrayDetails,
                selected: 0,
                estimateFare: arrayDetails[0].estimateFare,
                distance: arrayDetails[0].distance,
                carType: this.state.rateDetailsObjects[0].name,
                carImage: this.state.rateDetailsObjects[0].image
            })
            this.getCancellValue(arrayDetails)

            var points = Polyline.decode(respJson.routes[0].overview_polyline.points);
            var coords = points.map((point) => {
                return {
                    latitude: point[0],
                    longitude: point[1]
                }
            })
            this.setState({ coords: coords }, () => {
                setTimeout(() => {
                    this.map.fitToCoordinates([{ latitude: this.state.region.wherelatitude, longitude: this.state.region.wherelongitude }, { latitude: this.state.region.droplatitude, longitude: this.state.region.droplongitude }], {
                        edgePadding: { top: getPixelSize(50), right: getPixelSize(50), bottom: getPixelSize(50), left: getPixelSize(50) },
                        animated: true,
                    })
                }, 500);
            })

            return coords
        }
        catch (error) {
            Alert.alert(
                languageJSON.err,
                languageJSON.route_not_found,
                [
                    { text: languageJSON.no_driver_found_alert_OK_button, onPress: () => this.props.navigation.goBack() },
                ],
                { cancelable: false },
            );
            return error
        }
    }

    //Carrega o valor que o usuario tem na carteira e o id do dispositivo dele
    getDetailsRider() {
        const userData = firebase.database().ref('users/' + this.state.curUID.uid + "/");
        userData.once('value', userData => {
            this.setState({ walletBallance: userData.val().walletBalance, deviceId: userData.val().deviceId  });
        })
    }

    //Confirma corrida e começa a procurar motorista
    confirmarCorrida() {
        clearInterval(this.state.intervalDriversTime);
        var curuser = this.state.curUID.uid;

        var pickUp = { lat: this.state.region.wherelatitude, lng: this.state.region.wherelongitude, add: this.state.region.whereText };
        var drop = { lat: this.state.region.droplatitude, lng: this.state.region.droplongitude, add: this.state.region.droptext };
        var cashPayment = this.state.selected == 0 ? (this.state.estimatePrice1 - this.state.usedWalletMoney).toFixed(2) : (this.state.estimatePrice2 - this.state.usedWalletMoney).toFixed(2);

        if (this.state.settings.otp_secure)
            var otp = Math.floor(Math.random() * 90000) + 10000;
        else {
            var otp = false;
        }
        let today = new Date().toString();

        var pagamentoObj = {
            estimate: this.state.estimateFare,
            trip_cost: 0,
            payment_mode: this.state.metodoPagamento,
            cashPaymentAmount: cashPayment,
            usedWalletMoney: this.state.usedWalletMoney,
            discount_amount: this.state.payDetails ? this.state.payDetails.promo_details.promo_discount_value : 0,
            discount_type: this.state.payDetails ? this.state.payDetails.promo_details.discount_type : "",
            promoCodeApplied: this.state.payDetails ? this.state.payDetails.promo_details.promo_code : "",
            promoKey: this.state.payDetails ? this.state.payDetails.promo_details.promo_key : "",
            cancellValue: this.state.cancellValue ? this.state.cancellValue : 0
        }

        this.state.cancellValue != 0 ? pagamentoObj.cancelRate = true : null
        this.state.payDetails ? this.state.payDetails.promo_details.promo_discount_value > 0 ? pagamentoObj.usedDiscount = true : null : null
        this.state.usedWalletMoney > 0 ? pagamentoObj.usedWallet = true : null

        var data = {
            carImage: this.state.carImage,
            carType: this.state.carType,
            customer: curuser,
            customer_name: this.state.userDetails.firstName + ' ' + this.state.userDetails.lastName,
            firstNameRider: this.state.userDetails.firstName,
            distance: this.state.distance,
            driver: "",
            driver_image: "",
            driver_name: "",
            drop: drop,
            pickup: pickUp,
            pagamento: pagamentoObj,
            estimateDistance: this.state.distance,
            serviceType: 'pickUp',
            status: "NEW",
            total_trip_time: 0,
            trip_end_time: "00:00",
            trip_start_time: "00:00",
            tripdate: today,
            otp: otp,
            bookingDate: today,

            imageRider: this.state.userDetails.profile_image ? this.state.userDetails.profile_image : null,
            ratingRider: this.state.userDetails.ratings ? this.state.userDetails.ratings.userrating : '5.0',
        }

        var MyBooking = {
            firstNameRider: this.state.userDetails.firstName,
            carImage: this.state.carImage,
            carType: this.state.carType,
            driver: "",
            driver_image: "",
            driver_name: "",
            drop: drop,
            pickup: pickUp,
            estimateDistance: this.state.distance,
            serviceType: 'pickUp',
            status: "NEW",
            total_trip_time: 0,
            trip_end_time: "00:00",
            trip_start_time: "00:00",
            tripdate: today,
            coords: this.state.coords,
            otp: otp,
            bookingDate: today,
            pagamento: pagamentoObj,
        }

        firebase.database().ref('bookings/').push(data).then((res) => {
            var bookingKey = res.key;
            firebase.database().ref('users/' + curuser + '/my-booking/' + bookingKey + '/').set(MyBooking).then((res) => {

                let bookingItens = {
                    bokkingId: bookingKey,
                    coords: this.state.coords,
                }
                setTimeout(() => {
                    this.setState({ buttonDisabled: false }, () => {
                        this.props.navigation.replace('BookedCab', { passData: bookingItens, riderName: data.customer_name });
                    })
                }, 500)
            }).catch((res) => {
                return res
            })
        }).catch((res) => {
            return res
        })
    }

    //Verifica se o passageiro tem taxa de cancelamento pendente
    getCancellValue(param) {
        const userData = firebase.database().ref('users/' + this.state.curUID.uid + '/cancell_details/');
        userData.once('value', cancellValue => {
            if (cancellValue.val()) {
                this.setState({
                    estimatePrice1: parseFloat(param[0].estimateFare) + parseFloat(cancellValue.val().value),
                    estimatePrice2: parseFloat(param[1].estimateFare) + parseFloat(cancellValue.val().value),
                    cancellValue: cancellValue.val().value
                })
            }
        })
    }

    getDrivers() {
        if (!this.state.longDistance) {
            const userData = firebase.database().ref('users/').orderByChild("usertype").equalTo('driver');
            userData.once('value', userData => {
                if (userData.val()) {
                    let allUsers = userData.val();
                    this.prepareDrivers(allUsers);
                }
            })
        }
    }

    //Pega o tempo dos motoristas mais proximos
    async prepareDrivers(allUsers) {
        let riderLocation = [this.state.region.wherelatitude, this.state.region.wherelongitude];
        let startLoc = '"' + this.state.region.wherelatitude + ', ' + this.state.region.wherelongitude + '"';
        for (let key in allUsers) {
            let driver = allUsers[key];
            if (driver.approved == true && driver.queue == false && driver.driverActiveStatus == true) {
                if (driver.location) {
                    let driverLocation = [driver.location.lat, driver.location.lng];
                    let distance = distanceCalc(riderLocation, driverLocation);

                    if (distance < 4) {
                        let destLoc = '"' + driver.location.lat + ', ' + driver.location.lng + '"';
                        let carType = driver.carType;
                        driver.arriveTime = await this.getDriverTime(startLoc, destLoc);

                        if (carType == "Colt econômico") {
                            if (this.state.minTimeEconomico == null) {
                                this.setState({
                                    minTimeEconomico: driver.arriveTime.time_in_secs
                                })
                            } else if (this.state.minTimeEconomico > driver.arriveTime.time_in_secs) {
                                this.setState({
                                    minTimeEconomico: driver.arriveTime.time_in_secs
                                })
                            }
                        } else {
                            if (this.state.minTimeConfort == null) {
                                this.setState({
                                    minTimeConfort: driver.arriveTime.time_in_secs
                                })
                            } else if (this.state.minTimeConfort > driver.arriveTime.time_in_secs) {
                                this.setState({
                                    minTimeConfort: driver.arriveTime.time_in_secs
                                })
                            }
                        }
                    }
                }
            }
        }
    }

    getDriverTime(startLoc, destLoc) {
        return new Promise(function (resolve, reject) {
            fetch(`https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=${startLoc}&destinations=${destLoc}&key=${google_map_key}`)
                .then((response) => response.json())
                .then((res) =>
                    resolve({
                        distance_in_meter: res.rows[0].elements[0].distance.value,
                        time_in_secs: res.rows[0].elements[0].duration.value,
                        timein_text: res.rows[0].elements[0].duration.text
                    })
                )
                .catch(error => {
                    reject(error);
                });
        });
    }

    //Seleciona o tipo de carro que vai ser a corrida
    selectCarType(type) {
        if (type == 0) {
            this.setState({ selected: 0, estimateFare: this.state.detailsBooking[0].estimateFare, distance: this.state.detailsBooking[0].distance, carType: this.state.rateDetailsObjects[0].name, carImage: this.state.rateDetailsObjects[0].image })
        } else if (type == 1) {
            this.setState({ selected: 1, estimateFare: this.state.detailsBooking[1].estimateFare, distance: this.state.detailsBooking[1].distance, carType: this.state.rateDetailsObjects[1].name, carImage: this.state.rateDetailsObjects[1].image })
        }
    }

    closeModalPayment = () => {
        this.setState({ promodalVisible: false })
    }


    addCpf() {
        return (
            <Modal
                animationType="slide"
                visible={this.state.cpfModalVisible}
                onRequestClose={() => {
                    this.setState({ cpfModalVisible: false })
                }}>
                <View style={styles.promoModalContainer}>
                    <View style={styles.viewTopPromoModal}>
                        <View style={styles.HeaderPromoModal}>
                            <View style={{ marginLeft: 10 }}>
                                <Text style={{ fontFamily: "Inter-Medium", fontSize: 23, opacity: 0.4 }}> Cadastrar CPF </Text>
                            </View>
                            <View style={{ position: 'absolute', right: 0 }}>
                                <TouchableOpacity style={{ marginRight: 15 }} onPress={() => this.setState({ cpfModalVisible: false, buttonDisabled: false })}>
                                    <Icon
                                        name='x'
                                        type='feather'
                                        color={colors.GREY1}
                                        size={34}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                    <Text style={{ textAlign: 'center', marginTop: 30, fontFamily: 'Inter-Regular', fontSize: 16, paddingHorizontal: 10 }}>
                        Para sua segurança e do motorista, precisamos que adicione o seu número de cpf e data de nascimento.
                    </Text>
                    <View style={{ marginHorizontal: 65, borderRadius: 7, borderWidth: 1, marginTop: 20, borderColor: colors.GREY1 }}>
                        <TextInputMask
                            type={'cpf'}
                            placeholder='Digite seu CPF'
                            value={this.state.txtCPF}
                            onChangeText={(text) => { this.setState({ txtCPF: text }) }}
                            style={{ fontSize: 20, marginLeft: 12, height: 40 }}
                            maxLength={14}
                            ref={(ref) => this.cpfInputRef = ref}
                        />
                    </View>
                    <View style={{ marginHorizontal: 65, borderRadius: 7, borderWidth: 1, marginTop: 20, borderColor: colors.GREY1 }}>
                        <TextInputMask
                            type={'datetime'}
                            placeholder='Data de nascimento'
                            options={{
                                format: 'DD/MM/YYYY'
                            }}
                            value={this.state.dateInput}
                            onChangeText={(maskedText) => { this.setState({ dateInput: maskedText }) }}
                            style={{ fontSize: 20, marginLeft: 12, height: 40 }}
                            maxLength={10}
                            ref={(ref) => this.dateInputRef = ref}
                        />
                    </View>
                    <TouchableOpacity style={styles.btnConfirmarPromoModal} disabled={this.state.checkCPF} onPress={() => { this.isValidCpf() }}>
                        <Text style={styles.textConfirmarPromoModal}> Confirmar </Text>
                    </TouchableOpacity>

                </View>
            </Modal>
        )
    }

    //Abre o modal de escolha de pagamento
    openModal = () => {
        this.state.openModalPayment ? setTimeout(() => { this.setState({ openModalPayment: false }) }, 100) :
            this.setState({ openModalPayment: true });
    }

    //Modal de escolha do metodo de pagamento
    ModalPayment() {
        return (
            <Modal
                animationType="slide"
                transparent={true}
                visible={this.state.openModalPayment}
            >
                <View style={styles.containerModalPayment}>
                    <View style={styles.backgroundModalPayment}>
                        <View>
                            <View style={{ marginLeft: 20, marginTop: 20 }}>
                                <Text style={{ fontSize: 20, fontFamily: 'Inter-Bold' }}> Método de pagamento</Text>
                            </View>
                            <TouchableOpacity style={styles.boxMoney} onPress={() => this.onPressPayment("Dinheiro")}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Icon
                                        name='ios-cash'
                                        type='ionicon'
                                        size={26}
                                        color={colors.GREEN.light}
                                        containerStyle={styles.iconMoney}
                                    />
                                    <Text style={styles.textMoney}> Dinheiro </Text>
                                </View>
                                <Icon
                                    name='chevron-right'
                                    type='MaterialIcons'
                                    color={colors.GREY1}
                                    size={40}
                                    containerStyle={{ position: 'absolute', right: 0, marginRight: 10 }}
                                />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.boxCard} onPress={() => this.onPressPayment("Carteira")}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Icon
                                        name="wallet"
                                        type="simple-line-icon"
                                        size={26}
                                        color={colors.DEEPBLUE}
                                        containerStyle={styles.iconMoney}
                                    />
                                    <View style={{ flexDirection: 'column' }}>
                                        <Text style={styles.textMoney}> Carteira Colt </Text>
                                        <Text style={{ fontFamily: 'Inter-Bold', color: colors.GREY2, fontSize: 15, marginLeft: 10 }}> Saldo: R${parseFloat(this.state.walletBallance > 0 ? this.state.walletBallance : 0).toFixed(2)} </Text>
                                    </View>
                                </View>
                                <Icon
                                    name='chevron-right'
                                    type='MaterialIcons'
                                    color={colors.GREY1}
                                    size={40}
                                    containerStyle={{ position: 'absolute', right: 0, marginRight: 10 }}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        )
    }

    //Escolhe o metodo de pagamento
    onPressPayment(param) {
        if (param === "Dinheiro") {
            this.setState({ metodoPagamento: "Dinheiro", openModalPayment: false, usedWalletMoney: 0, })
        } else if (param === "Carteira") {
            this.checkWalletBalance()
        }
    }

    //Verifica se o valor da carteira cobre a corrida
    checkWalletBalance() {
        if (this.state.walletBallance > 0) {
            if (this.state.selected == 0) {
                if (this.state.walletBallance - this.state.estimatePrice1 < 0) {
                    this.alertWalletBalance(this.state.selected)
                } else {
                    this.setState({ metodoPagamento: "Carteira", openModalPayment: false, usedWalletMoney: this.state.estimatePrice1 })
                }
            } else if (this.state.selected == 1) {
                if (this.state.walletBallance - this.state.estimatePrice2 < 0) {
                    this.alertWalletBalance(this.state.selected)
                } else {
                    this.setState({ metodoPagamento: "Carteira", openModalPayment: false, usedWalletMoney: this.state.estimatePrice2 })
                }
            }
        } else {
            () => {
                Alert.alert(
                    "Alerta!",
                    "Você não possui saldo na carteira!",
                    [
                        {
                            text: "OK",
                            style: 'cancel'
                        },
                    ],
                    { cancelable: false }
                );
            }
        }
    }

    //Alerta de dinheiro insuficiente na carteira
    alertWalletBalance(params) {
        Alert.alert(
            "Alerta!",
            "Você não possui saldo suficiente na carteira pra essa corrida. Deseja utilizar o saldo como parte do valor total? ",
            [
                {
                    text: languageJSON.cancel,
                    style: 'cancel'
                },
                {
                    text: 'OK', onPress: () => {
                        if (params == 0) {
                            this.setState({ metodoPagamento: "Dinheiro/Carteira", openModalPayment: false, usedWalletMoney: this.state.walletBallance })
                        } else if (params == 1) {
                            this.setState({ metodoPagamento: "Dinheiro/Carteira", openModalPayment: false, usedWalletMoney: this.state.walletBallance })
                        }
                    }
                }
            ],
            { cancelable: false }
        );
    }

    infoModal() {
        return (
            <Modal
                animationType="slide"
                transparent={true}
                visible={this.state.infoModal}
            >
                <View style={{ flex: 1 }}>
                    <View style={{ position: 'absolute', bottom: 25, left: 10, width: width, backgroundColor: colors.WHITE, flexDirection: 'row', alignItems: 'center' }}>
                        <Text> Você está pagando {this.state.settings.cancell_value} a mais nessa corrida por conta da taxa de cancelamento! </Text>
                    </View>
                </View>
            </Modal>
        )
    }

    onSucessPromo(newValue1, newValue2, payDetails, payment_mode) {
        if (newValue1 != null && newValue2 != null) {
            this.setState({ promodalVisible: false, estimatePrice1: newValue1, estimatePrice2: newValue2, payDetails: payDetails, metodoPagamento: payment_mode })
        } else {
            this.setState({ promodalVisible: false })
        }
    }

    //Enviar notificaçao
    sendPushNotification(customerUID, msg) {
        const customerRoot = firebase.database().ref('users/' + customerUID);
        customerRoot.once('value', customerData => {
            if (customerData.val()) {
                let allData = customerData.val()
                RequestPushMsg(allData.pushToken ? allData.pushToken : null, msg)
            }
        })
    }

    isValidCpf() {
        const unmaskedCpf = this.cpfInputRef.getRawValue()
        const unmaskedDate = new Date(this.dateInputRef.getRawValue())

        this.setState({ checkCPF: true })
        if (this.state.txtCPF != '' && this.state.txtCPF.length == 14) {
            if (this.state.dateInput != '' && this.state.dateInput.length == 10) {
                let cpf = checkCPF(unmaskedCpf)
                if (cpf) {
                    this.setState({ checkCPF: false })
                    let month = unmaskedDate.getMonth() + 1
                    let date = unmaskedDate.getDate() + '/' + month + '/' + unmaskedDate.getFullYear()
                    firebase.database().ref('users/' + this.state.curUID.uid + '/').update({
                        cpfNum: unmaskedCpf,
                        data_nascimento: date
                    }).then(() => {
                        const userData = firebase.database().ref('users/' + this.state.curUID.uid);
                        userData.once('value', userData => {
                            this.setState({ userDetails: userData.val() });
                        }).then(() => {
                            this.setState({ cpfModalVisible: false, buttonDisabled: false })
                        })
                    })
                } else {
                    this.setState({ checkCPF: false })
                    alert("CPF inválido!")
                }
            } else {
                this.setState({ checkCPF: false })
                alert("Data de nascimento inválida!")
            }
        } else {
            this.setState({ checkCPF: false })
            alert("CPF inválido!")
        }
    }

    verifyCPF() {
        if (!this.state.userDetails.cpfNum) {
            Alert.alert(
                'Alerta!',
                'Você ainda não possui cpf cadastrado, deseja adicionar?',
                [
                    {
                        style: 'destructive',
                        text: 'Voltar',
                        onPress: () => this.setState({ buttonDisabled: false })
                    },
                    { text: 'Adicionar', onPress: () => this.setState({ cpfModalVisible: true }) },
                ],
                { cancelable: true },
            );
        } else {
            this.confirmarCorrida()
        }
    }

    fitRoute() {
        this.map.fitToCoordinates([{ latitude: this.state.region.wherelatitude, longitude: this.state.region.wherelongitude }, { latitude: this.state.region.droplatitude, longitude: this.state.region.droplongitude }], {
            edgePadding: { top: getPixelSize(60), right: getPixelSize(60), bottom: getPixelSize(60), left: getPixelSize(60) },
            animated: true,
        })
    }

    render() {
        return (
            <View style={styles.container}>
                {this.state.promodalVisible ?
                    <PromoModal onSucessPromo={(newValue1, newValue2, payDetails, payment_mode) => this.onSucessPromo(newValue1, newValue2, payDetails, payment_mode)}
                        selected={this.state.selected} payDetails={this.state.payDetails ? true : false} estimateFare={[this.state.estimatePrice1, this.state.estimatePrice2]}
                        deviceId={this.state.deviceId} closeModalPayment={() => { this.setState({ promodalVisible: false }) }} />
                    : null}
                <View style={[styles.mapcontainer, {
                    flex: this.state.payDetails ? 1.8 : 2
                }]}>
                    {this.state.region && this.state.region.wherelatitude ?
                        <MapView
                            ref={map => { this.map = map }}
                            style={styles.map}
                            provider={PROVIDER_GOOGLE}
                            customMapStyle={mapStyleAndroid}
                            initialRegion={{
                                latitude: (this.state.region.wherelatitude),
                                longitude: (this.state.region.wherelongitude),
                                latitudeDelta: 0.143,
                                longitudeDelta: 0.134,
                            }}
                            loadingEnabled
                            showsUserLocation
                            showsCompass={false}
                            showsScale={false}
                            rotateEnabled={false}
                            showsMyLocationButton={false}
                        >
                            <Marker
                                coordinate={{ latitude: (this.state.region.wherelatitude), longitude: (this.state.region.wherelongitude) }}
                                //title={this.state.region.whereText}
                                centerOffset={{ x: 0.1, y: 0.1 }}
                                anchor={{ x: 0.1, y: 0.1 }}
                                onPress={() => this.state.buttonDisabled ? null : this.props.navigation.replace('Search', { old: this.state.region })}
                            >
                                <LocationUser
                                    width={25}
                                    height={25}
                                />
                                <View style={styles.locationBoxDestino}>
                                    <Text numberOfLines={1} style={styles.locationText}> {this.state.region.whereText.split(",", 2)} </Text>
                                </View>
                            </Marker>


                            <Marker
                                coordinate={{ latitude: (this.state.region.droplatitude), longitude: (this.state.region.droplongitude) }}
                                //title={this.state.region.droptext}
                                centerOffset={{ x: 0.1, y: 0.1 }}
                                anchor={{ x: 0.1, y: 0.1 }}
                                onPress={() => this.state.buttonDisabled ? null : this.props.navigation.replace('Search', { old: this.state.region })}
                            >

                                <LocationDrop />
                                <View style={styles.locationBoxDestino}>
                                    <Text numberOfLines={1} style={styles.locationText}> {this.state.region.droptext.split(",", 2)} </Text>
                                </View>
                            </Marker>


                            {this.state.coords ?
                                <MapView.Polyline
                                    coordinates={this.state.coords}
                                    strokeWidth={2.5}
                                    strokeColor={colors.DEEPBLUE}
                                />
                                : null}
                        </MapView>
                        : null}

                    {this.state.region && this.state.region.wherelatitude ?
                        <View style={styles.bordaIconeVoltar}>
                            <TouchableOpacity onPress={() => this.state.buttonDisabled ? null : this.props.navigation.goBack()}>
                                <Icon
                                    name='chevron-left'
                                    type='MaterialIcons'
                                    size={40}
                                />
                            </TouchableOpacity>
                        </View>
                        : null}


                    {this.state.rateDetailsObjects[0] && !this.state.longDistance ?
                        <TouchableOpacity style={[styles.btnAddPromo, {
                            borderColor: this.state.payDetails ? colors.GREEN.light : null,
                            borderWidth: this.state.payDetails ? 2 : 0
                        }]} onPress={() => this.setState({ promodalVisible: true })}>

                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Icon
                                    name='ios-pricetag'
                                    type='ionicon'
                                    size={20}
                                    containerStyle={{ opacity: 0.2, marginTop: 3 }}
                                />
                                <Text style={styles.txtCupom}> {this.state.payDetails ?
                                    this.state.payDetails.promo_details.discount_type == 'flat' ?
                                        "-R$" + (this.state.payDetails.promo_details.promo_discount_value).toFixed(2)
                                        :
                                        '-' + (this.state.payDetails.promo_details.promo_discount_value).toFixed(0) + '%'
                                    : "Cupom"} </Text>
                            </View>
                        </TouchableOpacity>
                        : null}

                    <Animated.View
                        style={[
                            styles.fadingContainer,
                            {
                                opacity: this.fadeAnim
                            }
                        ]}
                    >
                        <Text style={styles.fadingText}>Você está pagando R$ {this.state.settings.cancell_value},00 a mais por conta da taxa de cancelamento!</Text>
                    </Animated.View>

                    {this.state.cancellValue != 0 ?
                        <TouchableOpacity style={styles.btnCancellRate} onPress={() => this.fadeIn(this.state.showViewInfo)}>
                            <Icon
                                name="ios-alert"
                                type="ionicon"
                                size={23}
                                color={colors.WHITE}
                            />
                        </TouchableOpacity>
                        : null}

                    {this.state.region && this.state.region.wherelatitude ?
                        <View style={styles.btnRoute}>
                            <TouchableOpacity onPress={() => { this.fitRoute() }}>
                                <Icon
                                    name='git-pull-request'
                                    type='feather'
                                    size={30}
                                />
                            </TouchableOpacity>
                        </View>
                        : null}

                </View>

                {/* View de alerta da promoçao aplicada */}
                {this.state.payDetails ?
                    <View style={{ backgroundColor: 'rgba(63,220,90,0.7)', justifyContent: 'center', alignItems: 'center', }}>
                        <Text style={{ paddingBottom: 7, paddingTop: 7, color: colors.WHITE, fontFamily: 'Inter-Bold' }}>Promoção aplicada</Text>
                    </View>
                    : null}

                {/* View principal dos detalhes da corrida */}
                {this.state.rateDetailsObjects[0] && this.state.openModalPayment == false ?
                    <View style={styles.containerBottom}>
                        {this.state.longDistance ?
                            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                                <Icon
                                    name='frown'
                                    type='feather'
                                    size={50}
                                    color={colors.GREY2}
                                    containerStyle={{ opacity: .5, marginTop: 70 }}
                                />
                                <Text style={{ fontFamily: 'Inter-Medium', fontSize: 16, opacity: .5, marginTop: 10 }}> Ops, ainda não atendemos sua região. </Text>
                            </View>
                            :
                            <Fragment>
                                <View contentContainerStyle={{ justifyContent: 'center' }} horizontal={true} showsHorizontalScrollIndicator={false}>
                                    <View style={styles.cards}>
                                        <View style={[styles.cardInfo,
                                        {
                                            borderWidth: this.state.selected == 0 ? 1 : 0,
                                            borderColor: this.state.selected == 0 ? colors.BLACK : colors.GREY3,
                                        }
                                        ]}>
                                            <TouchableOpacity style={styles.touchCard1} onPress={() => this.state.buttonDisabled ? null : this.selectCarType(0)}>
                                                {/*<Icon
                                        name='info'
                                        type='feather'
                                        size={19}
                                        color={colors.DEEPBLUE}
                                        containerStyle={{ position: 'absolute', left: 5, top: 5, opacity: .5 }}
                                    />*/}
                                                <ColtEconomicoCar />
                                                <Text style={styles.textTypeCar}>{this.state.rateDetailsObjects[0].name}</Text>

                                                {this.state.estimatePrice1 >= 0 ?
                                                    <Text style={styles.price1}>{this.state.settings.symbol}
                                                        <Text style={styles.price2}>
                                                            {this.state.metodoPagamento === "Dinheiro/Carteira" ? ((this.state.estimatePrice1 - this.state.walletBallance)).toFixed(2) : (parseFloat(this.state.estimatePrice1)).toFixed(2)}
                                                        </Text>
                                                    </Text>
                                                    : null}

                                                {this.state.minTimeEconomico == null ?
                                                    <View style={[styles.timeBox, {
                                                        backgroundColor: 'transparent'
                                                    }]}>
                                                        <ActivityIndicator size="small" color={colors.DEEPBLUE} />
                                                    </View>
                                                    :
                                                    <View style={styles.timeBox}>
                                                        <Text style={styles.estimatedTime}>{parseInt(this.state.minTimeEconomico / 60) + " min"} </Text>
                                                    </View>
                                                }
                                            </TouchableOpacity>
                                        </View>

                                        {/* Segundo card */}
                                        <View style={[styles.cardInfo2,
                                        {
                                            borderWidth: this.state.selected == 1 ? 1 : 0,
                                            borderColor: this.state.selected == 1 ? colors.BLACK : colors.GREY3,
                                        }
                                        ]} >
                                            <TouchableOpacity style={styles.touchCard2} onPress={() => this.state.buttonDisabled ? null : this.selectCarType(1)}>
                                                {/*<Icon
                                        name='info'
                                        type='feather'
                                        size={19}
                                        color={colors.DEEPBLUE}
                                        containerStyle={{ position: 'absolute', left: 0, top: 5, opacity: .5 }}
                                    />*/}

                                                <ColtConfortCar />
                                                <Text style={styles.textTypeCar}>{this.state.rateDetailsObjects[1].name}</Text>

                                                {this.state.estimatePrice2 >= 0 ?
                                                    <Text style={styles.price1}>
                                                        {this.state.settings.symbol}
                                                        <Text style={styles.price2}>
                                                            {this.state.metodoPagamento === "Dinheiro/Carteira" ? ((this.state.estimatePrice2 - this.state.walletBallance)).toFixed(2) : (parseFloat(this.state.estimatePrice2)).toFixed(2)}
                                                        </Text>
                                                    </Text>
                                                    : null}

                                                {this.state.minTimeConfort == null ?
                                                    <View style={[styles.timeBox, {
                                                        backgroundColor: 'transparent'
                                                    }]}>
                                                        <ActivityIndicator size="small" color={colors.DEEPBLUE} />
                                                    </View>
                                                    :
                                                    <View style={styles.timeBox}>
                                                        <Text style={styles.estimatedTime}>{parseInt(this.state.minTimeConfort / 60) + " min"} </Text>
                                                    </View>
                                                }
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.estimatedTimeBooking}>
                                    <View style={styles.containerTempo}>
                                        <Text style={styles.textEstimatedTime}> Duração estimada </Text>
                                        <Text style={styles.estimatedTimeNumber}>{parseInt(this.state.estimatedTimeBooking / 60)} min</Text>
                                    </View>
                                    {this.state.metodoPagamento === 'Dinheiro' ?
                                        <View style={styles.containerDinheiro}>
                                            <TouchableOpacity style={styles.containerDinheiro} onPress={() => this.state.buttonDisabled ? null : this.openModal()}>
                                                <View >
                                                    <Icon
                                                        name='ios-cash'
                                                        type='ionicon'
                                                        size={22}
                                                        color={colors.GREEN.light}
                                                    />
                                                </View>
                                                <Text style={styles.metodoPagamento}> Dinheiro </Text>
                                            </TouchableOpacity>
                                        </View>
                                        : this.state.metodoPagamento === 'Carteira' ?
                                            <View style={styles.containerDinheiro}>
                                                <TouchableOpacity style={styles.containerCarteira} onPress={() => this.state.buttonDisabled ? null : this.openModal()}>
                                                    <View style={{ flexDirection: "row" }}>
                                                        <View>
                                                            <Icon
                                                                name='wallet'
                                                                type='simple-line-icon'
                                                                size={17}
                                                                color={colors.DEEPBLUE}
                                                            />
                                                        </View>
                                                        <Text style={styles.metodoPagamento}> Carteira Colt </Text>
                                                    </View>
                                                    <Text style={{ fontFamily: 'Inter-Bold', opacity: 0.4 }} >SALDO: R${parseFloat(this.state.walletBallance > 0 ? this.state.walletBallance : 0).toFixed(2)} </Text>
                                                </TouchableOpacity>
                                            </View>
                                            : <View style={styles.containerDinheiro}>
                                                <TouchableOpacity style={styles.containerDinheiro} onPress={() => this.state.buttonDisabled ? null : this.openModal()}>
                                                    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }} >
                                                        <Icon
                                                            name='wallet'
                                                            type='simple-line-icon'
                                                            size={17}
                                                            color={colors.GREEN.light}
                                                            containerStyle={{ opacity: 1 }}
                                                        />
                                                    </View>
                                                    <Text style={styles.metodoPagamentoDinCart}> Dinheiro + Carteira </Text>
                                                </TouchableOpacity>
                                            </View>
                                    }
                                </View>

                                <View style={[styles.viewBotao, {
                                    shadowOpacity: this.state.buttonDisabled ? 0 : 0.4,
                                }]}>
                                    <TouchableOpacity style={[styles.confirmButtonStyle, {
                                        backgroundColor: this.state.buttonDisabled ? colors.GREY.background : colors.DEEPBLUE,
                                        marginHorizontal: this.state.buttonDisabled ? 75 : 30
                                    }]} disabled={this.state.buttonDisabled} onPress={() => { this.setState({ buttonDisabled: true }), this.verifyCPF() }}>
                                        {this.state.buttonDisabled ?
                                            <ActivityIndicator
                                                size={'small'}
                                                color={colors.DEEPBLUE}
                                            />
                                            :
                                            <Text style={styles.buttonText}> Confirmar corrida </Text>
                                        }
                                    </TouchableOpacity>
                                </View>
                                {this.state.buttonDisabled ?
                                <View style={{ alignSelf: 'center', position: 'absolute', bottom: width < 375 ? 5 : 30 }}>
                                    <Text style={{ textAlign: 'center', fontFamily: 'Inter-SemiBold' }} > Preparando corrida... </Text>
                                </View>
                                    : null}
                            </Fragment>
                        }
                    </View>
                    : null}
                {
                    this.infoModal()
                }
                {
                    this.ModalPayment()
                }
                {
                    this.addCpf()
                }

            </View>
        );
    }
}

const styles = StyleSheet.create({
    fadingContainer: {
        width: "50%",
        position: 'absolute',
        left: 10,
        borderRadius: 10,
        bottom: 60,
        backgroundColor: colors.REDCLEAN,
        opacity: 0.7
    },
    fadingText: {
        fontSize: 10,
        margin: 10,
        color: colors.WHITE,
        fontFamily: 'Inter-Bold'
    },
    container: {
        flex: 1,
        //marginTop: StatusBar.currentHeight
    },
    mapcontainer: {
        flex: 2,
        top: 0,
        width: width,
        height: (height - 300),
        justifyContent: 'center',
        //alignItems: 'center',
    },
    locationBoxDestino: {
        flexWrap: "wrap",
        maxWidth: 200,
        backgroundColor: "#FFF",
        borderRadius: 4,
        flexDirection: 'row',
        marginTop: Platform.OS == 'ios' ? 3 : 2,
        marginLeft: Platform.OS == 'android' ? 19 : null,
    },
    locationText: {
        flexWrap: "wrap",
        fontSize: 14,
        fontWeight: "500",
        color: colors.BLACK,
        marginRight: 4,
        marginTop: 4,
        marginLeft: 4,
        marginBottom: 4
    },
    promoModalContainer: {
        flex: 1
    },
    viewTopPromoModal: {
        backgroundColor: colors.WHITE,
        width: width,
        height: Platform.OS == 'ios' ? 90 : 75,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowOffset: { x: 0, y: 0 },
        shadowRadius: 10,
        elevation: 15,
    },
    HeaderPromoModal: {
        marginTop: Platform.OS == 'ios' ? 20 : null,
        width: width,
    },
    btnConfirmarPromoModal: {
        backgroundColor: colors.DEEPBLUE,
        height: 40,
        marginHorizontal: 75,
        borderRadius: 50,
        marginTop: 40,
        marginBottom: 5,
        justifyContent: 'center',
        alignItems: 'center'
    },
    textConfirmarPromoModal: {
        fontFamily: 'Inter-Bold',
        fontSize: 17,
        color: colors.WHITE
    },
    textMoney: {
        fontFamily: 'Inter-Medium',
        fontWeight: "600",
        fontSize: 20,
        marginLeft: 7
    },
    iconMoney: {
        marginLeft: 30,

    },
    containerModalPayment: {
        flex: 1,
        shadowColor: colors.BLACK,
        shadowOpacity: 0.2,
        shadowOffset: { x: 0, y: 0 },
        shadowRadius: 15,
        //backgroundColor: 'rgba(0,0,0,0.5)',
    },
    backgroundModalPayment: {
        position: 'absolute',
        bottom: 0,
        height: 300,
        padding: 0,
        backgroundColor: colors.GREY3,
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        width: width,
    },
    boxMoney: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        backgroundColor: colors.WHITE,
        height: 55,
        marginTop: 16,
        borderRadius: 10,
        elevation: 2,
        shadowColor: colors.GREY2,
        shadowOpacity: 0.2,
        shadowOffset: { x: 0, y: 0 },
        shadowRadius: 15,
    },
    boxCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        backgroundColor: colors.WHITE,
        height: 60,
        marginTop: 16,
        borderRadius: 10,
        elevation: 2,
        shadowColor: colors.GREY2,
        shadowOpacity: 0.2,
        shadowOffset: { x: 0, y: 0 },
        shadowRadius: 15,
    },
    bordaIconeVoltar: {
        position: 'absolute',
        top: Platform.OS == 'android' ? 35 : 45,
        backgroundColor: colors.WHITE,
        width: 42,
        height: 42,
        borderRadius: 50,
        elevation: 5,
        justifyContent: 'center',
        alignItems: 'center',
        left: 15,
        shadowColor: '#000',
        shadowOffset: { x: 0, y: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    btnAddPromo: {
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
        shadowOpacity: 0.1,
        shadowOffset: { x: 0, y: 0 },
        shadowRadius: 10,
        elevation: 5,
        opacity: 0.9,
    },
    btnCancellRate: {
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        bottom: 10,
        left: 10,
        height: 40,
        width: 40,
        borderRadius: 50,
        backgroundColor: colors.RED,
        shadowColor: colors.RED,
        shadowOpacity: 0.5,
        shadowOffset: { x: 0, y: 0 },
        shadowRadius: 10,
        elevation: 5
    },
    btnRoute: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        right: 10,
        width: 45,
        height: 45,
        borderRadius: 50,
        backgroundColor: colors.WHITE,
        bottom: 50,
        marginBottom: 8,
        marginRight: 10,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { x: 0, y: 0 },
        shadowRadius: 10,
        elevation: 5,
        opacity: 0.9,
    },
    txtCupom: {
        fontFamily: 'Inter-Bold',
        fontSize: 15,
        opacity: 0.5
    },
    map: {
        flex: 1,
        ...StyleSheet.absoluteFillObject,
    },
    containerBottom: {
        width: width,
        shadowColor: '#000',
        shadowOffset: { x: 0, y: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        backgroundColor: colors.WHITE,
        elevation: 5,
        flex: width < 375 ? 2 : 1.5,
        alignSelf: 'center',
    },
    viewBotao: {
        paddingTop: 5,
        paddingBottom: width < 375 ? 10 : 50,
        justifyContent: 'center',
        elevation: 5,
        shadowColor: colors.DEEPBLUE,
        shadowOpacity: 0.4,
        shadowOffset: { x: 0, y: 0 },
        shadowRadius: 10,
    },
    confirmButtonStyle: {
        justifyContent: 'center',
        alignItems: 'center',
        height: 50,
        borderRadius: 30,
    },
    estimatedTimeBooking: {
        paddingBottom: 10,
        paddingTop: 20,
        flexDirection: 'row',
        marginHorizontal: 45,
        justifyContent: 'space-between',
    },
    containerTempo: {
        justifyContent: 'center',
    },
    containerDinheiro: {
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        right: 0,
    },
    containerCarteira: {
        flexDirection: 'column',
        right: 0,
    },
    bordaIconeDinheiro: {
        width: 22,
        height: 22,
        backgroundColor: colors.GREEN.light,
        opacity: 0.6,
        borderRadius: 50,
        left: 0,
        justifyContent: 'center'
    },

    textEstimatedTime: {
        color: colors.GREY1,
        fontFamily: 'Inter-Bold',
        fontSize: 16,
        left: 0
    },
    estimatedTimeNumber: {
        fontSize: 17,
        fontFamily: 'Inter-Bold',
        color: colors.DEEPBLUE
    },
    metodoPagamento: {
        fontFamily: 'Inter-Medium',
        fontSize: 20,
        color: colors.BLACK,
        marginLeft: 0
    },
    metodoPagamentoDinCart: {
        fontFamily: 'Inter-Medium',
        fontSize: 16,
        fontWeight: "500",
        color: colors.BLACK,
        marginLeft: 0
    },
    cards: {
        backgroundColor: colors.WHITE,
        justifyContent: 'center',
        flexDirection: 'row',
        marginHorizontal: 45,
        marginTop: 10
    },
    buttonText: {
        color: colors.WHITE,
        fontFamily: 'Roboto-Bold',
        fontSize: 20,
        //alignSelf: 'flex-end' 
    },
    buttonStyle: {
        backgroundColor: colors.GREY.secondary,
        elevation: 0
    },
    cardInfo: {
        backgroundColor: colors.WHITE,
        borderRadius: 15,
        width: 130,
        height: 150,
        marginRight: 20,
        top: 6,
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { x: 0, y: 5 },
        shadowRadius: 10,
    },
    touchCard1: {
        alignItems: 'center',
    },
    touchCard2: {
        alignItems: 'center',
    },
    cardInfo2: {
        backgroundColor: colors.WHITE,
        borderRadius: 15,
        width: 130,
        height: 150,
        top: 6,
        elevation: 4,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { x: 0, y: 5 },
        shadowRadius: 10,
    },
    carEconomico: {
        marginHorizontal: 20,
        top: 0,
        width: 80,
        height: 60
    },
    estimatedTime: {
        fontSize: 17,
        top: 0,
        fontFamily: 'Inter-Bold',
        left: 0,
        color: colors.WHITE,
    },
    timeBox: {
        top: Platform.OS == "android" ? 10 : 14,
        backgroundColor: colors.GREY1,
        width: 70,
        height: 25,
        borderRadius: 50,
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center'
    },
    textTypeCar: {
        top: 0,
        fontSize: 15,
        fontFamily: 'Inter-Regular',
    },
    price1: {
        top: 0,
        fontSize: 13,
        fontFamily: 'Inter-Bold',
    },
    price2: {
        top: 40,
        fontSize: 19,
        fontFamily: 'Inter-Bold',
    },
});
