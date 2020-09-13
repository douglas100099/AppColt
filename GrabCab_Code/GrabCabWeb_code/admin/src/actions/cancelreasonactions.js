import { cancelreasonRef } from "../config/firebase";
import {
  FETCH_CANCEL_REASONS,
  FETCH_CANCEL_REASONS_SUCCESS,
  FETCH_CANCEL_REASONS_FAILED,
} from "./types";

import languageJson from '../config/language';

export const fetchCancelReasons= (uid) => (dispatch) => {
  dispatch({
    type: FETCH_CANCEL_REASONS,
    payload: null,
  });
  cancelreasonRef.on("value", (snapshot) => {
    if (snapshot.val()) {
      let data = snapshot.val();
      let arr = [];
      for(let i=0;i<data.length;i++){
        arr.push(data[i].label);
      }
      dispatch({
        type: FETCH_CANCEL_REASONS_SUCCESS,
        payload: arr,
      });
    } else {
      dispatch({
        type: FETCH_CANCEL_REASONS_FAILED,
        payload: languageJson.no_cancel_reason,
      });
    }
  });
};
