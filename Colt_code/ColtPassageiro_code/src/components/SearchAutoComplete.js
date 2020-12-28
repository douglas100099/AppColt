import React from 'react';
import { Platform, Dimensions, StyleSheet, View, Text, Modal, TouchableOpacity } from 'react-native';
var { height, width } = Dimensions.get('window');
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { colors } from '../common/theme';
import { google_map_key } from '../common/key';
import { Icon } from 'react-native-elements';
import * as firebase from 'firebase'

export default class SearchAutoComplete extends React.Component {

    constructor(props) {
        super(props);

        this.modalFocused = null
    }

    clearInput(params) {
        params.setAddressText("")
    }

    deleteSavedLocation() {
        firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/savedLocations/').remove().then(() => {
            this.searchModal.setAddressText("")
        })
    }

    render() {
        const { onFocus, onBlur, placeholder, stylesProps, locationCasa, showBtnDelete, modalFocused, onPressSearch, DefaultValue, locationUser, sessionToken } = this.props

        return (
            <View>

                <GooglePlacesAutocomplete
                    ref={(ref) => { this.searchModal = ref; }}
                    placeholder={placeholder}
                    enablePoweredByContainer={false}
                    minLength={2}
                    autoFocus={false}
                    returnKeyType={'search'} // Can be left out for default return key https://facebook.github.io/react-native/docs/textinput.html#returnkeytype
                    listViewDisplayed={modalFocused}
                    fetchDetails={true}
                    numberOfLines={15}
                    suppressDefaultStyles={true}
                    predefinedPlacesAlwaysVisible={false}

                    textInputProps={{
                        onFocus: onFocus,
                        onBlur: onBlur,
                        autoCapitalize: "none",
                        autoCorrect: false,
                    }}

                    onPress={(data, details = null) => { // 'details' is provided when fetchDetails = true
                        onPressSearch(data, details)
                    }}

                    renderDescription={(row) => row.formatted_address || row.description || row.name}

                    renderRightButton={() => {
                        return (
                            Platform.OS == "android" ?
                                modalFocused ?
                                    <TouchableOpacity style={{ position: 'absolute', alignItems: 'center', right: 10 }} onPress={() => { this.clearInput(this.searchModal) }}>
                                        <Icon
                                            name='ios-close-circle'
                                            type='ionicon'
                                            size={20}
                                            containerStyle={{ opacity: 0.2 }}
                                        />
                                    </TouchableOpacity>
                                    : null
                                : null
                        )
                    }
                    }

                    renderRow={(row) =>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Icon
                                name='ios-pin'
                                type='ionicon'
                                size={15}
                                containerStyle={{ marginLeft: 10, opacity: 0.5 }}
                            />
                            <View style={{ flexDirection: 'column' }}>
                                <Text numberOfLines={1} style={{ marginLeft: 8, fontFamily: 'Inter-Medium', fontSize: 18, color: colors.BLACK }}> {row.description.split("-")[0]} </Text>
                                <Text numberOfLines={1} style={{ marginLeft: 8, opacity: 0.5, fontFamily: 'Inter-Regular', fontSize: 14 }}> {row.description}</Text>
                            </View>
                        </View>
                    }

                    getDefaultValue={() => DefaultValue}
                    query={{
                        // available options: https://developers.google.com/places/web-service/autocomplete
                        key: google_map_key,
                        language: 'pt-BR', // language of the results
                        type: ['(regions)'],
                        components: "country:br", // country name
                        location: locationUser[0] + ',' + locationUser[1],
                        //strictbounds : true,
                        sessiontoken: sessionToken,
                        radius: 15000
                    }}
                    //predefinedPlaces={[homePlace, workPlace]}
                    //predefinedPlacesAlwaysVisible={false}

                    styles={stylesProps}

                    //currentLocation={true} // Will add a 'Current location' button at the top of the predefined places list
                    //currentLocationLabel="Localização atual"
                    nearbyPlacesAPI='GooglePlacesSearch' // Which API to use: GoogleReverseGeocoding or GooglePlacesSearch
                    GoogleReverseGeocodingQuery={{
                        // available options for GoogleReverseGeocoding API : https://developers.google.com/maps/documentation/geocoding/intro
                        key: google_map_key,
                        language: 'pt-BR',
                        region: '.br',
                    }}
                    GooglePlacesDetailsQuery={{
                        region: '.br',
                        sessiontoken: sessionToken,
                    }}
                    //filterReverseGeocodingByTypes={['locality', 'administrative_area_level_3']}
                    GooglePlacesSearchQuery={{
                        // available options for GooglePlacesSearch API : https://developers.google.com/places/web-service/search
                        rankby: 'distance',
                        key: google_map_key,
                        radius: 15000,
                        location: locationUser[0] + ',' + locationUser[1],

                        language: 'pt-BR', // language of the results
                        type: ['(regions)'],
                        sessiontoken: sessionToken,
                    }}

                    debounce={50} // debounce the requests in ms. Set to 0 to remove debounce. By default 0ms.
                >

                </GooglePlacesAutocomplete>
                {locationCasa != null && showBtnDelete ?
                    <TouchableOpacity style={{ position: 'absolute', top: 40, alignSelf: 'center' }} onPress={() => { this.deleteSavedLocation() }}>
                        <Text style={{ fontFamily: 'Inter-Bold', color: colors.RED, fontSize: width < 375 ? 15 : 16 }}> Excluir </Text>
                    </TouchableOpacity>
                    : null}
            </View>
        )
    }
}