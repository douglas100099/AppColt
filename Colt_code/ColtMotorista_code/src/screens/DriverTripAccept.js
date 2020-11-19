import React from 'react';
import { Text, View, StyleSheet, Dimensions, FlatList, TouchableOpacity, Modal, Image, Platform, Alert, ActivityIndicator } from 'react-native';
import { Icon } from 'react-native-elements';
import Polyline from '@mapbox/polyline';
import MapView, { PROVIDER_GOOGLE, Marker, AnimatedRegion } from 'react-native-maps';
import { colors } from '../common/theme';
import * as Location from 'expo-location';
import * as Permissions from 'expo-permissions';
var { width, height } = Dimensions.get('window');
import * as firebase from 'firebase'
import { ActionSheetCustom } from 'react-native-actionsheet';
import { RequestPushMsg } from '../common/RequestPushMsg';
import distanceCalc from '../common/distanceCalc';
import { Pulse } from 'react-native-animated-spinkit'
import Geocoder from 'react-native-geocoding';
import { google_map_key } from '../common/key';
import languageJSON from '../common/language';
import { Audio } from 'expo-av';
import * as IntentLauncher from 'expo-intent-launcher';
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
import * as Battery from 'expo-battery';
import * as Animatable from 'react-native-animatable';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import Easing from 'react-native-reanimated';
import * as Linking from 'expo-linking';
import { getPixelSize } from '../constants/utils';
import Directions from "../components/Directions";
import customMapStyle from "../../mapstyle.json";

import IconMenuSVG from '../SVG/IconMenuSVG';
import IconCloseSVG from '../SVG/IconCloseSVG';
import CellphoneSVG from '../SVG/CellphoneSVG';
import MarkerPicSVG from '../SVG/MarkerPicSVG';
import { useAssets } from 'expo-asset';

Geocoder.init(google_map_key);

const screen = Dimensions.get('window');

const LATITUDE = 0;
const LONGITUDE = 0;
const LATITUDE_DELTA = 0.0043;
const LONGITUDE_DELTA = 0.0034;
const HEADING = 0;

