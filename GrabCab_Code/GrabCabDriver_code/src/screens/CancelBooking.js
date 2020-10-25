import React from 'react';
import { Icon } from 'react-native-elements';
import { colors } from '../common/theme';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
var { width } = Dimensions.get('window');
import { NavigationActions, StackActions } from 'react-navigation';
import * as firebase from 'firebase';


export default class CancelBooking extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loader: false,
            blocked: false,
            motivo: "",
            numeroPorcentagem: '0%',
        };
        this.motivo1 = "Motorista bloqueado, por atingir mais de 50% da taxa de cancelamento."
        this.motivo2 = "Motorista bloqueado, por antigir o limite diário de cancelamento em sequência."
        this.motivo3 = "Motorista bloqueado, por atingir o limite de cancelamento de corridas diário."
    }

    UNSAFE_componentWillMount() {
        const allDetails = this.props.navigation.getParam('allDetails')
        this.setState({
            rideDetails: allDetails,
            curUid: firebase.auth().currentUser.uid
        })

        const userDetails = firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/');
        userDetails.once('value', customerData => {
            let userDetails = customerData.val()
            if(userDetails) {
                if(userDetails.in_reject_progress){
                    if(userDetails.in_reject_progress.punido == false){
                        setTimeout(() => {
                            this.setCancell();
                        }, 1000)
                    }
                } else {
                    setTimeout(() => {
                        this.setCancell();
                    }, 1000)
                }
            }
        })
    }

    setCancell() {
        const customerRoot = firebase.database().ref('users/' + this.state.curUid + '/');
        customerRoot.once('value', customerData => {
            let allData = customerData.val()
            if (allData) {
                if (allData.canceladasRecentes) {
                    let currentDate = new Date(allData.canceladasRecentes.data)
                    let today = new Date;
                    let countAnterior = 0;
                    let countAnteriorRecente = 0;
                    let countTotal = 0;

                    if (currentDate.getDate() == today.getDate() && currentDate.getMonth() == today.getMonth()) {
                        firebase.database().ref('/users/' + this.state.curUid + '/canceladasRecentes/').once('value', snap => {
                            if (snap.val()) {
                                countAnterior = snap.val().count
                                countAnteriorRecente = snap.val().countRecentes
                            }
                        }).then(() => {
                            if (countAnteriorRecente + 1 == 3) {
                                //Aqui entra o bloqueio do motorista
                                this.bloquearDriver(this.motivo2)
                                this.setState({ loader: false })

                            } else if (countAnterior + 1 == 7) {
                                //Aqui entra o bloqueio caso ele cancelou 6 no dia Bleu bleu
                                this.bloquearDriver(this.motivo3)
                                this.setState({ loader: false, motivo: this.motivo3 })

                            } else {
                                countTotal = countAnterior + 1
                                firebase.database().ref('/users/' + this.state.curUid + '/canceladasRecentes/').update({
                                    count: countTotal,
                                    countRecentes: countAnteriorRecente + 1,
                                    data: new Date().toString()

                                }).then(() => {
                                    firebase.database().ref('users/' + this.state.curUid + '/in_reject_progress/').update({
                                        punido: true,
                                    })
                                }).then(() => { this.verifiedCancell(countTotal) })
                            }
                        }
                        )
                    }
                    else {
                        firebase.database().ref('/users/' + this.state.curUid + '/canceladasRecentes/').update({
                            count: 1,
                            countRecentes: 1,
                            data: new Date().toString(),
                        }).then(() => {
                            firebase.database().ref('users/' + this.state.curUid + '/in_reject_progress/').update({
                                punido: true,
                            })
                        })
                    }
                }
                else {
                    firebase.database().ref('/users/' + this.state.curUid + '/canceladasRecentes/').update({
                        count: 1,
                        countRecentes: 1,
                        data: new Date().toString(),
                    }).then(() => {
                        firebase.database().ref('users/' + this.state.curUid + '/in_reject_progress/').update({
                            punido: true,
                        })
                    })
                }
            }
        })
    }

    verifiedCancell(param) {
        let today = new Date
        let arrayBookings = []
        let bookingToday = 0;


        const bookingsData = firebase.database().ref('/users/' + this.state.curUid + '/my_bookings/')
        bookingsData.once('value', snap => {
            let bookings = snap.val()
            if (bookings) {
                for (let key in bookings) {
                    arrayBookings.push(bookings[key].tripdate)
                }
            }
        })

        for (let i = arrayBookings.length - 1; i >= 0; i--) {
            let bookingData = new Date(arrayBookings[i])
            if (bookingData.getDate() == today.getDate() && bookingData.getMonth() == today.getMonth()) {
                bookingToday++
            } else {
                break
            }
        }

        let percentage = 0;
        if (bookingToday >= 2 && bookingToday <= 10) {
            percentage = param / bookingToday;

            if (percentage >= 0.5) {
                //Aqui entra o bloqueio de porcentagem >= 50%
                let numeroPorcentagem = (1 - percentage).toFixed(2) + '%';
                this.bloquearDriver(this.motivo1)
                this.setState({ loader: false, nPorcentagem: numeroPorcentagem })
            } else {
                this.setState({ loader: false, motivo: this.motivo1 })
            }
        }
    }

    bloquearDriver(param) {
        firebase.database().ref('/users/' + this.state.curUid + '/blocked/').update({
            isBlocked: true,
            data: new Date().toString(),
            motivo: param
        }).then(() => {
            this.setState({
                blocked: true,
                motivo: param
            })
        }).then(
            firebase.database().ref('users/' + this.state.curUid + '/in_reject_progress').update({
                punido: true,
            })
        )
    }

    continuarConectado() {
        firebase.database().ref(`/users/` + this.state.curUid + '/').update({
            driverActiveStatus: true
        }).then(() => {
            firebase.database().ref('users/' + this.state.curUid + '/in_reject_progress/').remove()
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
        })
    }

    desconectarDriver() {
        firebase.database().ref(`/users/` + this.state.curUid + '/').update({
            driverActiveStatus: false
        }).then(() => {
            firebase.database().ref('users/' + this.state.curUid + '/in_reject_progress/').remove()
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
        })
    }

    render() {
        return (
            <View style={styles.mainView}>
                <View style={{ flex: 1, marginHorizontal: 0, borderBottomRightRadius: 20, borderBottomLeftRadius: 20, backgroundColor: colors.DEEPBLUE}}>
                    <View style={{ marginTop: 50, justifyContent: 'center', alignItems: 'center' }}>
                        <View>
                            <Icon
                                name='ios-warning'
                                type='ionicon'
                                color='#ff6f60'
                                size={50}
                            />
                        </View>
                        <View style={{ justifyContent: 'center', alignItems: 'center', marginHorizontal: 15, }}>
                            <Text style={{ fontSize: 20, fontFamily: 'Inter-Bold', color: colors.WHITE, textAlign: 'center' }}>Você cancelou esta corrida, sua taxa de cancelamento será afetada por esse motivo</Text>
                        </View>
                        <View style={{ marginTop: 25, marginLeft: 15, }}>
                            <Text style={{ fontSize: 12, fontFamily: 'Inter-Regular', color: colors.WHITE, textAlign: 'center' }}>Sua taxa de cancelamento pode afetar drasticamente seu desempenho e recebimento de corridas, podendo haver bloqueio permanente de sua conta.</Text>
                        </View>
                    </View>
                </View>

                <View style={{ flex:1, flexDirection: 'row', justifyContent: 'center', marginTop: 30, marginHorizontal: 10}}>
                    <View style={{ alignItems: 'center', justifyContent: 'center', width: 250, height: 150, backgroundColor: colors.WHITE, borderWidth: 0.6, borderColor: colors.GREY1, borderRadius: 15 }}>
                        <Text style={{ fontSize: 16, fontFamily: 'Inter-Regular', color: colors.BLACK }}>Taxa de cancelamento</Text>
                        <View style={{ flexDirection: 'row', marginTop: 5, }}>
                            <Text style={{ fontSize: 35, fontFamily: 'Inter-Bold', color: '#e53935' }}>{this.state.numeroPorcentagem}</Text>
                            <View style={{ marginLeft: 5, justifyContent: 'center', alignItems: 'center' }}>
                                <Icon
                                    name='ios-thumbs-down'
                                    type='ionicon'
                                    color='#e53935'
                                    size={30}
                                />
                            </View>
                        </View>
                    </View>
                </View>
                {this.state.blocked ?
                    <View style={{ flex: 0.7, justifyContent: 'center', alignItems: 'center' }}>
                        <View style={{ marginHorizontal: 8 }}>
                            <Text style={{ fontSize: 20, fontFamily: 'Inter-Bold', color: colors.RED, textAlign: 'center' }}>{this.state.motivo}</Text>
                        </View>
                        <TouchableOpacity style={{ backgroundColor: colors.WHITE, borderColor: colors.RED, borderWidth: 2, borderRadius: 15, width: width / 1.5, justifyContent: 'center', alignItems: 'center', height: 50, marginTop: 15, }}
                            onPress={() => this.desconectarDriver()}
                            disabled={this.state.loader}
                        >
                            <Text style={{ fontSize: 16, fontFamily: 'Inter-Bold', color: colors.BLACK }}>Voltar</Text>
                        </TouchableOpacity>
                    </View>
                    :
                    <View style={{ flex: 0.5, justifyContent: 'center', alignItems: 'center' }}>
                        <TouchableOpacity style={{ backgroundColor: colors.DEEPBLUE, borderRadius: 15, width: width / 1.5, justifyContent: 'center', alignItems: 'center', height: 50 }}
                            onPress={() => this.continuarConectado()}
                            disabled={this.state.loader}
                        >
                            <Text style={{ fontSize: 16, fontFamily: 'Inter-Bold', color: colors.WHITE }}>Continuar conectado</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={{ backgroundColor: colors.WHITE, borderColor: colors.RED, borderWidth: 2, borderRadius: 15, width: width / 1.5, justifyContent: 'center', alignItems: 'center', height: 50, marginTop: 15, }}
                            onPress={() => this.desconectarDriver()}
                            disabled={this.state.loader}
                        >
                            <Text style={{ fontSize: 16, fontFamily: 'Inter-Bold', color: colors.BLACK }}>Desconectar</Text>
                        </TouchableOpacity>
                    </View>
                }
            </View>
        );
    }

}
const styles = StyleSheet.create({
    mainView: {
        flex: 1,
        backgroundColor: colors.WHITE,
        //marginTop: StatusBar.currentHeight,
    }
})