
import React from 'react';
import { StyleSheet, View, PermissionsAndroid } from 'react-native';
import haversine from "haversine";
import MapView, {
    Marker,
    AnimatedRegion,
    PROVIDER_GOOGLE
} from "react-native-maps";
import { RequestPushMsg } from '../common/RequestPushMsg';
import { colors } from '../common/theme';
import Polyline from '@mapbox/polyline';
import * as firebase from 'firebase';
import { google_map_key } from '../common/key';
import languageJSON from '../common/language';
import distanceCalc from '../common/distanceCalc';
export default class TrackNow extends React.Component {

    constructor(props) {
        super(props);
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

                coordinate.timing(newCoordinate).start();
                this.setState({
                    latitude,
                    longitude,
                    routeCoordinates: routeCoordinates.concat([newCoordinate]),
                    distanceTravelled:
                        distanceTravelled + this.calcDistance(newCoordinate),
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

        if (duid && alldata) {
            const dat = firebase.database().ref('users/' + duid + '/');
            setInterval(() => {


                dat.once('value', snapshot => {
                    if (snapshot.val() && snapshot.val().location) {
                        var data = snapshot.val().location;
                        if (data) {
                            this.setState({
                                allData: paramData,
                                destinationLoc: paramData.wherelatitude + ',' + paramData.wherelongitude,
                                startLoc: data.lat + ',' + data.lng,
                                latitude: data.lat, longitude: data.lng
                            }, () => {
                                if (bookingStatus == 'ACCEPTED') {
                                    var location1 = [paramData.wherelatitude, paramData.wherelongitude];
                                    var location2 = [data.lat, data.lng];
                                    var distance = distanceCalc(location1, location2);
                                    var originalDistance = distance * 1000;
                                    // alert(originalDistance)
                                    if (originalDistance && originalDistance < 50) {
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

                                this.getDirections();
                            })
                        }

                    }


                })

            }, 10000)

        }
    }

    componentWillUnmount() {
        navigator.geolocation.clearWatch(this.watchID);
    }

    calcDistance = newLatLng => {
        const { prevLatLng } = this.state;
        return haversine(prevLatLng, newLatLng) || 0;
    };

    getMapRegion = () => ({
        latitude: this.state.latitude,
        longitude: this.state.longitude,
        latitudeDelta: 0.009,
        longitudeDelta: 0.009
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
                    if (this.map) {
                        this.map.fitToCoordinates([{ latitude: this.state.latitude, longitude: this.state.longitude }, { latitude: this.state.allData.wherelatitude, longitude: this.state.allData.wherelongitude }], {
                            edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
                            animated: true,
                        })
                    };
                }, 1500);

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
            <View style={styles.innerContainer}>
                {this.state.latitude?
                <MapView
                    ref={map => { this.map = map }}
                    style={styles.map}
                    provider={PROVIDER_GOOGLE}
                    showUserLocation
                    followUserLocation
                    loadingEnabled
                    region={this.getMapRegion()}
                >
                    {this.state.coords?
                    <MapView.Polyline
                        coordinates={this.state.coords}
                        strokeWidth={5}
                        strokeColor={colors.BLUE.default}
                    />
                    :null}
                    {this.state.routeCoordinates?
                    <MapView.Polyline coordinates={this.state.routeCoordinates} strokeWidth={5} />
                    :null}
                    {this.state.allData?
                    <Marker
                        coordinate={{ latitude: this.state.allData.wherelatitude, longitude: this.state.allData.wherelongitude}}
                        image={require('../../assets/images/rsz_2red_pin.png')}
                    >
                    </Marker>
                    :null}
                    {this.state.latitude?
                    <Marker
                        coordinate={{ latitude: this.state.latitude, longitude: this.state.longitude }}
                        image={require('../../assets/images/track_Car.png')}
                    >
                    </Marker>
                    :null}

                </MapView>
                :null}
            </View>

        );
    }

}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.WHITE,
        // marginTop: StatusBar.currentHeight,
    },
    innerContainer: {
        flex: 1,
        backgroundColor: colors.WHITE,
        justifyContent: "flex-end",
        alignItems: "center",

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
        ...StyleSheet.absoluteFillObject,
        flex: 1,

    },
    bubble: {
        flex: 1,
        backgroundColor: "rgba(255,255,255,0.7)",
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 20
    },
    latlng: {
        width: 200,
        alignItems: "stretch"
    },

});
