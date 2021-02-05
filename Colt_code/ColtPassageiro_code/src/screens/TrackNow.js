import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    Alert,
    TouchableOpacity,
    Platform,
    Linking,
    Dimensions,
    Image
} from 'react-native';
import { Icon } from 'react-native-elements';
import haversine from "haversine";
import MapView, {
    Marker,
    AnimatedRegion,
    PROVIDER_GOOGLE
} from "react-native-maps";
import { colors } from '../common/theme';
import Polyline from '@mapbox/polyline';
var { width, height } = Dimensions.get('window');
import { getPixelSize } from '../common/utils';
import * as firebase from 'firebase';
import { google_map_key } from '../common/key';
import mapStyleJson from '../../mapStyle.json';
import mapStyleAndroid from '../../mapStyleAndroid.json';
import languageJSON from '../common/language';

import LocationUser from '../../assets/svg/LocationUser';
import LocationDrop from '../../assets/svg/LocationDrop';
import LocationWaypoint from '../../assets/svg/LocationWaypoint';

import ColtEconomicoCar from '../../assets/svg/ColtEconomicoCar';
import ColtConfortCar from '../../assets/svg/ColtConfortCar';
import AvatarUser from '../../assets/svg/AvatarUser';
import IconCarMap from '../../assets/svg/IconCarMap';
import CircleLineTriangle from '../../assets/svg/CircleLineTriangle';

export default class TrackNow extends React.Component {
    myAbort = new AbortController()

    constructor(props) {
        super(props);
        this._isMounted = true
        this.state = {
            latitude: null,
            longitude: null,
            routeCoordinates: [],
            distanceTravelled: 0,
            prevLatLng: {},
            coordinate: null,
            fitCoord: true,
            dontGetRegion: false
        };
    }

    async UNSAFE_componentWillMount() {
        let bookingKey = this.props.navigation.getParam('bId');
        let paramData = this.props.navigation.getParam('data');
        if (bookingKey && paramData)
            this.setState({ bookingKey: bookingKey, allData: paramData, destinationLoc: paramData.drop.lat + ',' + paramData.drop.lng })
    }

    async componentDidMount() {
        this._isMounted = true

        const dat = firebase.database().ref('bookings/' + this.state.bookingKey + '/current');
        dat.on('value', snapshot => {
            var data = snapshot.val()
            if (data) {
                let data = snapshot.val();
                this.setState({
                    angle: data.angle,
                    latitudeDriver: data.lat,
                    longitudeDriver: data.lng,
                    startLoc: data.lat + ',' + data.lng,
                }, () => {
                    if (!this.state.dontGetDirections) {
                        this.setState({ dontGetDirections: true })
                        this.getDirections()
                    }
                })
            }
        })

        const coordinate = new AnimatedRegion({
            latitude: this.state.allData.pickup.lat,
            longitude: this.state.allData.pickup.lng,
            latitudeDelta: 0.009,
            longitudeDelta: 0.009
        });

        this.watchID = navigator.geolocation.watchPosition(
            position => {
                const { routeCoordinates, distanceTravelled } = this.state;
                const { latitude, longitude } = position.coords;

                const newCoordinate = {
                    latitude,
                    longitude
                };

                coordinate.timing(newCoordinate, {
                    useNativeDriver: true,
                }).start();

                this.setState({
                    latitude,
                    longitude,
                    routeCoordinates: routeCoordinates.concat([newCoordinate]),
                    distanceTravelled: this.state.distanceTravelled + this.calcDistance(newCoordinate),
                    prevLatLng: newCoordinate
                }, () => {
                    this.getDirections();
                });
            },
            error => console.log(error),
            {
                enableHighAccuracy: true,
                timeout: 20000,
                maximumAge: 1000,
                distanceFilter: 150
            }
        );
    }

    componentWillUnmount() {
        this._isMounted = false
        navigator.geolocation.clearWatch(this.watchID);
    }

    calcDistance = newLatLng => {
        const { prevLatLng } = this.state;
        return haversine(prevLatLng, newLatLng) || 0;
    };

    getMapRegion = () => ({
        latitude: this.state.latitude,
        longitude: this.state.longitude,
        latitudeDelta: 0.0143,
        longitudeDelta: 0.0134
    });

