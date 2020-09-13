import React, { Component } from "react";
import {
    StyleSheet,
    View,
    ImageBackground,
    Text,
    Dimensions,
    KeyboardAvoidingView,
    Alert,
    TextInput,
    Image,
    Linking
} from "react-native";
import MaterialButtonDark from "../components/MaterialButtonDark";
import * as firebase from 'firebase'
import languageJSON from '../common/language';
import { TouchableOpacity } from "react-native-gesture-handler";
import SegmentedControlTab from 'react-native-segmented-control-tab';

export default class EmailLoginScreen extends Component {


    constructor(props) {
        super(props);
        this.state = {
            email: '',
            password: '',
            confirmpassword: '',
            customStyleIndex: 0
        }
    }

    onAction = async () => {

        const { email, password, confirmpassword, customStyleIndex } = this.state;
        if (customStyleIndex == 0) {
            if (this.validateEmail(email)) {
                if (password != '') {
                    try {
                        await firebase.auth().signInWithEmailAndPassword(email, password)
                    } catch (error) {
                        this.setState({
                            email: '',
                            password: '',
                            confirmpassword: ''
                        });
                        this.emailInput.focus();
                        alert(error.code + " - " + error.message);
                    }
                } else {
                    this.passInput.focus();
                    alert(languageJSON.password_blank_messege);
                }
            }
        } else {
            if (this.validateEmail(email) && this.validatePassword(password, 'alphanumeric')) {
                if (password == confirmpassword) {
                    try {
                        await firebase.auth().createUserWithEmailAndPassword(email, password)
                    } catch (error) {
                        alert(error.code + " - " + error.message);
                        this.setState({
                            email: '',
                            password: '',
                            confirmpassword: ''
                        });
                        this.emailInput.focus();
                    }
                } else {
                    this.confirmPassInput.focus();
                    alert(languageJSON.confrim_password_not_match_err);
                }
            }
        }
    }

    validateEmail(email) {
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        const emailValid = re.test(email);
        if (!emailValid) {
            this.emailInput.focus();
            alert(languageJSON.valid_email_check);
        }
        return emailValid;
    }

    async Forgot_Password(email) {
        if (this.validateEmail(email)) {

            Alert.alert(
                languageJSON.forgot_password_link,
                languageJSON.forgot_password_confirm,
                [
                    { text: languageJSON.cancel, onPress: () => { }, style: 'cancel', },
                    {
                        text: languageJSON.ok,
                        onPress: () => {
                            firebase.auth().sendPasswordResetEmail(email).then(function () {
                                alert(languageJSON.forgot_password_success_messege);
                            }).catch(function (error) {
                                console.log(error);
                                alert(languageJSON.email_not_found);
                            });
                        },
                    }
                ],
                { cancelable: true },
            )
        }
    }

