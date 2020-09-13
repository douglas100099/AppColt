import {
  FETCH_ESTIMATE,
  FETCH_ESTIMATE_SUCCESS,
  FETCH_ESTIMATE_FAILED,
  CLEAR_ESTIMATE
} from "./types";
import Polyline from '@mapbox/polyline';

import { google_map_key } from "../config/keys";
import { farehelper } from '../config/FareCalculator';

export const getEstimate = (bookingData) => async (dispatch) => {
  dispatch({
    type: FETCH_ESTIMATE,
    payload: bookingData,
  });
  let startLoc = '"' + bookingData.pickup.coords.lat + ',' + bookingData.pickup.coords.lng + '"';
  let destLoc = '"' + bookingData.drop.coords.lat + ',' + bookingData.drop.coords.lng + '"';

  let url = `https://maps.googleapis.com/maps/api/directions/json?origin=${startLoc}&destination=${destLoc}&key=${google_map_key}`
  let cors_proxy = 'https://cors-proxy.dev.exicube.com/';

  try {
    let resp = await fetch(cors_proxy + url)
    let respJson = await resp.json();
    let points = Polyline.decode(respJson.routes[0].overview_polyline.points);
    let waypoints = points.map((point) => {
        return {
            latitude: point[0],
            longitude: point[1]
        }
    })
    var fareCalculation = farehelper(respJson.routes[0].legs[0].distance.value, respJson.routes[0].legs[0].duration.value, bookingData.carDetails)
    dispatch({
      type: FETCH_ESTIMATE_SUCCESS,
      payload: {
        distance: respJson.routes[0].legs[0].distance.value,
        fareCost: fareCalculation ? parseFloat(fareCalculation.totalCost).toFixed(2) : 0,
        estimateFare: fareCalculation ? parseFloat(fareCalculation.grandTotal).toFixed(2) : 0,
        estimateTime: respJson.routes[0].legs[0].duration.value,
        convenience_fees: fareCalculation ? parseFloat(fareCalculation.convenience_fees).toFixed(2) : 0,
        waypoints: waypoints
      },
    });
  }
  catch (error) {
    dispatch({
      type: FETCH_ESTIMATE_FAILED,
      payload: "No Route Found",
    });
  }
}

export const clearEstimate = (bookingData) => async (dispatch) => {
    dispatch({
        type: CLEAR_ESTIMATE,
        payload: null,
    });    
}
