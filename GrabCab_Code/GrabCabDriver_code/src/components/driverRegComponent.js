import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Dimensions,
    ScrollView,
    KeyboardAvoidingView,
    Image,
    TouchableWithoutFeedback,
    LayoutAnimation,
    Platform,
    TouchableOpacity,
} from 'react-native';
import Background from './Background';
import { Icon, Button, Header, Input } from 'react-native-elements';
import * as Permissions from 'expo-permissions';
import { Camera } from 'expo-camera';
import { colors } from '../common/theme';
import languageJSON from '../common/language';
import * as ImagePicker from 'expo-image-picker';
import * as firebase from 'firebase';
var { height } = Dimensions.get('window');
import RNPickerSelect from 'react-native-picker-select';
import { SafeAreaView } from 'react-navigation';


export default class DiverReg extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            fname: this.props.reqData ? this.props.reqData.profile.first_name : '',
            lname: this.props.reqData ? this.props.reqData.profile.last_name : '',
            email: this.props.reqData ? this.props.reqData.profile.email : '',
            mobile: this.props.reqData ? this.props.reqData.profile.mobile : '',
            cpfNum: '',
            cnh: '',
            dataValidade: '',
            orgaoEmissor: '',
            renavam: '',
            imageCnh: null,
            imageCrlv: null,
            imagePerfil: null,
            carType: '',
            cpfNumValid: true,
            renavamValid: true,
            cnhValid: true,
            OrgaoEmissorValid: true,
            dataValidadeValid: true,
            fnameValid: true,
            lnameValid: true,
            mobileValid: true,
            emailValid: true,
            imageCnhValid: true,
            imageCrlvValid: true,
            imagePerfilValid: true,
            loaderBtn: false,
            isCamera: false,
            isProgress: false,
        }
    }

    async componentDidMount() {
        firebase.database().ref('rates/car_type').once('value', snapshot => {
            let cars = snapshot.val();
            if (cars) {
                let arr = [];
                for (let i = 0; i < cars.length; i++) {
                    arr.push({ label: cars[i].name, value: cars[i].name });
                }
                this.setState({ cars: arr, carType: cars[0].name });
            }
        });
        const { status } = await Camera.requestPermissionsAsync();
        if (status === 'granted') {
            const type = Camera.Constants.Type.back
            const autoFocus = Camera.Constants.AutoFocus
            this.setState({ statusCamera: true, type: type, autoFocus: autoFocus })
        } else {
            this.setState({ statusCamera: false, type: null })
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

    // last name validation
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
        const mobileValid = (mobile.length >= 14)
        LayoutAnimation.easeInEaseOut()
        this.setState({ mobileValid })
        mobileValid || this.mobileInput.shake();
        return mobileValid
    }

    // cpf validation
    validateCpf() {
        const { cpfNum } = this.state
        const cpfNumValid = (cpfNum.length >= 11)
        LayoutAnimation.easeInEaseOut()
        this.setState({ cpfNumValid })
        cpfNumValid || this.cpfNumInput.shake();
        return cpfNumValid
    }

    // cnh validation
    validateCnh() {
        const { cnh } = this.state
        const cnhValid = (cnh.length >= 11)
        LayoutAnimation.easeInEaseOut()
        this.setState({ cnhValid })
        cnhValid || this.cnhInput.shake();
        return cnhValid
    }

    // Orgao Emissor validation
    validateOrgaoEmissor() {
        const { orgaoEmissor } = this.state
        const OrgaoEmissorValid = (orgaoEmissor.length > 2)
        LayoutAnimation.easeInEaseOut()
        this.setState({ OrgaoEmissorValid })
        OrgaoEmissorValid || this.orgaoEmissorInput.shake();
        return OrgaoEmissorValid
    }

    // Orgao Emissor validation
    validateDataValidade() {
        const { dataValidade } = this.state
        const dataValidadeValid = (dataValidade.length >= 10)
        LayoutAnimation.easeInEaseOut()
        this.setState({ dataValidadeValid })
        dataValidadeValid || this.dataValidadeInput.shake();
        return dataValidadeValid
    }

    // RENAVAM validation
    validateRenavam() {
        const { renavam } = this.state
        const renavamValid = (renavam.length >= 11)
        LayoutAnimation.easeInEaseOut()
        this.setState({ renavamValid })
        renavamValid || this.renavamInput.shake();
        return renavamValid
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

    // IMAGEM CNH UPLOAD VALIDATION
    validateImageCnh() {
        const { imageCnh } = this.state;
        const imageCnhValid = (imageCnh != null);
        LayoutAnimation.easeInEaseOut()
        this.setState({ imageCnhValid })
        imageCnhValid;
        return imageCnhValid
    }

    // IMAGEM CRVL UPLOAD VALIDATION
    validateImageCrlv() {
        const { imageCrlv } = this.state;
        const imageCrlvValid = (imageCrlv != null);
        LayoutAnimation.easeInEaseOut()
        this.setState({ imageCrlvValid })
        imageCrlvValid;
        return imageCrlvValid
    }

    validateImagePerfil() {
        const { imagePerfil } = this.state;
        const imagePerfilValid = (imagePerfil != null);
        LayoutAnimation.easeInEaseOut()
        this.setState({ imagePerfilValid })
        imagePerfilValid;
        return imagePerfilValid
    }

    //imagepicker for license upload
    CapturePhotoCnh = async () => {
        //permission check
        const { status: cameraStatus } = await Permissions.askAsync(Permissions.CAMERA)
        const { status: cameraRollStatus } = await Permissions.askAsync(Permissions.CAMERA_ROLL);

        if (cameraStatus === 'granted' && cameraRollStatus === 'granted') {
            let result = await ImagePicker.launchImageLibraryAsync({
                allowsEditing: true,
                aspect: [4, 3],
                // base64: true,
                quality: 1.0
            });
            if (!result.cancelled) {
                this.setState({ imageCnh: result.uri });

            }
        } else {
            throw new Error('Camera permission not granted');
        }
    }

    //imagepicker for license upload
    CapturePhotoCrlv = async () => {
        //permission check
        const { status: cameraStatus } = await Permissions.askAsync(Permissions.CAMERA)
        const { status: cameraRollStatus } = await Permissions.askAsync(Permissions.CAMERA_ROLL);

        if (cameraStatus === 'granted' && cameraRollStatus === 'granted') {
            let result = await ImagePicker.launchImageLibraryAsync({
                allowsEditing: true,
                aspect: [4, 3],
                // base64: true,
                quality: 1.0
            });
            if (!result.cancelled) {
                this.setState({ imageCrlv: result.uri });

            }
        } else {
            throw new Error('Camera permission not granted');
        }
    }

    CapturePhotoPerfil = async () => {
        this.setState({ isProgress: true })
        //permission check
        console.log('ENTROU AQUI FUNÇÃO CAMERA')
        if (this.camera) {
            console.log('ENTROU NO IF AQUI FUNÇÃO CAMERA')
            let photo = await this.camera.takePictureAsync({
                quality: 1.0,
            })
            this.setState({ imagePerfil: photo.uri, isCamera: false, isProgress: false });
            console.log(photo.uri)
        }
    }

    //upload cancel
    cancelPhotoCnh = () => {
        this.setState({ imageCnh: null });
    }

    //upload cancel
    cancelPhotoCrlv = () => {
        this.setState({ imageCrlv: null });
    }
    cancelPhotoPerfil = () => {
        this.setState({ imagePerfil: null });
    }

    //register button press for validation
    onPressRegister() {
        this.setState({ loaderBtn: true })
        const { onPressRegister } = this.props;
        LayoutAnimation.easeInEaseOut();
        const fnameValid = this.validateFirstName();
        const lnameValid = this.validateLastname();
        const mobileValid = this.validateMobile();
        const emailValid = this.validateEmail();
        const imageCnhValid = this.validateImageCnh();
        const imageCrlvValid = this.validateImageCrlv();
        const imagePerfilValid = this.validateImagePerfil();

        const cpfNumValid = this.validateCpf();
        const cnhValid = this.validateCnh();
        const OrgaoEmissorValid = this.validateOrgaoEmissor();
        const dataValidadeValid = this.validateDataValidade();
        const renavamValid = this.validateRenavam();

        if (fnameValid && lnameValid && mobileValid && emailValid && imageCnhValid && imageCrlvValid && imagePerfilValid && cpfNumValid && renavamValid && dataValidadeValid && OrgaoEmissorValid && cnhValid && this.state.carType) {
            onPressRegister(this.state.fname, this.state.lname, this.state.mobile, this.state.email, this.state.imageCrlv, this.state.imageCnh, this.state.imagePerfil, this.state.carType, this.state.cpfNum, this.state.cnh, this.state.dataValidade, this.state.orgaoEmissor, this.state.renavam);
        }
        this.setState({ loaderBtn: false })
    }

    render() {
        const { onPressBack, loading } = this.props;
        let { imageCnh } = this.state;
        let { imageCrlv } = this.state;
        let { imagePerfil } = this.state;
        return (
            <View style={{ flex: 1, backgroundColor: colors.WHITE, }}>
                {!this.state.isCamera ?
                    <Text style={styles.headerStyle}>Registro</Text>
                    : null}
                {!this.state.isCamera ?
                    <ScrollView style={styles.scrollViewStyle}>


                        <View style={styles.containerStyle}>

                            {/*  CAMPOS DE NOME  */}

                            <Text style={styles.txtContainer2}>Dados pessoais</Text>
                            <View style={styles.textInputContainerStyle}>
                                <Text style={styles.txtContainer}>Nome</Text>
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
                                    onSubmitEditing={() => { this.validateFirstName(); this.lnameInput.focus() }}
                                    errorStyle={styles.errorMessageStyle}
                                    inputContainerStyle={styles.inputContainerStyle}
                                    containerStyle={styles.textInputStyle}
                                />
                            </View>

                            {/*  CAMPOS DE SOBRENOME  */}

                            <View style={styles.textInputContainerStyle}>
                                <Text style={styles.txtContainer}>Sobrenome</Text>
                                <Input
                                    ref={input => (this.lnameInput = input)}
                                    editable={true}
                                    returnKeyType={'next'}
                                    underlineColorAndroid={colors.TRANSPARENT}
                                    value={this.state.lname}
                                    keyboardType={'default'}
                                    inputStyle={styles.inputTextStyle}
                                    onChangeText={(text) => { this.setState({ lname: text }) }}
                                    errorMessage={this.state.lnameValid ? null : 'Por favor, insira seu sobrenome'}
                                    secureTextEntry={false}
                                    blurOnSubmit={true}
                                    onSubmitEditing={() => { this.validateLastname(); this.cpfNumInput.focus() }}
                                    errorStyle={styles.errorMessageStyle}
                                    inputContainerStyle={styles.inputContainerStyle}
                                    containerStyle={styles.textInputStyle}
                                />
                            </View>

                            {/*  CAMPOS DE CPF  */}

                            <View style={styles.textInputContainerStyle}>
                                <Text style={styles.txtContainer}>CPF</Text>
                                <Input
                                    ref={input => (this.cpfNumInput = input)}
                                    editable={true}
                                    returnKeyType={'next'}
                                    underlineColorAndroid={colors.TRANSPARENT}
                                    value={this.state.cpfNum}
                                    keyboardType={'numeric'}
                                    inputStyle={styles.inputTextStyle}
                                    onChangeText={(text) => { this.setState({ cpfNum: text }) }}
                                    errorMessage={this.state.cpfNumValid ? null : 'CPF inválido, insira novamente sem ponto e hifén'}
                                    secureTextEntry={false}
                                    maxLength={11}
                                    blurOnSubmit={true}
                                    onSubmitEditing={() => { this.validateCpf(); this.emailInput.focus() }}
                                    errorStyle={styles.errorMessageStyle}
                                    inputContainerStyle={styles.inputContainerStyle}
                                    containerStyle={styles.textInputStyle}
                                />
                            </View>

                            {/*  CAMPOS DE E-MAIL  */}

                            <View style={styles.textInputContainerStyle}>
                                <Text style={styles.txtContainer}>E-mail</Text>
                                <Input
                                    ref={input => (this.emailInput = input)}
                                    editable={this.props.reqData.profile.email ? false : true}
                                    returnKeyType={'next'}
                                    underlineColorAndroid={colors.TRANSPARENT}
                                    value={this.state.email}
                                    keyboardType={'email-address'}
                                    inputStyle={styles.inputTextStyle}
                                    onChangeText={(text) => { this.setState({ email: text }) }}
                                    errorMessage={this.state.emailValid ? null : 'E-mail inválido ou em branco'}
                                    secureTextEntry={false}
                                    blurOnSubmit={true}
                                    onSubmitEditing={() => { this.validateEmail(); this.mobileInput.focus() }}
                                    errorStyle={styles.errorMessageStyle}
                                    inputContainerStyle={styles.inputContainerStyle}
                                    containerStyle={styles.textInputStyle}
                                />
                            </View>

                            {/*  CAMPOS DE CELULAR  */}

                            <View style={styles.textInputContainerStyle}>
                                <Text style={styles.txtContainer}>Celular</Text>
                                <Input
                                    ref={input => (this.mobileInput = input)}
                                    editable={this.props.reqData.profile.mobile ? false : true}
                                    returnKeyType={'done'}
                                    underlineColorAndroid={colors.TRANSPARENT}
                                    value={this.state.mobile}
                                    keyboardType={'numeric'}
                                    inputStyle={styles.inputTextStyle}
                                    onChangeText={(text) => { this.setState({ mobile: text }) }}
                                    errorMessage={this.state.mobileValid ? null : 'Celular inválido ou em branco'}
                                    secureTextEntry={false}
                                    blurOnSubmit={true}
                                    onSubmitEditing={() => { this.validateMobile(); this.cnhInput.focus() }}
                                    errorStyle={styles.errorMessageStyle}
                                    inputContainerStyle={styles.inputContainerStyle}
                                    containerStyle={styles.textInputStyle}
                                />
                            </View>

                            {/*  NUMERO DA CNH  */}

                            <Text style={styles.txtContainer2}>Dados da CNH</Text>
                            <View style={styles.textInputContainerStyle}>
                                <Text style={styles.txtContainer}>Número de registro CNH</Text>
                                <Input
                                    ref={input => (this.cnhInput = input)}
                                    editable={true}
                                    returnKeyType={'next'}
                                    underlineColorAndroid={colors.TRANSPARENT}
                                    value={this.state.cnh}
                                    keyboardType={'numeric'}
                                    inputStyle={styles.inputTextStyle}
                                    onChangeText={(text) => { this.setState({ cnh: text }) }}
                                    errorMessage={this.state.cnhValid ? null : 'Número da CNH inválido'}
                                    secureTextEntry={false}
                                    maxLength={11}
                                    blurOnSubmit={true}
                                    onSubmitEditing={() => { this.validateCnh(); this.orgaoEmissorInput.focus() }}
                                    errorStyle={styles.errorMessageStyle}
                                    inputContainerStyle={styles.inputContainerStyle}
                                    containerStyle={styles.textInputStyle}
                                />
                            </View>

                            {/*  ORGÃO EMISSOR  */}

                            <View style={styles.textInputContainerStyle}>
                                <Text style={styles.txtContainer}>Orgão emissor</Text>
                                <Input
                                    ref={input => (this.orgaoEmissorInput = input)}
                                    editable={true}
                                    returnKeyType={'next'}
                                    underlineColorAndroid={colors.TRANSPARENT}
                                    value={this.state.orgaoEmissor}
                                    keyboardType={'default'}
                                    inputStyle={styles.inputTextStyle}
                                    onChangeText={(text) => { this.setState({ orgaoEmissor: text }) }}
                                    errorMessage={this.state.OrgaoEmissorValid ? null : 'Insira o nome do orgão emissor'}
                                    secureTextEntry={false}
                                    blurOnSubmit={true}
                                    onSubmitEditing={() => { this.validateOrgaoEmissor(); this.cpfNumInput.focus() }}
                                    errorStyle={styles.errorMessageStyle}
                                    inputContainerStyle={styles.inputContainerStyle}
                                    containerStyle={styles.textInputStyle}
                                />
                            </View>


                            {/*  DATA DE VALIDADE  */}

                            <View style={styles.textInputContainerStyle}>
                                <Text style={styles.txtContainer}>Data de validade</Text>
                                <Input
                                    ref={input => (this.dataValidadeInput = input)}
                                    editable={true}
                                    returnKeyType={'done'}
                                    underlineColorAndroid={colors.TRANSPARENT}
                                    value={this.state.dataValidade}
                                    keyboardType={'numeric'}
                                    inputStyle={styles.inputTextStyle}
                                    onChangeText={(text) => { this.setState({ dataValidade: text }) }}
                                    errorMessage={this.state.dataValidadeValid ? null : 'Informe a data de validade da CNH'}
                                    secureTextEntry={false}
                                    blurOnSubmit={true}
                                    maxLength={10}
                                    onSubmitEditing={() => { this.validateDataValidade(); this.renavamInput.focus() }}
                                    errorStyle={styles.errorMessageStyle}
                                    inputContainerStyle={styles.inputContainerStyle}
                                    containerStyle={styles.textInputStyle}
                                />
                            </View>


                            <Text style={styles.txtContainer2}>Dados do CRLV</Text>

                            {/*  RENAVAM  */}

                            <View style={styles.textInputContainerStyle}>
                                <Text style={styles.txtContainer}>RENAVAM</Text>
                                <Input
                                    ref={input => (this.renavamInput = input)}
                                    editable={true}
                                    underlineColorAndroid={colors.TRANSPARENT}
                                    value={this.state.renavam}
                                    inputStyle={styles.inputTextStyle}
                                    onChangeText={(text) => { this.setState({ renavam: text }) }}
                                    errorMessage={this.state.renavamValid ? null : languageJSON.vehicle_number_blank_err}
                                    blurOnSubmit={true}
                                    keyboardType={'numeric'}
                                    maxLength={11}
                                    onSubmitEditing={() => { this.validateRenavam() }}
                                    errorStyle={styles.errorMessageStyle}
                                    inputContainerStyle={styles.inputContainerStyle}
                                    containerStyle={styles.textInputStyle}
                                />
                            </View>

                            {/*  IMAGEM DA CNH  */}

                            <Text style={styles.txtContainer2}>Envio de imagens</Text>
                            <Text style={styles.txtContainer3}>Lembre-se de tirar fotos com uma boa iluminação e nítida, caso contrário terá seus documentos negados</Text>

                            {
                                imageCnh ?
                                    <View style={styles.imagePosition}>
                                        <TouchableOpacity style={styles.photoClick} onPress={this.cancelPhotoCnh}>
                                            <Image source={require('../../assets/images/cross.png')} resizeMode={'contain'} style={styles.imageStyle} />
                                        </TouchableOpacity>
                                        <Image source={{ uri: imageCnh }} style={styles.photoResult} resizeMode={'center'} />
                                    </View>
                                    :
                                    <View style={styles.capturePhoto}>
                                        <View>
                                            {
                                                this.state.imageCnhValid ?
                                                    <Text style={styles.capturePhotoTitle}>Envie uma foto de sua CNH</Text>
                                                    :
                                                    <Text style={styles.errorPhotoTitle}>Falha ao enviar, tente novamente.</Text>
                                            }

                                        </View>
                                        <View style={styles.capturePicClick}>
                                            <TouchableOpacity style={styles.flexView1} onPress={this.CapturePhotoCnh}>
                                                <View>
                                                    <View style={styles.imageFixStyle}>
                                                        <Image source={require('../../assets/images/habilitacao.png')} resizeMode={'contain'} style={styles.imageStyle2} />
                                                    </View>
                                                </View>
                                            </TouchableOpacity>
                                            <View style={styles.myView}>
                                                <View style={styles.myView1} />
                                            </View>
                                            <View style={styles.myView2}>
                                                <View style={styles.myView3}>
                                                    <Text style={styles.textStyle}>Tamanho max: 2MB</Text>
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                            }

                            {
                                imagePerfil ?
                                    <View style={styles.imagePosition}>
                                        <TouchableOpacity style={styles.photoClick} onPress={this.cancelPhotoPerfil}>
                                            <Image source={require('../../assets/images/cross.png')} resizeMode={'contain'} style={styles.imageStyle} />
                                        </TouchableOpacity>
                                        <Image source={{ uri: imagePerfil }} style={styles.photoResult} resizeMode={'cover'} />
                                    </View>
                                    :
                                    <View style={styles.capturePhoto}>
                                        <View>
                                            {
                                                this.state.imagePerfilValid ?
                                                    <Text style={styles.capturePhotoTitle}>Envie uma foto sua</Text>
                                                    :
                                                    <Text style={styles.errorPhotoTitle}>Falha ao enviar, tente novamente.</Text>
                                            }

                                        </View>
                                        <View style={styles.capturePicClick}>
                                            <TouchableOpacity style={styles.flexView1} onPress={() => this.setState({ isCamera: true })}>
                                                <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                                                    <Icon
                                                        name='ios-person'
                                                        type='ionicon'
                                                        color={colors.BLACK}
                                                        size={50}
                                                    />
                                                </View>
                                            </TouchableOpacity>
                                            <View style={styles.myView}>
                                                <View style={styles.myView1} />
                                            </View>
                                            <View style={styles.myView2}>
                                                <View style={styles.myView3}>
                                                    <Text style={styles.textStyle}>Tamanho max: 2MB</Text>
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                            }

                            {/*  CAMPOS DE MODELO DE VEÍCULO  */}

                            {/*  CAMPOS DE PLACA DE VEÍCULO  */}

                            {
                                imageCrlv ?
                                    <View style={styles.imagePosition}>
                                        <TouchableOpacity style={styles.photoClick} onPress={this.cancelPhotoCrlv}>
                                            <Image source={require('../../assets/images/cross.png')} resizeMode={'contain'} style={styles.imageStyle} />
                                        </TouchableOpacity>
                                        <Image source={{ uri: imageCrlv }} style={styles.photoResult} resizeMode={'cover'} />
                                    </View>
                                    :
                                    <View style={styles.capturePhoto}>
                                        <View>
                                            {
                                                this.state.imageCrlvValid ?
                                                    <Text style={styles.capturePhotoTitle}>Envie uma foto do CRLV</Text>
                                                    :
                                                    <Text style={styles.errorPhotoTitle}>Falha ao enviar, tente novamente.</Text>
                                            }

                                        </View>
                                        <View style={styles.capturePicClick}>
                                            <TouchableOpacity style={styles.flexView1} onPress={this.CapturePhotoCrlv}>
                                                <View>
                                                    <View style={styles.imageFixStyle}>
                                                        <Image source={require('../../assets/images/crlv.png')} resizeMode={'contain'} style={styles.imageStyle3} />
                                                    </View>
                                                </View>
                                            </TouchableOpacity>
                                            <View style={styles.myView}>
                                                <View style={styles.myView1} />
                                            </View>
                                            <View style={styles.myView2}>
                                                <View style={styles.myView3}>
                                                    <Text style={styles.textStyle}>Tamanho max: 2MB</Text>
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                            }

                            <View style={styles.buttonContainer}>
                                <Button
                                    onPress={() => { this.onPressRegister() }}
                                    title='Cadastrar'
                                    disabled={this.state.loaderBtn}
                                    loading={loading}
                                    titleStyle={styles.buttonTitle}
                                    buttonStyle={styles.registerButton}
                                />
                            </View>
                            <View style={styles.gapView} />
                        </View>
                    </ScrollView>
                    :
                    <View style={{ flex: 1 }}>
                        {this.state.isPerfil ?
                        <Camera style={{ flex: 1 }} type={Camera.Constants.Type.front ? Camera.Constants.Type.front : Camera.Constants.Type.back} ratio='16:9' ref={ref => { this.camera = ref }} >
                            <View
                                style={{
                                    flex: 1,
                                    backgroundColor: 'transparent',
                                }}>
                                <TouchableOpacity
                                    style={{
                                        flex: 0.1,
                                        alignSelf: 'flex-end',
                                        alignItems: 'center',
                                    }}
                                    onPress={() => {
                                        this.state.type === Camera.Constants.Type.back ? Camera.Constants.Type.front : Camera.Constants.Type.back;
                                    }}>
                                </TouchableOpacity>
                            </View>
                        </Camera>
                        :
                        null}
                        <TouchableOpacity style={{ flex: 1, position: 'absolute', bottom: 20, alignSelf: 'center', justifyContent: 'center', alignItems: 'center', backgroundColor: colors.GREY3, height: 65, width: 65, borderRadius: 100, elevation: 3, }}
                            onPress={() => this.CapturePhotoPerfil()}
                            disabled={this.state.isProgress}
                        >
                            <Icon
                                name='ios-camera'
                                type='ionicon'
                                color={colors.BLACK}
                                size={40}
                            />
                        </TouchableOpacity>

                        <TouchableOpacity style={{ flex: 1, position: 'absolute', top: 40, right: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.GREY3, height: 40, width: 40, borderRadius: 100, elevation: 3, }}
                            onPress={() => this.setState({ isCamera: false })}
                            disabled={this.state.isProgress}
                        >
                            <Icon
                                name='x'
                                type='feather'
                                color={colors.RED}
                                size={30}
                            />
                        </TouchableOpacity>
                    </View>}
            </View>
        );
    }
};

//style for this component
const styles = {
    headerInnerContainer: {
        marginLeft: 10,
        marginRight: 10
    },
    inputContainerStyle: {
        borderRadius: 10,
        backgroundColor: colors.GREY1,
        borderBottomWidth: 0,
    },
    textInputStyle: {
        marginLeft: 0,
    },
    viewRegistro: {
        position: 'absolute'
    },
    iconContainer: {
        paddingTop: 8
    },
    gapView: {
        height: 40,
        width: '100%'
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        borderRadius: 40
    },
    registerButton: {
        backgroundColor: colors.DEEPBLUE,
        width: '95%',
        height: 50,
        borderColor: colors.TRANSPARENT,
        borderWidth: 0,
        marginTop: 45,
        borderRadius: 15,
    },
    buttonTitle: {
        fontSize: 16,
        fontFamily: 'Inter-Bold'
    },
    pickerStyle: {
        color: 'white',
        width: 200,
        fontSize: 15,
        height: 40,
        marginLeft: 20,
        borderBottomWidth: 1,
        borderBottomColor: colors.WHITE,
    },
    inputTextStyle: {
        color: colors.BLACK,
        fontSize: 13,
        marginLeft: 12,
        marginRight: 12,
        height: 32
    },
    errorMessageStyle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 0
    },
    containerStyle: {
        flexDirection: 'column',
        backgroundColor: colors.WHITE

    },
    form: {
        flex: 1,
    },
    logo: {
        width: '100%',
        justifyContent: "flex-start",
        marginTop: 10,
        alignItems: 'center',
    },
    scrollViewStyle: {
        height: height,
        backgroundColor: colors.WHITE,

    },
    textInputContainerStyle: {
        alignItems: "center",
        marginLeft: 20,
        marginRight: 20,
        padding: 15,

    },
    txtContainer: {
        fontFamily: 'Inter-Bold',
        alignSelf: 'flex-start',
        marginLeft: 20,
        color: colors.BLACK,
        marginBottom: 5,
        fontSize: 13,
    },

    txtContainer2: {
        fontFamily: 'Inter-Bold',
        alignSelf: 'center',
        color: colors.BLACK,
        marginTop: 20,
        marginBottom: 3,
        fontSize: 13,
    },

    txtContainer3: {
        fontFamily: 'Inter-Bold',
        alignSelf: 'center',
        textAlign: 'center',
        color: colors.RED,
        marginLeft: 10,
        marginRight: 10,
        marginTop: 5,
        marginBottom: 5,
        fontSize: 12,
    },

    headerStyle: {
        fontSize: 20,
        color: colors.BLACK,
        fontFamily: 'Inter-Bold',
        textAlign: 'center',
        flexDirection: 'row',
        marginBottom: 25,
        marginTop: Platform.select({ ios: 40, android: 30 })
    },
    capturePhoto: {
        width: '80%',
        alignSelf: 'center',
        flexDirection: 'column',
        justifyContent: 'center',
        borderRadius: 10,
        backgroundColor: colors.WHITE,
        marginLeft: 20,
        marginRight: 20,
        paddingTop: 15,
        paddingBottom: 10,
        marginTop: 15
    },
    capturePhotoTitle: {
        color: colors.BLACK,
        fontFamily: 'Inter-Bold',
        fontSize: 13,
        textAlign: 'center',
        paddingBottom: 15,

    },
    errorPhotoTitle: {
        color: colors.RED,
        fontFamily: 'Inter-Bold',
        fontSize: 13,
        textAlign: 'center',
        paddingBottom: 15,
    },
    photoResult: {
        alignSelf: 'center',
        flexDirection: 'column',
        justifyContent: 'center',
        borderRadius: 10,
        marginLeft: 20,
        marginRight: 20,
        paddingTop: 15,
        paddingBottom: 10,
        marginTop: 15,
        width: '80%',
        height: height / 2
    },
    imagePosition: {
        position: 'relative'
    },
    photoClick: {
        paddingRight: 48,
        position: 'absolute',
        zIndex: 1,
        marginTop: 18,
        alignSelf: 'flex-end'
    },
    capturePicClick: {
        backgroundColor: colors.WHITE,
        borderWidth: 1,
        borderRadius: 15,
        borderColor: colors.GREY1,
        flexDirection: 'row',
        position: 'relative',
        zIndex: 1
    },
    imageStyle: {
        width: 30,
        height: height / 15
    },
    flexView1: {
        flex: 12
    },
    imageFixStyle: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    imageStyle2: {
        width: 50,
        height: height / 15
    },

    imageStyle3: {
        width: 32,
        height: height / 15
    },

    myView: {
        flex: 2,
        height: 55,
        width: 1,
        alignItems: 'center'
    },
    myView1: {
        height: height / 15,
        width: 1.5,
        backgroundColor: colors.GREY1,
        alignItems: 'center',

    },
    myView2: {
        flex: 20,
        alignItems: 'center',
        justifyContent: 'center'
    },
    myView3: {
        flex: 2.2,
        alignItems: 'center',
        justifyContent: 'center'
    },
    textStyle: {
        color: colors.GREY.btnPrimary,
        fontFamily: 'Roboto-Bold',
        fontSize: 13
    }
}