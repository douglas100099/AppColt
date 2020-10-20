import React, { Fragment } from 'react';
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
import { TouchableOpacity } from 'react-native-gesture-handler';
import { MapComponent } from '../components';
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
import distanceCalc from '../common/distanceCalc';
import { v4 as uuidv4 } from 'uuid';

export default class MapScreen extends React.Component {
    _isMounted = false;
    bonusAmmount = 0;
    constructor(props) {
        super(props);
        Geocoder.init(google_map_key);
        this.state = {
            loadingModal: false,
            giftModal: false,
            location: null,
            errorMessage: null,
            openModal: false,
            region: {
                latitude: 0,
                longitude: 0,
                latitudeDelta: 0.0143,
                longitudeDelta: 0.0134,
            },
            whereText: languageJSON.map_screen_where_input_text,
            dropText: languageJSON.map_screen_drop_input_text,
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
            selected: '',
            updateFromText: true,
            geolocationFetchComplete: false,
        }
    }

    async UNSAFE_componentWillMount() {

        console.log(uuidv4())
        if (Platform.OS === 'android' && !Constants.default.isDevice) {
            this.setState({
                errorMessage: 'Ops, isso não funciona com Sketch no emulador Android. Tente usar em seu dispositivo!'
            });
        } else {
            if (!this.props.navigation.state.params) {

                this.getLocationUser();
                this.getNameUser();
                //this._getLocationAsync();
            }
        }

        let searchObj = await this.props.navigation.getParam('searchObj') ? this.props.navigation.getParam('searchObj') : null;
        let allCarsParam = await this.props.navigation.getParam('allCars') ? this.props.navigation.getParam('allCars') : null;
        let pinSearch = await this.props.navigation.getParam('pinSearch') ? this.props.navigation.getParam('pinSearch') : null;

        var minTimeEco;
        var minTimeCon;
        if (allCarsParam != null) {
            for (key in allCarsParam) {
                if (key == 0) {
                    minTimeEco = allCarsParam[key].minTime != '' ? allCarsParam[key].minTime : null
                } else if (key == 1) {
                    minTimeCon = allCarsParam[key].minTime != '' ? allCarsParam[key].minTime : null
                }
            }
        }

        if (searchObj) {
            if (searchObj.searchFrom == 'where') {
                if (searchObj.searchDetails) {
                    this.setState({
                        region: {
                            latitude: searchObj.searchDetails.geometry.location.lat,
                            longitude: searchObj.searchDetails.geometry.location.lng,
                            latitudeDelta: 0.0143,
                            longitudeDelta: 0.0134,
                        },
                        whereText: searchObj.whereText,
                        dropText: searchObj.dropText,
                        passData: this.props.navigation.getParam('old'),
                        selected: 'pickup',
                        geolocationFetchComplete: true,
                        minTimeEco: minTimeEco,
                        minTimeCon: minTimeCon,
                        dropText: languageJSON.map_screen_drop_input_text,
                        updateFromText: false,
                        pinSearch: pinSearch
                    }, () => {
                        this.getDrivers()
                    })
                }
            } else if (searchObj.searchFrom == 'drop') {
                if (searchObj.searchDetails) {

                    this.setState({
                        region: {
                            latitude: searchObj.searchDetails.geometry.location.lat,
                            longitude: searchObj.searchDetails.geometry.location.lng,
                            latitudeDelta: 0.0143,
                            longitudeDelta: 0.0134,
                        },
                        whereText: searchObj.whereText,
                        dropText: searchObj.dropText,
                        passData: this.props.navigation.getParam('old'),
                        selected: 'drop',
                        geolocationFetchComplete: true,
                        minTimeEco: minTimeEco,
                        minTimeCon: minTimeCon,
                    }, () => {
                        this.getDrivers()
                    })

                    this.allCarsData();
                    this.onPressModal();

                    this.goToFareScreen()
                }
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
                if (this.state.updateFromText) {
                    this.setState({
                        whereText: loc.add,
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
                    })
                }
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
                this.getLocationUser();
                if (this.state.passData && this.state.passData.wherelatitude) {
                    this.getDrivers();
                }
            }
        }, 5000)
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
        console.log("PREPARE DRIVERS")
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
                    console.log("DISTANCIA " + distance)
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
            loadingModal: false,
            nearby: availableDrivers,
            freeCars: freeCars,
        });
    }

    componentWillUnmount() {
        clearInterval(this.intervalGetDrivers)
        this._isMounted = false;
        console.log(" -------DESMONTOU-------- ")
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
                    <View style={{ width: '85%', backgroundColor: "#DBD7D9", borderRadius: 10, flex: 1, maxHeight: 70 }}>
                        <View style={{ alignItems: 'center', flexDirection: 'row', flex: 1, justifyContent: "center" }}>
                            <Image
                                style={{ width: 80, height: 80, backgroundColor: colors.TRANSPARENT }}
                                source={require('../../assets/images/loader.gif')}
                            />
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: "#000", fontSize: 16, }}>Carregando sua localização, aguarde...</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        )
    }

    _retrieveSettings = async () => {
        try {
            const value = await AsyncStorage.getItem('settings');
            if (value !== null) {
                this.setState({ settings: JSON.parse(value) }, () => {
                });
            }
        } catch (error) {
            //console.log("Asyncstorage issue 9");
        }
    };

    //Vai pra pagina de confirmaçao
    goToFareScreen() {
        if ((this.state.passData.whereText == "" || this.state.passData.wherelatitude == 0 || this.state.passData.wherelongitude == 0) && (this.state.passData.dropText == "" || this.state.passData.droplatitude == 0 || this.state.passData.droplongitude == 0)) {
            alert(languageJSON.pickup_and_drop_location_blank_error)
        } else {
            if (this.state.passData.whereText == "" || this.state.passData.wherelatitude == 0 || this.state.passData.wherelongitude == 0) {
                alert(languageJSON.pickup_location_blank_error)
            } else if (this.state.passData.dropText == "" || this.state.passData.droplatitude == 0 || this.state.passData.droplongitude == 0) {
                alert(languageJSON.drop_location_blank_error)
            } else {
                this.props.navigation.replace('FareDetails', { data: this.state.passData, minTimeEconomico: this.state.minTimeEco, minTimeConfort: this.state.minTimeCon });
            }
        }
    }

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

    onPressCancel() {
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
                                <Text style={{ color: "#000", fontSize: 16, marginTop: 12, textAlign: "center" }}>{languageJSON.refferal_bonus_messege_text} {this.state.settings.code}{this.bonusAmmount}</Text>
                            </View>
                            <View style={styles.buttonContainer}>
                                <Button
                                    title={languageJSON.no_driver_found_alert_OK_button}
                                    loading={false}
                                    titleStyle={styles.buttonTitleText}
                                    onPress={() => { this.onPressCancel() }}
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

    getNameUser(){
        var curuser = firebase.auth().currentUser.uid;
        const userRoot = firebase.database().ref('users/' + curuser);
        userRoot.once('value', userData => {
            if (userData.val()) {
                this.setState({
                    nameUser: userData.val().firstName
                })
            }})
    }

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
        if (selection == 'drop') {
            this.props.navigation.navigate('Search', { from: "drop",  whereText: this.state.whereText, dropText: this.state.dropText, old: this.state.passData, allCars: this.state.allCars ? this.state.allCars : null });
        } 
    };


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
                            initialRegion={this.state.region}
                            pickup={this.state.pinSearch ? this.state.region : null}
                        />
                        :
                        <Modal
                            animationType="fade"
                            transparent={true}
                            visible={true}
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
                </View>

                {this.state.geolocationFetchComplete ?
                    <View style={styles.viewStyleTop}>
                        <Text style={{ marginHorizontal: 20, fontFamily: 'Inter-Bold', fontSize: 16, margin: 5 }}> Olá
                            <Text style={{ fontSize: 18 }}> {this.state.nameUser ? this.state.nameUser : null} </Text>, para onde vamos?
                        </Text>
                        <View style={styles.inputDrop}>
                            <TouchableOpacity onPress={() => this.tapAddress('drop')}>
                                <View style={styles.textIconStyle}>
                                    <Icon
                                        name='search'
                                        type='feather'
                                        color={colors.GREY.iconSecondary}
                                        size={18}
                                        containerStyle={{ flex: 1, left: 8, top: 3 }}
                                    />
                                    <Text numberOfLines={1} style={[styles.textStyleDrop, { fontSize: 17, color: colors.GREY.iconSecondary }]}>{this.state.dropText}</Text>
                                </View>
                            </TouchableOpacity>
                        </View>

                    </View>
                    : null}

                {
                    this.bonusModal()
                }
                {
                    this.loading()
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
        marginHorizontal: 20,
        borderRadius: 10,
        height: 51,
        justifyContent: 'center',
        elevation: 10,
        shadowColor: colors.GREY2,
        shadowOpacity: 0.4,
        shadowOffset: { x: 0, y: 0 },
        shadowRadius: 15,
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
        flex: 1
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
        left: 20,
        top: 55,
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
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row'
    },
    textStyleDrop: {
        flex: 9,
        fontFamily: 'Inter-Medium',
        fontWeight: '400',
        color: colors.BLACK,
        left: 9,
        top: 3,
        marginTop: 10,
        marginBottom: 10,
        marginEnd: 15,
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
        color: colors.GREY.default,
        fontFamily: 'Inter-Medium',
        fontSize: 20,
        alignSelf: 'flex-end'
    },
    cancelButtonStyle: {
        backgroundColor: "#edede8",
        elevation: 0,
        width: "60%",
        borderRadius: 5,
        alignSelf: "center"
    }

});