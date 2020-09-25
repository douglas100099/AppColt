import React from 'react';
import { Text, View, StyleSheet, Dimensions, FlatList, Modal, TouchableHighlight, TouchableOpacity, StatusBar, Image } from 'react-native';
import { Button, Header, Icon } from 'react-native-elements';
import Polyline from '@mapbox/polyline';
import MapView, { PROVIDER_GOOGLE, Marker, UrlTile } from 'react-native-maps';
import { colors } from '../common/theme';
import * as Location from 'expo-location';
import * as Permissions from 'expo-permissions';
var { width, height } = Dimensions.get('window');
import * as firebase from 'firebase'
var { height } = Dimensions.get('window');
var google;
import { RequestPushMsg } from '../common/RequestPushMsg';
import { google_map_key } from '../common/key';
import languageJSON from '../common/language';
import { Audio } from 'expo-av';
import Geocoder from 'react-native-geocoding';
import { Colors } from 'react-native/Libraries/NewAppScreen';

const soundObject = new Audio.Sound(); // SOM DO ALERTA

import * as TaskManager from 'expo-task-manager'; // DEFINE O GPS EM SEGUNDO PLANO

const LATITUDE_DELTA = 0.01; // DEFINE O LATITUDE PADRÃO
const LONGITUDE_DELTA = 0.01; // DEFINE O LONGITUDE PADRÃO

const LOCATION_TRACKING = 'location-tracking';

TaskManager.defineTask(LOCATION_TRACKING, async ({ data, error }) => {
    if (error) {
        console.log('LOCATION_TRACKING task ERROR:', error);
      return;
    }
    if (data) {
      const { locations } = data;
        let lat = locations[0].coords.latitude;
        let long = locations[0].coords.longitude;
        firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/location').update({
            lat: lat,
            lng: long,
            //add: responseJson.results[0].formatted_address
        })
    }
  });

export default class DriverTripAccept extends React.Component {

    setModalVisible(visible, data) {
        this.setState({
            modalVisible: visible,
            modalData: data
        });
    }


    constructor(props) {
        super(props);
        Geocoder.init(google_map_key);
        this._isMounted=false;
        this.state = {
            region: {
                latitude: 37.78825,
                longitude: -122.4324,
                latitudeDelta: 0.0143,
                longitudeDelta: 0.0134,
            },
            starCount: 5,
            geolocationFetchComplete: false,
            modalVisible: false,
            alertModalVisible: false,
            timer: 10,
            tomada: true,
            retirarsom: false,
            alertasom: false,
            coords: [],
            radio_props: [
                { label: languageJSON.cancel_reson_1, value: 0 },
                { label: languageJSON.cancel_reson_2, value: 1 },
                { label: languageJSON.cancel_reson_3, value: 2 },
                { label: languageJSON.cancel_reson_4, value: 3 },
                { label: languageJSON.cancel_reson_5, value: 4 }
            ],
            value: 0,
            tasklist: [],
            myLocation: {},
            driverDetails: null,
            curUid: '',
            id: 0,
            gotAddress: false,
            

        }
        this._getLocationAsync()
    }

    //checking booking status
    checking() {
        if (this.state.currentBId) {
            let curUid = firebase.auth().currentUser.uid
            let bookingId = this.state.currentBId;
            const userData = firebase.database().ref('users/' + curUid + '/my_bookings/' + bookingId + '/');
            userData.on('value', bookingDetails => {
                if (bookingDetails.val()) {
                    let curstatus = bookingDetails.val().status;
                    this.setState({ status: curstatus })
                }
            })
        }
    }


    // ESSE .ON AI PEGA E LER O VALOR DO BANCO QUANDO CHAMADO, E FICA ATUALIZANDO.
    getStatusDetails() {
        let ref = firebase.database().ref('users/' + this.state.curUid + '/driverActiveStatus/');
        ref.on('value', (snapshot) => {
            this.setState({
                statusDetails: snapshot.val()
            })
        })
    }

    onChangeFunction(){
        if(this.state.statusDetails == true){
            firebase.database().ref(`/users/`+this.state.curUid+'/').update({
                driverActiveStatus:false
            }).then(()=>{
                this.setState({driverActiveStatus:false});
            })
        }else if(this.state.statusDetails == false){
            firebase.database().ref(`/users/`+this.state.curUid+'/').update({
                driverActiveStatus:true
            }).then(()=>{
                this.setState({driverActiveStatus:true});
            })
        }
    }

