import React from 'react';
import { Text, View, Image, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { Icon } from 'react-native-elements'
import { colors } from '../common/theme';
import languageJSON from '../common/language';
//make a compontent
const SideMenuHeader = ({ headerStyle, userPhoto, userName, userCorridas, userRating, onPress }) => {

    return (
        <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={[styles.viewStyle, headerStyle]}>
            <View style={styles.userImageView}>
                <Image
                    source={userPhoto == null ? require('../../assets/images/profilePic.png') : { uri: userPhoto }}
                    style={styles.imageStyle}
                />
            </View>
            <View style={styles.headerTextStyle}>
                <Text style={styles.ProfileNameStyle}>{userName ? userName.toUpperCase() : ""}</Text>
            </View>
            <View style={styles.iconViewStyle}>
                <View style={styles.viewRating}>
                    <Icon
                        name='ios-star'
                        type='ionicon'
                        color={colors.BLACK}
                        size={18}
                    />
                    <Text style={styles.emailStyle}>{userRating ? userRating : "0"}</Text>
                </View>
                <View style={styles.viewCorridas}>
                    <Icon
                        name='ios-speedometer'
                        type='ionicon'
                        color={colors.BLACK}
                        size={18}
                    />
                    <Text style={styles.emailStyle}>{userCorridas ? userCorridas : "0"}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

};

//style for this component
const styles = {
    viewStyle: {
        backgroundColor: colors.DEEPBLUE,
        justifyContent: 'flex-end',
        alignItems: 'flex-start',
        height: 200,
        paddingTop: Platform.OS == 'ios' ? 20 : StatusBar.currentHeight,
        shadowColor: colors.BLACK,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        elevation: 2,
        position: 'relative',
        flexDirection: 'column',
        padding: 10,
    },

    viewCorridas:{
        justifyContent: 'center',
        backgroundColor: colors.WHITE,
        alignItems: 'center',
        borderRadius: 50,
        flexDirection: 'row',
        paddingVertical: 2,
        paddingHorizontal: 15,
        elevation: 3,
    },
    viewRating: {
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        borderRadius: 50,
        marginRight: 5,
        backgroundColor: colors.WHITE,
        paddingVertical: 2,
        paddingHorizontal: 15,
        elevation: 3,
    },
    textStyle: {
        fontSize: 20,
        color: colors.WHITE
    },
    headerTextStyle: {
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10
    },
    iconStyle: {

    },
    userImageView: {
        width: 84,
        height: 84,
        borderRadius: 50,
        overflow: 'hidden',
        marginLeft: 10,
        borderWidth: 2,
        borderColor: colors.WHITE,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    ProfileNameStyle: {
        fontFamily: 'Inter-Bold',
        color: colors.WHITE,
        marginLeft: 10,
        fontSize: 15
    },
    iconViewStyle: {
        justifyContent: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 10,
        marginTop: 4
    },
    emailStyle: {
        fontFamily: 'Inter-Regular',
        color: colors.BLACK,
        fontSize: 13,
        marginLeft: 4,
    },
    imageStyle: {
        width: 80,
        height: 80
    }
}
//make the component available to other parts of the app
export default SideMenuHeader;