import React, { Component } from "react";
import {
    StyleSheet,
    View,
    Image,
    Text,
    Platform,
    Dimensions,
    TextInput
} from "react-native";
import * as firebase from 'firebase'
var { height, width } = Dimensions.get('window');
import languageJSON from '../common/language';
import { TouchableOpacity } from "react-native-gesture-handler";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import { Icon } from 'react-native-elements';
import RNPickerSelect from 'react-native-picker-select';
import countries from '../common/countries';
import { colors } from "../common/theme";

export default class MobileLoginScreen extends Component {

    recaptchaVerifier = null;
    firebaseConfig = firebase.apps.length ? firebase.app().options : undefined;

    constructor(props) {
        super(props);
        let arr = [];
        for (let i = 0; i < countries.length; i++) {
            arr.push({ label: countries[i].label + " (+" + countries[i].phone + ")", value: "+" + countries[i].phone, key: countries.code });
        }

        this.state = {
            phoneNumber: null,
            verificationId: null,
            verificationCode: null,
            countryCodeList: arr,
            countryCode: null,
            btnConfirmar: false
        }
    }

    /*onPressLogin = async () => {
        if (this.state.countryCode && this.state.countryCode !== languageJSON.select_country) {
            if (this.state.phoneNumber) {
                let formattedNum = this.state.phoneNumber.replace(/ /g, '');
                formattedNum = this.state.countryCode + formattedNum.replace(/-/g, '');
                if (formattedNum.length > 8) {
                    try {
                        const phoneProvider = new firebase.auth.PhoneAuthProvider();
                        const verificationId = await phoneProvider.verifyPhoneNumber(
                            formattedNum,
                            this.recaptchaVerifier
                        );
                        this.setState({ verificationId: verificationId });
                    } catch (error) {
                        alert(error.message);
                    }
                } else {
                    alert(languageJSON.mobile_no_blank_error);
                }
            } else {
                alert(languageJSON.mobile_no_blank_error);
            }
        } else {
            alert(languageJSON.country_blank_error);
        }
    }*/

    async UNSAFE_componentWillMount() {
        const verificationId = await this.props.navigation.getParam('verificationId')
        const phoneNumber = await this.props.navigation.getParam('phoneNumber')
        this.setState({ verificationId: verificationId, phoneNumber: phoneNumber })
    }

    onSignIn = async () => {
        this.setState({ btnConfirmar: true })
        try {
            const credential = firebase.auth.PhoneAuthProvider.credential(
                this.state.verificationId,
                this.state.verificationCode
            );
            await firebase.auth().signInWithCredential(credential);
            this.setState({
                phoneNumber: null,
                verificationId: null,
                verificationCode: null
            });
        } catch (err) {
            this.setState({ btnConfirmar: false })
            alert(languageJSON.otp_error);
        }
    }
    

    async CancelLogin() {
        this.setState({
            phoneNumber: null,
            verificationId: null,
            verificationCode: null
        });
        this.props.navigation.goBack();
    }

    render() {
        return (
            <View style={styles.container}>
                <Text style={{ alignSelf: 'center', fontFamily: 'Inter-Medium', fontSize: 20, marginTop: Platform.OS == 'ios' ? 60 : 50 }}> Código de verificação </Text>

                <Text style={{ alignSelf: 'center', marginTop: 50, fontFamily: 'Inter-Medium', fontSize: 15 }}> Digite o código enviado para {this.state.phoneNumber} </Text>
                <View style={{ marginTop: Platform.OS == 'ios' ? 50 : 70 }}>
                    <View style={styles.box2}>
                        <TextInput
                            ref={(ref) => { this.otpInput = ref }}
                            style={styles.textInput}
                            placeholder={languageJSON.otp_here}
                            onChangeText={(value) => this.setState({ verificationCode: value })}
                            value={this.state.verificationCode}
                            ditable={!!this.state.verificationId}
                            keyboardType="phone-pad"
                            secureTextEntry={false}
                        />
                    </View>

                    <TouchableOpacity
                        onPress={this.onSignIn}
                        style={styles.btnConfirmar}
                        disabled={this.state.btnConfirmar}
                    >
                        <Text style={{ fontFamily: 'Inter-Bold', fontSize: width < 375 ? 16 : 18, color: colors.WHITE }}>{languageJSON.authorize}</Text>
                    </TouchableOpacity>

                    <View style={styles.actionLine}>
                        <TouchableOpacity style={styles.actionItem} onPress={() => this.CancelLogin()}>
                            <Text style={styles.actionText}>{languageJSON.cancel}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    topBar: {
        marginTop: 20,
        justifyContent: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1
    },
    btnVoltar: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        position: 'absolute',
        left: 0
    },
    imagebg: {
        position: 'absolute',
        left: 0,
        top: 0,
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    },
    backButton: {
        marginTop: 0,
        marginLeft: 0,
        marginRight: 0,
        height: Dimensions.get('window').height * 0.55
    },
    backButtonImage: {
        height: 40,
        width: 40,
        marginTop: 50,
        marginLeft: 35,
        marginTop: 45
    },
    logintext: {
        color: "rgba(0,0,0,1)",
        fontSize: width < 375 ? 18 : 20,
        fontFamily: "Inter-Bold",
        marginTop: 0,
        alignSelf: "center"
    },
    box1: {
        height: 45,
        backgroundColor: "rgba(255,255,255,1)",
        marginTop: 12,
        marginHorizontal: 50,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.1)",
        borderRadius: 5,
        justifyContent: 'center'
    },
    box2: {
        height: 45,
        marginTop: 10,
        marginHorizontal: 50,
        borderBottomWidth: 2,
        borderColor: "rgba(0,0,0,0.1)",
        borderRadius: 5,
        justifyContent: 'center'
    },
    pickerStyle: {
        color: "#121212",
        fontFamily: "Inter-Regular",
        fontSize: 18,
        marginLeft: 5
    },

    textInput: {
        color: "#121212",
        fontSize: Platform.OS == 'ios' ? 18 : 16,
        fontFamily: "Inter-Regular",
        textAlign: "left",
        marginLeft: Platform.OS == 'ios' ? 5 : 8,
    },
    materialButtonDark: {
        height: 40,
        marginTop: 22,
        marginLeft: 35,
        marginRight: 35,
        backgroundColor: colors.BLACK,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 5
    },
    btnConfirmar: {
        height: 40,
        marginTop: 22,
        marginLeft: 35,
        marginRight: 35,
        backgroundColor: colors.DEEPBLUE,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 5
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
        fontSize: 16,
        color: colors.RED,
        fontFamily: "Inter-Bold",
    }
});