    photoPerfil=() => {
        this.props.navigation.push('Profile');
    }

    carteira=() => {
        this.props.navigation.push('MyEarning');
        
    }
    getPhotoDriver() {
        let ref = firebase.database().ref('users/' + this.state.curUid + '/profile_image/');
        ref.on('value', (snapshot) => {
            this.setState({
                photoDriver: snapshot.val()
            })
        })
    }


    updateTimer(){
        const x = setInterval(() => {
            if(this.state.timer == 1){
                clearInterval(x)
                this.state.tomada == false
            }
            this.setState({timer: this.state.timer - 1})}, 1000)
            this.setState({timer: 10})
    }


    async alertAudio(){
        if(this.state.alertasom){
            await soundObject.loadAsync(require('../../assets/sounds/alerta.mp3'));
            await soundObject.playAsync();
            await soundObject.setIsLoopingAsync(true)
        }
        else if(this.state.retirarsom) {
            await soundObject.unloadAsync()
            this.setState({retirarsom: false})
        }
    }

    async componentDidMount() {
       await this.getRiders();
       await this.getPhotoDriver();
       await this.getStatusDetails();
       await this.getInfoEraning();
       await this.updateLocationPlano();
       this._isMounted=true;
       if(this.state.tomada){
            this.updateTimer()
       }
    }

    UNSAFE_componentWillMount() {
        //setInterval(this.updateLocation, 5000);
        //this.updateLocationPlano();
    }

    componentWillUnmount(){
        this._isMounted=false
    }

