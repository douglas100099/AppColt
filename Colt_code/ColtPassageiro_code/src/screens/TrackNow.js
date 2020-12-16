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
import ColtEconomicoCar from '../../assets/svg/ColtEconomicoCar';
import ColtConfortCar from '../../assets/svg/ColtConfortCar';
import AvatarUser from '../../assets/svg/AvatarUser';
import IconCarMap from '../../assets/svg/IconCarMap';
import CircleLineTriangle from '../../assets/svg/CircleLineTriangle';
import { StatusBar } from 'react-native';

export default class TrackNow extends React.Component {

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

    async componentDidMount() {
        this._isMounted = true
        let keys = this.props.navigation.getParam('bId');
        const dat = firebase.database().ref('bookings/' + keys + '/current');
        dat.on('value', snapshot => {
            var data = snapshot.val()
            if (data) {
                let data = snapshot.val();
                this.setState({
                    angle: data.angle,
                    latitudeDriver: data.lat,
                    longitudeDriver: data.lng,
                    startLoc: data.lat + ',' + data.lng,
                })
            }
        })

        let paramData = await this.props.navigation.getParam('data');

        if (paramData) {
            this.setState({
                allData: paramData,
                destinationLoc: paramData.drop.lat + ',' + paramData.drop.lng
            }/*, () => {
                this.getDirections(this.state.startLoc)
            }*/)
        }

        const coordinate = new AnimatedRegion({
            latitude: paramData.pickup.lat,
            longitude: paramData.pickup.lng,
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
                    this.getDirections(this.state.startLoc);
                });
            },
            error => console.log(error),
            {
                enableHighAccuracy: true,
                timeout: 20000,
                maximumAge: 1000,
                distanceFilter: 10
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

    async getDirections(startLoc) {
        try {
            let resp = await fetch(`https://maps.googleapis.com/maps/api/directions/json?origin=${startLoc}&destination=${this.state.destinationLoc}&key=${google_map_key}`)
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
                            edgePadding: { top: getPixelSize(40), right: getPixelSize(40), bottom: getPixelSize(40), left: getPixelSize(40) },
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
        }, () => {
            this.setState({ dontGetRegion: false })
        })
    }

    locationUser() {
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
                        /*const value = await AsyncStorage.getItem('settings');
                        if (value !== null) {
                            let settings = JSON.parse(value);
                            if (Platform.OS === 'android') {
                                phoneNumber = `tel:${settings.panic}`;
                            } else {
                                phoneNumber = `telprompt:${settings.panic}`;
                            }
                            Linking.openURL(phoneNumber);
                        }*/
                        if (Platform.OS === 'android') {
                            phoneNumber = `tel:190`;
                        } else {
                            phoneNumber = `telprompt:190`;
                        }
                        Linking.openURL(phoneNumber);

                    }
                }
            ],
            { cancelable: false }
        );
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
                            //region={this.state.dontGetRegion ? null : this.getMapRegion()}
                            initialRegion={this.getMapRegion()}
                            onRegionChange={() => this.setState({ dontGetRegion: true })}
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
                            {/*this.state.routeCoordinates ?
                                <MapView.Polyline coordinates={this.state.routeCoordinates} strokeColor={colors.RED} strokeWidth={3} />
                            : null*/}

                            <Marker.Animated
                                ref={marker => {
                                    this.marker = marker;
                                }}
                                useNativeDriver={false}
                                coordinate={new AnimatedRegion({
                                    latitude: this.state.latitudeDriver,
                                    longitude: this.state.longitudeDriver,
                                    latitudeDelta: 0.009,
                                    longitudeDelta: 0.009
                                })}
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
                        </MapView>
                        : null}

                    <TouchableOpacity style={styles.btnPanico} onPress={() => this.alertPanic()} >
                        <Icon
                            name="ios-sad"
                            type="ionicon"
                            size={40}
                            color={colors.RED}
                            containerStyle={{ opacity: .7 }}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.btnFitCoord} onPress={() => this.fitCoordinates()}>
                        <Icon
                            name="ios-navigate"
                            type="ionicon"
                            size={30}
                            color={colors.DEEPBLUE}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.iconLocation} onPress={() => this.locationUser()}>
                        <Icon
                            name="car"
                            type="material-community"
                            // icon: 'chat', color: '#fff',
                            size={25}
                            color={colors.DEEPBLUE}
                        //containerStyle={{ opacity: .7 }}
                        />
                    </TouchableOpacity>

                </View>

                <View style={{ backgroundColor: colors.DEEPBLUE, height: 30, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: colors.WHITE, fontSize: 17, fontFamily: 'Inter-Bold' }}> A caminho do seu destino </Text>
                </View>

                {/* Modal inferior */}
                <View style={styles.containerBottom}>
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

                            <View style={{ flex: 1 }}>
                                <View style={styles.boxPlacaCarro}>
                                    <Text style={styles.placaCarro} > {this.state.allData ? this.state.allData.vehicle_number : null} </Text>
                                </View>
                                <View style={styles.containerTxtCarro}>
                                    <Text style={styles.marcaCarro}> {this.state.allData ? this.state.allData.vehicleModelName : null} </Text>
                                </View>
                            </View>
                        </View>

                    </View>
                    <View style={{ flex: 1.8, marginLeft: 20 }}>
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
        bottom: 20,
        right: 20,
        elevation: 5,
        marginTop: 40,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { x: 0, y: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    iconLocation: {
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'flex-end',
        right: 20,
        backgroundColor: colors.WHITE,
        width: 40,
        height: 40,
        borderRadius: 50,
        bottom: 80,
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
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.RED,
        width: 45,
        height: 45,
        borderRadius: 50,
        left: 17,
        elevation: 5,
        marginTop: 40,
        top: Platform.OS == 'ios' ? 15 : StatusBar.currentHeight + 15,
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
        flex: 4,
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
        width: 150,
    },
    marcaCarro: {
        fontFamily: 'Inter-Regular',
        color: colors.BLACK,
        fontSize: 18,

    },
});