    async getDirections() {
        try {
            if (this.state.allData.waypoint) {
                let waypoint = '"' + this.state.allData.waypoint.lat + ',' + this.state.allData.waypoint.lng + '"'
                var resp = await fetch(`https://maps.googleapis.com/maps/api/directions/json?origin=${this.state.startLoc}&destination=${this.state.destinationLoc}&waypoints=${waypoint}&key=${google_map_key}`, { signal: this.myAbort.signal })
            } else {
                var resp = await fetch(`https://maps.googleapis.com/maps/api/directions/json?origin=${this.state.startLoc}&destination=${this.state.destinationLoc}&key=${google_map_key}`)
            }
            let respJson = await resp.json();
            let points = Polyline.decode(respJson.routes[0].overview_polyline.points);
            let coords = points.map((point, index) => {
                return {
                    latitude: point[0],
                    longitude: point[1]
                }
            })
            this.setState({ coords: coords }, () => {
                if (this.state.fitCoord) {
                    this.setState({ fitCoord: false })
                    setTimeout(() => {
                        this.map.fitToCoordinates([{ latitude: this.state.allData.pickup.lat, longitude: this.state.allData.pickup.lng }, { latitude: this.state.allData.drop.lat, longitude: this.state.allData.drop.lng }], {
                            edgePadding: { top: getPixelSize(60), right: getPixelSize(60), bottom: getPixelSize(60), left: getPixelSize(60) },
                            animated: true,
                        })
                    }, 500);
                }
            })
            return coords
        }
        catch (error) {
            console.log(error)
            return error
        }
    }

    fitCoordinates() {
        this.map.fitToCoordinates([{ latitude: this.state.latitudeDriver, longitude: this.state.longitudeDriver }, { latitude: this.state.allData.drop.lat, longitude: this.state.allData.drop.lng }], {
            edgePadding: { top: getPixelSize(60), right: getPixelSize(60), bottom: getPixelSize(60), left: getPixelSize(60) },
            animated: true,
        })
    }

    fitUser() {
        let region = {
            latitude: this.state.latitudeDriver,
            longitude: this.state.longitudeDriver,
            latitudeDelta: 0.0043,
            longitudeDelta: 0.0034
        }
        if (this.map) {
            this.map.animateToRegion(region, 500)
        }
    }

    fitWaypoint() {
        this.map.fitToCoordinates([{ latitude: this.state.latitudeDriver, longitude: this.state.longitudeDriver }, { latitude: this.state.allData.waypoint.lat, longitude: this.state.allData.waypoint.lng }], {
            edgePadding: { top: getPixelSize(75), right: getPixelSize(75), bottom: getPixelSize(75), left: getPixelSize(75) },
            animated: true,
        })
    }

    alertPanic() {
        Alert.alert(
            languageJSON.panic_text,
            languageJSON.panic_question,
            [
                {
                    text: languageJSON.cancel,
                    onPress: () => console.log('Cancel Pressed'),
                    style: 'cancel'
                },
                {
                    text: 'OK', onPress: async () => {
                        if (Platform.OS === 'android') {
                            phoneNumber = `tel:190`
                        } else {
                            phoneNumber = `telprompt:190`
                        }
                        Linking.openURL(phoneNumber)
                    }
                }
            ],
            { cancelable: false }
        )
    }

    render() {
        return (

            <View style={styles.container}>
                <View style={styles.innerContainer}>
                    {this.state.latitude ?
                        <MapView
                            ref={map => { this.map = map }}
                            style={styles.map}
                            provider={PROVIDER_GOOGLE}
                            showUserLocation
                            followUserLocation
                            loadingEnabled
                            initialRegion={this.getMapRegion()}
                            //onRegionChange={() => this.setState({ dontGetRegion: true })}
                            showsCompass={false}
                            showsScale={false}
                            customMapStyle={mapStyleAndroid}
                            rotateEnabled={false}
                        >

                            {this.state.coords ?
                                <MapView.Polyline
                                    coordinates={this.state.coords}
                                    strokeWidth={3}
                                    strokeColor={colors.DEEPBLUE}
                                />
                                : null}

                            <Marker.Animated
                                ref={marker => {
                                    this.marker = marker;
                                }}
                                useNativeDriver={false}
                                coordinate={
                                    this.state.latitudeDriver && this.state.longitudeDriver ?
                                        new AnimatedRegion({
                                            latitude: this.state.latitudeDriver,
                                            longitude: this.state.longitudeDriver,
                                            latitudeDelta: 0.009,
                                            longitudeDelta: 0.009
                                        })
                                        :
                                        null
                                }
                                anchor={{ x: 0.5, y: 0.5 }}
                            >
                                <IconCarMap
                                    width={40}
                                    height={40}
                                    style={{
                                        transform: [{ rotate: this.state.angle + "deg" }],
                                        shadowColor: colors.BLACK,
                                        shadowOpacity: 0.2,
                                        shadowOffset: { x: 0, y: 0 },
                                        shadowRadius: 5,
                                        elevation: 3
                                    }}
                                />
                            </Marker.Animated>

                            {/*{this.state.allData ?
                                <Marker
                                    //image={require('../../assets/images/markerUser.png')}
                                    coordinate={{ latitude: this.state.allData.pickup.lat, longitude: this.state.allData.pickup.lng }}
                                    anchor={{ x: 0, y: 0 }}
                                >
                                <LocationUser/>
                                </Marker>
                            : null}*/}
                            {this.state.allData ?
                                <Marker
                                    coordinate={{ latitude: this.state.allData.drop.lat, longitude: this.state.allData.drop.lng }}
                                    centerOffset={{ x: 0.1, y: 0.1 }}
                                    anchor={{ x: 0.1, y: 0.1 }}
                                >
                                    <LocationDrop />

                                    <View style={styles.locationBoxDestino}>
                                        <Text numberOfLines={1} style={styles.locationText}> {this.state.allData.drop.add.split(",", 2)} </Text>
                                    </View>
                                </Marker>
                                : null}

                            {
                                this.state.allData.waypoint ?
                                    <Marker
                                        coordinate={{ latitude: this.state.allData.waypoint.lat, longitude: this.state.allData.waypoint.lng }}
                                        centerOffset={{ x: 0.1, y: 0.1 }}
                                        anchor={{ x: 0.1, y: 0.1 }}
                                    >
                                        <LocationWaypoint />

                                        <View style={styles.locationBoxDestino}>
                                            <Text numberOfLines={1} style={styles.locationText}> {this.state.allData.waypoint.add} </Text>
                                        </View>
                                    </Marker>
                                    : null
                            }
                        </MapView>
                        : null}

                    <TouchableOpacity style={styles.btnPanico} onPress={() => this.alertPanic()} >
                        <Icon
                            name="ios-sad"
                            type="ionicon"
                            size={30}
                            color={colors.RED}
                            containerStyle={{ opacity: .7 }}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.btnFitCoord} onPress={() => this.fitCoordinates()}>
                        <Icon
                            name='git-pull-request'
                            type='feather'
                            size={25}
                            color={colors.DARK}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.btnFitLocation} onPress={() => this.fitUser()}>
                        <Icon
                            name="car"
                            type="material-community"
                            size={25}
                            color={colors.DARK}
                        />
                    </TouchableOpacity>

