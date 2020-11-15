import React,{ useEffect } from 'react';
import CircularLoading from "./CircularLoading";
import { useSelector, useDispatch } from "react-redux";
import { fetchCarTypes } from "../actions/cartypeactions";
import { fetchBookings } from "../actions/bookinglistactions";
import { fetchCancelReasons } from 'actions/cancelreasonactions';
import { fetchSettings } from '../actions/settingsactions';

function AuthLoading(props) {
    const dispatch = useDispatch();
    const auth = useSelector(state => state.auth);
    useEffect(()=>{
        if(auth.info && auth.info.profile){
            dispatch(fetchBookings(auth.info.uid));
            dispatch(fetchCarTypes());
            dispatch(fetchCancelReasons());
            dispatch(fetchSettings());
        }

    },[auth.info,dispatch]);

    return (
        auth.loading? <CircularLoading/>:props.children
    )
}

export default AuthLoading;