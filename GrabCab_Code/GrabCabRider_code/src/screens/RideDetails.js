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
    AsyncStorage
} from 'react-native';
import Polyline from '@mapbox/polyline';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import { Header, Icon, Avatar, Button } from 'react-native-elements';
import Dash from 'react-native-dash';
import { colors } from '../common/theme';
var { width } = Dimensions.get('window');
import * as firebase from 'firebase'; //Database
import { getPixelSize } from '../common/utils';
import { google_map_key } from '../common/key';
import languageJSON from '../common/language';
import { NavigationActions, StackActions } from 'react-navigation';
import LocationUser from '../../assets/svg/LocationUser';
import LocationDrop from '../../assets/svg/LocationDrop';
import CircleLineTriangle from '../../assets/svg/CircleLineTriangle';
import AvatarUser from '../../assets/svg/AvatarUser';
import { color } from 'react-native-reanimated';

export default class RideDetails extends React.Component {
    getRideDetails;
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
            }
        }
        this.getRideDetails = this.props.navigation.getParam('data');
    }

    _retrieveSettings = async () => {
        try {
            const value = await AsyncStorage.getItem('settings');
            if (value !== null) {
                this.setState({ settings: JSON.parse(value) });
            }
        } catch (error) {
            console.log("Asyncstorage issue 11");
        }
    };

    componentDidMount() {
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
                this.getDirections('"' + this.state.paramData.pickup.lat + ',' + this.state.paramData.pickup.lng + '"', '"' + this.state.paramData.drop.lat + ',' + this.state.paramData.drop.lng + '"');
                this.forceUpdate();
            })
        }
        this._retrieveSettings();
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
                    this.map.fitToCoordinates([{ latitude: this.state.paramData.pickup.lat, longitude: this.state.paramData.pickup.lng }, { latitude: this.state.paramData.drop.lat, longitude: this.state.paramData.drop.lng }], {
                        edgePadding: { top: getPixelSize(30), right: getPixelSize(30), bottom: getPixelSize(30), left: getPixelSize(30) },
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


    //call driver button press
    onPressCall(phoneNumber) {
        Linking.canOpenURL(phoneNumber).then(supported => {
            if (!supported) {
                console.log('Can\'t handle Phone Number: ' + phoneNumber);
            } else {
                return Linking.openURL(phoneNumber);
            }
        }).catch(err => console.error('An error occurred', err));
    }
    //go back
    goBack() {
        this.props.navigation.goBack();
    }

    trackNow(data) {
        if (data.status == 'ACCEPTED') {
            let bookingData = {
                bokkingId: data.bookingId,
                coords: data.coords,
            }
            //this.props.navigation.navigate('BookedCab', { passData: bookingData });

            this.props
                .navigation
                .dispatch(StackActions.reset({
                    index: 0,
                    actions: [
                        NavigationActions.navigate({
                            routeName: 'BookedCab',
                            params: { passData: bookingData },
                        }),
                    ],
                }))

        } else if (data.status == 'START') {
            this.props.navigation.navigate('trackRide', { data: data, bId: data.bookingId });
        } else {
            console.log('track not posible')
        }
    }


    PayNow(data) {

        var curuser = firebase.auth().currentUser;
        this.setState({ currentUser: curuser }, () => {
            const userData = firebase.database().ref('users/' + this.state.currentUser.uid);
            userData.once('value', userData => {
                if (userData.val()) {
                    var udata = userData.val();
                    const bDataref = firebase.database().ref('users/' + this.state.currentUser.uid + '/my-booking/' + data.bookingId);
                    bDataref.once('value', bookingdetails => {
                        if (bookingdetails.val()) {
                            bookingData = bookingdetails.val()
                            if (bookingData.payment_status == "WAITING" && bookingData.status == 'END') {
                                bookingData.bookingKey = data.bookingId;
                                bookingData.firstname = udata.firstName;
                                bookingData.lastname = udata.lastName;
                                bookingData.email = udata.email;
                                bookingData.phonenumber = udata.mobile;
                                //this.props.navigation.navigate('CardDetails', { data: bookingData });
                            }
                        }
                    })
                }
            })
        })
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

                        <View>
                            <Text style={{ marginTop: 25, marginBottom: 10, marginLeft: 20, fontFamily: 'Inter-Bold', fontSize: width < 375 ? 17 : 19 }}> Motorista </Text>
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
                                        <Text style={{ fontFamily: 'Inter-Bold', fontSize: width < 375 ? 17 : 19 }}> {this.state.paramData.driver_name} </Text>
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
                            </View>
                        </View>

                        <Text style={{ marginTop: 10, marginBottom: 10, marginLeft: 25, fontFamily: 'Inter-Bold', fontSize: width < 375 ? 15 : 17 }}>Pagamento</Text>
                        {this.state.paramData ?
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
                                <Text style={{ fontFamily: 'Inter-Bold', fontSize: width < 375 ? 17 : 21, position: 'absolute', right: 20 }}>
                                    <Text style={{ fontFamily: 'Inter-Bold', fontSize: 13 }}>R$</Text>
                                    {parseFloat(this.state.paramData.pagamento.customer_paid).toFixed(2)}
                                </Text>
                            </View>
                            : null}
                        <TouchableOpacity >
                            <View style={styles.btnProblem}>
                                <Text style={{ fontFamily: "Inter-Bold", color: colors.RED, fontSize: width < 375 ? 17 : 19 }}> Relatar problema </Text>
                            </View>
                        </TouchableOpacity>

                    </View>



                    {/*{this.state.paramData && this.state.paramData.payment_status ? this.state.paramData.payment_status == "IN_PROGRESS" || this.state.paramData.payment_status == "PAID" || this.state.paramData.payment_status == "WAITING" ?
                        <View style={styles.billView}>
                            <View style={styles.billView}>
                                <Text style={styles.billTitle}>{languageJSON.bill_details_title}</Text>
                            </View>
                            <View style={styles.billOptions}>
                                <View style={styles.billItem}>
                                    <Text style={styles.billName}>{languageJSON.your_trip}</Text>
                                    <Text style={styles.billAmount}>{this.state.settings.symbol} {this.state.paramData && this.state.paramData.trip_cost > 0 ? parseFloat(this.state.paramData.trip_cost).toFixed(2) : this.state.paramData && this.state.paramData.estimate ? parseFloat(this.state.paramData.estimate).toFixed(2) : 0}</Text>
                                </View>
                                <View style={styles.billItem}>
                                    <View>
                                        <Text style={[styles.billName, styles.billText]}>{languageJSON.discount}</Text>
                                        <Text style={styles.taxColor}>{languageJSON.promo_apply}</Text>
                                    </View>
                                    <Text style={styles.discountAmount}> - {this.state.settings.symbol}{this.state.paramData && this.state.paramData.discount_amount ? parseFloat(this.state.paramData.discount_amount).toFixed(2) : 0}</Text>

                                </View>

                                {this.state.paramData && this.state.paramData.cardPaymentAmount ? this.state.paramData.cardPaymentAmount > 0 ?
                                    <View style={styles.billItem}>
                                        <View>
                                            <Text >{languageJSON.CardPaymentAmount}</Text>

                                        </View>
                                        <Text >  {this.state.settings.symbol}{this.state.paramData && this.state.paramData.cardPaymentAmount ? parseFloat(this.state.paramData.cardPaymentAmount).toFixed(2) : 0}</Text>

                                    </View>
                                    : null : null}
                                {this.state.paramData && this.state.paramData.cashPaymentAmount ? this.state.paramData.cashPaymentAmount > 0 ?
                                    <View style={styles.billItem}>
                                        <View>
                                            <Text >{languageJSON.CashPaymentAmount}</Text>

                                        </View>
                                        <Text>  {this.state.settings.symbol}{this.state.paramData && this.state.paramData.cashPaymentAmount ? parseFloat(this.state.paramData.cashPaymentAmount).toFixed(2) : 0}</Text>

                                    </View>
                                    : null : null}
                                {this.state.paramData && this.state.paramData.usedWalletMoney ? this.state.paramData.usedWalletMoney > 0 ?
                                    <View style={styles.billItem}>
                                        <View>
                                            <Text>{languageJSON.WalletPayment}</Text>

                                        </View>
                                        <Text >  {this.state.settings.symbol}{this.state.paramData && this.state.paramData.usedWalletMoney ? parseFloat(this.state.paramData.usedWalletMoney).toFixed(2) : 0}</Text>

                                    </View>
                                    : null : null}
                            </View>
                            <View style={styles.paybleAmtView}>
                                <Text style={styles.billTitle}>{languageJSON.grand_total}</Text>
                                <Text style={styles.billAmount2}>{this.state.settings.symbol}{this.state.paramData && this.state.paramData.customer_paid ? parseFloat(this.state.paramData.customer_paid).toFixed(2) : null}</Text>
                            </View>
                        </View>
                        : null : null}
                    {this.state.paramData && this.state.paramData.payment_status ? this.state.paramData.payment_status == "IN_PROGRESS" || this.state.paramData.payment_status == "PAID" || this.state.paramData.payment_status == "WAITING" ?
                        <View>
                            <View style={styles.paymentTextView}>
                                <Text style={styles.billTitle}>{languageJSON.payment_status}</Text>
                            </View>
                            {this.state.paramData && this.state.paramData.payment_status ?
                                <View style={styles.billOptions}>
                                    <View style={styles.billItem}>
                                        <Text style={styles.billName}>{languageJSON.payment_status}</Text>
                                        <Text style={styles.billAmount}>{this.state.paramData.payment_status == "IN_PROGRESS" || this.state.paramData.payment_status == "WAITING" ? "Yet to pay" : this.state.paramData.payment_status}</Text>

                                    </View>
                                    <View style={styles.billItem}>
                                        <Text style={styles.billName}>{languageJSON.pay_mode}</Text>
                                        <Text style={styles.billAmount}>{this.state.paramData.payment_mode ? this.state.paramData.payment_mode : null} {this.state.paramData.getway ? '(' + this.state.paramData.getway + ')' : null}</Text>
                                    </View>
                                </View>
                                : <View style={styles.billOptions}>
                                    <View style={styles.billItem}></View>
                                </View>}
                        </View>
                        : null : null}
                    {this.state.paramData ? this.state.paramData.payment_status == 'WAITING' ?

                        <View style={styles.locationView2}>
                            <Button
                                title={languageJSON.paynow_button}
                                loading={false}
                                loadingProps={{ size: "large", color: colors.GREEN.default }}
                                titleStyle={styles.buttonTitleText2}
                                onPress={() => { this.PayNow(this.state.paramData) }}
                                containerStyle={styles.paynowButton}
                            />
                            </View> : null : null}*/}
                </ScrollView>
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
    userDesc: {
        flexDirection: 'row',
        paddingHorizontal: 10,
        alignItems: 'center'
    },
    userView: {
        flexDirection: 'column',
        paddingLeft: 28,
    },
    locationView: {
        flex: 1,
        flexDirection: 'row',
        paddingHorizontal: 10,
        padding: 10,
        marginVertical: 14,
        justifyContent: "space-between",
    },
    locationView2: {
        flex: 1,
        flexDirection: 'row',
        padding: 10,
        marginVertical: 14,

    },

    location: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginVertical: 6
    },
    greenDot: {
        backgroundColor: colors.GREEN.default,
        width: 10,
        height: 10,
        borderRadius: 50,
        alignSelf: 'flex-start',
        marginTop: 5
    },
    redDot: {
        backgroundColor: colors.RED,
        width: 10,
        height: 10,
        borderRadius: 50,
        alignSelf: 'flex-start',
        marginTop: 5
    },
    address: {
        flexDirection: 'row',
        flexGrow: 1,
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        width: 0,
        marginLeft: 6
    },
    billView: {
        marginVertical: 5
    },
    billTitle: {
        fontSize: 18,
        color: colors.GREY.default,
        fontFamily: 'Roboto-Bold'
    },
    billOptions: {
        marginHorizontal: 10,
        marginVertical: 6
    },
    billItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginVertical: 15
    },
    billName: {
        fontSize: 16,
        fontFamily: 'Roboto-Regular',
        color: colors.GREY.default
    },
    billAmount: {
        fontSize: 16,
        fontFamily: 'Roboto-Medium',
        color: colors.GREY.default
    },
    discountAmount: {
        fontSize: 16,
        fontFamily: 'Roboto-Medium',
        color: colors.RED
    },

    billAmount2: {
        fontWeight: 'bold',
        fontSize: 18,
        fontFamily: 'Roboto-Bold',
        color: colors.GREY.default
    },
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: 2,
    },
    carNoStyle: {
        fontSize: 16,
        fontFamily: 'Roboto-Medium'
    },
    carNoStyleSubText: {
        fontSize: 16,
        fontFamily: 'Roboto-Regular',
        color: colors.GREY.default
    },
    textStyle: {
        fontSize: 16,
        fontFamily: 'Roboto-Medium'
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
    personStyle: {
        fontSize: 16,
        color: colors.BLACK,
        fontFamily: 'Roboto-Medium'
    },
    personTextView: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    ratingText: {
        fontSize: 16,
        color: colors.GREY.iconSecondary,
        marginRight: 8,
        fontFamily: 'Roboto-Regular'
    },
    avatarView: {
        marginVertical: 15
    },
    timeStyle: {
        fontFamily: 'Roboto-Regular',
        fontSize: 16,
        marginTop: 1
    },
    adressStyle: {
        marginLeft: 6,
        fontSize: 15,
        lineHeight: 20
    },
    billView: {
        paddingHorizontal: 14
    },
    billText: {
        fontFamily: 'Roboto-Bold'
    },
    taxColor: {
        color: colors.GREY.default
    },
    paybleAmtView: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10
    },
    iosView: {
        paddingVertical: 10
    },
    dashView: {
        width: width, height: 1
    },
    paymentTextView: {
        paddingHorizontal: 10
    },
    // callButtonStyle:{
    //     width:50+'%'
    // },
    callButtonContainerStyle1: {
        flex: 1,
        width: '80%',
        height: 100
    },
    callButtonContainerStyle2: {
        flex: 1,
        width: '80%',
        height: 100,
        paddingLeft: 10
    },
    paynowButton: {
        flex: 1,
        width: '80%',
        height: 150,
        paddingLeft: 10
    },
});