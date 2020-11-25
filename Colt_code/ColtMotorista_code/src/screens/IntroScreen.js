import React, { Component } from "react";
import {
    StyleSheet,
    View,
    ImageBackground,
    Dimensions,
    Modal,
    Platform,
    Image,
    ActivityIndicator,
    Text,
    TouchableOpacity,
    TextInput,
} from "react-native";
var { width } = Dimensions.get('window');
import languageJSON from '../common/language';
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import { colors } from '../common/theme';
import * as firebase from 'firebase'

export default class IntroScreen extends Component {
    recaptchaVerifier = null;
    firebaseConfig = firebase.apps.length ? firebase.app().options : undefined;

    static navigationOptions = {
        headerShown: false
    }

    constructor(props) {
        super(props);

        this.state = {
            phoneNumber: null,
            verificationId: null,
            verificationCode: null,
            countryCode: '+55',
            loaderBtn: false,
            btnLogin: false,
            btnContinuar: false,
            entrando: false,
        }
    }

    onPressLogin = async () => {
        this.setState({ btnLogin: true })
        if (this.state.countryCode && this.state.countryCode !== languageJSON.select_country) {
            if (this.state.phoneNumber) {
                let formattedNum = this.state.phoneNumber.replace(/ /g, '');
                formattedNum = this.state.countryCode + formattedNum.replace(/-/g, '');
                if (formattedNum.length >= 14) {
                    try {
                        const phoneProvider = new firebase.auth.PhoneAuthProvider();
                        const verificationId = await phoneProvider.verifyPhoneNumber(
                            formattedNum,
                            this.recaptchaVerifier
                        );
                        this.setState({ verificationId: verificationId, loaderBtn: true });
                    } catch (error) {
                        alert('Ops, tivemos um problema.');
                   }
                } else {
                    alert('Insira um número válido.');  
                }
            } else {
                alert('Insira um número de Celular');
            }
        } else {
            alert('Código do país inválido');
        }
        this.setState({loaderBtn: false, btnLogin: false })
    }

    onSignIn = async () => {
        this.setState({ btnContinuar: true, entrando: true })
        try {
            const credential = firebase.auth.PhoneAuthProvider.credential(
                this.state.verificationId,
                this.state.verificationCode
            );
            await firebase.auth().signInWithCredential(credential).then(
                this.setState({
                    phoneNumber: null,
                    verificationId: null,
                    verificationCode: null
                })
            )
        } catch (err) {
            alert('Código de verificação inválido');
            this.setState({ btnContinuar: false, entrando: false })
        }
    }

