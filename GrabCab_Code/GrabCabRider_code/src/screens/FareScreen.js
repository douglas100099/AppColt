import React from 'react';
import {
    StyleSheet,
    View,
    Image,
    Dimensions,
    TouchableOpacity,
    Text,
    Modal,
    Platform,
    AsyncStorage,
    Alert,
    ScrollView,
    TouchableWithoutFeedback, TouchableHighlightBase
} from 'react-native';
import { Icon, Button, Header } from 'react-native-elements';
import Polyline from '@mapbox/polyline';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import { colors } from '../common/theme';
var { width, height } = Dimensions.get('window');
import * as firebase from 'firebase';
import { farehelper } from '../common/FareCalculator';
import distanceCalc from '../common/distanceCalc';
import { PromoComp } from "../components";
import { RequestPushMsg } from '../common/RequestPushMsg';
import { google_map_key } from '../common/key';
import languageJSON from '../common/language';
import { color } from 'react-native-reanimated';

export default class FareScreen extends React.Component {
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
                code: '',
                symbol: '',
                cash: false,
                wallet: false,
                otp_secure: false
            },
            buttonDisabled: false,
            carType: 'Colt econômico',
            carImage: "https://dev.exicube.com/images/car0.png",
            metodoPagamento: 'Dinheiro',
        }
    }

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
        this._isMounted = false;
    }

    async componentDidMount() {
        this._isMounted = true;
        var getCroods = await this.props.navigation.getParam('data');
        var minTimeEconomico = await this.props.navigation.getParam('minTimeEconomico');
        var minTimeConfort = await this.props.navigation.getParam('minTimeConfort');
        var arrayRates = [];

        const Data = firebase.database().ref('rates/');
        Data.once('value', rates => {
            if (rates.val()) {
                var carTypeWiseRate = rates.val();
                for (var i = 0; i < carTypeWiseRate.car_type.length; i++) {
                    var ratesObject = carTypeWiseRate.car_type[i]
                    arrayRates.push(ratesObject)
                }
                this.setState({
                    minTimeEconomico: minTimeEconomico,
                    minTimeConfort: minTimeConfort,
                    rateDetailsObjects: arrayRates,
                    region: getCroods,
                    curUID: firebase.auth().currentUser,
                }, () => {
                    this.getDirections('"' + this.state.region.wherelatitude + ', ' + this.state.region.wherelongitude + '"', '"' + this.state.region.droplatitude + ', ' + this.state.region.droplongitude + '"')
                    const userData = firebase.database().ref('users/' + this.state.curUID.uid);
                    userData.once('value', userData => {
                        this.setState({ userDetails: userData.val() });
                    })
                })

            }
        })

        this._retrieveSettings();
    }

    // FOR ROOT DIRECTIONS
    async getDirections(startLoc, destLoc) {
        try {
            var resp = await fetch(`https://maps.googleapis.com/maps/api/directions/json?origin=${startLoc}&destination=${destLoc}&key=${google_map_key}`)
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
                i == 0 ? this.setState({ estimatePrice1: detailsBooking.estimateFare, estimatedTimeBooking: detailsBooking.estimateTime }) : this.setState({ estimatePrice2: detailsBooking.estimateFare, estimatedTimeBooking: detailsBooking.estimateTime })
            }
            this.setState({
                detailsBooking: arrayDetails,
            })
            if (this.state.minTimeEconomico != null) {
                this.setState({
                    selected: 0,
                    estimateFare: this.state.detailsBooking[0].estimateFare,
                    distance: this.state.detailsBooking[0].distance,
                    carType: this.state.rateDetailsObjects[0].name,
                    carImage: this.state.rateDetailsObjects[0].image
                })
            } else if (this.minTimeConfort != null) {
                this.setState({
                    selected: 1,
                    estimateFare: this.state.detailsBooking[1].estimateFare,
                    distance: this.state.detailsBooking[1].distance,
                    carType: this.state.rateDetailsObjects[1].name,
                    carImage: this.state.rateDetailsObjects[1].image
                })
            }

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
                        edgePadding: { top: 50, right: 50, bottom: 80, left: 50 },
                        animated: true,
                    })
                }, 500);
            })

            return coords
        }
        catch (error) {

            if (error == "TypeError: Cannot read property 'legs' of undefined") {
                Alert.alert(
                    languageJSON.err,
                    languageJSON.route_not_found,
                    [
                        { text: languageJSON.no_driver_found_alert_OK_button, onPress: () => this.props.navigation.goBack() },
                    ],
                    { cancelable: false },
                );
            } else {
                Alert.alert(
                    languageJSON.err,
                    languageJSON.route_not_found,
                    [
                        { text: languageJSON.no_driver_found_alert_OK_button, onPress: () => this.props.navigation.goBack() },
                    ],
                    { cancelable: false },
                );
            }

            return error
        }
    }

    // on press Ride later
    onPressCancel() {
        this.setState({ buttonDisabled: false });
        this.props.navigation.goBack();
    }

    alertModal() {
        return (
            <Modal
                animationType="none"
                transparent={true}
                visible={this.state.alertModalVisible}
                onRequestClose={() => {
                    this.setState({ alertModalVisible: false })
                }}>
                <View style={styles.alertModalContainer}>
                    <View style={styles.alertModalInnerContainer}>

                        <View style={styles.alertContainer}>

                            <Text style={styles.rideCancelText}>{languageJSON.sorry}</Text>

                            <View style={styles.horizontalLLine} />

                            <View style={styles.msgContainer}>
                                <Text style={styles.cancelMsgText}>{languageJSON.multipleBooking}</Text>
                            </View>
                            <View style={styles.okButtonContainer}>
                                <Button
                                    title={languageJSON.no_driver_found_alert_OK_button}
                                    titleStyle={styles.signInTextStyle}
                                    onPress={() => {
                                        this.setState({ alertModalVisible: false, buttonDisabled: false }, () => { this.props.navigation.popToTop() })
                                    }}
                                    buttonStyle={styles.okButtonStyle}
                                    containerStyle={styles.okButtonContainerStyle}
                                />
                            </View>

                        </View>

                    </View>
                </View>

            </Modal>
        )
    }

    //CONFRIM BOOKING
    bookNow() {
        if (this.state.selected == 0 && this.state.minTimeEconomico == null) {
            alert("Não há motoristas disponíveis no momento!")
        } else if (this.state.selected == 1 && this.state.minTimeConfort == null) {
            alert("Não há motoristas disponíveis no momento!")
        }
        this.setState({ buttonDisabled: true });
        var curuser = firebase.auth().currentUser.uid;

        var pickUp = { lat: this.state.region.wherelatitude, lng: this.state.region.wherelongitude, add: this.state.region.whereText };
        var drop = { lat: this.state.region.droplatitude, lng: this.state.region.droplongitude, add: this.state.region.droptext };
        if (this.state.settings.otp_secure)
            var otp = Math.floor(Math.random() * 90000) + 10000;
        else {
            var otp = false;
        }
        let today = new Date().toString();

        var data = {
            carImage: this.state.carImage,
            carType: this.state.carType,
            customer: curuser,
            customer_name: this.state.userDetails.firstName + ' ' + this.state.userDetails.lastName,
            distance: this.state.distance,
            driver: "",
            driver_image: "",
            driver_name: "",
            drop: drop,
            pickup: pickUp,
            estimate: this.state.estimateFare,
            estimateDistance: this.state.distance,
            serviceType: 'pickUp',
            status: "NEW",
            total_trip_time: 0,
            trip_cost: 0,
            trip_end_time: "00:00",
            trip_start_time: "00:00",
            tripdate: today,
            estimate: this.state.estimateFare,
            otp: otp,
            bookingDate: today,

            metodoPagamento: this.state.metodoPagamento,
            imageRider: this.state.userDetails.profile_image ? this.state.userDetails.profile_image : null,
        }

        var MyBooking = {
            carImage: this.state.carImage,
            carType: this.state.carType,
            driver: "",
            driver_image: "",
            driver_name: "",
            drop: drop,
            pickup: pickUp,
            estimate: this.state.estimateFare,
            estimateDistance: this.state.distance,
            serviceType: 'pickUp',
            status: "NEW",
            total_trip_time: 0,
            trip_cost: 0,
            trip_end_time: "00:00",
            trip_start_time: "00:00",
            tripdate: today,
            estimate: this.state.estimateFare,
            coords: this.state.coords,
            otp: otp,
            bookingDate: today,

            metodoPagamento: this.state.metodoPagamento,
        }

        firebase.database().ref('bookings/').push(data).then((res) => {
            var bookingKey = res.key;
            firebase.database().ref('users/' + curuser + '/my-booking/' + bookingKey + '/').set(MyBooking).then((res) => {
                this.setState({ currentBookingId: bookingKey }, () => {
                    var arr = [];
                    const userData = firebase.database().ref('users/');
                    var driverUidnovo = 0;
                    var distancia = 10;
                    userData.once('value', driverData => {
                        if (driverData.val()) {
                            var allUsers = driverData.val();
                            for (key in allUsers) {
                                //checking if user is driver and it's a approved user and he/she is now free for take ride
                                if (allUsers[key].usertype == 'driver' && allUsers[key].approved == true && allUsers[key].queue == false && allUsers[key].driverActiveStatus == true) {
                                    if (allUsers[key].location) {
                                        var location1 = [this.state.region.wherelatitude, this.state.region.wherelongitude];// rider lat and lng
                                        var location2 = [allUsers[key].location.lat, allUsers[key].location.lng];//Driver lat and lang
                                        //calculate the distance of two locations
                                        var distance = distanceCalc(location1, location2);
                                        var originalDistance = (distance);
                                        if (originalDistance <= 5) { // Request will be send if distance less than 5 km 
                                            if (allUsers[key].carType == this.state.carType) {
                                                allUsers[key].driverUid = key;
                                                if (originalDistance < distancia) {
                                                    distancia = originalDistance
                                                    driverUidnovo = allUsers[key].driverUid
                                                }
                                            }
                                        }
                                    }
                                }
                            }

                            arr.push(driverUidnovo);
                            firebase.database().ref('users/' + driverUidnovo + '/waiting_riders_list/' + bookingKey + '/').set(data);
                            this.sendPushNotification(driverUidnovo, bookingKey, languageJSON.new_booking_request_push_notification)

                            let bookingData = {
                                bokkingId: bookingKey,
                                coords: this.state.coords,
                            }

                            setTimeout(() => {
                                if (arr.length > 0) {
                                    // set all requested drivers data to main booking node
                                    firebase.database().ref('bookings/' + bookingKey + '/').update({
                                        requestedDriver: arr
                                    }).then((res) => {
                                        this.setState({ buttonDisabled: false });
                                        this.props.navigation.navigate('BookedCab', { passData: bookingData, DriverRecent: driverUidnovo });
                                    })
                                } else {
                                    alert(languageJSON.driver_not_found);
                                }
                            }, 300)
                        }
                    })
                })
            })
        })
    }

    selectCarType(param, type) {
        if (type == 0) {
            if (param != null) {
                this.setState({ selected: 0, estimateFare: this.state.detailsBooking[0].estimateFare, distance: this.state.detailsBooking[0].distance, carType: this.state.rateDetailsObjects[0].name, carImage: this.state.rateDetailsObjects[0].image })
            } else {
                alert("Não há motoristas disponíveis no momento!")
            }
        } else if (type == 1) {
            if (param != null) {
                this.setState({ selected: 1, estimateFare: this.state.detailsBooking[1].estimateFare, distance: this.state.detailsBooking[1].distance, carType: this.state.rateDetailsObjects[1].name, carImage: this.state.rateDetailsObjects[1].image })
            } else {
                alert("Não há motoristas disponíveis no momento!")
            }
        }
    }

    addDetailsToPromo(offerkey, curUId) {
        const promoData = firebase.database().ref('offers/' + offerkey);
        promoData.once('value', promo => {
            if (promo.val()) {
                let promoData = promo.val();
                let user_avail = promoData.user_avail;
                if (user_avail) {
                    firebase.database().ref('offers/' + offerkey + '/user_avail/details').push({
                        userId: curUId
                    }).then(() => {
                        firebase.database().ref('offers/' + offerkey + '/user_avail/').update({ count: user_avail.count + 1 })
                    })
                } else {
                    firebase.database().ref('offers/' + offerkey + '/user_avail/details').push({
                        userId: curUId
                    }).then(() => {
                        firebase.database().ref('offers/' + offerkey + '/user_avail/').update({ count: 1 })
                    })
                }
            }
        })
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

    render() {
        return (
            <View style={styles.container}>
                <View style={styles.mapcontainer}>
                    {this.state.region && this.state.region.wherelatitude ?
                        <MapView
                            ref={map => { this.map = map }}
                            style={styles.map}
                            provider={PROVIDER_GOOGLE}
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
                            zoomControlEnabled={false}
                            zoomEnabled={false}
                        >
                            <Marker
                                coordinate={{ latitude: (this.state.region.wherelatitude), longitude: (this.state.region.wherelongitude) }}
                                title={this.state.region.whereText}
                                image={require('../../assets/images/markerUser.png')}
                                anchor={{ x: 0, y: 0 }}
                            >
                            </Marker>
                            <Marker
                                coordinate={{ latitude: (this.state.region.droplatitude), longitude: (this.state.region.droplongitude) }}
                                title={this.state.region.droptext}
                                anchor={{ x: 0, y: 0 }}
                                image={require('../../assets/images/marker.png')}
                            >
                            </Marker>

                            {this.state.coords ?
                                <MapView.Polyline
                                    coordinates={this.state.coords}
                                    strokeWidth={3}
                                    strokeColor={colors.DEEPBLUE}
                                />
                                : null}
                        </MapView>
                        : null}

                    <View style={styles.bordaIconeVoltar}>
                        <TouchableOpacity onPress={() => { this.props.navigation.goBack(); }}>
                            <Icon
                                name='chevron-left'
                                type='MaterialIcons'
                                size={35}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {this.state.rateDetailsObjects[0] && this.state.estimatePrice1 ?
                    <View style={styles.containerBottom}>
                        <View style={styles.cards}>
                            <View style={[styles.cardInfo,
                            {
                                borderWidth: this.state.selected == 0 ? 1 : 0,
                                borderColor: this.state.selected == 0 ? colors.DEEPBLUE : colors.GREY3,
                            }
                            ]} >
                                <TouchableOpacity style={styles.touchCard1} onPress={() => this.selectCarType(this.state.minTimeEconomico, 0)}>
                                    <Image
                                        style={[styles.carEconomico, { opacity: this.state.minTimeEconomico == null ? 0.2 : 1, }]}
                                        source={require('../../assets/images/coltEconomico.png')}
                                    />
                                    <Text style={[styles.textTypeCar, { opacity: this.state.minTimeEconomico == null ? 0.2 : 1, }]}>{this.state.rateDetailsObjects[0].name}</Text>
                                    <Text style={[styles.price1, { opacity: this.state.minTimeEconomico == null ? 0.2 : 1, }]}>{this.state.settings.symbol} <Text style={styles.price2}> {this.state.estimatePrice1} </Text></Text>
                                    <View style={[styles.timeBox, { width: this.state.minTimeEconomico == null ? 120 : 70 }]}>
                                        <Text style={styles.estimatedTime}>{this.state.minTimeEconomico == null ? 'Não disponível' : parseInt(this.state.minTimeEconomico / 60) + " min"} </Text>
                                    </View>
                                </TouchableOpacity>
                            </View>

                            <View style={[styles.cardInfo2,
                            {
                                borderWidth: this.state.selected == 1 ? 1 : 0,
                                borderColor: this.state.selected == 1 ? colors.DEEPBLUE : colors.GREY3,
                            }
                            ]} >
                                <TouchableOpacity style={styles.touchCard2} onPress={() => this.selectCarType(this.state.minTimeConfort, 1)}>
                                    <Image
                                        style={[styles.carEconomico, { opacity: this.state.minTimeConfort == null ? 0.2 : 1, }]}
                                        source={require('../../assets/images/coltConfort.png')}
                                    />
                                    <Text style={[styles.textTypeCar, { opacity: this.state.minTimeConfort == null ? 0.2 : 1, }]}>{this.state.rateDetailsObjects[1].name}</Text>
                                    <Text style={[styles.price1, { opacity: this.state.minTimeConfort == null ? 0.2 : 1, }]}>{this.state.settings.symbol} <Text style={styles.price2}>{this.state.estimatePrice2} </Text></Text>
                                    <View style={[styles.timeBox, { width: this.state.minTimeConfort == null ? 120 : 70 }]}>
                                        <Text style={styles.estimatedTime}>{this.state.minTimeConfort == null ? 'Não disponível' : parseInt(this.state.minTimeConfort / 60) + " min"} </Text>
                                    </View>
                                </TouchableOpacity>
                            </View>

                        </View>
                        <View style={styles.estimatedTimeBooking}>
                            <View style={styles.containerTempo}>
                                <Text style={styles.textEstimatedTime}>Tempo estimado </Text>
                                <Text style={styles.estimatedTimeNumber}>{parseInt(this.state.estimatedTimeBooking / 60)} min</Text>
                            </View>
                            <View style={styles.containerDinheiro}>
                                <TouchableOpacity style={styles.containerDinheiro} onPress={() => alert("Teste")}>
                                    <View style={styles.bordaIconeDinheiro}>
                                        <Icon
                                            name='dollar-sign'
                                            type='feather'
                                            size={17}
                                            color={colors.WHITE}
                                            containerStyle={styles.iconMetodoPagamento}
                                        />
                                    </View>
                                    <Text style={styles.metodoPagamento}> Dinheiro </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={styles.viewBotao}>
                            <Button
                                title={languageJSON.confrim_booking}
                                loading={false}
                                loadingProps={{ size: "large", color: colors.BLUE.default.primary }}
                                titleStyle={styles.buttonText}
                                disabled={this.state.buttonDisabled}
                                onPress={() => { this.bookNow() }}
                                buttonStyle={styles.confirmButtonStyle}
                            />
                        </View>
                    </View>
                    : null
                }

                {
                    this.alertModal()
                }
            </View>
        );
    }
}

