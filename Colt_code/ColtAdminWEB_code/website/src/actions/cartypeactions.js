import { carTypesRef } from "../config/firebase";
import {
  FETCH_CAR_TYPES,
  FETCH_CAR_TYPES_SUCCESS,
  FETCH_CAR_TYPES_FAILED,
  EDIT_CAR_TYPE
} from "./types";
import languageJson from '../config/language';

export const fetchCarTypes = () => dispatch => {
  dispatch({
    type: FETCH_CAR_TYPES,
    payload: null
  });
  carTypesRef.on("value", snapshot => {
    if (snapshot.val()) {
      dispatch({
        type: FETCH_CAR_TYPES_SUCCESS,
        payload: snapshot.val()
      });
    } else {
      dispatch({
        type: FETCH_CAR_TYPES_FAILED,
        payload: languageJson.no_cars
      });
    }
  });
};

export const editCarType = (carTypes, method) => dispatch => {
  dispatch({
    type: EDIT_CAR_TYPE,
    payload: method
  });
  carTypesRef.set(carTypes);
}