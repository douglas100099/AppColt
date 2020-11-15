
import { createStore, combineReducers, applyMiddleware } from "redux";
import thunk from "redux-thunk";
import logger from "redux-logger";

import auth from "./authreducer";
import cartypes from "./cartypesreducer";
import bookinglistdata from "./bookingslistreducer";
import estimatedata from "./estimatereducer";
import bookingdata from "./bookingreducer";
import cancelreasondata from "./cancelreasonreducer";
import settingsdata from './settingsreducer';

const reducers = combineReducers({
  auth,
  cartypes,
  bookinglistdata,
  estimatedata,
  bookingdata,
  cancelreasondata,
  settingsdata
});

let middleware = [];
if (process.env.NODE_ENV === 'development') {
  //middleware = [...middleware, thunk, logger];
  middleware = [...middleware, thunk, logger];
} else {
  middleware = [...middleware, thunk];
}

export const store = createStore(reducers, {}, applyMiddleware(...middleware));
