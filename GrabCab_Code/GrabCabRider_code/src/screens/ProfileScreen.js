import React from 'react';
import {
    StyleSheet,
    View,
    Image,
    Dimensions,
    Text,
    TouchableOpacity,
    ScrollView,
    AsyncStorage,
    TouchableWithoutFeedback,
    ActivityIndicator,
    Alert
} from 'react-native';
import { Icon, Header } from 'react-native-elements';
import ActionSheet from 'react-native-actionsheet';
import { colors } from '../common/theme';
import * as Permissions from 'expo-permissions';
import * as ImagePicker from 'expo-image-picker';
import languageJSON from '../common/language';
var { width, height } = Dimensions.get('window');
import * as firebase from 'firebase';

import AvatarUser from '../../assets/svg/AvatarUser';

export default class ProfileScreen extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            firstName: '',
            lastName: '',
            profile_image: null,
            loader: false,
            settings: {
                code: '',
                symbol: '',
                cash: false,
                wallet: false
            }
        }
    }

    componentDidMount() {
        this._retrieveSettings();
    }

    _retrieveSettings = async () => {
        try {
            const value = await AsyncStorage.getItem('settings');
            if (value !== null) {
                this.setState({ settings: JSON.parse(value) });
            }
        } catch (error) {
            console.log("Asyncstorage issue 10");
        }
    };


    async UNSAFE_componentWillMount() {
        var curuser = firebase.auth().currentUser;
        this.setState({ currentUser: curuser }, () => {
            const userData = firebase.database().ref('users/' + this.state.currentUser.uid);
            userData.on('value', userData => {
                if (userData.val()) {
                    var str = userData.val().location.add
                    var tempAdd = str.split(",")[3] + ',' + str.split(",")[4];
                    this.setState({ tempAddress: tempAdd, userImage: userData.val().profile_image });
                    this.setState(userData.val(), (res) => {
                    });
                }
            })
        })

    }

    showActionSheet = () => {
        this.ActionSheet.show()
    }

    uploadImage() {
        return (
            <View>
                <ActionSheet
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


    async uploadmultimedia(url) {
        const blob = await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onload = function () {
                resolve(xhr.response); // when BlobModule finishes reading, resolve with the blob
            };
            xhr.onerror = function () {
                reject(new TypeError(languageJSON.network_request_failed)); // error occurred, rejecting
            };
            xhr.responseType = 'blob'; // use BlobModule's UriHandler
            xhr.open('GET', url, true); // fetch the blob from uri in async mode
            xhr.send(null); // no initial data
        });

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
            languageJSON.delete_account_modal_title,
            languageJSON.delete_account_modal_subtitle,
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

    goWallet() {
        this.props.navigation.navigate('wallet');
    }

    render() {
        let { image } = this.state;

        return (

            <View style={styles.mainView}>
                <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollStyle}>
                    {
                        this.uploadImage()
                    }
                    <Header
                        backgroundColor={colors.WHITE}
                        leftComponent={{ icon: 'chevron-left', type: 'MaterialIcons', color: colors.BLACK, size: 35, component: TouchableWithoutFeedback, onPress: () => { this.props.navigation.goBack(); } }}
                        containerStyle={styles.headerStyle}
                        innerContainerStyles={{ marginLeft: 10, marginRight: 10 }}
                    />
                    <View style={styles.viewStyle}>
                        <View style={styles.imageParentView}>
                            <View style={styles.imageViewStyle} >
                                {
                                     this.state.loader == true ? this.loader() : 
                                     this.state.userImage ? 
                                     <TouchableOpacity onPress={this.showActionSheet}>
                                         <Image source={{ uri: this.state.userImage }} style={{ width: 95, height: 95, borderRadius: 50 }} /> 
                                     </TouchableOpacity>
                                     :
                                     <TouchableOpacity onPress={this.showActionSheet}>
                                         <AvatarUser
                                            width={95}
                                            height={95}
                                         />
                                     </TouchableOpacity>
                                }
                            </View>
                        </View>
                        <View style={styles.editarPerfil}>
                            <Text style={styles.textPropStyle} >{this.state.firstName.toUpperCase() + " " + this.state.lastName.toUpperCase()}</Text>
                            <View style={styles.iconBack}>
                                <Icon
                                    name='edit-2'
                                    style={styles.iconImage}
                                    size={18}
                                    type='feather'
                                    color={colors.BLACK}
                                    onPress={this.editProfile}
                                />
                            </View>
                        </View>
                    </View>

                    <View style={styles.newViewStyle}>
                        <View style={styles.myViewStyle}>
                            <View style={styles.iconViewStyle}>
                                <Icon
                                    name='mail-outline'
                                    type='ionicicon'
                                    color='#D5DDE0'
                                    size={25}
                                />
                                <Text style={styles.emailStyle}>{this.state.email}</Text>
                            </View>
                        </View>
                        <View style={styles.myViewStyle}>
                            <View style={styles.iconViewStyle}>
                                <Icon
                                    name='dollar-sign'
                                    type='feather'
                                    color='#D5DDE0'
                                    size={25}
                                />
                                <Text onPress={() => this.goWallet()} style={styles.profStyle}>Meu saldo ({this.state.settings.symbol} {this.state.walletBalance ? parseFloat(this.state.walletBalance).toFixed(2) : 0.00})</Text>
                            </View>
                        </View>
                        <View style={styles.myViewStyle}>
                            <View style={styles.iconViewStyle}>
                                <Icon
                                    name='map-pin'
                                    type='feather'
                                    color='#D5DDE0'
                                />
                                <Text style={styles.text1}>{this.state.tempAddress}</Text>
                            </View>
                        </View>
                        <View style={styles.myViewStyle}>
                            <View style={styles.iconViewStyle}>
                                <Icon
                                    name='phone'
                                    type='feather'
                                    color='#D5DDE0'
                                />
                                <Text style={styles.text1}>{this.state.mobile}</Text>
                            </View>
                        </View>
                        {this.state.refferalId ?
                            <View style={styles.myViewStyle}>
                                <View style={styles.iconViewStyle}>
                                    <Icon
                                        name='award'
                                        type='feather'
                                        color='#D5DDE0'
                                    />
                                    <Text style={styles.emailStyle}>{this.state.refferalId + ' (Cod. Referência)'}</Text>
                                </View>
                            </View>
                            : null}

                    </View>

                    <View style={styles.flexView3}>

                        <TouchableOpacity onPress={() => { this.signOut() }} style={styles.textIconStyle2}>
                            <Text style={styles.textButton2}>Sair</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.textIconStyle} onPress={() => { this.deleteAccount() }}>
                            <Text style={styles.textButton}>Deletar conta</Text>
                        </TouchableOpacity>

                    </View>

                </ScrollView>

            </View>
        );
    }
}

