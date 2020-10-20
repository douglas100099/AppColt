import React, { Component } from 'react';
import { Platform, Dimensions, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { colors } from '../common/theme';
import { google_map_key } from '../common/key';
import { Icon } from 'react-native-elements';
import { NavigationActions, StackActions } from 'react-navigation';
var { height, width } = Dimensions.get('window');

import LocationUser from '../../assets/svg/LocationUser';
import LocationDrop from '../../assets/svg/LocationDrop';
import { color } from 'react-native-reanimated';
import Verified from '../../assets/svg/Verified';

export default class SearchScreen extends Component {

    UNSAFE_componentWillMount() {
        let from = this.props.navigation.getParam('from');
        let whereText = this.props.navigation.getParam('whereText');
        let dropText = this.props.navigation.getParam('dropText');
        let locationUser = this.props.navigation.getParam('locationUser');


        let allCars = this.props.navigation.getParam('allCars');

        this.setState({
            locationUser: locationUser,
            allCars: allCars,
            from: from,
            whereText: whereText,
            dropText: dropText
        })
    }

    render() {
        return (
            <View style={styles.mainView}>
                <View style={styles.viewTop}>
                    <View style={styles.IconTextTop}>
                        <TouchableOpacity style={styles.iconBack} onPress={() => { this.props.navigation.goBack(); }}>
                            <Icon
                                name='chevron-left'
                                type='MaterialIcons'
                                color={colors.BLACK}
                                size={40}
                            />
                        </TouchableOpacity>
                        <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{ fontFamily: 'Inter-Bold', fontSize: 19}}> Destino </Text>
                        </View>
                    </View>
                    <View style={styles.viewInputs}>
                        <View style={{ flexDirection: 'column', alignItems: 'center' }}>
                            <LocationUser width={25} height={25} />
                            <View style={{ height: 40, backgroundColor: colors.DEEPBLUE, width: 3, marginTop: -5, marginBottom: -5 }} />
                            <LocationDrop  width={20} height={20}/>
                        </View>
                        <View style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between' }}>
                            <View style={styles.inputPickup} >
                                <Text style={{ marginLeft: 8, margin: 5, fontFamily: 'Inter-Medium' }}> {this.state.whereText ? this.state.whereText : null} </Text>
                            </View>
                            <View style={styles.inputDrop} >
                                <Text style={{ marginLeft: 8, fontFamily: 'Inter-Medium' }}> Your Drop </Text>
                            </View>
                        </View>
                    </View>
                </View>
                <View style={styles.viewPrincipal}>
                    <View style={styles.addCasa}>
                        <Text> Adicionar Casa </Text>
                    </View>
                </View>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    mainView: {
        flex: 1,
    },
    viewTop: {
        flex: 1,
        flexDirection: 'column',
        elevation: 10,
        shadowColor: colors.BLACK,
        shadowOpacity: 0.9,
        shadowOffset: { x: 0, y: 0 },
        shadowRadius: 1,
        backgroundColor: colors.WHITE
    },
    IconTextTop: {
        marginTop: Platform.OS == "ios" ? 40 : 20,
        flexDirection: 'row',

    },
    iconBack: {
        marginLeft: 10,
    },
    viewInputs: {
        flexDirection: 'row',
        marginLeft: 20,
        marginTop: 15,
    },
    viewPrincipal: {
        flex: 3,
        backgroundColor: colors.GREY3
    },
    addCasa: {
        backgroundColor: colors.GREY2,
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 10,
        marginTop: 10,

    },
    inputPickup: {
        backgroundColor: colors.GREY.secondary,
        borderRadius: 5,
        height: 40,
        width: width - 100,
        marginLeft: 15,
        flexDirection: 'row',
        alignItems: 'center',

    },
    inputDrop: {
        backgroundColor: colors.GREY.secondary,
        borderRadius: 5,
        height: 30,
        width: width - 100,
        marginLeft: 15,
        flexDirection: 'row',
        alignItems: 'center',
    },
})