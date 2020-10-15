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
                this.setState({ latitude: data.current.lat, longitude: data.current.lng });
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
                {/*<Header
                    backgroundColor={colors.GREY.default}
                    leftComponent={{ icon: 'md-menu', type: 'ionicon', color: colors.WHITE, size: 30, component: TouchableWithoutFeedback, onPress: () => { this.props.navigation.toggleDrawer(); } }}
                    rightComponent={{
                        icon: 'ios-sad', type: 'ionicon', color: colors.WHITE, size: 30, component: TouchableWithoutFeedback, onPress: () => {

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
                                            const value = await AsyncStorage.getItem('settings');
                                            if (value !== null) {
                                                let settings = JSON.parse(value);
                                                if (Platform.OS === 'android') {
                                                    phoneNumber = `tel:${settings.panic}`;
                                                } else {
                                                    phoneNumber = `telprompt:${settings.panic}`;
                                                }
                                                Linking.openURL(phoneNumber);
                                            }
                                        }
                                    }
                                ],
                                { cancelable: false }
                            );
                        }
                    }}
                    centerComponent={<Text style={styles.headerTitleStyle}>{languageJSON.track_cab}</Text>}
                    containerStyle={styles.headerStyle}
                    innerContainerStyles={styles.headerInnerStyle}
                />*/}

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
                                <MapView.Polyline coordinates={this.state.routeCoordinates} strokeWidth={3} />
                                : null}

                            <Marker.Animated
                                ref={marker => {
                                    this.marker = marker;
                                }}
                                image={require('../../assets/images/available_car.png')}
                                coordinate={new AnimatedRegion({
                                    latitude: this.state.latitude,
                                    longitude: this.state.longitude,
                                    latitudeDelta: 0.009,
                                    longitudeDelta: 0.009
                                })}
                            >
                            </Marker.Animated>

                            {this.state.allData ?
                                <Marker
                                    image={require('../../assets/images/markerUser.png')}
                                    coordinate={{ latitude: this.state.allData.pickup.lat, longitude: this.state.allData.pickup.lng }}
                                    anchor={{ x: 0.5, y: 0.5 }}
                                >
                                </Marker>
                                : null}
                            {this.state.allData ?
                                <Marker
                                    image={require('../../assets/images/marker.png')}
                                    coordinate={{ latitude: this.state.allData.drop.lat, longitude: this.state.allData.drop.lng }}
                                >
                                </Marker>
                                : null}

                        </MapView>
                        : null}
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
        flex: 1,
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
});
