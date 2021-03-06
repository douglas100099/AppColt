import { createStackNavigator } from 'react-navigation-stack';
import { createDrawerNavigator} from 'react-navigation-drawer';
import {
    DriverTripCompleteSreen, 
    ProfileScreen, 
    TaskListIgnorePopup,
    RideListPage, 
    DriverStartTrip,
    DriverCompleteTrip,
    RideDetails,
    DriverTripAccept,
    DriverRegistrationPage,
    EditProfilePage,
    CancelBooking,
    AboutPage,
    OnlineChat,
    DriverIncomePage,
    EmailLoginScreen,
    MobileLoginScreen,
    ScreenWelcome,
    WaitingDocs,
    Reports,
    IntroScreen
} from '../screens';
import SideMenu from '../components/SideMenu';
import  { ColorPropType, Dimensions } from 'react-native';
var { width, height } = Dimensions.get('window');

//app stack for user end
    export const AppStack = {
        DriverFare: {
            screen: DriverTripCompleteSreen,
            navigationOptions:{
                headerShown: false,
                headerLeft: null, 
                gestureEnabled: false,
            }
        },
        TaskListIgnorePopUp: {
            screen: TaskListIgnorePopup            
        },
        RideList:{
            screen: RideListPage,
            navigationOptions:{
                headerShown: false,
            }
            
        },
        Profile: {
            screen: ProfileScreen,
            navigationOptions:{
                headerShown: false,
            }
        },
        MyEarning: {
            screen: DriverIncomePage,
            navigationOptions:{
                headerShown: false,
            }
        },
        DriverTripAccept: {
            screen: DriverTripAccept,
            navigationOptions:{
                headerShown: false,
                gestureEnabled: false,
            }
        },
        RideDetails: {
            screen: RideDetails,
            navigationOptions: {
                headerShown: false,
            }
        },
        DriverTripStart: {
            screen:  DriverStartTrip,
            navigationOptions:{
                headerShown: false,
                headerLeft: null,
            }
        },
        Chat:{
            screen:OnlineChat,
        },
        DriverTripComplete: {
            screen:  DriverCompleteTrip,
            navigationOptions:{
                headerShown: false,
                headerLeft: null, 
                gestureEnabled: false,
            }
        },
        editUser:{
            screen: EditProfilePage,
            navigationOptions:{
                headerShown: false,
            } 
        },
        BookingCancel: {
            screen: CancelBooking,
            navigationOptions:{
                headerShown: false,
                headerLeft: null,
                gestureEnabled: false,
            }
        },
        About: {
            screen: AboutPage,
            navigationOptions:{
                headerShown: false,
            }
        },
        Reports: {
            screen: Reports,
            navigationOptions:{
                headerShown: false,
            }
        },
        Waiting:{
            screen: WaitingDocs,
            navigationOptions:{
                headerShown: false,
            },
            defaultNavigationOptions: {
                gestureEnabled: false,
            }
        },
    }

    //authentication stack for user before login
    export const AuthStack = createStackNavigator({
        MobileLogin: {
            screen: MobileLoginScreen,
            navigationOptions:{
                headerShown: false,
            }
        },
        Intro: {
            screen: IntroScreen,
            navigationOptions:{
                headerShown: false,
            }
        },
        DriverReg: {
            screen:  DriverRegistrationPage,
            navigationOptions:{
                headerShown: false,
            }
        },
        EmailLogin: {
            screen: EmailLoginScreen,
            navigationOptions:{
                headerShown: false,
            }
        },
        Welcome:{
            screen: ScreenWelcome,
            navigationOptions:{
                headerShown: false,
            }
        },
    },{
        initialRouteName: 'Intro',
    });

    const DrawerRoutes = {
        'RideList': {
            name: 'RideList',
            screen: createStackNavigator(AppStack, { initialRouteName: 'RideList',headerMode: 'none' }),

        },
        'Profile': {
            name: 'Profile',
            screen: createStackNavigator(AppStack, { initialRouteName: 'Profile', headerMode: 'none' })
        },
        'DriverTripAccept': {
            name: 'DriverTripAccept',
            screen: createStackNavigator(AppStack, { initialRouteName: 'DriverTripAccept',headerMode: 'none'}),
        },
        'About': {
            name: 'About',
            screen: createStackNavigator(AppStack, { initialRouteName: 'About',headerMode: 'none',})
        },
        'MyEarning': {
            name: 'MyEarning',
            screen: createStackNavigator(AppStack, { initialRouteName: 'MyEarning', headerMode: 'none' })
        },
    };


    export const DriverRootNavigator = createDrawerNavigator(
        DrawerRoutes,
        {
        drawerWidth: width/1.53,
        initialRouteName:'DriverTripAccept',
        contentComponent: SideMenu,
        drawerType: 'slide',
    });
