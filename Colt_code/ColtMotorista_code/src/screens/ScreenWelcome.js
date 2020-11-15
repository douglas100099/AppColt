import React from 'react';
import { Icon } from 'react-native-elements';
import { colors } from '../common/theme';
import { NavigationActions, StackActions } from 'react-navigation';
import * as Animatable from 'react-native-animatable';
var { width, height } = Dimensions.get('window');
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Dimensions,
    Image,
} from 'react-native';

import DriverCarSVG from '../SVG/Illustrator/DriverCarSVG.js';
import FuncitonsSVG from '../SVG/Illustrator/FuncitonsSVG.js';

export default class ScreenWelcome extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            part: 1,
        }
    }

    componentDidMount(){
        const registrationData = this.props.navigation.getParam("requireData");
        this.setState({ data: registrationData })
    }

    render() {
        return (
            <View style={styles.mainView}>
                {this.state.part === 1 ?
                <View style={styles.part}>
                    <Animatable.View animation='fadeInDownBig' style={styles.logo}>
                        <Image source={require("../../assets/images/LogoEscrita1.png")} style={styles.logoColt}/>
                    </Animatable.View>
                    <Animatable.View animation='fadeInLeft' style={styles.text}>
                        <Text style={styles.txtText}>Bem vindo a Colt, comece agora a aumentar seus ganhos, junte-se a nós!</Text>
                    </Animatable.View>
                    <Animatable.View animation='fadeIn' style={styles.btn}>
                        <TouchableOpacity
                            style={styles.containerBtn}
                            onPress={() => this.setState({ part: 2 })}
                        >
                            <Text style={styles.txtBtn}>Próximo</Text>
                        </TouchableOpacity>
                    </Animatable.View>
                </View>
                :
                null}

                {this.state.part === 2 ?
                <View style={styles.part}>
                    <Animatable.View animation='fadeInDownBig' style={styles.logo}>
                        <DriverCarSVG height={250} width={250} />
                    </Animatable.View>
                    <Animatable.View animation='fadeInLeft' style={styles.text}>
                        <Text style={styles.txtText}>Com a Colt você não precisa se preocupar foque apenas no mais importante: dirigir e aumentar seus ganhos.</Text>
                    </Animatable.View>
                    <Animatable.View animation='fadeIn' style={styles.btn}>
                        <TouchableOpacity
                            style={styles.containerBtn}
                            onPress={() => this.setState({ part: 3 })}
                        >
                            <Text style={styles.txtBtn}>Próximo</Text>
                        </TouchableOpacity>
                    </Animatable.View>
                </View>
                :
                null}

                {this.state.part === 3 ?
                <View style={styles.part}>
                    <Animatable.View animation='fadeInDownBig' style={styles.logo}>
                        <FuncitonsSVG height={250} width={250} />
                    </Animatable.View>
                    <Animatable.View animation='fadeInLeft' style={styles.text}>
                        <Text style={styles.txtText}>Não se preocupe, a Colt é um app moderno, ele irá te auxiliar ao longo de suas corridas. Faça o cadastro agora mesmo e aguarde sua confirmação!</Text>
                    </Animatable.View>
                    <Animatable.View animation='fadeIn' style={styles.btn}>
                        <TouchableOpacity
                            style={styles.containerBtn}
                            onPress={() => this.props.navigation.replace("DriverReg", { requireData: this.state.data })}
                        >
                            <Text style={styles.txtBtn}>Cadastrar</Text>
                        </TouchableOpacity>
                    </Animatable.View>
                </View>
                :
                null}

            </View>
        )
    }
}

const styles = StyleSheet.create({
    mainView: {
        flex: 1,
        backgroundColor: colors.BLACK,
    },

    part:{
        flex: 2.5,
        backgroundColor: colors.DEEPBLUE,
        borderTopLeftRadius: 320,
        borderBottomRightRadius: 150,
    },

    logoColt: {
        resizeMode: 'contain',
        height: 350,
        width: 250,
    },

    logo: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },

    text: {
        flex: 0.3,
        justifyContent: 'center',
        alignItems: 'center',
    },

    txtText: {
        textAlign: 'center',
        marginHorizontal: 20,
        fontSize: 20,
        fontFamily: 'Inter-Bold',
        color: colors.WHITE,
    },

    btn:{
        flex: 0.5,
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
    },

    txtBtn: {
        fontFamily: 'Inter-Bold',
        color: colors.WHITE,
        fontSize: 16,
    },

    containerBtn: {
        backgroundColor: colors.DEEPBLUE,
        height: 60,
        width: 200,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
})