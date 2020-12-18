import React from 'react';
import { RideList } from '../components';
import { 
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
  } from 'react-native';
import { Icon } from 'react-native-elements';
import { colors } from '../common/theme';
import * as firebase from 'firebase';
import Constants from 'expo-constants';

export default class RideListPage extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            allBookings: []
        }
    }

    componentDidMount() {
        let userUid = firebase.auth().currentUser.uid;
        let dbRef = firebase.database().ref('users/' + userUid + '/my_bookings');
        dbRef.on('value',(snap)=>{
            var allBookings = []
            let bookings = snap.val();
            for(let key in bookings) {
                bookings[key].bookingUid = key;
                allBookings.push(bookings[key]);
            }
            this.setState({
                allBookings: allBookings.reverse()
            })
        })
    }

    //go to ride details page
    goDetails(item, index){
        if(item && item.pagamento.trip_cost >0){
            item.roundoffCost = Math.round(item.trip_cost).toFixed(2);
            item.roundoff = (Math.round(item.roundoffCost)-item.pagamento.trip_cost).toFixed(2)
            this.props.navigation.replace('RideDetails',{data:item});
        
        }else{
            item.roundoffCost = Math.round(item.pagamento.estimate).toFixed(2);
            item.roundoff = (Math.round(item.roundoffCost)-item.pagamento.estimate).toFixed(2)
            this.props.navigation.replace('RideDetails',{data:item});
        }
        
    }


    render() {
        return (
            <View style={styles.mainView}>
                <View style={styles.header}>
                    <Text style={{fontSize: 20, fontFamily: 'Inter-Bold', color: colors.BLACK, textAlign: 'center'}}>Histórico de corridas</Text>
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
                <RideList data={this.state.allBookings} onPressButton={(item, index) => {this.goDetails(item, index)}}></RideList>
            </View>
            );
        }
}

//Screen Styling
const styles = StyleSheet.create({
    headerStyle: { 
        backgroundColor: colors.WHITE, 
        borderBottomWidth: 0 
    },
    header: {
        backgroundColor: colors.WHITE,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 25,
        marginTop: Constants.statusBarHeight + 3
    },

    headerTitleStyle: { 
        color: colors.BLACK,
        fontFamily:'Inter-Bold',
        fontSize: 20
    },
    containerView:{ flex:1 },
    textContainer:{textAlign:"center", backgroundColor: colors.TRANSPARENT},
    mainView:{ 
        flex:1, 
        backgroundColor: colors.WHITE, 
        //marginTop: StatusBar.currentHeight 
    } 
});
