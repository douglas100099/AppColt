import React from "react";
import MapViewDirections from "react-native-maps-directions";
import { colors } from '../common/theme';
import { google_map_key } from '../common/key';

const Directions = ({ destination, origin, onReady }) => (
  <MapViewDirections
    destination={destination}
    origin={origin}
    onReady={onReady}
    apikey={google_map_key}
    strokeWidth={4}
    strokeColor={colors.DEEPBLUE}
    mode='DRIVING'
    language='pt-BR'
  />
);

export default Directions;