export default class DriverTripAccept extends React.Component {

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
            starCount: 5,
            coords: [],
            value: 0,
            tasklist: [],
            driverDetails: null,
            curUid: '',
            id: 0,
            loader: false,
            distance: 0,
            isBlocked: false,
            loaderBtn: false,
            chegouCorrida: false,
            isSound: false,
            acceptBtnDisable: false,
            intervalCheckGps: null,
            batteryLevel: null,
            animatedGrana: true,
            duration: null,
        }
        this._getLocationAsync();
    }

    _activate = () => {
        activateKeepAwake();
    };

    _deactivate = () => {
        deactivateKeepAwake();
    };

    // ESSE .ON AI PEGA E LER O VALOR DO BANCO QUANDO CHAMADO, E FICA ATUALIZANDO
    _getStatusDetails = async () => {
        try {
            if (this._isMounted) {
                let ref = firebase.database().ref('users/' + this.state.curUid + '/driverActiveStatus/');
                ref.on('value', (snapshot) => {
                    this.setState({
                        statusDetails: snapshot.val()
                    })
                })
            }
        } catch (err) {
            alert('Erro ao acessar informações de conexão do motorista.')
        }
    }

    async onChangeFunction() {
        let verificarGPS = await Location.hasServicesEnabledAsync();
        const { status } = await Permissions.askAsync(Permissions.LOCATION);
        const checkarBlock = firebase.database().ref('users/' + this.state.curUid + '/');
        checkarBlock.once('value', customerData => {
            let checkBlock = customerData.val()
            if (checkBlock.blocked) {
                this.setState({
                    isBlocked: checkBlock.blocked.isBlocked,
                    reason: checkBlock.blocked.isBlocked
                })
                const now = new Date(); // Data de hoje
                const past = new Date(checkBlock.blocked.data); // Outra data no passado
                const diff = Math.abs(now.getTime() - past.getTime()); // Subtrai uma data pela outra
                const hours = Math.ceil(diff / (1000 * 60 * 60)); // Divide o total pelo total de milisegundos correspondentes a 1 dia. (1000 milisegundos = 1 segundo).
                if (checkBlock.blocked && hours == 24) {
                    alert(checkBlock.blocked.motivo + ' Tempo restante: ' + (24 - hours) + ' Horas')
                } else {
                    firebase.database().ref(`/users/` + this.state.curUid + '/blocked').remove().then(
                        firebase.database().ref(`/users/` + this.state.curUid + '/canceladasRecentes').update({
                            count: 0,
                            countRecentes: 0,
                        })
                    )
                    alert('Motorista desbloqueado, fique online novamente.')
                }
            } else {
                if (this.state.statusDetails == true) {
                    firebase.database().ref(`/users/` + this.state.curUid + '/').update({
                        driverActiveStatus: false
                    }).then(() => {
                        this.checkingGps();
                    })
                } else {
                    if (status === "granted") {
                        if (this.state.statusDetails == false && verificarGPS && this.state.batteryLevel > 0.10) {
                            if (this.location == null) {
                                this._getLocationAsync();
                            }
                            firebase.database().ref(`/users/` + this.state.curUid + '/').update({
                                driverActiveStatus: true
                            }).then(() => {
                                this.setState({ alertIsOpen: false, requestPermission: false });
                                //clearInterval(this.state.intervalCheckGps);
                            })
                        } else {
                            if (this.state.intervalCheckGps == null) {
                                this.openAlert()
                                this.checkingGps()
                            }
                        }
                    } else {
                        this.requestPermission()
                    }
                }
            }
        })
    }

    async requestPermission() {
        this.setState({ requestPermission: true })
        await Location.requestPermissionsAsync();
    }

    photoPerfil = () => {
        this.setState({ loaderBtn: true })
        this.props.navigation.navigate('Profile');
        this.setState({ loaderBtn: false })
    }

    carteira = () => {
        this.setState({ loaderBtn: true })
        this.props.navigation.navigate('MyEarning');
        this.setState({ loaderBtn: false })
    }

    _getPhotoDriver = async () => {
        try {
            if (this._isMounted) {
                console.log('ENTROU NA FOTO PERFIL')
                let ref = firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/profile_image/');
                ref.once('value', (snapshot) => {
                    this.setState({
                        photoDriver: snapshot.val()
                    })
                })
            }
        } catch (err) {
            alert('Erro ao gerar a imagem de perfil.')
        }
    }



    async componentDidMount() {
        this._isMounted = true;
        this._subscribe();
        this.getRiders();
        this._activate();
        await this._getPhotoDriver();
        await this._getStatusDetails();
        await this._getInfoEraning();
        this.configAudio();

        this.sound = new Audio.Sound()
        const status = {
            shouldPlay: false
        };
        this.sound.loadAsync(require('../../assets/sounds/alerta.mp3'), status, false)
    }

    configAudio() {
        console.log('CONFIGURANDO AUDIO')
        Audio.setAudioModeAsync({
            staysActiveInBackground: true,
        })
    }

    playSound() {
        this.setState({ isSound: true })
        this.sound.setIsLoopingAsync(true);
        this.sound.setVolumeAsync(1);
        this.sound.playAsync();
        console.log('PLAY SOUND')
    }

    stopSound() {
        this.setState({ isSound: false })
        this.sound.stopAsync();
        console.log('STOP SOUND')
    }


    async componentWillUnmount() {
        this._isMounted = false
        if (this.location != undefined) {
            this.location.remove()
        }
        if (this.state.intervalCheckGps) {
            clearInterval(this.state.intervalCheckGps)
        }
        this._unsubscribe();
        this.sound.unloadAsync();
    }

    // VERIFICAR BATERIA
    async _subscribe() {
        const batteryLevel = await Battery.getBatteryLevelAsync();
        this.setState({ batteryLevel });
        this._subscription = Battery.addBatteryLevelListener(({ batteryLevel }) => {
            this.setState({ batteryLevel });
        });
        if (this.state.batteryLevel) {
            if (this.state.batteryLevel <= 0.10) {
                if (this.state.statusDetails != null) {
                    if (this.state.statusDetails) {
                        firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/driverActiveStatus/').set(false);
                        alert('Você foi desconectado, nivel de bateria abaixo de 10%, para aceitar corridas. Nivel: ' + parseFloat(this.state.batteryLevel).toFixed(2) * 100 + '%')
                    } else {
                        alert('Nivel de bateria abaixo de 10%, carregue e volte a ficar online. Nivel: ' + parseFloat(this.state.batteryLevel).toFixed(2) * 100 + '%')
                    }
                }
            }
        }
    }

    _unsubscribe() {
        this._subscription && this._subscription.remove();
        this._subscription = null;
    }

    _getInfoEraning = async () => {
        try {
            let userUid = firebase.auth().currentUser.uid;
            let ref = firebase.database().ref('users/' + userUid + '/ganhos');
            ref.on('value', allBookings => {
                if (allBookings.val()) {
                    let data = allBookings.val();
                    var myBookingarr = [];
                    for (let k in data) {
                        data[k].bookingKey = k
                        myBookingarr.push(data[k])
                    }

                    if (myBookingarr) {
                        this.setState({ myBooking: myBookingarr.reverse() }, () => {
                            this.eraningCalculation()
                        })
                    }
                }
            })
        } catch (err) {
            alert('Erro ao atualizar ganhos do motorista.')
        }
    }
    eraningCalculation() {
        if (this.state.myBooking) {
            let today = new Date();
            let tdTrans = 0;
            let mnTrans = 0;
            let totTrans = 0;
            for (let i = 0; i < this.state.myBooking.length; i++) {
                const { data, ganho } = this.state.myBooking[i];
                let tDate = new Date(data);
                if (ganho != undefined) {
                    if (tDate.getDate() === today.getDate() && tDate.getMonth() === today.getMonth()) {
                        tdTrans = tdTrans + ganho;
                    }
                    if (tDate.getMonth() === today.getMonth() && tDate.getFullYear() === today.getFullYear()) {
                        mnTrans = mnTrans + ganho;

                    }
                    totTrans = totTrans + ganho;
                }
            }
            this.setState({
                today: tdTrans,
            })
        }
    }

    openAlert() {
        this.setState({ alertIsOpen: true })
        Alert.alert(
            'Localização necessária',
            'Para receber corrida e ficar online, precisamos de sua localização ativa, por favor ative-a em configurações.',
            [{
                text: "Cancelar",
                onPress: () => this.setState({ alertIsOpen: false }),
                style: "cancel"
            },
            { text: 'IR PARA CONFIGURAÇÕES', onPress: () => { this.setState({ alertIsOpen: false }), IntentLauncher.startActivityAsync(IntentLauncher.ACTION_LOCATION_SOURCE_SETTINGS) } }
            ],
            { cancelable: false }
        );
    }

    // NOVA FORMA DE PEGAR A LOCALIZAÇÃO DO USUARIO
    _getLocationAsync = async () => {

        let { status } = await Permissions.askAsync(Permissions.LOCATION);
        let gpsActived = await Location.hasServicesEnabledAsync()

        if (status === "granted" && gpsActived) {
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
                        latitudeDelta: 0.045,
                        longitudeDelta: 0.045,
                        angle: coords.heading,
                    };

                    this.setState({ region: region });
                    this.setLocationDB(region.latitude, region.longitude, region.angle)
                },
                error => console.log(error)
            );
            return this.location
        } else {
            this.openAlert();
            firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/driverActiveStatus').set(false);
            if (this.state.intervalCheckGps == null) {
                this.checkingGps();
            }
        }
    };

    // SALVA NO BANCO A NOVA LOCALIZAÇÃO
    setLocationDB(lat, lng, angle) {
        let uid = firebase.auth().currentUser.uid;
        var latlng = lat + ',' + lng;
        fetch('https://maps.googleapis.com/maps/api/geocode/json?latlng=' + latlng + '&key=' + google_map_key)
            .then((response) => response.json())
            .then((responseJson) => {
                if (responseJson.results[0] && responseJson.results[0].formatted_address) {
                    let address = responseJson.results[0].formatted_address;
                    firebase.database().ref('users/' + uid + '/location').update({
                        add: address,
                        lat: lat,
                        lng: lng,
                        angle: angle,
                    });
                }
            }).catch((error) => {
                console.error(error);
            });
    }

    checkingGps() {
        this.setState({
            intervalCheckGps: setInterval(async () => {
                let verificarGPS = await Location.hasServicesEnabledAsync();
                const { status } = await Permissions.askAsync(Permissions.LOCATION);
                if (status == "granted") {
                    if (!verificarGPS) {
                        if (!this.state.alertIsOpen) {
                            this.openAlert();
                        }
                        if (this.location != null) {
                            this.location.remove()
                            this.location = null
                        }
                        if (this.state.statusDetails) {
                            if (this.state.curUid) {
                                firebase.database().ref('users/' + this.state.curUid + '/driverActiveStatus').set(false);
                            }
                        }
                    }
                } else {
                    if (this.state.statusDetails) {
                        if (this.state.curUid) {
                            firebase.database().ref('users/' + this.state.curUid + '/driverActiveStatus').set(false);
                        }
                    }
                    if (!this.state.requestPermission) {
                        this.setState({ requestPermission: true })
                        await Location.requestPermissionsAsync();
                    }
                }
            }, 5000),
        })
    }

    //get nearby riders function
    getRiders() {
        if (this._isMounted) {
            var curuid = firebase.auth().currentUser.uid;
            this.setState({ curUid: firebase.auth().currentUser.uid })
            let ref = firebase.database().ref('users/' + curuid + '/');
            ref.on('value', (snapshot) => {
                this.setState({ driverDetails: snapshot.val() })
                var jobs = [];
                if (snapshot.val() && snapshot.val().waiting_riders_list) {
                    let waiting_riderData = snapshot.val().waiting_riders_list;
                    for (let key in waiting_riderData) {
                        waiting_riderData[key].bookingId = key;
                        jobs.push(waiting_riderData[key]);
                        
                        var location1 = [waiting_riderData[key].pickup.lat, waiting_riderData[key].pickup.lng];
                        var location2 = [this.state.region.latitude, this.state.region.longitude];
                        var distancee = distanceCalc(location1, location2);
                        this.setState({ distance: distancee, acceptBtnDisable: false })
                    }
                    this.setState({ chegouCorrida: true })
                    if (this.state.isSound == false) {
                        this.playSound()
                        Linking.openURL('coltappmotorista://');
                    }
                } else if (this.state.chegouCorrida == true) {
                    this.setState({ chegouCorrida: false })
                    if (this.state.isSound) {
                        this.stopSound()
                    }
                }
                if (snapshot.val().in_reject_progress) {
                    if (snapshot.val().in_reject_progress.punido == false) {
                        this.props.navigation.replace('BookingCancel')
                    }
                }
                this.setState({ tasklist: jobs.reverse() });
                this.jobs = jobs;
                /*if(this.state.chegouCorrida){
                    setTimeout(() => {this.circularProgress.animate(100, 14000, Easing.quad)},1000);
                }*/
            });
        }
    }

    // accept button press function
    onPressAccept(item) {
        this.stopSound()
        this.setState({ loader: true })
        if (this.state.status === 'CANCELLED') {
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
                driver_image: this.state.driverDetails.profile_image ? this.state.driverDetails.profile_image : "",
                driver_name: this.state.driverDetails.firstName + ' ' + this.state.driverDetails.lastName,
                driver_firstName: this.state.driverDetails.firstName,
                driver_contact: this.state.driverDetails.mobile,
                vehicle_number: this.state.driverDetails.vehicleNumber,
                vehicleModelName: this.state.driverDetails.vehicleModel,
                driverRating: this.state.driverDetails.ratings ? this.state.driverDetails.ratings.userrating : "5.0",
                drop: item.drop,
                ratingRider: item.ratingRider,
                pickup: item.pickup,
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
                driver_image: this.state.driverDetails.profile_image ? this.state.driverDetails.profile_image : "",
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
                                firebase.database().ref('users/' + requestedDriver + '/waiting_riders_list/' + item.bookingId + '/').remove().then()
                                    .then(() => {
                                        this.setState({ loader: false, chegouCorrida: false })
                                        this.props.navigation.replace('DriverTripStart', { allDetails: item, regionUser: this.state.region })
                                    })
                            }
                        })
                    })
                    this.sendPushNotification(item.customer, this.state.driverDetails.firstName + ' aceitou seu chamado, aguarde.')
                }).catch((error) => {
                    console.log(error)
                    alert('Ops, tivemos um problema.')
                })


                let userDbRef = firebase.database().ref('users/' + item.customer + '/my-booking/' + item.bookingId + '/'); userDbRef.update(riderData);
                let currentUserdbRef = firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/');
                currentUserdbRef.update({
                    queue: true,
                    emCorrida: item.bookingId,
                })
            }
        }


    }

    showActionSheet() {
        this.RefActionSheet.show()
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
                        firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/driverActiveStatus').set(false)

                    }).then(() => {
                        firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/in_reject_progress').update({
                            punido: false,
                        })
                    }).then(() => {
                        let userDbRef = firebase.database().ref('users/' + item.customer + '/my-booking/' + item.bookingId + '/');
                        userDbRef.update({
                            status: "REJECTED",
                        });
                        this.props.navigation.navigate('BookingCancel')
                        this.setState({ loader: false, chegouCorrida: false });
                    })
                    //firebase.database().ref('bookings/' + item.bookingId + '/requestedDriver/').remove();
                }
            });
            firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/waiting_riders_list/' + item.bookingId + '/').remove()
        }

    }

    cancelModal() {
        return (
            <Modal
                animationType='slide'
                transparent={false}
                visible={this.state.cancelModal}
                onRequestClose={() => {
                    this.setState({ cancelModal: false })
                }}>
                <View style={{ flex: 1 }}>

                </View>
            </Modal>
        )
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

    centerFollowMap() {
        this.map.animateToRegion(this.state.region, 500)
    }


    render() {
        const { region } = this.state;
        return (
            <View style={styles.mainViewStyle}>
                {/*<StatusBar barStyle='dark-content' backgroundColor={colors.DEEPBLUE} />*/}
                {/* AQUI ENTRA TODOS OS BOTÕES FLUTUANTES DO MENU */}

                {/* MODAL ACEITAR E REJEITAR */}
                {this.state.chegouCorrida ?
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
                                                message={<Text style={{ color: colors.BLACK, fontSize: 14, fontFamily: 'Inter-Regular', textAlign: 'center' }}>Rejeitar essa corrida poderá afetar sua taxa de cancelamento</Text>}
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
                                                showsScale={false}
                                                customMapStyle={customMapStyle}
                                                showsMyLocationButton={false}
                                                Region={{
                                                    latitude: this.state.region.latitude,
                                                    longitude: this.state.region.longitude,
                                                    longitudeDelta: 0.0134,
                                                    latitudeDelta: 0.0143,
                                                }}

                                            >
                                                <Marker.Animated
                                                    ref={marker => { this.marker = marker }}
                                                    coordinate={{ latitude: this.state.region ? this.state.region.latitude : 0.00, longitude: this.state.region ? this.state.region.longitude : 0.00 }}
                                                    anchor={{ x: 0.5, y: 0.5 }}
                                                    style={{ transform: [{ rotate: this.state.region.angle + "deg" }] }}
                                                >
                                                    <CellphoneSVG
                                                        width={35}
                                                        height={35}
                                                    />
                                                </Marker.Animated>
                                                <Marker
                                                    coordinate={{ latitude: item.pickup.lat, longitude: item.pickup.lng }}
                                                    anchor={{ x: 0.5, y: 1 }}
                                                >
                                                    <MarkerPicSVG
                                                        width={40}
                                                        height={40}
                                                    />
                                                </Marker>
                                                {region ?
                                                    <Directions
                                                        origin={{ latitude: this.state.region.latitude, longitude: this.state.region.longitude }}
                                                        destination={{ latitude: item.pickup.lat, longitude: item.pickup.lng }}
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
                                                    : null}
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
                                                        <TouchableOpacity style={styles.btnRejeitar} onPress={() => { this.showActionSheet() }}>
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

                    :
                    //ESSA PARTE APARECE SE N HOUVER CORRIDA
                    <View style={{ flex: 1 }}>
                        <View style={{ flex: 1 }}>
                            <MapView
                                ref={map => { this.map = map }}
                                style={styles.map}
                                rotateEnabled={false}
                                provider={PROVIDER_GOOGLE}
                                showsUserLocation={false}
                                showsCompass={false}
                                showsScale={false}
                                customMapStyle={customMapStyle}
                                showsMyLocationButton={false}
                                region={this.state.region ? this.state.region : null}
                            >
                                {region ?
                                    <Marker.Animated
                                        ref={marker => { this.marker = marker }}
                                        coordinate={{
                                            latitude: region ? this.state.region.latitude : 0,
                                            longitude: region ? this.state.region.longitude : 0
                                        }}
                                        anchor={{ x: 0.5, y: 0.5 }}
                                        style={{ transform: [{ rotate: this.state.region.angle + "deg" }] }}
                                    >
                                        <CellphoneSVG
                                            height={35}
                                            width={35}
                                        />
                                    </Marker.Animated>
                                    : null}
                            </MapView>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
                                {/* BOTÃO MENU VOLTAR */}
                                <TouchableOpacity style={styles.touchaVoltar} onPress={() => { this.props.navigation.toggleDrawer(); }}>
                                    <IconMenuSVG height={28} width={28} />
                                </TouchableOpacity>


                                {/* BOTÃO GANHOS CENTRO */}
                                <TouchableOpacity style={styles.touchaGanhos} disabled={this.state.loaderBtn} onPress={() => { this.carteira() }}>
                                    {this.state.animatedGrana && this.state.today > 0 ?
                                        <Animatable.Text useNativeDriver={true} delay={1100} onAnimationEnd={() => this.setState({ animatedGrana: false })} animation="fadeInLeft" style={{ position: 'absolute', left: 5, color: '#49c33b', fontSize: 22, fontFamily: 'Inter-Bold' }}>+</Animatable.Text>
                                        :
                                        null}
                                    <Animatable.Text useNativeDriver={true} animation="bounceInLeft" style={styles.touchaValor}>R$ {this.state.today ? parseFloat(this.state.today).toFixed(2) : '0'}</Animatable.Text>
                                </TouchableOpacity>

                                {/* BOTÃO FOTOS */}
                                <TouchableOpacity style={styles.touchaFoto} disabled={this.state.loaderBtn} onPress={() => { this.photoPerfil() }}>
                                    <Animatable.Image useNativeDriver={true} animation="fadeIn" source={this.state.photoDriver ? { uri: this.state.photoDriver } : require('../../assets/images/profilePic.png')} style={styles.imagemPerfil} />
                                </TouchableOpacity>
                            </View>
                            {region ?
                                <Animatable.View useNativeDriver={true} animation="fadeIn" style={styles.touchaVoltar2}>
                                    <TouchableOpacity onPress={() => { this.centerFollowMap() }}>
                                        <Icon
                                            name='crosshair'
                                            type='feather'
                                            size={25}
                                            color={colors.BLACK}
                                        />
                                    </TouchableOpacity>
                                </Animatable.View>
                                : null}
                        </View>

                        {/* BOTÃO LIGAR E DESLIGAR */}
                        {this.state.chegouCorrida == false ?
                            (this.state.statusDetails ?
                                <View style={{ alignItems: 'center' }}>
                                    <Animatable.View animation={this.state.statusDetails ? 'fadeInUp' : 'fadeInDown'} useNativeDriver={true} style={styles.btnOnOff}>
                                        <Pulse size={150} color="#49c33b" style={{ position: 'absolute' }} />
                                        <TouchableOpacity onPress={() => { this.onChangeFunction(this.state.statusDetails); }}>
                                            <Icon
                                                name='navigation-2'
                                                type='feather'
                                                size={25}
                                                color={colors.WHITE}
                                            />
                                            <Text style={styles.textConectar}>ONLINE</Text>
                                        </TouchableOpacity>
                                    </Animatable.View>
                                </View>

                                :

                                <View>
                                    <View style={{ alignItems: 'center', }}>
                                        <Animatable.View style={styles.btnOnOff2} animation={this.state.statusDetails ? 'fadeInDown' : 'fadeInUp'} useNativeDriver={true}>
                                            <TouchableOpacity onPress={() => { this.onChangeFunction(this.state.statusDetails); }}>
                                                <Icon
                                                    name='navigation-2'
                                                    type='feather'
                                                    size={25}
                                                    color={colors.WHITE}
                                                />
                                                <Text style={styles.textConectar2}>OFFLINE</Text>
                                            </TouchableOpacity>
                                        </Animatable.View>
                                    </View>
                                </View>
                            )
                            :
                            null
                        }
                    </View>
                }
            </View>
        )
    }
}


