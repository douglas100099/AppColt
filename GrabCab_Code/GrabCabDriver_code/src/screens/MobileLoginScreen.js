import React, { Component } from "react";
import {
    StyleSheet,
    View,
    Image,
    ImageBackground,
    Text,
    Dimensions,
    KeyboardAvoidingView,
    TextInput
} from "react-native";
import MaterialButtonDark from "../components/MaterialButtonDark";
import * as firebase from 'firebase'
import languageJSON from '../common/language';
import { TouchableOpacity } from "react-native-gesture-handler";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import RNPickerSelect from 'react-native-picker-select';
import countries from '../common/countries';

export default class MobileLoginScreen extends Component {

    recaptchaVerifier = null;
    firebaseConfig = firebase.apps.length ? firebase.app().options : undefined;

    constructor(props) {
        super(props);
        let arr = [];
        for(let i=0;i< countries.length; i++){
            arr.push({label:countries[i].label + " (+" + countries[i].phone + ")",value: "+" + countries[i].phone,key:countries.code});
        }

        this.state = {
            phoneNumber: null,
            verificationId: null,
            verificationCode: null,
            countryCodeList:arr,
            countryCode:null
        }
    }

    onPressLogin = async () => {
        if(this.state.countryCode && this.state.countryCode!==languageJSON.select_country){
            if(this.state.phoneNumber){
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
            }else{
                alert(languageJSON.mobile_no_blank_error);
            }
        }else{
            alert(languageJSON.country_blank_error);
        }
    }


    onSignIn = async () => {
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
            alert(languageJSON.otp_error);
        }
    }

    async CancelLogin() {
        this.setState({
            phoneNumber: null,
            verificationId: null,
            verificationCode: null
        });
    }

    render() {

        return (
            <KeyboardAvoidingView behavior={"position"} style={styles.container}>
                <ImageBackground
                    source={require("../../assets/images/bg.png")}
                    resizeMode="stretch"
                    style={styles.imagebg}
                >
                    <FirebaseRecaptchaVerifierModal
                        ref={ref => (this.recaptchaVerifier = ref)}
                        firebaseConfig={this.firebaseConfig}
                    />
                    <TouchableOpacity style={styles.backButton} onPress={() => { this.props.navigation.navigate('Intro') }}>
                        <Image
                            source={require("../../assets/images/ios-back.png")}
                            resizeMode="contain"
                            style={styles.backButtonImage}
                        ></Image>
                    </TouchableOpacity>
                    <Text style={styles.logintext}>{languageJSON.login_title}</Text>
                    <View style={styles.blackline}></View>
                    <View style={styles.box1}>
                        <RNPickerSelect
                            placeholder={{label:languageJSON.select_country,value:languageJSON.select_country}}
                            value={this.state.countryCode}
                            useNativeAndroidPickerStyle={true} 
                            style={{
                                inputIOS: styles.pickerStyle,
                                inputAndroid: styles.pickerStyle,
                            }}
                            onValueChange={(value) => this.setState({countryCode: value})}
                            items={this.state.countryCodeList}
                            disabled={!!this.state.verificationId ? true : false}
                        />
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
                    {this.state.verificationId ? null :
                        <MaterialButtonDark
                            onPress={() => this.onPressLogin()}
                            style={styles.materialButtonDark}
                        >{languageJSON.request_otp}</MaterialButtonDark>
                    }
                    {!!this.state.verificationId ?
                        <View style={styles.box2}>
                            <TextInput
                                ref={(ref) => { this.otpInput = ref }}
                                style={styles.textInput}
                                placeholder={languageJSON.otp_here}
                                onChangeText={(value) => this.setState({ verificationCode: value })}
                                value={this.state.verificationCode}
                                ditable={!!this.state.verificationId}
                                keyboardType="phone-pad"
                            />
                        </View>
                        : null}
                    {!!this.state.verificationId ?
                        <MaterialButtonDark
                            onPress={this.onSignIn}
                            style={styles.materialButtonDark}
                        >{languageJSON.authorize}</MaterialButtonDark>
                        : null}
                    {this.state.verificationId ?
                        <View style={styles.actionLine}>
                            <TouchableOpacity style={styles.actionItem} onPress={() => this.CancelLogin()}>
                                <Text style={styles.actionText}>{languageJSON.cancel}</Text>
                            </TouchableOpacity>
                        </View>
                        : null}
                </ImageBackground>
            </KeyboardAvoidingView>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1
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
        color: "rgba(255,255,255,1)",
        fontSize: 18,
        fontFamily: "Roboto-Regular",
        marginTop: 0,
        alignSelf: "center"
    },
    blackline: {
        width: 140,
        height: 1,
        backgroundColor: "rgba(0,0,0,1)",
        marginTop: 12,
        alignSelf: "center"
    },
    box1: {
        height: 35,
        backgroundColor: "rgba(255,255,255,1)",
        marginTop: 26,
        marginLeft: 35,
        marginRight: 35,
        borderWidth: 1,
        borderColor: "#c2bbba",
        justifyContent:'center'
    },
    box2: {
        height: 35,
        backgroundColor: "rgba(255,255,255,1)",
        marginTop: 12,
        marginLeft: 35,
        marginRight: 35,
        borderWidth: 1,
        borderColor: "#c2bbba",
        justifyContent:'center'
    },
    pickerStyle:{
        color: "#121212",
        fontFamily: "Roboto-Regular",
        fontSize: 18,
        marginLeft:5
    },

    textInput: {
        color: "#121212",
        fontSize: 18,
        fontFamily: "Roboto-Regular",
        textAlign: "left",
        marginLeft: 5
    },
    materialButtonDark: {
        height: 35,
        marginTop: 22,
        marginLeft: 35,
        marginRight: 35
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
    },

});