const styles = StyleSheet.create({
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
    scrollStyle: {
        flex: 1,
        height: height,
        backgroundColor: colors.WHITE
    },
    scrollViewStyle: {
        width: width,
        height: 50,
        marginTop: 15,
        backgroundColor: colors.GREY.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    scrollViewStyle2: {
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
    iconCarteira: {
        marginLeft: 10
    },
    bonusAmount: {
        right: 20,
        fontSize: 16,
        fontWeight: 'bold'
    },
    viewStyle: {
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 13
    },
    imageParentView: {
        marginTop: 5,
        borderRadius: 80 / 2,
        width: 80,
        height: 80,
        backgroundColor: colors.GREY.secondary,
        justifyContent: 'center',
        alignItems: 'center'
    },
    imageViewStyle: {
        borderRadius: 100 / 2,
        width: 100,
        height: 100,
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
        width: 250,
        height: 50,
        marginTop: 10,
        marginBottom: 20,
        borderRadius: 8,
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
        fontSize: 20,
    },
    mainView: {
        flex: 1,
        backgroundColor: colors.WHITE,
        //marginTop: StatusBar.currentHeight 
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

    iconImage: {
        alignSelf: 'center'
    },
    editarPerfil: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 15
    },
    iconBack: {
        width: 30,
        height: 30,
        backgroundColor: colors.WHITE,
        elevation: 4,
        borderRadius: 50,
        justifyContent: 'center'
    },
});