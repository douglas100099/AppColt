import React from 'react';
import { Icon } from 'react-native-elements';
import { colors } from '../common/theme';
import {
    StyleSheet,
    View,
    Text,
    Dimensions,
    TouchableOpacity,
    ScrollView,
    AsyncStorage,
    Platform
} from 'react-native';
var { width, height } = Dimensions.get('window');
import * as firebase from 'firebase';
import { NavigationActions, StackActions } from 'react-navigation';
import {
    BarChart,
} from "react-native-chart-kit";


export default class DriverIncomePage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currency: {
                code: '',
                symbol: ''
            },
            loaderBtn: false,
            myBookingarr: [],
        };
        this.objetoPrincipal = {
            "Dom": 0,
            "Seg": 0,
            "Ter": 0,
            "Qua": 0,
            "Qui": 0,
            "Sex": 0,
            "Sab": 0,
        };
        this._retrieveCurrency();
    }

    _retrieveCurrency = async () => {
        try {
            const value = await AsyncStorage.getItem('currency');
            if (value !== null) {
                this.setState({ currency: JSON.parse(value) });
            }
        } catch (error) {
            console.log("Asyncstorage issue 3");
            alert('Ops, tivemos um problema.');
        }
    };

    componentDidMount() {
        let userUid = firebase.auth().currentUser.uid;
        let ref = firebase.database().ref('users/' + userUid + '/ganhos');
        ref.on('value', allBookings => {
            if (allBookings.val()) {
                let data = allBookings.val();
                var myBookingarr = [];
                for (let k in data) {
                    data[k].bookingKey = k
                    myBookingarr.push(data[k])
                }

                if (myBookingarr) {
                    this.setState({ myBooking: myBookingarr.reverse() }, () => {
                        this.eraningCalculation()
                    })

                }
            }
        })

    }

    goDetails(item, index) {
        if (item && item.trip_cost > 0) {
            item.roundoffCost = Math.round(item.trip_cost).toFixed(2);
            item.roundoff = (Math.round(item.roundoffCost) - item.trip_cost).toFixed(2)
            this.props.navigation.push('RideDetails', { data: item });

        } else {
            item.roundoffCost = Math.round(item.estimate).toFixed(2);
            item.roundoff = (Math.round(item.roundoffCost) - item.estimate).toFixed(2)
            this.props.navigation.push('RideDetails', { data: item });
        }

    }




    eraningCalculation() {
        if (this.state.myBooking) {
            let today = new Date();
            let tdTrans = 0;
            let mnTrans = 0;
            let totTrans = 0;
            for (let i = 0; i < this.state.myBooking.length; i++) {
                const { data, ganho } = this.state.myBooking[i];
                let tDate = new Date(data);
                if (ganho != undefined) {
                    if (tDate.getDate() === today.getDate() && tDate.getMonth() === today.getMonth()) {
                        tdTrans = tdTrans + ganho;
                    }
                    if (tDate.getMonth() === today.getMonth() && tDate.getFullYear() === today.getFullYear()) {
                        mnTrans = mnTrans + ganho;

                    }

                    totTrans = totTrans + ganho;

                }
            }
            this.setState({
                totalEarning: totTrans,
                today: tdTrans,
                thisMothh: mnTrans,
                qtdCorridas: this.state.myBooking.length,

            })
            this.teste();

        }
    }


    teste() {
        let curr = new Date
        let week = []

        for (let i = 0; i <= 6; i++) {
            let first = curr.getDate() - curr.getDay() + i
            let day = new Date(curr.setDate(first))
            week.push(day)
        }

        let tamanho = this.state.myBooking.length;
        let arrayCorridas = this.state.myBooking.reverse();
        let tempDate = curr.getDate();
        let tempIndex = curr.getDay()
        let dias = 0;

        for (let i = tamanho - 1; i >= 0; i--) {
            let corridaRecente = new Date(arrayCorridas[i].data)

            //Verifica se o dia corrida é mesmo do dia atual
            if (corridaRecente.getDate() == tempDate) {
                for (let j = week.length - 1; j >= 0; j--) {
                    if (corridaRecente.getDate() == week[j].getDate() && corridaRecente.getMonth() == week[j].getMonth() && corridaRecente.getFullYear() == week[j].getFullYear()) {

                        this.insertValues(tempIndex, arrayCorridas[i].ganho)
                        break
                    }
                }
            }
            //incrementa os variaveis pra percorrer os arrays da frente pra tras
            else {
                i++
                dias++
                tempDate = corridaRecente.getDate()
                tempIndex = curr.getDay() - dias;
            }
        }
    }

    insertValues(param, value) {
        switch (param) {
            case 0:
                this.objetoPrincipal.Dom += value
                break

            case 1:
                this.objetoPrincipal.Seg += value
                break

            case 2:
                this.objetoPrincipal.Ter += value
                break

            case 3:
                this.objetoPrincipal.Qua += value
                break

            case 4:
                this.objetoPrincipal.Qui += value
                break

            case 5:
                this.objetoPrincipal.Sex += value
                break

            case 6:
                this.objetoPrincipal.Sab += value
                break
        }
        return this.objetoPrincipal;
    }

    resetarPilha() {
        this.props.navigation.goBack();
    }

    render() {
        return (

            <View style={styles.mainView}>
                <View style={styles.view1}>
                    <View style={styles.header}>
                        <Text style={{ fontSize: 20, fontFamily: 'Inter-Bold', color: colors.WHITE, textAlign: 'center' }}>Carteira</Text>
                        <View style={{ position: 'absolute', zIndex: 999, left: 20 }}>
                            <TouchableOpacity disabled={this.state.loaderBtn} onPress={() => { this.resetarPilha(); }}>
                                <Icon
                                    name='ios-arrow-dropleft-circle'
                                    size={35}
                                    type='ionicon'
                                    color={colors.WHITE}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={styles.viewEstatisticas}>
                        <View style={styles.viewGanhos}>
                            <View style={{ flex: 1, alignItems: 'center' }}>
                                <View style={{ flex: 1, alignItems: 'center', flexDirection: 'row' }}>
                                    <View style={{ flex: 1, alignItems: 'flex-end', justifyContent: 'center' }}>
                                        <TouchableOpacity>
                                            <Icon
                                                name="md-arrow-round-back"
                                                type="ionicon"
                                                size={22}
                                                color={colors.WHITE}
                                            />
                                        </TouchableOpacity>
                                    </View>
                                    <View style={{ flex: 2, alignItems: 'center', justifyContent: 'center' }}>
                                        <Text style={styles.tituloMensal2}>Ganhos esse mês</Text>
                                        <Text style={styles.txtMensal2}>R$ {this.state.thisMothh ? parseFloat(this.state.thisMothh).toFixed(2) : '0'}</Text>
                                    </View>
                                    <View style={{ flex: 1, alignItems: 'flex-start', justifyContent: 'center' }}>
                                        <TouchableOpacity>
                                            <Icon
                                                name="md-arrow-round-forward"
                                                type="ionicon"
                                                size={22}
                                                color={colors.WHITE}
                                            />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                            <View style={{ flex: 1, justifyContent: 'space-between', flexDirection: 'row' }}>
                                <View style={{ flex: 1, alignItems: 'center' }}>
                                    <Text style={styles.tituloMensal}>Ganhos hoje</Text>
                                    <Text style={styles.txtMensal}>R$ {this.state.today ? parseFloat(this.state.today).toFixed(2) : '0'}</Text>
                                </View>
                                <View style={{ width: 1, height: 60, backgroundColor: colors.GREY1, justifyContent: 'center' }}></View>
                                <View style={{ flex: 1, alignItems: 'center' }}>
                                    <Text style={styles.tituloMensal}>Ganhos semana</Text>
                                    <Text style={styles.txtMensal}>R$ {this.state.thisMothh ? parseFloat(this.state.thisMothh).toFixed(2) : '0'}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/*<View style={styles.view2}>
                    <View style={styles.headerView2}>
                        <View style={{ marginHorizontal: 20, justifyContent: 'space-between', alignItems: 'center', flexDirection: 'row', }}>
                            <Text style={styles.selecDia}>Selecionar dia: 10/02/2020</Text>
                            <Icon
                                name="search"
                                type="feather"
                                size={20}
                                color={colors.WHITE}
                            />
                        </View>
                    </View>
                    <View style={styles.viewModal}>
                        <RideList data={this.state.myBooking} onPressButton={(item, index) => { this.goDetails(item, index) }}></RideList>
                    </View>
                </View>*/}
                <View style={{ flex: 1 }}>
                    <BarChart
                        data={{
                            labels: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
                            datasets: [
                                {
                                    data: [
                                        this.objetoPrincipal.Dom,
                                        this.objetoPrincipal.Seg,
                                        this.objetoPrincipal.Ter,
                                        this.objetoPrincipal.Qua,
                                        this.objetoPrincipal.Qui,
                                        this.objetoPrincipal.Sex,
                                        this.objetoPrincipal.Sab,
                                    ]
                                }
                            ]
                        }}
                        width={Dimensions.get("window").width / 1.05} // from react-native
                        height={220}
                        yAxisLabel="R$"
                        yAxisInterval={1} // optional, defaults to 1
                        chartConfig={chartConfig}
                        bezier
                        style={{
                            marginVertical: 8,
                            borderRadius: 15,
                            alignItems: 'center',
                        }}
                    />

                </View>
                <ScrollView style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 5, marginBottom: 10, height: 50, backgroundColor: colors.GREY3 }}>
                        <Icon
                            name='ios-wallet'
                            type='ionicon'
                            color='#32db64'
                        />
                        <Text style={{ marginLeft: 10, fontSize: 16, fontFamily: 'Inter-Regular', color: colors.BLACK }}>Saldo disponível:</Text>
                        <Text style={{ marginLeft: 5, fontSize: 16, fontFamily: 'Inter-Bold', color: '#32db64' }}>R$451,00</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 5, marginBottom: 20, height: 50, backgroundColor: colors.GREY3 }}>
                        <Icon
                            name='ios-trending-down'
                            type='ionicon'
                            color={colors.RED}
                        />
                        <Text style={{ marginLeft: 10, fontSize: 16, fontFamily: 'Inter-Regular', color: colors.BLACK }}>Saldo de corridas:</Text>
                        <Text style={{ marginLeft: 5, fontSize: 16, fontFamily: 'Inter-Bold', color: colors.RED }}>-R$251,00</Text>
                    </View>
                    <View style={{alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 20}}>
                        <TouchableOpacity style={{flexDirection: 'row', width: width/2.5, height: 40, backgroundColor: colors.DEEPBLUE, borderRadius: 15, justifyContent: 'center', alignItems: 'center'}}>
                            <Text style={{ marginLeft: 5, fontSize: 16, fontFamily: 'Inter-Bold', color: colors.WHITE }}>Pagar saldo</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={{flexDirection: 'row', width: width/2.5, height: 40, backgroundColor: colors.DEEPBLUE, borderRadius: 15, justifyContent: 'center', alignItems: 'center'}}>
                            <Text style={{ marginLeft: 5, fontSize: 16, fontFamily: 'Inter-Bold', color: colors.WHITE }}>Sacar saldo</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>





                {/*
                <View style={styles.bodyContainer}>
                    <View style={styles.todaysIncomeContainer}>
                       <Text style={styles.todayEarningHeaderText}>Hoje</Text>
                       <Text style={styles.todayEarningMoneyText}>R$ {this.state.today?parseFloat(this.state.today).toFixed(2):'0'}</Text>
                    </View>
                    <View style={styles.listContainer2}>
                      <View style={styles.totalEarning}>
                        <Text style={styles.todayEarningHeaderText2}>Corridas hoje</Text>
                        <Text style={styles.todayEarningMoneyText2}>R$ {this.state.thisMothh?parseFloat(this.state.thisMothh).toFixed(2):'0'}</Text>
                      </View>
                      <View style={styles.thismonthEarning}>
                        <Text style={styles.todayEarningHeaderText2}>Corridas no mês</Text>
                        <Text style={styles.todayEarningMoneyText2}>{this.state.qtdCorridas? '' : '0'}</Text>
                      </View>
                    </View>
                    <View style={styles.listContainer}>
                      <View style={styles.totalEarning}>
                        <Text style={styles.todayEarningHeaderText2}>Ganhos esse mês</Text>
                        <Text style={styles.todayEarningMoneyText2}>R$ {this.state.thisMothh?parseFloat(this.state.thisMothh).toFixed(2):'0'}</Text>
                      </View>
                      <View style={styles.thismonthEarning}>
                        <Text style={styles.todayEarningHeaderText2}>Ganhos no total</Text>
                        <Text style={styles.todayEarningMoneyText2}>R$ {this.state.totalEarning?parseFloat(this.state.totalEarning).toFixed(2):'0'}</Text>
                      </View>
                    </View>
               </View>
               */}
            </View>

        );
    }

}

