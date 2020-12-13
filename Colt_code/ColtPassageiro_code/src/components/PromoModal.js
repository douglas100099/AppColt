import React from 'react';
import {
    View,
    Text,
    Dimensions,
    Modal,
    ActivityIndicator,
    StyleSheet,
    Alert,
    Platform,
    TouchableOpacity,
} from 'react-native';
import { Icon, Input } from 'react-native-elements';
import { colors } from '../common/theme';
var { width, height } = Dimensions.get('window');
import * as firebase from 'firebase';
import languageJSON from '../common/language';
import { VerifyCupom } from '../common/VerifyCupom';
import dateStyle from '../common/dateStyle';
import { PromoComp } from "../components";

export default class PromoModal extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            curUID: firebase.auth().currentUser,
            promoCodeValid: true,
        }
    }

    async checkUserPromo(param) {
        let obj = {}
        
        if (param && param.user_avail != undefined) {
            obj = param.user_avail.details
            for (let key in obj) {
                if (obj[key].userId == this.state.curUID.uid) {
                    return true
                }
            }
        } else {
            return false
        }
    }

    async consultPromo() {
        this.setState({ checkPromoBtn: true })
        var promoDetails = {}
        const promoData = firebase.database().ref('offers/');
        return promoData.once('value', promoData => {
            if (promoData.val()) {
                let promo = promoData.val();
                for (let key in promo) {
                    promo[key].promoKey = key
                    if (promo[key].promoCode) {
                        if (promo[key].promoCode == this.state.promoCode.toUpperCase()) {
                            promoDetails = promo[key]
                            break
                        }
                    }
                }
            }
        }).then(() => {
            return promoDetails
        })
    }

    async checkPromo(item, index) {
        const { payDetails, selected, onSucessPromo, estimateFare } = this.props

        if (payDetails) {
            Alert.alert(
                "Alerta!",
                "Você já possui um cupom ativo!",
                [
                    {
                        text: 'OK', onPress: () => {
                            this.setState({ checkPromoBtn: false, checkPromoBtn2: false })
                            onSucessPromo(null, null, null, null)
                        }
                    }
                ],
                { cancelable: false }
            );
        }
        else if (item != null && index != null) {
            this.checkUserPromo(item).then((response) => {
                if (response == false) {
                    let verifyCupomData = {}
                    verifyCupomData = VerifyCupom(item, estimateFare, selected);

                    setTimeout(() => {
                        if (verifyCupomData.promo_applied != undefined) {
                            this.setState({ checkPromoBtn: false, checkPromoBtn2: false })
                            
                            if(verifyCupomData.values.length >= 2){
                                onSucessPromo(verifyCupomData.values[0], verifyCupomData.values[1], verifyCupomData, verifyCupomData.metodoPagamento)
                            }
                        } else {
                            alert(verifyCupomData)
                            this.setState({ checkPromoBtn2: false })
                        }
                    }, 1000)
                } else {
                    this.setState({ checkPromoBtn: false, checkPromoBtn2: false, promoCodeValid: false })
                    alert("Você já usou esse cupom em uma corrida anterior!")
                }
            })
        }
        else if (this.state.promoCode != null) {
            this.consultPromo().then((response) => {
                var promo = {}
                promo = response
                if (promo.promoKey != undefined) {
                    this.checkUserPromo(promo).then((res) => {

                        if (res == false) {
                            let verifyCupomData = VerifyCupom(promo, estimateFare, selected);

                            if (verifyCupomData.promo_applied != undefined) {
                                this.setState({ checkPromoBtn: false, checkPromoBtn2: false })

                                if(verifyCupomData.values.length >= 2){
                                    onSucessPromo(verifyCupomData.values[0], verifyCupomData.values[1], verifyCupomData, verifyCupomData.metodoPagamento)
                                }
                            } else {
                                alert(verifyCupomData)
                                this.setState({ checkPromoBtn: false })
                            }
                        } else {
                            this.setState({ checkPromoBtn: false, promoCodeValid: false })
                            alert("Você já usou esse cupom em uma corrida anterior!")
                        }
                    })
                } else {
                    this.setState({ checkPromoBtn: false, promoCodeValid: false })
                    alert("Código promocional inválido!")
                }
            })
        } else {
            this.setState({ checkPromoBtn: false, promoCodeValid: false })
            alert("Código promocional inválido!")
        }
    }

    render() {
        const { closeModalPayment } = this.props
        return (
            <Modal
                animationType="slide"
                visible={true}
            >
                <View style={styles.promoModalContainer}>
                    <View style={styles.viewTopPromoModal}>
                        <View style={styles.HeaderPromoModal}>
                            <View style={{ marginLeft: 10 }}>
                                <Text style={{ fontFamily: "Inter-Medium", fontSize: 23, opacity: 0.4 }}> Promoções </Text>
                            </View>
                            <View style={{ position: 'absolute', right: 0 }}>
                                <TouchableOpacity style={{ marginRight: 15 }} onPress={closeModalPayment}>
                                    <Icon
                                        name='x'
                                        type='feather'
                                        color={colors.GREY1}
                                        size={34}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                    <View style={{ marginHorizontal: 30 }}>
                        <Input
                            placeholder='Digite seu cupom...'
                            leftIcon={{
                                name: 'tag',
                                type: 'octicon',
                                color: colors.BLACK,
                                size: 25,
                                opacity: 0.4,
                            }}
                            containerStyle={{ marginTop: 20 }}
                            inputStyle={{ marginLeft: 12 }}
                            onChangeText={(text) => { this.setState({ promoCode: text }) }}
                            value={this.state.promoCode}
                            errorMessage={this.state.promoCodeValid ? null : "Cupom inválido"}
                        />
                    </View>
                    <TouchableOpacity style={styles.btnConfirmarPromoModal} disabled={this.state.checkPromoBtn} onPress={() => { this.checkPromo(), this.setState({ checkPromoBtn: true }) }}>
                        {
                            this.state.checkPromoBtn ?
                                <ActivityIndicator
                                    size={'small'}
                                    color={colors.WHITE}
                                />
                                :
                                <Text style={styles.textConfirmarPromoModal}> Confirmar </Text>
                        }
                    </TouchableOpacity>

                    <View style={{ justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
                        <Text style={{ fontFamily: 'Inter-Medium', fontSize: 15 }}> ou escolha uma das promoções abaixo. </Text>
                    </View>
                    {this.state.checkPromoBtn2 ?
                        <View style={{ marginTop: 15, flexDirection: 'row', alignItems: 'center', alignSelf: 'center' }}>
                            <ActivityIndicator
                                size={'small'}
                                color={colors.DEEPBLUE}
                            />
                            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 16 }}> Aplicando cupom... </Text>
                        </View>
                        :
                        <PromoComp onPressButton={(item, index) => { this.checkPromo(item, index, false), this.setState({ checkPromoBtn2: true }) }}></PromoComp>
                    }

                </View>
            </Modal>
        )
    }
}

const styles = StyleSheet.create({
    promoModalContainer: {
        flex: 1
    },
    viewTopPromoModal: {
        backgroundColor: colors.WHITE,
        width: width,
        height: Platform.OS == 'ios' ? 90 : 75,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowOffset: { x: 0, y: 0 },
        shadowRadius: 10,
        elevation: 15,
    },
    HeaderPromoModal: {
        marginTop: Platform.OS == 'ios' ? 20 : null,
        width: width,
    },
    btnConfirmarPromoModal: {
        backgroundColor: colors.DEEPBLUE,
        height: 40,
        marginHorizontal: 75,
        borderRadius: 50,
        marginTop: 40,
        marginBottom: 5,
        justifyContent: 'center',
        alignItems: 'center'
    },
    textConfirmarPromoModal: {
        fontFamily: 'Inter-Bold',
        fontSize: 17,
        color: colors.WHITE
    },
})