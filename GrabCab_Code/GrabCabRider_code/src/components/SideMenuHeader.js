import React from 'react';
import { Text, View, Image, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { Icon } from 'react-native-elements'
import { colors } from '../common/theme';

import AvatarUser from '../../assets/svg/AvatarUser';

const SideMenuHeader = ({ headerStyle, userPhoto, userName, userEmail, userPhone }) => {
    return (
        <View style={[styles.viewStyle, headerStyle]}>
            <View style={styles.userImageView} >
                {userPhoto ?
                    <Image source={{ uri: userPhoto }} style={{ width: 75, height: 75, borderRadius: 50 }} />
                    :
                    <AvatarUser
                        width={76}
                        height={76}
                    />
                }
            </View>
            <View style={styles.headerTextStyle}>
                <Text style={styles.ProfileNameStyle}>{userName ? userName.toUpperCase() : ""}</Text>
            </View>
            <View style={styles.iconViewStyle}>
                <Icon
                    name='call'
                    type='material'
                    color={colors.WHITE}
                    size={16}
                />
                <Text style={styles.emailStyle}>{userPhone}</Text>
            </View>
        </View>
    );

};

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
        width: 150,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 10,
        marginTop: 4,

    },
    emailStyle: {
        fontFamily: 'Inter-Medium',
        color: colors.WHITE,
        fontSize: 14,
        marginLeft: 4,
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
    },
    imageStyle: {
        width: 80,
        height: 80
    }
}
//make the component available to other parts of the app
export default SideMenuHeader;