import React from 'react';
import { Icon } from 'react-native-elements';
import { colors } from '../common/theme';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    FlatList,
} from 'react-native';
var { width } = Dimensions.get('window');
import * as firebase from 'firebase';
import Constants from 'expo-constants';

export default class Reports extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            allBookings: [],
            loading: false,
            dataAtual: new Date(),
            meses: new Array(
                'Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
            )
        };
    }

    componentDidMount() {
        this.listarInfos();
    }

    listarInfos() {
        this.setState({ loading: false })
        let dataAtual = new Date()
        let userUid = firebase.auth().currentUser.uid;
        let dbRef = firebase.database().ref('users/' + userUid + '/my_bookings');
        dbRef.once('value', (snap) => {
            var allBookings = []
            let bookings = snap.val();
            for (let key in bookings) {
                bookings[key].bookingUid = key;
                const { tripdate , status } = bookings[key]
                let data = new Date(tripdate)
                if(status === 'END' && dataAtual.getMonth() === data.getMonth() && dataAtual.getFullYear() === data.getFullYear()){
                    allBookings.push(bookings[key]);
                }
            }
            console.log('Parou o for')
            this.setState({
                allBookings: allBookings.reverse()
            })
        })
        this.setState({ loading: true })
        console.log(this.state.loading)
    }

    dataAtualFormatada(item) {
        var data = new Date(item.tripdate),
            dia = data.getDate().toString().padStart(2, '0'),
            mes = (data.getMonth() + 1).toString().padStart(2, '0'), //+1 pois no getMonth Janeiro começa com zero.
            ano = data.getFullYear(),
            hora = data.getHours().toString().padStart(2, '0'),
            minuto = data.getMinutes().toString().padStart(2, '0');
        return dia + "/" + mes + "/" + ano + ' ' + hora + ':' + minuto;
    }

    render() {
        return (
            <View style={styles.mainView}>
                <View style={styles.header}>
                    <Text style={{ fontSize: 20, fontFamily: 'Inter-Bold', color: colors.BLACK, textAlign: 'center' }}>Relatórios</Text>
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
            {this.state.loading ?
                <View style={{ flex: 1, backgroundColor: colors.WHITE }}>
                    <View style={{ flex: 1 }}>
                        <View style={{ justifyContent:'center', alignItems: 'center', marginBottom: 20 }}>
                            <Text style={{ color: colors.BLACK, fontFamily: 'Inter-Bold', fontSize: 15, marginBottom: 10 }}>Relatórios de {this.state.meses[this.state.dataAtual.getMonth()]}</Text>
                            <Text style={{ color: colors.BLACK, fontFamily: 'Inter-Regular', fontSize: 15 }}>Corridas realizadas: {this.state.allBookings.length}</Text>
                        </View>
                        <FlatList
                            data={this.state.allBookings}
                            keyExtractor={(item, index) => index.toString()}
                            renderItem={({ item, index }) => {
                                return (
                                    <View style={{ height: 70 }}>
                                        <View style={{ height: 50, marginHorizontal: 10,backgroundColor: colors.GREY3, elevation: 2, borderRadius: 15, flexDirection: 'row', justifyContent: 'center'  }}>
                                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                                <Text style={{ color: colors.BLACK, fontFamily: 'Inter-Medium', fontSize: 14, }}>{item.tripdate ? this.dataAtualFormatada(item) : null}</Text>
                                            </View>
                                            <View style={{ height: 50, width: 1.5, backgroundColor: colors.GREY1, justifyContent: 'center' }}></View>
                                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                                {item.pagamento.payment_mode === 'Dinheiro' ?
                                                <Text style={{ color: '#ff0000', fontFamily: 'Inter-Bold', fontSize: 14 }}>-R$ {parseFloat(item.pagamento.convenience_fees).toFixed(2)}</Text>
                                                :
                                                null }
                                                {item.pagamento.payment_mode === 'Dinheiro/Carteira' ?
                                                <Text style={{ color: colors.GREEN.light, fontFamily: 'Inter-Bold', fontSize: 14 }}>+R$ {parseFloat(item.pagamento.usedWalletMoney - item.pagamento.convenience_fees).toFixed(2)}</Text>
                                                :
                                                null }
                                                {item.pagamento.payment_mode === 'Carteira' ?
                                                <Text style={{ color: colors.GREEN.light, fontFamily: 'Inter-Bold', fontSize: 14 }}>+R$ {parseFloat(item.pagamento.usedWalletMoney).toFixed(2)}</Text>
                                                :
                                                null }
                                            </View>
                                        </View>
                                    </View>
                                )
                            }
                            }
                        />
                    </View>
                </View>
                :
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.WHITE }}>
                <ActivityIndicator size="large" color="#0000ff" />
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
    },
    header: {
        backgroundColor: colors.WHITE,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 25,
        marginTop: Constants.statusBarHeight + 3
    },
})