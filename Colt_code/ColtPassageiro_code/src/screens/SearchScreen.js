import React, { Component } from 'react';
import { Platform, Dimensions, StyleSheet, View, Text, Modal, TouchableOpacity } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import mapStyleAndroid from '../../mapStyleAndroid.json';
import { colors } from '../common/theme';
import { google_map_key } from '../common/key';
import { Icon } from 'react-native-elements';
var { height, width } = Dimensions.get('window');
import * as firebase from 'firebase'

import LocationUser from '../../assets/svg/LocationUser';
import LocationDrop from '../../assets/svg/LocationDrop';

import IconWayPoint from '../../assets/svg/IconWayPoint';
import SelectLocationPickup from '../../assets/svg/SelectLocationPickup';
import SelectLocationDrop from '../../assets/svg/SelectLocationDrop';
import SelectLocationWaypoint from '../../assets/svg/SelectLocationWaypoint';

import BtnVoltar from '../components/BtnVoltar';
import { v4 as uuidv4 } from 'uuid';
import { color } from 'react-native-reanimated';
import { Pulse } from 'react-native-animated-spinkit'
import { StatusBar } from 'react-native';

import SearchAutoComplete from '../components/SearchAutoComplete';

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
            showBtnWaypoint: false
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

    //Seleciona o novo endereço de partida
    pickupLocation(details) {
        let pickupData = {
            pickupLat: details.geometry.location.lat,
            pickupLng: details.geometry.location.lng,
            whereText: details.formatted_address
        }

        this.setState({ pickupData: pickupData })
    }

    //Seleciona o endereço de parada 
    waypointLocation(details) {
        let wayPointData = {
            wayPointLat: details.geometry.location.lat,
            wayPointLng: details.geometry.location.lng,
            wayPointText: details.formatted_address.split(',')[0] + details.formatted_address.split(',')[1]
        }

        this.setState({ wayPointData: wayPointData })
    }

    dropLocation(details) {
        let dropData = {
            dropLat: details.geometry.location.lat,
            dropLng: details.geometry.location.lng,
            dropText: details.formatted_address
        }

        this.setState({ dropData: dropData })
    }

    //Caso haja parada e o botao confirmar pressionado, ele vai pra proxima tela 
    goMapWaypoint() {
        if (this.state.showBtnWaypoint) {
            if (!this.state.wayPointData || !this.state.dropData) {
                alert("Os campos de endereço precisam estar preenchidos!")
            }
            else {
                let dataDetails = {
                    wherelatitude: this.state.pickupData ? this.state.pickupData.pickupLat : this.state.locationUser.wherelatitude,
                    wherelongitude: this.state.pickupData ? this.state.pickupData.pickupLng : this.state.locationUser.wherelongitude,
                    whereText: this.state.pickupData ? this.state.pickupData.whereText : this.state.locationUser.whereText,

                    waypointLat: this.state.wayPointData.wayPointLat,
                    waypointLng: this.state.wayPointData.wayPointLng,
                    waypointText: this.state.wayPointData.wayPointText,

                    droplatitude: this.state.dropData.dropLat,
                    droplongitude: this.state.dropData.dropLng,
                    droptext: this.state.dropData.dropText
                }

                this.props.navigation.replace('FareDetails', { data: dataDetails, waypoint: true })
            }
        }
        else {
            if (!this.state.dropData) {
                alert("Os campos de endereço precisam estar preenchidos!")
            }
            else {

                let dataDetails = {
                    wherelatitude: this.state.pickupData ? this.state.pickupData.pickupLat : this.state.locationUser.wherelatitude,
                    wherelongitude: this.state.pickupData ? this.state.pickupData.pickupLng : this.state.locationUser.wherelongitude,
                    whereText: this.state.pickupData ? this.state.pickupData.whereText : this.state.locationUser.whereText,

                    droplatitude: this.state.dropData.dropLat,
                    droplongitude: this.state.dropData.dropLng,
                    droptext: this.state.dropData.dropText
                }

                this.props.navigation.replace('FareDetails', { data: dataDetails, waypoint: false })
            }
        }
    }

    //Caso n haja endereço de parada, vai direto pra proxima tela sem botao de confirmar
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

        this.props.navigation.replace('FareDetails', { data: dataDetails, waypoint: false });
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
                            raised={true}
                            size={20}
                            containerStyle={{ position: 'absolute', left: 3 }}
                        />

                        <SearchAutoComplete
                            locationCasa={this.state.locationCasa}
                            showBtnDelete={true}
                            modalFocused={this.state.modalFocused}
                            onPressSearch={(data, detalhes) => { this.saveAddress(data, detalhes) }}
                            DefaultValue={this.state.locationCasa ? this.state.locationCasa.add : ''}
                            locationUser={[this.state.locationUser.wherelatitude, this.state.locationUser.wherelongitude]}
                            sessionToken={this.sessionToken}
                            stylesProps={{
                                container: {
                                    width: width,
                                },
                                textInputContainer: {
                                    backgroundColor: colors.GREY.background,
                                    //backgroundColor: colors.RED,
                                    marginRight: 45,
                                    paddingLeft: 10,
                                    fontSize: 18,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    borderRadius: 5,
                                    marginHorizontal: 45,
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
                        />

                    </View>
                </View>
            </Modal>
        )
    }

    selectLocation(params) {
        if (this.state.showBtnConfirmar) {
            if (params == 'pickup') {
                this.setState({ selectOnMap: false, searchFocused: false })
                this.pickupLocation(this.state.jsonResults)
            }
            else if (params == 'waypoint') {
                this.setState({ selectOnMap: false })
                this.waypointLocation(this.state.jsonResults)
            }
            else if (params == 'drop') {
                this.setState({ selectOnMap: false })
                this.dropLocation(this.state.jsonResults)
            }
        }
        else {
            if (params == 'pickup') {
                this.setState({ selectOnMap: false, searchFocused: false })
                this.pickupLocation(this.state.jsonResults)
            }
            else if (params == 'drop') {
                this.setState({ selectOnMap: false })
                this.goMap(false, false, this.state.jsonResults)
            }
        }
    }

    onMapSelect = () => {
        this.setState({ selectOnMap: true })
    }

    getAddreesSelectMap(params) {
        fetch('https://maps.googleapis.com/maps/api/geocode/json?latlng=' + params + '&key=' + google_map_key)
            .then((response) => response.json())
            .then((responseJson) => {
                this.setState({ jsonResults: responseJson.results[0], addressSelected: responseJson.results[0].formatted_address })
                /*this.locationSelected = {
                    add: responseJson.results[0].formatted_address,
                    lat: responseJson.results[0].geometry.location.lat,
                    lng: responseJson.results[0].geometry.location.lng,
                }*/
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
                        <BtnVoltar style={styles.btnVoltar} btnClick={() => { this.setState({ selectOnMap: false, searchFocused: false, searchFocused2: false, searchFocused3: false }) }} />
                        <View style={styles.viewIconsMap}>
                            <Pulse
                                size={100}
                                color={this.state.searchFocused ? colors.DEEPBLUE : this.state.searchFocused3 ? colors.DARK : colors.GREY2}
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
                                this.state.searchFocused3 ?
                                    <SelectLocationWaypoint
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
                                            top: -3,
                                            shadowColor: '#000',
                                            shadowOffset: { x: 0, y: 5 },
                                            shadowOpacity: 0.1,
                                            shadowRadius: 5,
                                        }} />
                            }
                        </View>
                        <View style={styles.viewInfoMap}>
                            <Text style={{ fontFamily: 'Inter-Medium', paddingHorizontal: 2 }}> Certifique-se de aguardar o motorista no local indicado! </Text>
                        </View>
                        <View style={styles.viewBottomMap}>
                            <Text style={styles.txtConfirmarMap}> Confirmar local {this.state.searchFocused ? 'de partida' : this.state.searchFocused3 ? 'de parada' : 'de destino'}</Text>
                            <View style={styles.viewLine} />
                            <View>
                                <Text style={styles.txtAdressMap}> {this.state.addressSelected ? this.state.addressSelected.split('-')[0] : null} </Text>
                                <TouchableOpacity style={styles.btnConfirmar} onPress={() => {
                                    this.selectLocation(this.state.searchFocused ? 'pickup' : this.state.searchFocused3 ? 'waypoint' : 'drop')
                                }}>
                                    <Text style={styles.txtConfirmar}> Confirmar </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                    :
                    <View>
                        <View style={styles.IconTextTop}>
                            <BtnVoltar style={{ backgroundColor: colors.WHITE, position: 'absolute', left: 0, marginLeft: 10, marginBottom: 5 }} btnClick={this.goBack} />
                            <TouchableOpacity style={styles.btnSelectMap} onPress={() => { this.setState({ selectOnMap: true }) }}>
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

                        <View style={styles.viewIconsAdress}>
                            <LocationUser width={25} height={25} />
                            <View style={[styles.viewLineIcons, { height: this.state.showBtnWaypoint ? 90 : 40 }]} />
                            {this.state.showBtnWaypoint ?
                                <IconWayPoint
                                    width={15}
                                    height={14}
                                    style={{ position: 'absolute' }}
                                />
                                : null}
                            <LocationDrop style={{ top: -5 }} width={this.state.showBtnWaypoint ? 28 : 23} height={this.state.showBtnWaypoint ? 28 : 23} />
                        </View>
                        <View style={{
                            justifyContent: 'center',
                            alignSelf: 'center',
                            width: width,
                            height: 1,
                            backgroundColor: colors.GREY1,
                            position: 'absolute',
                            top: Platform.OS == 'ios' ? this.state.showBtnWaypoint ? 260 : 200 : this.state.showBtnWaypoint ? 240 : 180
                        }}
                        />

                        <SearchAutoComplete
                            placeholder={'Local de partida'}
                            locationCasa={this.state.locationCasa}
                            showBtnDelete={false}
                            modalFocused={this.state.searchFocused}
                            onPressSearch={(data, details) => {
                                this.setState({ searchFocused: false }),
                                    this.pickupLocation(details)
                            }}
                            DefaultValue={this.state.pickupData ? this.state.pickupData.whereText : this.state.locationUser.whereText}
                            locationUser={[this.state.locationUser.wherelatitude, this.state.locationUser.wherelongitude]}
                            sessionToken={this.sessionToken}
                            onFocus={() => { this.setState({ searchFocused: true }) }}
                            onBlur={() => { this.setState({ searchFocused: false }) }}
                            stylesProps={{
                                container: {
                                    position: 'absolute',
                                    width: width,
                                    top: Platform.OS == "ios" ? 37 : 25
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
                                    left: 5,
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
                                    marginTop: this.state.showBtnWaypoint ? 140 : 80,
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
                        />

                        {
                            this.state.showBtnWaypoint ?
                                <SearchAutoComplete
                                    placeholder={'Local de parada'}
                                    showBtnDelete={false}
                                    modalFocused={this.state.searchFocused3}
                                    onPressSearch={(data, details) => { this.setState({ searchFocused3: false }), this.waypointLocation(details) }}
                                    DefaultValue={this.state.wayPointData ? this.state.wayPointData.wayPointText : ''}
                                    locationUser={[this.state.locationUser.wherelatitude, this.state.locationUser.wherelongitude]}
                                    sessionToken={this.sessionToken}
                                    onFocus={() => { this.setState({ searchFocused3: true }) }}
                                    onBlur={() => { this.setState({ searchFocused3: false }) }}
                                    stylesProps={{
                                        container: {
                                            position: 'absolute',
                                            width: width,
                                            top: Platform.OS == "ios" ? 95 : 80
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
                                            left: 5,
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
                                />
                                : null
                        }

                        <SearchAutoComplete
                            placeholder={'Local de destino'}
                            locationCasa={this.state.locationCasa}
                            showBtnDelete={false}
                            modalFocused={this.state.searchFocused2}
                            onPressSearch={(data, details) => {
                                this.setState({ searchFocused2: false }),
                                    !this.state.showBtnConfirmar ? this.goMap(details, false, false) : this.dropLocation(details)
                            }}
                            DefaultValue={this.state.showBtnConfirmar && this.state.dropData ? this.state.dropData.dropText : ''}
                            locationUser={[this.state.locationUser.wherelatitude, this.state.locationUser.wherelongitude]}
                            sessionToken={this.sessionToken}
                            onFocus={() => { this.setState({ searchFocused2: true }) }}
                            onBlur={() => { this.setState({ searchFocused2: false }) }}
                            stylesProps={{
                                container: {
                                    position: 'absolute',
                                    width: width,
                                    top: Platform.OS == "ios" ? this.state.showBtnWaypoint ? 150 : 95 : this.state.showBtnWaypoint ? 139 : 86,
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
                                    left: 5
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
                        />

                        
                        {/*<TouchableOpacity onPress={() => this.setState({ showBtnConfirmar: true, showBtnWaypoint: !this.state.showBtnWaypoint })} style={{ position: 'absolute', right: 20, top: Platform.OS == "ios" ? 152 : 130, }}>
                            <Icon
                                name={this.state.showBtnWaypoint ? 'ios-close' : 'ios-add'}
                                type='ionicon'
                                color={this.state.showBtnWaypoint ? colors.RED : colors.DEEPBLUE}
                                size={40}
                                containerStyle={{ left: 8 }}
                            />
                        </TouchableOpacity>*/}
                        


                        {!this.state.searchFocused && !this.state.searchFocused2 && !this.state.searchFocused3 && !this.state.showBtnWaypoint ?
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
                {
                    this.state.showBtnConfirmar && !this.state.selectOnMap ?
                        <TouchableOpacity style={styles.btnConfirmarAdress} onPress={() => { this.goMapWaypoint() }}>
                            <Text style={styles.txtBtnConfirmar}> Confirmar endereços </Text>
                        </TouchableOpacity>
                        : null
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
        marginTop: Platform.select({ ios: 60, android: StatusBar.currentHeight + 20 }),
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

    btnConfirmarAdress: {
        position: 'absolute',
        bottom: 30,
        alignSelf: 'center',
        backgroundColor: colors.DEEPBLUE,
        height: 50,
        width: width - 70,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center'
    },
    txtBtnConfirmar: {
        fontFamily: 'Inter-Bold',
        color: colors.WHITE,
        fontSize: 16
    },
    btnVoltar: {
        backgroundColor: colors.WHITE,
        position: 'absolute',
        left: 0,
        marginLeft: 15,
        top: Platform.OS == 'ios' ? 45 : 20
    },
    viewIconsMap: {
        width: 41,
        height: 60,
        position: 'absolute',
        top: (height / 2) - 60,
        left: (width / 2) - 20,
        justifyContent: 'center',
        alignItems: 'center'
    },
    viewInfoMap: {
        position: 'absolute',
        alignSelf: 'center',
        bottom: 265,
        backgroundColor: colors.WHITE,
        borderWidth: 1,
        borderColor: colors.DEEPBLUE,
        height: 35,
        width: width - 30,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    viewBottomMap: {
        backgroundColor: colors.WHITE,
        height: 250,
        width: width,
        position: 'absolute',
        bottom: 0
    },
    txtConfirmarMap: {
        fontFamily: 'Inter-Bold',
        fontSize: 18,
        marginTop: 15,
        marginLeft: 15
    },
    txtAdressMap: {
        alignSelf: 'flex-start',
        fontFamily: 'Inter-Bold',
        fontSize: 20,
        marginLeft: 10,
        marginVertical: 30
    },
    viewLine: {
        height: 1,
        width: width - 30,
        backgroundColor: colors.GREY1,
        alignSelf: 'center',
        marginTop: 20
    },
    btnConfirmar: {
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 70,
        backgroundColor: colors.DEEPBLUE,
        borderRadius: 50,
        height: 50
    },
    txtConfirmar: {
        fontFamily: 'Inter-Bold',
        fontSize: 19,
        color: colors.WHITE
    },
    btnSelectMap: {
        position: 'absolute',
        height: 30,
        right: 0,
        marginRight: 35,
        flexDirection: 'row',
        alignItems: 'center'
    },
    viewIconsAdress: {
        position: 'absolute',
        left: 13,
        top: Platform.OS == 'ios' ? 102 : 75,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
    },
    viewLineIcons: {
        backgroundColor: colors.DEEPBLUE,
        width: 2
    }
})