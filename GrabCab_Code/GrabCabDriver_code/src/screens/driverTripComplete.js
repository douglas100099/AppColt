import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    SafeAreaView,
    Platform,
    Image,
    ActivityIndicator,
    TouchableOpacity,
    Dimensions,
    AsyncStorage
} from 'react-native';
import { Icon } from 'react-native-elements';
import StarRating from 'react-native-star-rating';
import { colors } from '../common/theme';
import languageJSON from '../common/language';
import * as firebase from 'firebase'
import { RequestPushMsg } from '../common/RequestPushMsg';
import { NavigationActions, StackActions } from 'react-navigation';
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
var { width } = Dimensions.get('window');
import * as Animatable from 'react-native-animatable';

export default class DriverTripComplete extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            starCount: 0,
            title: 'John Dasgupta',
            currency: {
                code: '',
                symbol: ''
            },
            loader: false,
        }
        this._retrieveCurrency();
    }

    _activate = () => {
        activateKeepAwake();
    };

    _deactivate = () => {
        deactivateKeepAwake();
    };

    _retrieveCurrency = async () => {
        try {
            const value = await AsyncStorage.getItem('currency');
            if (value !== null) {
                this.setState({ currency: JSON.parse(value) });
            }
        } catch (error) {
            alert('Ops, tivemos um problema.')
        }
    };

    UNSAFE_componentWillMount() {
        const allDetails = this.props.navigation.getParam('allDetails');
        const trip_cost = this.props.navigation.getParam('trip_cost');
        const trip_end_time = this.props.navigation.getParam('trip_end_time');
        this.setState({
            rideDetails: allDetails,
            region: {
                latitude: allDetails.pickup.lat,
                longitude: allDetails.pickup.lng,
                latitudeDelta: 0.9922,
                longitudeDelta: 0.9421,
            },
            curUid: firebase.auth().currentUser.uid,
            trip_cost: trip_cost,
            trip_end_time: trip_end_time
        })
        this._activate();

    }

    //done button press function
    onPressDone(item) {
        if (item.booking_type_web) {
            let cost = parseFloat(item.pagamento.trip_cost).toFixed(2);
            firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/my_bookings/' + item.bookingId + '/pagamento/').update({
                payment_status: "PAID",
                customer_paid: cost,
                cashPaymentAmount: cost
            }).then(() => {
                firebase.database().ref('users/' + item.customer + '/my-booking/' + item.bookingId + '/pagamento/').update({
                    payment_status: "PAID",
                    customer_paid: cost,
                    cashPaymentAmount: cost
                }).then(() => {
                    firebase.database().ref('bookings/' + item.bookingId + '/pagamento/').update({
                        payment_status: "PAID",
                        customer_paid: cost,
                        cashPaymentAmount: cost
                    }).then(() => {
                        firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/').update({
                            queue: false
                        }).then(() => {
                            this.props
                                .navigation
                                .dispatch(StackActions.reset({
                                    index: 0,
                                    actions: [
                                        NavigationActions.navigate({
                                            routeName: 'DriverTripAccept',
                                        }),
                                    ],
                                }))
                            this.sendPushNotification2(item.customer);
                        });
                    })
                })
            })

        } else {
            var data = {
                payment_status: "PAID",
            };

            var riderData = {
                payment_status: "PAID",
            };
            //var bookingId = item.bookingId?item.bookingId:item.bookingUid;
            let dbRef = firebase.database().ref('users/' + this.state.curUid + '/my_bookings/' + item.bookingId + '/pagamento/');
            dbRef.update(data).then(() => {
                firebase.database().ref('bookings/' + item.bookingId + '/pagamento/').update(data).then(() => {
                    let userDbRef = firebase.database().ref('users/' + item.customer + '/my-booking/' + item.bookingId + '/pagamento/')
                    userDbRef.update(riderData).then(() => {

                        // Remove a corrida recente (AS VEZES, TEM VEZ QUE TEM QUE SER NA MÃO)

                        firebase.database().ref('users/' + this.state.curUid + '/emCorrida/').remove().then(() => {

                            // Reseta a sequencia de corrida cancela

                            firebase.database().ref('users/' + this.state.curUid + '/canceladasRecentes/').update({
                                countRecentes: 0
                            }).then(() => {

                                // Tira ele da fila

                                firebase.database().ref('users/' + this.state.curUid + '/').update({
                                    queue: false
                                }).then(() => {

                                    //Navega para o inicio

                                    this.props
                                        .navigation
                                        .dispatch(StackActions.reset({
                                            index: 0,
                                            actions: [
                                                NavigationActions.navigate({
                                                    routeName: 'DriverTripAccept',
                                                }),
                                            ],
                                        }))
                                    //this.sendPushNotification(item.customer, item.bookingId);
                                })
                            })
                        })
                    })
                })
            })
        }
    }

    //rating
    onStarRatingPress(rating) {
        this.setState({
            starCount: rating
        });
    }

    sendPushNotification2(customerUID) {
        const customerRoot = firebase.database().ref('users/' + customerUID);
        customerRoot.once('value', customerData => {
            if (customerData.val()) {
                let allData = customerData.val()
                RequestPushMsg(allData.pushToken ? allData.pushToken : null, 'Sua corrida foi finalizada, obrigado por utilizar o Colt')
            }
        })
    }

    submitNow() {
        this.setState({ loader: true })
        firebase.database().ref('users/' + this.state.rideDetails.customer + '/ratings/details').push({
            user: this.state.curUid,
            rate: this.state.starCount > 0 ? this.state.starCount : 5,
        }).then((res) => {
            let path = firebase.database().ref('users/' + this.state.rideDetails.customer + '/ratings/');
            path.once('value', snapVal => {
                if (snapVal.val()) {
                    // rating calculation
                    let ratings = snapVal.val().details;
                    var total = 0;
                    var count = 0;
                    for (let key in ratings) {
                        count = count + 1;
                        total = total + ratings[key].rate;
                    }
                    let fRating = total / count;
                    if (fRating) {
                        //avarage Rating submission
                        firebase.database().ref('users/' + this.state.rideDetails.customer + '/ratings/').update({ userrating: parseFloat(fRating).toFixed(1) }).then(() => {
                            //Rating for perticular booking 
                            firebase.database().ref('users/' + this.state.rideDetails.customer + '/my-booking/' + this.state.rideDetails.bookingId + '/').update({
                                rating: this.state.starCount > 0 ? this.state.starCount : 5,
                            })
                        })
                    }
                }
            })
        }).then(() => {
            this.onPressDone(this.state.rideDetails)
        })

    }

    render() {
        return (
            <SafeAreaView style={styles.mainView}>
                <View style={styles.subView}>
                    <Animatable.View animation='fadeInDownBig' useNativeDriver={true} style={styles.viewIcon}>
                        <View style={styles.Icon}>
                            <Icon
                                name='check'
                                type='feather'
                                size={50}
                                color={colors.DEEPBLUE}
                            />
                        </View>
                        <Animatable.View animation='fadeInLeftBig' delay={1100} useNativeDriver={true} style={styles.viewTxtIcon}>
                            <Text style={styles.txtIcon}>Corrida finalizada!</Text>
                        </Animatable.View>
                    </Animatable.View>
                    <View style={styles.viewEndereco}>
                        <View style={styles.viewPartida}>
                            <Icon
                                name='arrow-right-circle'
                                type='feather'
                                size={15}
                                color={colors.DEEPBLUE}
                            />
                            <Text style={styles.txtPartida}>{this.state.rideDetails.pickup.add}</Text>
                        </View>
                        <View style={styles.viewDestino}>
                            <Icon
                                name='arrow-down-circle'
                                type='feather'
                                size={15}
                                color={colors.RED}
                            />
                            <Text style={styles.txtPartida}>{this.state.rideDetails.drop.add}</Text>
                        </View>
                    </View>
                    <View style={styles.viewDetails}>
                        <Text style={styles.txtDetails}>{'Tempo gasto: ' + this.state.rideDetails.total_trip_time}</Text>
                        <View style={{ width: 1, height: 35, backgroundColor: colors.GREY1 }}></View>
                        <Text style={styles.txtDetails2}>{'Distancia: ' + parseFloat(this.state.rideDetails.distance / 1000).toFixed(1) + ' KM'}</Text>
                    </View>
                    <View style={styles.viewFormapgt}>
                        <View style={styles.pgt}>
                            <View style={styles.headerPgt}>
                                <Image source={this.state.rideDetails.imageRider ? { uri: this.state.rideDetails.imageRider } : require('../../assets/images/profilePic.png')} style={styles.imagemModal} />
                                <Text style={styles.nomePassageiro}>{this.state.rideDetails.customer_name}</Text>
                            </View>
                            <View style={styles.footerPgt}>
                                <Text style={styles.txtFormapgt}>{this.state.rideDetails.pagamento ? this.state.rideDetails.pagamento.payment_mode : 'Dinheiro'}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', }}>
                                    <Icon
                                        name='dollar-sign'
                                        type='feather'
                                        size={15}
                                        color={colors.GREEN.default}
                                    />
                                    <Text style={styles.txtValor}>{this.state.trip_cost ? this.state.currency.symbol + parseFloat(this.state.trip_cost).toFixed(2) : this.state.currency.symbol + 0}</Text>
                                </View>
                            </View>
                        </View>
                        <View style={{justifyContent: 'center', alignItems: 'center', flex: 0.5}}>
                            <View style={{justifyContent: 'center', alignItems: 'center', marginBottom: 10}}>
                                <Text style={{fontSize: 15, fontFamily: 'Inter-Bold', color: colors.BLACK}}>Avalie o passageiro</Text>
                            </View>
                            <StarRating
                                disabled={false}
                                maxStars={5}
                                starSize={35}
                                fullStar={'ios-star'}
                                halfStar={'ios-star-half'}
                                emptyStar={'ios-star-outline'}
                                iconSet={'Ionicons'}
                                fullStarColor={colors.YELLOW.primary}
                                emptyStarColor={colors.YELLOW.primary}
                                halfStarColor={colors.YELLOW.primary}
                                rating={this.state.starCount}
                                selectedStar={(rating) => this.onStarRatingPress(rating)}
                                buttonStyle={{ paddingHorizontal: 15 }}
                                containerStyle={styles.contStyle}
                            />
                        </View>
                    </View>
                    <View style={{ flex: 0.3, justifyContent: 'center', alignItems: 'center', flexDirection: 'row' }}>
                        <TouchableOpacity style={styles.btn} disabled={this.state.loader} onPress={() => { this.submitNow() }}>
                            <Text style={styles.txtBtn}>Concluir</Text>
                            <ActivityIndicator animating={this.state.loader} size="large" color={colors.WHITE} style={{ position: 'absolute', right: 15 }} />
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        )
    }
}

