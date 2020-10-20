import React, { Component } from 'react';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import IconCarMap from '../../assets/svg/IconCarMap';
import LocationUser from '../../assets/svg/LocationUser';

export default class MapComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            marginBottom: 0,
        }
    }

    render() {
        const { mapRegion, mapStyle, nearby, pickup } = this.props;
        return (
            <MapView.Animated
                provider = {PROVIDER_GOOGLE}
                showsUserLocation = {true}
                loadingEnabled
                showsMyLocationButton = {false}
                style = {[mapStyle, { marginBottom: this.state.marginBottom }]}
                initialRegion = {mapRegion}
                onMapReady = {() => this.setState({ marginBottom: 1 })}
                enablePoweredByContainer = {true}
                showsCompass = {false}
                showsScale = {false}
                rotateEnabled = {false}
                //customMapStyle={mapStyleCustom}
            >
                {nearby ? nearby.map((item, index) => {
                    return (
                        <Marker.Animated
                            coordinate={{ latitude: item.location ? item.location.lat : 0.00, longitude: item.location ? item.location.lng : 0.00 }}
                            key={index}
                            //image={require('../../assets/images/available_car.png')}
                            //tracksViewChanges={this.state.tracksViewChanges}
                        >
                            <IconCarMap
                                width={45}
                                height={45}
                            />
                        </Marker.Animated>
                    )
                })
                    : null}

                {pickup ?
                    <Marker
                        coordinate={{ latitude: (pickup.latitude), longitude: (pickup.longitude) }}
                        //image={require('../../assets/images/markerUser.png')}
                        anchor={{ x: 0, y: 0 }}
                    >
                        <LocationUser
                            width={25}
                            height={25}
                        />
                    </Marker>
                : null}
            </MapView.Animated>
        );
    }
}
