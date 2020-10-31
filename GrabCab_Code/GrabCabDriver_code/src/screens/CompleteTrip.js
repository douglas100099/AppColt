import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    AsyncStorage,
    Image,
    Modal
} from 'react-native';
import { Button, Icon } from 'react-native-elements';
import { colors } from '../common/theme';
import * as firebase from 'firebase'
import { farehelper } from '../common/fareCalculator';
import ActionSheet, { ActionSheetCustom } from 'react-native-actionsheet';
import Polyline from '@mapbox/polyline';
import distanceCalc from '../common/distanceCalc';
import * as Location from 'expo-location';
import getDirections from 'react-native-google-maps-directions'
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import * as Permissions from 'expo-permissions';
import { RequestPushMsg } from '../common/RequestPushMsg';
import { google_map_key } from '../common/key';
import dateStyle from '../common/dateStyle';
import CarMakerSVG from '../SVG/CarMarkerSVG';
import MarkerDropSVG from '../SVG/MarkerDropSVG';
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';

export default class DriverCompleteTrip extends React.Component {

    _isMounted = false;

    constructor(props) {
        super(props);
        this.state = {
            coords: [],
            loadingModal: false,
            region: {
                latitude: 0,
                longitude: 0,
                latitudeDelta: 0.0143,
                longitudeDelta: 0.0134,
                angle: 0,
            },
            followMap: true,
        }
    }

    _activate = () => {
        activateKeepAwake();
    };

    _deactivate = () => {
        deactivateKeepAwake();
    };

    async UNSAFE_componentWillMount() {
        const allDetails = this.props.navigation.getParam('allDetails')
        const regionUser = this.props.navigation.getParam('regionUser')
        this.setState({
            rideDetails: allDetails,
            region: regionUser,
            curUid: firebase.auth().currentUser.uid
        }, () => {
            //checking status
            this.checking()
        })
        const { status } = await Permissions.askAsync(Permissions.LOCATION);
        const gpsActived = await Location.hasServicesEnabledAsync()
        console.log(gpsActived)
        if (status === "granted" && gpsActived) {
            this._getLocationAsync();
        } else {
            this.setState({ error: "Locations services needed" });
            this.openAlert()
        }
    }


    componentDidMount() {
        this._isMounted = true;
        const startTime = this.props.navigation.getParam('startTime');
        const allDetails = this.props.navigation.getParam('allDetails')
        if (startTime && this._isMounted) {
            let time = startTime.toString()
            AsyncStorage.setItem('startTime', time)
            this.setState({ startTime: startTime })
        }
        if (this.state.rideDetails && this._isMounted) {
            setTimeout(() => {
                this.getDirectionss('"' + this.state.region.latitude + ',' + this.state.region.longitude + '"', '"' + this.state.rideDetails.drop.lat + ',' + this.state.rideDetails.drop.lng + '"')
            }, 500)
        }
        const Data = firebase.database().ref('rates/');
        Data.once('value', rates => {
            if (rates.val()) {
                var carTypeWiseRate = rates.val();
                for (var i = 0; i < carTypeWiseRate.car_type.length; i++) {
                    if (carTypeWiseRate.car_type[i].name == allDetails.carType) {
                        var rates = carTypeWiseRate.car_type[i];
                        this.setState({
                            rateDetails: rates
                        }, () => {
                            console.log('TARIFA DIRETO DO OVO ' + rates.tarifa_base)
                        })
                    }
                }
            }
        })

        firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/queue').set(true);

        this._activate();
    }

    componentWillUnmount() {
        if(this.location != undefined) {
            console.log('REMOVEU O WATCH COMPLETE TRIP')
            this.location.remove()
        }
        console.log('DESMONTOU A TELA COMPLETE TRIP')
        this._isMounted = false;
    }


    checking() {
        if (this.state.rideDetails.bookingId) {
            let curUid = firebase.auth().currentUser.uid
            let bookingId = this.state.rideDetails.bookingId;
            const userData = firebase.database().ref('users/' + curUid + '/my_bookings/' + bookingId + '/');
            userData.on('value', bookingDetails => {
                if (bookingDetails.val()) {
                    let curstatus = bookingDetails.val().status;
                    this.setState({ status: curstatus })
                }
            })
        }
    }

