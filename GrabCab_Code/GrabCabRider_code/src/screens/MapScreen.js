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
import { Colors } from 'react-native/Libraries/NewAppScreen';
import { Marker } from 'react-native-maps';

export default class MapScreen extends React.Component {
    bonusAmmount = 0;
    //   allCabs = '';
    constructor(props) {
        super(props);
        this._isMounted = false;
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
            //carType: "",
            allRiders: [],
            passData: {
                droplatitude: 0,
                droplongitude: 0,
                droptext: "",
                whereText: "",
                wherelatitude: 0,
                wherelongitude: 0,
                //carType: '',
            },
            allCars: [],
            nearby: [],
            mainCarTypes: [],
            //checkCallLocation: '',
            freeCars: [],
            settings: {
                symbol: '',
                code: '',
                cash: false,
                wallet: false
            },
            selected: 'drop',
            geolocationFetchComplete: false,
            checkPrepareDrivers: null,
        }
    }

    async UNSAFE_componentWillMount() {
        if (Platform.OS === 'android' && !Constants.default.isDevice) {
            this.setState({
                errorMessage: 'Oops, this will not work on Sketch in an Android emulator. Try it on your device!',
            });
        } else {
            if (!this.props.navigation.state.params) {
                this._getLocationAsync();
            }
        }

        this.setState({ checkPrepareDrivers: true })

        let searchObj = await this.props.navigation.getParam('searchObj') ? this.props.navigation.getParam('searchObj') : null;
        let allCarsParam = await this.props.navigation.getParam('allCars') ? this.props.navigation.getParam('allCars') : null;
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
                    }, () => {
                        this.getDrivers();
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
                        this.getDrivers();
                    })
                    this.allCarsData();
                    this.onPressModal();
                    this.onPressBook()
                }
            }
        }
        this.allCarsData();
        this.onPressModal();
    }

    componentDidMount() {
        this._isMounted = true;
        this._retrieveSettings();

        console.log("SETANDO INTERVALO")
        this.setState({
            intervalGetDrivers: setInterval(() => {
                if (this.state.passData && this.state.passData.wherelatitude) {
                    this.getDrivers();
                }
            }, 10000)
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

    _retrieveSettings = async () => {
        try {
            const value = await AsyncStorage.getItem('settings');
            if (value !== null) {
                this.setState({ settings: JSON.parse(value) }, () => {
                    //console.log("Settings", this.state.settings);
                });
            }
        } catch (error) {
            //console.log("Asyncstorage issue 9");
        }
    };

    componentWillUnmount() {
        this._isMounted = false;
        console.log(" DEU CLEAR ")
        //clearInterval(this.state.intervalGetDrivers)
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
                                <Text style={{ color: "#000", fontSize: 16, }}>{languageJSON.driver_finding_alert}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        )
    }


    _getLocationAsync = async () => {
        let { status } = await Permissions.askAsync(Permissions.LOCATION);
        if (status !== 'granted') {
            alert("Para acessar sua localização, é necessária permissão!");
        } else {
            this.setState({ loadingModal: true });
        }
        let location = await Location.getCurrentPositionAsync({ enableHighAccuracy: true, maximumAge: 1000, timeout: 2000, });
        if (location) {
            var pos = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            };
            var curuser = firebase.auth().currentUser.uid;

            if (pos) {
                if (this.state.passData.wherelatitude == 0) {

                    let latlng = pos.latitude + ',' + pos.longitude;
                    fetch('https://maps.googleapis.com/maps/api/geocode/json?latlng=' + latlng + '&key=' + google_map_key)
                        .then((response) => response.json())
                        .then((responseJson) => {
                            this.setState({
                                whereText: responseJson.results[0].formatted_address,
                                region: {
                                    latitude: pos.latitude,
                                    longitude: pos.longitude,
                                    latitudeDelta: 0.0143,
                                    longitudeDelta: 0.0134,
                                    loadingModal: false
                                },
                                geolocationFetchComplete: true
                            }, () => {
                                let obj = {}
                                obj = this.state.passData;
                                obj.wherelatitude = pos.latitude
                                obj.wherelongitude = pos.longitude
                                obj.whereText = responseJson.results[0].formatted_address;
                                this.setState({
                                    passData: obj,
                                    checkPrepareDrivers: true
                                    //checkCallLocation: 'navigation',
                                })
                                this.getDrivers();
                                firebase.database().ref('users/' + curuser + '/location').update({
                                    add: responseJson.results[0].formatted_address,
                                    lat: pos.latitude,
                                    lng: pos.longitude
                                })
                            });
                        })
                        .catch((error) => {
                            console.error(error);
                        });
                } else {

                    let obj = {}
                    obj = this.state.passData;
                    obj.wherelatitude = pos.latitude
                    obj.wherelongitude = pos.longitude
                    obj.whereText = this.state.passData.whereText;
                    this.setState({
                        passData: obj,
                        checkPrepareDrivers: true
                        //checkCallLocation: 'navigation',
                    })
                    this.getDrivers();
                    firebase.database().ref('users/' + curuser + '/location').update({
                        lat: pos.latitude,
                        lng: pos.longitude
                    })
                }


            }
        }
    }

    //Go to confirm booking page
    onPressBook() {
        let driver_available = false;
        if ((this.state.passData.whereText == "" || this.state.passData.wherelatitude == 0 || this.state.passData.wherelongitude == 0) && (this.state.passData.dropText == "" || this.state.passData.droplatitude == 0 || this.state.passData.droplongitude == 0)) {
            alert(languageJSON.pickup_and_drop_location_blank_error)
        } else {
            if (this.state.passData.whereText == "" || this.state.passData.wherelatitude == 0 || this.state.passData.wherelongitude == 0) {
                alert(languageJSON.pickup_location_blank_error)
            } else if (this.state.passData.dropText == "" || this.state.passData.droplatitude == 0 || this.state.passData.droplongitude == 0) {
                alert(languageJSON.drop_location_blank_error)
            } else {
                // this.setState({ checkPrepareDrivers: false })
                driver_available = true;
            }
            if (driver_available) {
                this.props.navigation.navigate('FareDetails', { data: this.state.passData, minTimeEconomico: this.state.minTimeEco, minTimeConfort: this.state.minTimeCon });
            } else {
                // alert(languageJSON.no_driver_found_alert_messege);
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


    async getDrivers() {
        const userData = firebase.database().ref('users/');

        userData.once('value', userData => {
            if (userData.val()) {
                let allUsers = userData.val();
                //(allUsers);
                if (this.state.checkPrepareDrivers) {
                    this.prepareDrivers(allUsers);
                }
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

    /*
       Alert.alert(
           languageJSON.no_driver_found_alert_title,
           languageJSON.no_driver_found_alert_messege,
           [
               {
                   text: languageJSON.no_driver_found_alert_OK_button,
                   onPress: () => this.setState({ loadingModal: false }),
               },
               { text: languageJSON.no_driver_found_alert_TRY_AGAIN_button, onPress: () => { this._getLocationAsync() }, style: 'cancel', },
           ],
           { cancelable: true },
       )
    */

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
        //this.setState({ checkPrepareDrivers: false })
        if (selection == 'drop') {
            this.props.navigation.navigate('Search', { from: "drop", whereText: this.state.whereText, dropText: this.state.dropText, old: this.state.passData, allCars: this.state.allCars ? this.state.allCars : null });
        } else if (selection == 'pickup') {
            this.setState({ selected: "pickup" })
            this.props.navigation.navigate('Search', { from: "where", whereText: this.state.whereText, dropText: this.state.dropText, old: this.state.passData, allCars: this.state.allCars ? this.state.allCars : null });
        }
    };

    /*onRegionChangeComplete = (region) => {
        Geocoder.from({
            latitude: region.latitude,
            longitude: region.longitude
        }).then(json => {
            var addressComponent = json.results[0].formatted_address;
            if (this.state.selected == 'pickup') {
                this.setState({
                    region: region,
                    whereText: addressComponent,
                    passData: {
                        droplatitude: this.state.passData.droplatitude,
                        droplongitude: this.state.passData.droplongitude,
                        droptext: this.state.passData.droptext,
                        whereText: addressComponent,
                        wherelatitude: region.latitude,
                        wherelongitude: region.longitude,
                        carType: this.state.passData.carType,
                        carImage: this.state.passData.carImage
                    },
                    carType: this.state.carType,
                    checkCallLocation: 'moveMarker',
                    geolocationFetchComplete: true
                });
            } else {
                this.setState({
                    region: region,
                    dropText: addressComponent,
                    passData: {
                        droplatitude: region.latitude,
                        droplongitude: region.longitude,
                        droptext: addressComponent,
                        whereText: this.state.passData.whereText,
                        wherelatitude: this.state.passData.wherelatitude,
                        wherelongitude: this.state.passData.wherelongitude,
                        carType: this.state.passData.carType,
                        carImage: this.state.passData.carImage
                    },
                    carType: this.state.carType,
                    checkCallLocation: 'moveMarker',
                    geolocationFetchComplete: true
                });
            }
        })
            .catch(error => console.warn(error));
    }*/

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
                            pickup={this.state.selected == 'pickup' ? this.state.region : null}
                        />
                        : null}
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
                    <View style={styles.viewStyleTop}>

                        <View style={styles.inputPickup}>
                            <TouchableOpacity onPress={() => this.tapAddress('pickup')} style={styles.contentStyle}>
                                <View style={styles.textIconStyle}>
                                    <Icon
                                        name='gps-fixed'
                                        color={colors.GREY2}
                                        size={15}
                                        containerStyle={{ flex: 1, bottom: 7, left: 6 }}
                                    />
                                    <Text numberOfLines={1} style={[styles.textStylePickup, { fontSize: 13, color: colors.GREY2 }]}>{this.state.whereText}</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
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
                </View>

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
        height: height,
        width: width,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute'
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
        marginHorizontal: 40,
        borderRadius: 30,
        elevation: 10,
        height: 51,
        justifyContent: 'center',
        top: -25,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowOffset: { x: 0, y: 0 },
        shadowRadius: 15,
    },
    inputPickup: {
        backgroundColor: colors.GREY.secondary,
        marginHorizontal: 40,
        borderTopRightRadius: 30,
        borderTopLeftRadius: 30,
        elevation: 0,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowOffset: { x: 0, y: 0 },
        shadowRadius: 15,
        height: 70,
        justifyContent: 'center',
        borderColor: colors.GREY.primary
    },
    iconMenuStyle: {
        marginLeft: 6,
        marginBottom: 5,
    },
    viewStyleTop: {
        position: 'absolute',
        //top: Platform.select({ ios: 60, android: 40 }),
        marginHorizontal: 12,
        width: width,
        bottom: 0,
        marginBottom: 30
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
        left: 15,
        top: 40,
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
    compViewStyle: {
        flex: 1,
        bottom: 0,
        width: width,
        height: height / 3,
        position: 'absolute',
        alignItems: 'center',
        backgroundColor: colors.WHITE
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
    btnChamar: {
        position: 'absolute',
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.DEEPBLUE,
        height: 50,
        bottom: 50,
        marginHorizontal: 0,
        left: 20,
        right: 20,
        borderRadius: 15,
        elevation: 5,
    },
    cancelButtonStyle: {
        backgroundColor: "#edede8",
        elevation: 0,
        width: "60%",
        borderRadius: 5,
        alignSelf: "center"
    }

});