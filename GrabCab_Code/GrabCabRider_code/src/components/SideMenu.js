import React from 'react';
import { Text, View, Dimensions, StyleSheet, FlatList, Image, TouchableOpacity,AsyncStorage } from 'react-native';
import { Icon } from 'react-native-elements';
import { NavigationActions } from 'react-navigation';
import * as firebase from 'firebase'; //Database
import SideMenuHeader from './SideMenuHeader';
import { colors } from '../common/theme';
var { width, height } = Dimensions.get('window');
import languageJSON from '../common/language';

export default class SideMenu extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            heightIphoneSix: false,
            sideMenuList:
                [
                    { key: 1, name: languageJSON.book_your_ride_menu, navigationName: 'Map', icon: 'home', type: 'font-awesome', child: 'firstChild' },
                    { key: 2, name: languageJSON.profile_setting_menu, navigationName: 'Profile', icon: 'ios-person-add', type: 'ionicon', child: 'secondChild' },
                    { key: 3, name: languageJSON.my_wallet_menu, icon: 'account-balance-wallet', navigationName: 'wallet', type: 'MaterialIcons', child: 'thirdChild' },
                    { key: 4, name: languageJSON.my_rides_menu, navigationName: 'RideList', icon: 'car-sports', type: 'material-community', child: 'fourthChild' },
                    { key: 5, name: languageJSON.about_us_menu, navigationName: 'About', icon: 'info', type: 'entypo', child: 'fifthChild' },
                    { key: 6, name: languageJSON.logout, icon: 'sign-out', type: 'font-awesome', child: 'lastChild' }
                ],
            profile_image: null,
            settings: {
                code: '',
                symbol: '',
                cash: false,
                wallet: false
            }
        }
    }

    _retrieveSettings = async () => {
        try {
            const value = await AsyncStorage.getItem('settings');
            if (value !== null) {
                this.setState({ settings: JSON.parse(value) });
            }
        } catch (error) {
            console.log("Asyncstorage issue 3");
        }
    };

    componentDidMount() {
        this.heightReponsive();
        var curuser = firebase.auth().currentUser.uid;
        const userRoot = firebase.database().ref('users/' + curuser);
        userRoot.on('value', userData => {
            if (userData.val()) {
                this.setState(userData.val());
            }

        })
        this.tripSatusCheck();
        this._retrieveSettings();
    }

    //check for device height(specially iPhone 6)
    heightReponsive() {
        if (height <= 667) {
            this.setState({ heightIphoneSix: true })
        }
    }

    //navigation to screens from side menu
    navigateToScreen = (route) => () => {
        const navigateAction = NavigationActions.navigate({
            routeName: route
        });
        this.props.navigation.dispatch(navigateAction);
    }

    //sign out and clear all async storage
    async signOut() {
        firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/pushToken').remove();
        firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/userPlatform').remove();
        AsyncStorage.clear();
        firebase.auth().signOut();
    }

    //CHECKING TRIP END OR START
    tripSatusCheck() {
        var curuser = firebase.auth().currentUser;
        this.setState({ currentUser: curuser }, () => {
            const userData = firebase.database().ref('users/' + this.state.currentUser.uid);
            userData.on('value', userData => {
                if (userData.val()) {
                    var data = userData.val()
                    if (data['my-booking']) {
                        let bookingData = data['my-booking']
                        for (key in bookingData) {
                            bookingData[key].bookingKey = key
                            if (bookingData[key].payment_status) {
                                if (bookingData[key].payment_status == "WAITING" && bookingData[key].status == 'END' && bookingData[key].skip != true && bookingData[key].paymentstart != true) {
                                    bookingData[key].firstname = data.firstName;
                                    bookingData[key].lastname = data.lastName;
                                    bookingData[key].email = data.email;
                                    bookingData[key].phonenumber = data.mobile;
                                    this.props.navigation.navigate('CardDetails', { data: bookingData[key] });
                                    console.log("ENTROU AQUI NO CARD DETAILS")
                                }
                            }
                        }
                    }
                }
            })
        })
    }

    render() {
        return (
            <View style={styles.mainViewStyle}>
                <SideMenuHeader headerStyle={styles.myHeader} userPhoto={this.state.profile_image} userEmail={this.state.email} userPhone={this.state.mobile} userName={this.state.firstName + ' ' + this.state.lastName} ></SideMenuHeader>

                <View style={styles.compViewStyle}>
                    
                    <FlatList
                        data={this.state.sideMenuList}
                        keyExtractor={(item, index) => index.toString()}
                        style={{ marginTop: 20 }}
                        bounces={false}
                        renderItem={({ item, index }) => {
                            if (this.state.settings.wallet == false && item.navigationName == 'wallet'  ) {
                                return null;
                            }else{
                                return(
                                <TouchableOpacity
                                    onPress={
                                        (item.name == languageJSON.logout) ? () => this.signOut() :
                                            this.navigateToScreen(item.navigationName)
                                    }
                                    style={
                                        [styles.menuItemView, { marginTop: (index == this.state.sideMenuList.length - 1) ? width / 7 : 0 }]
                                    }>
                                    <View style={styles.viewIcon}>
                                        <Icon
                                            name={item.icon}
                                            type={item.type}
                                            color={colors.BLACK}
                                            size={20}
                                            containerStyle={styles.iconStyle}
                                        />
                                    </View>
                                    <Text style={styles.menuName}>{item.name.toUpperCase()}</Text>
                                </TouchableOpacity>
                                )
                            
                            }
                        }
                        } />
                </View>

            </View>
        )
    }
}
const styles = StyleSheet.create({
    myHeader: {
        marginTop: 0,
    },
    vertialLine: {
        width: 1,
        backgroundColor: colors.GREY2,
        position: 'absolute',
        left: 27,
        top: 24
    },
    menuItemView: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        marginBottom: 25,
        flex: 1,
        paddingLeft: 10,
        paddingRight: 10,
    },
    viewIcon: {
        width: 35,
        height: 35,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.WHITE,
        shadowColor:colors.BLACK,
        shadowOffset:{width:0,height:3},
        shadowOpacity:0.3,
        elevation: 3,
        left: 1
    },
    menuName: {
        color: colors.BLACK,
        fontWeight: 'bold',
        marginLeft: 12,
        width: "100%"
    },
    mainViewStyle: {
        backgroundColor: colors.WHITE,
        height: '100%',
    },
    compViewStyle: {
        position: 'relative',
        flex: 3,
        marginLeft: 10
    },
    iconStyle: {
        justifyContent: 'center',
        alignItems: 'center'
    },

})