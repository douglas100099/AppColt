import React from 'react';
import { StyleSheet, View, Modal, Image, Text, Dimensions, Platform } from 'react-native';
import haversine from "haversine";
import MapView, {
    Marker,
    AnimatedRegion,
    PROVIDER_GOOGLE
} from "react-native-maps";
import { Icon } from 'react-native-elements';
import { RequestPushMsg } from '../common/RequestPushMsg';
import { colors } from '../common/theme';
import { getPixelSize } from '../common/utils';
import Polyline from '@mapbox/polyline';
var { width, height } = Dimensions.get('window');
import * as firebase from 'firebase';
import { google_map_key } from '../common/key';
import languageJSON from '../common/language';
import distanceCalc from '../common/distanceCalc';
import mapStyleJson from '../../mapStyle.json';
import mapStyleAndroid from '../../mapStyleAndroid.json';

import LocationUser from '../../assets/svg/LocationUser';
import IconCarMap from '../../assets/svg/IconCarMap';
import { TouchableOpacity } from 'react-native-gesture-handler';


export default class TrackNow extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            latitude: null,
            longitude: null,
            routeCoordinates: [],
            distanceTravelled: 0,
            prevLatLng: {},
            coordinate: null,
            checkDirection: true,
            showsMyLocationBtn: false
        };
        this._isMounted = false;
        this.viewWidth = 30,
            this.viewHeight = 30
    }

    async componentDidMount() {
        this._isMounted = true
        const { duid, alldata, bookingStatus } = this.props;
        let paramData = alldata;

        coordinate = new AnimatedRegion({
            latitude: paramData.wherelatitude,
            longitude: paramData.wherelongitude,
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
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: false,
                }).start();

                this.setState({
                    latitude,
                    longitude,
                    routeCoordinates: routeCoordinates.concat([newCoordinate]),
                    distanceTravelled: distanceTravelled + this.calcDistance(newCoordinate),
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

        this.updateBooking(duid, alldata, paramData, bookingStatus)
        this.setState({
            intervalTrackNow:
                setInterval(() => {
                    if (this._isMounted) {
                        this.updateBooking(duid, alldata, paramData, bookingStatus)
                    }
                }, 10000)
        })
    }

    updateBooking(duid, alldata, paramData, bookingStatus) {
        if (duid && alldata) {
            const dat = firebase.database().ref('users/' + duid + '/');

            dat.once('value', snapshot => {
                if (snapshot.val() && snapshot.val().location) {
                    var data = snapshot.val().location;
                    if (data) {
                        this.setState({
                            allData: paramData,
                            destinationLoc: paramData.wherelatitude + ',' + paramData.wherelongitude,
                            startLoc: data.lat + ',' + data.lng,
                            latitude: data.lat,
                            longitude: data.lng,
                            angle: data.angle
                        }, () => {
                            if (bookingStatus == 'ACCEPTED') {
                                var location1 = [paramData.wherelatitude, paramData.wherelongitude];
                                var location2 = [data.lat, data.lng];
                                var distance = distanceCalc(location1, location2);
                                var originalDistance = distance * 1000;

                                if (originalDistance && originalDistance < 100) {
                                    if (!this.state.allData.flag) {
                                        this.setState({
                                            flag: false
                                        })
                                        const dat = firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/');
                                        dat.once('value', snapshot => {
                                            if (snapshot.val() && snapshot.val().pushToken) {
                                                RequestPushMsg(snapshot.val().pushToken, languageJSON.driver_near)
                                                paramData.flag = true;
                                            }
                                        })
                                    }
                                }
                            }
                            console.log("RODANDO")
                            this.getDirections();
                        })
                    }
                }
            })

        }
    }



    componentWillUnmount() {
        this._isMounted = false
        clearInterval(this.state.intervalTrackNow)
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
        const { setTimeEstimate } = this.props
        try {
            let resp = await fetch(`https://maps.googleapis.com/maps/api/directions/json?origin=${this.state.startLoc}&destination=${this.state.destinationLoc}&key=${google_map_key}`)
            let respJson = await resp.json();
            let points = Polyline.decode(respJson.routes[0].overview_polyline.points)

            setTimeEstimate(respJson.routes[0].legs[0].duration.text)
            //console.log(respJson.routes[0].legs[0].duration.text)

            let coords = points.map((point, index) => {
                return {
                    latitude: point[0],
                    longitude: point[1]
                }
            })
            this.setState({ coords: coords }, () => {
                setTimeout(() => {
                    if (this.state.checkDirection) {
                        if (this.map) {
                            this.map.fitToCoordinates([{ latitude: this.state.latitude, longitude: this.state.longitude }, { latitude: this.state.allData.wherelatitude, longitude: this.state.allData.wherelongitude }], {
                                edgePadding: { top: getPixelSize(40), right: getPixelSize(40), bottom: getPixelSize(40), left: getPixelSize(40) },
                                animated: true,
                            })
                        };
                        this.setState({ checkDirection: false })
                    }
                }, 500);
            })
            return coords
        }
        catch (error) {
            alert("Não foi possível carregar a rota")
            return error
        }
    }

    fitRoute() {
        this.map.fitToCoordinates([{ latitude: this.state.latitude, longitude: this.state.longitude }, { latitude: this.state.allData.wherelatitude, longitude: this.state.allData.wherelongitude }], {
            edgePadding: { top: getPixelSize(60), right: getPixelSize(60), bottom: getPixelSize(60), left: getPixelSize(60) },
            animated: true,
        })
    }

    locationUser() {
        let region = {
            latitude: this.state.latitude,
            longitude: this.state.longitude,
            latitudeDelta: 0.0043,
            longitudeDelta: 0.0034
        }
        if (this.map) {
            this.map.animateToRegion(region, 500)
        }
    }

    _onMapChange = async () => {
        const {
            zoom,
            pitch,
            center,
            heading
        } = await this.map.getCamera();

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
            <View style={styles.innerContainer}>
                {this.state.allData && this._isMounted ?
                    <MapView.Animated
                        ref={map => { this.map = map }}
                        style={styles.map}
                        provider={PROVIDER_GOOGLE}
                        showUserLocation
                        followUserLocation
                        loadingEnabled
                        customMapStyle={mapStyleAndroid}
                        showsCompass={false}
                        onRegionChange={() => { this.setState({ showsMyLocationBtn: true }), this._onMapChange() }}
                        showsScale={false}
                        rotateEnabled={false}
                        showsMyLocationButton={false}
                        //region={this.getMapRegion()}
                        initialRegion={{
                            latitude: this.state.latitude,
                            longitude: this.state.longitude,
                            latitudeDelta: 0.0143,
                            longitudeDelta: 0.0134,
                        }}
                    >
                        {this.state.coords ?
                            <MapView.Polyline
                                coordinates={this.state.coords}
                                strokeWidth={3}
                                strokeColor={colors.DEEPBLUE}
                            />
                            : null}
                        {/*this.state.routeCoordinates ?
                            <MapView.Polyline strokeColor={colors.RED} coordinates={this.state.routeCoordinates} strokeWidth={3} />
                        : null*/}
                        {this.state.allData ?
                            <Marker
                                coordinate={{ latitude: this.state.allData.wherelatitude, longitude: this.state.allData.wherelongitude }}
                                anchor={{ x: 0.5, y: 0.5 }}
                            >
                                <LocationUser
                                    width={25}
                                    height={25}
                                />
                            </Marker>
                            : null}
                        {this.state.latitude ?
                            <Marker
                                coordinate={{ latitude: this.state.latitude, longitude: this.state.longitude }}
                                anchor={{ x: 0.5, y: 0.5 }}
                            >
                                <IconCarMap
                                    width={this.viewWidth}
                                    height={this.viewHeight}
                                    style={{ transform: [{ rotate: this.state.angle + "deg" }] }}
                                />
                            </Marker>
                            : null}
                    </MapView.Animated>
                    : null}
                {this.state.showsMyLocationBtn ?
                    <View>
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

                        <TouchableOpacity style={styles.iconRoute} onPress={() => this.fitRoute()}>
                            <Icon
                                name='git-pull-request'
                                type='feather'
                                // icon: 'chat', color: '#fff',
                                size={25}
                                color={colors.DARK}
                            //containerStyle={{ opacity: .7 }}
                            />
                        </TouchableOpacity>
                    </View>
                    : null}
            </View>
        );
    }

}

const styles = StyleSheet.create({
    innerContainer: {
        flex: 1,
        backgroundColor: colors.WHITE,
    },
    iconLocation: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: Platform.OS == 'ios' ? 50 : 30,
        alignSelf: 'flex-end',
        marginRight: 15,
        backgroundColor: colors.WHITE,
        width: 40,
        height: 40,
        borderRadius: 50
    },
    iconRoute: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        alignSelf: 'flex-end',
        marginRight: 15,
        backgroundColor: colors.WHITE,
        width: 40,
        height: 40,
        borderRadius: 50
    },
    map: {
        ...StyleSheet.absoluteFillObject,
        flex: 1,
    },
});
