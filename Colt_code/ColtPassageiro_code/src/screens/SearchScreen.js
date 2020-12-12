import React, { Component } from 'react';
import { Platform, Dimensions, StyleSheet, View, Text, Modal, TouchableOpacity } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import mapStyleAndroid from '../../mapStyleAndroid.json';
import { colors } from '../common/theme';
import { google_map_key } from '../common/key';
import { Icon } from 'react-native-elements';
var { height, width } = Dimensions.get('window');
import * as firebase from 'firebase'

import LocationIconSearch from '../../assets/svg/LocationIconSearch';
import LocationUser from '../../assets/svg/LocationUser';
import LocationDrop from '../../assets/svg/LocationDrop';
import SelectLocationPickup from '../../assets/svg/SelectLocationPickup';
import SelectLocationDrop from '../../assets/svg/SelectLocationDrop';
import BtnVoltar from '../components/BtnVoltar';
import { v4 as uuidv4 } from 'uuid';
import { color } from 'react-native-reanimated';
import { Pulse } from 'react-native-animated-spinkit'


export default class SearchScreen extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showListView: true,
            showSetAddress: false,
            dataDetails: {
                droplatitude: '',
                droplongitude: '',
                droptext: '',
                wherelatitude: '',
                wherelongitude: '',
                whereText: '',
            },
            region: null,
            searchFocused2: false,
            selectOnMap: false,
        }
        this.sessionToken = '';
        this.searchDrop = null,
            this.locationSelected = null
    }

    UNSAFE_componentWillMount() {
        let locationUser = this.props.navigation.getParam('old');

        this.setState({
            locationUser: locationUser,
            region: {
                latitude: locationUser.wherelatitude,
                longitude: locationUser.wherelongitude,
                latitudeDelta: 0.0143,
                longitudeDelta: 0.0134
            },
        })
        this.sessionToken = uuidv4();
        this.getSavedLocations()
    }

    //Seleciona o novo endereço de partida do passageiro
    pickupLocation(details) {
        let pickupData = {
            pickupLat: details.geometry.location.lat,
            pickupLng: details.geometry.location.lng,
            whereText: details.formatted_address
        }

        this.setState({ pickupData: pickupData })
    }

    goMap(details, savedLocation, setLocationMap) {
        let dataDetails = {}

        if (savedLocation) {
            dataDetails = this.state.dataDetails;
            dataDetails.droplatitude = this.state.locationCasa.lat
            dataDetails.droplongitude = this.state.locationCasa.lng
            dataDetails.droptext = this.state.locationCasa.add
        }
        else if (setLocationMap) {
            dataDetails = this.state.dataDetails;
            dataDetails.droplatitude = setLocationMap.geometry.location.lat
            dataDetails.droplongitude = setLocationMap.geometry.location.lng
            dataDetails.droptext = setLocationMap.formatted_address
        }
        else {
            dataDetails = this.state.dataDetails;
            dataDetails.droplatitude = details.geometry.location.lat
            dataDetails.droplongitude = details.geometry.location.lng
            dataDetails.droptext = details.formatted_address
        }

        dataDetails.wherelatitude = this.state.pickupData ? this.state.pickupData.pickupLat : this.state.locationUser.wherelatitude
        dataDetails.wherelongitude = this.state.pickupData ? this.state.pickupData.pickupLng : this.state.locationUser.wherelongitude
        dataDetails.whereText = this.state.pickupData ? this.state.pickupData.whereText : this.state.locationUser.whereText

        this.props.navigation.replace('FareDetails', { data: dataDetails });
    }


    getSavedLocations() {
        var curuser = firebase.auth().currentUser.uid;
        firebase.database().ref('users/' + curuser + '/savedLocations').on('value', snap => {
            if (snap.val()) {
                let locationCasa = {}
                locationCasa.lat = snap.val().lat,
                    locationCasa.lng = snap.val().lng,
                    locationCasa.add = snap.val().add,

                    this.setState({
                        locationCasa: locationCasa
                    })
            } else {
                this.setState({
                    locationCasa: null
                })
            }
        })

        this.setState({ showSetAddress: false })
    }

    saveAddress(data, details) {
        if (details) {
            let locationCasa = {}
            locationCasa.lat = details.geometry.location.lat,
                locationCasa.lng = details.geometry.location.lng,
                locationCasa.add = details.formatted_address

            var curuser = firebase.auth().currentUser.uid;
            firebase.database().ref('users/' + curuser + '/').update({
                savedLocations: locationCasa
            })
        }
        this.getSavedLocations()
    }

    deleteSavedLocation() {
        firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/savedLocations/').remove().then(() => {
            this.searchModal.setAddressText("")
        })
    }

    setAddressModal() {
        return (
            <Modal
                animationType="slide"
                transparent={true}
                visible={this.state.showSetAddress}
            >
                <View style={{ flex: 1, backgroundColor: colors.WHITE }}>
                    <View style={styles.IconTextTopModal}>
                        <TouchableOpacity style={styles.iconBackModal} onPress={() => { this.setState({ showSetAddress: false }) }}>
                            <Icon
                                name='md-close'
                                type='ionicon'
                                color={colors.BLACK}
                                size={35}
                            />
                        </TouchableOpacity>
                        <Text style={{ fontFamily: 'Inter-Bold', fontSize: 20 }}> Adicionar endereço </Text>
                    </View>

                    <View style={{ backgroundColor: colors.GREY1, height: 1, width: width - 20, alignSelf: 'center', top: this.state.locationCasa ? 90 : 80 }} />
                    <View style={{ flexDirection: 'row', alignItems: 'center', top: Platform.OS == 'ios' ? 20 : 20 }}>
                        <Icon
                            name='ios-home'
                            type='ionicon'
                            color={colors.BLACK}
                            size={25}
                            containerStyle={{ position: 'absolute', left: 22 }}
                        />

                        <GooglePlacesAutocomplete
                            ref={(ref) => { this.searchModal = ref; }}
                            placeholder='Procurar'
                            enablePoweredByContainer={false}
                            minLength={2}
                            autoFocus={true}
                            returnKeyType={'search'} // Can be left out for default return key https://facebook.github.io/react-native/docs/textinput.html#returnkeytype
                            listViewDisplayed={this.state.modalFocused}
                            fetchDetails={true}
                            numberOfLines={15}
                            suppressDefaultStyles={true}

                            textInputProps={{
                                onFocus: () => { },
                                onBlur: () => { },
                                autoCapitalize: "none",
                                autoCorrect: false,
                            }}

                            onPress={(data, details = null) => { // 'details' is provided when fetchDetails = true
                                this.saveAddress(data, details);
                            }}

                            renderDescription={(row) => row.formatted_address || row.description || row.name}

                            renderRightButton={() => {
                                return (
                                    Platform.OS == "android" ?
                                        this.state.modalFocused ?
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

                            getDefaultValue={() => this.state.locationCasa ? this.state.locationCasa.add : ''}
                            query={{
                                // available options: https://developers.google.com/places/web-service/autocomplete
                                key: google_map_key,
                                language: 'pt-BR', // language of the results
                                type: ['(regions)'],
                                components: "country:br", // country name
                                location: this.state.locationUser.wherelatitude + ',' + this.state.locationUser.wherelongitude,
                                //strictbounds : true,
                                sessiontoken: this.sessionToken,
                                radius: 15000
                            }}
                            //predefinedPlaces={[homePlace, workPlace]}
                            //predefinedPlacesAlwaysVisible={false}

                            styles={{
                                container: {
                                    width: width,
                                },
                                textInputContainer: {
                                    backgroundColor: colors.GREY.background,
                                    //backgroundColor: colors.RED,
                                    marginRight: 45,
                                    paddingLeft: 8,
                                    fontSize: 18,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    borderRadius: 5,
                                    marginHorizontal: 40,
                                    left: 20
                                },
                                textInput: {
                                    //backgroundColor: colors.BLACK,
                                    height: 35,
                                    fontFamily: 'Inter-Medium',
                                    fontSize: width < 375 ? 14 : 16,
                                    paddingTop: 4,
                                    paddingBottom: 4,
                                    paddingRight: Platform.OS == "ios" ? 7 : 32,
                                    flex: 1
                                },
                                listView: {
                                    position: 'absolute',
                                    top: Platform.OS == 'ios' ? 75 : 75,
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
                            nearbyPlacesAPI='GooglePlacesSearch' // Which API to use: GoogleReverseGeocoding or GooglePlacesSearch
                            GoogleReverseGeocodingQuery={{
                                // available options for GoogleReverseGeocoding API : https://developers.google.com/maps/documentation/geocoding/intro
                                key: google_map_key,
                                language: 'pt-BR',
                                region: '.br',
                            }}
                            GooglePlacesDetailsQuery={{
                                region: '.br',
                                sessiontoken: this.sessionToken,
                            }}
                            //filterReverseGeocodingByTypes={['locality', 'administrative_area_level_3']}
                            GooglePlacesSearchQuery={{
                                // available options for GooglePlacesSearch API : https://developers.google.com/places/web-service/search
                                rankby: 'distance',
                            }}

                            debounce={50} // debounce the requests in ms. Set to 0 to remove debounce. By default 0ms.
                        >

                        </GooglePlacesAutocomplete>
                    </View>
                    {this.state.locationCasa != null ?
                        <TouchableOpacity style={{ top: Platform.OS == 'ios' ? 30 : 25, alignSelf: 'center' }} onPress={() => { this.deleteSavedLocation() }}>
                            <Text style={{ fontFamily: 'Inter-Bold', color: colors.RED, fontSize: width < 375 ? 15 : 16 }}> Excluir </Text>
                        </TouchableOpacity>
                        : null}
                </View>
            </Modal>
        )
    }

    selectLocation(params) {
        if (params == 'pickup') {
            this.setState({ selectOnMap: false, searchFocused: false })
            this.pickupLocation(this.state.jsonResults)
        }
        else if (params == 'drop') {
            this.setState({ selectOnMap: false })
            this.goMap(false, false, this.state.jsonResults)
        }
    }

    onMapSelect = () => {
        this.setState({ selectOnMap: true })
    }

    getAddreesSelectMap(params) {
        fetch('https://maps.googleapis.com/maps/api/geocode/json?latlng=' + params + '&key=' + google_map_key)
            .then((response) => response.json())
            .then((responseJson) => {
                console.log(responseJson.results[0].formatted_address)
                this.setState({ jsonResults: responseJson.results[0], addressSelected: responseJson.results[0].formatted_address })
                this.locationSelected = {
                    add: responseJson.results[0].formatted_address,
                    lat: responseJson.results[0].geometry.location.lat,
                    lng: responseJson.results[0].geometry.location.lng,
                }
            })
    }

    clearInput(params) {
        params.setAddressText("")
    }

    goBack = () => {
        this.props.navigation.goBack()
    }

    render() {
        return (
            <View style={styles.mainView}>
                {this.state.selectOnMap ?
                    <View style={{ flex: 1 }}>

                        <MapView
                            provider={PROVIDER_GOOGLE}
                            showsUserLocation={true}
                            ref={(ref) => this.mapView = ref}
                            loadingEnabled
                            showsMyLocationButton={false}
                            style={styles.map}
                            initialRegion={this.state.region}
                            onRegionChangeComplete={(value) => { this.getAddreesSelectMap(value.latitude + ',' + value.longitude) }}
                            enablePoweredByContainer={false}
                            showsCompass={false}
                            showsScale={false}
                            rotateEnabled={false}
                            customMapStyle={mapStyleAndroid}
                        />
                        <BtnVoltar style={{ backgroundColor: colors.WHITE, position: 'absolute', left: 0, marginLeft: 15, top: Platform.OS == 'ios' ? 45 : 20 }} btnClick={() => { this.setState({ selectOnMap: false }) }} />
                        <View style={{ width: 41, height: 60, position: 'absolute', top: (height / 2) - 60, left: (width / 2) - 20, justifyContent: 'center', alignItems: 'center' }}  >
                            <Pulse
                                size={100}
                                color={this.state.searchFocused ? colors.DEEPBLUE : colors.RED}
                                style={{ top: -10 }}
                            />
                            {this.state.searchFocused ?
                                <SelectLocationPickup
                                    style={{
                                        position: 'absolute',
                                        shadowColor: '#000',
                                        shadowOffset: { x: 0, y: 5 },
                                        shadowOpacity: 0.1,
                                        shadowRadius: 5,
                                    }} />
                                :
                                <SelectLocationDrop
                                    style={{
                                        position: 'absolute',
                                        shadowColor: '#000',
                                        shadowOffset: { x: 0, y: 5 },
                                        shadowOpacity: 0.1,
                                        shadowRadius: 5,
                                    }} />
                            }
                        </View>
                        <View style={{ position: 'absolute', alignSelf: 'center', bottom: 265, backgroundColor: colors.WHITE, borderWidth: 1, borderColor: colors.DEEPBLUE, height: 35, width: width - 30, borderRadius: 50, justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{ fontFamily: 'Inter-Medium', paddingHorizontal: 2 }}> Certifique-se de aguardar o motorista no local indicado! </Text>
                        </View>
                        <View style={{ backgroundColor: colors.WHITE, height: 250, width: width, position: 'absolute', bottom: 0 }}>
                            <Text style={{ fontFamily: 'Inter-Bold', fontSize: 18, marginTop: 15, marginLeft: 15 }}>Confirmar local {this.state.searchFocused ? 'de partida' : 'de destino'}</Text>
                            <View style={{ height: 1, width: width - 30, backgroundColor: colors.GREY1, alignSelf: 'center', marginTop: 20 }} />
                            <View>
                                <Text style={{ alignSelf: 'flex-start', fontFamily: 'Inter-Bold', fontSize: 20, marginLeft: 10, marginVertical: 30 }}> {this.state.addressSelected ? this.state.addressSelected.split('-')[0] : null} </Text>
                                <TouchableOpacity onPress={() => { this.selectLocation(this.state.searchFocused ? 'pickup' : 'drop') }} style={{ alignItems: 'center', justifyContent: 'center', marginHorizontal: 70, backgroundColor: colors.DEEPBLUE, borderRadius: 50, height: 50 }}>
                                    <Text style={{ fontFamily: 'Inter-Bold', fontSize: 19, color: colors.WHITE }}> Confirmar </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                    </View>
                    :
                    <View>
                        <View style={styles.IconTextTop}>
                            <BtnVoltar style={{ backgroundColor: colors.WHITE, position: 'absolute', left: 0, marginLeft: 10, marginBottom: 5 }} btnClick={this.goBack} />
                            <TouchableOpacity onPress={() => { this.setState({ selectOnMap: true }) }} style={{ position: 'absolute', height: 30, right: 0, marginRight: 35, flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={{ fontFamily: 'Inter-Bold', fontSize: 18, }}>Selecionar no mapa</Text>
                                <Icon
                                    name='ios-pin'
                                    type='ionicon'
                                    color={colors.DARK}
                                    size={20}
                                    containerStyle={{ left: 10, }}
                                />
                            </TouchableOpacity>
                        </View>

                        <View style={{ position: 'absolute', left: 20, top: Platform.OS == 'ios' ? 102 : 75, flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                            <LocationUser width={25} height={25} />
                            <View style={{ backgroundColor: colors.DEEPBLUE, height: 40, width: 2 }} />
                            <LocationDrop style={{ top: -5 }} width={23} height={23} />
                        </View>
                        <View style={{ justifyContent: 'center', alignSelf: 'center', width: width, height: 1, backgroundColor: colors.GREY1, position: 'absolute', top: Platform.OS == 'ios' ? 200 : 180 }} />

                        <GooglePlacesAutocomplete
                            ref={(ref) => { this.searchPickup = ref; }}
                            placeholder='Local de partida'
                            enablePoweredByContainer={false}
                            minLength={2} // minimum length of text to search
                            autoFocus={false}
                            returnKeyType={'search'} // Can be left out for default return key https://facebook.github.io/react-native/docs/textinput.html#returnkeytype
                            listViewDisplayed={this.state.searchFocused}  // true/false/undefined
                            fetchDetails={true}
                            numberOfLines={1}
                            suppressDefaultStyles={true}
                            predefinedPlacesAlwaysVisible={false}

                            textInputProps={{
                                onFocus: () => { this.setState({ searchFocused: true }) },
                                onBlur: () => { this.setState({ searchFocused: false }) },
                                autoCapitalize: "none",
                                autoCorrect: false,
                            }}

                            onPress={(data, details = null) => { // 'details' is provided when fetchDetails = true
                                this.setState({ searchFocused: false })
                                this.pickupLocation(details);
                            }}

                            renderDescription={(row) => row.formatted_address || row.description || row.name}

                            renderRightButton={() => {
                                return (
                                    Platform.OS == "android" ?
                                        this.state.searchFocused ?
                                            <TouchableOpacity style={{ position: 'absolute', alignItems: 'center', right: 10 }} onPress={() => { this.clearInput(this.searchPickup) }}>
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
                                        <Text numberOfLines={1} style={{ marginLeft: 8, fontFamily: 'Inter-Medium', fontSize: 18, color: colors.BLACK }}> {row.description.split("-", 2)[0]} </Text>
                                        <Text numberOfLines={1} style={{ marginLeft: 8, opacity: 0.5, fontFamily: 'Inter-Regular', fontSize: 14 }}> {row.description}</Text>
                                    </View>
                                </View>
                            }

                            getDefaultValue={() => this.state.pickupData ? this.state.pickupData.whereText : this.state.locationUser.whereText}
                            query={{
                                // available options: https://developers.google.com/places/web-service/autocomplete
                                key: google_map_key,
                                language: 'pt-BR', // language of the results
                                type: ['(regions)'],
                                rankby: 'distance',
                                components: "country:br", // country name
                                location: this.state.locationUser.wherelatitude + ',' + this.state.locationUser.wherelongitude,
                                //strictbounds : true,
                                radius: 15000,
                                sessiontoken: this.sessionToken,
                            }}

                            styles={{
                                container: {
                                    position: 'absolute',
                                    width: width,
                                    top: Platform.OS == "ios" ? 100 : 70
                                },
                                textInputContainer: {
                                    justifyContent: 'center',
                                    marginHorizontal: 40,
                                    backgroundColor: colors.GREY.background,
                                    marginRight: 45,
                                    paddingBottom: Platform.OS == "ios" ? 8 : 4,
                                    paddingTop: Platform.OS == "ios" ? 8 : 4,
                                    paddingLeft: 8,
                                    borderRadius: 5,
                                    left: 15,
                                    zIndex: 2
                                },
                                textInput: {
                                    fontFamily: 'Inter-Medium',
                                    fontSize: width < 375 ? 14 : 16,
                                    paddingTop: 2,
                                    paddingBottom: 2,
                                    paddingRight: Platform.OS == "ios" ? 7 : 32,
                                },
                                listView: {
                                    backgroundColor: colors.WHITE,
                                    width: width,
                                    marginTop: 80,
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
                                    opacity: 0.8,
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
                            GooglePlacesSearchQuery={{
                                // available options for GooglePlacesSearch API : https://developers.google.com/places/web-service/search
                                rankby: 'distance',
                            }}

                            debounce={200} // debounce the requests in ms. Set to 0 to remove debounce. By default 0ms.
                        >

                        </GooglePlacesAutocomplete>

                        <GooglePlacesAutocomplete
                            ref={(ref) => { this.searchDrop = ref; }}
                            placeholder='Local de destino'
                            enablePoweredByContainer={false}
                            minLength={2}
                            autoFocus={this.state.searchFocused2}
                            returnKeyType={'search'} // Can be left out for default return key https://facebook.github.io/react-native/docs/textinput.html#returnkeytype
                            listViewDisplayed={this.state.searchFocused2}
                            fetchDetails={true}
                            numberOfLines={1}
                            suppressDefaultStyles={true}
                            enableHighAccuracyLocation={true}

                            /*listEmptyComponent={
                                <View style={{ backgroundColor: colors.WHITE }}>
                                    <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                                        <Text style={{ fontFamily: 'Inter-Bold', fontSize: 18, color: colors.GREY1 }}> Nenhum resultado encontrado. </Text>
                                    </View>
                                </View>
                            }*/

                            renderRightButton={() => {
                                return (
                                    Platform.OS == "android" ?
                                        this.state.searchFocused2 ?
                                            <TouchableOpacity style={{ position: 'absolute', alignItems: 'center', right: 10 }} onPress={() => { this.clearInput(this.searchDrop) }}>
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

                            textInputProps={{
                                onFocus: () => { this.setState({ searchFocused2: true }) },
                                onBlur: () => { this.setState({ searchFocused2: false }) },
                                autoCapitalize: "none",
                                autoCorrect: false,
                            }}

                            onPress={(data, details = null) => { // 'details' is provided when fetchDetails = true
                                this.setState({ searchFocused2: false })
                                this.goMap(details, false, false);
                            }}

                            //renderDescription={(row) => row.formatted_address || row.description || row.name}

                            renderRow={(row) =>
                                <View style={{ paddingTop: 7, paddingBottom: 7, flexDirection: 'row', alignItems: 'center' }}>
                                    <Icon
                                        name='ios-pin'
                                        type='ionicon'
                                        size={15}
                                        containerStyle={{ marginLeft: 10, opacity: 0.5 }}
                                    />
                                    <View style={{ flexDirection: 'column' }}>
                                        <Text numberOfLines={1} style={{ marginLeft: 8, fontFamily: 'Inter-Medium', fontSize: 18, color: colors.BLACK }}> {row.description.split("-", 2)[0]} </Text>
                                        <Text numberOfLines={1} style={{ marginLeft: 8, opacity: 0.5, fontFamily: 'Inter-Regular', fontSize: 14 }}> {row.description}</Text>
                                    </View>
                                </View>
                            }

                            getDefaultValue={() => ''}
                            query={{
                                // available options: https://developers.google.com/places/web-service/autocomplete
                                key: google_map_key,
                                language: 'pt-BR', // language of the results
                                type: ['(regions)'],
                                rankby: 'distance',
                                components: "country:br", // country name
                                location: this.state.locationUser.wherelatitude + ',' + this.state.locationUser.wherelongitude,
                                //strictbounds : true,
                                radius: 15000,
                                sessiontoken: this.sessionToken,
                            }}
                            //predefinedPlaces={[homePlace, workPlace]}
                            //predefinedPlacesAlwaysVisible={false}

                            styles={{
                                container: {
                                    position: 'absolute',
                                    width: width,
                                    top: Platform.OS == "ios" ? 155 : 130,
                                },
                                textInputContainer: {
                                    justifyContent: 'center',
                                    backgroundColor: colors.GREY.background,
                                    marginRight: 45,
                                    paddingBottom: Platform.OS == "ios" ? 8 : 4,
                                    paddingTop: Platform.OS == "ios" ? 8 : 4,
                                    paddingLeft: 8,
                                    borderRadius: 5,
                                    marginHorizontal: 40,
                                    left: 15
                                },
                                textInput: {
                                    fontFamily: 'Inter-Medium',
                                    fontSize: width < 375 ? 14 : 16,
                                    paddingTop: 2,
                                    paddingBottom: 2,
                                    paddingRight: Platform.OS == "ios" ? 7 : 32,
                                },
                                listView: {
                                    //position: 'absolute',
                                    top: 20,
                                    backgroundColor: colors.WHITE,
                                },
                                description: {
                                    paddingLeft: 20,
                                    paddingRight: 20,
                                },
                                row: {
                                    paddingTop: 15,
                                    paddingBottom: 15,
                                    paddingLeft: 10,
                                    paddingRight: 10,
                                    height: width < 375 ? 50 : 60,
                                    justifyContent: 'center',
                                    borderBottomWidth: 2,
                                    borderBottomColor: colors.GREY.background,
                                    opacity: 0.8,
                                },
                                predefinedPlacesDescription: {
                                    color: colors.RED,
                                    fontFamily: 'Inter-Bold',
                                    fontSize: 18,
                                },
                                loader: {
                                    flexDirection: 'row',
                                    justifyContent: 'flex-end',
                                    height: 20,
                                },
                            }}

                            //currentLocation={true} // Will add a 'Current location' button at the top of the predefined places list
                            //currentLocationLabel="Localização atual"

                            nearbyPlacesAPI='GooglePlacesSearch' // Which API to use: GoogleReverseGeocoding or GooglePlacesSearch
                            GoogleReverseGeocodingQuery={{
                                // available options for GoogleReverseGeocoding API : https://developers.google.com/maps/documentation/geocoding/intro
                                key: google_map_key,
                                language: 'pt-BR',
                                region: '.br',
                            }}
                            GooglePlacesSearchQuery={{
                                // available options for GooglePlacesSearch API : https://developers.google.com/places/web-service/search
                                rankby: 'distance',
                                key: google_map_key,
                                radius: 15000,
                                location: this.state.locationUser.wherelatitude + ',' + this.state.locationUser.wherelongitude,


                                language: 'pt-BR', // language of the results
                                type: ['(regions)'],
                                sessiontoken: this.sessionToken,
                            }}

                            debounce={50} // debounce the requests in ms. Set to 0 to remove debounce. By default 0ms.
                        >

                        </GooglePlacesAutocomplete>

                        {!this.state.searchFocused2 && !this.state.searchFocused ?
                            <View style={styles.viewPrincipal}>
                                <TouchableOpacity onPress={() => this.state.locationCasa != null ? this.goMap(null, true, false) : this.setState({ showSetAddress: true })}>
                                    <View style={styles.addCasa}>
                                        <Icon
                                            name='ios-home'
                                            type='ionicon'
                                            color={colors.DARK}
                                            size={20}
                                            containerStyle={{ left: 10, }}
                                        />
                                        {this.state.locationCasa != null ?
                                            <View style={{ width: width, flexDirection: 'row', alignItems: 'center' }}>
                                                <Text numberOfLines={1} style={{ maxWidth: width - 110, left: 15, fontFamily: 'Inter-Regular', fontSize: 15, opacity: 0.5 }}> {this.state.locationCasa.add} </Text>
                                                <TouchableOpacity style={{ position: 'absolute', right: 55 }} onPress={() => { this.setState({ showSetAddress: true, modalFocused: true }) }}>
                                                    <Icon
                                                        name='edit'
                                                        type='MaterialIcons'
                                                        color={colors.BLACK}
                                                        size={25}
                                                        containerStyle={{ opacity: 0.7 }}
                                                    />
                                                </TouchableOpacity>
                                            </View>
                                            :
                                            <Text style={{ left: 15, fontFamily: 'Inter-Regular', fontSize: width < 375 ? 17 : 19, opacity: 0.3 }}> Salvar endereço </Text>
                                        }
                                    </View>
                                </TouchableOpacity>
                            </View>
                            : null}
                        {
                            this.setAddressModal()
                        }
                    </View>
                }
            </View>
        );
    }
}

const styles = StyleSheet.create({
    mainView: {
        flex: 1,
        backgroundColor: colors.WHITE,
    },
    map: {
        flex: 1,
        ...StyleSheet.absoluteFillObject,
    },
    viewTop: {
        width: width,
        backgroundColor: colors.WHITE,
        flexDirection: 'column',
        elevation: 10,
        shadowColor: colors.BLACK,
        shadowOpacity: 0.4,
        shadowOffset: { x: 0, y: 0 },
        shadowRadius: 8,

    },
    IconTextTop: {
        marginTop: Platform.OS == "ios" ? 60 : 30,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center'
    },
    iconBack: {
        marginLeft: 10,
    },

    viewInputs: {
        flexDirection: 'row',
        marginTop: 15,
        flex: 6
    },
    viewPrincipal: {
        position: 'absolute',
        top: Platform.OS == 'ios' ? 210 : 190,
        width: width - 30,
        borderBottomWidth: 1,
        borderBottomColor: colors.GREY2,
        alignSelf: 'center'
    },
    addCasa: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 50,
    },

    ///MODAL
    viewTopModal: {
        width: width,
        backgroundColor: colors.WHITE,
        flexDirection: 'column',
        elevation: 10,
        shadowColor: colors.BLACK,
        shadowOpacity: 0.4,
        shadowOffset: { x: 0, y: 0 },
        shadowRadius: 8,
        height: 170,
        zIndex: 1,
    },
    iconBackModal: {
        position: 'absolute',
        right: 25,
    },
    IconTextTopModal: {
        marginTop: Platform.OS == "ios" ? 50 : 10,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },

})