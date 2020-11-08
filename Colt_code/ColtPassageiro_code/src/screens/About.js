import React from 'react';
import { Header, Icon } from 'react-native-elements';
import { colors } from '../common/theme';
import {
    StyleSheet,
    View,
    Text,
    TouchableWithoutFeedback,
    Dimensions,
    TouchableOpacity,
    Modal,
} from 'react-native';
var { width, height } = Dimensions.get('window');
import * as firebase from 'firebase';
import languageJSON from '../common/language';

export default class AboutPage extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            open: false,
        };
    }

    componentDidMount() {
        const about = firebase.database().ref('About_Us/');
        about.once('value', aboutData => {
            if (aboutData.val()) {
                let data = aboutData.val()
                this.setState(data);
            }
        })
    }

    press() {
        this.state.open ? setTimeout(() => { this.setState({ open: false }) }, 100) :
            this.setState({
                open: true,
            });
    }

    render() {
        return (

            <View style={styles.mainView}>
                <Header
                    backgroundColor={colors.WHITE}
                    leftComponent={{ icon: 'chevron-left', type: 'MaterialIcons', color: colors.BLACK, size: 35, component: TouchableWithoutFeedback, onPress: () => { this.props.navigation.goBack(); } }}
                    centerComponent={<Text style={styles.headerTitleStyle}>{languageJSON.about_us_menu}</Text>}
                    containerStyle={styles.headerStyle}
                    innerContainerStyles={{ marginLeft: 10, marginRight: 10 }}
                    onPress={this.showActionSheet}
                />

                {/*<View>
                    <ScrollView styles={{ marginTop: 10 }}>
                        <Text style={styles.aboutTitleStyle}>{this.state.heading ? this.state.heading : null}</Text>
                        <View style={styles.aboutcontentmainStyle}>

                            <Text style={styles.aboutcontentStyle}>

                                {this.state.contents ? this.state.contents : null}
                            </Text>
                            <Text style={styles.aboutTitleStyle}>{languageJSON.contact_details}</Text>
                            <View style={styles.contact}>
                                <View style={{ justifyContent: 'flex-start', alignItems: 'center', flexDirection: 'row' }}>
                                    <Text style={styles.contacttype1}>{languageJSON.email_placeholder} :</Text>
                                    <Text style={styles.contacttype1}> {this.state.email ? this.state.email : null}</Text>
                                </View>
                                <View style={{ justifyContent: 'flex-start', alignItems: 'center', flexDirection: 'row' }}>
                                    <Text style={styles.contacttype2}>{languageJSON.phone} :</Text>
                                    <Text style={styles.contacttype1}> {this.state.phone ? this.state.phone : null}</Text>
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                </View>
                */}

            </View>
        );
    }

}
const styles = StyleSheet.create({
    textMoney: {
        fontFamily: 'Inter-Medium',
        fontWeight: "600",
        fontSize: 20,
        marginLeft: 7
    },
    iconMoney: {
        marginLeft: 30,

    },
    containerModalPayment: {
        flex: 1,
        shadowColor: colors.BLACK,
        shadowOpacity: 0.2,
        shadowOffset: { x: 0, y: 0 },
        shadowRadius: 15,
    },
    backgroundModalPayment: {
        position: 'absolute',
        bottom: 0,
        height: 250,
        padding: 0,
        backgroundColor: colors.GREY3,
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        width: width,
    },
    boxMoney: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        backgroundColor: colors.WHITE,
        height: 55,
        marginTop: 16,
        borderRadius: 10,
        elevation: 5,
        shadowColor: colors.GREY2,
        shadowOpacity: 0.2,
        shadowOffset: { x: 0, y: 0 },
        shadowRadius: 15,
    },
    boxCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        backgroundColor: colors.WHITE,
        height: 55,
        marginTop: 16,
        borderRadius: 10,
        elevation: 5,
        shadowColor: colors.GREY2,
        shadowOpacity: 0.2,
        shadowOffset: { x: 0, y: 0 },
        shadowRadius: 15,
    },
    mainView: {
        flex: 1,
        backgroundColor: colors.WHITE,
        //marginTop: StatusBar.currentHeight,
    },
    headerStyle: {
        backgroundColor: colors.WHITE,
        borderBottomWidth: 0
    },
    headerTitleStyle: {
        color: colors.BLACK,
        fontFamily: 'Inter-Bold',
        fontSize: 20
    },
    aboutTitleStyle: {
        color: colors.BLACK,
        fontFamily: 'Inter-Bold',
        fontSize: 20,
        marginLeft: 8,
        marginTop: 8
    },
    aboutcontentmainStyle: {
        marginTop: 12,
        marginBottom: 60
    },
    aboutcontentStyle: {
        color: colors.BLACK,
        fontFamily: 'Inter-Regular',
        fontSize: 15,
        textAlign: "justify",
        alignSelf: 'center',
        width: width - 20,
        letterSpacing: 1,
        marginTop: 6,
    },
    contact: {
        marginTop: 6,
        marginLeft: 8,
        //flexDirection:'row',
        width: "100%",
        marginBottom: 30
    },
    contacttype1: {
        textAlign: 'left',
        color: colors.BLACK,
        fontFamily: 'Inter-Bold',
        fontSize: 15,
    },
    contacttype2: {
        textAlign: 'left',
        marginTop: 4,
        color: colors.GREY.secondary,
        fontFamily: 'Inter-Bold',
        fontSize: 15,
    }
})