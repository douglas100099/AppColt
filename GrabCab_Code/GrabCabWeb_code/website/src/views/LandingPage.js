import React, { useState, useEffect } from 'react';
import classNames from "classnames";
import { makeStyles } from '@material-ui/core/styles';
import Header from "components/Header/Header.js";
import Footer from "components/Footer/Footer.js";
import GridContainer from "components/Grid/GridContainer.js";
import GridItem from "components/Grid/GridItem.js";
import Button from "components/CustomButtons/Button.js";
import HeaderLinks from "components/Header/HeaderLinks.js";
import Parallax from "components/Parallax/Parallax.js";
import {
  Paper,
  FormControl,
  Select,
  MenuItem,
  TextField
} from '@material-ui/core';
import GoogleMapsAutoComplete from '../components/GoogleMapsAutoComplete';
import styles from "assets/jss/material-kit-react/views/landingPage.js";
import ProductSection from "./Sections/ProductSection.js";
import SectionDownload from "./Sections/SectionDownload.js";
import { getEstimate, clearEstimate } from '../actions/estimateactions';
import { addBooking, clearBooking } from '../actions/bookingactions';
import { useSelector, useDispatch } from "react-redux";
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import AlertDialog from '../components/AlertDialog';
import languageJson from '../config/language';

const dashboardRoutes = [];

const useStyles = makeStyles(styles);

