import React, { Component } from "react";
import {
    StyleSheet,
    View,
    ImageBackground,
    Dimensions,
} from "react-native";
import MaterialButtonDark from "../components/MaterialButtonDark";
import languageJSON from '../common/language';

export default class IntroScreen extends Component {
    static navigationOptions = {
        headerShown:false
    }

    constructor(props) {
        super(props);
    }

    onPressLoginEmail = async () => {
        this.props.navigation.navigate("EmailLogin");
    }

    onPressLoginMobile = async () => {
        this.props.navigation.navigate("MobileLogin");
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
        height: Dimensions.get('window').height * 0.65,
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
    }
});
