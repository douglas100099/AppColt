import { settingsRef } from "../config/firebase";
import {
  FETCH_SETTINGS,
  FETCH_SETTINGS_SUCCESS,
  FETCH_SETTINGS_FAILED,
} from "./types";

import languageJson from '../config/language';

export const fetchSettings= (uid) => (dispatch) => {
  dispatch({
    type: FETCH_SETTINGS,
    payload: null,
  });
  settingsRef.on("value", (snapshot) => {
    if (snapshot.val()) {
      dispatch({
        type: FETCH_SETTINGS_SUCCESS,
        payload: snapshot.val(),
      });
    } else {
      dispatch({
        type: FETCH_SETTINGS_FAILED,
        payload: languageJson.settings_error,
      });
    }
  });
};