//Screen Styling
const styles = StyleSheet.create({

    // AQUI ENTRA O NOVO CSS // -----
    touchaVoltar: {
        position: 'absolute',
        alignItems: 'center',
        width: 48,
        height: 48,
        borderRadius: 50,
        backgroundColor: colors.WHITE,
        elevation: 5,
        justifyContent: 'center',
        top: Platform.select({ ios: 40, android: 30 }),
        left: 12,

    },
    touchaVoltar2: {
        position: 'absolute',
        alignItems: 'center',
        width: 48,
        height: 48,
        borderRadius: 50,
        backgroundColor: colors.WHITE,
        elevation: 5,
        justifyContent: 'center',
        bottom: height / 4,
        right: 20
    },

    touchaGanhos: {
        position: 'absolute',
        flexDirection: 'row',
        borderWidth: 1.5,
        justifyContent: 'center',
        alignItems: 'center',
        width: width / 3,
        height: 50,
        borderRadius: 50,
        backgroundColor: colors.DEEPBLUE,
        borderColor: colors.WHITE,
        elevation: 5,
        top: Platform.select({ ios: 40, android: 30 }),
    },
    touchaValor: {
        fontFamily: 'Inter-Bold',
        fontSize: 20,
        color: colors.WHITE
    },

    touchaCorrida: {
        fontFamily: 'Inter-Bold',
        fontSize: 13,
        color: colors.GREY2,
    },

    iconCentermap: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        height: 30,
        width: 30,
        bottom: 45,
        right: 15,
    },

    touchaFoto: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        width: 50,
        height: 50,
        borderRadius: 50,
        backgroundColor: colors.WHITE,
        elevation: 5,
        top: Platform.select({ ios: 40, android: 30 }),
        right: 12,
    },

    imagemPerfil: {
        width: 48,
        height: 48,
        borderRadius: 50,
    },

    btnOnOff: {
        position: 'absolute',
        justifyContent: 'center',
        backgroundColor: '#49c33b',
        borderColor: colors.WHITE,
        borderWidth: 2,
        alignItems: 'center',
        elevation: 4,
        borderRadius: 100,
        height: 80,
        width: 80,
        bottom: 45,
    },

    btnOnOff2: {
        position: 'absolute',
        justifyContent: 'center',
        backgroundColor: colors.RED,
        borderColor: colors.WHITE,
        borderWidth: 2,
        alignItems: 'center',
        elevation: 4,
        borderRadius: 100,
        height: 80,
        width: 80,
        bottom: 45,
    },

    textConectar: {
        fontFamily: 'Inter-Bold',
        fontSize: 12,
        color: colors.WHITE,
    },

    textConectar2: {
        fontFamily: 'Inter-Bold',
        fontSize: 12,
        color: colors.WHITE,
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

    imgModalView: {
        marginTop: 10,
        marginLeft: 15,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },

    imagemModal: {
        height: 35,
        width: 35,
        borderRadius: 50,
    },

    nomePessoa: {
        fontFamily: 'Inter-Bold',
        fontSize: 14,
        color: colors.BLACK,
        marginLeft: 8,
        marginRight: 8,
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

    txtDestino: {
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

    formaPgt: {
        marginLeft: 2,
        height: 23,
        alignItems: 'center',
        justifyContent: 'center',
        width: 23,
        backgroundColor: colors.WHITE,
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

    // FIM DO NOVO CSS // -------

    map: {
        flex: 1,
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
    },
    mainViewStyle: {
        flex: 1,
    },
});