    _getLocationAsync = async () => {
        this.location = await Location.watchPositionAsync({
            accuracy: Location.Accuracy.Highest,
            distanceInterval: 1,
            timeInterval: 2000
        },
            newLocation => {
                let { coords } = newLocation;
                // console.log(coords);
                let region = {
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                    latitudeDelta: 0.045,
                    longitudeDelta: 0.045,
                    angle: coords.heading,
                };
                this.setState({ region: region });
                this.setLocationDB(region.latitude, region.longitude, region.angle)
            },
            error => console.log(error)
        );
        return this.location
    };

    setLocationDB(lat, lng, angle) {
        let uid = firebase.auth().currentUser.uid;
        var latlng = lat + ',' + lng;
        fetch('https://maps.googleapis.com/maps/api/geocode/json?latlng=' + latlng + '&key=' + google_map_key)
            .then((response) => response.json())
            .then((responseJson) => {
                if (responseJson.results[0] && responseJson.results[0].formatted_address) {
                    let address = responseJson.results[0].formatted_address;
                    firebase.database().ref('users/' + uid + '/location').update({
                        add: address,
                        lat: lat,
                        lng: lng,
                        angle: angle,
                    }).then(() => {
                        var keys = this.state.rideDetails.bookingId
                        firebase.database().ref('bookings/' + keys + '/current/').update({
                            lat: lat,
                            lng: lng,
                            angle: angle,
                        })    
                    })
                }
            }).catch((error) => {
                console.error(error);
                alert('Ops, tivemos um problema.');
            });
    }

    openAlert() {
        Alert.alert(
            'Localização necessária',
            'Para receber corrida e ficar online, precisamos de sua localização ativa, por favor ative-a em configurações.',
            [
                { text: 'OK', onPress: () => console.log('OK Pressed') }
            ],
            { cancelable: false }
        );
    }

    async getDirectionss(Sl, Dl) {
        try {
            let resp = await fetch(`https://maps.googleapis.com/maps/api/directions/json?origin=${Sl}&destination=${Dl}&key=${google_map_key}`)
            let respJson = await resp.json();
            let points = Polyline.decode(respJson.routes[0].overview_polyline.points);
            let coords = points.map((point, index) => {
                return {
                    latitude: point[0],
                    longitude: point[1]
                }
            })
            await this.setState({ coords: coords })
            return coords
        }
        catch (error) {
            alert('Ops, tivemos um problema ao marcar a direção no mapa.')
            return error
        }
    }

    checkDist(item) {
        this.setState({ rideDetails: item },
            () => {
                var location1 = [this.state.region.latitude, this.state.region.longitude];    //Rider Lat and Lang
                var location2 = [this.state.rideDetails.drop.lat, this.state.rideDetails.drop.lng];   //Driver lat and lang
                //calculate the distance of two locations
                var distance = distanceCalc(location1, location2);
                var originalDistance = (distance);
                if (originalDistance <= 0.8) {
                    this.onPressEndTrip(this.state.rideDetails)
                } else {
                    this.showActionSheet()
                }
            })
    }

    showActionSheet = () => {
        this.ActionSheet.show()
    }