    loading() {
        return (
            <Modal
                animationType="fade"
                transparent={true}
                visible={this.state.entrando}
            >
                <View style={{ flex: 1, backgroundColor: "rgba(22,22,22,0.8)", justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{ width: '85%', backgroundColor: colors.WHITE, borderRadius: 15, flex: 1, maxHeight: 180 }}>
                        <View style={{ alignItems: 'center', flexDirection: 'column', flex: 1, justifyContent: "center" }}>
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                <Text style={{ color: colors.BLACK, fontSize: 20, fontFamily: 'Inter-Bold' }}>Carregando...</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        )
    }

    async CancelLogin() {
        this.setState({
            phoneNumber: null,
            verificationId: null,
            verificationCode: null,
            loaderBtn: false,
            entrando: false,
        });
    }

    onPressLoginEmail = async () => {
        this.props.navigation.navigate("EmailLogin");
    }

    onPressLoginMobile = async () => {
        this.props.navigation.navigate("MobileLogin");
    }

    render() {
        return (
            <View style={styles.container}>
                <View style={styles.viewMainImg}>
                    <View style={styles.viewImg}>
                        <FirebaseRecaptchaVerifierModal
                            ref={ref => (this.recaptchaVerifier = ref)}
                            firebaseConfig={this.firebaseConfig}
                        />
                    </View>
                    <View style={styles.txtWelcome}>
                        <Text style={styles.txtInput}>Seja bem vindo ao Colt</Text>
                        <Text style={styles.txtInput2}>Cadastre-se para se tornar um motorista parceiro</Text>
                    </View>
                </View>
                <View style={styles.viewMainInput}>
                    {this.state.verificationId && this.state.entrando === false ? null :
                    <View style={styles.viewInput}>
                        <Text style={styles.txtInput3}>Insira seu numero</Text>
                        <View style={styles.inputMobile}>
                            <Text style={{ position: 'absolute', marginLeft: 8, borderRightWidth: 1, paddingRight: 10, borderRightColor: colors.BLACK }}>+55</Text>
                            <TextInput
                                ref={(ref) => { this.mobileInput = ref }}
                                style={styles.textInput}
                                onChangeText={(value) => this.setState({ phoneNumber: value })}
                                value={this.state.phoneNumber}
                                editable={!!this.state.verificationId ? false : true}
                                keyboardType="phone-pad"
                                maxLength={11}
                            />
                        </View>
                    </View>
                    }
                    {!!this.state.verificationId  ?
                        <View style={styles.viewInput}>
                            <Text style={styles.txtInput3}>Insira o código SMS</Text>
                            <View style={styles.inputMobile}>
                                <TextInput
                                    ref={(ref) => { this.otpInput = ref }}
                                    style={styles.textInputSMS}
                                    onChangeText={(value) => this.setState({ verificationCode: value })}
                                    value={this.state.verificationCode}
                                    ditable={!!this.state.verificationId}
                                    keyboardType="phone-pad"
                                />
                            </View>
                        </View>
                        : null}
                    {this.state.verificationId && this.state.entrando === false ? null :
                        <TouchableOpacity
                            onPress={() => this.onPressLogin()}
                            style={styles.materialButtonDark}
                        >
                            <Text style={styles.txtBtn}>Login ou Cadastrar</Text>
                            {this.state.btnLogin ?
                            <ActivityIndicator size="large" color="#FFFF" />
                            : null}
                        </TouchableOpacity>
                    }
                    {!!this.state.verificationId ?
                        <TouchableOpacity
                            onPress={() => this.onSignIn()}
                            disabled={this.state.loaderBtn}
                            style={styles.materialButtonDark}
                        >
                            <Text style={styles.txtBtn}>Continuar</Text>
                            {this.state.btnContinuar ?
                            <ActivityIndicator size="large" color="#FFFF" />
                            : null}
                        </TouchableOpacity>
                    : null }
                    {this.state.verificationId ?
                        <TouchableOpacity
                            onPress={() => this.CancelLogin()}
                            style={styles.materialButtonDark}
                            disabled={this.state.loaderBtn}
                        >
                            <Text style={styles.txtBtn}>Voltar</Text>
                        </TouchableOpacity>
                    : null}
                    <Text style={styles.txtTermos}>Ao se cadastrar você aceita todos os termos de uso</Text>
                </View>
                {this.loading()}
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop: Platform.select({ ios: 60, android: 50 }),
        justifyContent: 'center',
        alignItems: 'center',
    },

    viewMainImg: {
        flex: 1,
        justifyContent: 'center',
    },

    viewMainInput: {
        flex: 1.3
    },

    viewImg: {
        alignSelf: 'center',
        width: 180,
        height: 70,
    },

    txtWelcome: {
        alignItems: 'center',
    },

    imagebg: {
        width: 180,
        height: 70,
    },
    topSpace: {
        marginTop: 0,
        marginLeft: 0,
        marginRight: 0,
    },

    inputMobile: {
        height: 40,
        width: width / 1.22,
        justifyContent: 'center',
        backgroundColor: colors.GREY1,
        borderRadius: 10,
    },

    textInput: {
        fontFamily: 'Inter-Regular',
        marginLeft: 50,
        marginRight: 12,
    },

    textInputSMS: {
        fontFamily: 'Inter-Regular',
        marginLeft: 12,
        marginRight: 12,
    },

    txtInput2: {
        fontFamily: 'Inter-Regular',
        fontSize: 12,
        color: colors.BLACK,
        marginLeft: 12,
        marginRight: 12,
        marginBottom: 25,
    },

    txtInput3: {
        fontFamily: 'Inter-SemiBold',
        color: colors.BLACK,
        fontSize: 18,
        marginLeft: 12,
        marginRight: 12,
        marginBottom: 5,
    },

    viewInput: {
        alignItems: 'center',
    },

    txtInput: {
        fontFamily: 'Inter-ExtraBold',
        color: colors.BLACK,
        fontSize: 18,
    },

    viewInput2: {
        position: 'absolute',
        width: 25,
        height: 45,
        backgroundColor: colors.BLACK,
    },

    materialButtonDark: {
        height: 50,
        width: width / 1.22,
        flexDirection: 'row',
        alignSelf: 'center',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        borderRadius: 50,
        backgroundColor: colors.DEEPBLUE,
    },

    txtBtn: {
        fontFamily: 'Inter-Bold',
        fontSize: 16,
        color: colors.WHITE,
    },

    txtTermos: {
        position: 'absolute',
        bottom: 20,
        fontFamily: 'Inter-SemiBold',
        fontSize: 12,
        color: colors.GREY2,
        alignSelf: 'center',
    },

    materialButtonDark2: {
        height: 40,
        marginTop: 14,
        marginLeft: 35,
        marginRight: 35,
        backgroundColor: "#3b3b3b",
    },
    actionLine: {
        height: 20,
        flexDirection: "row",
        marginTop: 20,
        alignSelf: 'center'
    },
    actionItem: {
        height: 20,
        marginLeft: 15,
        marginRight: 15,
        alignSelf: "center"
    },
    actionText: {
        fontSize: 15,
        fontFamily: "Roboto-Regular",
        fontWeight: 'bold'
    }
});
