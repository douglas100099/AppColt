import {
  authRef,
  singleUserRef,
  FIREBASE_AUTH_PERSIST,
  facebookProvider,
  facebookCredential,
  googleProvider,
  mobileAuthCredential,
  usersRef,
  settingsRef
} from "../config/firebase";

import {
  FETCH_USER,
  FETCH_USER_SUCCESS,
  FETCH_USER_FAILED,
  USER_SIGN_IN,
  USER_SIGN_IN_FAILED,
  USER_SIGN_OUT,
  CLEAR_LOGIN_ERROR,
  UPDATE_USER_PROFILE,
  USER_NOT_REGISTERED,
  USER_REGISTER,
  USER_REGISTER_SUCESSS,
  USER_REGISTER_FAILED,
  USER_EMAIL_SIGNUP,
  USER_EMAIL_SIGNUP_FAILED
} from "./types";

import languageJson from '../config/language';

export const fetchUser = () => dispatch => {
  dispatch({
    type: FETCH_USER,
    payload: null
  });
  authRef.onAuthStateChanged(user => {
    if (user) {
      singleUserRef(user.uid).once("value", snapshot => {
        if (snapshot.val()) {
              if (snapshot.val().usertype === 'rider') {
                user.profile = snapshot.val();
                dispatch({
                  type: FETCH_USER_SUCCESS,
                  payload: user
                });
              } else {
                authRef
                  .signOut()
                  .then(() => {
                    dispatch({
                      type: USER_SIGN_IN_FAILED,
                      payload: { code: languageJson.auth_error, message:languageJson.not_valid_rider }
                    });
                  })
                  .catch(error => {
                    dispatch({
                      type: USER_SIGN_IN_FAILED,
                      payload: error
                    });
                  });
              }
        } else {
          settingsRef.once("value", settingdata => {
            let settings = settingdata.val();
            if ((user.providerData[0].providerId === "password" && settings.email_verify && user.emailVerified) || !settings.email_verify) {
              dispatch({
                type: USER_NOT_REGISTERED,
                payload: user
              });
            }
            else {
              user.sendEmailVerification();
              authRef.signOut();
              dispatch({
                type: USER_SIGN_IN_FAILED,
                payload: { code: languageJson.auth_error, message: languageJson.email_verify_message }
              });
            }
          });
        }
      });
    } else {

      dispatch({
        type: FETCH_USER_FAILED,
        payload: null
      });
    }
  });
};

export const addProfile = (userDetails) => dispatch => {
  dispatch({
    type: USER_REGISTER,
    payload: null
  });
  var fourdigit = Math.floor(1000 + Math.random() * 9000);
  var regData = {
    firstName: userDetails.firstName,
    lastName: userDetails.lastName,
    mobile: userDetails.mobile,
    email: userDetails.email,
    usertype: 'rider',
    createdAt: new Date().toISOString(),
    signupViaReferral: false,
    refferalId: userDetails.firstName.toLowerCase() + fourdigit.toString(),
    walletBalance: 0
  };
  authRef.currentUser.updateProfile({
    displayName: regData.firstName + ' ' + regData.lastName,
  }).then(() => {
    usersRef.child(authRef.currentUser.uid).set(regData)
      .then(() => {
        dispatch({
          type: USER_REGISTER_SUCESSS,
          payload: regData
        });
      })
      .catch(error => {
        dispatch({
          type: USER_REGISTER_FAILED,
          payload: error
        });
      });
  });

};

export const emailSignUp = (email, password) => dispatch => {
  dispatch({
    type: USER_EMAIL_SIGNUP,
    payload: null
  });
  authRef.createUserWithEmailAndPassword(email, password).catch(function (error) {
    dispatch({
      type: USER_EMAIL_SIGNUP_FAILED,
      payload: error
    });
  });
};

export const mobileSignIn = (verficationId, code) => dispatch => {
  dispatch({
    type: USER_SIGN_IN,
    payload: null
  });
  authRef.signInWithCredential(mobileAuthCredential(verficationId, code))
    .then((user) => {
      //OnAuthStateChange takes care of Navigation
    }).catch(error => {
      dispatch({
        type: USER_SIGN_IN_FAILED,
        payload: error
      });
    });
};

export const signIn = (username, password) => dispatch => {
  authRef.setPersistence(FIREBASE_AUTH_PERSIST)
    .then(function () {
      authRef
        .signInWithEmailAndPassword(username, password)
        .then(res => {
          dispatch({
            type: USER_SIGN_IN,
            payload: res
          });
        })
        .catch(error => {
          dispatch({
            type: USER_SIGN_IN_FAILED,
            payload: error
          });
        });
    })
    .catch(function (error) {
      dispatch({
        type: USER_SIGN_IN_FAILED,
        payload: error
      });
    });
};

export const facebookSignIn = () => dispatch => {
  dispatch({
    type: USER_SIGN_IN,
    payload: null
  });
  authRef.signInWithPopup(facebookProvider).then(function (result) {
    console.log(result);
    var token = result.credential.accessToken;
    const credential = facebookCredential(token);
    authRef.signInWithCredential(credential)
      .then((user) => {
        //OnAuthStateChange takes care of Navigation
      }).catch(error => {
        dispatch({
          type: USER_SIGN_IN_FAILED,
          payload: error
        });
      }
      )
  }).catch(function (error) {
    dispatch({
      type: USER_SIGN_IN_FAILED,
      payload: error
    });
  });
};

export const googleSignIn = () => dispatch => {
  dispatch({
    type: USER_SIGN_IN,
    payload: null
  });
  authRef.signInWithPopup(googleProvider).then(function (result) {
    authRef.signInWithCredential(result.credential)
      .then((user) => {
        //OnAuthStateChange takes care of Navigation
      }).catch(error => {
        dispatch({
          type: USER_SIGN_IN_FAILED,
          payload: error
        });
      }
      )
  }).catch(function (error) {
    dispatch({
      type: USER_SIGN_IN_FAILED,
      payload: error
    });
  });
};

export const signOut = () => dispatch => {
  authRef
    .signOut()
    .then(() => {
      dispatch({
        type: USER_SIGN_OUT,
        payload: null
      });
    })
    .catch(error => {
      console.log(error);
    });
};

export const updateProfile = (userAuthData, userData) => dispatch => {
  let profile = userAuthData.profile;
  profile.firstName = userData.firstName;
  profile.lastName = userData.lastName;
  profile.email = userData.email;
  profile.mobile = userData.mobile;
  userAuthData.profile = profile;
  dispatch({
    type: UPDATE_USER_PROFILE,
    payload: userAuthData
  });
  singleUserRef(userData.uid).update({
    firstName: userData.firstName,
    lastName: userData.lastName,
    email: userData.email,
    mobile: userData.mobile
  });
};

export const clearLoginError = () => dispatch => {
  dispatch({
    type: CLEAR_LOGIN_ERROR,
    payload: null
  });
};