import React, { Component } from "react";
import {
    StyleSheet,
    View,
    Text,
    Dimensions,
    Alert,
    TextInput,
    ActivityIndicator,
    Image
} from "react-native";
import * as firebase from 'firebase'
var { height, width } = Dimensions.get('window');
import languageJSON from '../common/language';
import { TouchableOpacity } from "react-native-gesture-handler";
import { Icon } from 'react-native-elements';
import { colors } from '../common/theme';
import SegmentedControlTab from 'react-native-segmented-control-tab';
import ActionSheet from "react-native-actionsheet";

export default class EmailLoginScreen extends Component {

    constructor(props) {
        super(props);
        this.state = {
            email: '',
            password: '',
            confirmpassword: '',
            customStyleIndex: 0,
            btnDisabled: false
        }
    }

    onAction = async () => {
        this.setState({ btnDisabled: true })
        const { email, password, confirmpassword, customStyleIndex } = this.state;
        if (customStyleIndex == 0) {
            console.log(email)
            if (this.validateEmailOnLogin(email)) {
                if (password != '') {
                    try {
                        await firebase.auth().signInWithEmailAndPassword(email, password)
                    } catch (error) {
                        alert("Ops, tivemos um erro.");
                        this.setState({
                            email: '',
                            password: '',
                            confirmpassword: '',
                            btnDisabled: false
                        });
                        this.emailInput.focus();
                        alert(error.code + " - " + error.message);
                    }
                } else {
                    this.setState({ btnDisabled: false })
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
                        alert("Ops, tivemos um erro ao tentar criar o usuário.");
                        this.setState({
                            email: '',
                            password: '',
                            confirmpassword: '',
                            btnDisabled: false
                        });
                        this.emailInput.focus();
                    }
                } else {
                    this.setState({ btnDisabled: false })
                    this.confirmPassInput.focus();
                    alert(languageJSON.confrim_password_not_match_err);
                }
            }
        }
    }

    validateEmailOnLogin(email) {
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        const emailValid = re.test(email);
        console.log(emailValid + "VALID")
        if (!emailValid) {
            this.emailInput.focus();
            this.setState({ btnDisabled: false })
            alert("Email inválido! Por favor, veirifique se há algum caractere especial ou espaço em branco.");
        }
        return emailValid;
    }

    validateEmail(email) {
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        const emailValid = re.test(email);
        console.log(emailValid + "VALID")
        if (!emailValid) {
            this.emailInput.focus();
            this.setState({ btnDisabled: false })
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
                this.setState({ btnDisabled: false })
            }
        }
        else if (complexity == 'alphanumeric') {
            var passwordValid = regx1.test(password);
            if (!passwordValid) {
                this.passInput.focus();
                alert(languageJSON.password_alphaNumeric_check);
                this.setState({ btnDisabled: false })
            }
        }
        else if (complexity == 'complex') {
            var passwordValid = regx2.test(password);
            if (!passwordValid) {
                this.passInput.focus();
                alert(languageJSON.password_complexity_check);
                this.setState({ btnDisabled: false })
            }
        }
        return passwordValid
    }

    handleCustomIndexSelect = (index) => {
        this.setState(prevState => ({ ...prevState, customStyleIndex: index }));
    }


    render() {

        return (
            <View style={styles.container}>
                <View style={styles.topBar}>
                    <View style={{ position: 'absolute', left: 15 }}>
                        <TouchableOpacity onPress={() => { this.props.navigation.goBack(); }}>
                            <View style={{ backgroundColor: colors.WHITE, width: 35, height: 35, borderRadius: 50 }} >
                                <Icon
                                    name='chevron-left'
                                    type='MaterialIcons'
                                    color={colors.BLACK}
                                    size={40}
                                />
                            </View>
                        </TouchableOpacity>
                    </View>
                    <Text style={{ fontFamily: 'Inter-Bold', fontSize: 17 }}> Cadastre-se ou faça login </Text>
                </View>

                <View style={{ flex: 5 }}>
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
                        tabTextStyle={{ color: colors.GREY2, fontSize: width < 375 ? 17 : 19, fontFamily: 'Inter-Bold' }}
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

                    <TouchableOpacity disabled={this.state.btnDisabled} onPress={this.onAction} style={styles.btnLogin}>
                        {this.state.btnDisabled == false ?
                            <Text style={{ fontFamily: 'Inter-Bold', fontSize: 18, color: colors.WHITE }}>{this.state.customStyleIndex == 0 ? languageJSON.login_button : languageJSON.register_link}</Text>
                            :
                            <ActivityIndicator
                                size="small"
                                color={colors.WHITE}
                                style={{ alignSelf: 'center' }}
                            />
                        }
                    </TouchableOpacity>

                    {this.state.customStyleIndex == 0 ?
                        <View style={styles.linkBar}>
                            <TouchableOpacity style={styles.barLinks} onPress={() => this.Forgot_Password(this.state.email)}>
                                <Text style={styles.linkText}>{languageJSON.forgot_password_link}</Text>
                            </TouchableOpacity>
                        </View>
                        : null}
                </View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.WHITE
    },
    imagebg: {
        position: 'absolute',
        left: 0,
        top: 0,
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        flex: 1,
    },
    backButton: {
        height: 40,
        width: 40,
        marginTop: 50,
        marginLeft: 35,
        marginTop: 45,
    },
    backButtonImage: {
        height: 40,
        width: 40,
    },
    segmentcontrol: {
        color: "rgba(255,255,255,1)",
        fontSize: 18,
        fontFamily: "Inter-Regular",
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
        height: 45,
        backgroundColor: "rgba(255,255,255,1)",
        marginTop: 26,
        marginLeft: 35,
        marginRight: 35,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.1)",
        borderRadius: 5,
        justifyContent: 'center'
    },
    box2: {
        height: 45,
        backgroundColor: "rgba(255,255,255,1)",
        marginTop: 15,
        marginLeft: 35,
        marginRight: 35,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.1)",
        borderRadius: 5,
        justifyContent: 'center'
    },

    textInput: {
        color: "#121212",
        fontSize: width < 375 ? 16 : 18,
        fontFamily: "Inter-Regular",
        textAlign: "left",
        alignItems: 'center',
        marginLeft: 8
    },
    btnLogin: {
        backgroundColor: colors.DEEPBLUE,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 5,
        height: 45,
        marginTop: 22,
        marginHorizontal: 85
    },
    linkBar: {
        flexDirection: "row",
        marginTop: 20,
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
        fontSize: width < 375 ? 14 : 16,
        color: colors.RED,
        fontFamily: "Inter-Regular",
    }
});