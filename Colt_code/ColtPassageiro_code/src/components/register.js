import React from 'react';
import { View, Text, Dimensions, Modal, ScrollView, KeyboardAvoidingView, Image, TouchableOpacity, LayoutAnimation, Platform } from 'react-native';
import Background from './Background';
import { Icon, Avatar, Button, Header, Input } from 'react-native-elements'
import { colors } from '../common/theme';
import * as firebase from 'firebase'; //Database
var { width, height } = Dimensions.get('window');
import languageJSON from '../common/language';

import { google_map_key } from '../common/key';
import * as Location from 'expo-location';
import * as Permissions from 'expo-permissions';
import Geocoder from 'react-native-geocoding';

export default class Registration extends React.Component {

    constructor(props) {
        super(props);
        Geocoder.init(google_map_key);
        this.state = {
            fname: this.props.reqData ? this.props.reqData.profile.first_name : '',
            lname: this.props.reqData ? this.props.reqData.profile.last_name : '',
            email: this.props.reqData ? this.props.reqData.profile.email : '',
            mobile: this.props.reqData ? this.props.reqData.profile.mobile : '',
            refferalId: '',

            fnameValid: true,
            lnameValid: true,
            mobileValid: true,
            emailValid: true,
            reffralIdValid: true,
            loadingModal: false
        }
    }

    // first name validation
    validateFirstName() {
        const { fname } = this.state
        const fnameValid = fname.length > 0
        LayoutAnimation.easeInEaseOut()
        this.setState({ fnameValid })
        fnameValid || this.fnameInput.shake();
        return fnameValid
    }

    validateLastname() {
        const { lname } = this.state
        const lnameValid = lname.length > 0
        LayoutAnimation.easeInEaseOut()
        this.setState({ lnameValid })
        lnameValid || this.lnameInput.shake();
        return lnameValid
    }

    // mobile number validation
    validateMobile() {
        const { mobile } = this.state
        const mobileValid = (mobile.length > 0)
        LayoutAnimation.easeInEaseOut()
        this.setState({ mobileValid })
        mobileValid || this.mobileInput.shake();
        return mobileValid
    }

    // email validation
    validateEmail() {
        const { email } = this.state
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        const emailValid = re.test(email)
        LayoutAnimation.easeInEaseOut()
        this.setState({ emailValid })
        emailValid || this.emailInput.shake()
        return emailValid
    }

    _getLocationAsync = async () => {
        let { status } = await Permissions.askAsync(Permissions.LOCATION);
        if (status !== 'granted') {
            alert("Para acessar sua localização, é necessária permissão!");
        } else {

            let location = Platform.OS === 'android' ? await Location.getCurrentPositionAsync({ enableHighAccuracy: true, maximumAge: 1000, timeout: 20000, }) :
                await Location.getCurrentPositionAsync({ enableHighAccuracy: true, maximumAge: 1000, timeout: 2000, })
            if (location) {
                var pos = {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                };
                var curuser = firebase.auth().currentUser.uid;
                if (pos) {
                    let latlng = pos.latitude + ',' + pos.longitude;
                    fetch('https://maps.googleapis.com/maps/api/geocode/json?latlng=' + latlng + '&key=' + google_map_key)
                        .then((response) => response.json())
                        .then((responseJson) => {
                            //Setando a localização do usuario no firebase
                            firebase.database().ref('users/' + curuser + '/location').update({
                                add: responseJson.results[0].formatted_address,
                                lat: pos.latitude,
                                lng: pos.longitude
                            })
                        })
                        .catch((error) => {
                            console.error(error);
                        });
                }
            }
        }
    }


    //register button press for validation
    onPressRegister() {
        const { onPressRegister } = this.props;
        LayoutAnimation.easeInEaseOut();
        const fnameValid = this.validateFirstName();
        const lnameValid = this.validateLastname();
        const emailValid = this.validateEmail();
        const mobileValid = this.validateMobile();

        if (fnameValid && lnameValid && emailValid && mobileValid) {
            this._getLocationAsync()

            if (this.state.refferalId != '') {
                this.setState({ loadingModal: true })
                const userRoot = firebase.database().ref('users/');
                userRoot.once('value', userData => {
                    if (userData.val()) {
                        let allUsers = userData.val();
                        var flag = false;
                        for (key in allUsers) {
                            if (allUsers[key].refferalId) {
                                if (this.state.refferalId.toLowerCase() == allUsers[key].refferalId) {
                                    flag = true;
                                    var referralVia = {
                                        userId: key,
                                        refferalId: allUsers[key].refferalId
                                    }
                                    break;
                                } else {
                                    flag = false;
                                }
                            }
                        }
                        if (flag == true) {
                            this.setState({ reffralIdValid: true, loadingModal: false });
                            onPressRegister(this.state.fname, this.state.lname, this.state.email, this.state.mobile, true, referralVia);
                            this.setState({ fname: '', lname: '', email: '', mobile: '', password: '', confPassword: '', refferalId: '' })
                        } else {
                            this.refferalInput.shake();
                            this.setState({ reffralIdValid: false, loadingModal: false });
                        }
                    }
                })

            } else {
                //refferal id is blank
                onPressRegister(this.state.fname, this.state.lname, this.state.email, this.state.mobile, false, null);
                this.setState({ fname: '', lname: '', email: '', mobile: '', refferalId: '' })
            }

        }
    }

