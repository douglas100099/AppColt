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
import { MapComponent } from '../components';
import { Icon, Button, Avatar } from 'react-native-elements';
import { colors } from '../common/theme';

import * as Constants from 'expo-constants';
import * as Location from 'expo-location';
import { getPixelSize } from '../common/utils';
import * as Permissions from 'expo-permissions';
var { height, width } = Dimensions.get('window');
import * as firebase from 'firebase'
import { google_map_key } from '../common/key';
import languageJSON from '../common/language';
import Geocoder from 'react-native-geocoding';
import distanceCalc from '../common/distanceCalc';


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
                latitude: 0,
                longitude: 0,
                latitudeDelta: 0.0143,
                longitudeDelta: 0.0134,
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
            allCars: [],
            nearby: [],
            mainCarTypes: [],
            freeCars: [],
            settings: {
                symbol: '',
                code: '',
                cash: false,
                wallet: false
            },
            geolocationFetchComplete: true,
        }
    }

    async UNSAFE_componentWillMount() {
        if (Platform.OS === 'android' && !Constants.default.isDevice) {
            this.setState({
                errorMessage: 'Ops, isso não funciona com Sketch no emulador Android. Tente usar em seu dispositivo!'
            });
        } else {
            if (!this.props.navigation.state.params) {

                this.getLocationUser();
                this.getNameUser();
                this.getSavedLocations()
                //this._getLocationAsync();
            }
        }

        this.allCarsData();
        this.onPressModal();
    }

    getLocationUser() {
        var curuser = firebase.auth().currentUser.uid;
        const userLocation = firebase.database().ref('users/' + curuser + '/location');

        userLocation.once('value', location => {
            if (location.val()) {
                let loc = location.val();

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
            else {
                setTimeout(() =>{
                    this.getLocationUser()
                },500)
            }
        })
    }

    getSavedLocations() {
        var curuser = firebase.auth().currentUser.uid;
        firebase.database().ref('users/' + curuser + '/savedLocations').on('value', snap => {
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

    allCarsData() {
        const cars = firebase.database().ref('rates/car_type');
        cars.once('value', allCars => {
            if (allCars.val()) {
                let cars = allCars.val()
                let arr = [];
                for (key in cars) {
                    cars[key].minTime = ''
                    cars[key].available = true;
                    cars[key].active = false;
                    arr.push(cars[key]);
                }
                this.setState({ mainCarTypes: arr });
            }
        })
    }

    componentDidMount() {
        this._isMounted = true;
        this._retrieveSettings();

        this.intervalGetDrivers = setInterval(() => {
            if (this._isMounted) {
                //this.getLocationUser();
                if (this.state.passData && this.state.passData.wherelatitude) {
                    this.getDrivers();
                }
            }
        }, 7000)
    }

    getDrivers() {
        const userData = firebase.database().ref('users/');

        userData.once('value', userData => {
            if (userData.val()) {
                let allUsers = userData.val();

                this.prepareDrivers(allUsers);
            }
        })
    }

    async prepareDrivers(allUsers) {
        let availableDrivers = [];
        let freeCars = []; //Only for Ukraine Project
        let arr = {};
        let riderLocation = [this.state.passData.wherelatitude, this.state.passData.wherelongitude];
        let startLoc = '"' + this.state.passData.wherelatitude + ', ' + this.state.passData.wherelongitude + '"';
        for (let key in allUsers) {
            let driver = allUsers[key];
            if ((driver.usertype) && (driver.usertype == 'driver') && (driver.approved == true) && (driver.queue == false) && (driver.driverActiveStatus == true)) {
                if (driver.location) {
                    let driverLocation = [driver.location.lat, driver.location.lng];
                    let distance = distanceCalc(riderLocation, driverLocation);
                    freeCars.push(driver);
                    if (distance < 5) {
                        let destLoc = '"' + driver.location.lat + ', ' + driver.location.lng + '"';
                        let carType = driver.carType;
                        driver.arriveDistance = distance;
                        driver.arriveTime = await this.getDriverTime(startLoc, destLoc);

                        if (arr[carType] && arr[carType].drivers) {
                            arr[carType].drivers.push(driver);
                            if (arr[carType].minDistance > distance) {
                                arr[carType].minDistance = distance;
                                arr[carType].minTime = driver.arriveTime.time_in_secs;
                            }
                        } else {
                            arr[carType] = {};
                            arr[carType].drivers = [];
                            arr[carType].drivers.push(driver);
                            arr[carType].minDistance = distance;
                            arr[carType].minTime = driver.arriveTime.time_in_secs;
                        }
                        availableDrivers.push(driver);
                    }
                }
            }
        }

        const allCars = this.state.mainCarTypes.slice();

        for (let i = 0; i < allCars.length; i++) {
            if (arr[allCars[i].name]) {
                allCars[i].nearbyData = arr[allCars[i].name].drivers;
                allCars[i].minTime = arr[allCars[i].name].minTime;
                allCars[i].available = true;
            } else {
                allCars[i].minTime = '';
                allCars[i].available = false;
            }
            allCars[i].active = this.state.passData.carType == allCars[i].name ? true : false;
        }

        this.setState({
            allCars: allCars,
            nearby: availableDrivers,
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

    getDriverTime(startLoc, destLoc) {
        console.log("GET DRIVERS TIME")
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
                                <Text style={{ color: "#000", fontSize: 16, marginTop: 12, textAlign: "center" }}>Você ganhou R${this.bonusAmmount},00 na sua carteira Colt. Aproveite!</Text>
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

    loadingLocationModal(){
        return(
            <Modal
            animationType="fade"
            transparent={true}
            visible={this.state.geolocationFetchComplete == false && this.state.giftModal == false}
        >
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.WHITE }}>

                <Image
                    style={{ width: 150, height: 150, backgroundColor: colors.TRANSPARENT }}
                    source={require('../../assets/images/loading.gif')}
                />
                <View style={styles.viewTextLoading}>
                    <Text style={styles.textLoading}>Carregando sua localização, aguarde...</Text>
                </View>
            </View>
        </Modal>

        )
    }

    getNameUser() {
        var curuser = firebase.auth().currentUser.uid;
        const userRoot = firebase.database().ref('users/' + curuser);
        userRoot.once('value', userData => {
            if (userData.val()) {
                this.setState({
                    nameUser: userData.val().firstName
                })
            }
        })
    }

    //Verificação de cadastro via referal ID
    onPressModal() {
        var curuser = firebase.auth().currentUser.uid;
        const userRoot = firebase.database().ref('users/' + curuser);
        userRoot.once('value', userData => {
            if (userData.val()) {
                if (userData.val().refferalId == undefined) {
                    let name = userData.val().firstName ? userData.val().firstName.toLowerCase() : '';
                    let uniqueNo = Math.floor(Math.random() * 9000) + 1000;
                    let refId = name + uniqueNo;
                    userRoot.update({
                        refferalId: refId,
                        walletBalance: 0,
                    }).then(() => {
                        if (userData.val().signupViaReferral == true) {
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
                        }
                    })
                }
            }
        })
    }

    tapAddress = (selection) => {
        this.props.navigation.navigate('Search', { old: this.state.passData, allCars: this.state.allCars ? this.state.allCars : null });
    };

    goToFareByMap() {
        let dataDetails = {}
        var minTimeEco = null
        var minTimeCon = null

        dataDetails.droplatitude = this.state.locationCasa.lat
        dataDetails.droplongitude = this.state.locationCasa.lng
        dataDetails.droptext = this.state.locationCasa.add

        dataDetails.wherelatitude = this.state.passData.wherelatitude
        dataDetails.wherelongitude = this.state.passData.wherelongitude
        dataDetails.whereText = this.state.passData.whereText

        if (this.state.allCars != null) {
            for (key in this.state.allCars) {
                if (key == 0) {
                    minTimeEco = this.state.allCars[key].minTime != '' ? this.state.allCars[key].minTime : null
                } else if (key == 1) {
                    minTimeCon = this.state.allCars[key].minTime != '' ? this.state.allCars[key].minTime : null
                }
            }
        }

        this.props.navigation.replace('FareDetails', { data: dataDetails, minTimeEconomico: minTimeEco, minTimeConfort: minTimeCon });
    }

    
    showLocationUser(){
        this.mapView.fitToCoordinates([{ latitude: this.state.region.wherelatitude, longitude: this.state.region.wherelongitude }, { latitude: this.state.region.droplatitude, longitude: this.state.region.droplongitude }], {
            edgePadding: { top: getPixelSize(50), right: getPixelSize(50), bottom: getPixelSize(50), left: getPixelSize(50) },
            animated: true,
        })
    }

    render() {
        return (
            <View style={styles.mainViewStyle}>
                <View style={styles.mapcontainer}>
                    {this.state.geolocationFetchComplete ?
                        <MapComponent
                            ref={(ref) => this.mapView = ref}
                            markerRef={marker => { this.marker = marker; }}
                            mapStyle={styles.map}
                            mapRegion={this.state.region}
                            nearby={this.state.freeCars}
                            //initialRegion={this.state.region}
                        />
                        :
                        null
                    }
                    {/* ICONE MENU */}
                    <View style={styles.bordaIconeMenu}>
                        <TouchableOpacity onPress={() => { this.props.navigation.toggleDrawer() }}>
                            <Icon
                                name='dehaze'
                                type='material'
                                color={colors.BLACK}
                                size={23}
                            />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.bordaIconeMenu2}>
                        <TouchableOpacity onPress={() => { this.showLocationUser() }}>
                            <Icon
                                name='dehaze'
                                type='material'
                                color={colors.BLACK}
                                size={23}
                            />
                        </TouchableOpacity>
                    </View>
                    
                </View>

                {this.state.geolocationFetchComplete ?
                    <View style={[styles.viewStyleTop, {
                        flex: this.state.locationCasa != null ? width < 375 ? 1.4 : 1.1 : width < 375 ? 1 : 0.7
                    }]}>
                        <View>
                            <Text style={{ marginHorizontal: 15, fontFamily: 'Inter-Bold', fontSize: width < 375 ? 13 : 15, margin: 10 }}> Olá
                            <Text style={{ fontSize: width < 375 ? 17 : 18 }}> {this.state.nameUser ? this.state.nameUser : null}</Text>, que bom te ver novamente.
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
                                    <View style={{ left: 12, flex: 0.2 }}>
                                        <Icon
                                            name='ios-home'
                                            type='ionicon'
                                            color={colors.GREY2}
                                            size={25}
                                            containerStyle={{ opacity: 0.4 }}
                                        />
                                    </View>
                                    <View style={{ left: 12, flex: 2 }}>
                                        <Text style={{ fontFamily: 'Inter-Medium', fontSize: width < 375 ? 17 : 19 }}> Casa </Text>
                                        <Text numberOfLines={1} style={{ paddingTop: 3, opacity: 0.4, maxWidth: width - 60, fontFamily: 'Inter-Medium', fontSize: width < 375 ? 13 : 14 }}> {this.state.locationCasa.add.split('-')[0]} </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                            : null}
                    </View>
                    : null}
                {
                    this.loadingLocationModal()
                }
                {
                    this.bonusModal()
                }
            </View>
        );
    }
}

const styles = StyleSheet.create({
    mapcontainer: {
        justifyContent: 'center',
        alignItems: 'center',
        flex: 3,
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
        //top: Platform.select({ ios: 60, android: 40 }),
        width: width,
    },
    bordaIconeMenu2: {
        width: 37,
        height: 37,
        left: 200,
        top: 40,
        position: 'absolute',
        alignItems: 'center',
        alignSelf: 'center',
        justifyContent: 'center',
        backgroundColor: colors.DEEPBLUE,
        borderRadius: 50,
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowOffset: { x: 0, y: 0 },
        shadowRadius: 15,
    },
    bordaIconeMenu: {
        width: 37,
        height: 37,
        left: width < 375 ? 10 : 20,
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