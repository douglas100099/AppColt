import React from 'react';
import {
    StyleSheet,
    View,
    Image,
    Dimensions,
    Text,
    TouchableOpacity,
    ScrollView,
    TouchableWithoutFeedback,
    ActivityIndicator,
    Platform,
    Alert,
    Switch
} from 'react-native';
import { Icon, Header } from 'react-native-elements';
import { NavigationActions, StackActions } from 'react-navigation';
import ActionSheet, { ActionSheetCustom } from 'react-native-actionsheet';

import { colors } from '../common/theme';

import * as Permissions from 'expo-permissions';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo';
var { width, height } = Dimensions.get('window');

import * as firebase from 'firebase';
import languageJSON from '../common/language';
import { linear } from 'react-native/Libraries/Animated/src/Easing';

export default class ProfileScreen extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            firstName: '',
            lastName: '',
            carType: '',
            myBookingarr: [],
            profile_image: null,
            loader: false,
            checked: true,
            dataCriado: 0,
            mobile: '',
            email: '',
            vehicleModel: '',
            ratings: {
                userrating: '',
            },
            loaderBtn: false,
        }
    }

    async UNSAFE_componentWillMount() {
        var curuser = firebase.auth().currentUser;
        this.setState({ currentUser: curuser }, () => {
            const userData = firebase.database().ref('users/' + this.state.currentUser.uid);
            userData.once('value', userData => {
                if (userData.val() && userData.val().location && userData.val().location.add) {
                    var str = userData.val().location.add
                    if (userData.val().location.add)
                        var tempAdd = str.split(",")[0] + "," + str.split(",")[1] + ',' + str.split(",")[3] + ',' + str.split(",")[4];
                    this.setState({ tempAddress: tempAdd });
                    this.setState(userData.val(), (res) => {
                    });
                }

            })
        })
        this.prepareInfos()
    }

    prepareInfos() {
        //Verifica corridas
        let userUid = firebase.auth().currentUser.uid;
        let ref = firebase.database().ref('users/' + userUid + '/ganhos');
        ref.on('value', allBookings => {
            if (allBookings.val()) {
                let data = allBookings.val();
                var myBookingarr = [];
                for (let k in data) {
                    data[k].bookingKey = k
                    myBookingarr.push(data[k])
                }

                if (myBookingarr) {
                    this.setState({ myBooking: myBookingarr.reverse() }, () => {
                    })
                }
            }
        })
        let refC = firebase.database().ref('users/' + userUid + '/createdAt');
        refC.on('value', criadoEm => {
            let dataCriacao = criadoEm.val()
            if (dataCriacao) {
                const now = new Date(); // Data de hoje
                const past = new Date(dataCriacao); // Outra data no passado
                const meses = past.getMonth() - now.getMonth() + (12 * (past.getFullYear() - now.getFullYear()))
                if (meses) {
                    this.setState({
                        dataCriado: meses
                    })
                }
            }
        })
    }

    showActionSheet = () => {
        this.ActionSheet.show()
    }

    uploadImage() {
        return (
            <View>
                <ActionSheetCustom
                    ref={o => this.ActionSheet = o}
                    title={languageJSON.photo_upload_action_sheet_title}
                    options={[languageJSON.camera, languageJSON.galery, languageJSON.cancel]}
                    cancelButtonIndex={2}
                    destructiveButtonIndex={1}
                    onPress={(index) => {
                        if (index == 0) {
                            this._pickImage(ImagePicker.launchCameraAsync);
                        } else if (index == 1) {
                            this._pickImage(ImagePicker.launchImageLibraryAsync);
                        } else {
                            //console.log('actionsheet close')
                        }
                    }}
                />
            </View>
        )
    }



    _pickImage = async (res) => {
        var pickFrom = res;
        const { status } = await Permissions.askAsync(Permissions.CAMERA, Permissions.CAMERA_ROLL);
        if (status == 'granted') {
            this.setState({ loader: true })
            let result = await pickFrom({
                allowsEditing: true,
                aspect: [3, 3],
                base64: true
            });
            if (!result.cancelled) {
                let data = 'data:image/jpeg;base64,' + result.base64
                //console.log(result)
                this.uploadmultimedia(result.uri)
                this.setState({ profile_image: 'data:image/jpeg;base64,' + result.base64 }, () => {
                    this.setState({ loader: false })
                });
            }
            else {
                this.setState({ loader: false })
            }
        }
    };

    //upload picture function
    async uploadmultimedia(url) {
        // console.log(url)
        const blob = await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onload = function () {
                resolve(xhr.response); // when BlobModule finishes reading, resolve with the blob
            };
            xhr.onerror = function () {
                reject(new TypeError('Network request failed')); // error occurred, rejecting
            };
            xhr.responseType = 'blob'; // use BlobModule's UriHandler
            xhr.open('GET', url, true); // fetch the blob from uri in async mode
            xhr.send(null); // no initial data
        });
        console.log('After')
        var imageRef = firebase.storage().ref().child(`users/${this.state.currentUser.uid}`);
        return imageRef.put(blob).then(() => {
            blob.close()
            return imageRef.getDownloadURL()
        }).then((url) => {
            firebase.database().ref(`/users/` + this.state.currentUser.uid + '/').update({
                profile_image: url
            })
        })
    }

    editProfile = () => {
        this.setState({ loaderBtn: true })
        this.props.navigation.push('editUser');
    }


    loader() {
        return (
            <View style={[styles.loadingcontainer, styles.horizontal]}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        )
    }

    //sign out and clear all async storage
    async signOut() {
        firebase.auth().signOut();
    }

    //Delete current user
    async deleteAccount() {
        Alert.alert(
            languageJSON.confrim,
            languageJSON.delete_account_question,
            [
                {
                    text: languageJSON.cancel,
                    onPress: () => console.log('Cancel Pressed'),
                    style: 'cancel',
                },
                {
                    text: languageJSON.yes, onPress: () => {
                        var ref = firebase.database().ref('users/' + this.state.currentUser.uid + '/')
                        ref.remove().then(() => {
                            firebase.auth().signOut();
                            firebase.auth().currentUser.delete()
                        });
                    }
                },
            ],
            { cancelable: false },
        );
    }

    onChangeFunction(data) {
        if (data == true) {
            firebase.database().ref(`/users/` + this.state.currentUser.uid + '/').update({
                driverActiveStatus: false
            }).then(() => {
                this.setState({ driverActiveStatus: false });
            })
        } else if (data == false) {
            firebase.database().ref(`/users/` + this.state.currentUser.uid + '/').update({
                driverActiveStatus: true
            }).then(() => {
                this.setState({ driverActiveStatus: true });
            })
        }
    }

    resetarPilha() {
        this.setState({ loaderBtn: true })
        this.props
            .navigation
            .dispatch(StackActions.reset({
                index: 0,
                actions: [
                    NavigationActions.navigate({
                        routeName: 'DriverTripAccept',
                    }),
                ],
            }))
    }

    render() {
        let { image } = this.state;
        return (
            <View style={styles.mainView}>
                <View style={styles.header}>
                    <View style={{ position: 'absolute', marginTop: Platform.select({ ios: 55, android: 45 }), zIndex: 999, left: 20, }}>
                        <TouchableOpacity disabled={this.state.loaderBtn} onPress={() => { this.resetarPilha(); }}>
                            <Icon
                                name='ios-arrow-dropleft-circle'
                                size={35}
                                type='ionicon'
                                color={colors.WHITE}
                            />
                        </TouchableOpacity>
                    </View>
                    <View style={{ position: 'absolute', marginTop: Platform.select({ ios: 55, android: 45 }), zIndex: 999, right: 20, }}>
                        <TouchableOpacity 
                            disabled={this.state.loaderBtn}
                        >
                            <Icon
                                name='ios-create'
                                size={35}
                                type='ionicon'
                                color={colors.WHITE}
                            />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.headerBoddy}>
                        <View style={styles.cardDriver}>
                            <View style={styles.photoDriver}>
                                <Image source={this.state.profile_image ? { uri: this.state.profile_image } : require('../../assets/images/profilePic.png')} style={{ width: 98, height: 98, borderRadius: 100 }} />
                                <View style={styles.ratingDriver}>
                                    <Icon
                                        name='ios-star'
                                        size={12}
                                        type='ionicon'
                                        color={colors.BLACK}
                                    />
                                    <Text style={{ fontSize: 12, fontFamily: 'Inter-Bold', color: colors.BLACK }}>{this.state.ratings.userrating == 0 ? " 5.0" : this.state.ratings.userrating }</Text>
                                </View>
                            </View>
                            <View style={{ flex: 0.8, alignItems: 'center', justifyContent: 'flex-start' }}>
                                <Text style={{ fontSize: 20, fontFamily: 'Inter-Bold', color: colors.BLACK }}>{this.state.firstName + ' ' + this.state.lastName}</Text>
                                <View style={styles.cardClasse}>
                                    <Text style={{ fontSize: 13, fontFamily: 'Inter-Regular', color: colors.BLACK }}>{this.state.carType}</Text>
                                </View>
                            </View>
                            <View style={styles.detaisDriver}>
                                <View style={styles.viewCorridas}>
                                    <Text style={{ fontSize: 20, fontFamily: 'Inter-Bold', color: colors.BLACK }}>{this.state.myBooking  ? this.state.myBooking.length : '0'}</Text>
                                    <Text style={{ fontSize: 14, fontFamily: 'Inter-Regular', color: colors.BLACK }}>Total de corridas</Text>
                                </View>
                                <View style={{ width: 1, height: '50%', backgroundColor: colors.GREY1 }}></View>
                                <View style={styles.viewAnos}>
                                    <Text style={{ fontSize: 20, fontFamily: 'Inter-Bold', color: colors.BLACK }}>{this.state.dataCriado == 0 ? '1' : this.state.dataCriado}</Text>
                                    <Text style={{ fontSize: 14, fontFamily: 'Inter-Regular', color: colors.BLACK }}>{this.state.dataCriado == 0 ? 'Mês' : 'Meses'}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
                <ScrollView style={styles.scrollStyle}>
                    <View style={styles.boddy}>
                        <View style={{ marginLeft: 20 }}>
                            <Text style={{ fontSize: 20, fontFamily: 'Inter-Bold', color: colors.BLACK }}>Informações pessoais</Text>
                        </View>
                        <View style={styles.infoDriver}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 25 }}>
                                <Icon
                                    name='ios-phone-portrait'
                                    size={30}
                                    type='ionicon'
                                    color={colors.BLACK}
                                />
                                <Text style={{ fontSize: 16, fontFamily: 'Inter-Regular', color: colors.BLACK, marginLeft: 20 }}>{this.state.mobile}</Text>
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 25 }}>
                                <Icon
                                    name='ios-mail'
                                    size={30}
                                    type='ionicon'
                                    color={colors.BLACK}
                                />
                                <Text style={{ fontSize: 16, fontFamily: 'Inter-Regular', color: colors.BLACK, marginLeft: 20 }}>{this.state.email}</Text>
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 25 }}>
                                <Icon
                                    name='ios-car'
                                    size={30}
                                    type='ionicon'
                                    color={colors.BLACK}
                                />
                                <Text style={{ fontSize: 16, fontFamily: 'Inter-Regular', color: colors.BLACK, marginLeft: 20 }}>{this.state.vehicleModel}</Text>
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 25 }}>
                                <Icon
                                    name='ios-pin'
                                    size={30}
                                    type='ionicon'
                                    color={colors.BLACK}
                                />
                                <Text style={{ fontSize: 16, fontFamily: 'Inter-Regular', color: colors.BLACK, marginLeft: 20 }}>Valença - RJ</Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </View>
        );
    }
}