    updateLocationPlano = async () => {
        let { status } = await Permissions.askAsync(Permissions.LOCATION);
        console.log('ENTROU NO UPDATE')
        if (status === 'granted') {
            await Location.startLocationUpdatesAsync(LOCATION_TRACKING, {
                accuracy: Location.Accuracy.Highest,
                timeInterval: 5000,
                distanceInterval: 0,
                foregroundService: {
                    notificationTitle: 'Colt App',
                    notificationBody: 'Buscando Corridas'
                  },
                  pausesUpdatesAutomatically: false,
            });

            const hasStarted = await Location.hasStartedLocationUpdatesAsync(
                LOCATION_TRACKING
              );
              console.log('tracking started?', hasStarted);
        }
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
            await this.setState({ coords: coords })
            return coords
        }
        catch (error) {
            alert(error)
            return error
        }
    }

    getInfoEraning() {
        let userUid = firebase.auth().currentUser.uid;
        let ref = firebase.database().ref('bookings/');
        ref.once('value', allBookings => {
            if (allBookings.val()) {
                let data = allBookings.val();
                var myBookingarr = [];
                for (let k in data) {
                    if (data[k].driver == userUid) {
                        data[k].bookingKey = k
                        myBookingarr.push(data[k])
                    }
                }

                if (myBookingarr) {
                    this.setState({ myBooking: myBookingarr }, () => {
                        this.eraningCalculation()
                        //console.log('this.state.myBooking ==>',this.state.myBooking)
                    })

                }
            }
        })
    }

    eraningCalculation(){
       
        if(this.state.myBooking){
            let today =  new Date();
            let tdTrans = 0;
            for(let i=0;i<this.state.myBooking.length;i++){
                const {tripdate,driver_share} = this.state.myBooking[i];
                let tDate = new Date(tripdate);
                if(driver_share != undefined){
                    if(tDate.getDate() === today.getDate() && tDate.getMonth() === today.getMonth()){
                        tdTrans  = tdTrans + driver_share;
                        
                    }                                               
                }
            }
            this.setState({
                today:tdTrans,
                corridasDia: this.state.myBooking.length
            })
            //console.log('today- '+tdTrans +' monthly- '+ mnTrans + ' Total-'+ totTrans);

        }
    }

    
    _getLocationAsync = async () => {
        let { status } = await Permissions.askAsync(Permissions.LOCATION);
        if (status !== 'granted') {
            console.log('Permission to access location was denied');
        }
        let uid = firebase.auth().currentUser.uid;
        let location = await Location.getCurrentPositionAsync({ enableHighAccuracy: true, maximumAge: 1000, timeout: 2000 });
        if (location) {
            var pos = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            };
            if (pos) {
                var latlng = pos.latitude + ',' + pos.longitude;
                return fetch('https://maps.googleapis.com/maps/api/geocode/json?latlng=' + latlng + '&key=' + google_map_key)
                    .then((response) => response.json())
                    .then((responseJson) => {
                        if (responseJson.results[0] && responseJson.results[0].formatted_address) {
                            let address = responseJson.results[0].formatted_address;
                            firebase.database().ref('users/' + uid + '/location').update({
                                add: address,
                                lat: pos.latitude,
                                lng: pos.longitude
                            })
                            this.setState({ 
                                region: {
                                    latitude: pos.latitude,
                                    longitude: pos.longitude,
                                    latitudeDelta: 0.0143,
                                    longitudeDelta: 0.0134,
                                },
                                geolocationFetchComplete: true
                            })
                        } else {
                            alert(languageJSON.api_error)
                        }

                    })
                    .catch((error) => {
                        console.error(error);
                });

            }
        }
    };

    //get nearby riders function
    getRiders() {
        var curuid = firebase.auth().currentUser.uid;
        this.setState({ curUid: firebase.auth().currentUser.uid })
        let ref = firebase.database().ref('users/' + curuid + '/');
        ref.on('value', (snapshot) => {
            this.setState({ driverDetails: snapshot.val() })
            var jobs = [];
            if (snapshot.val() && snapshot.val().waiting_riders_list) {
                let waiting_riderData = snapshot.val().waiting_riders_list;
                for (let key in waiting_riderData) {
                    waiting_riderData[key].bookingId = key;
                    jobs.push(waiting_riderData[key]);
                }        
                this.setState({alertasom: true})
                this.alertAudio();
            }           
            this.setState({ tasklist: jobs.reverse()});          
            this.jobs = jobs;
        });
    }

    //get booking details function
    getBookingDetails() {
        let ref = firebase.database().ref('bookings/' + item.bookingId + '/');
        ref.on('value', (snapshot) => {
            this.setState({
                bookingDetails: snapshot.val()
            })
        })
    }

    // accept button press function
    onPressAccept(item) {
        var data = {
            carType: item.carType,
            customer: item.customer,
            customer_name: item.customer_name,
            otp: item.otp,
            distance: item.distance,
            driver: this.state.curUid,
            driver_image: this.state.driverDetails.profile_image ? this.state.driverDetails.profile_image : "",
            driver_name: this.state.driverDetails.firstName + ' ' + this.state.driverDetails.lastName,
            driver_contact: this.state.driverDetails.mobile,
            vehicle_number: this.state.driverDetails.vehicleNumber,
            // vehicleModelName: this.state.driverDetails.vehicleModel,
            driverRating: this.state.driverDetails.ratings ? this.state.driverDetails.ratings.userrating : "0",
            drop: item.drop,
            pickup: item.pickup,
            estimate: item.estimate,
            estimateDistance: item.estimateDistance,
            serviceType: item.serviceType,
            status: "ACCEPTED",
            total_trip_time: item.total_trip_time,
            trip_cost: item.trip_cost,
            trip_end_time: item.trip_end_time,
            trip_start_time: item.trip_start_time,
            tripdate: item.tripdate,
        }

        var riderData = {
            carType: item.carType,
            distance: item.distance,
            driver: this.state.curUid,
            driver_image: this.state.driverDetails.profile_image ? this.state.driverDetails.profile_image : "",
            driver_name: this.state.driverDetails.firstName + ' ' + this.state.driverDetails.lastName,
            driver_contact: this.state.driverDetails.mobile,
            vehicle_number: this.state.driverDetails.vehicleNumber,
            // vehicleModelName: this.state.driverDetails.vehicleModel,
            driverRating: this.state.driverDetails.ratings ? this.state.driverDetails.ratings.userrating : "0",
            drop: item.drop,
            otp: item.otp,
            pickup: item.pickup,
            estimate: item.estimate,
            estimateDistance: item.estimateDistance,
            serviceType: item.serviceType,
            status: "ACCEPTED",
            total_trip_time: item.total_trip_time,
            trip_cost: item.trip_cost,
            trip_end_time: item.trip_end_time,
            trip_start_time: item.trip_start_time,
            tripdate: item.tripdate,
        }

        let dbRef = firebase.database().ref('users/' + this.state.curUid + '/my_bookings/' + item.bookingId + '/');
        dbRef.update(data).then(() => {
            firebase.database().ref('bookings/' + item.bookingId + '/').update(data).then(() => {
                firebase.database().ref('bookings/' + item.bookingId).once('value', (snap) => {
                    let requestedDriverArr = snap.val().requestedDriver;
                    if (requestedDriverArr) {
                        for (let i = 0; i < requestedDriverArr.length; i++) {
                            firebase.database().ref('users/' + requestedDriverArr[i] + '/waiting_riders_list/' + item.bookingId + '/').remove();
                        }
                        this.setState({alertasom: false, retirarsom: true})
                        this.alertAudio();
                        this.props.navigation.navigate('DriverTripStart', { allDetails: item })
                    }
                    // console.log(snap.val().requestedDriver)
                })
            })
            this.setState({ currentBId: item.bookingId }, () => {
                this.checking();
                this.sendPushNotification(item.customer, item.bookingId, riderData.driver_name + languageJSON.accept_booking_request)
            })

        }).catch((error) => { console.log(error) })


        let userDbRef = firebase.database().ref('users/' + item.customer + '/my-booking/' + item.bookingId + '/'); userDbRef.update(riderData);
        let currentUserdbRef = firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/');
        currentUserdbRef.update({
            queue: true
        })


    }

    //ignore button press function
    onPressIgnore(item) {
        var arr = [];
        console.log(item.bookingId)
        firebase.database().ref('bookings/' + item.bookingId + '/').once('value', data => {
            if (data.val()) {
                let mainBookingData = data.val();
                console.log(mainBookingData)
                if (mainBookingData.requestedDriver) {
                    if (mainBookingData.requestedDriver.length == 1) {
                        alert("FOI REJEITADO")
                        arr.push(this.state.curUid)
                        firebase.database().ref(`bookings/` + item.bookingId + '/').update({
                            rejectedDrivers: arr,
                            status: "REJECTED",
                            //requestDriver: [],
                        })

                            .then(() => {
                                let userDbRef = firebase.database().ref('users/' + item.customer + '/my-booking/' + item.bookingId + '/');
                                userDbRef.update({
                                    status: "REJECTED",
                                });
                                this.sendPushNotification(item.customer, item.bookingId, languageJSON.booking_request_rejected)
                                this.setState({alertasom: false, retirarsom: true})
                                this.alertAudio();
                            })

                        firebase.database().ref('bookings/' + item.bookingId + '/requestedDriver/').remove();
                    }
                    else {
                        let arr = mainBookingData.requestedDriver.filter((item) => {
                            return item != this.state.curUid
                        })
                        firebase.database().ref('bookings/' + item.bookingId + '/').update({
                            requestedDriver: arr
                        })
                    }

                }
            }
        });

        firebase.database().ref('users/' + this.state.curUid + '/waiting_riders_list/' + item.bookingId + '/').remove().then(() => {
            this.setModalVisible(false, null)
        });

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
            <View style={styles.mainViewStyle}>
                {/* AQUI ENTRA TODOS OS BOTÕES FLUTUANTES DO MENU */}

                {/* MAPA */}
                
                {this.state.geolocationFetchComplete ?
                    <MapView
                        ref={ map => { this.map = map }}
                        style={styles.map}
                        provider={PROVIDER_GOOGLE}
                        showsUserLocation
                        showsMyLocationButton
                        followUserLocation
                        region={this.state.region}
                    >
                    </MapView>
                    : null}

                {/* BOTÃO MENU VOLTAR */}
                <View>
                    <TouchableOpacity style={styles.touchaVoltar} onPress={() => { this.props.navigation.toggleDrawer(); }}>
                        <Icon
                            name='md-menu'
                            type='ionicon'
                            size={25}
                            color={colors.BLACK}
                        />
                    </TouchableOpacity>
                </View>

                {/* BOTÃO GANHOS CENTRO */}
                <View style={{alignItems: 'center'}}>
                    <TouchableOpacity style={[styles.touchaGanhos, { borderColor: this.state.statusDetails ? colors.GREEN.light : colors.RED}]} onPress={() => { this.carteira() }}>
                        <Text style={styles.touchaValor}>R$ {this.state.today?parseFloat(this.state.today).toFixed(2):'0'}</Text>
                        <Text style={styles.touchaCorrida}>{this.state.corridasDia} CORRIDAS</Text>
                    </TouchableOpacity>
                </View>

                {/* BOTÃO FOTOS */}
                <View>
                    <TouchableOpacity style={styles.touchaFoto} onPress={() => { this.updateLocationPlano() }}>
                        <Image source={this.state.photoDriver?{uri:this.state.photoDriver}:require('../../assets/images/profilePic.png')} style={styles.imagemPerfil} />
                    </TouchableOpacity>
                </View>

                {/* BOTÃO LIGAR E DESLIGAR */}
                {this.state.alertasom == false ?
                <View style={{alignItems: 'center', flex: 1}}>
                    <TouchableOpacity style={[styles.btnOnOff, { backgroundColor: this.state.statusDetails ? colors.RED : colors.GREEN.light}]} onPress={() => { this.onChangeFunction(this.state.driverActiveStatus); }}>
                        <Text style={styles.textConectar}>{this.state.statusDetails ? 'DESCONECTAR' : 'CONECTAR'}</Text>
                    </TouchableOpacity>
                </View>
                :
                null
                }

                {/* MODAL ACEITAR E REJEITAR */}
                <View>
               <FlatList
                    data={this.state.tasklist}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item, index }) => {
                        return (
                            <Modal
                        animationType="slide"
                        transparent={true}
                        visible={true}
                        onRequestClose={() => {
                            alert("Modal has been closed.");
                        }}
                    >
                        <View style={styles.modalMain}>
                            <View style={styles.modalContainer}>
                                <View style={styles.tituloModalView}>
                                    <Text style={styles.txtTitulo}>Nova corrida</Text>
                                    <View style={styles.viewDetalhesTempo}>
                                        <View style={styles.tempoCorrida}>
                                            <View style={styles.iconBack}>
                                                <Icon
                                                    size={15}
                                                    name='schedule'
                                                    type='material'
                                                    color={colors.DEEPBLUE}
                                                />
                                            </View>
                                            <Text style={styles.txtTempo}>{item.estimateDistance}</Text>
                                        </View>
                                        <View style={styles.tempoKM}>
                                            <View style={styles.iconBack}>
                                                <Icon
                                                    size={15}
                                                    name='map-pin'
                                                    type='feather'
                                                    color={colors.DEEPBLUE}
                                                />
                                            </View>
                                            <Text style={styles.txtTempo}>{parseFloat(item.distance/1000).toFixed(2)}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.viewBtnRejeitar}>
                                        <TouchableOpacity style={styles.btnRejeitar} onPress={ () => {this.onPressIgnore(item)} }>
                                            <Text>{this.state.timer}</Text>
                                        </TouchableOpacity>
                                    </View>    
                                </View>
                                <View style={styles.viewEndereco}>
                                    <View style={styles.enderecoPartida}>
                                        <Icon
                                            size={15}
                                            name='arrow-right-circle'
                                            type='feather'
                                            color={colors.DEEPBLUE}
                                        />
                                        <Text style={styles.txtPartida}>{item.pickup.add}</Text>
                                    </View>
                                    <View style={styles.enderecoDestino}>
                                        <Icon
                                            size={15}
                                            name='arrow-down-circle'
                                            type='feather'
                                            color={colors.RED}
                                        />
                                        <Text style={styles.txtDestino}>{item.drop.add}</Text>
                                    </View>
                                </View>
                                <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                                    <View style={styles.imgModalView}>
                                        <Image source={this.state.photoDriver ? { uri: this.state.photoDriver } : require('../../assets/images/profilePic.png')} style={styles.imagemModal} />
                                        <Text style={styles.nomePessoa}>{item.customer_name}</Text>
                                    </View>
                                    <View style={styles.iconPgt}>
                                        <View style={styles.formaPgt}>
                                            <Icon
                                                size={14}
                                                name='credit-card'
                                                type='feather'
                                                color={colors.DEEPBLUE}
                                            />
                                        </View>
                                        <Text style={styles.txtTempo}>Dinheiro</Text>
                                    </View>
                                </View>
                                <View style={styles.viewBtn}>
                                    <TouchableOpacity style={styles.btnAceitar} onPress={() => { this.onPressAccept(item) }}>
                                        <Text style={styles.txtBtnAceitar}>Aceitar</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>
                        )
                    }
                    }
                />

                </View>
                {/*<FlatList
                    data={this.state.tasklist}
                    keyExtractor={(item, index) => index.toString()}
                    ListEmptyComponent={<View style={{ flex: 1, justifyContent: "center", alignItems: "center", height: height}}><Text style={styles.addressViewTextStyle}>{languageJSON.rider_not_here}</Text></View>}
                    renderItem={({ item, index }) => {
                        return (
                            <View style={styles.listItemView}>
                                <View style={styles.mapcontainer}>
                                    <MapView style={styles.map}
                                        provider={PROVIDER_GOOGLE}
                                        initialRegion={{
                                            latitude: item.pickup.lat,
                                            longitude: item.pickup.lng,
                                            latitudeDelta: 0.5022,
                                            longitudeDelta: 0.1821
                                        }}
                                    >
                                        <Marker
                                            coordinate={{ latitude: item.pickup.lat, longitude: item.pickup.lng }}
                                            title={item.pickup.add}
                                            description={languageJSON.pickup_location}
                                        />

                                        <Marker
                                            coordinate={{ latitude: item.drop.lat, longitude: item.drop.lng }}
                                            title={item.drop.add}
                                            description={languageJSON.drop_location}
                                            pinColor={colors.GREEN.default}
                                        />

                                        <MapView.Polyline
                                            coordinates={this.state.coords}
                                            strokeWidth={4}
                                            strokeColor={colors.BLUE.default}
                                        />

                                    </MapView>
                                </View>
                            </View>
                        )
                    }
                    }
                />
                 */}
            </View>

        )
    }



}

