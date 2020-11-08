import React,{ useState,useEffect } from 'react';
import MaterialTable from 'material-table';
import CircularLoading from "../components/CircularLoading";
import { useSelector, useDispatch } from "react-redux";
import  languageJson  from "../config/language";
import { cancelBooking } from '../actions/bookinglistactions';
import ConfirmationDialogRaw from '../components/ConfirmationDialogRaw';
import {isLive} from '../config/keys';
import dateStyle from '../config/dateStyle';

const BookingHistory = () => {
  const dispatch = useDispatch();
  
  const columns =  [
      { title: languageJson.booking_id, field: 'id' },
      { title: languageJson.booking_date, field: 'tripdate', render: rowData => rowData.tripdate?new Date(rowData.tripdate).toLocaleString(dateStyle):null},
      { title: languageJson.car_type, field: 'carType' },
      { title: languageJson.customer_name,field: 'customer_name'},
      { title: languageJson.pickup_address, field: 'pickupAddress' },
      { title: languageJson.drop_address, field: 'dropAddress' },
      { title: languageJson.assign_driver, field: 'driver_name' },
      { title: languageJson.booking_status, field: 'status' },
      { title: languageJson.otp, field: 'otp', render: rowData => rowData.status ==='NEW' || rowData.status === 'ACCEPTED' ?<span>{rowData.otp}</span>:null },
      { title: languageJson.trip_cost, field: 'trip_cost' },
      { title: languageJson.payment_status, field: 'payment_status'},   

      /* More Fields if you need

      { title: languageJson.trip_start_time, field: 'trip_start_time' },
      { title: languageJson.trip_end_time, field: 'trip_end_time' },
      { title: languageJson.vehicle_no, field: 'vehicle_number' },  
      { title: languageJson.trip_cost_driver_share, field: 'driver_share'},
      { title: languageJson.convenience_fee, field: 'convenience_fees'},
      { title: languageJson.discount_ammount, field: 'discount'},      
      { title: languageJson.Customer_paid, field: 'customer_paid'},
      { title: languageJson.payment_mode, field: 'payment_mode'},
      { title: languageJson.payment_getway, field: 'getway'},
      { title: languageJson.cash_payment_amount, field: 'cashPaymentAmount'},
      { title: languageJson.card_payment_amount, field: 'cardPaymentAmount'},
      { title: languageJson.wallet_payment_amount, field: 'usedWalletMoney'},

      */
      
  ];
  const [data, setData] = useState([]);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState('');
  const bookinglistdata = useSelector(state => state.bookinglistdata);

  useEffect(()=>{
        if(bookinglistdata.bookings){
            setData(bookinglistdata.bookings);
        }
  },[bookinglistdata.bookings]);

  const onConfirmClose=(value)=>{
    if(value){
      dispatch(cancelBooking({
        reason:value,
        booking:selectedBooking
      }));
    }
    setOpenConfirm(false);
  }
  
  return (
    bookinglistdata.loading? <CircularLoading/>:
    <div>
    <MaterialTable
      title={languageJson.booking_title}
      columns={columns}
      data={data.reverse()}
      options={{
        actionsColumnIndex: -1
      }}
      actions={[
        rowData => ({
          icon: 'cancel',
          tooltip: languageJson.cancel_booking,
          disabled: rowData.status==='NEW' || rowData.status==='ACCEPTED'? false:true,
          onClick: (event, rowData) => {
            if(isLive){
              setSelectedBooking(rowData);
              setOpenConfirm(true);
            }else{
              alert('Restricted in Demo App.');
            }
          }         
        }),
      ]}
    />
    <ConfirmationDialogRaw
      open={openConfirm}
      onClose={onConfirmClose}
      value={''}
    />
    </div>

  );
}

export default BookingHistory;