    //End trip and fare calculation function
    async onPressEndTrip(item) {
        this.setState({ loadingModal: true })
        let location = await Location.getCurrentPositionAsync({});
        if (location) {
            var diff = ((this.state.startTime) - (new Date().getTime())) / 1000;
            diff /= (60 * 1);
            var totalTimeTaken = Math.abs(Math.round(diff));
            console.log(totalTimeTaken + 'Start Time da tela Comple trip')

            var pos = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            };

            let startLoc = '"' + this.state.rideDetails.pickup.lat + ', ' + this.state.rideDetails.pickup.lng + '"';
            let destLoc = '"' + pos.latitude + ', ' + pos.longitude + '"';

            var resp = await fetch(`https://maps.googleapis.com/maps/api/directions/json?origin=${startLoc}&destination=${destLoc}&key=${google_map_key}`)
            var respJson = await resp.json();
            var location1 = [this.state.rideDetails.drop.lat, this.state.rideDetails.drop.lng];    //Rider Lat and Lang
            var location2 = [pos.latitude, pos.longitude];   //Driver lat and lang
            //calculate the distance of two locations
            var distance = distanceCalc(location1, location2);
            var originalDistance = (distance);
            if (originalDistance <= 0.8) {
                let convenienceFee = (this.state.rideDetails.pagamento.estimate*this.state.rateDetails.convenience_fees/100);
                this.finalCostStore(item, this.state.rideDetails.pagamento.estimate, pos, respJson.routes[0].legs[0].distance.value, convenienceFee, 
                this.state.rideDetails.pagamento.discount_amount ? this.state.rideDetails.pagamento.discount_amount: 0, 
                this.state.rideDetails.pagamento.usedWalletMoney ? this.state.rideDetails.pagamento.usedWalletMoney: 0)
            } else {
                var fareCalculation = farehelper(respJson.routes[0].legs[0].distance.value, totalTimeTaken, this.state.rateDetails ? this.state.rateDetails : 1, this.state.rideDetails.pagamento.cancellValue);
                if (fareCalculation) {
                    this.finalCostStore(item, fareCalculation.grandTotal, pos, respJson.routes[0].legs[0].distance.value, fareCalculation.convenience_fees,
                        this.state.rideDetails.pagamento.discount_amount ? this.state.rideDetails.pagamento.discount_amount : 0,
                        this.state.rideDetails.pagamento.usedWalletMoney ? this.state.rideDetails.pagamento.usedWalletMoney : 0)
                }
            }
        } else {
            this.openAlert();
        }
    }

    locationAdd(pos) {
        var latlng = pos.latitude + ',' + pos.longitude;
        return fetch('https://maps.googleapis.com/maps/api/geocode/json?latlng=' + latlng + '&key=' + google_map_key)
    }

    //driver current location fetching
    finalCostStore(item, finalFare, pos, distance, convenience_fees, discount, wallet) {
        let curUid = firebase.auth().currentUser.uid
        let riderID = item.customer
        let bookingId = this.state.rideDetails.bookingId;

        let tripCost = finalFare;
        let customerPaid = (finalFare - discount);
        let cashPaymentAmount = (finalFare - discount - wallet);
        let driverShare = (finalFare - convenience_fees);
        let usedWalletMoney = item.pagamento.usedWalletMoney;
        
        if(item.pagamento.payment_mode == 'Carteira') {
            if(customerPaid != item.pagamento.usedWalletMoney){
                let refw = firebase.database().ref('users/' + riderID + '/walletBalance/');
                refw.once('value', checkWallet => {
                    let walletCheck = checkWallet.val()
                    if(walletCheck){
                        if(customerPaid > item.pagamento.usedWalletMoney){
                            let diferenca = customerPaid - item.pagamento.usedWalletMoney
                            if(walletCheck >= diferenca){
                                walletCheck = walletCheck - diferenca
                                usedWalletMoney = usedWalletMoney + diferenca
                                firebase.database().ref('users/' + riderID + '/').update({
                                    walletBalance: walletCheck
                                })
                            } else {
                                cashPaymentAmount = diferenca - walletCheck
                                usedWalletMoney = usedWalletMoney + walletCheck
                                walletCheck = 0
                                firebase.database().ref('users/' + riderID + '/').update({
                                    walletBalance: walletCheck
                                })
                            }
                        } else if (customerPaid < item.pagamento.usedWalletMoney){
                            let diferenca = item.pagamento.usedWalletMoney - customerPaid
                            walletCheck = walletCheck + diferenca
                            usedWalletMoney = usedWalletMoney - diferenca
                            firebase.database().ref('users/' + riderID + '/').update({
                                walletBalance: walletCheck
                            })
                        }
                    }
                })
            }
        }

        var pagamentoObj = {
            trip_cost: tripCost > 0 ? parseFloat(tripCost) : 0,
            convenience_fees: parseFloat(convenience_fees), 
            customer_paid: customerPaid > 0 ? customerPaid : 0,
            payment_status: "IN_PROGRESS",
            driver_share: driverShare,
            cashPaymentAmount: cashPaymentAmount > 0 ? cashPaymentAmount : 0,
            estimate: item.pagamento.estimate,
            payment_mode: item.pagamento.payment_mode,
            usedWalletMoney: usedWalletMoney,
            discount_amount: item.pagamento.discount_amount,
            promoCodeApplied: item.pagamento.promoCodeApplied,
            promoKey: item.pagamento.promoKey,
            cancellValue: item.pagamento.cancellValue,
        }
        var data = {
            status: "END",
            trip_end_time: new Date().toLocaleTimeString(dateStyle),
            finaldistance: distance,
            pagamento: pagamentoObj,
        }
        var riderData = {
            status: "END",
            trip_end_time: new Date().toLocaleTimeString(dateStyle),
            finaldistance: distance,
            pagamento: pagamentoObj,
        }

        console.log('Distancia Final: ' + data.finaldistance)
        console.log('Trip cost: ' + pagamentoObj.trip_cost)
        console.log('Motorista ganhou: ' + pagamentoObj.driver_share)
        console.log('Taxa: ' + pagamentoObj.convenience_fees)
        console.log('Valor Pago: ' + pagamentoObj.customer_paid)

        this.locationAdd(pos).then((response) => response.json()).then((responseJson) => {
            data.drop = { add: responseJson.results[0].formatted_address, lat: pos.latitude, lng: pos.longitude };
            riderData.drop = { add: responseJson.results[0].formatted_address, lat: pos.latitude, lng: pos.longitude };
            item.drop = { add: responseJson.results[0].formatted_address, lat: pos.latitude, lng: pos.longitude };
            if (data.drop) {
                this.saveData(item, data, riderData);
                this.updateDriverLocation(data.drop)
            }
        });
        firebase.database().ref('users/' + curUid + '/ganhos/' + bookingId + '/').update({
            ganho: pagamentoObj.driver_share,
            hora: new Date().toLocaleTimeString(dateStyle),
            data: new Date().toString(),
            taxa: pagamentoObj.convenience_fees,
        })
        
        // Cadastra a carteira no perfil do usuario
        /*if(this.rideDetails.payment_mode){
            // Armazena a TAXA, dinheiro, desconto e carteira da corrida
            let taxaCorrida = convenience_fees;
            let dinheiroCorrida = driverShare;
            let descontoCorrida = discount ? discount : 0;
            let carteiraCorrida = this.rideDetails.usedWalletMoney ? this.rideDetails.usedWalletMoney : 0;

            // Verifica se existe carteira criada no banco de dados
            let ref = firebase.database().ref('users/' + curUid + '/carteira/');
            ref.once('value', carteiraData => {
                let dataCarteira = carteiraData.val()
                if(dataCarteira){
                    // Armazena o valor que estava dentro de saldo
                    let saldoAnterior = dataCarteira;

                    if (this.rideDetails.payment_mode === 'Dinheiro'){
                        firebase.database().ref('users/' + curUid + '/carteira/' + bookingId + '/').update({
                            saldo: (saldoAnterior - taxaCorrida) + descontoCorrida
                        })
                    } else if (this.rideDetails.payment_mode === 'Carteira'){
                        firebase.database().ref('users/' + curUid + '/carteira/' + bookingId + '/').update({
                            saldo: saldoAnterior + dinheiroCorrida
                        })
                    } else if (this.rideDetails.payment_mode === 'Dinheiro/Carteira'){
                        
                    }
                }else {
                    firebase.database().ref('users/' + curUid + '/carteira/' + bookingId + '/').update({
                        saldo: taxaCorrida
                    })
                }
            })
        }*/
        AsyncStorage.removeItem('startTime');

    }

    //Final cost and status set to database
    saveData(item, data, riderData) {
        let dbRef = firebase.database().ref('users/' + this.state.curUid + '/my_bookings/' + item.bookingId + '/');
        dbRef.update(data).then(() => {
            firebase.database().ref('bookings/' + item.bookingId + '/').update(data).then(() => {
                let userDbRef = firebase.database().ref('users/' + item.customer + '/my-booking/' + item.bookingId + '/');
                userDbRef.update(riderData).then(() => {
                    this.setState({ loadingModal: false })
                    this.props.navigation.replace('DriverFare', { allDetails: item, trip_cost: data.pagamento.trip_cost, trip_end_time: data.trip_end_time })
                    this.sendPushNotification(item.customer)
                })
            })
        })
    }

    //update driver location
    updateDriverLocation(location) {
        firebase.database().ref('users/' + this.state.curUid + '/location').update({
            add: location.add,
            lat: location.lat,
            lng: location.lng
        })
    }
    sendPushNotification(customerUID) {
        const customerRoot = firebase.database().ref('users/' + customerUID);
        customerRoot.once('value', customerData => {
            if (customerData.val()) {
                let allData = customerData.val()
                RequestPushMsg(allData.pushToken ? allData.pushToken : null, 'O motorista chegou ao local de destino')
            }
        })
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
                    <View style={{ width: '85%', backgroundColor: colors.WHITE, borderRadius: 10, flex: 1, maxHeight: 280 }}>
                        <View style={{ alignItems: 'center', flexDirection: 'column', flex: 1, justifyContent: "center" }}>
                            <Image
                                style={{ backgroundColor: colors.TRANSPARENT, resizeMode: 'contain', flex: 1 }}
                                source={require('../../assets/images/loaderCar.gif')}
                            />
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: colors.BLACK, fontSize: 20, fontFamily: 'Inter-Bold' }}>Calculando preço, aguarde.</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        )
    }

    // google navigations now it not implemented in client side
    handleGetDirections(allDetails) {
        const data = {
            source: {
                latitude: this.state.region.latitude,
                longitude: this.state.region.longitude
            },
            destination: {
                latitude: allDetails.drop.lat,
                longitude: allDetails.drop.lng
            },
            params: [
                {
                    key: "travelmode",
                    value: "driving"        // may be "walking", "bicycling" or "transit" as well
                },
                {
                    key: "dir_action",
                    value: "navigate"       // this instantly initializes navigation using the given travel mode
                }
            ],
        }

        getDirections(data)
    }

    checkMap() {
        if (this.state.followMap && this.state.region) {
            return this.state.region;
        }
    }

    centerFollowMap() {
        this.map.animateToRegion(this.state.region, 500)
        setTimeout(() => { this.setState({ followMap: true, fitCordinates: false }) }, 1100)
    }

    animateToDestination() {
        this.setState({ fitCordinates: true, followMap: false })
        setTimeout(() => {
            this.map.fitToCoordinates([{ latitude: this.state.region.latitude, longitude: this.state.region.longitude }, { latitude: this.state.rideDetails.drop.lat, longitude: this.state.rideDetails.drop.lng }], {
                edgePadding: { top: 80, right: 65, bottom: 50, left: 50 },
                animated: true,
            })
        }, 200);
    }


    render() {
        return (
            <View style={styles.containerView}>
                <View>
                    <ActionSheetCustom
                        ref={o => this.ActionSheet = o}
                        style={styles}
                        title={<Text style={{ color: colors.BLACK, fontSize: 20, fontFamily: 'Inter-Bold' }}>Longe do destino</Text>}
                        message={<Text style={{ color: colors.BLACK, fontSize: 14, fontFamily: 'Inter-Regular', textAlign: 'center' }}>Você está distante do ponto de destino, tem certeza que deseja finalizar a corrida?</Text>}
                        options={['Continuar', 'Voltar']}
                        cancelButtonIndex={1}
                        destructiveButtonIndex={0}
                        onPress={(index) => {
                            if (index == 0) {
                                this.onPressEndTrip(this.state.rideDetails)
                            } else {
                                //console.log('actionsheet close')
                            }
                        }}
                    />
                </View>
                <View style={{ flex: 1 }}>
                    <MapView
                        ref={map => { this.map = map }}
                        style={styles.map}
                        rotateEnabled={false}
                        provider={PROVIDER_GOOGLE}
                        showsUserLocation={false}
                        showsCompass={false}
                        showsScale={false}
                        loadingEnabled
                        showsMyLocationButton={false}
                        region={this.checkMap()}
                    >
                        {this.state.region ?
                        <Marker.Animated
                            coordinate={{ latitude: this.state.region ? this.state.region.latitude : 0.00, longitude: this.state.region ? this.state.region.longitude : 0.00 }}
                            style={{ transform: [{ rotate: this.state.region.angle + "deg" }] }}
                            anchor={{ x: 0, y: 0 }}
                        >
                            <CarMakerSVG
                                width={45}
                                height={45}
                            />
                        </Marker.Animated>
                        : null}
                        <Marker.Animated
                            coordinate={{ latitude: this.state.rideDetails.drop.lat, longitude: this.state.rideDetails.drop.lng, }}
                            anchor={{ x: 0, y: 0 }}
                        >
                            <MarkerDropSVG
                                width={45}
                                height={45} 
                            />
                        </Marker.Animated>
                        <MapView.Polyline
                            coordinates={this.state.coords}
                            strokeWidth={3}
                            strokeColor={colors.DEEPBLUE}
                        />

                    </MapView>
                    <TouchableOpacity style={styles.iconeMap} onPress={() => { this.centerFollowMap() }}>
                        <Icon
                            name="crosshair"
                            type="feather"
                            size={25}
                            color={colors.BLACK}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconeFit} onPress={() => { this.animateToDestination() }}>
                        <Icon
                            name="map-pin"
                            type="feather"
                            size={25}
                            color={colors.BLACK}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconeNav} onPress={() => { this.handleGetDirections(this.state.rideDetails) }}>
                        <Icon
                            name="navigation"
                            type="feather"
                            size={25}
                            color={colors.BLACK}
                        />
                    </TouchableOpacity>
                </View>
                <View style={styles.buttonViewStyle}>
                    <Button
                        title='Finalizar corrida'
                        onPress={() => {
                            this.checkDist(this.state.rideDetails)
                        }}
                        titleStyle={styles.titleViewStyle}
                        buttonStyle={styles.buttonStyleView}
                    />
                </View>
                {this.loading()}
            </View>
        );
    }
}

