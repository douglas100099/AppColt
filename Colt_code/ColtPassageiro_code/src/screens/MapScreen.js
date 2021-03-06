import React from 'react';
import {
    StyleSheet,
    View,
    Image,
    Dimensions,
    Text,
    Platform,
    Alert,
    Modal,
    AsyncStorage,
} from 'react-native';
import { TouchableOpacity, TouchableWithoutFeedback } from 'react-native-gesture-handler';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import mapStyleAndroid from '../../mapStyleAndroid.json';

import { Icon, Button, Avatar } from 'react-native-elements';
import { colors } from '../common/theme';

import * as Constants from 'expo-constants';
import * as Location from 'expo-location';
import * as Permissions from 'expo-permissions';
var { height, width } = Dimensions.get('window');
import * as firebase from 'firebase'
import { google_map_key } from '../common/key';
import languageJSON from '../common/language';
import Geocoder from 'react-native-geocoding';
import { NavigationActions, StackActions } from 'react-navigation';
import { Chase, Pulse } from 'react-native-animated-spinkit'

import LocationUser from '../../assets/svg/LocationUser';
import IconCarMap from '../../assets/svg/IconCarMap';

const LATITUDE = 0;
const LONGITUDE = 0;
const LATITUDE_DELTA = 0.0143;
const LONGITUDE_DELTA = 0.0134;

export default class MapScreen extends React.Component {
    _isMounted = false;
    bonusAmmount = 0;
    constructor(props) {
        super(props);
        Geocoder.init(google_map_key);
        this.state = {
            giftModal: false,
            errorMessage: null,
            openModal: false,
            region: {
                latitude: LATITUDE,
                longitude: LONGITUDE,
                latitudeDelta: LATITUDE_DELTA,
                longitudeDelta: LONGITUDE_DELTA,
            },
            backgroundColor: colors.WHITE,
            allRiders: [],
            passData: {
                droplatitude: 0,
                droplongitude: 0,
                droptext: "",
                whereText: "",
                wherelatitude: 0,
                wherelongitude: 0,
            },
            freeCars: [],
            settings: {
                symbol: '',
                code: '',
                cash: false,
                wallet: false
            },
            dontAnimateRegion: false,
            geolocationFetchComplete: false,
            haveBooking: false
        }
        this.viewWidth = 30
        this.viewHeight = 30
    }

    async UNSAFE_componentWillMount() {
        if (Platform.OS === 'android' && !Constants.default.isDevice) {
            this.setState({
                errorMessage: 'Ops, isso n??o funciona com Sketch no emulador Android. Tente usar em seu dispositivo!'
            });
        }

        this.getLocationDB();
        this.getNameUser();
        this.getSavedLocations()

        //this.allCarsData();
        this.onPressModal();
    }

    getLocationDB() {
        const userLocation = firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/location');

        userLocation.on('value', location => {
            if (location.val()) {
                let loc = location.val();

                if (this.state.region.lat != loc.lat || this.state.region.longitude != loc.lng) {
                    let region = {
                        latitude: loc.lat,
                        longitude: loc.lng,
                        latitudeDelta: 0.0143,
                        longitudeDelta: 0.0134,
                    }
                    if (this._isMounted && this.state.dontAnimateRegion == false) {
                        setTimeout(() => {
                            if (this._isMounted) {
                                this.mapView.animateToRegion(region, 500)
                            }
                        }, 1000)
                    }
                }

                this.setState({
                    region: {
                        latitude: loc.lat,
                        longitude: loc.lng,
                        latitudeDelta: 0.0143,
                        longitudeDelta: 0.0134,
                    },
                    geolocationFetchComplete: true
                }, () => {
                    let obj = {}
                    obj = this.state.passData;
                    obj.wherelatitude = loc.lat
                    obj.wherelongitude = loc.lng
                    obj.whereText = loc.add;
                    this.setState({
                        passData: obj,
                    })
                    this.getDrivers()
                })
            }

        })
        setTimeout(() => {
            if (!this.state.geolocationFetchComplete && this._isMounted) {
                Alert.alert(
                    'Alerta!',
                    'N??o foi poss??vel obter sua localiza????o atual!\nCertifique-se de ativar sua localiza????o e GPS!',
                    [
                        {
                            style: 'default',
                            text: 'Confirmar',
                            onPress: () => this.setState({ geolocationFetchComplete: true })
                        },
                    ],
                    { cancelable: true },
                );
                //this.setState({ geolocationFetchComplete: true })
            }
        }, 12000)
    }

