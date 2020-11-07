import React from 'react';
import { Text, View, Dimensions, StyleSheet, FlatList, Image, TouchableOpacity,AsyncStorage } from 'react-native';
import { Icon } from 'react-native-elements';
import SideMenuHeader from './SideMenuHeader';

import { NavigationActions } from 'react-navigation';
import { colors } from '../common/theme';
import * as firebase from 'firebase'
import  languageJSON  from '../common/language';

var { height, width } = Dimensions.get('window');

export default class SideMenu extends React.Component{
    constructor(props){
        super(props);
        
        this.state = {
            heightIphoneSix : false,
            heightIphoneFive: false,
            heightIphoneX :false,
            heightIphoneXsMax :false,
            sideMenuList: [
                {key: 1, name: languageJSON.booking_request, navigationName: 'DriverTripAccept', icon: 'map-pin', type: 'feather', child: 'firstChild'},
                {key: 2, name: languageJSON.profile_settings, navigationName: 'Profile', icon: 'user', type: 'feather', child: 'secondChild'},
                {key: 4, name: languageJSON.incomeText, navigationName: 'MyEarning', icon: 'dollar-sign', type: 'feather', child: 'ninethChild'},
                {key: 3, name: languageJSON.my_bookings, navigationName: 'RideList', icon: 'clipboard', type: 'feather', child: 'thirdChild'},
                {key: 9, name: languageJSON.about_us, navigationName: 'About', icon: 'headphones', type: 'feather', child: 'ninethChild'},
                {key: 10, name: languageJSON.sign_out, icon: 'ios-log-out', type: 'ionicon', child: 'lastChild'}
            ],
            profile_image:null,
            myBookingarr: []
        }
        
    }

    componentDidMount(){
        this.heightReponsive();
        var curuser = firebase.auth().currentUser.uid;
        const userData=firebase.database().ref('users/'+curuser);
        userData.on('value',currentUserData=>{
            if(currentUserData.val()){
                this.setState(currentUserData.val(),(res)=>{
                    if(currentUserData.val().driverActiveStatus == undefined){
                        userData.update({
                            driverActiveStatus:true
                        })
                    }
                    if(currentUserData.val().ratings) {
                        let ratings = currentUserData.val().ratings.userrating
                        this.setState({rating: ratings })
                    }
                    /*if(currentUserData.val().waiting_riders_list){
                        if(this.props.navigation.state.routeName != 'DriverTripAccept'){
                            this.props.navigation.navigate('DriverTripAccept')
                        }
                    }*/
                });    
            }
        })
        let ref = firebase.database().ref('users/' + curuser + '/ganhos');
        ref.on('value', allBookings => {
            if (allBookings.val()) {
                let data = allBookings.val();
                var myBookingarr = [];
                for (let k in data) {
                    data[k].bookingKey = k
                    myBookingarr.push(data[k])
                }

                if (myBookingarr) {
                    this.setState({ myBooking: myBookingarr.length }, () => {
                    })

                }
            }
        })
    }

    //check for device height(specially iPhones)
    heightReponsive(){
        if(height == 667 && width == 375){
            this.setState({heightIphoneSix :true})
        }
        else if(height == 568 && width == 320) {
            this.setState({heightIphoneFive :true})
        }
        else if(height == 375 && width == 812) {
            this.setState({heightIphoneX :true})
        }
        else if(height == 414 && width == 896) {
            this.setState({heightIphoneXsMax :true})
        }
    }

    //navigation to screens from side menu
    navigateToScreen = (route) => () => {
        const checkRide=firebase.database().ref('users/'+ firebase.auth().currentUser.uid  + '/emCorrida');
        checkRide.once('value',checkRider=>{
            if(!checkRider.val()){
                const navigateAction = NavigationActions.navigate({
                  routeName: route
                });
                this.props.navigation.dispatch(navigateAction);
            } else {
                alert('Você possuí uma corrida em andamento')
            }
        })
    }

    //sign out and clear all async storage
    async signOut() {
        firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/pushToken').remove();
        firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/userPlatform').remove();
        AsyncStorage.clear();
        firebase.auth().signOut();
    }

    render(){
        return(
            <View style={styles.mainViewStyle}>
                <SideMenuHeader onPress={this.navigateToScreen("Profile") } headerStyle={styles.myHeader} userPhoto={this.state.profile_image} userCorridas={this.state.myBooking} userRating={this.state.rating} userName ={this.state.firstName + ' '+ this.state.lastName}></SideMenuHeader> 
                
                <View style={styles.compViewStyle}>
                    <View style={[styles.vertialLine,{height: (width <= 320) ? width/1.53 : width/1.68 }]}></View>
                    <FlatList
                        data={this.state.sideMenuList}     
                        keyExtractor={(item,index) => index.toString()}   
                        style={{ marginTop: 20}}   
                        bounces = {false}
                        renderItem={({item, index}) => 
                            <TouchableOpacity
                            onPress={
                                (item.name==languageJSON.sign_out)? ()=>this.signOut() : 
                                this.navigateToScreen(item.navigationName) 
                                }
                            style={
                                [styles.menuItemView, 
                                {marginTop:  (index == this.state.sideMenuList.length - 1)  ? width/7 : 0}
                                ]
                            }>
                                <View style={styles.viewIcon}>
                                    <Icon
                                        name={item.icon}
                                        type={item.type}
                                        color={colors.DEEPBLUE}
                                        size={25}
                                        containerStyle={styles.iconStyle}
                                    />
                                </View>
                                <Text style={styles.menuName}>{item.name}</Text>
                            </TouchableOpacity>
                    } />
                </View>
            </View>
        )
    }
}

//style for this component
const styles = StyleSheet.create({
    myHeader:{
        marginTop:0,   
    },
    vertialLine: {
        position: 'absolute',
        left: 25,
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
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor:colors.BLACK,
        shadowOffset:{width:0,height:3},
        shadowOpacity:0.3,
        elevation: 3,
        left: 1
    },
    menuName: {
        color: colors.BLACK,
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 12,
        width: "100%"
    },
    mainViewStyle:{
        backgroundColor: colors.WHITE,
        height: '100%',
    },
    compViewStyle:{
        position: 'relative',
        flex: 3
    },
    iconStyle:{ 
        justifyContent: 'center', 
        alignItems: 'center' 
    }
})