export default function LandingPage(props) {
  const classes = useStyles();
  const dispatch = useDispatch();
  const { ...rest } = props;
  const cartypes = useSelector(state => state.cartypes.cars);
  const estimatedata = useSelector(state => state.estimatedata);
  const bookingdata = useSelector(state => state.bookingdata);
  const settings = useSelector(state => state.settingsdata.settings);
  const [carType, setCarType] = useState(languageJson.select_car);
  const [pickupAddress, setPickupAddress] = useState(null);
  const [dropAddress, setDropAddress] = useState(null);
  const [estimateModalStatus, setEstimateModalStatus] = React.useState(false);
  const [selectedCarDetails, setSelectedCarDetails] = useState(null);
  const auth = useSelector(state => state.auth);
  const [commonAlert, setCommonAlert] = useState({ open: false, msg: '' });
  const [bookingType, setBookingType] = useState('Book Now');

  const getDateString = (date) => {
    let d = null;
    d = date? new Date(date): new Date();

    let month = '' + (d.getMonth() + 1),
    day = '' + d.getDate(),
    year = d.getFullYear(),
    hours = d.getHours(),
    mins = d.getMinutes();
    if (month >=1 & month<=9) 
        month = '0' + month.toString();
    if (day >=0 & day<=9) 
        day = '0' + day.toString();
    if (hours >=0 & hours<=9) 
        hours = '0' + hours.toString();
    if (mins >=0 & mins<=9) 
        mins = '0' + mins.toString();

    return [year, month, day].join('-') + 'T' + [hours, mins].join(':');
  }

  const dateDiff = (date) =>{
    const date1 = new Date();
    const date2 = new Date(date);
    const diffTime = date2 - date1;
    return diffTime / (1000 * 60);
  }

  const [selectedDate, setSelectedDate] = React.useState(getDateString());

  const handleCarSelect = (event) => {
    setCarType(event.target.value);
    let carDetails = null;
    for (let i = 0; i < cartypes.length; i++) {
      if (cartypes[i].name === event.target.value) {
        carDetails = cartypes[i];
      }
    }
    setSelectedCarDetails(carDetails);
  };

  const handleBookTypeSelect = (event) => {
      setBookingType(event.target.value);
      if(bookingType==='Book Later'){
          setSelectedDate(getDateString());
      }
  };

  const onDateChange = (event) => {
    setSelectedDate(event.target.value);
  };

  useEffect(() => {
    if (estimatedata.estimate) {
      setEstimateModalStatus(true);
    }
  }, [estimatedata.estimate]);


  const handleGetEstimate = (e) => {
    e.preventDefault();
    if (auth.info) {
      if (pickupAddress && dropAddress && selectedCarDetails) {
        if(bookingType==='Book Now'){
            dispatch(getEstimate({
              pickup: pickupAddress,
              drop: dropAddress,
              carDetails: selectedCarDetails,
            }));
        }else{
          if(bookingType==='Book Later' && selectedDate){
            if(dateDiff(selectedDate)>=15){
              dispatch(getEstimate({
                pickup: pickupAddress,
                drop: dropAddress,
                carDetails: selectedCarDetails,
              }));
            }else{
              setCommonAlert({ open: true, msg: languageJson.past_booking_error });
            }
          }else{
            setCommonAlert({ open: true, msg: languageJson.select_proper });
          }
        }
      } else {
        setCommonAlert({ open: true, msg: languageJson.select_proper })
      }
    } else {
      setCommonAlert({ open: true, msg: languageJson.must_login })
    }
  };

  const confirmBooking = (e) => {
    e.preventDefault();
    setEstimateModalStatus(false);
    dispatch(addBooking({
      pickup: pickupAddress,
      drop: dropAddress,
      carDetails: selectedCarDetails,
      userDetails: auth.info,
      estimate: estimatedata.estimate,
      tripdate: new Date(selectedDate).toString(),
      bookLater: bookingType==='Book Later'?true:false,
      settings:settings
    }));

  };

  const handleEstimateModalClose = (e) => {
    e.preventDefault();
    setEstimateModalStatus(false);
    dispatch(clearEstimate());
  };

  const handleEstimateErrorClose = (e) => {
    e.preventDefault();
    dispatch(clearEstimate());
  };

  const handleBookingAlertClose = (e) => {
    e.preventDefault();
    dispatch(clearBooking());
    dispatch(clearEstimate());
    props.history.push('/booking-history');
  };

  const handleBookingErrorClose = (e) => {
    e.preventDefault();
    dispatch(clearBooking());
  };

  const handleCommonAlertClose = (e) => {
    e.preventDefault();
    setCommonAlert({ open: false, msg: '' })
  };

  return (
    <div>
      <Header
        color="transparent"
        routes={dashboardRoutes}
        rightLinks={<HeaderLinks />}
        fixed
        changeColorOnScroll={{
          height: 400,
          color: "white"
        }}
        {...rest}
      />
      <Parallax filter image={require("assets/img/background.jpg")}>
        {cartypes ?
          <div className={classes.container}>
            <GridContainer spacing={2}>
              <GridItem xs={12} sm={12} md={6} lg={6}>
                <br />
                <h1 className={classes.title}>Book your Cab</h1>
              </GridItem>
            </GridContainer>
            <GridContainer spacing={2}>
              <GridItem xs={12} sm={12} md={6} lg={6}>
                <Paper >
                  <GoogleMapsAutoComplete placeholder={languageJson.pickup_location}
                    onChange={
                      (value) => {
                        setPickupAddress(value);
                      }
                    }
                  />
                </Paper>
              </GridItem>
            </GridContainer>
            <GridContainer spacing={2}>
              <GridItem xs={12} sm={12} md={6} lg={6}>
                <Paper>
                  <GoogleMapsAutoComplete placeholder={languageJson.drop_location}
                    onChange={
                      (value) => {
                        setDropAddress(value);
                      }
                    }
                  />
                </Paper>
              </GridItem>
            </GridContainer>
            <GridContainer spacing={2}>
            <GridItem xs={6} sm={6} md={3} lg={3}>
                <FormControl style={{ width: '100%' }}>
                  <Select
                    id="car-type-native"
                    value={carType}
                    onChange={handleCarSelect}
                    className={carType === languageJson.select_car ? classes.inputdimmed : classes.input}
                  >
                    <MenuItem value={languageJson.select_car} key={languageJson.select_car}>
                      {languageJson.select_car}
                    </MenuItem>
                    {
                      cartypes.map((car) =>
                        <MenuItem key={car.name} value={car.name}>
                          <img src={car.image} className={classes.carphoto} alt="car types" />{car.name}
                        </MenuItem>
                      )
                    }
                  </Select>
                </FormControl>
              </GridItem>
              <GridItem xs={6} sm={6} md={3} lg={3}>
                <FormControl style={{ width: '100%' }}>
                  <Select
                    id="booking-type-native"
                    value={bookingType}
                    onChange={handleBookTypeSelect}
                    className={classes.input}
                    inputProps={{ 'aria-label': 'Without label' }}
                  >
                    <MenuItem key={"Book Now"} value={"Book Now"}>
                      {languageJson.book_now}
                    </MenuItem>
                    <MenuItem key={"Book Later"} value={"Book Later"}>
                      {languageJson.book_later}
                    </MenuItem>
                  </Select>
                </FormControl>
              </GridItem>
            </GridContainer>
            <GridContainer spacing={2}>
              {bookingType==='Book Later'?
              <GridItem xs={6} sm={6} md={4} lg={4}>
                <TextField
                  id="datetime-local"
                  label={languageJson.booking_date_time}
                  type="datetime-local"
                  variant="filled"
                  fullWidth
                  className={classes.commonInputStyle}
                  InputProps={{
                    className: classes.input
                  }}
                  value = {selectedDate}
                  onChange={onDateChange}
                />
              </GridItem>
              :null}
              <GridItem xs={6} sm={6} md={bookingType==='Book Later'?2:6} lg={bookingType==='Book Later'?2:6}>
                <Button
                  color="success"
                  size="lg"
                  rel="noopener noreferrer"
                  className={classes.items}
                  onClick={handleGetEstimate}
                  style={{height:bookingType==='Book Later'?76:52}}
                >
                  <i className="fas fa-car" />
                  {languageJson.book_now}
                </Button>
              </GridItem>
            </GridContainer>
          </div>
          : null}
      </Parallax>

      <div className={classNames(classes.main, classes.mainRaised)}>
        <div className={classes.container}>
          <ProductSection />
        </div>
      </div>
      <div className={classNames(classes.main2, classes.mainRaised2)}>
        <div className={classes.container}>
          <SectionDownload />
        </div>
      </div>
      <Footer />
      <Dialog
        open={estimateModalStatus}
        onClose={handleEstimateModalClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{languageJson.estimate}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            ${estimatedata.estimate ? estimatedata.estimate.estimateFare : null}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEstimateModalClose} color="primary">
            {languageJson.cancel}
          </Button>
          <Button onClick={confirmBooking} color="primary" autoFocus>
            {languageJson.book}
          </Button>
        </DialogActions>
      </Dialog>
      <AlertDialog open={bookingdata.booking ? true : false} onClose={handleBookingAlertClose}>{bookingdata.booking ? languageJson.booking_success + bookingdata.booking.booking_id : null}</AlertDialog>
      <AlertDialog open={bookingdata.error.flag} onClose={handleBookingErrorClose}>{bookingdata.error.msg}</AlertDialog>
      <AlertDialog open={estimatedata.error.flag} onClose={handleEstimateErrorClose}>{estimatedata.error.msg}</AlertDialog>
      <AlertDialog open={commonAlert.open} onClose={handleCommonAlertClose}>{commonAlert.msg}</AlertDialog>
    </div>
  );
}
