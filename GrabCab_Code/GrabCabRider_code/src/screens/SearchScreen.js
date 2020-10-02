import React, { Component } from 'react';
import { Platform, StatusBar, Dimensions, StyleSheet, Button, View, Text } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { colors } from '../common/theme';
import { google_map_key } from '../common/key';
import { Icon } from 'react-native-elements';
import { color } from 'react-native-reanimated';
var { height, width } = Dimensions.get('window');

export default class SearchScreen extends Component {
    state = {
        searchFocused: false,
    }

    UNSAFE_componentWillMount() {
        let from = this.props.navigation.getParam('from');
        let whereText = this.props.navigation.getParam('whereText');
        let dropText = this.props.navigation.getParam('dropText');

        let allCars = this.props.navigation.getParam('allCars');


        this.setState({
            allCars: allCars,
            from: from,
            whereText: whereText,
            dropText: dropText
        })
    }
    goMap(data, details, from) {
        if (from == "where") {

            let searchObj = {
                searchData: data,
                searchDetails: details,
                searchFrom: from,
                whereText: details.formatted_address,
                dropText: this.state.dropText
            }

            let oldData = this.props.navigation.getParam('old');
            oldData.wherelatitude = details.geometry.location.lat,
                oldData.wherelongitude = details.geometry.location.lng,
                oldData.whereText = details.formatted_address

            this.props.navigation.replace('Map', { searchObj: searchObj, old: oldData, allCars: this.state.allCars });
        }
        else if (from == 'drop') {
            let searchObj = {
                searchData: data,
                searchDetails: details,
                searchFrom: from,
                whereText: this.state.whereText,
                dropText: details.formatted_address
            }

            let oldData = this.props.navigation.getParam('old');
            oldData.droplatitude = details.geometry.location.lat,
                oldData.droplongitude = details.geometry.location.lng,
                oldData.droptext = details.formatted_address

            this.props.navigation.replace('Map', { searchObj: searchObj, old: oldData, allCars: this.state.allCars  });
        }

    }
    render() {
        const { searchFocused } = this.state;
        const { onLocationSelected } = this.props;

        return (
            <GooglePlacesAutocomplete
                placeholder='Procurar'
                enablePoweredByContainer={false}
                minLength={2} // minimum length of text to search
                autoFocus={true}
                returnKeyType={'search'} // Can be left out for default return key https://facebook.github.io/react-native/docs/textinput.html#returnkeytype
                listViewDisplayed='auto'  // true/false/undefined
                fetchDetails={true}

                textInputProps={{
                    onFocus: () => { this.setState({ searchFocused: true }) },
                    onBlur: () => { this.setState({ searchFocused: false }) },
                    autoCapitalize: "none",
                    autoCorrect: false,
                }}

                onPress={(data, details = null) => { // 'details' is provided when fetchDetails = true
                    this.goMap(data, details, this.state.from);
                }}

                getDefaultValue={() => ''}
                query={{
                    // available options: https://developers.google.com/places/web-service/autocomplete
                    key: google_map_key,
                    language: 'pt-BR', // language of the results
                    //types: '(cities)',
                    components: "country:br", // country name
                }}

                styles={{
                    container: {
                        position: "absolute",
                        top: Platform.select({ ios: 110, android: 80 }),
                        width: '100%'
                    },
                    textInputContainer: {
                        flex: 1,
                        backgroundColor: 'transparent',
                        height: 45,
                        marginHorizontal: 20,
                        borderTopWidth: 0,
                        borderBottomWidth: 0,
                        fontSize: 18,
                    },
                    textInput: {
                        height: 45,
                        margin: 0,
                        borderRadius: 30,
                        paddingTop: 0,
                        paddingBottom: 0,
                        paddingLeft: 20,
                        paddingRight: 20,
                        padding: 0,
                        marginTop: 0,
                        marginLeft: 0,
                        marginRight: 0,
                        elevation: 5,
                        shadowColor: '#000',
                        shadowOpacity: 0.2,
                        shadowOffset: { x: 0, y: 0 },
                        shadowRadius: 15,
                        //borderWidth: 1,
                        //borderColor: "#DDD",
                        fontSize: 15,
                    },
                    listView: {
                        borderRadius: 10,
                        borderWidth: 0,
                        borderColor: '#DDD',
                        backgroundColor: '#FFF',
                        marginHorizontal: 10,
                        elevation: 0,
                        shadowColor: '#000',
                        shadowOpacity: 0.1,
                        shadowOffset: { x: 0, y: 0 },
                        shadowRadius: 15,
                        marginTop: 10,
                    },
                    description: {
                        fontSize: 14.5,
                        color: colors.BLACK,
                    },
                    row: {
                        padding: 15,
                        height: 48,
                    },
                    predefinedPlacesDescription: {
                        color: colors.BLUE.light
                    },
                }}
                renderDescription={(row) => row.description || row.formatted_address || row.name}
                currentLocation={true} // Will add a 'Current location' button at the top of the predefined places list
                currentLocationLabel="Localização atual"
                nearbyPlacesAPI='GoogleReverseGeocoding' // Which API to use: GoogleReverseGeocoding or GooglePlacesSearch
                GoogleReverseGeocodingQuery={{
                    // available options for GoogleReverseGeocoding API : https://developers.google.com/maps/documentation/geocoding/intro
                    key: google_map_key,
                    language: 'pt-BR',
                }}
                GooglePlacesSearchQuery={{
                    // available options for GooglePlacesSearch API : https://developers.google.com/places/web-service/search
                    rankby: 'distance',
                    types: 'establishment'
                }}

                debounce={200} // debounce the requests in ms. Set to 0 to remove debounce. By default 0ms.
            >
                <Icon
                    name='chevron-left'
                    type='MaterialIcons'
                    color={colors.BLACK}
                    size={35}
                    onPress={() => { this.props.navigation.goBack(); }}
                    containerStyle={styles.iconBack}
                />
                <View style={styles.containerHeader}>
                    {this.state.from == 'where' ?
                        <Icon
                            name='map-pin'
                            type='feather'
                            color={colors.BLACK}
                            size={25}
                            containerStyle={styles.iconLocation}
                        />
                        :
                        <Icon
                            name='map-pin'
                            type='feather'
                            color={colors.BLACK}
                            size={25}
                            containerStyle={styles.iconLocation}
                        />
                    }

                    <View style={styles.textHeader} >
                        <Text style={{ color: colors.GREY.btnSecondary, fontSize: 15, }}> {this.state.from == 'where' ? "Local de partida" : "Destino"} </Text>
                    </View>
                </View>

            </GooglePlacesAutocomplete>
        );
    }
}

const styles = StyleSheet.create({
    iconBack: {
        position: "absolute",
        top: Platform.select({ ios: -50, android: -50 }),
        marginLeft: 6
    },
    containerHeader: {
        position: "absolute",
        top: Platform.select({ ios: -33, android: -33 }),
        left: width - 20,
        alignContent: 'center',
        justifyContent: 'center',
        alignItems: 'flex-end',
    },
    textHeader: {
        position: "absolute",
        right: 30
    },
    iconLocation: {
        position: "absolute",
        marginLeft: 0,
        opacity: 0.4,
    }
})