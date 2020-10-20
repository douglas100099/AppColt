import React, { Component } from 'react';
import { Platform, Dimensions, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { colors } from '../common/theme';
import { google_map_key } from '../common/key';
import { Icon } from 'react-native-elements';
import { NavigationActions, StackActions } from 'react-navigation';
var { height, width } = Dimensions.get('window');

import LocationIconSearch from '../../assets/svg/LocationIconSearch';
import LocationUser from '../../assets/svg/LocationUser';
import LocationDrop from '../../assets/svg/LocationDrop';
import { color } from 'react-native-reanimated';

/*const homePlace = {
    description: 'Home',
    geometry: { location: { lat: 48.8152937, lng: 2.4597668 } },
};

const workPlace = {
    description: 'Work',
    geometry: { location: { lat: 48.8496818, lng: 2.2940881 } },
};*/

export default class SearchScreen extends Component {
    state = {
        searchFocused: false,
    }

    UNSAFE_componentWillMount() {
        let locationUser = this.props.navigation.getParam('old');
        let allCars = this.props.navigation.getParam('allCars');

        this.setState({
            locationUser: locationUser,
            allCars: allCars,
        })
    }

    //Seleciona o novo endereço de partida do passageiro
    pickupLocation(data, details) {
        let pickupData = {
            pickupLat: details.geometry.location.lat,
            pickupLng: details.geometry.location.lng,
            whereText: details.formatted_address
        }

        this.setState({ pickupData: pickupData, searchFocused: true, })
    }


    goMap(data, details) {

        let oldData = {}

        oldData.wherelatitude = this.state.pickupData ? this.state.pickupData.pickupLat : this.state.locationUser.wherelatitude,
            oldData.wherelongitude = this.state.pickupData ? this.state.pickupData.pickupLng : this.state.locationUser.wherelongitude,
            oldData.whereText = this.state.pickupData ? this.state.pickupData.whereText : this.state.locationUser.whereText,

            oldData.droplatitude = details.geometry.location.lat,
            oldData.droplongitude = details.geometry.location.lng,
            oldData.droptext = details.formatted_address

        var minTimeEco
        var minTimeCon
        if (this.state.allCars != null) {
            for (key in this.state.allCars) {
                if (key == 0) {
                    minTimeEco = this.state.allCars[key].minTime != '' ? this.state.allCars[key].minTime : null
                } else if (key == 1) {
                    minTimeCon = this.state.allCars[key].minTime != '' ? this.state.allCars[key].minTime : null
                }
            }
        }

        this.props
            .navigation
            .dispatch(StackActions.reset({
                index: 0,
                actions: [
                    NavigationActions.navigate({
                        routeName: 'FareDetails',
                        params: { data: oldData, minTimeEconomico: minTimeEco, minTimeConfort: minTimeCon },
                    }),
                ],
            }))
    }

    render() {
        const { searchFocused } = this.state;
        const { onLocationSelected } = this.props;

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

                        <TouchableOpacity style={styles.iconBack} /*onPress={() => { this.props.navigation.goBack(); }}*/>
                            <Icon
                                name='ios-add'
                                type='ionicon'
                                color={colors.DEEPBLUE}
                                size={45}
                                containerStyle={{ right: 15 }}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* View dos inputs */}
                    <View style={styles.viewInputs}>
                        <View style={{ flexDirection: 'column', alignItems: 'center', left: 15 }}>
                            <LocationUser width={30} height={30} />
                            <View style={{ height: 45, backgroundColor: colors.DEEPBLUE, width: 3, marginTop: -5, marginBottom: -5 }} />
                            <LocationDrop width={25} height={25} />
                        </View>
                        <View style={{ flexDirection: 'column', position: 'absolute' }}>
                            <View >
                                <GooglePlacesAutocomplete
                                    placeholder='Procurar'
                                    enablePoweredByContainer={false}
                                    minLength={2} // minimum length of text to search
                                    autoFocus={this.state.searchFocused}
                                    returnKeyType={'search'} // Can be left out for default return key https://facebook.github.io/react-native/docs/textinput.html#returnkeytype
                                    listViewDisplayed='auto'  // true/false/undefined
                                    fetchDetails={true}
                                    numberOfLines={15}
                                    suppressDefaultStyles={true}
                                    //sessiontoken={}

                                    textInputProps={{
                                        onFocus: () => { this.setState({ searchFocused: false }) },
                                        onBlur: () => { this.setState({ searchFocused: true }) },
                                        autoCapitalize: "none",
                                        autoCorrect: false,
                                    }}

                                    onPress={(data, details = null) => { // 'details' is provided when fetchDetails = true
                                        this.pickupLocation(data, details);
                                    }}

                                    renderDescription={(row) => row.formatted_address || row.description || row.name}

                                    renderRow={(row) =>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Icon
                                                name='gps-fixed'
                                                //type='feather'
                                                size={15}
                                                containerStyle={{ marginLeft: 10, opacity: 0.5 }}
                                            />
                                            <Text style={{ marginLeft: 8, fontFamily: 'Inter-Regular', fontSize: 15 }}> {row.formatted_address || row.description || row.name}</Text>
                                        </View>
                                    }

                                    getDefaultValue={() => this.state.pickupData ? this.state.pickupData.whereText : this.state.locationUser.whereText}
                                    query={{
                                        // available options: https://developers.google.com/places/web-service/autocomplete
                                        key: google_map_key,
                                        language: 'pt-BR', // language of the results
                                        types: ['(regions)'],
                                        components: "country:br", // country name
                                        location: this.state.locationUser.wherelatitude + ',' + this.state.locationUser.wherelongitude,
                                        //strictbounds : true,
                                        radius: 15000
                                    }}
                                    //predefinedPlaces={[homePlace, workPlace]}
                                    //predefinedPlacesAlwaysVisible={false}


                                    styles={{
                                        container: {
                                            flex: 1,
                                            width: width,
                                        },
                                        textInputContainer: {
                                            marginHorizontal: 40,
                                            backgroundColor: colors.GREY.background,
                                            marginRight: 45,
                                            paddingBottom: 8,
                                            paddingTop: 8,
                                            paddingLeft: 8,
                                            borderRadius: 5,
                                            left: 15
                                        },
                                        textInput: {
                                            fontFamily: 'Inter-Medium',
                                            fontSize: 18
                                        },
                                        listView: {
                                            position: 'absolute',
                                            backgroundColor: colors.WHITE,
                                            width: width,
                                            top: 145
                                        },
                                        description: {
                                            fontSize: 20,
                                            paddingLeft: 20,
                                            paddingRight: 20,
                                        },
                                        row: {
                                            paddingLeft: 10,
                                            paddingRight: 10,
                                            height: 50,
                                            justifyContent: 'center',
                                            fontFamily: 'Inter-Bold',
                                            borderBottomWidth: 2,
                                            borderBottomColor: colors.GREY.background,
                                            opacity: 0.8
                                        },
                                        loader: {
                                            position: 'absolute',
                                            left: 0
                                        }
                                    }}

                                    //currentLocation={true} // Will add a 'Current location' button at the top of the predefined places list
                                    //currentLocationLabel="Localização atual"
                                    nearbyPlacesAPI='GoogleReverseGeocoding' // Which API to use: GoogleReverseGeocoding or GooglePlacesSearch
                                    GoogleReverseGeocodingQuery={{
                                        // available options for GoogleReverseGeocoding API : https://developers.google.com/maps/documentation/geocoding/intro
                                        key: google_map_key,
                                        language: 'pt-BR',
                                    }}
                                    //filterReverseGeocodingByTypes={['locality', 'administrative_area_level_3']}
                                    GooglePlacesSearchQuery={{
                                        // available options for GooglePlacesSearch API : https://developers.google.com/places/web-service/search
                                        rankby: 'distance',
                                        types: 'establishment',
                                    }}

                                    debounce={200} // debounce the requests in ms. Set to 0 to remove debounce. By default 0ms.
                                >

                                </GooglePlacesAutocomplete>
                            </View>

                            <View >
                                <GooglePlacesAutocomplete
                                    placeholder='Procurar'
                                    enablePoweredByContainer={false}
                                    ref={ref => { this.searchDrop = ref }}
                                    minLength={2}
                                    autoFocus={true}
                                    returnKeyType={'search'} // Can be left out for default return key https://facebook.github.io/react-native/docs/textinput.html#returnkeytype
                                    listViewDisplayed='auto'
                                    fetchDetails={true}
                                    numberOfLines={15}
                                    suppressDefaultStyles={true}
                                    //sessiontoken={}

                                    textInputProps={{
                                        onFocus: () => {this.setState({ searchFocused: true }) },
                                        onBlur: () => { this.setState({ searchFocused: false }) },
                                        autoCapitalize: "none",
                                        autoCorrect: false,
                                    }}

                                    onPress={(data, details = null) => { // 'details' is provided when fetchDetails = true
                                        this.goMap(data, details);
                                    }}

                                    renderDescription={(row) => row.formatted_address || row.description || row.name}

                                    renderRow={(row) =>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Icon
                                                name='gps-fixed'
                                                //type='feather'
                                                size={15}
                                                containerStyle={{ marginLeft: 10, opacity: 0.5 }}
                                            />
                                            <Text style={{ marginLeft: 8, fontFamily: 'Inter-Regular', fontSize: 15 }}> {row.formatted_address || row.description || row.name}</Text>
                                        </View>
                                    }

                                    getDefaultValue={() => ''}
                                    query={{
                                        // available options: https://developers.google.com/places/web-service/autocomplete
                                        key: google_map_key,
                                        language: 'pt-BR', // language of the results
                                        types: ['(regions)'],
                                        components: "country:br", // country name
                                        location: this.state.locationUser.wherelatitude + ',' + this.state.locationUser.wherelongitude,
                                        //strictbounds : true,
                                        radius: 15000
                                    }}
                                    //predefinedPlaces={[homePlace, workPlace]}
                                    //predefinedPlacesAlwaysVisible={false}

                                    styles={{
                                        container: {
                                            flex: 1,
                                            width: width,
                                            marginTop: 23,
                                        },
                                        textInputContainer: {
                                            backgroundColor: colors.GREY.background,
                                            marginRight: 45,
                                            paddingBottom: 8,
                                            paddingTop: 8,
                                            paddingLeft: 8,
                                            borderRadius: 5,
                                            marginHorizontal: 40,
                                            left: 15
                                        },
                                        textInput: {
                                            fontFamily: 'Inter-Medium',
                                            fontSize: 18
                                        },
                                        listView: {

                                            top: 55,
                                            backgroundColor: colors.WHITE,
                                        },
                                        description: {
                                            paddingLeft: 20,
                                            paddingRight: 20,
                                        },
                                        row: {                                            
                                            paddingLeft: 10,
                                            paddingRight: 10,
                                            height: 50,
                                            justifyContent: 'center',
                                            borderBottomWidth: 2,
                                            borderBottomColor: colors.GREY.background,
                                            opacity: 0.8,
                                        },
                                        loader: {
                                            flexDirection: 'row',
                                            justifyContent: 'flex-end',
                                            height: 20,
                                          },
                                    }}

                                    //currentLocation={true} // Will add a 'Current location' button at the top of the predefined places list
                                    //currentLocationLabel="Localização atual"
                                    nearbyPlacesAPI='GoogleReverseGeocoding' // Which API to use: GoogleReverseGeocoding or GooglePlacesSearch
                                    GoogleReverseGeocodingQuery={{
                                        // available options for GoogleReverseGeocoding API : https://developers.google.com/maps/documentation/geocoding/intro
                                        key: google_map_key,
                                        language: 'pt-BR',
                                    }}
                                    //filterReverseGeocodingByTypes={['locality', 'administrative_area_level_3']}
                                    GooglePlacesSearchQuery={{
                                        // available options for GooglePlacesSearch API : https://developers.google.com/places/web-service/search
                                        rankby: 'distance',
                                        types: 'establishment',
                                    }}

                                    debounce={200} // debounce the requests in ms. Set to 0 to remove debounce. By default 0ms.
                                >

                                </GooglePlacesAutocomplete>
                            </View>
                        </View>
                    </View>

                    {/*<View style={styles.viewPrincipal}>
                        <View style={styles.addCasa}>
                            <Text> Adicionar Casa </Text>
                        </View>
                                </View>*/}
                </View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    mainView: {
        flex: 1,
        backgroundColor: colors.GREY1.background
    },
    viewTop: {
        width: width,
        position: 'absolute',
        backgroundColor: colors.WHITE,
        height: 250,
        flexDirection: 'column',
        elevation: 10,
        shadowColor: colors.BLACK,
        shadowOpacity: 0.4,
        shadowOffset: { x: 0, y: 0 },
        shadowRadius: 8,
    },
    IconTextTop: {
        marginTop: Platform.OS == "ios" ? 50 : 30,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    iconBack: {
        marginLeft: 10,
    },
    viewInputs: {
        flexDirection: 'row',
        marginTop: 15,
    },
    viewPrincipal: {
        flex: 5,
        backgroundColor: colors.BLACK
    },
    addCasa: {
        backgroundColor: colors.GREY1,
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 10,
        marginTop: 10,
    },

})