const chartConfig = {
    backgroundGradientFrom: "#1152FD",
    backgroundGradientFromOpacity: 0.8,
    backgroundGradientTo: "#1152FD",
    backgroundGradientToOpacity: 1,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    strokeWidth: 2, // optional, default 3
    barPercentage: 0.7,
    fillShadowGradient: colors.BLACK,
    fillShadowGradientOpacity: 0.8,
    useShadowColorFromDataset: false // optional

};

const styles = StyleSheet.create({
    mainView: {
        flex: 1,
        backgroundColor: colors.WHITE,
    },

    view1: {
        flex: 1,
        backgroundColor: colors.DEEPBLUE,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
    },

    view2: {
        flex: 1,
        backgroundColor: colors.WHITE,
        justifyContent: 'center',
        alignItems: 'center',
    },

    header: {

        backgroundColor: colors.DEEPBLUE,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: Platform.select({ ios: 55, android: 45 })
    },

    txtHeader: {
        textAlign: 'center',
        fontSize: 20,
        fontFamily: 'Inter-Bold',
        color: colors.WHITE,
    },

    viewEstatisticas: {
        flex: 1.2,
        justifyContent: 'flex-start',
        alignItems: 'center',
    },

    txtMensal: {
        fontFamily: 'Inter-Bold',
        fontSize: 28,
        color: colors.WHITE,
    },

    tituloMensal: {
        fontFamily: 'Inter-Regular',
        fontSize: 15,
        color: colors.WHITE,
    },

    txtMensal2: {
        fontFamily: 'Inter-Bold',
        fontSize: 20,
        color: colors.WHITE,
        paddingHorizontal: 10
    },

    tituloMensal2: {
        fontFamily: 'Inter-Regular',
        fontSize: 12,
        color: colors.WHITE,
    },

    viewDetalhes: {
        height: 60,
        paddingVertical: 5,
        paddingHorizontal: 25,
        marginTop: 20,
        backgroundColor: colors.WHITE,
        borderRadius: 15,
        elevation: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },

    txtAceitas: {
        fontFamily: 'Inter-Regular',
        fontSize: 12,
        color: colors.BLACK,
    },

    viewGanhos: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
    },

    headerView2: {
        width: '95%',
        height: '9%',
        borderRadius: 15,
        justifyContent: 'center',
        backgroundColor: colors.DEEPBLUE,
        elevation: 5,

    },

    viewModal: {
        width: '100%',
        height: '80%',
        borderBottomLeftRadius: 15,
        borderBottomRightRadius: 15,
        alignSelf: 'center',
        backgroundColor: colors.WHITE,
    },

    selecDia: {
        fontFamily: 'Inter-Bold',
        fontSize: 14,
        color: colors.WHITE,
    },


    /* CSS NOVO */




    /* FIM DO CSS NOVO */


    headerStyle: {
        backgroundColor: colors.DEEPBLUE,
        borderBottomWidth: 0
    },
    headerTitleStyle: {
        color: colors.WHITE,
        fontFamily: 'Inter-Bold',
        fontSize: 20
    },
    bodyContainer: {
        flex: 1,
        backgroundColor: colors.WHITE,
        flexDirection: 'column'
    },
    todaysIncomeContainer: {
        flex: 1.5,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.WHITE,
        elevation: 5,
    },
    listContainer: {
        flex: 3,
        backgroundColor: '#fff',
        marginTop: 1,
        flexDirection: 'row',
        paddingHorizontal: 6,
        paddingVertical: 6,
        paddingBottom: 6,
        justifyContent: 'space-between',
        alignItems: 'flex-start'
    },
    listContainer2: {
        marginTop: 3,
        flexDirection: 'row',
        paddingHorizontal: 6,
        paddingVertical: 6,
        paddingBottom: 6,
        justifyContent: 'space-between',
        alignItems: 'flex-start'
    },
    todayEarningHeaderText: {
        fontSize: 20,
        paddingBottom: 5,
        color: colors.BLACK,
    },
    todayEarningMoneyText: {
        fontSize: 55,
        fontWeight: 'bold',
        color: colors.BLACK
    },
    totalEarning: {
        height: 90,
        width: '49%',
        backgroundColor: colors.WHITE,
        elevation: 5,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    thismonthEarning: {
        height: 90,
        width: '49%',
        backgroundColor: colors.WHITE,
        elevation: 5,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    todayEarningHeaderText2: {
        fontSize: 16,
        paddingBottom: 5,
        color: colors.BLACK,
    },
    todayEarningMoneyText2: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.BLACK,
    },
})