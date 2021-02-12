import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    Platform,
    Linking,
    Image,
    AsyncStorage,
    Modal,
    Alert,
    TextInput,
    KeyboardAvoidingView,
    TouchableWithoutFeedback,
    Keyboard
} from 'react-native';
import Polyline from '@mapbox/polyline';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import { Icon } from 'react-native-elements';
import { colors } from '../common/theme';
var { width } = Dimensions.get('window');
import * as firebase from 'firebase'; 
import { getPixelSize } from '../common/utils';
import { google_map_key } from '../common/key';
import mapStyleAndroid from '../../mapStyleAndroid.json';
import LocationDrop from '../../assets/svg/LocationDrop';
import CircleLineTriangle from '../../assets/svg/CircleLineTriangle';
import AvatarUser from '../../assets/svg/AvatarUser';
import { ActivityIndicator } from 'react-native';

export default class RideDetails extends React.Component {
    _isMounted = false
    getRideDetails
    constructor(props) {
        super(props);
        this.state = {
            coords: [],
            intialregion: {},
            settings: {
                code: '',
                symbol: '',
                cash: false,
                wallet: false
            },
            inputModal: false,
            loaderTick: false
        }
        this.refInput
        this.getRideDetails = this.props.navigation.getParam('data')
    }

    _retrieveSettings = async () => {
        try {
            const value = await AsyncStorage.getItem('settings')
            if (value !== null) {
                this.setState({ settings: JSON.parse(value) })
            }
        } catch (error) {
            console.log("Asyncstorage issue 11")
        }
    };

    componentDidMount() {
        this._isMounted = true
        if (this.getRideDetails) {
            this.setState({
                intialregion: {
                    latitude: this.getRideDetails.pickup.lat,
                    longitude: this.getRideDetails.pickup.lng,
                    latitudeDelta: 0.9922,
                    longitudeDelta: 0.9421,
                },
                paramData: this.getRideDetails,
            }, () => {
                setTimeout(() => {
                    if (this._isMounted) {
                        this.map.fitToCoordinates([{ latitude: this.state.paramData.pickup.lat, longitude: this.state.paramData.pickup.lng }, { latitude: this.state.paramData.drop.lat, longitude: this.state.paramData.drop.lng }], {
                            edgePadding: { top: getPixelSize(30), right: getPixelSize(30), bottom: getPixelSize(30), left: getPixelSize(30) },
                            animated: true,
                        })
                    }
                }, 500);
                /*if (this._isMounted) {

                    this.getDirections('"' + this.state.paramData.pickup.lat + ',' + this.state.paramData.pickup.lng + '"', '"' + this.state.paramData.drop.lat + ',' + this.state.paramData.drop.lng + '"');
                    this.forceUpdate();
                }*/
            })
        }

        this._retrieveSettings();
    }

    componentWillUnmount() {
        this._isMounted = true
    }

