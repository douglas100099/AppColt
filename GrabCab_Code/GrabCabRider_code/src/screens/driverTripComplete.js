import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    TouchableWithoutFeedback,
    Platform,
    Image,
    Modal,
    Dimensions,
    AsyncStorage,
    TextComponent
} from 'react-native';
import { Divider, Button, Header } from 'react-native-elements';
import StarRating from 'react-native-star-rating';
import { colors } from '../common/theme';
var { width } = Dimensions.get('window');
import * as firebase from 'firebase';
import { RequestPushMsg } from '../common/RequestPushMsg';
import languageJSON from '../common/language';
import dateStyle from '../common/dateStyle';
import { NavigationActions, StackActions } from 'react-navigation';

export default class DriverTripComplete extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            starCount: 0,
            title: '',
            alertModalVisible: false,
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
            console.log("Asyncstorage issue 7");
        }
    };

    componentDidMount() {
        var pdata = this.props.navigation.getParam('data');
        if (pdata) {
            address = [{
                key: 'pickup',
                place: pdata.pickup.add,
                type: 'pickup'
            }, {
                key: 'drop',
                place: pdata.drop.add,
                type: 'drop'
            }]
            this.setState({
                getDetails: pdata,
                pickAndDrop: address
            }, () => {

            })
        }
        this._retrieveSettings();
    }


    //rating
    onStarRatingPress(rating) {
        this.setState({
            starCount: rating
        })
    }

    submitNow() {
        firebase.database().ref('users/' + this.state.getDetails.driver + '/ratings/details').push({
            user: firebase.auth().currentUser.uid,
            rate: this.state.starCount > 0 ? this.state.starCount : 5
        }).then((res) => {
            let path = firebase.database().ref('users/' + this.state.getDetails.driver + '/ratings/');
            path.once('value', snapVal => {
                if (snapVal.val()) {
                    // rating calculation
                    let ratings = snapVal.val().details;
                    var total = 0;
                    var count = 0;
                    for (let key in ratings) {
                        count = count + 1;
                        total = total + ratings[key].rate;
                    }
                    let fRating = total / count;
                    if (fRating) {
                        //avarage Rating submission
                        firebase.database().ref('users/' + this.state.getDetails.driver + '/ratings/').update({ userrating: parseFloat(fRating).toFixed(1) }).then(() => {
                            this.setState({ alertModalVisible: true });
                            //Rating for perticular booking 
                            firebase.database().ref('users/' + this.state.getDetails.driver + '/my_bookings/' + this.state.getDetails.bookingKey + '/').update({
                                rating: this.state.starCount > 0 ? this.state.starCount : 5,
                            }).then(() => {
                                firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/my-booking/' + this.state.getDetails.bookingKey + '/').update({
                                    skip: true,
                                    rating_queue: false
                                })
                            });
                        })
                    }
                }
            })
        })
    }

    sendPushNotification(customerUID, bookingId, msg) {
        const customerRoot = firebase.database().ref('users/' + customerUID);
        customerRoot.once('value', customerData => {
            if (customerData.val()) {
                let allData = customerData.val()
                RequestPushMsg(allData.pushToken ? allData.pushToken : null, msg)
            }
        })
    }

    alertModal() {
        return (
            <Modal
                animationType="none"
                transparent={true}
                visible={this.state.alertModalVisible}
                onRequestClose={() => {
                    this.setState({ alertModalVisible: false })
                }}>
                <View style={styles.alertModalContainer}>
                    <View style={styles.alertModalInnerContainer}>

                        <View style={styles.alertContainer}>

                            <Text style={styles.rideCancelText}>{languageJSON.no_driver_found_alert_title}</Text>

                            <View style={styles.horizontalLLine} />

                            <View style={styles.msgContainer}>
                                <Text style={styles.cancelMsgText}>{languageJSON.thanks}</Text>
                            </View>
                            <View style={styles.okButtonContainer}>
                                <Button
                                    title={languageJSON.no_driver_found_alert_OK_button}
                                    titleStyle={styles.signInTextStyle}
                                    onPress={() => {
                                        this.setState({ alertModalVisible: false, currentBookingId: null },
                                            () => {
                                                this.props
                                                    .navigation
                                                    .dispatch(StackActions.reset({
                                                        index: 0,
                                                        actions: [
                                                            NavigationActions.navigate({
                                                                routeName: 'Map',
                                                            }),
                                                        ],
                                                    }))
                                            })
                                    }}
                                    buttonStyle={styles.okButtonStyle}
                                    containerStyle={styles.okButtonContainerStyle}
                                />
                            </View>

                        </View>

                    </View>
                </View>

            </Modal>
        )
    }

    render() {
        return (
            <View style={styles.mainViewStyle}>
                <View style={styles.dateViewStyle}>
                    <Text style={styles.dateViewTextStyle}>{this.state.getDetails && this.state.getDetails.tripdate ? new Date(this.state.getDetails.tripdate).toLocaleString(dateStyle) : null}</Text>
                </View>
            
                <View style={styles.addressViewStyle}>
                    <FlatList
                        data={this.state.pickAndDrop}
                        keyExtractor={(item) => item.key}
                        renderItem={({ item }) =>
                            <View style={styles.pickUpStyle}>
                                {item.type == "pickup" ?
                                    <View style={styles.greenDot}></View>
                                    : <View style={styles.redDot}></View>
                                }
                                <Text style={styles.addressViewTextStyle}>{item.place}</Text>
                            </View>
                        }
                    />
                </View>
                        
                <View style={styles.rateViewStyle}>
                    <Text> {this.state.getDetails.payment_mode ? this.state.getDetails.payment_mode : null} </Text>
                    <Text style={styles.rateViewTextStyle}>{this.state.settings.symbol}{this.state.getDetails ? this.state.getDetails.cashPaymentAmount > 0 ? this.state.getDetails.cashPaymentAmount : 0 : null}</Text>
                </View>

                <View style={styles.tripMainView}>
                    <View style={{ flex: 3.2, justifyContent: 'center', alignItems: "center" }}>

                        <View style={styles.tripSummaryStyle}>
                            <Text style={styles.summaryText}>{languageJSON.rate_ride} </Text>
                        </View>

                        <View style={{ flex: 3, justifyContent: 'center', alignItems: "center" }}>
                            {this.state.getDetails ?
                                this.state.getDetails.driver_image != '' ? <Image source={{ uri: this.state.getDetails.driver_image }} style={{ height: 78, width: 78, borderRadius: 78 / 2 }} /> :
                                    <Image source={require('../../assets/images/profilePic.png')} style={{ height: 78, width: 78, borderRadius: 78 / 2 }} />
                                : null}
                        </View>
                        <View style={styles.tripSummaryStyle}>
                            <Text style={styles.Drivername}>{this.state.getDetails ? this.state.getDetails.driver_name : null}</Text>
                        </View>
                    </View>
                    <View style={styles.ratingViewStyle}>
                        <StarRating
                            disabled={false}
                            maxStars={5}
                            starSize={40}
                            fullStar={'ios-star'}
                            halfStar={'ios-star-half'}
                            emptyStar={'ios-star'}
                            iconSet={'Ionicons'}
                            fullStarColor={colors.DEEPBLUE}
                            emptyStarColor={colors.GREY1}
                            halfStarColor={colors.YELLOW.primary}
                            rating={this.state.starCount}
                            selectedStar={(rating) => this.onStarRatingPress(rating)}
                            buttonStyle={{ padding: 10 }}
                            containerStyle={styles.contStyle}
                        />
                    </View>
                </View>

                <View style={styles.confBtnStyle}>
                    <Button
                        title={"Confirmar"}
                        titleStyle={{ fontFamily: 'Inter-Bold', }}
                        onPress={() => this.submitNow()}
                        buttonStyle={styles.myButtonStyle}
                    //disabled={this.state.starCount > 0 ? false : true}
                    />
                </View>
                {
                    this.alertModal()
                }
            </View>
        )
    }
}
const styles = StyleSheet.create({
    headerStyle: {
        backgroundColor: colors.GREY.default,
        borderBottomWidth: 0
    },
    headerInnerStyle: {
        marginLeft: 10,
        marginRight: 10
    },
    headerTitleStyle: {
        color: colors.WHITE,
        fontFamily: 'Roboto-Bold',
        fontSize: 20
    },
    headerskip: {
        color: colors.WHITE,
        fontFamily: 'Roboto-Regular',
        fontSize: 16
    },
    dateViewStyle: {
        justifyContent: "center",
        flex: 1,
        marginTop: 20
    },
    dateViewTextStyle: {
        fontFamily: 'Roboto-Regular',
        color: colors.GREY.btnPrimary,
        fontSize: 26,
        textAlign: "center"
    },
    rateViewStyle: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.GREY1,
        borderRadius: 15,
        height: 75,
        marginHorizontal: 15,
        marginTop: 10,
        marginBottom: 10,
    },
    rateViewTextStyle: {
        fontSize: 25,
        color: colors.BLACK,
        fontFamily: 'Inter-Bold',
        fontWeight: 'bold',
        position: 'absolute',
        right: 0,
        marginRight: 10
    },
    addressViewStyle: {
        flex: 2,
        flexDirection: 'row',
        paddingTop: 22,
        paddingLeft: 15,
        paddingRight: 15,
        borderWidth: 2,
        borderColor: colors.BLACK,
        borderRadius: 10,
        
    },
    addressViewTextStyle: {
        color: colors.BLACK,
        fontSize: 16,
        fontFamily: 'Inter-Bold',
        marginLeft: 15,
        marginRight: 15,
        //marginTop: 15,
        lineHeight: 0, 
    },
    greenDot: {
        backgroundColor: colors.BLACK,
        width: 12,
        height: 12,
        borderRadius: 50
    },
    redDot: {
        backgroundColor: colors.DEEPBLUE,
        width: 12,
        height: 12,
        borderRadius: 50
    },
    divider: {
        backgroundColor: colors.GREY.secondary,
        width: '20%',
        height: 1,
        top: '2.7%'
    },
    summaryText: {
        color: colors.GREY.btnPrimary,
        fontSize: 18,
        textAlign: "center",
        fontFamily: 'Roboto-Regular',
    },
    Drivername: {
        color: colors.BLACK,
        fontSize: 22,
        textAlign: "center",
        fontFamily: 'Inter-Bold',
    },
    mainViewStyle: {
        flex: 1,
        backgroundColor: colors.WHITE,
        flexDirection: 'column',
    },
    pickUpStyle: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 15,
        marginLeft: 10,
        marginRight: 10,
    },
    tripMainView: {
        flex: 6,
        flexDirection: "column",
        justifyContent: "center",
    },
    ratingViewStyle: {
        flex: 1.8,
        flexDirection: "row",
        justifyContent: "center"
    },
    tripSummaryStyle: {
        flex: 1,
        flexDirection: "row",
        justifyContent: 'center',
    },
    confBtnStyle: {
        flex: 2,
        justifyContent: "flex-end",
        marginBottom: '10%',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowOffset: { x: 0, y: 0 },
        shadowRadius: 15,
    },
    myButtonStyle: {
        backgroundColor: colors.DEEPBLUE,
        width: 300,
        padding: 10,
        borderRadius: 20,
    },
    contStyle: {
        marginTop: 0,
        paddingBottom: Platform.OS == 'android' ? 5 : 0
    },
    summaryStyle: {
        justifyContent: "flex-end"
    },
    dividerStyle: {
        justifyContent: "flex-start"
    },
    //alert modal
    alertModalContainer: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor:
            colors.GREY.background
    },
    alertModalInnerContainer: {
        height: 200,
        width: (width * 0.85),
        backgroundColor: colors.WHITE,
        alignItems: 'center',
        alignSelf: 'center',
        borderRadius: 7
    },
    alertContainer: {
        flex: 2,
        justifyContent: 'space-between',
        width: (width - 100)
    },
    rideCancelText: {
        flex: 1,
        top: 15,
        color: colors.BLACK,
        fontFamily: 'Roboto-Bold',
        fontSize: 20,
        alignSelf: 'center'
    },
    horizontalLLine: {
        width: (width - 110),
        height: 0.5,
        backgroundColor:
            colors.BLACK,
        alignSelf: 'center',
    },
    msgContainer: {
        flex: 2.5,
        alignItems: 'center',
        justifyContent: 'center'
    },
    cancelMsgText: {
        color: colors.BLACK,
        fontFamily: 'Roboto-Regular',
        fontSize: 15,
        alignSelf: 'center',
        textAlign: 'center'
    },
    okButtonContainer: {
        flex: 1,
        width: (width * 0.85),
        flexDirection: 'row',
        backgroundColor: colors.GREY.iconSecondary,
        alignSelf: 'center'
    },
    okButtonStyle: {
        flexDirection: 'row',
        backgroundColor: colors.GREY.iconSecondary,
        alignItems: 'center',
        justifyContent: 'center'
    },
    okButtonContainerStyle: {
        flex: 1,
        width: (width * 0.85),
        backgroundColor: colors.GREY.iconSecondary,
    },
});