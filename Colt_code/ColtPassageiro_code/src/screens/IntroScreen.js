import React, { Component } from "react";
import {
    StyleSheet,
    View,
    Text,
    Dimensions,
    Linking,
    Platform,
    TextInput,
    Alert
} from "react-native";
import { Icon } from 'react-native-elements';
import * as firebase from 'firebase'
import languageJSON from '../common/language';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from "expo-crypto";
import { colors } from '../common/theme';
import { TouchableOpacity } from "react-native-gesture-handler";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
var { width, height } = Dimensions.get('window');
import {
    iosStandaloneAppClientId,
    androidStandaloneAppClientId
} from '../common/key';
import * as Google from 'expo-google-app-auth';
import distanceCalc from '../common/distanceCalc';

import { google_map_key } from '../common/key';
import * as Location from 'expo-location';
import * as Permissions from 'expo-permissions';
import Geocoder from 'react-native-geocoding';

import { Swing, Pulse } from 'react-native-animated-spinkit'

export default class IntroScreen extends Component {
    recaptchaVerifier = null;
    firebaseConfig = firebase.apps.length ? firebase.app().options : undefined;

    constructor(props) {
        super(props);
        Geocoder.init(google_map_key);
        this.state = {
            phoneNumber: null,
            verificationId: null,
            verificationCode: null,
            countryCode: null,
            btnConfirmar: false,
            dontCreateAccount: null
        },
            this._getLocationAsync()
    }

    async googleLogin() {
        try {
            const config = {
                iosStandaloneAppClientId: iosStandaloneAppClientId,
                androidStandaloneAppClientId: androidStandaloneAppClientId
            };
            const { type, idToken } = await Google.logInAsync(config);
            if (type === 'success') {
                const credential = firebase.auth.GoogleAuthProvider.credential(idToken);
                firebase.auth().signInWithCredential(credential)
                    .then((user) => {
                        if (user) {
                            if (user.additionalUserInfo.isNewUser == true) {
                                var data = user.additionalUserInfo;
                                data.profile.mobile = "";
                                this.props.navigation.navigate("Reg", { requireData: data })
                            } else {
                                this.props.navigation.navigate('Root');
                            }
                        }
                    }).catch(error => {
                        alert(languageJSON.google_login_auth_error + error.message);
                    }
                    )
            }
            else {
                alert(languageJSON.google_login_auth_error + 'Token Error');
            }
        } catch (error) {
            alert(languageJSON.google_login_auth_error + error.message);
        }
    }

    onPressLogin = async () => {
        if (this.state.dontCreateAccount == null) {
            Alert.alert(
                'Só mais um instante!',
                'Estamos preparando o app pra você!',
                [
                    {
                        style: 'default',
                        text: 'Confirmar',
                    },
                ],
                { cancelable: true },
            );
        }
        else if (this.state.dontCreateAccount) {
            Alert.alert(
                'Ops!',
                'No momento, atendemos a cidade de Valença-RJ. Certifique-se de criar sua conta nessa região!',
                [
                    {
                        style: 'default',
                        text: 'Confirmar',
                    },
                ],
                { cancelable: true },
            );
        } else {
            if (this.state.phoneNumber) {
                let formattedNum = this.state.phoneNumber.replace(/ /g, '');
                formattedNum = '+55' + formattedNum.replace(/-/g, '');
                if (formattedNum.length > 8) {
                    try {
                        const phoneProvider = new firebase.auth.PhoneAuthProvider();
                        const verificationId = await phoneProvider.verifyPhoneNumber(
                            formattedNum,
                            this.recaptchaVerifier
                        );
                        this.props.navigation.navigate("MobileLogin", { verificationId: verificationId, phoneNumber: formattedNum });
                        //this.setState({ verificationId: verificationId });
                    } catch (error) {
                        alert(error.message);
                    }
                } else {
                    alert(languageJSON.mobile_no_blank_error);
                }
            } else {
                alert(languageJSON.mobile_no_blank_error);
            }
        }
    }