//Screen Styling
const styles = StyleSheet.create({

    mainView: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: colors.GREY1,
    },

    contStyle: {

    },

    ratingViewStyle: {
        flex: 0.5,
        flexDirection: "row",
        justifyContent: "center",
    },

    subView: {
        flex: 1,
    },

    viewIcon: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },

    Icon: {
        height: 100,
        width: 100,
        marginBottom: 15,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.WHITE,
    },

    viewTxtIcon: {
    },

    txtIcon: {
        fontSize: 16,
        fontFamily: 'Inter-Bold',
        color: colors.BLACK
    },

    viewEndereco: {
        flex: 0.5,
        justifyContent: 'center',
        width: width / 1.2,
        borderRadius: 15,
        backgroundColor: colors.WHITE,
    },

    viewPartida: {
        flex: 1,
        borderBottomWidth: 0.6,
        borderBottomColor: colors.GREY1,
        alignItems: 'center',
        marginHorizontal: 25,
        flexDirection: 'row',
    },

    viewDestino: {
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 25,
        flexDirection: 'row',
    },

    txtPartida: {
        fontSize: 12,
        fontFamily: 'Inter-Regular',
        marginLeft: 5,
        color: colors.BLACK
    },

    viewDetails: {
        width: width / 1.2,
        borderRadius: 15,
        justifyContent: 'space-between',
        height: 65,
        marginTop: 15,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.WHITE,
    },

    txtDetails: {
        fontSize: 12,
        marginLeft: 15,
        fontFamily: 'Inter-SemiBold',
        color: colors.BLACK,
    },

    txtDetails2: {
        marginRight: 15,
        fontSize: 12,
        fontFamily: 'Inter-SemiBold',
        color: colors.BLACK,
    },

    viewFormapgt: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    pgt: {
        height: 100,
        width: width / 1.2,
        borderRadius: 15,
        justifyContent: 'center',

        backgroundColor: colors.WHITE,
    },

    headerPgt: {
        flex: 0.8,
        marginTop: 5,
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 10,
        borderBottomWidth: 0.6,
        borderBottomColor: colors.GREY1,
    },

    footerPgt: {
        flex: 1,
        marginTop: 5,
        flexDirection: 'row',
        marginHorizontal: 10,
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    imagemModal: {
        height: 25,
        width: 25,
        borderRadius: 50,
    },

    nomePassageiro: {
        marginLeft: 5,
        fontFamily: 'Inter-Bold',
        fontSize: 13,
        color: colors.BLACK,
    },

    txtFormapgt: {
        fontFamily: 'Inter-Bold',
        fontSize: 13,
        color: colors.BLACK,
    },

    txtValor: {
        fontFamily: 'Inter-Bold',
        marginLeft: 4,
        fontSize: 25,
        color: colors.DEEPBLUE,
    },

    btn: {
        width: width / 1.2,
        justifyContent: 'center',
        alignItems: 'center',
        height: 60,
        borderRadius: 15,
        backgroundColor: colors.DEEPBLUE
    },

    txtBtn: {
        fontFamily: 'Inter-Bold',
        fontSize: 16,
        color: colors.WHITE,
    },

})