    getSavedLocations() {
        firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/savedLocations').on('value', snap => {
            if (snap.val()) {
                let locationCasa = {}
                locationCasa.lat = snap.val().lat,
                    locationCasa.lng = snap.val().lng,
                    locationCasa.add = snap.val().add,

                    this.setState({
                        locationCasa: locationCasa
                    })
            } else {
                this.setState({
                    locationCasa: null
                })
            }
        })
    }

    componentDidMount() {
        this._isMounted = true;
        this._retrieveSettings();
        this.tripSatusCheck()

        this.intervalGetDrivers = setInterval(() => {
            if (this._isMounted) {
                if (this.state.passData && this.state.passData.wherelatitude) {
                    this.getDrivers();
                }
            }
        }, 7000)
    }


    getDrivers() {
        const userData = firebase.database().ref('/users').orderByChild("usertype").equalTo('driver')

        userData.once('value', userData => {
            if (userData.val()) {
                let allUsers = userData.val();
                this.prepareDrivers(allUsers);
            }
        })
    }

    async prepareDrivers(allUsers) {
        let freeCars = [];
        for (let key in allUsers) {
            let driver = allUsers[key];
            if (driver.approved == true && driver.queue == false && driver.driverActiveStatus == true) {
                if (driver.location) {
                    freeCars.push(driver);
                }
            }
        }

        this.setState({
            freeCars: freeCars,
        });
    }

    componentWillUnmount() {
        clearInterval(this.intervalGetDrivers)
        this._isMounted = false;
        console.log(" -------DESMONTOU-------- ")
    }

    _retrieveSettings = async () => {
        try {
            const value = await AsyncStorage.getItem('settings');
            if (value !== null) {
                this.setState({ settings: JSON.parse(value) }, () => {
                });
            }
        } catch (error) {
            console.log("Asyncstorage issue 9");
        }
    };

    onPressOk() {
        this.setState({
            giftModal: false
        })
    }

    bonusModal() {
        return (
            <Modal
                animationType="fade"
                transparent={true}
                visible={this.state.giftModal}
                onRequestClose={() => {
                    this.setState({ giftModal: false })
                }}
            >
                <View style={{ flex: 1, backgroundColor: "rgba(22,22,22,0.8)", justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{ width: '80%', backgroundColor: "#fffcf3", borderRadius: 10, justifyContent: 'center', alignItems: 'center', flex: 1, maxHeight: 325 }}>
                        <View style={{ marginTop: 0, alignItems: "center" }}>
                            <Avatar
                                rounded
                                size={200}
                                source={require('../../assets/images/gift.gif')}
                                containerStyle={{ width: 200, height: 200, marginTop: 0, alignSelf: "center", position: "relative" }}
                            />
                            <Text style={{ color: "#0cab03", fontSize: 28, textAlign: "center", position: "absolute", marginTop: 170 }}>{languageJSON.congratulation}</Text>
                            <View>
                                <Text style={{ color: "#000", fontSize: 16, marginTop: 12, textAlign: "center" }}>Voc?? ganhou R${this.bonusAmmount},00 na sua carteira Colt. Aproveite!</Text>
                            </View>
                            <View style={styles.buttonContainer}>
                                <Button
                                    title={languageJSON.no_driver_found_alert_OK_button}
                                    loading={false}
                                    titleStyle={styles.buttonTitleText}
                                    onPress={() => { this.onPressOk() }}
                                    buttonStyle={styles.cancelButtonStyle}
                                    containerStyle={{ marginTop: 20 }}
                                />
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        );
    }

    loadingLocationModal() {
        return (
            <Modal
                animationType="fade"
                transparent={true}
                visible={this.state.geolocationFetchComplete == false && this.state.giftModal == false}
            >
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.WHITE }}>

                    <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                        <Pulse
                            size={150}
                            color={colors.DEEPBLUE}
                        />
                        <LocationUser
                            width={41}
                            height={40}
                            style={{
                                position: 'absolute',
                                shadowColor: '#000',
                                shadowOffset: { x: 0, y: 5 },
                                shadowOpacity: 0.1,
                                shadowRadius: 5,
                            }}
                        />
                    </View>
                    <View style={styles.viewTextLoading}>
                        <Text style={styles.textLoading}>Carregando sua localiza????o, aguarde...</Text>
                    </View>
                </View>
            </Modal>

        )
    }

    getNameUser() {
        const userRoot = firebase.database().ref('users/' + firebase.auth().currentUser.uid);
        userRoot.once('value', userData => {
            if (userData.val()) {
                this.setState({
                    nameUser: userData.val().firstName,
                    haveBooking: userData.val()['my-booking'] ? true : false
                })
            }
        })
    }

    //Verifica????o de cadastro via referal ID
    onPressModal() {
        const userRoot = firebase.database().ref('users/' + firebase.auth().currentUser.uid);
        userRoot.once('value', userData => {
            if (userData.val()) {
                if (userData.val().refferalId == undefined) {
                    let name = userData.val().firstName ? userData.val().firstName.toLowerCase() : '';
                    name = name.replace(' ', '')
                    if (name.length > 5) {
                        name = name.split('')
                        name = name[0] + name[1] + name[2]
                    }
                    let uniqueNo = Math.floor(Math.random() * 9000) + 1000;
                    let refId = name + uniqueNo;
                    userRoot.update({
                        refferalId: refId,
                        walletBalance: 0,
                    }).then(() => {
                        /*if (userData.val().signupViaReferral == true) {
                            firebase.database().ref('referral/bonus').once('value', referal => {
                                if (referal.val()) {
                                    this.bonusAmmount = referal.val().amount;
                                    userRoot.update({
                                        walletBalance: this.bonusAmmount
                                    }).then(() => {
                                        this.setState({
                                            giftModal: true
                                        })
                                    })
                                }
                            })
                        }*/
                    })
                }
            }
        })
    }

    tapAddress = () => {
        if (!this.state.statusCorrida) {
            this.setState({ dontAnimateRegion: true })
            this.props.navigation.navigate('Search', { old: this.state.passData });
        } else {
            alert("Voc?? j?? possui uma corrida em andamento")
        }
    }

    goToFareByMap() {
        if (this.state.statusCorrida) {
            alert("Voc?? j?? possui uma corrida em andamento!")
        } else {

            let dataDetails = {}
            var minTimeEco = null
            var minTimeCon = null

            dataDetails.droplatitude = this.state.locationCasa.lat
            dataDetails.droplongitude = this.state.locationCasa.lng
            dataDetails.droptext = this.state.locationCasa.add

            dataDetails.wherelatitude = this.state.passData.wherelatitude
            dataDetails.wherelongitude = this.state.passData.wherelongitude
            dataDetails.whereText = this.state.passData.whereText

            this.props.navigation.navigate('FareDetails', { data: dataDetails, minTimeEconomico: minTimeEco, minTimeConfort: minTimeCon });
        }
    }

    redirectRider() {
        this.getNameUser();
        if (this.state.statusCorrida === 'ACCEPTED') {
            let obj = {
                bokkingId: this.state.bookingParam.bookingKey,
                coords: this.state.bookingParam.coords,
            }
            this.props
                .navigation
                .dispatch(StackActions.reset({
                    index: 0,
                    actions: [
                        NavigationActions.navigate({
                            routeName: 'BookedCab',
                            params: { passData: obj, byMapScreen: true },
                        }),
                    ],
                }))
        }
        else if (this.state.statusCorrida === 'EMBARQUE') {
            let obj = {
                bokkingId: this.state.bookingParam.bookingKey,
                coords: this.state.bookingParam.coords,
            }
            this.props
                .navigation
                .dispatch(StackActions.reset({
                    index: 0,
                    actions: [
                        NavigationActions.navigate({
                            routeName: 'BookedCab',
                            params: { passData: obj, byMapScreen: true },
                        }),
                    ],
                }))
        }
        else if (this.state.statusCorrida === 'NEW') {
            let obj = {
                bokkingId: this.state.bookingParam.bookingKey,
                coords: this.state.bookingParam.coords,
            }
            this.props
                .navigation
                .dispatch(StackActions.reset({
                    index: 0,
                    actions: [
                        NavigationActions.navigate({
                            routeName: 'BookedCab',
                            params: { passData: obj, byMapScreen: true },
                        }),
                    ],
                }))
        }
        else if (this.state.statusCorrida === 'START') {
            this.props.navigation.replace('trackRide', { data: this.state.bookingParam, bId: this.state.keyBooking });
        }
        else {
            alert("Essa corrida n??o est?? mais dispon??vel!")
        }
    }

    tripSatusCheck = () => {
        const userData = firebase.database().ref('users/' + firebase.auth().currentUser.uid);
        userData.on('value', userData => {
            if (userData.val()) {
                var data = userData.val()
                if (data['my-booking']) {
                    let bookingData = data['my-booking']
                    for (let key in bookingData) {
                        bookingData[key].bookingKey = key

                        if (bookingData[key].status === "ACCEPTED") {
                            this.setState({
                                statusCorrida: "ACCEPTED",
                                bookingParam: bookingData[key],
                                keyBooking: key
                            })
                        }
                        else if (bookingData[key].status === "EMBARQUE") {
                            this.setState({
                                statusCorrida: "EMBARQUE",
                                bookingParam: bookingData[key],
                                keyBooking: key
                            })
                        }
                        else if (bookingData[key].status === "START") {
                            this.setState({
                                statusCorrida: "START",
                                bookingParam: bookingData[key],
                                keyBooking: key
                            })
                        }
                        else if (bookingData[key].status === "CANCELLED") {
                            this.setState({
                                statusCorrida: "",
                                bookingParam: null,
                                keyBooking: null
                            })
                        }
                        else if (bookingData[key].status === "NEW") {
                            this.setState({
                                statusCorrida: "NEW",
                                bookingParam: bookingData[key],
                                keyBooking: key
                            })
                        }
                    }
                }
            }
        })
    }


    animateToRegion() {
        this.mapView.animateToRegion(this.state.region, 200)
        setTimeout(() => {
            this.setState({ showsMyLocationBtn: false })
        }, 400)
    }

    _onMapChange = async () => {
        const {
            zoom,
            pitch,
            center,
            heading
        } = await this.mapView.getCamera();

        if (zoom <= 21 && zoom > 19) {
            this.viewWidth = 60,
                this.viewHeight = 60
        }
        else if (zoom <= 19 && zoom > 18) {
            this.viewWidth = 50,
                this.viewHeight = 50
        }
        else if (zoom <= 18 && zoom > 16) {
            this.viewWidth = 40,
                this.viewHeight = 40
        }
        else if (zoom <= 16 && zoom > 15) {
            this.viewWidth = 30,
                this.viewHeight = 30
        }
        else if (zoom <= 15 && zoom > 10) {
            this.viewWidth = 25,
                this.viewHeight = 25
        }
        else if (zoom <= 10 && zoom > 0) {
            this.viewWidth = 20,
                this.viewHeight = 20
        }
    }

    render() {
        return (
            <View style={styles.mainViewStyle}>
                <View style={styles.mapcontainer}>
                    {this.state.geolocationFetchComplete && this._isMounted ?
                        <MapView.Animated
                            provider={PROVIDER_GOOGLE}
                            showsUserLocation={true}
                            ref={(ref) => this.mapView = ref}
                            loadingEnabled
                            showsMyLocationButton={false}
                            style={styles.map}
                            initialRegion={this.state.region}
                            onRegionChange={() => { this.setState({ showsMyLocationBtn: true })/*, this._onMapChange()*/ }}
                            enablePoweredByContainer={false}
                            showsCompass={false}
                            showsScale={false}
                            rotateEnabled={false}
                            customMapStyle={mapStyleAndroid}
                        //region={() => this.getRegionMap()}
                        >
                            {this.state.freeCars ? this.state.freeCars.map((item, index) => {
                                return (
                                    <Marker.Animated
                                        coordinate={{ latitude: item.location ? item.location.lat : 0.00, longitude: item.location ? item.location.lng : 0.00 }}
                                        anchor={{ x: 0.5, y: 0.5 }}
                                        key={index}
                                    >
                                        <IconCarMap
                                            width={this.viewWidth}
                                            height={this.viewHeight}
                                            style={{
                                                transform: [{ rotate: item.location.angle + "deg" }],
                                                shadowColor: colors.BLACK,
                                                shadowOpacity: 0.2,
                                                shadowOffset: { x: 0.1, y: 0.1 },
                                                shadowRadius: 5,
                                                elevation: 3
                                            }}
                                        />
                                    </Marker.Animated>
                                )
                            })
                                : null}
                        </MapView.Animated>
                        :
                        null
                    }
                    {/* ICONE MENU */}
                    <View style={styles.bordaIconeMenu}>
                        <TouchableOpacity onPress={() => { this.props.navigation.toggleDrawer() }}>
                            <Icon
                                name='ios-list'
                                type='ionicon'
                                color={colors.BLACK}
                                size={30}
                            />
                        </TouchableOpacity>
                    </View>

                    {this.state.showsMyLocationBtn ?
                        <View style={styles.showsMyLocationBtn}>
                            <TouchableOpacity onPress={() => { this.animateToRegion() }}>
                                <Icon
                                    name='ios-locate'
                                    type='ionicon'
                                    color={colors.BLACK}
                                    size={27}
                                />
                            </TouchableOpacity>
                        </View>
                        : null}

                    {this.state.statusCorrida ?
                        <View style={styles.viewCorrida}>
                            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => { this.redirectRider() }}>
                                <Icon
                                    name='car'
                                    type='material-community'
                                    color={colors.GREY2}
                                    size={35}
                                    containerStyle={{ left: 10, opacity: 0.8 }}
                                />
                                {
                                    this.state.statusCorrida === 'NEW' ?
                                        <Text style={{ fontFamily: 'Inter-Bold', paddingEnd: 10, paddingStart: 15 }}> Voc?? est?? buscando um motorista </Text>
                                        :
                                        <Text style={{ fontFamily: 'Inter-Bold', paddingEnd: 10, paddingStart: 15 }}> Voc?? possui uma corrida em andamento </Text>
                                }
                            </TouchableOpacity>
                        </View>
                        : null}
                </View>

                {
                    this.state.geolocationFetchComplete ?
                        <View style={[styles.viewStyleTop, {
                            flex: this.state.locationCasa != null ? width < 375 ? 1.4 : 1.1 : width < 375 ? 1 : 0.7
                        }]}>
                            <View>
                                <Text style={{ marginHorizontal: 15, fontFamily: 'Inter-Bold', fontSize: width < 375 ? 13 : 15, margin: 10 }}> Ol??
                                <Text style={{ fontSize: width < 375 ? 17 : 18 }}> {this.state.nameUser ? this.state.nameUser : null}</Text>, que bom te ver{this.state.haveBooking ? ' novamente' : '!'}
                                </Text>
                                <TouchableWithoutFeedback style={{ height: 63 }} onPress={() => this.tapAddress()}>
                                    <View style={styles.inputDrop}>
                                        <View style={styles.textIconStyle}>
                                            <Icon
                                                name='search'
                                                type='feather'
                                                color={colors.DEEPBLUE}
                                                size={18}
                                                containerStyle={{ left: 10, opacity: 0.8 }}
                                            />
                                            <Text numberOfLines={1} style={[styles.textStyleDrop, { fontSize: 18, color: colors.GREY.iconSecondary }]}>Para onde vamos?</Text>
                                        </View>
                                    </View>
                                </TouchableWithoutFeedback>
                            </View>

                            {this.state.locationCasa != null ?
                                <TouchableOpacity onPress={() => this.goToFareByMap()}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', height: width < 375 ? 50 : 60, width: width }}>
                                        <View style={{ marginLeft: 20, marginRight: 0, width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 50, backgroundColor: colors.DEEPBLUE, }}>
                                            <Icon
                                                name='ios-home'
                                                type='ionicon'
                                                color={colors.WHITE}
                                                size={23}
                                            //containerStyle={{ opacity: 0.4 }}
                                            />
                                        </View>
                                        <View style={{ left: 12, flex: 2 }}>
                                            <Text style={{ fontFamily: 'Inter-Medium', fontSize: width < 375 ? 17 : 19 }}> Endere??o salvo </Text>
                                            <Text numberOfLines={1} style={{ paddingTop: 3, opacity: 0.4, maxWidth: width - 100, fontFamily: 'Inter-Medium', fontSize: width < 375 ? 13 : 14 }}>
                                                {this.state.locationCasa.add.split('-')[0] + '-' + this.state.locationCasa.add.split('-')[1]}
                                            </Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                                : null}
                        </View>
                        : null
                }
                {
                    this.loadingLocationModal()
                }
                {
                    this.bonusModal()
                }
            </View >
        );
    }
}