const styles = StyleSheet.create({
    headerStyle: {
        backgroundColor: colors.GREY.default,
        borderBottomWidth: 0
    },
    headerInnerStyle: {
        marginLeft: 10,
        marginRight: 10
    },
    headerTitleStyle: {
        color: colors.WHITE,
        fontFamily: 'Roboto-Bold',
        fontSize: 18
    },
    container: {
        flex: 1,
        //marginTop: StatusBar.currentHeight
    },
    topContainer: {
        flex: 1,
        flexDirection: 'row',
        borderTopWidth: 0,
        alignItems: 'center',
        backgroundColor: colors.WHITE,
        paddingEnd: 10,
        paddingBottom: 3,
        paddingTop: 3,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowOffset: { x: 0, y: 0 },
        shadowRadius: 15,
        borderRadius: 20,
        marginHorizontal: 12,
        elevation: 20,
    },
    iconContainer: {
        flex: 1
    },
    mapcontainer: {
        flex: 2,
        top: 0,
        width: width,
        height: (height - 300),
        justifyContent: 'center',
        //alignItems: 'center',
    },
    bordaIconeVoltar: {
        position: 'absolute',
        top: 0,
        backgroundColor: colors.WHITE,
        width: 35,
        height: 35,
        borderRadius: 50,
        elevation: 5,
        marginTop: 40,
        justifyContent: 'center',
        alignItems: 'center',
        left: 15,
        shadowColor: '#000',
        shadowOffset: { x: 0, y: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    map: {
        flex: 1,
        ...StyleSheet.absoluteFillObject,
    },
    offerContainer: {
        flex: 1,
        backgroundColor: colors.YELLOW.secondary,
        width: width,
        justifyContent: 'center',
        borderBottomColor: colors.YELLOW.primary,
        borderBottomWidth: Platform.OS == 'ios' ? 1 : 0
    },
    offerText: {
        alignSelf: 'center',
        color: colors.GREY.btnPrimary,
        fontSize: 12,
        fontFamily: 'Roboto-Regular'
    },
    offerCodeText: {
        fontFamily: 'Roboto-Bold',
        fontSize: 14,
    },
    priceDetailsContainer: {
        flex: 2.3,
        backgroundColor: colors.WHITE,
        flexDirection: 'row',
        position: 'relative',
        zIndex: 1
    },
    priceDetailsLeft: {
        flex: 19
    },
    priceDetailsMiddle: {
        flex: 2,
        height: 50,
        width: 1,
        alignItems: 'center'
    },
    priceDetails: {
        flex: 1,
        flexDirection: 'row'
    },
    totalFareContainer: {
        flex: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center'
    },
    totalFareText: {
        color: colors.GREY.btnPrimary,
        fontFamily: 'Roboto-Bold',
        fontSize: 15,
        marginLeft: 40
    },
    infoIcon: {
        flex: 2,
        alignItems: 'center',
        justifyContent: 'center'
    },
    priceText: {
        alignSelf: 'center',
        color: colors.GREY.iconSecondary,
        fontFamily: 'Roboto-Bold',
        fontSize: 20
    },
    logoContainer: {
        flex: 19,
        alignItems: 'center',
        justifyContent: 'center'
    },
    containerBottom: {
        width: width,
        shadowColor: '#000',
        shadowOffset: { x: 0, y: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        backgroundColor: colors.WHITE,
        elevation: 5,
        flex: 1.3,
        alignSelf: 'center',
    },
    viewBotao: {
        paddingTop: 5
    },
    confirmButtonStyle: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.DEEPBLUE,
        height: 50,
        marginHorizontal: 30,
        borderRadius: 30,
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.5,
        shadowOffset: { x: 0, y: 5 },
        shadowRadius: 15,
    },
    estimatedTimeBooking: {
        paddingBottom: 10,
        paddingTop: 10,
        flexDirection: 'row',
        marginHorizontal: 50,
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
    bordaIconeDinheiro: {
        width: 22,
        height: 22,
        backgroundColor: colors.GREEN.light,
        opacity: 0.6,
        borderRadius: 50,
        left: 0,
        justifyContent: 'center'
    },
    iconMetodoPagamento: {
    },
    textEstimatedTime: {
        color: colors.GREY1,
        fontFamily: 'Inter-Bold',
        fontSize: 15,
        left: 0
    },
    estimatedTimeNumber: {
        fontSize: 16,
        fontFamily: 'Inter-Bold',
        color: colors.DEEPBLUE
    },
    metodoPagamento: {
        fontFamily: 'Inter-Regular',
        fontSize: 17,
        color: colors.BLACK,
        marginLeft: 0
    },
    cards: {
        backgroundColor: colors.WHITE,
        justifyContent: 'space-between',
        flexDirection: 'row',
        marginHorizontal: 50,
    },
    buttonText: {
        color: colors.WHITE,
        fontFamily: 'Roboto-Bold',
        fontSize: 17,
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
        top: 6,
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowOffset: { x: 0, y: 5 },
        shadowRadius: 15,
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
        right: 0,
        elevation: 4,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowOffset: { x: 0, y: 5 },
        shadowRadius: 15,
    },
    carEconomico: {
        marginHorizontal: 20,
        top: 0,
        width: 80,
        height: 60
    },
    estimatedTime: {
        top: 0,
        fontFamily: 'Inter-Bold',
        opacity: 0.8,
        left: 0,
        color: colors.WHITE,
    },
    timeBox: {
        top: 14,
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
        fontSize: 13,
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
        fontFamily: 'Inter-Light',
    },

    /////////////////
    modalImage: {
        width: 90,
        height: 90,
    },
    modalInnerContainer: {
        height: 400,
        width: (width - 85),
        backgroundColor: colors.WHITE,
        alignItems: 'center',
        alignSelf: 'center',
        borderRadius: 7,
        overflow: 'visible'
    },
    buttonContainer: {
        flex: 0.5,
        width: ((width - 85)),
        flexDirection: 'row',
        backgroundColor: colors.GREY.iconSecondary,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center'
    },
    signInTextStyle: {
        fontFamily: 'Roboto-Bold',
        fontWeight: "700",
        color: colors.WHITE
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
        fontFamily: 'Roboto-Bold',
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
        fontFamily: 'Roboto-Regular',
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
});