    loading() {
        return (
            <Modal
                animationType="fade"
                transparent={true}
                visible={this.state.loadingModal}
                onRequestClose={() => {
                    this.setState({ loadingModal: false })
                }}
            >
                <View style={{ flex: 1, backgroundColor: "rgba(22,22,22,0.8)", justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{ width: '85%', backgroundColor: "#DBD7D9", borderRadius: 10, flex: 1, maxHeight: 70 }}>
                        <View style={{ alignItems: 'center', flexDirection: 'row', flex: 1, justifyContent: "center" }}>
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: "#000", fontSize: 16, }}>{languageJSON.refferal_code_validation_modal}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        )
    }

    render() {
        const { onPressBack, loading } = this.props

        return (
            <View style={styles.mainView}>
                <View style={styles.topBar}>
                    <View style={{ position: 'absolute', left: 15 }}>
                        <TouchableOpacity onPress={onPressBack}>
                            <View style={styles.btnVoltar}>
                                <Icon
                                    name='chevron-left'
                                    type='MaterialIcons'
                                    color={colors.BLACK}
                                    size={40}
                                />
                            </View>
                        </TouchableOpacity>
                    </View>
                    <Text style={{ alignSelf: 'center', marginBottom: 5, marginTop: 15, fontFamily: 'Inter-Bold', fontSize: 20 }}> Confirme seu cadastro </Text>
                </View>

                <ScrollView style={styles.scrollViewStyle}>
                    <KeyboardAvoidingView behavior={Platform.OS == 'ios' ? 'height' : 'height'} style={styles.form}>
                        <View style={styles.containerStyle}>

                            <View style={styles.textInputContainerStyle}>
                                <Input
                                    ref={input => (this.fnameInput = input)}
                                    editable={this.props.reqData.profile.first_name ? false : true}
                                    underlineColorAndroid={colors.TRANSPARENT}
                                    placeholder={languageJSON.first_name_placeholder}
                                    placeholderTextColor={colors.GREY2}
                                    value={this.state.fname}
                                    keyboardType={'email-address'}
                                    inputStyle={styles.inputTextStyle}
                                    onChangeText={(text) => { this.setState({ fname: text }) }}
                                    errorMessage={this.state.fnameValid ? null : languageJSON.first_name_blank_error}
                                    secureTextEntry={false}
                                    blurOnSubmit={true}
                                    onSubmitEditing={() => { this.validateFirstName(); this.lnameInput.focus() }}
                                    errorStyle={styles.errorMessageStyle}
                                    inputContainerStyle={styles.inputContainerStyle}
                                    containerStyle={styles.textInputStyle}
                                />
                            </View>

                            <View style={styles.textInputContainerStyle}>

                                <Input
                                    ref={input => (this.lnameInput = input)}
                                    editable={this.props.reqData.profile.last_name ? false : true}
                                    underlineColorAndroid={colors.TRANSPARENT}
                                    placeholder={languageJSON.last_name_placeholder}
                                    placeholderTextColor={colors.GREY2}
                                    value={this.state.lname}
                                    keyboardType={'email-address'}
                                    inputStyle={styles.inputTextStyle}
                                    onChangeText={(text) => { this.setState({ lname: text }) }}
                                    errorMessage={this.state.lnameValid ? null : languageJSON.last_name_blank_error}
                                    secureTextEntry={false}
                                    blurOnSubmit={true}
                                    onSubmitEditing={() => { this.validateLastname(); this.emailInput.focus() }}
                                    errorStyle={styles.errorMessageStyle}
                                    inputContainerStyle={styles.inputContainerStyle}
                                    containerStyle={styles.textInputStyle}
                                />
                            </View>


                            <View style={styles.textInputContainerStyle}>

                                <Input
                                    ref={input => (this.mobileInput = input)}
                                    editable={this.props.reqData.profile.mobile ? false : true}
                                    underlineColorAndroid={colors.TRANSPARENT}
                                    placeholder={languageJSON.mobile_no_placeholder}
                                    placeholderTextColor={colors.GREY2}
                                    value={this.state.mobile}
                                    keyboardType={'number-pad'}
                                    maxLength={15}
                                    inputStyle={styles.inputTextStyle}
                                    onChangeText={(text) => { this.setState({ mobile: text }) }}
                                    errorMessage={this.state.mobileValid ? null : languageJSON.mobile_no_blank_error}
                                    secureTextEntry={false}
                                    blurOnSubmit={true}
                                    onSubmitEditing={() => { this.validateMobile(); this.passwordInput.focus() }}
                                    errorStyle={styles.errorMessageStyle}
                                    inputContainerStyle={styles.inputContainerStyle}
                                    containerStyle={styles.textInputStyle}
                                />
                            </View>
                            <View style={styles.textInputContainerStyle}>

                                <Input
                                    ref={input => (this.emailInput = input)}
                                    editable={this.props.reqData.profile.email ? false : true}
                                    underlineColorAndroid={colors.TRANSPARENT}
                                    placeholder={languageJSON.email_placeholder}
                                    placeholderTextColor={colors.GREY2}
                                    value={this.state.email}
                                    keyboardType={'email-address'}
                                    inputStyle={styles.inputTextStyle}
                                    onChangeText={(text) => { this.setState({ email: text }) }}
                                    errorMessage={this.state.emailValid ? null : languageJSON.valid_email_check}
                                    secureTextEntry={false}
                                    blurOnSubmit={true}
                                    onSubmitEditing={() => { this.validateEmail(); this.mobileInput.focus() }}
                                    errorStyle={styles.errorMessageStyle}
                                    inputContainerStyle={styles.inputContainerStyle}
                                    containerStyle={styles.textInputStyle}
                                />
                            </View>
                            <View style={styles.textInputContainerStyle}>

                                <Input
                                    ref={input => (this.refferalInput = input)}
                                    editable={true}
                                    underlineColorAndroid={colors.TRANSPARENT}
                                    placeholder={languageJSON.referral_id_placeholder}
                                    placeholderTextColor={colors.GREY2}
                                    value={this.state.refferalId}
                                    inputStyle={styles.inputTextStyle}
                                    onChangeText={(text) => { this.setState({ refferalId: text }) }}
                                    errorMessage={this.state.reffralIdValid == true ? null : languageJSON.refferal_id_not_match_error}
                                    secureTextEntry={false}
                                    blurOnSubmit={true}
                                    inputContainerStyle={styles.inputContainerStyle}
                                    containerStyle={styles.textInputStyle}
                                />
                            </View>
                            <TouchableOpacity onPress={() => { this.onPressRegister() }}>
                                <View style={styles.buttonContainer}>
                                    <Text style={{ fontFamily: 'Inter-Bold', fontSize: 16, color: colors.WHITE }}>{languageJSON.register_button}</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </ScrollView>
                {
                    this.loading()
                }
            </View >
        );
    }
};