                    {this.state.allData.waypoint ?
                        <TouchableOpacity style={styles.btnFitWaypoint} onPress={() => this.fitWaypoint()}>
                            <Icon
                                name="ios-navigate"
                                type="ionicon"
                                size={25}
                                color={colors.YELLOW.primary}
                            />
                        </TouchableOpacity>
                        : null}

                    <View style={{ position: 'absolute', alignSelf: 'center', top: Platform.OS == 'ios' ? 50 : 35, borderColor: colors.DEEPBLUE, borderWidth: 2, borderRadius: 5, height: 30, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ color: colors.DEEPBLUE, fontSize: 17, paddingHorizontal: 10, fontFamily: 'Inter-ExtraBold' }}> A caminho do seu destino </Text>
                    </View>
                </View>

                {/* Modal inferior */}
                <View style={[styles.containerBottom, {
                    flex: this.state.allData.waypoint ? 4 : 3
                }]}>
                    <View style={{ flex: 2, flexDirection: 'row' }}>
                        <View style={styles.containerFoto}>
                            <View style={{ borderWidth: 1.5, width: 80, height: 80, justifyContent: 'center', alignItems: 'center', borderColor: colors.GREY1, borderRadius: 100 }}>
                                {this.state.allData ?
                                    <Image
                                        source={this.state.allData ? { uri: this.state.allData.driver_image ? this.state.allData.driver_image : null } : null}
                                        style={{ width: 72, height: 72, borderRadius: 50 }}
                                    />
                                    :
                                    <AvatarUser
                                        style={{ margin: 3 }} />
                                }
                            </View>

                            <View style={styles.rating}>
                                <Text style={{ fontFamily: 'Inter-Bold', fontSize: 15, top: 1, paddingStart: 7 }}> {this.state.allData ? this.state.allData.driverRating : null} </Text>
                                <Icon
                                    name="ios-star"
                                    type="ionicon"
                                    size={18}
                                    color={colors.DARK}
                                    containerStyle={{ paddingEnd: 7 }}
                                />
                            </View>
                            <Text style={styles.nameDriver}> {this.state.allData ? this.state.allData.driver_firstName : null} </Text>
                        </View>

