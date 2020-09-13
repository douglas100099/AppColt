import firebase from 'firebase/app';
import 'firebase/database';
import 'firebase/auth';

import { FirebaseConfig } from "./keys";
firebase.initializeApp(FirebaseConfig);

const databaseRef = firebase.database().ref();
export const authRef = firebase.auth();
export const facebookProvider = new firebase.auth.FacebookAuthProvider();
export const googleProvider = new firebase.auth.GoogleAuthProvider();

export const facebookCredential = (token) => firebase.auth.FacebookAuthProvider.credential(token);
export const mobileAuthCredential = (verificationId,code) => firebase.auth.PhoneAuthProvider.credential(verificationId, code);

export const FIREBASE_AUTH_PERSIST = firebase.auth.Auth.Persistence.LOCAL;

export const usersRef =  databaseRef.child("users");
export const bookingRef = databaseRef.child("bookings");
export const cancelreasonRef = databaseRef.child("cancel_reason");
export const settingsRef = databaseRef.child("settings");
export const carTypesRef = databaseRef.child("rates/car_type");
export const singleUserRef = (uid) => databaseRef.child("users/" + uid);
export const singleBookingRef = (bookingKey) => databaseRef.child("bookings/" + bookingKey);
export const riderBookingRef = (uid,bookingKey) => databaseRef.child("users/" + uid + "/my-booking/" + bookingKey);
export const waitingListRef = (uid,bookingKey ) => databaseRef.child("users/" + uid + "/waiting_riders_list/" + bookingKey);
export const driverBookingRef = (uid,bookingKey) => databaseRef.child("users/" + uid + "/my_bookings/" + bookingKey);
export const requestedDriverRef = (bookingKey ) => databaseRef.child("bookings/" + bookingKey  + "/requestedDriver");