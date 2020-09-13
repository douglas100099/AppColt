import {
    FETCH_BOOKINGS,
    FETCH_BOOKINGS_SUCCESS,
    FETCH_BOOKINGS_FAILED,
    CANCEL_BOOKING,
  } from "./types";
  
  import { 
    bookingRef,
    riderBookingRef, 
    waitingListRef,
    singleBookingRef,
    driverBookingRef,
    singleUserRef,
    requestedDriverRef
  } from '../config/firebase';
  
  import RequestPushMsg from '../config/RequestPushMsg';
  
  import languageJson from '../config/language';
  
  export const fetchBookings = () => (dispatch) => {
    dispatch({
      type: FETCH_BOOKINGS,
      payload: null,
    });
    bookingRef.on("value", (snapshot) => {
      if (snapshot.val()) {
        const data = snapshot.val();
        const arr = Object.keys(data)
          .map((i) => {
            data[i].id = i;
            data[i].pickupAddress = data[i].pickup.add;
            data[i].dropAddress = data[i].drop.add;
            data[i].discount = data[i].discount_amount
              ? data[i].discount_amount
              : 0;
            data[i].cashPaymentAmount = data[i].cashPaymentAmount
              ? data[i].cashPaymentAmount
              : 0;
            data[i].cardPaymentAmount = data[i].cardPaymentAmount
              ? data[i].cardPaymentAmount
              : 0;
            return data[i];
          });
        dispatch({
          type: FETCH_BOOKINGS_SUCCESS,
          payload: arr,
        });
      } else {
        dispatch({
          type: FETCH_BOOKINGS_FAILED,
          payload: languageJson.no_bookings,
        });
      }
    });
  };
  
  export const cancelBooking = (data) => (dispatch) => {
    dispatch({
      type: CANCEL_BOOKING,
      payload: data,
    });
    
    riderBookingRef(data.booking.customer,data.booking.id).update({
      status: 'CANCELLED',
      reason: data.reason
    }).then(() => {
      const requestedDriver = requestedDriverRef(data.booking.id);
      requestedDriver.once('value', drivers => {
        
        if (drivers.val()) {
          let requestedDrivers = drivers.val();
          let count = 0;
          for (let i = 0; i < requestedDrivers.length; i++) {
            waitingListRef(requestedDrivers[i],data.booking.id).remove();
            count = count + 1;
          }
          if (count === requestedDrivers.length) {
            requestedDriverRef(data.booking.id).remove();
          }
        }
      })
  
      singleBookingRef(data.booking.id).update({
        status: 'CANCELLED',
        reason: data.reason
      }).then(() => {
        if(data.booking.driver && data.booking.status === 'ACCEPTED'){
          driverBookingRef(data.booking.driver,data.booking.id).update({
            status: 'CANCELLED',
            reason: data.reason
          }).then(() => {
            singleUserRef(data.booking.driver).update({ queue: false });
            singleUserRef(data.booking.driver).once('value', user => {
              RequestPushMsg(user.val().pushToken, languageJson.booking_cancelled + data.booking.id);
            });
            singleUserRef(data.booking.customer).once('value', user => {
              RequestPushMsg(user.val().pushToken, languageJson.booking_cancelled + data.booking.id);
            });
          })
        }
      })
    })
  
  };
  
  