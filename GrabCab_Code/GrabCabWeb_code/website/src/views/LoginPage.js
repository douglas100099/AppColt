import React, { useState, useEffect } from 'react';
import { makeStyles } from "@material-ui/core/styles";
import InputAdornment from "@material-ui/core/InputAdornment";
import Icon from "@material-ui/core/Icon";
import Email from "@material-ui/icons/Email";
import Header from "components/Header/Header.js";
import HeaderLinks from "components/Header/HeaderLinks.js";
import Footer from "components/Footer/Footer.js";
import GridContainer from "components/Grid/GridContainer.js";
import GridItem from "components/Grid/GridItem.js";
import Button from "components/CustomButtons/Button.js";
import Card from "components/Card/Card.js";
import CardBody from "components/Card/CardBody.js";
import CardHeader from "components/Card/CardHeader.js";
import CardFooter from "components/Card/CardFooter.js";
import CustomInput from "components/CustomInput/CustomInput.js";
import styles from "assets/jss/material-kit-react/views/loginPage.js";
import image from "assets/img/background.jpg";
import { useSelector, useDispatch } from "react-redux";
import Paper from '@material-ui/core/Paper';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import PhoneIcon from '@material-ui/icons/Phone';
import EmailIcon from '@material-ui/icons/Email';
import AlertDialog from '../components/AlertDialog';
import firebase from 'firebase/app';
import 'firebase/database';
import CountrySelect from '../components/CountrySelect';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import {Button as RegularButton} from "@material-ui/core";
import languageJson from '../config/language';

import {
  signIn,
  facebookSignIn,
  clearLoginError,
  googleSignIn,
  mobileSignIn,
  addProfile,
  emailSignUp,
  signOut
} from "../actions/authactions";

const useStyles = makeStyles(styles);

