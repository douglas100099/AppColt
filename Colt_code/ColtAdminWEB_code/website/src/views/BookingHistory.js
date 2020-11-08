import React,{ useState,useEffect } from 'react';
import MaterialTable from 'material-table';
import CircularLoading from "../components/CircularLoading";
import { useSelector, useDispatch } from "react-redux";
import  languageJson  from "../config/language";
import { cancelBooking } from '../actions/bookinglistactions';
import ConfirmationDialogRaw from '../components/ConfirmationDialogRaw';
import dateStyle from 'config/dateStyle';

const BookingHistory = () => {
  const dispatch = useDispatch();
  
  const columns =  [
      { title: languageJson.booking_id, field: 'id' },
      { title: languageJson.booking_date, field: 'tripdate', render: rowData => rowData.tripdate?new Date(rowData.tripdate).toLocaleString(dateStyle):null},
      { title: languageJson.car_type, field: 'carType' },
      { title: languageJson.pickup_address, field: 'pickupAddress' },
      { title: languageJson.drop_address, field: 'dropAddress' },
      { title: languageJson.booking_status, field: 'status' },
      { title: languageJson.otp, field: 'otp', render: rowData => rowData.status ==='NEW' || rowData.status === 'ACCEPTED' ?<span>{rowData.otp}</span>:null },
      { title: languageJson.trip_cost, field: 'trip_cost' },
      { title: languageJson.payment_status, field: 'payment_status'},      
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
            setSelectedBooking(rowData);
            setOpenConfirm(true);
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