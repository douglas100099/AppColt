import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Platform,
    Dimensions,
    Linking,
    Alert,
    AsyncStorage
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
import * as firebase from 'firebase';
import { google_map_key } from '../common/key';
import languageJSON from '../common/language';

import LocationUser from '../../assets/svg/LocationUser';
import LocationDrop from '../../assets/svg/LocationDrop';
import ColtEconomicoCar from '../../assets/svg/ColtEconomicoCar';
import ColtConfortCar from '../../assets/svg/ColtConfortCar';
import AvatarUser from '../../assets/svg/AvatarUser';
import IconCarMap from '../../assets/svg/IconCarMap';

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
            coordinate: null
        };
    }

    async componentDidMount() {
        this._isMounted = true
        let keys = this.props.navigation.getParam('bId');
        const dat = firebase.database().ref('bookings/' + keys);
        dat.on('value', snapshot => {
            var data = snapshot.val()
            if (data.current) {
                let data = snapshot.val();
                this.setState({ angle: data.current.angle, latitude: data.current.lat, longitude: data.current.lng });
            }
        })

        let paramData = this.props.navigation.getParam('data');

        this.setState({
            allData: paramData,
            startLoc: paramData.pickup.lat + ',' + paramData.pickup.lng,
            destinationLoc: paramData.drop.lat + ',' + paramData.drop.lng
        }, () => {
            this.getDirections();
        })


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

        if (this.props.navigation.getParam('data')) {
            let paramData = this.props.navigation.getParam('data');
            this.setState({
                allData: paramData,
                startLoc: paramData.pickup.lat + ',' + paramData.pickup.lng,
                destinationLoc: paramData.drop.lat + ',' + paramData.drop.lng
            }, () => {
                this.getDirections();
            })
        }
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
            let resp = await fetch(`https://maps.googleapis.com/maps/api/directions/json?origin=${this.state.startLoc}&destination=${this.state.destinationLoc}&key=${google_map_key}`)
            let respJson = await resp.json();
            let points = Polyline.decode(respJson.routes[0].overview_polyline.points);
            let coords = points.map((point, index) => {
                return {
                    latitude: point[0],
                    longitude: point[1]
                }
            })
            this.setState({ coords: coords }, () => {
                setTimeout(() => {
                    this.map.fitToCoordinates([{ latitude: this.state.allData.pickup.lat, longitude: this.state.allData.pickup.lng }, { latitude: this.state.allData.drop.lat, longitude: this.state.allData.drop.lng }], {
                        edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
                        animated: true,
                    })
                }, 500);

            })
            return coords
        }
        catch (error) {
            alert(error)
            return error
        }
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
                            region={this.getMapRegion()}
                            showsCompass={false}
                            showsScale={false}
                            rotateEnabled={false}
                        >

                            {this.state.coords ?
                                <MapView.Polyline
                                    coordinates={this.state.coords}
                                    strokeWidth={2.5}
                                    strokeColor={colors.DEEPBLUE}
                                />
                                : null}
                            {this.state.routeCoordinates ?
                                <MapView.Polyline coordinates={this.state.routeCoordinates} strokeColor={colors.BLACK} strokeWidth={3} />
                                : null}

                            <Marker.Animated
                                ref={marker => {
                                    this.marker = marker;
                                }}
                                useNativeDriver={false}
                                coordinate={new AnimatedRegion({
                                    latitude: this.state.latitude,
                                    longitude: this.state.longitude,
                                    latitudeDelta: 0.009,
                                    longitudeDelta: 0.009
                                })}
                            >
                                <IconCarMap
                                    width={45}
                                    height={45}
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
                                >
                                    <LocationDrop />
                                </Marker>
                                : null}

                        </MapView>
                        : null}
                </View>

                <View style={{ backgroundColor: colors.GREEN.light, height: 30, justifyContent: 'center', alignItems: 'center', opacity: 0.5 }}>
                    <Text style={{ color: colors.GREY3, fontFamily: 'Inter-Bold' }}> A caminho do seu destino </Text>
                </View>

                {/* Modal inferior */}
                <View style={styles.containerBottom}>
                    <View style={styles.containerFoto}>
                        <View style={{ borderWidth: 1.5, borderColor: colors.DEEPBLUE, borderRadius: 100 }}>
                            <AvatarUser
                                style={{ margin: 3 }}
                            />
                        </View>

                        <Text style={styles.nameDriver}> {this.state.allData ? this.state.allData.driver_name : null} </Text>
                        <View style={styles.rating}>
                            <Icon
                                name="star"
                                type="feather"
                                // icon: 'chat', color: '#fff',
                                size={23}
                                color={colors.YELLOW.secondary}
                            />
                            <Text style={{ fontFamily: 'Inter-Bold', fontSize: 15, fontWeight: '600' }}> {this.state.allData ? this.state.allData.driverRating : null} </Text>
                        </View>
                    </View>

                    <View style={styles.containerCarDetails}>
                        <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                            {this.state.allData ? this.state.allData.carType == "Colt econômico" ?
                                <ColtEconomicoCar />
                                :
                                <ColtConfortCar />
                                : null
                            }
                            <Text style={{ fontSize: 18, fontFamily: 'Inter-Medium', fontWeight: "500", textAlign: 'center', marginBottom: 5 }}> {this.state.allData ? this.state.allData.carType : null} </Text>
                        </View>

                        <View style={styles.boxPlacaCarro}>
                            <Text style={styles.placaCarro} > {this.state.allData ? this.state.allData.vehicle_number : null} </Text>
                        </View>
                        <View style={styles.containerTxtCarro}>
                            <Text style={styles.marcaCarro}> {this.state.allData ? this.state.allData.vehicleModelName : null} </Text>
                        </View>
                    </View>

                    <View style={styles.containerBtn}>
                        <TouchableOpacity style={styles.btnLigarMotorista}>
                            <View>
                                <Text style={styles.txtLigarMotorista}>  </Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                </View>
                <TouchableOpacity style={styles.btnPanico}>
                    <View>
                        <Icon
                            name="ios-sad"
                            type="ionicon"
                            // icon: 'chat', color: '#fff',
                            size={30}
                            color={colors.WHITE}
                        />
                    </View>
                </TouchableOpacity>
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
    btnPanico: {
        width: 50,
        height: 50,
        backgroundColor: colors.RED,
        borderRadius: 100,
        position: 'absolute',
        top: 0,
        right: 0,
        marginTop: 50,
        marginRight: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },

    ////////////////////
    containerBottom: {
        width: width,
        shadowColor: '#000',
        shadowOffset: { x: 0, y: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 5,
        backgroundColor: colors.WHITE,
        flex: 3,
        alignSelf: 'center',
    },
    containerFoto: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        left: 20,
        top: 15,
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
    },
    containerCarDetails: {
        position: 'absolute',
        right: 20,
        top: 0,
        flexDirection: 'column',
    },
    containerBtn: {
        position: 'absolute',
        bottom: 0,
        marginBottom: 30,
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center',
    },
    btnLigarMotorista: {
        backgroundColor: colors.WHITE,
        borderWidth: 2,
        borderColor: colors.DEEPBLUE,
        height: 45,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        width: 250
    },
    txtLigarMotorista: {
        fontFamily: 'Inter-Bold',
        color: colors.DEEPBLUE,
        fontSize: 19,
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
        marginTop: 10,
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
        position: 'absolute',
        right: 0
    },
});