//Screen Styling
const styles = StyleSheet.create({

    // AQUI ENTRA O NOVO CSS // -----
    touchaVoltar: {
        position: 'absolute',
        width: 48,
        height: 48,
        borderRadius: 50,
        backgroundColor: colors.WHITE,
        elevation: 5,
        justifyContent:'center',
        top: StatusBar.currentHeight,
        left: 12,

    },

    touchaGanhos: {
        position: 'absolute',
        borderWidth: 2,
        justifyContent: 'center',
        alignItems:'center',
        width: width/3,
        height: 52,
        borderRadius: 50,
        backgroundColor: colors.WHITE,
        elevation: 5,
        top: StatusBar.currentHeight,
    },
    touchaValor:{
        fontFamily: 'Inter-Bold',
        fontSize: 18,
        color: colors.BLACK
    },

    touchaCorrida: {
        fontFamily: 'Inter-Bold',
        fontSize: 13,
        color: colors.GREY2,
    },

    touchaFoto: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        width: 50,
        height: 50,
        borderRadius: 50,
        backgroundColor: colors.WHITE,
        elevation: 5,
        top: StatusBar.currentHeight,
        right: 12,
    },

    imagemPerfil: {
        width: 48,
        height: 48,
        borderRadius: 50,
    },

    btnOnOff: {
        flex: 1,
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 1,
        borderRadius: 20,
        height: 60,
        width: width/1.53,
        bottom: 45,
    },

    textConectar: {
        fontFamily: 'Inter-Bold',
        fontSize: 20,
        color: colors.WHITE,
    },



    // CSS DO MODAL //

    modalMain: {
        flex: 1,
        backgroundColor: colors.GREY.background,
        justifyContent: 'flex-end',
        alignItems: 'center'
    },

    modalContainer: {
        width: '100%',
        backgroundColor: colors.WHITE,
        borderTopRightRadius: 20,
        borderTopLeftRadius: 20,
        flexDirection: 'column',
        paddingTop: 15,
        flex: 1,
        maxHeight: 345,
    },

    tituloModalView: {
        borderBottomWidth: 0.6,
        borderBottomColor: colors.GREY1,
        paddingBottom: 16,
        marginBottom: 5,
    },

    txtTitulo: {
        marginLeft: 15,
        fontFamily: 'Inter-Light',
        fontSize: 20,
        marginBottom: 8,
        color: colors.BLACK,
    },

    imgModalView: {
        marginTop: 10,
        marginLeft: 15,
        flexDirection:'row',
        justifyContent: 'center',
        alignItems: 'center',
    },

    imagemModal: {
        height: 35,
        width: 35,
        borderRadius: 50,
    },

    nomePessoa: {
        fontFamily: 'Inter-Bold',
        fontSize: 14,
        color: colors.BLACK,
        marginLeft: 8
    },

    viewEndereco: {
        marginTop: 15,
        justifyContent: 'center',
        borderBottomWidth: 0.6,
        borderBottomColor: colors.GREY1,
        paddingBottom: 16,
        marginBottom: 5,
    
    },

    enderecoPartida: {
        flexDirection: 'row',
        alignContent: 'center',
        alignItems: 'center',
        marginLeft: 15,
        marginBottom: 5,
    },

    txtPartida: {
        marginLeft: 4,
        fontFamily: 'Inter-Regular',
        fontSize: 13,
    },

    txtDestino: {
        marginLeft: 4,
        fontFamily: 'Inter-Regular',
        fontSize: 13,
    },

    enderecoDestino: {
        flexDirection: 'row',
        marginTop: 5,
        alignContent: 'center',
        alignItems: 'center',
        marginLeft: 15,
    },

    viewDetalhesTempo: {
        marginLeft: 15,
        flexDirection: "row",
    },

    tempoCorrida: {
        flexDirection: 'row',
        alignItems: 'center',
        width: 70,
        borderRadius: 50,
        height: 25,
        backgroundColor: colors.GREY1,
    },

    iconBack: {
        marginLeft: 2,
        height: 23,
        alignItems: 'center',
        justifyContent: 'center',
        width: 23,
        backgroundColor: colors.WHITE,
        borderRadius: 50,
    },

    txtTempo: {
        fontFamily: 'Inter-ExtraBold',
        opacity: 0.6,
        marginLeft: 5,
        fontSize: 12,
    },

    tempoKM: {
        marginLeft: 12,
        flexDirection: 'row',
        alignItems: 'center',
        width: 70,
        borderRadius: 50,
        height: 25,
        backgroundColor: colors.GREY1,
    },

    viewBtnRejeitar: {
        position: 'absolute',
        width: 50,
        height: 50,
        borderRadius: 50,
        justifyContent: 'center',
        alignSelf: 'flex-end',
        alignItems: 'center',
        right: 10,
    },

    btnRejeitar: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        borderRadius: 50,
        backgroundColor: colors.WHITE,
        elevation: 3,
    },

    formaPgt: {
        marginLeft: 2,
        height: 23,
        alignItems: 'center',
        justifyContent: 'center',
        width: 23,
        backgroundColor: colors.WHITE,
        borderRadius: 50,
    },

    iconPgt: {
        flexDirection: 'row',
        marginRight: 15,
        alignItems: 'center',
        width: 100,
        borderRadius: 50,
        height: 25,
        backgroundColor: colors.GREY1,
    },

    viewBtn: {
        position: 'absolute',
        alignContent: 'center',
        alignItems: 'center',
        marginTop: 15,
        bottom: 0,
        left: 0,
        right: 0,
    },

    btnAceitar: {
        width: '95%',
        borderRadius: 50,
        height: 50,
        backgroundColor: colors.DEEPBLUE,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },

    txtBtnAceitar: {
        fontFamily: 'Inter-Bold',
        color: colors.WHITE,
        fontSize: 18,
    },


    // FIM DO NOVO CSS // -------

    map: {
        flex: 1,
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden'
    },
    triangle: {
        width: 0,
        height: 0,
        backgroundColor: colors.TRANSPARENT,
        borderStyle: 'solid',
        borderLeftWidth: 9,
        borderRightWidth: 9,
        borderBottomWidth: 10,
        borderLeftColor: colors.TRANSPARENT,
        borderRightColor: colors.TRANSPARENT,
        borderBottomColor: colors.YELLOW.secondary,
        transform: [
            { rotate: '180deg' }
        ]
    },

    greenDot: {
        backgroundColor: colors.GREEN.default,
        width: 10,
        height: 10,
        borderRadius: 50
    },
    redDot: {
        backgroundColor: colors.DEEPBLUE,
        width: 10,
        height: 10,
        borderRadius: 50
    },

    mainViewStyle: {
        flex: 1,
        marginTop: StatusBar.currentHeight
    },
});