//Screen Styling
const styles = StyleSheet.create({

    mainView: {
        flex: 1,
    },

    header: {
        flex: 1,
        backgroundColor: colors.DEEPBLUE,
    },

    scrollStyle: {
        flex: 1,
        height: height,
        backgroundColor: colors.WHITE
    },

    headerBoddy: {
        position: 'absolute',
        marginTop: Platform.select({ ios: 60, android: 50 }),
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        borderBottomWidth: width / 2,
        borderBottomColor: colors.WHITE,
        backgroundColor: colors.DEEPBLUE,
    },

    cardDriver: {
        flex: 1,
        position: 'absolute',
        height: 250,
        width: '93%',
        borderWidth: 0.6,
        borderColor: colors.GREY1,
        borderRadius: 15,
        backgroundColor: colors.WHITE,
    },

    photoDriver: {
        height: 100,
        alignSelf: 'center',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: -20,
        top: '-20%',
        width: 100,
        borderRadius: 100,
        backgroundColor: colors.WHITE,
        elevation: 5,
    },

    ratingDriver: {
        position: 'absolute',
        justifyContent: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        width: '60%',
        height: '25%',
        bottom: -5,
        borderRadius: 15,
        elevation: 2,
        backgroundColor: colors.WHITE,
    },

    detaisDriver: {
        flex: 1,
        flexDirection: 'row',
        borderTopWidth: 0.6,
        borderTopColor: colors.GREY1,
        justifyContent: "space-between",
        alignItems: 'center',
    },

    viewAnos: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    viewCorridas: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },

    cardClasse: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: width / 3,
        marginTop: 5,
        maxHeight: 25,
        backgroundColor: colors.GREY1,
        borderRadius: 15,
    },

    infoDriver: {
        marginLeft: 20,
        flexDirection: 'column',
    },

    boddy: {
        flex: 1,
    },




    /*
    headerStyle: {
        backgroundColor: colors.TRANSPARENT,
        borderBottomWidth: 0
    },
    headerTitleStyle: {
        color: colors.BLACK,
        fontFamily: 'Inter-Bold',
        fontSize: 20
    },
    logo: {
        flex: 1,
        position: 'absolute',
        top: 110,
        width: '100%',
        justifyContent: "flex-end",
        alignItems: 'center'
    },
    footer: {
        flex: 1,
        position: 'absolute',
        bottom: 0,
        height: 150,
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center'
    },
    scrollViewStyle1: {
        width: width,
        height: 50,
        marginTop: 15,
        backgroundColor: colors.GREY.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    scrollViewStyle: {
        width: width,
        height: 50,
        marginTop: 10,
        marginBottom: 10,
        backgroundColor: colors.GREY.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    profStyle: {
        fontSize: 15,
        left: 10,
        color: colors.BLACK,
        fontFamily: 'Inter-Regular'
    },
    viewStyle: {
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 13
    },
    imageParentView: {
        marginTop: 5,
        borderRadius: 100 / 2,
        width: 100,
        height: 100,
        backgroundColor: colors.GREY.secondary,
        justifyContent: 'center',
        alignItems: 'center'
    },
    imageViewStyle: {
        borderRadius: 90 / 2,
        width: 90,
        height: 90,
        backgroundColor: colors.BLACK,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    textPropStyle: {
        fontSize: 20,
        color: colors.BLACK,
        fontFamily: 'Inter-Bold',
        marginRight: 8,
    },
    newViewStyle: {
        flex: 1,
        elevation: 6,
        backgroundColor: colors.WHITE,
        marginLeft: 15,
        marginRight: 15,
        height: 270,
        borderRadius: 15,
        marginTop: 20
    },
    myViewStyle: {
        flex: 1,
        left: 20,
        marginRight: 40,
        borderBottomColor: colors.GREY1,
        borderBottomWidth: 1,
    },
    iconViewStyle: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center'
    },
    emailStyle: {
        fontSize: 15,
        left: 10,
        color: colors.BLACK,
        fontFamily: 'Inter-Regular'
    },
    emailAdressStyle: {
        fontSize: 15,
        color: colors.BLACK,
        fontFamily: 'Inter-Regular'
    },
    mainIconView: {
        flex: 1,
        left: 20,
        marginRight: 40,
        borderBottomColor: colors.BLACK,
        borderBottomWidth: 1
    },
    text1: {
        fontSize: 15,
        left: 10,
        color: colors.BLACK,
        fontFamily: 'Inter-Regular'
    },
    text2: {
        fontSize: 15,
        left: 10,
        color: colors.BLACK,
        fontFamily: 'Inter-Regular'
    },
    textIconStyle: {
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
    },
    textIconStyle2: {
        width: 333,
        height: 60,
        marginTop: 10,
        marginBottom: 20,
        borderRadius: 15,
        backgroundColor: colors.DEEPBLUE,
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center'
    },
    mainView: {
        flex: 1,
        backgroundColor: colors.WHITE,

    },
    flexView1: {
        flex: 1
    },
    flexView2: {
        flex: 1
    },
    flexView3: {
        marginTop: 54
    },
    loadingcontainer: {
        flex: 1,
        justifyContent: 'center'
    },
    horizontal: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 10
    },
    switchAlignStyle: {
        alignContent: "center"
    },

    textIconStyle: {
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
    },
    textIconStyle2: {
        width: 333,
        height: 60,
        marginTop: 10,
        marginBottom: 20,
        borderRadius: 15,
        backgroundColor: colors.DEEPBLUE,
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center'
    },
    textButton: {
        color: colors.RED,
        marginBottom: 15,
        fontFamily: 'Inter-Bold',
        fontSize: 18,
    },
    textButton2: {
        color: colors.WHITE,
        fontFamily: 'Inter-Bold',
        fontSize: 18,
    },
    iconImage: {
        alignSelf: 'center'
    },
    editarPerfil: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    iconBack: {
        width: 30,
        height: 30,
        backgroundColor: colors.WHITE,
        elevation: 4,
        borderRadius: 50,
        justifyContent: 'center'
    },
    */
});