    validatePassword(password, complexity) {
        const regx1 = /^([a-zA-Z0-9@*#]{8,15})$/
        const regx2 = /(?=^.{6,10}$)(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&amp;*()_+}{&quot;:;'?/&gt;.&lt;,])(?!.*\s).*$/
        if (complexity == 'any') {
            var passwordValid = password.length >= 1;
            if (!passwordValid) {
                this.passInput.focus();
                alert(languageJSON.password_blank_messege);
            }
        }
        else if (complexity == 'alphanumeric') {
            var passwordValid = regx1.test(password);
            if (!passwordValid) {
                this.passInput.focus();
                alert(languageJSON.password_alphaNumeric_check);

            }
        }
        else if (complexity == 'complex') {
            var passwordValid = regx2.test(password);
            if (!passwordValid) {
                this.passInput.focus();
                alert(languageJSON.password_complexity_check);
            }
        }
        return passwordValid
    }

    handleCustomIndexSelect = (index) => {
        this.setState(prevState => ({ ...prevState, customStyleIndex: index }));
    };

    render() {

        return (
            <KeyboardAvoidingView behavior={"position"} style={styles.container}>

                <ImageBackground
                    source={require("../../assets/images/bg.png")}
                    resizeMode="stretch"
                    style={styles.imagebg}
                >
                    <TouchableOpacity style={styles.backButton} onPress={() => { this.props.navigation.navigate('Intro') }}>
                        <Image
                            source={require("../../assets/images/ios-back.png")}
                            resizeMode="contain"
                            style={styles.backButtonImage}
                        ></Image>
                    </TouchableOpacity>
                    <SegmentedControlTab
                        values={[languageJSON.email_login, languageJSON.register_email]}
                        selectedIndex={this.state.customStyleIndex}
                        onTabPress={this.handleCustomIndexSelect}
                        borderRadius={0}
                        tabsContainerStyle={styles.segmentcontrol}
                        tabStyle={{
                            backgroundColor: 'transparent',
                            borderWidth: 0,
                            borderColor: 'transparent',
                        }}
                        activeTabStyle={{ borderBottomColor: '#212121', backgroundColor: 'transparent', borderBottomWidth: 2, marginTop: 2 }}
                        tabTextStyle={{ color: '#fff', fontWeight: 'bold' }}
                        activeTabTextStyle={{ color: '#212121' }}
                    />

                    <View style={styles.box1}>
                        <TextInput
                            ref={(ref) => { this.emailInput = ref }}
                            style={styles.textInput}
                            placeholder={languageJSON.email_placeholder}
                            onChangeText={(value) => this.setState({ email: value })}
                            value={this.state.email}
                        />
                    </View>
                    <View style={styles.box2}>
                        <TextInput
                            ref={(ref) => { this.passInput = ref }}
                            style={styles.textInput}
                            placeholder={languageJSON.password_placeholder}
                            onChangeText={(value) => this.setState({ password: value })}
                            value={this.state.password}
                            secureTextEntry={true}
                        />
                    </View>
                    {this.state.customStyleIndex != 0 ?
                        <View style={styles.box2}>
                            <TextInput
                                ref={(ref) => { this.confirmPassInput = ref }}
                                style={styles.textInput}
                                placeholder={languageJSON.confrim_password_placeholder}
                                onChangeText={(value) => this.setState({ confirmpassword: value })}
                                value={this.state.confirmpassword}
                                secureTextEntry={true}
                            />
                        </View>
                        : null}
                    <MaterialButtonDark
                        onPress={this.onAction}
                        style={styles.materialButtonDark}
                    >{this.state.customStyleIndex == 0 ? languageJSON.login_button : languageJSON.register_link}</MaterialButtonDark>
                    {this.state.customStyleIndex == 0 ?
                        <View style={styles.linkBar}>
                            <TouchableOpacity style={styles.barLinks} onPress={() => this.Forgot_Password(this.state.email)}>
                                <Text style={styles.linkText}>{languageJSON.forgot_password_link}</Text>
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
    segmentcontrol: {
        color: "rgba(255,255,255,1)",
        fontSize: 18,
        fontFamily: "Roboto-Regular",
        marginTop: 0,
        alignSelf: "center",
        height: 50,
        marginLeft: 35,
        marginRight: 35
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
        marginTop: 20,
        marginLeft: 35,
        marginRight: 35,
        borderWidth: 1,
        borderColor: "#c2bbba",
    },
    box2: {
        height: 35,
        backgroundColor: "rgba(255,255,255,1)",
        marginTop: 10,
        marginLeft: 35,
        marginRight: 35,
        borderWidth: 1,
        borderColor: "#c2bbba",
    },

    textInput: {
        color: "#121212",
        fontSize: 18,
        fontFamily: "Roboto-Regular",
        textAlign: "left",
        marginTop: 8,
        marginLeft: 5
    },
    materialButtonDark: {
        height: 35,
        marginTop: 18,
        marginLeft: 35,
        marginRight: 35
    },
    linkBar: {
        flexDirection: "row",
        marginTop: 24,
        alignSelf: 'center'
    },
    barLinks: {
        marginLeft: 15,
        marginRight: 15,
        alignSelf: "center",
        fontSize: 18,
        fontWeight: 'bold'
    },
    linkText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        fontFamily: "Roboto-Bold",
    }
});