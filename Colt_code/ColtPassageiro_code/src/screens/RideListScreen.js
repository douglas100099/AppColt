import React from 'react';
import { RideList } from '../components';
import {
    StyleSheet,
    View,
    Dimensions,
    Text,
    Platform,
} from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Icon } from 'react-native-elements';
import BtnVoltar from '../components/BtnVoltar';
import { colors } from '../common/theme';
import * as firebase from 'firebase';
import languageJSON from '../common/language';
var { width, height } = Dimensions.get('window');
import dateStyle from '../common/dateStyle';

export default class RideListPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentUser: firebase.auth().currentUser,
        }
    }

    componentDidMount() {
        this.getMyRides();
    }

    //Go to ride details page
    goDetails(item, index) {
        this.setState({ openRide: true })
        if (item && item.trip_cost > 0) {
            item.roundoffCost = Math.round(item.trip_cost).toFixed(2);
            item.roundoff = (Math.round(item.roundoffCost) - item.trip_cost).toFixed(2);
            this.props.navigation.push('RideDetails', { data: item });
        } else {
            item.roundoffCost = Math.round(item.estimate).toFixed(2);
            item.roundoff = (Math.round(item.roundoffCost) - item.estimate).toFixed(2);
            this.props.navigation.push('RideDetails', { data: item });
        }
    }

    //Fetching My Rides
    getMyRides() {
        const ridesListPath = firebase.database().ref('/users/' + this.state.currentUser.uid + '/my-booking/')
        ridesListPath.on('value', myRidesData => {
            if (myRidesData.val()) {
                var ridesOBJ = myRidesData.val()
                var allRides = []
                for (let key in ridesOBJ) {
                    ridesOBJ[key].bookingId = key
                    var Bdate = new Date(ridesOBJ[key].tripdate)
                    ridesOBJ[key].bookingDate = Bdate.toLocaleString(dateStyle)
                    if (ridesOBJ[key].status != "NEW") {
                        allRides.push(ridesOBJ[key])
                    }
                }
                if (allRides) {
                    this.setState({
                        myrides: allRides.reverse()
                    })
                }
            }
        })
    }

    goBack = () => {
        this.props.navigation.goBack()
    }

    render() {
        return (
            <View style={styles.mainView}>
                <View style={styles.viewHeader}>
                    <View style={styles.viewTop}>
                        <BtnVoltar style={{ backgroundColor: colors.WHITE, position: 'absolute', left: 0, marginLeft: 10, marginBottom: 5 }} btnClick={this.goBack} />
                        <Text style={{ fontFamily: 'Inter-Bold', fontSize: width < 375 ? 18 : 20 }}> Minhas corridas </Text>
                    </View>
                </View>

                <RideList onPressButton={(item, index) => { this.goDetails(item, index) }} data={this.state.myrides}></RideList>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    mainView: {
        flex: 1,
    },
    viewHeader: {
        backgroundColor: colors.WHITE,
        flex: 1,
    },
    viewTop: {
        justifyContent: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 10,
        marginTop: Platform.OS == 'ios' ? 60 : 40,
    },
    btnVoltar: {
        backgroundColor: colors.WHITE,
        width: 40,
        height: 40,

        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { x: 0, y: 5 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
    }
});
