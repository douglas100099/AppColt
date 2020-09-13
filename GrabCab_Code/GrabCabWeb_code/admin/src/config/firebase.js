import firebase from 'firebase/app';
import 'firebase/database';
import 'firebase/auth';

import { FirebaseConfig } from "./keys";
firebase.initializeApp(FirebaseConfig);

const databaseRef = firebase.database().ref();
export const authRef = firebase.auth();

export const FIREBASE_AUTH_PERSIST = firebase.auth.Auth.Persistence.LOCAL;

export const bookingRef = databaseRef.child("bookings");
export const carTypesRef = databaseRef.child("rates/car_type");
export const promoRef = databaseRef.child("offers");
export const promoEditRef = (id) => databaseRef.child("offers/"+ id);
export const usersRef =  databaseRef.child("users");
export const notifyRef = databaseRef.child("notifications/");
export const notifyEditRef = (id) => databaseRef.child("notifications/"+ id);
export const referralRef = databaseRef.child("referral/bonus/amount");
export const singleUserRef = (uid) => databaseRef.child("users/" + uid);
export const settingsRef = databaseRef.child("settings");


export const cancelreasonRef = databaseRef.child("cancel_reason");
export const singleBookingRef = (bookingKey) => databaseRef.child("bookings/" + bookingKey);
export const riderBookingRef = (uid,bookingKey) => databaseRef.child("users/" + uid + "/my-booking/" + bookingKey);
export const waitingListRef = (uid,bookingKey ) => databaseRef.child("users/" + uid + "/waiting_riders_list/" + bookingKey);
export const driverBookingRef = (uid,bookingKey) => databaseRef.child("users/" + uid + "/my_bookings/" + bookingKey);
export const requestedDriverRef = (bookingKey ) => databaseRef.child("bookings/" + bookingKey  + "/requestedDriver");