                        <View style={styles.containerCarDetails}>
                            <View style={{ justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                                {this.state.allData ? this.state.allData.carType == "Colt econômico" ?
                                    <ColtEconomicoCar />
                                    :
                                    <ColtConfortCar />
                                    : null
                                }
                                <Text style={{ fontSize: 18, fontFamily: 'Inter-Medium', fontWeight: "500", textAlign: 'center', marginBottom: 5 }}> {this.state.allData ? this.state.allData.carType : null} </Text>
                            </View>

                            <View style={{ flex: 1, paddingTop: 10 }}>
                                <View style={styles.boxPlacaCarro}>
                                    <Text style={styles.placaCarro} > {this.state.allData ? this.state.allData.vehicle_number : null} </Text>
                                </View>
                                <View style={styles.containerTxtCarro}>
                                    <Text style={styles.marcaCarro}> {this.state.allData ? this.state.allData.vehicleModelName : null} </Text>
                                    <Text style={styles.corVeiculo}> • {this.state.allData.corVeh ? this.state.allData.corVeh : null} </Text>
                                </View>
                            </View>
                        </View>

                    </View>

                    {this.state.allData.waypoint ?
                        <View style={{ flex: 2.5, marginLeft: 15 }}>
                            <View style={{ flexDirection: 'row', marginTop: 20 }}>
                                <View style={{ flexDirection: 'column', alignItems: 'center' }}>

                                    <LocationUser width={25} height={25} />
                                    <View style={{ backgroundColor: colors.DEEPBLUE, height: 20, width: 2 }} />
                                    <LocationWaypoint width={20} height={20} />
                                    <View style={{ backgroundColor: colors.DARK, height: 20, width: 2 }} />
                                    <LocationDrop width={25} height={25} />

                                </View>
                                <View style={{ justifyContent: 'center', width: '100%', flexDirection: 'column' }}>
                                    <Text style={{ fontFamily: 'Inter-Medium', paddingRight: 10, position: 'absolute', top: 5 }}> {this.state.allData ?
                                        this.state.allData.pickup.add.split(",")[0] + ',' + this.state.allData.pickup.add.split(",")[1]
                                        : null}
                                    </Text>
                                    <Text style={{ fontFamily: 'Inter-Medium', paddingRight: 10, }}> {this.state.allData ?
                                        this.state.allData.waypoint.add.split(',')[0]
                                        : null}
                                    </Text>
                                    <Text style={{ fontFamily: 'Inter-Medium', position: 'absolute', bottom: 5, }}> {this.state.allData ?
                                        this.state.allData.drop.add.split(',')[0] + ',' + this.state.allData.drop.add.split(',')[1]
                                        : null}
                                    </Text>
                                </View>
                            </View>
                        </View>
                        :
                        <View style={{ flex: 1.6, marginLeft: 15 }}>
                            <View style={{ flexDirection: 'row', marginTop: 20 }}>
                                <CircleLineTriangle style={{}} />
                                <View style={{ justifyContent: 'space-around' }}>
                                    <Text style={{ fontFamily: 'Inter-Medium', paddingRight: 10 }}> {this.state.allData ?
                                        this.state.allData.pickup.add.split(",")[0] + ',' + this.state.allData.pickup.add.split(",")[1]
                                        : null}
                                    </Text>
                                    <Text style={{ fontFamily: 'Inter-Medium', paddingRight: 10 }}> {this.state.allData ?
                                        this.state.allData.drop.add.split(',')[0] + ',' + this.state.allData.drop.add.split(',')[1]
                                        : null}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    }

                </View>

            </View>
        );
    }

}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // marginTop: StatusBar.currentHeight,
    },
    innerContainer: {
        flex: 6,
        backgroundColor: colors.WHITE,
        justifyContent: "flex-end",
        alignItems: "center",
        width: width,
        height: height
    },
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
    map: {
        flex: 1,
        ...StyleSheet.absoluteFillObject
    },
    latlng: {
        width: 200,
        alignItems: "stretch"
    },
    btnFitCoord: {
        position: 'absolute',
        backgroundColor: colors.WHITE,
        width: 40,
        height: 40,
        borderRadius: 50,
        bottom: 40,
        left: 15,
        elevation: 5,
        marginTop: 45,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { x: 0, y: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    btnFitLocation: {
        position: 'absolute',
        backgroundColor: colors.WHITE,
        width: 40,
        height: 40,
        borderRadius: 50,
        bottom: 90,
        left: 15,
        elevation: 5,
        marginTop: 45,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { x: 0, y: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    btnFitWaypoint: {
        position: 'absolute',
        backgroundColor: colors.WHITE,
        width: 40,
        height: 40,
        borderRadius: 50,
        bottom: 140,
        left: 15,
        elevation: 5,
        marginTop: 45,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { x: 0, y: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
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
    btnPanico: {
        position: 'absolute',
        backgroundColor: colors.WHITE,
        borderWidth: 2,
        borderColor: colors.RED,
        width: 40,
        height: 40,
        borderRadius: 50,
        bottom: 10,
        right: 17,
        elevation: 5,
        marginTop: 40,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { x: 0, y: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },

    ////////////////////
    containerBottom: {
        shadowColor: '#000',
        shadowOffset: { x: 0, y: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 5,
        backgroundColor: colors.WHITE,
    },
    containerFoto: {
        alignItems: 'center',
        flex: 1,
        marginTop: 15,
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
        flexDirection: 'column',
        alignItems: 'center',
        flex: 1,
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
    },
    placaCarro: {
        fontSize: 25,
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
