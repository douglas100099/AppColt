import {
  CONFIRM_BOOKING,
  CONFIRM_BOOKING_SUCCESS,
  CONFIRM_BOOKING_FAILED,
  CLEAR_BOOKING
} from "./types";

import { 
  bookingRef,
  riderBookingRef, 
  usersRef, 
  waitingListRef,
  singleBookingRef,
  singleUserRef 
} from '../config/firebase';
import RequestPushMsg from '../config/RequestPushMsg';
import languageJson from '../config/language';

const getDistance = (lat1, lon1, lat2, lon2) => {
if ((lat1 === lat2) && (lon1 === lon2)) {
  return 0;
}
else {
  var radlat1 = Math.PI * lat1/180;
  var radlat2 = Math.PI * lat2/180;
  var theta = lon1-lon2;
  var radtheta = Math.PI * theta/180;
  var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
  if (dist > 1) {
    dist = 1;
  }
  dist = Math.acos(dist);
  dist = dist * 180/Math.PI;
      dist = dist * 60 * 1.1515;
      dist = dist * 1.609344;
  return dist;
}
}

export const clearBooking = () => async (dispatch) => {
  dispatch({
      type: CLEAR_BOOKING,
      payload: null,
  });
}

export const addBooking = (bookingData) => (dispatch) => {
    dispatch({
        type: CONFIRM_BOOKING,
        payload: bookingData,
    });
    let pickUp = { lat: bookingData.pickup.coords.lat, lng: bookingData.pickup.coords.lng, add: bookingData.pickup.description };
    let drop = { lat: bookingData.drop.coords.lat, lng: bookingData.drop.coords.lng, add: bookingData.drop.description };
    var otp;
    if(bookingData.settings.otp_secure)
        otp = Math.floor(Math.random() * 90000) + 10000;
    else{
        otp = false;
    }
    let today = new Date().toString();

    var data = {
        carType: bookingData.carDetails.name,
        carImage: bookingData.carDetails.image,
        customer: bookingData.userDetails.uid,
        customer_name: bookingData.userDetails.firstName + ' ' + bookingData.userDetails.lastName,
        distance: bookingData.estimate.distance,
        driver: "",
        driver_image: "",
        driver_name: "",
        drop: drop,
        pickup: pickUp,
        estimate: bookingData.estimate.estimateFare,
        estimateDistance: bookingData.estimate.distance,
        serviceType: 'pickUp',
        status: "NEW",
        total_trip_time: 0,
        trip_cost: 0,
        trip_end_time: "00:00",
        trip_start_time: "00:00",
        bookLater:bookingData.bookLater,
        tripdate: bookingData.bookLater?bookingData.tripdate:today,
        bookingDate: today,
        otp: otp,
        booking_type_web:true
    }


    //data set for my booking node 
    var MyBooking = {
        carType: bookingData.carDetails.name,
        carImage: bookingData.carDetails.image,
        driver: "",
        driver_image: "",
        driver_name: "",
        drop: drop,
        pickup: pickUp,
        estimate: bookingData.estimate.estimateFare,
        estimateDistance: bookingData.estimate.distance,
        serviceType: 'pickUp',
        status: "NEW",
        total_trip_time: 0,
        trip_cost: 0,
        trip_end_time: "00:00",
        trip_start_time: "00:00",
        bookLater:bookingData.bookLater,
        tripdate: bookingData.bookLater?bookingData.tripdate:today,
        bookingDate: today,
        coords: bookingData.estimate.waypoints,
        otp: otp,
        booking_type_web:true
    }

    if(bookingData.bookLater){
        bookingRef.push(data).then((res) => {
            var bookingKey = res.key;
            riderBookingRef(bookingData.userDetails.uid,bookingKey).set(MyBooking).then((res) => {
                dispatch({
                    type: CONFIRM_BOOKING_SUCCESS,
                    payload: {
                        booking_id:bookingKey,
                        mainData:data,
                        riderEntry:MyBooking,
                    }    
                });
            });
        });
    }else{
        var arr = [];
                
        usersRef.once('value', driverData => {
            if (driverData.val()) {
                var allUsers = driverData.val();
                for (let key in allUsers) {
                    if (allUsers[key].usertype === 'driver' && allUsers[key].approved === true && allUsers[key].queue === false && allUsers[key].driverActiveStatus === true) {
                        if (allUsers[key].location) {
                            let originalDistance = getDistance(pickUp.lat,pickUp.lng,allUsers[key].location.lat,allUsers[key].location.lng)
                            if (originalDistance < 10) {
                                if (allUsers[key].carType === bookingData.carDetails.name) {
                                    arr.push(key);
                                }
                            }          
                        }
                    }
                }
    
                if (arr.length > 0) {
                    bookingRef.push(data).then((res) => {
                        var bookingKey = res.key;
                        riderBookingRef(bookingData.userDetails.uid,bookingKey).set(MyBooking).then((res) => {
                            singleBookingRef(bookingKey).update({
                                requestedDriver: arr
                            }).then((res) => {
                                for(let i=0;i<arr.length;i++){
                                    let key = arr[i];
                                    waitingListRef(key,bookingKey).set(data); 
                                    singleUserRef(key).once('value', user => {
                                        RequestPushMsg(user.val().pushToken, languageJson.new_booking_msg);
                                    });
                                }
                                dispatch({
                                    type: CONFIRM_BOOKING_SUCCESS,
                                    payload: {
                                        booking_id:bookingKey,
                                        mainData:data,
                                        riderEntry:MyBooking
                                    }    
                                });
                            })
                        });
                    });
    
                } else {
                    dispatch({
                        type: CONFIRM_BOOKING_FAILED,
                        payload: languageJson.no_driver,
                    });
                }
            }
        })
    }


};
