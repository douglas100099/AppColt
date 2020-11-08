import React from 'react';
import { Header, Icon } from 'react-native-elements';
import { colors } from '../common/theme';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
var { width } = Dimensions.get('window');
import * as firebase from 'firebase';
import languageJSON from '../common/language';


export default class AboutPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
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

    render() {
        return (

            <View style={styles.mainView}>
                <View style={styles.header}>
                    <Text style={{fontSize: 20, fontFamily: 'Inter-Bold', color: colors.BLACK, textAlign: 'center'}}>Suporte</Text>
                    <View style={{position: 'absolute', zIndex: 999, left: 20}}>
                        <TouchableOpacity style={{height: 35, width: 35, borderRadius: 100, backgroundColor: colors.WHITE, elevation: 4,}} onPress={() => { this.props.navigation.goBack();}}>
                            <Icon
                                name='ios-arrow-dropleft-circle'
                                size={35}
                                type='ionicon'
                                color={colors.BLACK}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
                <View>
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
            </View>

        );
    }

}
const styles = StyleSheet.create({
    mainView: {
        flex: 1,
        backgroundColor: colors.WHITE,
        //marginTop: StatusBar.currentHeight,
    },
    header: {
        backgroundColor: colors.WHITE,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 25,
        marginTop: Platform.select({ ios: 55, android: 45 })
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