import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    Platform,
    Image,
    Modal,
    Dimensions,
    TextInput,
    AsyncStorage,
    KeyboardAvoidingView,
} from 'react-native';
import { Button, } from 'react-native-elements';
import StarRating from 'react-native-star-rating';
import { colors } from '../common/theme';
var { width } = Dimensions.get('window');
import * as firebase from 'firebase';
import { RequestPushMsg } from '../common/RequestPushMsg';
import languageJSON from '../common/language';
import { NavigationActions, StackActions } from 'react-navigation';

import CircleLineTriangle from '../../assets/svg/CircleLineTriangle';
import Verified from '../../assets/svg/Verified';
import AvatarUser from '../../assets/svg/AvatarUser';
import { ScrollView } from 'react-native-gesture-handler';
import { ActivityIndicator } from 'react-native';

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
            },
            btnSubmit: false,
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
            this.setState({
                getDetails: pdata,
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
        this.setState({ btnSubmit: true })

        let path = firebase.database().ref('users/' + this.state.getDetails.driver);

        path.once('value', snapVal => {
            const data = snapVal.val()
            let ratings = 0
            var total = 0;
            var count = 0;
            let fRating = 0;

            if (data.ratings) {
                ratings = data.ratings.details;

                for (let key in ratings) {
                    count = count + 1;
                    total = total + ratings[key].rate;
                }
                if (count < 50) {
                    fRating = 5.00
                } else {
                    fRating = total / count;
                }
            }
            else {
                fRating = 5.00
            }

            if (fRating) {
                firebase.database().ref('users/' + this.state.getDetails.driver + '/ratings/details').push({
                    user: firebase.auth().currentUser.uid,
                    rate: this.state.starCount > 0 ? this.state.starCount : 5
                }).then(() => {
                    firebase.database().ref('users/' + this.state.getDetails.driver + '/ratings/').update({ userrating: parseFloat(fRating).toFixed(2) }).
                        then(() => {
                            firebase.database().ref('users/' + this.state.getDetails.driver + '/my_bookings/' + this.state.getDetails.bookingKey + '/').update({
                                commentRider: this.state.commentRider ? this.state.commentRider : null,
                                rating: this.state.starCount > 0 ? this.state.starCount : 5,
                            }).then(() => {
                                firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/my-booking/' + this.state.getDetails.bookingKey + '/').update({
                                    commentRider: this.state.commentRider ? this.state.commentRider : null,
                                    rated_by_rider: true,
                                }).then(() => {
                                    firebase.database().ref('bookings/' + this.state.getDetails.bookingKey + '/').update({
                                        commentRider: this.state.commentRider ? this.state.commentRider : null,
                                    })
                                }).then(() => {
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
                                })
                            })
                        })
                })
            }
        })
    }

    render() {
        return (
            <ScrollView style={{ backgroundColor: colors.WHITE }}>
                <KeyboardAvoidingView behavior={Platform.OS == 'ios' ? 'position' : 'height'}>
                    <View style={styles.mainViewStyle}>
                        <View style={{ justifyContent: 'center', alignItems: 'center', marginTop: 65 }}>
                            <Verified width={100} height={100} />
                            <Text style={{ marginTop: 15, marginBottom: 15, fontFamily: 'Inter-Bold', fontSize: 16 }}> Sua corrida terminou! </Text>
                        </View>
                        <View style={styles.addressViewStyle}>
                            <View style={{ flexDirection: 'column', alignItems: 'center' }}>
                                <Text style={{ fontSize: 13 }}> {this.state.getDetails ?
                                    this.state.getDetails.trip_start_time[0] + this.state.getDetails.trip_start_time[1] + ':' +
                                    this.state.getDetails.trip_start_time[3] + this.state.getDetails.trip_start_time[4]
                                    : null} </Text>
                                <CircleLineTriangle style={{ marginLeft: 25 }} />
                                <Text style={{ fontSize: 13 }} > {this.state.getDetails ?
                                    this.state.getDetails.trip_end_time[0] + this.state.getDetails.trip_end_time[1] + ':' +
                                    this.state.getDetails.trip_end_time[3] + this.state.getDetails.trip_end_time[4]
                                    : null} </Text>
                            </View>

                            {
                                this.state.getDetails ?
                                    this.state.getDetails.waypoint ?
                                        <View>
                                            <Text style={{ fontFamily: 'Inter-Bold' }}>{this.state.getDetails.pickup.add.split(',')[0] + ', ' + this.state.getDetails.pickup.add.split(',')[1]}</Text>
                                            <Text style={{ fontFamily: 'Inter-Bold', marginVertical: 10 }}>{this.state.getDetails.waypoint.add.split(',')[0]}</Text>
                                            <Text style={{ fontFamily: 'Inter-Bold' }}>{this.state.getDetails.drop.add.split(',')[0] + ', ' + this.state.getDetails.drop.add.split(',')[1]}</Text>
                                        </View>
                                        :
                                        <View>
                                            <Text style={{ fontFamily: 'Inter-Bold' }}>{this.state.getDetails.pickup.add.split(',')[0] + ', ' + this.state.getDetails.pickup.add.split(',')[1]}</Text>
                                            <Text style={{ fontFamily: 'Inter-Bold' }}>{this.state.getDetails.drop.add.split(',')[0] + ', ' + this.state.getDetails.dropdrop.add.split(',')[1]}</Text>
                                        </View>
                                    :
                                    null
                            }
                        </View>

                        <View style={styles.rateViewStyle}>
                            <Text style={styles.paymentMode}> {this.state.getDetails ? this.state.getDetails.pagamento.payment_mode : null} </Text>
                            <Text style={styles.rateViewTextStyle}>{this.state.settings.symbol}{this.state.getDetails ? this.state.getDetails.pagamento.customer_paid > 0 ? parseFloat(this.state.getDetails.pagamento.customer_paid).toFixed(2) : 0 : null}</Text>
                        </View>

                        <View style={styles.tripMainView}>
                            <View style={{ flex: 3, justifyContent: 'center', alignItems: "center" }}>

                                <View style={styles.tripSummaryStyle}>
                                    <Text style={styles.summaryText}>{languageJSON.rate_ride} </Text>
                                </View>

                                <View style={{ marginBottom: 20, justifyContent: 'center', alignItems: "center" }}>
                                    {this.state.getDetails ?
                                        this.state.getDetails.driver_image != '' ?
                                            <Image source={{ uri: this.state.getDetails.driver_image }} style={{ height: 68, width: 68, borderRadius: 78 / 2 }} />
                                            :
                                            <AvatarUser
                                                width={68}
                                                height={68}
                                            />
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
                                    halfStarColor={colors.YELLOW.primary}
                                    emptyStarColor={colors.GREY1}
                                    rating={this.state.starCount}
                                    selectedStar={(rating) => this.onStarRatingPress(rating)}
                                    buttonStyle={{ padding: 10 }}
                                    containerStyle={styles.contStyle}
                                />
                            </View>
                        </View>
                        <View style={styles.viewInput}>
                            <TextInput
                                ref={(ref) => this.refInput = ref}
                                style={{ paddingHorizontal: 10, borderWidth: 1, borderColor: colors.DEEPBLUE, borderRadius: 10, width: width - 60, height: 100, textAlignVertical: 'top', fontSize: 16, color: colors.BLACK, fontFamily: 'Inter-Regular' }}
                                maxLength={150}
                                placeholder="Deixe um comentário sobre sua corrida"
                                onChangeText={(text) => this.setState({ commentRider: text })}
                                editable={!this.state.btnSubmit}
                                multiline={true}
                                numberOfLines={6}
                            />
                        </View>

                        <View style={[styles.confBtnStyle, {
                            shadowOpacity: this.state.btnSubmit ? 0 : 0.2,
                        }]}>
                            <Button
                                title={!this.state.btnSubmit ? "Confirmar" : <ActivityIndicator color={colors.WHITE} />}
                                titleStyle={{ fontSize: 20, fontFamily: 'Inter-Bold', }}
                                onPress={() => this.submitNow()}
                                buttonStyle={styles.myButtonStyle}
                                disabled={this.state.btnSubmit}
                            />
                        </View>
                    </View>
                </KeyboardAvoidingView>

            </ScrollView>
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
    rateViewStyle: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.GREY.background,
        borderColor: colors.GREY1,
        borderRadius: 10,
        height: 50,
        marginHorizontal: 15,
        marginTop: 10,
        marginBottom: 10,
    },
    paymentMode: {
        color: colors.BLACK,
        fontFamily: 'Inter-Medium',
        fontSize: width < 375 ? 16 : 19,
        position: 'absolute',
        left: 15,
    },
    rateViewTextStyle: {
        fontSize: 25,
        color: colors.BLACK,
        fontFamily: 'Inter-Bold',
        fontWeight: 'bold',
        position: 'absolute',
        right: 20,
        marginRight: 10
    },
    addressViewStyle: {
        height: 130,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 15,
        marginRight: 15,
        borderWidth: 1,
        borderColor: colors.GREY2,
        borderRadius: 10,
    },
    addressViewTextStyle: {
        color: colors.BLACK,
        fontSize: 15,
        fontFamily: 'Inter-Medium',
        marginRight: 15,
        marginTop: 15
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
        marginTop: 10,
        marginLeft: 10,
        marginRight: 10,
    },
    tripMainView: {
        flex: 6,
        flexDirection: "column",
        justifyContent: "center",
        marginTop: 10,
    },
    ratingViewStyle: {
        flex: 1.8,
        flexDirection: "row",
        justifyContent: "center",
        marginTop: 10
    },
    tripSummaryStyle: {
        flexDirection: "row",
        justifyContent: 'center',
        marginBottom: 10
    },
    confBtnStyle: {
        flex: 2,
        justifyContent: "flex-end",
        marginBottom: '10%',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowOffset: { x: 0, y: 0 },
        shadowRadius: 15,
    },
    viewInput: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 2
    },
    myButtonStyle: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.DEEPBLUE,
        width: 300,
        padding: 10,
        borderRadius: 50,
        height: 50,
        marginTop: 25,
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
        backgroundColor: colors.GREY.background
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