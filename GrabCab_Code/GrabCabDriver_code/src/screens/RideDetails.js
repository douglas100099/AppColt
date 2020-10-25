import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableWithoutFeedback,
    ImageBackground,
    ScrollView,
    Dimensions,
    TouchableOpacity,
    Image,
    Platform,
    AsyncStorage
} from 'react-native';
import Polyline from '@mapbox/polyline';
var { height } = Dimensions.get('window');
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import { Header, Rating, Avatar, Button, Icon } from 'react-native-elements';
import Dash from 'react-native-dash';
import * as firebase from 'firebase';
import { colors } from '../common/theme';
import { google_map_key } from '../common/key';
import languageJSON from '../common/language';
var { width } = Dimensions.get('window');

export default class RideDetails extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            coords: [],
            intialregion: {},
            starCount: null,
            infoVisible: false,
            currency: {
                code: '',
                symbol: ''
            }
        }
        this.getRideDetails = this.props.navigation.getParam('data');
        //console.log(this.getRideDetails)
        this._retrieveCurrency();
    }

    _retrieveCurrency = async () => {
        try {
            const value = await AsyncStorage.getItem('currency');
            if (value !== null) {
                this.setState({ currency: JSON.parse(value) });
            }
        } catch (error) {
            console.log("Asyncstorage issue 5");
        }
    };

    componentDidMount() {
        if (this.getRideDetails) {

            this.setState({
                paramData: this.getRideDetails,
                intialregion: {
                    latitude: this.getRideDetails.pickup.lat,
                    longitude: this.getRideDetails.pickup.lng,
                    latitudeDelta: 0.9922,
                    longitudeDelta: 0.9421,
                },
                curUid: firebase.auth().currentUser.uid,
                payButtonShow: (this.getRideDetails.payment_status == 'DUE' || this.getRideDetails.payment_status == 'IN_PROGRESS' || this.getRideDetails.status == 'ACCEPTED') ? true : false
            }, () => {
                //console.log(this.state.paramData.rating);
                this.getDirections('"' + this.state.paramData.pickup.lat + ',' + this.state.paramData.pickup.lng + '"', '"' + this.state.paramData.drop.lat + ',' + this.state.paramData.drop.lng + '"');
                this.forceUpdate();
            })


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
            this.setState({ coords: coords })
            return coords
        }
        catch (error) {
            alert(error)
            return error
        }
    }

    //go back
    goBack() {
        this.props.navigation.replace('RideList');
    }

    info = () => {
        if (this.state.infoVisible) {
            this.setState({ infoVisible: false })
        } else {
            this.setState({ infoVisible: true })
        }

    }

    dataAtualFormatada() {
        var data = new Date(this.getRideDetails.tripdate),
            dia = data.getDate().toString().padStart(2, '0'),
            mes = (data.getMonth() + 1).toString().padStart(2, '0'), 
            ano = data.getFullYear();
        return dia + "/" + mes + "/" + ano;
    }

    render() {
        return (
            <View style={styles.mainView}>
                <View style={styles.header}>
                    <Text style={{ fontSize: 20, fontFamily: 'Inter-Bold', color: colors.BLACK, textAlign: 'center' }}>Detalhes da corrida</Text>
                    <View style={{ position: 'absolute', zIndex: 999, left: 20 }}>
                        <TouchableOpacity style={{ height: 35, width: 35, borderRadius: 100, backgroundColor: colors.WHITE, elevation: 4, }} onPress={() => { this.props.navigation.goBack(); }}>
                            <Icon
                                name='ios-arrow-dropleft-circle'
                                size={35}
                                type='ionicon'
                                color={colors.BLACK}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={styles.mainMap}>
                    <Text style={{}}>{this.state.paramData ? this.dataAtualFormatada()
                        : null}</Text>
                    <View style={styles.viewEndereco}>
                        <View style={styles.endereco}>
                            <View style={styles.partida}>
                                <Text style={styles.txtHrfim}>{this.state.paramData ? this.state.paramData.trip_start_time : null}</Text>
                                <Icon
                                    name='arrow-right-circle'
                                    size={15}
                                    type='feather'
                                    color={colors.DEEPBLUE}
                                />
                                <Text style={styles.txtPartida}>{this.state.paramData ? this.state.paramData.pickup.add : null}</Text>
                            </View>
                            <View style={styles.destino}>
                                <Text style={styles.txtHrfim}>{this.state.paramData ? this.state.paramData.trip_end_time : null}</Text>
                                <Icon
                                    name='arrow-down-circle'
                                    size={15}
                                    type='feather'
                                    color={colors.RED}
                                />
                                <Text style={styles.txtPartida}>{this.state.paramData ? this.state.paramData.drop.add : null}</Text>
                            </View>
                        </View>
                    </View>
                </View>
                <View style={styles.viewDriver}>
                    <View style={styles.viewPassageiro}>
                        <Text style={styles.txtPassageiro}>Passageiro</Text>
                    </View>
                    <View style={styles.viewInfoPassageiro}>
                        <View style={styles.viewSubInfo}>
                            <View style={styles.photoPassageiro}>
                                <Image source={this.state.paramData ? { uri: this.state.paramData.imageRider } : require('../../assets/images/profilePic.png')} style={styles.imagemPerfil} />
                            </View>
                            <View style={styles.infoPassageiro}>
                                <Text style={styles.txtNomePassageiro}>{this.state.paramData ? this.state.paramData.customer_name : null}</Text>
                                <View style={{ flexDirection: 'row' }}>
                                    <Icon
                                        name='ios-star'
                                        size={18}
                                        type='ionicon'
                                        color={colors.YELLOW.primary}
                                    />
                                    <Text style={{ fontSize: 14, fontFamily: 'Inter-Regular', color: colors.BLACK, marginLeft: 5, }}>5.0</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
                <View style={styles.viewPgt}>
                    <View style={styles.viewPagamento}>
                        <Text style={styles.txtPagamento}>Pagamento</Text>
                    </View>
                    <View style={styles.viewInfosPgt}>
                        <View style={styles.mainPgt}>
                            <View style={{ flexDirection: 'row' }}>
                                <Icon
                                    name='ios-cash'
                                    size={25}
                                    type='ionicon'
                                    color={colors.DEEPBLUE}
                                />
                                <Text style={styles.txtMetodo}>{this.state.paramData ? this.state.paramData.metodoPagamento : 'Indefinido'}</Text>
                            </View>
                            <Text style={styles.txtDinheiro}>R$ {this.state.paramData ? this.state.paramData.trip_cost : ' 0'}</Text>
                        </View>
                    </View>
                </View>
                <View style={styles.viewBtn}>
                    <View style={{ flex: 0.8, justifyContent: 'flex-end' }}>
                        <TouchableOpacity style={styles.btn}>
                            <Text style={{ fontSize: 16, color: colors.WHITE, fontFamily: 'Inter-Bold' }}>Relatar problema</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
            /*            
            <View style={styles.mainView}>
                <Header 
                    backgroundColor={colors.GREY.default}
                    leftComponent={{icon:'ios-arrow-back', type:'ionicon', color: colors.WHITE, size: 30, component: TouchableWithoutFeedback,onPress: ()=>{this.goBack()} }}
                    centerComponent={<Text style={styles.headerTitleStyle}>{languageJSON.booking_details}</Text>}
                    // rightComponent={{icon:'ios-notifications', type:'ionicon', color: colors.WHITE, size: 30, component: TouchableWithoutFeedback,onPress: ()=>{this.props.navigation.navigate('Notifications');} }}
                    containerStyle={styles.headerStyle}
                    innerContainerStyles={{marginLeft:10, marginRight: 10}}
                />  
                <ScrollView>
                    <View style={styles.mapView}>
                        <View style={styles.mapcontainer}>
                            <MapView style={styles.map} 
                                provider={PROVIDER_GOOGLE}
                                region={{
                                    latitude:(this.state.intialregion.latitude?this.state.intialregion.latitude:22), 
                                    longitude:(this.state.intialregion.longitude?this.state.intialregion.longitude:88), 
                                    latitudeDelta: 0.9922,
                                    longitudeDelta: 1.9421
                                }}
    
                            >
                                <Marker
                                    coordinate={{latitude:this.state.paramData?(this.state.paramData.pickup.lat):0.00, longitude: this.state.paramData?(this.state.paramData.pickup.lng):0.00}}
                                    title={'pick-up location'}
                                    description={this.state.paramData?this.state.paramData.pickup.add:null}
                                />

                                <Marker
                                    coordinate={{latitude: this.state.paramData?(this.state.paramData.drop.lat):0.00, longitude: this.state.paramData?(this.state.paramData.drop.lng):0.00}}
                                    title={'drop location'}
                                    description={this.state.paramData?this.state.paramData.drop.add:null}
                                    pinColor={colors.GREEN.default}
                                />

                                <MapView.Polyline 
                                    coordinates={this.state.coords?this.state.coords:{latitude:0.00,longitude:0.00}}
                                    strokeWidth={4}
                                    strokeColor={colors.BLUE.default}
                                />

                            </MapView>
                        </View>
                    </View>      
                    <View style={styles.rideDesc}>
                        <View style={styles.userDesc}>
                               
                                {this.state.paramData?
                                    this.state.paramData.driver_image != ''?
                                        <Avatar
                                        size="small"
                                        rounded
                                        source={{uri:this.state.paramData.driver_image}}
                                        activeOpacity={0.7}
                                        /> 
                                    : this.state.paramData.driver_name != ''?    
                                    <Avatar
                                    size="small"
                                    rounded
                                    source={require('../../assets/images/profilePic.jpg')}
                                    activeOpacity={0.7}
                                    />:null
                                :null}               
                            <View style={styles.userView}>
                                <Text style={styles.personStyle}>{this.state.paramData ? this.state.paramData.driver_name : ""}</Text>
                                <View style={styles.personTextView}>
                                {this.state.paramData && this.state.paramData.rating?<Text style={styles.ratingText}>{languageJSON.you_rate_text}</Text>:<Text style={styles.ratingText}>{languageJSON.no_rated_text}</Text>}
                                    {this.state.paramData && this.state.paramData.rating?
                                    <Rating
                                        showRating
                                        type="star"
                                        startingValue={this.state.paramData.rating}
                                        readonly
                                        imageSize={15}
                                        onFinishRating={this.ratingCompleted}
                                        style={{ paddingVertical: 10 }}
                                        showRating={false}
                                    />
                                    :null}
                                </View>
                            </View>
                        </View>
                        
                        <View style={styles.userDesc}>
                            <Avatar
                                size="small"
                                rounded
                                source={require('../../assets/images/fareMetar.png')}
                                activeOpacity={0.7}
                                avatarStyle={{backgroundColor: colors.WHITE}}
                            />
                            <View style={styles.userView}>
                                <Text style={styles.textStyle}>{this.state.currency.symbol} {this.state.paramData && this.state.paramData.trip_cost>0?parseFloat(this.state.paramData.trip_cost).toFixed(2):this.state.paramData && this.state.paramData.estimate?this.state.paramData.estimate:0 }</Text>
                            </View>
                        </View>
                    </View> 
                    <View style={styles.locationView}>
                        <View style={styles.location}>
                            <View>
                                <Text style={styles.timeStyle}>{ this.state.paramData ? this.state.paramData.trip_start_time : ""}</Text>
                            </View>
                            <View style={styles.address}>
                                <View style={styles.redDot} />
                                <Text style={styles.adressStyle}>{ this.state.paramData ? this.state.paramData.pickup.add : ""}</Text>
                            </View>
                        </View>
                        <View style={styles.location}>
                            <View>
                                <Text style={styles.timeStyle}>{ this.state.paramData ? this.state.paramData.trip_end_time : ""}</Text>
                            </View>
                            <View style={styles.address}>
                                <View style={styles.greenDot} />
                                <Text style={styles.adressStyle}>{ this.state.paramData ? this.state.paramData.drop.add : ""}</Text>
                            </View>
                        </View>
                    </View>  
                    {this.state.paramData && this.state.paramData.payment_status?this.state.paramData.payment_status == "IN_PROGRESS" || this.state.paramData.payment_status == "PAID" || this.state.paramData.payment_status == "WAITING"? 
                    <View style={styles.billView}>
                        <View style={styles.billView}>
                            <Text style={styles.billTitle}>{languageJSON.bill_details}</Text>
                        </View>
                        <View style={styles.billOptions}>
                            <View style={styles.billItem}>
                                <Text style={styles.billName}>{languageJSON.your_trip}</Text>
                                <Text style={styles.billAmount}>{this.state.paramData ? this.state.currency.symbol + parseFloat(this.state.paramData.trip_cost).toFixed(2) : "0"}</Text>
                            </View>
                            <View style={styles.billItem}>
                                <View>
                                    <Text style={[styles.billName, styles.billText]}>{languageJSON.convenienceFee}</Text>
                                    <Text style={styles.taxColor}>{languageJSON.include_tax}</Text>
                                </View>
                                <Text style={styles.billAmount}>{this.state.paramData && this.state.paramData.convenience_fees? '-'+ this.state.currency.symbol + parseFloat(this.state.paramData.convenience_fees).toFixed(2) : "0"}</Text>
                            </View>
                        </View>
                        <View style={styles.paybleAmtView}>
                            <Text style={[styles.billTitle,{color:'green'}]}>{languageJSON.total_payable}</Text>
                            <Text style={[styles.billTitle,{color:'green'}]}>{this.state.paramData && this.state.paramData.driver_share? this.state.currency.symbol + parseFloat(this.state.paramData.driver_share).toFixed(2) : "0"}</Text>
                        </View>
                    </View>
                    :null:null}

                    <View>

                    {this.state.paramData && this.state.paramData.payment_status?this.state.paramData.payment_status == "IN_PROGRESS" || this.state.paramData.payment_status == "PAID" || this.state.paramData.payment_status == "WAITING"?
                        <View>
                            <View style={styles.iosView}>
                                {
                                Platform.OS=='ios' ?
                                    <ImageBackground source={require('../../assets/images/dash.png')}
                                        style={styles.backgroundImage}
                                        resizeMode= {Platform.OS=='ios'?'repeat':'stretch'}>
                                    </ImageBackground>
                                    :
                                    <Dash style={styles.dashView}/>
                                }
                            </View>

                            <View style={styles.paymentTextView}>
                                <Text style={styles.billTitle}>{languageJSON.payment_info}</Text>
                            </View>
                            <View style={styles.billOptions}>
                                <View style={styles.billItem}>  
                                    <Text style={styles.billAmount}>{languageJSON.paymentStatus}</Text>
                                    <Text style={styles.billAmount}>{this.state.paramData ? this.state.paramData.payment_status : ""}</Text>
                                </View>
                                <View style={styles.billItem}>
                                    <Text style={styles.billAmount}>{languageJSON.payment_mode}</Text>
                                    <Text style={styles.billAmount}>{this.state.paramData ? this.state.paramData.payment_mode : ""}</Text>
                                </View>
                                <View style={styles.billItem}>  
                                    <View style={{flexDirection:'row'}}>
                                        <Text style={[styles.billAmount,{fontSize:20,color:'green'}]}>{languageJSON.customer_payable}</Text> 
                                        <Icon
                                            name='info'
                                            type='Foundation'
                                            color={colors.YELLOW.primary}
                                            containerStyle={{top:2}}
                                            onPress={this.info}
                                            size={20}
                                        />
                                    </View>
                                    <Text style={[styles.billAmount,{fontSize:20,color:'green'}]}>{this.state.paramData &&  this.state.paramData.customer_paid ? this.state.currency.symbol + this.state.paramData.customer_paid.toFixed(2) : this.state.currency.symbol + 0}</Text>
                                </View>
                                {this.state.infoVisible?
                                <View style={{flexDirection:'column'}}>  
                                    {this.state.paramData &&  this.state.paramData.cashPaymentAmount ?<Text style={styles.payDetails}>{languageJSON.CashPaymentAmount}  {this.state.paramData &&  this.state.paramData.cashPaymentAmount ? this.state.currency.symbol + parseFloat(this.state.paramData.cashPaymentAmount).toFixed(2) :this.state.currency.symbol + 0}</Text>:null}
                                    {this.state.paramData &&  this.state.paramData.cardPaymentAmount ?<Text style={styles.payDetails}>{languageJSON.CardPaymentAmount}  {this.state.paramData &&  this.state.paramData.cardPaymentAmount ? this.state.currency.symbol + parseFloat(this.state.paramData.cardPaymentAmount).toFixed(2) : this.state.currency.symbol + 0}</Text>:null}
                                    {this.state.paramData &&  this.state.paramData.usedWalletMoney ? <Text style={styles.payDetails}>{languageJSON.WalletPayment}       {this.state.paramData &&  this.state.paramData.usedWalletMoney ? this.state.currency.symbol + parseFloat(this.state.paramData.usedWalletMoney).toFixed(2) : this.state.currency.symbol + 0}</Text>:null}
                                </View>:null}
                                <View style={styles.billItem}>
                                    <Text style={styles.billAmount}>{languageJSON.discount_amount}</Text>
                                    <Text style={styles.billAmount}>{this.state.paramData && this.state.paramData.discount_amount ? this.state.currency.symbol + parseFloat(this.state.paramData.discount_amount).toFixed(2) :  this.state.currency.symbol + 0}</Text>
                                </View>
                            </View>
                        </View>
                        :null:null}

                        {
                            this.state.payButtonShow ?
                            <Button 
                                title={languageJSON.go_to_booking}
                                titleStyle={{fontFamily: 'Roboto-Bold',}}
                                onPress={() => {
                                    this.trackNow(this.state.paramData);
                                }}
                                buttonStyle={styles.myButtonStyle}
                            />
                            :
                            null
                        }

                    </View>
                </ScrollView>
            </View>
            */
        )
    }
}

