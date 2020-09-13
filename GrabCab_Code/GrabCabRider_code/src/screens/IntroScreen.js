import React, { Component } from "react";
import {
    StyleSheet,
    View,
    Image,
    ImageBackground,
    Text,
    Dimensions,
    Linking,
    Platform
} from "react-native";
import MaterialButtonDark from "../components/MaterialButtonDark";
import * as firebase from 'firebase'
import * as Facebook from 'expo-facebook';
import languageJSON from '../common/language';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from "expo-crypto";
import { TouchableOpacity } from "react-native-gesture-handler";
import { 
    facebook_id,
    iosStandaloneAppClientId,
    androidStandaloneAppClientId 
} from '../common/key';
import * as Google from 'expo-google-app-auth';

export default class IntroScreen extends Component {

    constructor(props) {
        super(props);
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

    async FbLogin() {

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
    }

    appleSigin = async () => {

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
    }

    onPressLoginEmail = async () => {
        this.props.navigation.navigate("EmailLogin");
    }

    onPressLoginMobile = async () => {
        this.props.navigation.navigate("MobileLogin");
    }


    async openTerms() {
        Linking.openURL("https://exicube.com/privacy-policy.html").catch(err => console.error("Couldn't load page", err));
    }


    render() {

        return (
            <ImageBackground
                source={require("../../assets/images/intro.jpg")}
                resizeMode="stretch"
                style={styles.imagebg}
            >
                <View style={styles.topSpace}></View>
                <MaterialButtonDark
                    onPress={() => this.onPressLoginEmail()}
                    style={styles.materialButtonDark}
                >{languageJSON.email_login}</MaterialButtonDark>
                <MaterialButtonDark
                    onPress={this.onPressLoginMobile}
                    style={styles.materialButtonDark2}
                >{languageJSON.login_title}</MaterialButtonDark>
                <View style={styles.seperator}>
                    <View style={styles.lineLeft}></View>
                    <View style={styles.lineLeftFiller}>
                        <Text style={styles.sepText}>{languageJSON.spacer_message}</Text>
                    </View>
                    <View style={styles.lineRight}></View>
                </View>

                <View style={styles.socialBar}>
                    <TouchableOpacity style={styles.socialIcon} onPress={() => { this.FbLogin() }}>
                        <Image
                            source={require("../../assets/images/image_fb.png")}
                            resizeMode="contain"
                            style={styles.socialIconImage}
                        ></Image>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.socialIcon} onPress={() => { this.googleLogin() }}>
                        <Image
                            source={require("../../assets/images/image_google.png")}
                            resizeMode="contain"
                            style={styles.socialIconImage}
                        ></Image>
                    </TouchableOpacity>
                    {Platform.OS == 'ios' ?
                        <TouchableOpacity style={styles.socialIcon} onPress={() => { this.appleSigin() }}>
                            <Image
                                source={require("../../assets/images/image_apple.png")}
                                resizeMode="contain"
                                style={styles.socialIconImage}
                            ></Image>
                        </TouchableOpacity>
                        : null}
                </View>
                <View>
                    <TouchableOpacity style={styles.terms} onPress={() => this.openTerms()}>
                        <Text style={styles.actionText}>{languageJSON.terms}</Text>
                    </TouchableOpacity>
                </View>
            </ImageBackground>
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
    topSpace: {
        marginTop: 0,
        marginLeft: 0,
        marginRight: 0,
        height: Dimensions.get('window').height * 0.58,
        width: Dimensions.get('window').width
    },
    materialButtonDark: {
        height: 40,
        marginTop: 20,
        marginLeft: 35,
        marginRight: 35,
        backgroundColor: "#3b3b3b",
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
    },
    seperator: {
        width: 250,
        height: 20,
        flexDirection: "row",
        marginTop: 20,
        alignSelf: 'center'
    },
    lineLeft: {
        width: 40,
        height: 1,
        backgroundColor: "rgba(113,113,113,1)",
        marginTop: 9
    },
    sepText: {
        color: "#000",
        fontSize: 16,
        fontFamily: "Roboto-Regular"
    },
    lineLeftFiller: {
        flex: 1,
        flexDirection: "row",
        justifyContent: "center"
    },
    lineRight: {
        width: 40,
        height: 1,
        backgroundColor: "rgba(113,113,113,1)",
        marginTop: 9
    },
    socialBar: {
        height: 40,
        flexDirection: "row",
        marginTop: 15,
        alignSelf: 'center'
    },
    socialIcon: {
        width: 40,
        height: 40,
        marginLeft: 15,
        marginRight: 15,
        alignSelf: "center"
    },
    socialIconImage: {
        width: 40,
        height: 40
    },
    terms: {
        marginTop: 18,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: "center",
        opacity: .54
    }
});
