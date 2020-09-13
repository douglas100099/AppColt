
import { createStore, combineReducers, applyMiddleware } from "redux";
import thunk from "redux-thunk";
import logger from 'redux-logger'

import auth from "./authreducer";
import cartypes from "./cartypesreducer";
import bookinglistdata from "./bookingslistreducer";
import estimatedata from "./estimatereducer";
import bookingdata from "./bookingreducer";
import cancelreasondata from "./cancelreasonreducer";
import promodata from "./promoreducer";
import usersdata from "./usersreducer";
import referraldata from "./referralreducer";
import notificationdata from "./notificationreducer";
import driverearningdata from './driverearningreducer';
import Earningreportsdata from './earningreportsreducer';
import settingsdata from './settingsreducer';

const reducers = combineReducers({
  auth,
  cartypes,
  bookinglistdata,
  estimatedata,
  bookingdata,
  cancelreasondata,
  promodata,
  usersdata,
  referraldata,
  notificationdata,
  driverearningdata,
  Earningreportsdata,
  settingsdata
});

let middleware = [];
if (process.env.NODE_ENV === 'development') {
  middleware = [...middleware, thunk, logger];
} else {
  middleware = [...middleware, thunk];
}

export const store = createStore(reducers, {}, applyMiddleware(...middleware));