const styles = StyleSheet.create({
    mapcontainer: {
        flex: 3,
    },
    viewTextLoading: {
        marginTop: 10,
    },
    textLoading: {
        fontFamily: 'Inter-Bold',
        fontSize: 18,
        fontWeight: "600",
    },
    map: {
        flex: 1,
        ...StyleSheet.absoluteFillObject,
    },
    //VIEW PRINCIPAL
    mainViewStyle: {
        flex: 1,
        backgroundColor: colors.WHITE,
    },
    inputDrop: {
        backgroundColor: '#fff',
        marginHorizontal: 10,
        borderRadius: 6,
        height: 51,
        elevation: 2,
        justifyContent: 'center',
        shadowColor: colors.BLACK,
        shadowOpacity: 0.3,
        shadowOffset: { x: 0, y: 0 },
        shadowRadius: 2,
    },
    inputPickup: {
        backgroundColor: colors.GREY.secondary,
        elevation: 0,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowOffset: { x: 0, y: 0 },
        shadowRadius: 15,
        height: 40,
        justifyContent: 'center',
        marginHorizontal: 10,
        //flexDirection: 'row',
        borderColor: colors.GREY.primary,
        marginTop: 10,
    },
    iconMenuStyle: {
        marginLeft: 6,
        marginBottom: 5,
    },
    viewStyleTop: {
        backgroundColor: colors.WHITE,
        width: width,
    },
    viewCorrida: {
        flexDirection: 'row',
        alignItems: 'center',
        bottom: 50,
        left: 0,
        position: 'absolute',
        backgroundColor: colors.WHITE,
        borderTopRightRadius: 10,
        borderBottomRightRadius: 10,
        height: 55,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { x: 0, y: 0 },
        shadowRadius: 15,
    },
    showsMyLocationBtn: {
        width: 37,
        height: 37,
        right: 15,
        bottom: 15,
        position: 'absolute',
        alignItems: 'center',
        alignSelf: 'center',
        justifyContent: 'center',
        backgroundColor: colors.WHITE,
        borderRadius: 50,
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowOffset: { x: 0, y: 0 },
        shadowRadius: 15,
    },
    bordaIconeMenu: {
        width: 45,
        height: 45,
        left: width < 375 ? 15 : 20,
        top: Platform.OS == 'ios' ? 55 : 40,
        position: 'absolute',
        alignItems: 'center',
        alignSelf: 'center',
        justifyContent: 'center',
        backgroundColor: colors.WHITE,
        borderRadius: 50,
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowOffset: { x: 0, y: 0 },
        shadowRadius: 15,
    },
    coverViewStyle: {
        flex: 1.5,
        alignItems: 'center'
    },
    textGifSearch: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 15,
        color: '#000',
        opacity: 0.5,
    },
    viewStyle1: {
        height: 10,
        width: 10,
        borderRadius: 15 / 2,
        backgroundColor: colors.BLACK
    },
    viewStyle2: {
        height: height / 23,
        width: 0.5,
        backgroundColor: colors.BLACK
    },
    viewStyle3: {
        height: 13,
        width: 13,
        backgroundColor: colors.BLUE.light
    },
    contentStyle: {
        //flex: 1, 
        justifyContent: 'center',
    },
    textIconStyle: {
        // flex: 1, 

        alignItems: 'center',
        flexDirection: 'row'
    },
    textStyleDrop: {
        fontFamily: 'Inter-Medium',
        color: colors.BLACK,
        marginEnd: 10,
        opacity: 0.5,
        left: 15
    },
    textStylePickup: {
        flex: 9,
        fontFamily: 'Inter-Medium',
        fontSize: 30,
        fontWeight: '400',
        color: colors.BLACK,
        left: 7,
        bottom: 8,
        marginEnd: 15,
        marginTop: 10,
        marginBottom: 10
    },
    buttonContainer: {
        flex: 1
    },

    buttonTitleText: {
        color: colors.WHITE,
        fontFamily: 'Inter-Bold',
        fontSize: 20,
        alignSelf: 'flex-end'
    },
    cancelButtonStyle: {
        backgroundColor: colors.DEEPBLUE,
        elevation: 0,
        width: "60%",
        borderRadius: 5,
        alignSelf: "center"
    }

});