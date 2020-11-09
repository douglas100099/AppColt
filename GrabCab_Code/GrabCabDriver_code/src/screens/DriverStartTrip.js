import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    Modal,
    Dimensions,
    AsyncStorage,
    Linking,
    ActivityIndicator,
    TouchableOpacity,
    Alert
} from 'react-native';
import { Icon, Button } from 'react-native-elements';
import ActionSheet from 'react-native-actionsheet';
import { colors } from '../common/theme';
import getDirections from 'react-native-google-maps-directions'
import Polyline from '@mapbox/polyline';
import { RequestPushMsg } from '../common/RequestPushMsg';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import * as Permissions from 'expo-permissions';
import { NavigationActions, StackActions } from 'react-navigation';
import * as Location from 'expo-location';
import * as firebase from 'firebase';
import distanceCalc from '../common/distanceCalc';
import languageJSON from '../common/language';
import CellphoneSVG from '../SVG/CellphoneSVG'
import MarkerPicSVG from '../SVG/MarkerPicSVG';
var { width, height } = Dimensions.get('window');
import { google_map_key } from '../common/key';
import dateStyle from '../common/dateStyle';
import * as IntentLauncher from 'expo-intent-launcher';
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
import RadioForm from 'react-native-simple-radio-button';
const LOCATION_TASK_NAME = 'background-location-task';
import * as Animatable from 'react-native-animatable';

const LATITUDE = 0;
const LONGITUDE = 0;
const LATITUDE_DELTA = 0.0043;
const LONGITUDE_DELTA = 0.0034;
const HEADING = 0; 

