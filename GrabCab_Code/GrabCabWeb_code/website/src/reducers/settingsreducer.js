import { 
    FETCH_SETTINGS,
    FETCH_SETTINGS_SUCCESS,
    FETCH_SETTINGS_FAILED,
  } from "../actions/types";
  
  export const INITIAL_STATE = {
    settings: null,
    loading: false,
    error:{
      flag:false,
      msg: null
    }
  }
  
  export default (state = INITIAL_STATE, action) => {
    switch (action.type) {
      case FETCH_SETTINGS:
        return {
          ...state,
          loading:true
        };
      case FETCH_SETTINGS_SUCCESS:
        return {
          ...state,
          settings:action.payload,
          loading:false
        };
      case FETCH_SETTINGS_FAILED:
        return {
          ...state,
          settings: null,
          loading:false,
          error:{
            flag:true,
            msg:action.payload
          }
        };
      default:
        return state;
    }
  };