import React, { useState, useEffect } from 'react';
import CircularLoading from "../components/CircularLoading";
import { useSelector, useDispatch } from "react-redux";
import Button from "components/CustomButtons/Button.js";
import CssBaseline from '@material-ui/core/CssBaseline';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import Container from '@material-ui/core/Container';
import { makeStyles } from '@material-ui/core/styles';
import languageJson from "../config/language";
import AlertDialog from '../components/AlertDialog';
import { updateProfile } from '../actions/authactions';

const useStyles = makeStyles(theme => ({
  '@global': {
    body: {
      backgroundColor: theme.palette.common.white,
    },
  },
  paper: {
    marginTop: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.secondary.main,
    width: 192,
    height: 192
  },
  form: {
    width: '100%',
    marginTop: theme.spacing(1),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
}));

const MyProfile = () => {
  const auth = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const classes = useStyles();
  const [commonAlert, setCommonAlert] = useState({open:false,msg:''});

  const [data, setData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    loginType:null
  });

  useEffect(() => {
    if (auth.info) {
      setData({
        firstName:auth.info.profile.firstName,
        lastName:auth.info.profile.lastName,
        email:auth.info.profile.email,
        mobile:auth.info.profile.mobile,
        loginType:auth.info.email?'email':null,
        uid:auth.info.uid
      });
    }
  }, [auth.info]);

  const updateData = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (/^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[A-Za-z]+$/.test(data.email)){
      dispatch(updateProfile(auth.info,data));
      setCommonAlert({open:true,msg:languageJson.profile_updated})
    }else{
      setCommonAlert({open:true,msg:languageJson.proper_email})
    }
  }

  const handleCommonAlertClose = (e) => {
    e.preventDefault();
    setCommonAlert({open:false,msg:''})
  };

  return (
    auth.loading ? <CircularLoading /> :
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <div className={classes.paper}>
          <form className={classes.form} onSubmit={handleSubmit}>
            <Typography component="h1" variant="h5">
              {languageJson.profile}
            </Typography>
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="firstName"
              label={languageJson.firstname}
              name="firstName"
              autoComplete="firstName"
              onChange={updateData}
              value={data.firstName}
              autoFocus
            />
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="lastName"
              label={languageJson.lastname}
              name="lastName"
              autoComplete="lastName"
              onChange={updateData}
              value={data.lastName}
            />
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="email"
              label={languageJson.email}
              name="email"
              autoComplete="email"
              onChange={updateData}
              value={data.email}
              disabled={data.loginType==='email'?true:false}
            />
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="mobile"
              label={languageJson.phone}
              name="mobile"
              autoComplete="mobile"
              onChange={updateData}
              value={data.mobile}
              disabled={data.loginType==='email'?false:true}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="success"
              className={classes.submit}
            >
              {languageJson.submit}
            </Button>
          </form>
        </div>
        <AlertDialog open={commonAlert.open} onClose={handleCommonAlertClose}>{commonAlert.msg}</AlertDialog>
      </Container>
  );
};

export default MyProfile;