    _getLocationAsync = async () => {
        await Location.requestPermissionsAsync();
        let { status } = await Permissions.askAsync(Permissions.LOCATION);
        let gpsActived = await Location.hasServicesEnabledAsync()

        if (status !== 'granted') {
            alert("Para acessar sua localização, é necessário sua permissão!");
        }
        else if (!gpsActived) {
            alert("Ative seu GPS para permitir que a Colt determine sua localização");
        }
        else {
            let location = Platform.OS === 'android' ? await Location.getCurrentPositionAsync({ enableHighAccuracy: true, maximumAge: 1000, timeout: 20000, }) :
                await Location.getCurrentPositionAsync({ enableHighAccuracy: true, maximumAge: 1000, timeout: 2000, })
            if (location) {
                let distance = distanceCalc([-22.224650, -43.867618], [location.coords.latitude, location.coords.longitude])
                if (distance > 50) {
                    this.setState({ dontCreateAccount: true })
                    Alert.alert(
                        'Ops!',
                        'No momento, atendemos a cidade de Valença-RJ. Certifique-se de criar sua conta nessa região!',
                        [
                            {
                                style: 'default',
                                text: 'Confirmar',
                            },
                        ],
                        { cancelable: true },
                    );
                }
                else {
                    this.setState({ dontCreateAccount: false })
                }
            }
        }
    }

    /*async FbLogin() {

        try {
            await Facebook.initializeAsync(facebook_id);
            const {
                type,
                token
            } = await Facebook.logInWithReadPermissionsAsync({
                permissions: ['public_profile', "email"],
            });
            if (type === 'success') {
                const credential = firebase.auth.FacebookAuthProvider.credential(token);
                firebase.auth().signInWithCredential(credential)
                    .then((user) => {
                        if (user) {
                            if (user.additionalUserInfo.isNewUser == true) {
                                var data = user.additionalUserInfo;
                                data.profile.mobile = "";
                                this.props.navigation.navigate("Reg", { requireData: data })
                            } else {
                                this.props.navigation.navigate('Root');
                            }
                        }
                    }).catch(error => {
                        alert(languageJSON.facebook_login_auth_error + error.message);
                    }
                    )
            }
            else {
                alert(languageJSON.facebook_login_auth_error);
            }
        } catch ({ message }) {
            alert(languageJSON.facebook_login_auth_error`${message}`);
        }
    }*/

    /*appleSigin = async () => {

        const csrf = Math.random().toString(36).substring(2, 15);
        const nonce = Math.random().toString(36).substring(2, 10);
        const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, nonce);
        try {
            const applelogincredentials = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
                state: csrf,
                nonce: hashedNonce
            });
            const provider = new firebase.auth.OAuthProvider('apple.com');
            const credential = provider.credential({
                idToken: applelogincredentials.identityToken,
                rawNonce: nonce,
            });
            firebase.auth().signInWithCredential(credential)
                .then((user) => {
                    if (user) {
                        if (user.additionalUserInfo.isNewUser == true) {
                            var data = user.additionalUserInfo;
                            this.props.navigation.navigate("Reg", { requireData: data })
                        } else {
                            this.props.navigation.navigate('Root');
                        }
                    }
                })
                .catch((error) => {
                    alert(languageJSON.apple_signin_error);
                    console.log(error);
                });

        } catch (e) {
            if (e.code === 'ERR_CANCELED') {
                console.log("Cencelled");
            } else {
                alert(languageJSON.apple_signin_error);
            }
        }
    }*/

    onPressLoginEmail = async () => {
        if (false) {
            Alert.alert(
                'Ops!',
                'No momento, atendemos a cidade de Valença-RJ. Certifique-se de criar sua conta nessa região!',
                [
                    {
                        style: 'default',
                        text: 'Confirmar',
                    },
                ],
                { cancelable: true },
            );
        }
        else if (false) {
            Alert.alert(
                'Só mais um instante!',
                'Estamos preparando o app pra você!',
                [
                    {
                        style: 'default',
                        text: 'Confirmar',
                    },
                ],
                { cancelable: true },
            );
        }
        else {
            this.props.navigation.navigate("EmailLogin");
        }
    }

    /*onPressLoginMobile = async () => {
        this.props.navigation.navigate("MobileLogin");
    }*/

    async openTerms() {
        Linking.openURL("https://exicube.com/privacy-policy.html").catch(err => console.error("Não possível carregar a página", err));
    }