    // find your origin and destination point coordinates and pass it to our method.
    async getDirections(startLoc, destinationLoc) {
        try {
            let resp = await fetch(`https://maps.googleapis.com/maps/api/directions/json?origin=${startLoc}&destination=${destinationLoc}&key=${google_map_key}`)
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
                    if (this._isMounted) {
                        this.map.fitToCoordinates([{ latitude: this.state.paramData.pickup.lat, longitude: this.state.paramData.pickup.lng }, { latitude: this.state.paramData.drop.lat, longitude: this.state.paramData.drop.lng }], {
                            edgePadding: { top: getPixelSize(30), right: getPixelSize(30), bottom: getPixelSize(30), left: getPixelSize(30) },
                            animated: true,
                        })
                    }
                }, 500);
            })
            return coords
        }
        catch (error) {
            alert(error)
            return error
        }
    }

    sendTicket() {
        this.setState({ loaderTick: true })

        let dbRef = firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/my-booking/' + this.state.paramData.bookingId + '/');
        dbRef.once('value', (snap) => {
            let checkTick = snap.val()
            if (checkTick && !checkTick.ticket) {
                if (this.state.ticket && this.state.ticket.length > 5) {
                    firebase.database().ref('tickets/' + 'corridas/').push({
                        id: this.state.paramData ? this.state.paramData.bookingId : null,
                        msg: this.state.ticket ? this.state.ticket : null,
                    }).then(() => {
                        firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/my-booking/' + this.state.paramData.bookingId + '/').update({ ticket: true })
                    }).then(() => {
                        Alert.alert(
                            'Tudo certo!',
                            'Ticket enviado com sucesso! Em breve entraremos em contato com você!',
                            [
                                {
                                    style: 'default',
                                    text: 'Continuar',
                                    onPress: () => this.setState({ inputModal: false, loaderTick: false })
                                },
                            ],
                            { cancelable: true },
                        )
                    })
                } else {
                    alert('Digite corretamente o problema.')
                    this.setState({ loaderTick: false })
                }
            } else {
                alert('Você já possuí um ticket aberto para essa corrida, aguarde seu ticket ser resolvido.')
                this.setState({ loaderTick: false })
            }
        })
    }

    inputModal() {
        return (
            <Modal
                animationType="slide"
                transparent={true}
                visible={this.state.inputModal}
            >
                <View style={{ flex: 1, backgroundColor: "rgba(22,22,22,0.2)", justifyContent: 'center', alignItems: 'center' }}>
                    <KeyboardAvoidingView behavior={Platform.OS == 'ios' ? 'position' : 'height'}>
                        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                            <View style={{ justifyContent: 'center', alignItems: 'center', height: 350, width: width - 50, borderRadius: 15, backgroundColor: colors.WHITE }}>
                                <Text style={{ fontFamily: 'Inter-Bold', fontSize: 16, position: 'absolute', top: 15, left: 10 }} > Conte mais sobre seu problema </Text>
                                <Icon
                                    name='md-close'
                                    type='ionicon'
                                    color={colors.BLACK}
                                    size={35}
                                    containerStyle={{ position: 'absolute', top: 5, right: 15 }}
                                    onPress={() => { this.setState({ inputModal: false }) }}
                                />

                                <TextInput
                                    ref={(ref) => this.refInput = ref}
                                    style={{ position: 'absolute', top: 50, borderWidth: 1, borderColor: colors.GREY1, borderRadius: 10, width: width - 60, height: 200, textAlignVertical: 'top', fontSize: 16, color: colors.BLACK, fontFamily: 'Inter-Regular' }}
                                    maxLength={150}
                                    onChangeText={(text) => this.setState({ ticket: text })}
                                    editable={!this.state.loaderTick}
                                    multiline={true}
                                    numberOfLines={6}
                                />

                                <TouchableOpacity disabled={this.state.loaderTick} onPress={() => { this.sendTicket() }} style={{
                                    position: 'absolute', bottom: 15, backgroundColor: colors.DEEPBLUE,
                                    width: 200, borderRadius: 5, height: 40, justifyContent: 'center', alignItems: 'center'
                                }}>
                                    {!this.state.loaderTick ?

                                        <Text style={{ fontFamily: 'Inter-Bold', fontSize: 16, color: colors.WHITE }}> Enviar </Text>
                                        :
                                        <ActivityIndicator
                                            size={'small'}
                                            color={colors.WHITE}
                                        />
                                    }
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        )
    }


    //call driver button press
    onPressCall(phoneNumber) {

        Linking.canOpenURL(phoneNumber).then(supported => {
            if (!supported) {
                console.log('Can\'t handle Phone Number: ' + phoneNumber)
            } else {
                return Linking.openURL(phoneNumber)
            }
        }).catch(err => console.error('An error occurred', err))
    }
    //go back
    goBack() {
        this.props.navigation.goBack()
    }

    render() {
        return (
            <View style={styles.mainView}>
                <View style={{ justifyContent: 'center', height: 40, backgroundColor: colors.WHITE, marginTop: Platform.OS == 'ios' ? 60 : 40 }}>
                    <TouchableOpacity style={styles.btnVoltar} onPress={() => { this.props.navigation.goBack() }}>
                        <Icon
                            name='chevron-left'
                            type='MaterialIcons'
                            size={35}
                        />
                    </TouchableOpacity>
                    <Text style={{ fontFamily: 'Inter-Bold', fontSize: width < 375 ? 17 : 19, alignSelf: 'center' }}> Detalhes da corrida </Text>
                </View>
                <ScrollView>
                    <View style={styles.mapView}>
                        <View style={styles.mapcontainer}>
                            {this.state.intialregion ?
                                <MapView style={styles.map}
                                    ref={(ref) => this.map = ref}
                                    provider={PROVIDER_GOOGLE}
                                    region={{
                                        latitude: (this.state.intialregion.latitude),
                                        longitude: (this.state.intialregion.longitude),
                                        latitudeDelta: 0.0143,
                                        longitudeDelta: 1.9421
                                    }}
                                    enablePoweredByContainer={true}
                                    customMapStyle={mapStyleAndroid}
                                    showsCompass={false}
                                    showsScale={false}
                                    rotateEnabled={false}

                                >
                                    {this.state.paramData ?
                                        <Marker
                                            coordinate={{ latitude: this.state.paramData ? (this.state.paramData.pickup.lat) : 0.00, longitude: this.state.paramData ? (this.state.paramData.pickup.lng) : 0.00 }}
                                            title={this.state.paramData.pickup.add.split(',')[0]}
                                            anchor={{ x: 0.5, y: 0.5 }}
                                            description={this.state.paramData ? this.state.paramData.pickup.add : null}
                                        >
                                            <View style={{ width: 15, height: 15, borderRadius: 50, backgroundColor: colors.DEEPBLUE }} />
                                        </Marker>
                                        : null}
                                    {this.state.paramData ?
                                        <Marker
                                            coordinate={{ latitude: (this.state.paramData.drop.lat), longitude: (this.state.paramData.drop.lng) }}
                                            title={this.state.paramData.drop.add.split(',')[0]}
                                            anchor={{ x: 0.5, y: 0.5 }}
                                            description={this.state.paramData.drop.add}
                                            pinColor={colors.GREEN.default}
                                        >
                                            <LocationDrop
                                                width={25}
                                                height={25}
                                            />
                                        </Marker>
                                        : null}
                                    {this.state.coords ?
                                        <MapView.Polyline
                                            coordinates={this.state.coords}
                                            strokeWidth={3}
                                            strokeColor={colors.DEEPBLUE}
                                        />
                                        : null}
                                </MapView>
                                : null}
                        </View>
                    </View>

                    <View style={styles.rideDesc}>

                        <View style={styles.cardLocation}>
                            <View style={{ flexDirection: 'row', padding: 10, }}>
                                <CircleLineTriangle />

                                <View style={{ flexDirection: 'column', justifyContent: 'space-around' }}>
                                    {this.state.paramData && this.state.paramData.pickup ?
                                        <Text style={{ fontFamily: 'Inter-Medium', marginRight: 20 }}> {this.state.paramData.pickup.add.split(',')[0] + ', ' + this.state.paramData.pickup.add.split(',')[1]} </Text>
                                        : null}
                                    {this.state.paramData && this.state.paramData.drop ?
                                        <Text style={{ fontFamily: 'Inter-Medium', marginRight: 20 }}> {this.state.paramData.drop.add.split(',')[0] + ', ' + this.state.paramData.drop.add.split(',')[1]} </Text>
                                        : null}
                                </View>
                            </View>
                        </View>
                        {this.state.paramData ?
                            this.state.paramData.pagamento.cancellValue > 0 ?
                                <View style={{ marginHorizontal: 25, marginVertical: 15, flexDirection: 'row', alignItems: 'center' }}>
                                    <Icon
                                        name="ios-alert"
                                        type="ionicon"
                                        color={colors.RED}
                                        size={22}
                                        containerStyle={{ opacity: .5 }}
                                    />
                                    <Text style={{ fontFamily: "Inter-Medium", color: colors.RED }}> Você pagou uma taxa de cancelamente nessa corrida. </Text>
                                </View>
                                : null
                            : null}
                        <View>
                            <Text style={{ marginTop: 15, marginBottom: 10, marginLeft: 20, fontFamily: 'Inter-Bold', fontSize: width < 375 ? 17 : 19 }}> Motorista </Text>
                            <View style={styles.cardDriver}>
                                <View style={{ marginLeft: 15 }}>
                                    {this.state.paramData ?
                                        <Image
                                            source={{ uri: this.state.paramData.driver_image }}
                                            style={{ borderWidth: 1, borderColor: colors.GREY1, width: 70, height: 70, borderRadius: 60 }}
                                        />
                                        :
                                        <AvatarUser />
                                    }
                                </View>
                                {this.state.paramData ?
                                    <View style={{ marginLeft: 10 }}>
                                        <Text style={{ fontFamily: 'Inter-Bold', fontSize: width < 375 ? 17 : 19 }}> {this.state.paramData.driver_firstName} </Text>
                                        <Text style={{ marginLeft: 3, paddingTop: 5, fontFamily: 'Inter-Medium' }}> {this.state.paramData.vehicleModelName} </Text>

                                        <View style={{ marginLeft: 3, flexDirection: 'row', alignItems: 'center' }}>
                                            <Icon
                                                name='ios-star'
                                                type='ionicon'
                                                color={colors.DEEPBLUE}
                                                size={15}
                                            />
                                            <Text style={{ fontFamily: 'Inter-Medium', marginLeft: 3 }}> {this.state.paramData.driverRating} </Text>
                                        </View>
                                    </View>
                                    : null}

                                <TouchableOpacity style={{ position: 'absolute', right: 30 }} onPress={() => { this.onPressCall('tel: ' + this.state.paramData.driver_contact) }}>
                                    <Icon
                                        name='ios-call'
                                        type='ionicon'
                                        color={colors.DEEPBLUE}
                                        size={30}
                                    //containerStyle={{ opacity: .5 }}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>


                        <Text style={{ marginTop: 10, marginBottom: 0, marginLeft: 25, fontFamily: 'Inter-Bold', fontSize: width < 375 ? 15 : 17 }}>Pagamento</Text>
                        {this.state.paramData ?
                            <View>
                                {this.state.paramData.pagamento.discount_amount > 0 ?
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 25 }}>
                                        <Icon
                                            name="ios-bookmark"
                                            type="ionicon"
                                            color={colors.DEEPBLUE}
                                            size={22}
                                        />
                                        <Text style={{ color: colors.DEEPBLUE, fontFamily: 'Inter-Medium', marginLeft: 5, paddingVertical: 10, fontSize: width < 375 ? 13 : 15 }}>Você usou um cupom de desconto nessa corrida!</Text>
                                    </View>
                                    : null}
                                <View>
                                </View>
                                <View style={styles.cardPagamento}>
                                    <View style={{ marginLeft: 10, flexDirection: 'row', alignItems: 'center' }}>
                                        <Icon
                                            name='ios-cash'
                                            type='ionicon'
                                            color={colors.GREEN.light}
                                            size={22}
                                            containerStyle={{ opacity: .5 }}
                                        />
                                        <Text style={{ fontFamily: 'Inter-Medium', marginLeft: 3, fontSize: width < 375 ? 17 : 19 }}> {this.state.paramData.pagamento.payment_mode} </Text>
                                    </View>
                                    {this.state.paramData.pagamento.customer_paid >= 0 ?
                                        <Text style={{ fontFamily: 'Inter-Bold', fontSize: width < 375 ? 17 : 21, position: 'absolute', right: 20 }}>
                                            <Text style={{ fontFamily: 'Inter-Bold', fontSize: 13 }}>R$</Text>
                                            {parseFloat(this.state.paramData.pagamento.customer_paid).toFixed(2)}
                                        </Text>
                                        : null}
                                </View>
                            </View>
                            : null}

                        <TouchableOpacity onPress={() => { this.setState({ inputModal: true }) }} >
                            <View style={styles.btnProblem} >
                                <Text style={{ fontFamily: "Inter-Bold", color: colors.RED, fontSize: width < 375 ? 17 : 19 }}> Relatar problema </Text>
                            </View>
                        </TouchableOpacity>

                    </View>

                </ScrollView>
                {
                    this.inputModal()
                }
            </View>
        )
    }
}