//Screen Styling
const styles = StyleSheet.create({

    mainView: {
        flex: 1,
        backgroundColor: colors.WHITE,
    },

    header: {
        backgroundColor: colors.WHITE,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 25,
        marginTop: Platform.select({ ios: 55, android: 45 })
    },

    viewMap: {
        flex: 1,
    },

    map: {
        flex: 1,
        ...StyleSheet.absoluteFillObject,
    },

    mainMap: {
        flex: 0.5,
    },

    viewEndereco: {
        flex: 0.8,
        justifyContent: 'center',
    },

    endereco: {
        flex: 0.7,
        borderRadius: 15,
        marginHorizontal: 15,
        borderWidth: 1,
        borderColor: colors.GREY1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    partida: {
        flex: 1,
        marginHorizontal: 7,
        alignItems: 'center',
        flexDirection: 'row',
    },

    txtHrfim: {
        flex: 0.3,
        fontSize: 13,
        color: colors.GREY2,
        fontFamily: 'Inter-Regular',
    },

    txtPartida: {
        flex: 1,
        fontSize: 15,
        color: colors.BLACK,
        marginLeft: 10,
        fontFamily: 'Inter-Regular',
    },

    destino: {
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 7,
        flexDirection: 'row',
    },

    viewDriver: {
        flex: 0.4,
    },

    viewPassageiro: {
        flex: 0.2,
        justifyContent: 'center',
    },

    txtPassageiro: {
        fontSize: 18,
        marginLeft: 15,
        color: colors.BLACK,
        fontFamily: 'Inter-Bold',
    },

    viewInfoPassageiro: {
        flex: 0.5,
        justifyContent: 'center',
    },

    viewSubInfo: {
        flex: 1,
        marginHorizontal: 15,
        backgroundColor: colors.WHITE,
        flexDirection: 'row',
        borderRadius: 15,
        elevation: 5,
        alignItems: 'center',
        justifyContent: 'center',
    },

    photoPassageiro: {
        flex: 0.3,
        justifyContent: 'center',
        alignItems: 'center',
    },

    imagemPerfil: {
        height: 70,
        width: 70,
        borderWidth: 2,
        borderColor: colors.GREY2,
        borderRadius: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },

    infoPassageiro: {
        flex: 0.7,
        flexDirection: 'column',
        alignItems: 'flex-start'
    },

    txtNomePassageiro: {
        fontSize: 18,
        marginBottom: 5,
        color: colors.BLACK,
        fontFamily: 'Inter-Bold',
    },

    viewPgt: {
        flex: 0.3,

    },

    viewPagamento: {
        flex: 0.2,
        marginBottom: 15,
        marginLeft: 15,

    },

    txtPagamento: {
        fontSize: 18,
        color: colors.BLACK,
        fontFamily: 'Inter-Bold',
    },

    viewInfosPgt: {
        flex: 0.5,
        marginHorizontal: 15,
        borderRadius: 15,
        backgroundColor: colors.GREY1,
    },

    mainPgt: {
        flex: 1,
        flexDirection: 'row',
        marginHorizontal: 15,
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    txtMetodo: {
        fontSize: 15,
        marginLeft: 15,
        color: colors.BLACK,
        fontFamily: 'Inter-Regular',
    },

    txtDinheiro: {
        fontSize: 25,
        color: colors.DEEPBLUE,
        fontFamily: 'Inter-Bold',
    },

    viewBtn: {
        flex: 0.4,
        justifyContent: 'flex-end',
    },

    btn: {
        flex: 0.5,
        maxHeight: 60,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.DEEPBLUE,
    },




    /*
    headerStyle: { 
        backgroundColor: colors.GREY.default, 
        borderBottomWidth: 0 
    },
    headerTitleStyle: { 
        color: colors.WHITE,
        fontFamily:'Roboto-Bold',
        fontSize: 20
    },
    containerView:{ 
        flex:1 
    },
    textContainer:{
        textAlign:"center"
    },
    mapView: {
        justifyContent: 'center',
        alignItems: 'center',
        height: 160,
        marginBottom: 15
    },
    mapcontainer: {
        flex: 7,
        width: width,
        justifyContent: 'center',
        alignItems: 'center',
    },
    map: {
        flex: 1,
        ...StyleSheet.absoluteFillObject,
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
            {rotate: '180deg'}
          ]
    },
    rideDesc: {
        flexDirection: 'column'
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
        flexDirection: 'column',
        paddingHorizontal: 10,
        marginVertical: 14
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
        fontSize: 20,
        color: colors.GREY.default,
        fontFamily: 'Roboto-Bold'
    },
    billOptions: {
        marginHorizontal: 10,
        marginVertical: 15
    },
    billItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginVertical: 10
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
    payDetails: {
        fontSize: 16,
        fontFamily: 'Roboto-Medium',
        color: colors.GREY.default,
        marginBottom:6
    },
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: 2,
    },
    carNoStyle:{
        fontSize: 18, 
        fontWeight: 'bold', 
        fontFamily: 'Roboto-Bold'
    },
    textStyle:{
        fontSize: 18, 
        fontWeight: 'bold', 
        fontFamily: 'Roboto-Bold'
    },
    mainView:{ 
        flex:1, 
        backgroundColor: colors.WHITE, 
    },
    personStyle:{
        fontSize: 18, 
        fontWeight: 'bold', 
        color: colors.BLACK, 
        fontFamily: 'Roboto-Bold'
    },
    personTextView:{
        flexDirection: 'row', 
        alignItems: 'center'
    },
    ratingText:{
        fontSize: 16, 
        color: colors.GREY.iconSecondary, 
        marginRight: 8, 
        fontFamily: 'Roboto-Regular'
    },
    avatarView:{
        marginVertical: 15
    },
    timeStyle:{
        fontFamily: 'Roboto-Regular', 
        fontSize: 16, 
        marginTop: 1
    },
    adressStyle:{
        marginLeft: 6, 
        fontSize: 15, 
        lineHeight: 20
    },
    billView:{
        paddingHorizontal: 14
    },
    billText:{
        fontFamily: 'Roboto-Bold'
    },
    taxColor:{
        color: colors.GREY.default
    },
    paybleAmtView:{
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: 10
    },
    iosView:{
        paddingVertical: 10
    },
    dashView:{
        width:width, height:1
    },
    paymentTextView:{
        paddingHorizontal: 10
    },

    myButtonStyle:{
        alignSelf: "center",
        elevation: 0,
        backgroundColor: colors.GREEN.default,
        width: 300,
        padding: 7,
        borderColor: colors.TRANSPARENT,
        borderWidth: 0,
        borderRadius: 10
    }, */
});