import React from 'react';
import { Icon, Input } from 'react-native-elements';
import { colors } from '../common/theme';
import {
    StyleSheet,
    View,
    Text,
    Dimensions,
    TouchableOpacity,
    ScrollView,
    AsyncStorage,
    LayoutAnimation,
    Modal,
    Platform
} from 'react-native';
var { width, height } = Dimensions.get('window');
import * as firebase from 'firebase';
import RadioForm from 'react-native-simple-radio-button';
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
            saldo: 0,
            myBookingarr: [],
            modalBanco: false,
            fbanco: '',
            fbancoValid: true,
            fname: '',
            fnameValid: true,
            cpfNum: '',
            cpfNumValid: true,
            contaNum: '',
            contaNumValid: true,
            AgenNum: '',
            AgenNumValid: true,
            types: [
                { label: 'Conta poupança', value: 0 },
                { label: 'Conta corrente', value: 1 }
            ],
            valueRadio: 0,
            semBanco: false,
            saqueNum: '',
            saqueNumValid: true,

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
        let refSaldo = firebase.database().ref('users/' + userUid + '/saldo');
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
        refSaldo.on('value', saldoData => {
            if (saldoData.val()) {
                const saldo = saldoData.val()
                this.setState({ saldo: saldo })
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

    validateFirstName() {
        const { fname } = this.state
        const fnameValid = fname.length > 4
        LayoutAnimation.easeInEaseOut()
        this.setState({ fnameValid })
        fnameValid || this.fnameInput.shake();
        return fnameValid
    }

    validateCpf() {
        const { cpfNum } = this.state
        const cpfFinal = this.state.cpfMotorista ? this.state.cpfMotorista : cpfNum
        const cpfNumValid = (cpfFinal.length >= 11)
        LayoutAnimation.easeInEaseOut()
        this.setState({ cpfNumValid })
        cpfNumValid || this.cpfNumInput.shake();
        return cpfNumValid
    }

    validateAgen() {
        const { AgenNum } = this.state
        const AgenNumValid = (AgenNum.length >= 4)
        LayoutAnimation.easeInEaseOut()
        this.setState({ AgenNumValid })
        AgenNumValid || this.AgenNumInput.shake();
        return AgenNumValid
    }

    validateConta() {
        const { contaNum } = this.state
        const contaNumValid = (contaNum.length >= 6 && contaNum.length <= 15)
        LayoutAnimation.easeInEaseOut()
        this.setState({ contaNumValid })
        contaNumValid || this.contaNumInput.shake();
        return contaNumValid
    }

    validateBanco() {
        const { fbanco } = this.state
        const fbancoValid = fbanco.length > 2
        LayoutAnimation.easeInEaseOut()
        this.setState({ fbancoValid })
        fbancoValid || this.fbancoInput.shake();
        return fbancoValid
    }

    async validateSaque() {
        const { saqueNum } = this.state
        const saqueNumValidNum = saqueNum.length >= 0
        LayoutAnimation.easeInEaseOut()
        if(saqueNumValidNum){
            let curid = firebase.auth().currentUser.uid
            firebase.database().ref('users/' + curid + '/saldo/').once('value', saldoDetails => {
                if(saldoDetails.val()){
                    let saldo = parseFloat(saldoDetails.val())
                    let numSaque = parseFloat(saqueNum)
                    console.log(numSaque  + ' < ' + saldo)
                    if(numSaque <= saldo){
                        this.setState({ saqueNumValid: true, saldoSaque: saldoDetails.val() })
                        return true
                    } else{
                        this.setState({ saqueNumValid: false })
                        return false
                    }
                } else {
                    this.setState({ saqueNumValid: false })
                    return false
                }
            })
        } else {
            this.setState({ saqueNumValid: false })
            return false
        }
    }

    async validarSaque(){
        this.setState({ loaderBtn: true })
        this.validateSaque().then(() => {
            if(this.state.saqueNumValid){
                this.sacarFinal(this.state.saqueNum)
            } else {
                this.setState({ loaderBtn: false })
            }  
        }).catch((err) => {
            alert('Ops, tivemos um erro ao requesitar o saque.')
            this.setState({ loaderBtn: false })
        })
    }

    sacarFinal(valor) {
        let curid = firebase.auth().currentUser.uid
        firebase.database().ref('users/' + curid + '/contaBancaria/').once('value', snap => {
            if(snap.val().requestPayment){
                alert('Você ja possui uma requisição de saque em andamento.')
            } else {
                firebase.database().ref('users/' + curid + '/contaBancaria/').update({
                    requestPayment: {
                        data: new Date().toString(),
                        valorSaque: parseFloat(valor).toFixed(2),
                        saldo: this.state.saldoSaque,
                        status: 'SOLICITADO',
                    }
                }).catch((err) => {
                    alert('Ops, tivemos um erro ao requesitar o saque.')  
                })
                alert('Requisição de saque realizada com sucesso!')  
            }
        })
        this.setState({ loaderBtn: false, modalBanco: false })    
    }

    removeBanco() {
        this.setState({ loaderBtn: true})
        let curid = firebase.auth().currentUser.uid
        firebase.database().ref('users/' + curid + '/contaBancaria/').remove().then(() => {
            this.setState({ modalBanco: false, semBanco: true, loaderBtn: false })
        })
    }

    onPressSacar() {
        this.setState({ loaderBtn: true })
        LayoutAnimation.easeInEaseOut();
        const fbancoValid = this.validateBanco();
        const fnameValid = this.validateFirstName();
        const cpfNumValid = this.validateCpf();
        const AgenNumValid = this.validateAgen();
        const contaNumValid = this.validateConta();

        if (fbancoValid && fnameValid && cpfNumValid && AgenNumValid && contaNumValid) {
            this.onPressRegistrarConta(this.state.fbanco, this.state.fname, this.state.cpfMotorista? this.state.cpfMotorista : this.state.cpfNum, this.state.valueRadio, this.state.AgenNum, this.state.contaNum);
        }
        this.setState({ loaderBtn: false })
    }

    onPressRegistrarConta(banco, nome, cpf, tipoconta, agencia, conta) {
        let userUid = firebase.auth().currentUser.uid;
        firebase.database().ref('users/' + userUid + '/contaBancaria/').update({
            nome: nome,
            banco: banco,
            cpf: cpf,
            tipoconta: tipoconta == 0 ? 'Conta poupança' : 'Conta corrente',
            agencia: agencia,
            conta: conta,
        }).then(() => {
            this.setState({ modalBanco: false })
            alert('Conta bancária registrada com sucesso, realize o saque agora.')
        })
    }

    modalBanco() {
        return (
            <Modal
                animationType="slide"
                transparent={true}
                visible={this.state.modalBanco}
                onRequestClose={() =>
                    this.setState({ modalBanco: false })
                }
            >
                <View style={{ flex: 1, backgroundColor: "rgba(22,22,22,0.8)", justifyContent: 'center', alignItems: 'center' }}>
                    {this.state.semBanco ?
                        <ScrollView style={{ width: '90%', backgroundColor: colors.WHITE, borderRadius: 10, flex: 1, maxHeight: height / 1.5 }}>
                            <View style={styles.textInputContainerStyle}>
                                <Text style={{ color: colors.BLACK, fontFamily: 'Inter-Bold', fontSize: 12, marginLeft: 10, marginBottom: 10 }}>Nome do banco</Text>
                                <Input
                                    ref={input => (this.fbancoInput = input)}
                                    editable={true}
                                    returnKeyType={'next'}
                                    underlineColorAndroid={colors.TRANSPARENT}
                                    value={this.state.fbanco}
                                    keyboardType={'default'}
                                    inputStyle={styles.inputTextStyle}
                                    onChangeText={(text) => { this.setState({ fbanco: text }) }}
                                    errorMessage={this.state.fbancoValid ? null : 'Por favor, insira o nome do banco'}
                                    secureTextEntry={false}
                                    blurOnSubmit={true}
                                    onSubmitEditing={() => { this.validateBanco(); this.fnameInput.focus() }}
                                    errorStyle={styles.errorMessageStyle}
                                    inputContainerStyle={styles.inputContainerStyle}
                                    containerStyle={styles.textInputStyle}
                                />
                            </View>

                            <View style={styles.textInputContainerStyle}>
                                <Text style={{ color: colors.BLACK, fontFamily: 'Inter-Bold', fontSize: 12, marginLeft: 10, marginBottom: 10 }}>Seu nome</Text>
                                <Input
                                    ref={input => (this.fnameInput = input)}
                                    editable={true}
                                    returnKeyType={'next'}
                                    underlineColorAndroid={colors.TRANSPARENT}
                                    value={this.state.fname}
                                    keyboardType={'default'}
                                    inputStyle={styles.inputTextStyle}
                                    onChangeText={(text) => { this.setState({ fname: text }) }}
                                    errorMessage={this.state.fnameValid ? null : 'Por favor, insira seu nome'}
                                    secureTextEntry={false}
                                    blurOnSubmit={true}
                                    onSubmitEditing={() => { this.validateFirstName(); this.cpfNumInput.focus() }}
                                    errorStyle={styles.errorMessageStyle}
                                    inputContainerStyle={styles.inputContainerStyle}
                                    containerStyle={styles.textInputStyle}
                                />
                            </View>

                            <View style={styles.textInputContainerStyle}>
                                <Text style={{ color: colors.BLACK, fontFamily: 'Inter-Bold', fontSize: 12, marginLeft: 10, marginBottom: 10 }}>CPF</Text>
                                <Input
                                    ref={input => (this.cpfNumInput = input)}
                                    editable={this.state.cpfMotorista ? false : true}
                                    returnKeyType={'next'}
                                    underlineColorAndroid={colors.TRANSPARENT}
                                    value={this.state.cpfMotorista ? this.state.cpfMotorista : this.state.cpfNum}
                                    keyboardType={'numeric'}
                                    inputStyle={styles.inputTextStyle}
                                    onChangeText={(text) => { this.setState({ cpfNum: text }) }}
                                    errorMessage={this.state.cpfNumValid ? null : 'CPF inválido, insira novamente sem ponto e hifén'}
                                    secureTextEntry={false}
                                    maxLength={11}
                                    blurOnSubmit={true}
                                    onSubmitEditing={() => { this.validateCpf() }}
                                    errorStyle={styles.errorMessageStyle}
                                    inputContainerStyle={styles.inputContainerStyle}
                                    containerStyle={styles.textInputStyle}
                                />
                            </View>

                            <View style={styles.textInputContainerStyle}>
                                <Text style={{ color: colors.BLACK, fontFamily: 'Inter-Bold', fontSize: 12, marginLeft: 10, marginBottom: 10 }}>Tipo de conta</Text>
                                <RadioForm
                                    radio_props={this.state.types}
                                    initial={0}
                                    formHorizontal={false}
                                    labelHorizontal={true}
                                    buttonColor={'#2196f3'}
                                    animation={true}
                                    onPress={(value) => { this.setState({ valueRadio: value }) }}
                                />
                            </View>

                            <View style={styles.textInputContainerStyle}>
                                <Text style={{ color: colors.BLACK, fontFamily: 'Inter-Bold', fontSize: 12, marginLeft: 10, marginBottom: 10 }}>Agência</Text>
                                <Input
                                    ref={input => (this.AgenNumInput = input)}
                                    editable={true}
                                    returnKeyType={'next'}
                                    underlineColorAndroid={colors.TRANSPARENT}
                                    value={this.state.AgenNum}
                                    keyboardType={'numeric'}
                                    inputStyle={styles.inputTextStyle}
                                    onChangeText={(text) => { this.setState({ AgenNum: text }) }}
                                    errorMessage={this.state.AgenNumValid ? null : 'Agência inválida, insira novamente'}
                                    secureTextEntry={false}
                                    maxLength={11}
                                    blurOnSubmit={true}
                                    onSubmitEditing={() => { this.validateAgen(); this.contaNumInput.focus() }}
                                    errorStyle={styles.errorMessageStyle}
                                    inputContainerStyle={styles.inputContainerStyle}
                                    containerStyle={styles.textInputStyle}
                                />
                            </View>

                            <View style={styles.textInputContainerStyle}>
                                <Text style={{ color: colors.BLACK, fontFamily: 'Inter-Bold', fontSize: 12, marginLeft: 10, marginBottom: 10 }}>Número da conta</Text>
                                <Input
                                    ref={input => (this.contaNumInput = input)}
                                    editable={true}
                                    returnKeyType={'next'}
                                    underlineColorAndroid={colors.TRANSPARENT}
                                    value={this.state.contaNum}
                                    keyboardType={'numeric'}
                                    inputStyle={styles.inputTextStyle}
                                    onChangeText={(text) => { this.setState({ contaNum: text }) }}
                                    errorMessage={this.state.contaNumValid ? null : 'Número da conta inválida, insira novamente sem ponto e hifén'}
                                    secureTextEntry={false}
                                    maxLength={11}
                                    blurOnSubmit={true}
                                    onSubmitEditing={() => { this.validateConta() }}
                                    errorStyle={styles.errorMessageStyle}
                                    inputContainerStyle={styles.inputContainerStyle}
                                    containerStyle={styles.textInputStyle}
                                />
                            </View>
                            <View style={{ height: 80, marginTop: 15 }}>
                                <TouchableOpacity
                                    onPress={() => this.onPressSacar()}
                                    disabled={this.state.loaderBtn}
                                    style={{ height: 60, marginHorizontal: 25, backgroundColor: colors.DEEPBLUE, justifyContent: 'center', alignItems: 'center', borderRadius: 15 }}
                                >
                                    <Text style={{ color: colors.WHITE, fontFamily: 'Inter-Bold', fontSize: 14 }}>Registrar</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={{ height: 60, marginTop: 5 }}>
                                <TouchableOpacity
                                    onPress={() => this.setState({ modalBanco: false })}
                                    disabled={this.state.loaderBtn}
                                    style={{ height: 50, marginHorizontal: 25, backgroundColor: colors.WHITE, justifyContent: 'center', alignItems: 'center', borderRadius: 15, borderColor: colors.DEEPBLUE, borderWidth: 1, }}
                                >
                                    <Text style={{ color: colors.RED, fontFamily: 'Inter-Bold', fontSize: 14 }}>Cancelar</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                        :
                        <View style={{ width: '90%', backgroundColor: colors.WHITE, borderRadius: 10, flex: 1, maxHeight: height / 1.8 }}>
                            {this.state.bancoDetails ?
                            <View style={{ flex: 1 }}>
                                <View style={{ marginTop: 25, justifyContent: 'center', alignItems: 'center' }}>
                                    <Text style={{ fontFamily: 'Inter-Bold', color: colors.BLACK, fontSize: 16 }}>Sua conta bancária</Text>
                                </View>
                                <View style={{ height: 50, marginTop: 15, backgroundColor: colors.GREY1, borderRadius: 15, marginHorizontal: 15, flexDirection: 'row', alignItems: 'center',}}>
                                    <View style={{ marginLeft: 15,paddingRight: 10, borderRightWidth: 1}}>
                                        <Text style={{ color: colors.BLACK, fontSize: 14, fontFamily: 'Inter-Bold'}}>Agência: {this.state.bancoDetails.agencia}</Text>
                                    </View>
                                    <View style={{ marginLeft: 10}}>
                                        <Text style={{ color: colors.BLACK, fontSize: 14, fontFamily: 'Inter-Bold' }}>Conta: {this.state.bancoDetails.conta}</Text>
                                    </View>
                                    <View style={{ position: 'absolute', right: 5, height: 45, width: 45, alignItems: 'center', justifyContent: 'center'}}>
                                        <TouchableOpacity
                                            onPress={() => {this.removeBanco()}}
                                            style={{ height: 45, width: 45, alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <Icon
                                                name='trash-2'
                                                type='feather'
                                                color={colors.RED}
                                            />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <View style={{ marginTop: 25 }}>
                                    <Text style={{ fontFamily: 'Inter-Bold', color: colors.BLACK, fontSize: 16, textAlign: 'center', marginBottom: 10 }}>Insira o valor do saque:</Text>
                                    <Input
                                    ref={input => (this.saqueNumInput = input)}
                                    editable={true}
                                    returnKeyType={'next'}
                                    underlineColorAndroid={colors.TRANSPARENT}
                                    value={this.state.saqueNum}
                                    keyboardType={'numeric'}
                                    inputStyle={styles.inputTextStyle}
                                    onChangeText={(text) => { this.setState({ saqueNum: text }) }}
                                    errorMessage={this.state.saqueNumValid ? null : 'Você não pussuí esse valor para saque, tente de novo.'}
                                    secureTextEntry={false}
                                    maxLength={11}
                                    blurOnSubmit={true}
                                    onSubmitEditing={() => { this.validateSaque() }}
                                    errorStyle={styles.errorMessageStyle}
                                    inputContainerStyle={styles.inputContainerStyle}
                                    containerStyle={styles.textInputStyle}
                                />
                                </View>
                                <View style={{ marginTop: 15, alignItems: 'center', justifyContent: 'center', marginHorizontal: 15, }}>
                                    <Text style={{ color: colors.BLACK, fontSize: 12, fontFamily: 'Inter-Bold', textAlign: 'center' }}>Os saques são realizados na quarta-feira, confira os dados de sua conta corretamente</Text>
                                </View>
                                <View style={{ flex: 1, justifyContent: 'flex-end', paddingBottom: 10 }}>
                                    <View style={{ height: 80, marginTop: 30, marginBottom: 5}}>
                                        <TouchableOpacity
                                            onPress={() => {this.validarSaque()}}
                                            disabled={this.state.loaderBtn}
                                            style={{ height: 60, backgroundColor: colors.DEEPBLUE, marginHorizontal: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' }}
                                        >
                                            <Text style={{ color: colors.WHITE, fontSize: 16, fontFamily: 'Inter-Bold' }}>Sacar</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <View style={{ height: 50}}>
                                        <TouchableOpacity
                                            onPress={() => {this.setState({ modalBanco: false })}}
                                            disabled={this.state.loaderBtn}
                                            style={{ height: 50, backgroundColor: colors.WHITE, marginHorizontal: 30 ,borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.RED}}
                                        >
                                            <Text style={{ color: colors.RED, fontSize: 16, fontFamily: 'Inter-Bold' }}>Voltar</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                            :
                            null}
                        </View>
                    }
                </View>

            </Modal>
        )
    }

    sacarSaldo() {
        if (this.state.saldo >= 30) {
            firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/').once('value', userDetails => {
                if (userDetails.val().contaBancaria) {
                    this.setState({ semBanco: false, modalBanco: true, bancoDetails: userDetails.val().contaBancaria })
                } else {
                    this.setState({ semBanco: true, modalBanco: true, cpfMotorista: userDetails.val().cpfNum })
                }
            })
        } else {
            alert('Não é possivel realizar saque abaixo de R$30,00.')
        }
    }

    pagarSaldo() {
        if (this.state.saldo <= -25) {
            alert('Envie uma mensagem ao suporte, para poder realizar o pagamento e desbloquear sua conta.')
        } else {
            alert('Você ainda não atingiu o limite de taxa negativa da Colt, mas, você pode realizar o pagamento, entre em contato com o suporte.')
        }
    }


    teste() {
        let curr = new Date()
        let week = []

        for (let i = 0; i <= 6; i++) {
            let first = curr.getDate() - curr.getDay() + i
            let day = new Date(curr.setDate(first))
            week.push(day)
        }

        let tamanho = this.state.myBooking.length;
        let arrayCorridas = this.state.myBooking.reverse();
        let tempDate = new Date().getDate();
        let tempIndex = new Date().getDay()
        let dias = 0;

        for (let i = tamanho - 1; i >= 0; i--) {
            let corridaRecente = new Date(arrayCorridas[i].data)

            //Verifica se o dia corrida é mesmo do dia atual
            if(tempIndex < 0) {
                break
            } else {
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
                    tempIndex = new Date().getDay() - dias;
                }
            }
        }
    }

    insertValues(param, value) {
        switch (param) {
            case 0:
                console.log(value + ' VALOR DOMINGO')
                this.objetoPrincipal.Dom += value
                break

            case 1:
                console.log(value + ' VALOR SEGUNDA')
                this.objetoPrincipal.Seg += value
                break

            case 2:
                console.log(value + ' VALOR TERÇA')
                this.objetoPrincipal.Ter += value
                break

            case 3:
                console.log(value + ' VALOR QUARTA')
                this.objetoPrincipal.Qua += value
                break

            case 4:
                console.log(value + ' VALOR QUINTA')
                this.objetoPrincipal.Qui += value
                break

            case 5:
                console.log(value + ' VALOR SEXTA')
                this.objetoPrincipal.Sex += value
                break

            case 6:
                console.log(value + ' VALOR SÁBADO')
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

                {/* GANHOS MENSAIS E SEMANAIS, FLEX: 1*/}
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
                                    <View style={{ flex: 2, alignItems: 'center', justifyContent: 'center' }}>
                                        <Text style={styles.tituloMensal2}>Ganhos esse mês</Text>
                                        <Text style={styles.txtMensal2}>R$ {this.state.thisMothh ? parseFloat(this.state.thisMothh).toFixed(2) : '0'}</Text>
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
                                    <Text style={styles.tituloMensal}>Saldo</Text>
                                    <Text style={[styles.txtMensal3, {color: this.state.saldo >= 0 ? '#32db64' : colors.RED}]}>R$ {this.state.saldo ? parseFloat(this.state.saldo).toFixed(2) : '0'}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* EXIBIÇÃO DO CHARTS, FLEX: 1 */}

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

                {/* SCROLLVIEW, FLEX: 1 */}

                <ScrollView style={{ flex: 0.5 }}>
                    <View style={{ justifyContent: 'center' }}>
                        <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 20 }}>
                            <TouchableOpacity style={{ flexDirection: 'row', width: width / 2.5, height: 40, backgroundColor: colors.DEEPBLUE, borderRadius: 15, justifyContent: 'center', alignItems: 'center' }}
                                onPress={() => this.pagarSaldo()}
                            >
                                <Text style={{ marginLeft: 5, fontSize: 16, fontFamily: 'Inter-Bold', color: colors.WHITE }}>Pagar saldo</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={{ flexDirection: 'row', width: width / 2.5, height: 40, backgroundColor: colors.DEEPBLUE, borderRadius: 15, justifyContent: 'center', alignItems: 'center' }}
                                onPress={() => this.sacarSaldo()}
                            >
                                <Text style={{ marginLeft: 5, fontSize: 16, fontFamily: 'Inter-Bold', color: colors.WHITE }}>Sacar saldo</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
                {this.modalBanco()}
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
        color: colors.WHITE
    },

    txtMensal3: {
        fontFamily: 'Inter-Bold',
        fontSize: 28,
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

    errorMessageStyle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 0
    },

    inputContainerStyle: {
        borderRadius: 10,
        backgroundColor: colors.GREY1,
        borderBottomWidth: 0,
    },

    textInputStyle: {
        marginLeft: 0,
    },

    inputTextStyle: {
        color: colors.BLACK,
        fontSize: 13,
        marginLeft: 12,
        marginRight: 12,
        height: 32
    },

    textInputContainerStyle: {
        padding: 15,
    },


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