const styles = {
    mainView: {
        flex: 1,
        backgroundColor: colors.WHITE
    },
    topBar: {
        justifyContent: 'flex-end',
        marginTop: Platform.OS == 'ios' ? 0 : 10,
        flex: Platform.OS == 'ios' ? .13 : .15,
    },
    btnVoltar: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 35,
        height: 35,
        borderRadius: 50
    },
    inputContainerStyle: {
        borderWidth: 1,
        borderRadius: 6,
        height: 50,
        borderColor: colors.GREY1
    },
    textInputStyle: {
        marginLeft: 10,
    },
    iconContainer: {
        paddingTop: 8,
        backgroundColor: colors.BLACK,
    },
    buttonContainer: {
        marginTop: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        borderRadius: 10,
        backgroundColor: colors.DEEPBLUE,
        height: 45,
        marginHorizontal: 55,
        justifyContent: 'center',
        alignItems: 'center'
    },
    buttonTitle: {
        fontSize: 16,
        fontFamily: 'Inter-Bold',
    },
    inputTextStyle: {
        color: colors.BLACK,
        fontFamily: 'Inter-Medium',
        fontSize: 16,
        marginLeft: 10,
        padding: 10,
        height: 32,
    },
    errorMessageStyle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 0
    },
    containerStyle: {
        flexDirection: 'column',
        marginTop: 20
    },
    form: {
        flex: 1,
    },
    scrollViewStyle: {
        flex: 1
    },
    textInputContainerStyle: {
        flexDirection: 'row',
        alignItems: "center",
        marginRight: 20,
        padding: 15,
        backgroundColor: colors.TRANSPARENT
    },
}