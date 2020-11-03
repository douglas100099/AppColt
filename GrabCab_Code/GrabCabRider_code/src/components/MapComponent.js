import React, { Component } from 'react';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import IconCarMap from '../../assets/svg/IconCarMap';
import { colors } from '../common/theme';
import LocationUser from '../../assets/svg/LocationUser';
import mapStyleJson from '../../mapStyle.json';

export default class MapComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            marginBottom: 0,
        }
    }

    render() {
        const { mapRegion, mapStyle, nearby } = this.props;
        return (
            <MapView.Animated
                provider={PROVIDER_GOOGLE}
                showsUserLocation={true}
                loadingEnabled
                showsMyLocationButton={false}
                style={mapStyle}
                initialRegion={mapRegion}
                onMapReady={() => this.setState({ marginBottom: 1 })}
                enablePoweredByContainer={true}
                showsCompass={false}
                showsScale={false}
                rotateEnabled={false}
                customMapStyle={mapStyleJson}
            >
                {nearby ? nearby.map((item, index) => {
                    return (
                        <Marker.Animated
                            coordinate={{ latitude: item.location ? item.location.lat : 0.00, longitude: item.location ? item.location.lng : 0.00 }}
                            key={index}
                        >
                            <IconCarMap
                                width={35}
                                height={35}
                                style={{ transform: [{ rotate: item.location.angle+"deg" }],
                                shadowColor: colors.BLACK,
                                shadowOpacity: 0.2,
                                shadowOffset: { x: 0.1, y: 0.1 },
                                shadowRadius: 5,
                                elevation: 3  
                            }}
                            />
                        </Marker.Animated>
                    )
                })
                    : null}
            </MapView.Animated>
        );
    }
}