export default function LoginPage(props) {
  const auth = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const [cardAnimaton, setCardAnimation] = React.useState("cardHidden");
  const [loginType, setLoginType] = React.useState(0);
  const [activeReg, setActiveReg] = React.useState(false);
  const [openFPModal, setOpenFPModal] = React.useState(false);
  const [capatchaReady, setCapatchaReady] = React.useState(false);

  const [data, setData] = React.useState({
    email: '',
    pass: '',
    country: '',
    mobile: '',
    password: '',
    otp: '',
    verificationId: null,
    firstName: '',
    lastName: ''
  });

  const [tabDisabled, setTabDisabled] = React.useState(false);
  const [fpEmail, setFpEmail] = React.useState("");

  const [commonAlert, setCommonAlert] = useState({ open: false, msg: '' });

  setTimeout(function () {
    setCardAnimation("");
  }, 700);

  const classes = useStyles();
  const { ...rest } = props;

  useEffect(() => {
    if(!capatchaReady){
      window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('sign-in-button', {
        'size': 'invisible',
        'callback': function (response) {
            setCapatchaReady(true);
         }
      });
    }
    if (auth.info) {
      if(auth.info.profile){
        props.history.push('/');
      }else{
        if(!activeReg){
          setActiveReg(true);
          if(auth.info.phoneNumber){
            setData({...data,mobile:auth.info.phoneNumber})
            setLoginType(1);
          }else{
            setData({...data,email:auth.info.email})
            setLoginType(0);
          }
          setTabDisabled(true);
          setCommonAlert({ open: true, msg: languageJson.login_success });
        }
      } 
    }
    if (auth.error && auth.error.flag) {
      setCommonAlert({ open: true, msg: auth.error.msg.code + ": " + auth.error.msg.message })
    }
  }, [auth.info, auth.error, props.history, data, data.email,activeReg,capatchaReady]);

  const handleTabChange = (event, newValue) => {
    setLoginType(newValue);
  };

  const handleFacebook = (e) => {
    e.preventDefault();
    dispatch(facebookSignIn());
  }

  const handleGoogle = (e) => {
    e.preventDefault();
    dispatch(googleSignIn());
  }

  const handleCommonAlertClose = (e) => {
    e.preventDefault();
    setCommonAlert({ open: false, msg: '' });
    if (auth.error.flag) {
      setData({...data,email:'',pass:''});
      dispatch(clearLoginError());
    }
  };

  const onInputChange = (event) => {
    setData({ ...data, [event.target.id]: event.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (/^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[A-Za-z]+$/.test(data.email) && data.pass.length > 0) {
      dispatch(signIn(data.email, data.pass));
    } else {
      setCommonAlert({ open: true, msg: languageJson.login_validate_error})
    }
    setData({...data,email:'',pass:''});
  }

  const handleGetOTP = (e) => {
    e.preventDefault();
    const phoneNumber = "+" + data.country + data.mobile;
    const appVerifier = window.recaptchaVerifier;
    firebase
      .auth()
      .signInWithPhoneNumber(phoneNumber, appVerifier)
      .then(res => {
        setData({ ...data, verificationId: res.verificationId });
      })
      .catch(error => {
        setCommonAlert({ open: true, msg: error.code + ": " + error.message })
      });
  }

  const handleVerifyOTP = (e) => {
    e.preventDefault();
    if (data.otp.length === 6 && parseInt(data.otp) > 100000 & parseInt(data.otp) < 1000000) {
      dispatch(mobileSignIn(data.verificationId, data.otp));
    } else {
      setCommonAlert({ open: true, msg: languageJson.otp_validate_error})
    }
  }

  const handleCancel = (e) => {
    e.preventDefault();
    dispatch(signOut());
    setTabDisabled(false);
    setActiveReg(false);
    
  }

  const onCountryChange = (object, value) => {
    if (value && value.phone) {
      setData({ ...data, country: value.phone });
    }
  };

  const handleRegister = (e) => {
    e.preventDefault(); 
    if (/^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[A-Za-z]+$/.test(data.email) && data.pass.length > 0) {
      dispatch(emailSignUp(data.email, data.pass));
    } else {
      setCommonAlert({ open: true, msg: languageJson.login_validate_error })
    }
  };

  const handleForgotPass = (e) => {
    e.preventDefault();
    setOpenFPModal(true);
  };

  const onFPModalEmailChange = (e) => {
    e.preventDefault();
    setFpEmail(e.target.value);
  }

  const handleCloseFP = (e) => {
    e.preventDefault();
    setFpEmail('');
    setOpenFPModal(false);
  }

  const handleResetPassword = (e) => {
    firebase.auth().sendPasswordResetEmail(fpEmail).then(function () {
      setCommonAlert({ open: true, msg: languageJson.reset_pass_msg });
      setFpEmail('');
      setOpenFPModal(false);
    }).catch(function (error) {
      setCommonAlert({ open: true, msg: error.code + "; " + error.message });
      setFpEmail('');
    });
  }

  const completeRegistration = (e) => {
    e.preventDefault();
    dispatch(addProfile(data));

  };

  return (
    <div>
      <Header
        absolute
        color="transparent"
        rightLinks={<HeaderLinks />}
        {...rest}
      />
      <div
        className={classes.pageHeader}
        style={{
          backgroundImage: "url(" + image + ")",
          backgroundSize: "cover",
          backgroundPosition: "top center"
        }}
      >
        <div id="sign-in-button" />
        <div className={classes.container}>
          <GridContainer justify="center">
            <GridItem xs={12} sm={12} md={4}>
              <Card className={classes[cardAnimaton]}>
                <form className={classes.form}>
                  <CardHeader color="info" className={classes.cardHeader}>
                    <h4>{languageJson.signIn}</h4>
                    <div className={classes.socialLine}>
                      <Button
                        justIcon
                        href="#pablo"
                        target="_blank"
                        color="transparent"

                        onClick={handleFacebook}
                      >
                        <i className={"fab fa-facebook"} />
                      </Button>
                      <Button
                        justIcon
                        href="#pablo"
                        target="_blank"
                        color="transparent"
                        onClick={handleGoogle}
                      >
                        <i className={"fab fa-google"} />
                      </Button>
                    </div>
                  </CardHeader>
                  <Paper square className={classes.root}>
                    <Tabs
                      value={loginType}
                      onChange={handleTabChange}
                      variant="fullWidth"
                      indicatorColor="primary"
                      textColor="inherit"
                      aria-label="switch login type"
                    >
                      <Tab disabled={tabDisabled} icon={<EmailIcon />} label={languageJson.email_tab}  aria-label="email" />
                      <Tab disabled={tabDisabled} icon={<PhoneIcon />} label={languageJson.phone_tab} aria-label="phone" />
                    </Tabs>
                  </Paper>

                  <CardBody>
                    {(loginType === 0 && !activeReg) || (activeReg && loginType ===1)?    //EMAIL
                      <CustomInput
                        labelText={languageJson.email}
                        id="email"
                        formControlProps={{
                          fullWidth: true
                        }}
                        inputProps={{
                          type: "email",
                          required: true,
                          endAdornment: (
                            <InputAdornment position="end">
                              <Email className={classes.inputIconsColor} />
                            </InputAdornment>
                          )
                        }}
                        onChange={onInputChange}
                        value={data.email}
                      />
                      : null}
                    {loginType === 0 && !auth.info?   //PASSWORD
                      <CustomInput
                        labelText={languageJson.password}
                        id="pass"
                        formControlProps={{
                          fullWidth: true
                        }}
                        inputProps={{
                          type: "password",
                          required: true,
                          endAdornment: (
                            <InputAdornment position="end">
                              <Icon className={classes.inputIconsColor}>
                                lock_outline
                            </Icon>
                            </InputAdornment>
                          ),
                          autoComplete: "off"
                        }}
                        onChange={onInputChange}
                        value={data.pass}
                      />
                      : null}
                    {(loginType === 1 && !activeReg) || (loginType === 0 && activeReg) ?   // COUNTRY
                      <CountrySelect
                        onChange={onCountryChange}
                        disabled={data.verificationId ? true : false}
                      />
                      : null}
                    {(loginType === 1  && !activeReg) || (loginType === 0 && activeReg) ?   //MOBILE
                      <CustomInput
                        labelText={languageJson.phone}
                        id="mobile"
                        formControlProps={{
                          fullWidth: true
                        }}
                        inputProps={{
                          required: true,
                          disabled: data.verificationId ? true : false,
                          endAdornment: (
                            <InputAdornment position="end">
                              <PhoneIcon className={classes.inputIconsColor} />
                            </InputAdornment>
                          )
                        }}
                        onChange={onInputChange}
                        value={data.mobile}
                      />
                      : null}
                    {data.verificationId && loginType === 1 ?    // OTP
                      <CustomInput
                        labelText={languageJson.otp}
                        id="otp"
                        formControlProps={{
                          fullWidth: true
                        }}
                        inputProps={{
                          type: "password",
                          required: true,
                          endAdornment: (
                            <InputAdornment position="end">
                              <Icon className={classes.inputIconsColor}>
                                lock_outline
                            </Icon>
                            </InputAdornment>
                          ),
                          autoComplete: "off"
                        }}
                        onChange={onInputChange}
                        value={data.otp}
                      />
                      : null}
                  {loginType === 0 && activeReg === false ?   //FORGOT PASSWORD
                    <RegularButton 
                      color="inherit" 
                      onClick={handleForgotPass}
                      disableElevation={true}
                      disableFocusRipple={true}
                      disableRipple={true}
                      className={classes.forgotButton}
                      variant="text"
                    >
                        Forgot Password?
                    </RegularButton>
                  : null}
                    {activeReg ?
                      <CustomInput   // FIRST NAME
                        labelText={languageJson.firstname}
                        id="firstName"
                        formControlProps={{
                          fullWidth: true
                        }}
                        inputProps={{
                          type: "text",
                          required: true,
                          endAdornment: (
                            <InputAdornment position="end">
                              <Email className={classes.inputIconsColor} />
                            </InputAdornment>
                          )
                        }}
                        onChange={onInputChange}
                        value={data.firstName}
                      />
                      : null}
                    {activeReg ?
                      <CustomInput    // LAST NAME
                        labelText={languageJson.lastname}
                        id="lastName"
                        formControlProps={{
                          fullWidth: true
                        }}
                        inputProps={{
                          type: "text",
                          required: true,
                          endAdornment: (
                            <InputAdornment position="end">
                              <Email className={classes.inputIconsColor} />
                            </InputAdornment>
                          )
                        }}
                        onChange={onInputChange}
                        value={data.lastName}
                      />
                      : null}
                  </CardBody>
                  <CardFooter className={classes.cardFooter}>
                    {loginType === 0 && activeReg === false ?
                      <Button className={classes.normalButton} simple color="primary" size="lg" onClick={handleSubmit}>
                        {languageJson.login}
                    </Button>
                      : null}
                    {loginType === 0 && activeReg === false ?
                      <Button className={classes.normalButton} simple color="primary" size="lg" onClick={handleRegister}>
                        {languageJson.register}
                    </Button>
                      : null}

                    {loginType === 1 && !data.verificationId && activeReg === false ?
                      <Button className={classes.normalButton} simple color="primary" size="lg" onClick={handleGetOTP}>
                        {languageJson.get_otp}
                    </Button>
                      : null}
                    {data.verificationId && activeReg === false ?
                      <Button className={classes.normalButton} simple color="primary" size="lg" onClick={handleVerifyOTP}>
                        {languageJson.verify_otp}
                    </Button>
                      : null}

                    {activeReg ?
                      <Button className={classes.normalButton} simple color="primary" size="lg" onClick={completeRegistration}>
                        {languageJson.complete_registration}
                    </Button>
                      : null}
                    {data.verificationId || activeReg ?
                      <Button className={classes.normalButton} simple color="primary" size="lg" onClick={handleCancel}>
                        {languageJson.cancel}
                    </Button>
                      : null}

                  </CardFooter>
                </form>
              </Card>
            </GridItem>
          </GridContainer>
        </div>
        <Footer whiteFont />
        <Dialog open={openFPModal} onClose={handleCloseFP} aria-labelledby="form-dialog-title">
          <DialogTitle id="form-dialog-title">{languageJson.forgot_pass_title}</DialogTitle>
          <DialogContent>
            <DialogContentText>
              {languageJson.forgot_pass_description}
          </DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              id="name"
              label={languageJson.email}
              type="email"
              fullWidth
              onChange={onFPModalEmailChange}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseFP} color="primary">
            {languageJson.cancel}
          </Button>
            <Button onClick={handleResetPassword} color="primary">
            {languageJson.reset_password}
          </Button>
          </DialogActions>
        </Dialog>
        <AlertDialog open={commonAlert.open} onClose={handleCommonAlertClose}>{commonAlert.msg}</AlertDialog>
      </div>
    </div>
  );
}