export default class DriverStartTrip extends React.Component {

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
        }
    }

    _activate = () => {
        activateKeepAwake();
    };

    _deactivate = () => {
        deactivateKeepAwake();
    };

    async UNSAFE_componentWillMount() {
        const allDetails = this.props.navigation.getParam('allDetails')
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
        this._isMounted = true;
        this.getCancelReasons();
        setTimeout(() => {
            this.getDirectionss('"' + this.state.region.latitude + ',' + this.state.region.longitude + '"', '"' + this.state.rideDetails.pickup.lat + ',' + this.state.rideDetails.pickup.lng + '"')
        }, 500)
    }

    componentWillUnmount() {
        this._isMounted = false;
        if (this.location != undefined) {
            console.log('REMOVEU O WATCH STARTTRIP')
            this.location.remove()
        }
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

                this.setState({ region: region });
                this.setLocationDB(region.latitude, region.longitude, region.angle);
                this.checkDistKM();
            },
            error => console.log(error)
        )
        return this.location
    };

    checkDistKM(){
        var location1 = [this.state.region.latitude, this.state.region.longitude];    //Rider Lat and Lang
        var location2 = [this.state.rideDetails.pickup.lat, this.state.rideDetails.pickup.lng];   //Driver lat and lang
        var distance = distanceCalc(location1, location2);
        this.setState({ kmRestante: distance })
    }

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
                    })
                }
            }).then(() => {
                firebase.database().ref('bookings/' + this.state.rideDetails.bookingId + '/current/').update({
                    lat: lat,
                    lng: lng,
                    angle: angle,
                })
            })
            .catch((error) => {
                console.error(error);
                alert('Ops, tivemos um problema.');
            });
    }

    checkStatus() {
        let tripRef = firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/my_bookings/' + this.state.rideDetails.bookingId + '/');
        tripRef.on('value', (snap) => {
            let tripData = snap.val();
            if (tripData) {
                this.setState({ status: tripData.status })
                if (tripData.status == "CANCELLED") {
                    AsyncStorage.getItem('horaEmbarque', (err, result) => {
                        if(result) {
                            AsyncStorage.removeItem('horaEmbarque') 
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
                            console.log(result)
                            let horaEmbarque = result
                            this.setState({ horaEmbarque: horaEmbarque })
                            console.log(this.state.horaEmbarque)
                        } else {
                            let horaEmbarque = new Date().getTime().toString()
                            AsyncStorage.setItem('horaEmbarque', horaEmbarque)
                            this.setState({ horaEmbarque: horaEmbarque })
                        }
                    })
                }
            }
        })
    }

    async getDirectionss(startLoc, destinationLoc) {
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
            this.setState({ coords: coords })
            return coords
        }
        catch (error) {
            alert('Ops, tivemos um problema ao marcar a direção no mapa.')
            return error
        }
    }

    checkDist(item) {
        this.setState({ allData: item, loader: true},
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

    //start trip button press function
    onPressStartTrip(item) {
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

    showActionSheet = () => {
        this.ActionSheet.show()
    }

    closeModal() {
        this.setState({ mediaSelectModal: false })
    }

    chat() {
        this.props.navigation.navigate("Chat", { passData: this.state.rideDetails });
    }

    callToCustomer(data) {
        if (data.customer) {
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
                            finalCalcBooking: true,
                            manageMoney: true,
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
        this.setState({ fitCordinates: true, followMap: false })
        setTimeout(() => {
            this.map.fitToCoordinates([{ latitude: this.state.region.latitude, longitude: this.state.region.longitude }, { latitude: this.state.rideDetails.pickup.lat, longitude: this.state.rideDetails.pickup.lng }], {
                edgePadding: { top: 80, right: 65, bottom: 50, left: 50 },
                animated: true,
            })
        }, 200);
    }

    centerFollowMap() {
        this.map.animateToRegion(this.state.region, 500)
        setTimeout(() => { this.setState({ followMap: true, fitCordinates: false }) }, 1100)
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
            this.setState({ loader: false })
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
                    console.log(result/60000)
                    if ((result/60000) < 5) {
                        firebase.database().ref(`/users/` + this.state.curUid + '/in_reject_progress').update({
                            punido: false,
                        }).then(() => {
                            firebase.database().ref(`/users/` + this.state.curUid + '/').update({ driverActiveStatus: false })
                        }).then(this.onCancelConfirm())
                    } else {
                        this.onCancelConfirm()
                    }
                } else {
                    firebase.database().ref(`/users/` + this.state.curUid + '/in_reject_progress').update({
                        punido: false,
                    }).then(() => {
                        firebase.database().ref(`/users/` + this.state.curUid + '/').update({ driverActiveStatus: false })
                    }).then(this.onCancelConfirm())
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
                                <View style={{ marginTop: 15, alignItems: 'center', marginHorizontal: 15, }}>
                                    {((new Date().getTime() - parseInt(this.state.horaEmbarque))/60000) < 5 ?
                                    <Text style={{ fontSize: 14, color: colors.RED, fontFamily: 'Inter-Bold', textAlign: 'center' }}>Você será punido caso queira cancelar, aguarde os 5 min</Text>
                                    :
                                    <Text style={{ fontSize: 14, color: colors.BLACK, fontFamily: 'Inter-Bold', textAlign: 'center' }}>Você não será punido caso queira cancelar</Text>
                                    }
                                </View>
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

                <Animatable.View animation={this.state.viewInfos ? 'slideInUp' : 'slideInDown'} style={styles.viewMap}>
                    <MapView
                        ref={map => { this.map = map }}
                        style={styles.map}
                        rotateEnabled={false}
                        provider={PROVIDER_GOOGLE}
                        showsUserLocation={false}
                        showsCompass={false}
                        showsScale={false}
                        loadingEnabled
                        showsMyLocationButton={false}
                        region={this.checkMap()}
                    >
                        {/* O RABO DE SETA ESTAVA AQUI, PROBLEMA ENCONTRADO DO MODO PRODUÇÃO, MARKER NO AIRMAP */}

                        <Marker.Animated
                            coordinate={{ latitude: this.state.region ? this.state.region.latitude : 0.00, longitude: this.state.region ? this.state.region.longitude : 0.00 }}
                            style={{ transform: [{ rotate: this.state.region.angle + "deg" }] }}
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
                        {this.state.coords ?
                            <MapView.Polyline
                                coordinates={this.state.coords}
                                strokeWidth={4}
                                strokeColor={colors.DEEPBLUE}
                            />
                            : null}
                    </MapView>
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
                    <TouchableOpacity style={styles.iconeNav} onPress={() => { this.handleGetDirections() }}>
                        <Icon
                            name="navigation"
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
                            {((new Date().getTime() - parseInt(this.state.horaEmbarque))/60000) < 5 ?
                                <Text style={styles.txtAlert}>Informamos ao passageiro de sua chegada, aguarde 5 min.</Text>
                                :
                                <Text style={styles.txtAlert2}>Passageiro atrasado, cancelamento sem punição.</Text>
                            }
                        </Animatable.View>
                        : null}
                </Animatable.View>

                {/* MODAL DOS DETALHES AQUI */}

                <Animatable.View animation={this.state.viewInfos ? 'slideInUp' : 'slideInDown'} style={[styles.viewDetails, { flex: this.state.viewInfos ? 1.5 : 0.4 }]}>

                    <View style={styles.viewPhotoName}>
                        <View style={styles.viewPhoto}>
                            <Image source={this.state.rideDetails.imageRider ? { uri: this.state.rideDetails.imageRider } : require('../../assets/images/profilePic.png')} style={styles.fotoPassageiro} />
                            <Text style={styles.nomePassageiro}>{this.state.rideDetails.firstNameRider}</Text>
                        </View>
                        <View style={{ position: 'absolute',top: -25, right: 5, left: 0, bottom: 0 }}>
                            <View style={{ height: 55, width: 55, borderRadius: 100, backgroundColor: colors.WHITE, elevation: 2, alignItems: 'center', alignSelf: 'center', justifyContent: 'center' }}>
                                {this.state.viewInfos ?
                                    <TouchableOpacity
                                        style={{height: 55, width: 55, borderRadius: 100, justifyContent: 'center', alignItems: 'center'}}
                                        onPress={() => this.setState({ viewInfos: false })}
                                    >
                                        <Icon
                                            name='arrow-down'
                                            type='feather'
                                            size={32}
                                            color={colors.BLACK}
                                        />     
                                    </TouchableOpacity>
                                    :
                                    <TouchableOpacity
                                        style={{height: 55, width: 55, borderRadius: 100, justifyContent: 'center', alignItems: 'center'}}
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
                        <View style={{ marginRight: 10,justifyContent: 'center', backgroundColor: colors.GREY1, height: 25, paddingHorizontal: 15, borderRadius: 15 }}>
                            <Animatable.Text animation='fadeIn' useNativeDriver={true} style={{ fontFamily: 'Inter-Bold', fontSize: 14, color: colors.BLACK }}>{parseFloat(this.state.kmRestante).toFixed(2)} KM</Animatable.Text>
                        </View>    
                    </View>

                    {this.state.viewInfos ?
                        <View style={styles.viewEndereco}>
                            <View style={styles.viewPartidaEndereco}>
                                <View style={{ width: 8, height: 8, borderRadius: 8, backgroundColor: colors.DEEPBLUE, marginRight: 5, marginLeft: 5 }}></View>
                                <Text style={styles.TxtEnderecoPartida}>{this.state.rideDetails.pickup.add}</Text>
                            </View>
                            <View style={styles.viewDestinoEndereco}>
                                <View style={{ width: 8, height: 8, borderRadius: 8, backgroundColor: colors.RED, marginRight: 5, marginLeft: 5 }}></View>
                                <Text style={styles.TxtEnderecoDestino}>{this.state.rideDetails.drop.add}</Text>
                            </View>
                        </View>
                        : null}

                    {this.state.viewInfos ?
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
                        </View>
                        : null}
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
                </Animatable.View>
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
    },

    viewPartidaEndereco: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 10,
    },

    TxtEnderecoPartida: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 12,
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
        fontSize: 12,
        color: colors.BLACK
    },

    viewIcones: {
        flex: 1.5,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.WHITE,
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

    iconeChat:{
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