//Screen Styling
const styles = StyleSheet.create({
    containerView: {
        flex: 1,
        //marginTop: StatusBar.currentHeight
    },
    textContainer: {
        textAlign: "center",
        fontSize: 16.2,
        color: colors.BLUE.default.dark,
        fontFamily: 'Roboto-Medium',
        lineHeight: 22
    },
    headerStyle: {
        backgroundColor: colors.GREY.default,
        borderBottomWidth: 0
    },
    headerTitleStyle: {
        color: colors.WHITE,
        fontFamily: 'Roboto-Bold',
        fontSize: 20
    },
    segment1: {
        width: '97.4%',
        flex: 1,
        justifyContent: 'center',
        borderRadius: 10,
        backgroundColor: colors.WHITE,
        marginLeft: 5,
        marginRight: 5,
        marginTop: 5,
        paddingTop: 12,
        paddingBottom: 12,
        paddingRight: 8,
        paddingLeft: 8
    },
    map: {
        flex: 1,
        ...StyleSheet.absoluteFillObject,
    },
    segment2: {
        flex: 10,
        width: '97.4%',
        alignSelf: 'center',
        borderRadius: 10,
        backgroundColor: colors.WHITE,
        marginLeft: 5,
        marginRight: 5,
        marginTop: 5,
        paddingTop: 12,
        paddingBottom: 12,
        paddingRight: 8,
        paddingLeft: 8,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        position: 'relative'
    },
    segment3: {
        flex: 2,
        borderRadius: 10,
        marginLeft: 5,
        marginRight: 5,
        marginTop: 5,
        marginBottom: 5,
        paddingTop: 3,
        paddingBottom: 3,
        paddingRight: 8,
        paddingLeft: 8,
        alignItems: 'center',

    },
    map: {
        flex: 1,
        ...StyleSheet.absoluteFillObject,
    },
    buttonViewStyle: {
        justifyContent: 'flex-end',
        maxHeight: 70,
    },
    innerStyle: {
        marginLeft: 10,
        marginRight: 10
    },
    buttonStyleView: {
        backgroundColor: colors.DEEPBLUE,
        alignItems: 'center',
        justifyContent: 'center',
        borderColor: colors.TRANSPARENT,
        borderWidth: 0,
        borderRadius: 0,
        elevation: 0,
        height: 70,
    },
    titleViewStyle: {
        fontFamily: 'Inter-Bold',
        fontSize: 16,
        color: colors.WHITE,
    },

    iconeMap: {
        height: 40,
        width: 40,
        borderRadius: 50,
        position: 'absolute',
        backgroundColor: colors.WHITE,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        bottom: 45,
        right: 22,
    },

    iconeFit: {
        height: 40,
        width: 40,
        borderRadius: 50,
        position: 'absolute',
        backgroundColor: colors.WHITE,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        bottom: 100,
        right: 22,
    },

    iconeNav: {
        height: 40,
        width: 40,
        borderRadius: 50,
        position: 'absolute',
        backgroundColor: colors.WHITE,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        top: 30,
        right: 22,
    },

});