const styles = StyleSheet.create({
    headerStyle: {
        backgroundColor: colors.GREY.default,
        borderBottomWidth: 0
    },
    headerTitleStyle: {
        color: colors.WHITE,
        fontFamily: 'Roboto-Bold',
        fontSize: 20
    },
    containerView: {
        flex: 1
    },
    textContainer: {
        textAlign: "center"
    },
    mapView: {
        justifyContent: 'center',
        alignItems: 'center',
        height: 250,
        marginBottom: 15,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { x: 0, y: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    mapcontainer: {
        flex: 9,
        width: width,
        marginTop: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    map: {
        flex: 1,
        ...StyleSheet.absoluteFillObject,
    },
    rideDesc: {
        marginTop: 10,
        flexDirection: 'column'
    },
    cardLocation: {
        borderWidth: 1,
        borderColor: colors.GREY2,
        borderRadius: 10,
        marginHorizontal: 20
    },
    cardDriver: {
        borderRadius: 15,
        marginHorizontal: 20,
        elevation: 5,
        backgroundColor: colors.WHITE,
        shadowColor: '#000',
        shadowOffset: { x: 0, y: 5 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        height: 100,
        flexDirection: 'row',
        alignItems: 'center'
    },
    cardPagamento: {
        backgroundColor: colors.GREY3,
        borderRadius: 10,
        marginHorizontal: 20,
        height: 60,
        flexDirection: 'row',
        alignItems: 'center'
    },
    btnProblem: {
        backgroundColor: colors.WHITE,
        borderWidth: 1,
        borderColor: colors.RED,
        borderRadius: 10,
        height: 60,
        marginTop: 15,
        marginHorizontal: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },

    location: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginVertical: 6
    },

    mainView: {
        flex: 1,
        backgroundColor: colors.WHITE,
    },
    btnVoltar: {
        width: 35,
        height: 35,
        borderRadius: 50,
        backgroundColor: colors.WHITE,
        position: 'absolute',
        left: 15,
        shadowColor: '#000',
        shadowOffset: { x: 0, y: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
});