    render() {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignContent: 'center' }}>
                <FirebaseRecaptchaVerifierModal
                    ref={ref => (this.recaptchaVerifier = ref)}
                    firebaseConfig={this.firebaseConfig}
                />
                <View style={{ alignItems: 'center', justifyContent: 'flex-end' }}>
                    <Text style={{ alignSelf: 'center', marginTop: Platform.OS == 'ios' ? 75 : 50, fontFamily: 'Inter-Bold', fontSize: width < 375 ? 18 : 20 }}> Seja bem vindo a COLT </Text>
                </View>
                <View style={{}}>
                    <View style={{ marginTop: 40 }}>
                        <Text style={{ alignSelf: 'flex-start', marginLeft: Platform.OS == 'ios' ? 8 : 10, fontSize: width < 375 ? 18 : 20, fontFamily: 'Inter-Regular' }}> Digite seu número de telefone</Text>
                        <View style={{ flexDirection: 'row', marginTop: 10, alignItems: 'flex-end' }}>

                            <View style={styles.box1}>
                                <Text style={{ opacity: .4, marginLeft: 7, fontFamily: 'Inter-Bold', fontSize: 16 }}> +55 </Text>
                            </View>

                            <View style={styles.box2}>
                                <TextInput
                                    ref={(ref) => { this.mobileInput = ref }}
                                    style={styles.textInput}
                                    placeholder={languageJSON.mobile_no_placeholder}
                                    onChangeText={(value) => this.setState({ phoneNumber: value })}
                                    value={this.state.phoneNumber}
                                    editable={!!this.state.verificationId ? false : true}
                                    keyboardType="phone-pad"
                                />
                            </View>
                        </View>
                    </View>

                    <View style={{ marginTop: 35 }}>
                        <TouchableOpacity style={{ height: 50, elevation: 5, borderRadius: 5, marginHorizontal: 40, backgroundColor: colors.DEEPBLUE, justifyContent: 'center', alignItems: 'center' }} onPress={this.onPressLogin}>
                            <Text style={{ color: colors.WHITE, fontFamily: 'Inter-Bold', fontSize: 18 }}> Confirmar  </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={{ flex: 1, }}>
                    <Text style={{ alignSelf: 'center', margin: 10, fontFamily: 'Inter-Medium', fontSize: 15, }}> ou se preferir </Text>

                    <TouchableOpacity onPress={() => this.onPressLoginEmail()}>
                        <View style={{ borderRadius: 5, marginHorizontal: 80, borderWidth: 2, borderColor: colors.GREY2, height: 45, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', alignItems: 'center' }}>
                            <Icon
                                name='ios-mail'
                                type='ionicon'
                                color={colors.BLACK}
                                size={22}
                                containerStyle={{ opacity: .3 }}
                            />
                            <Text style={{ marginLeft: 10, color: colors.BLACK, fontFamily: 'Inter-Bold', fontSize: 18 }}> Entrar com email </Text>
                        </View>
                    </TouchableOpacity>
                </View>
                
                {this.state.dontCreateAccount == null ? 
                <View style={{ position: 'absolute', bottom: 40, alignSelf: "center", flexDirection: 'column' , justifyContent: 'center', alignItems: 'center'}}>
                    <Swing
                        size={50}
                        color={colors.DEEPBLUE}
                    />
                    <Text style={{ fontFamily: "Inter-Medium", fontSize: 16 }}> Estamos preparando as configurações! </Text>
                </View> 
                : null}
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.WHITE
    },
    box1: {
        width: 55,
        height: 40,
        backgroundColor: "rgba(0,0,0,.1)",
        borderRadius: 5,
        justifyContent: 'center',
        marginLeft: 10
    },
    box2: {
        height: 45,
        width: width - 80,
        borderBottomWidth: 2,
        borderColor: "rgba(0,0,0,0.1)",
        borderRadius: 5,
        marginTop: 10,
        justifyContent: 'center'
    },
    textInput: {
        color: "#121212",
        fontSize: Platform.OS == 'ios' ? 19 : 16,
        fontFamily: "Inter-Regular",
        textAlign: "left",
        marginLeft: Platform.OS == 'ios' ? 8 : 10,
    },
    pickerStyle: {
        color: "#121212",
        fontFamily: "Inter-Regular",
        fontSize: 15,
        marginLeft: Platform.OS == 'ios' ? 5 : 0,
    },
    imagebg: {
        position: 'absolute',
        left: 0,
        top: 0,
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    },
    topSpace: {
        marginTop: 0,
        marginLeft: 0,
        marginRight: 0,
        height: Dimensions.get('window').height * 0.58,
        width: Dimensions.get('window').width
    },

});
