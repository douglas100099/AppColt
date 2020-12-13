import React from 'react';
import {
  Typography,
  ListItemIcon,
  Divider,
  MenuList,
  MenuItem
}from '@material-ui/core';
import { Link } from 'react-router-dom';
import { useDispatch } from "react-redux";

import logo from '../assets/sidemenu_logo.jpg';
import DashboardIcon from '@material-ui/icons/Dashboard';
import CarIcon from '@material-ui/icons/DirectionsCar';
import ListIcon from '@material-ui/icons/ListAlt';
import ExitIcon from '@material-ui/icons/ExitToApp';
import OfferIcon from '@material-ui/icons/LocalOffer';
import PeopleIcon from '@material-ui/icons/People';
import MoneyIcon from '@material-ui/icons/AttachMoney';
import NotifyIcon from '@material-ui/icons/NotificationsActive';
import LocalAtmIcon from '@material-ui/icons/LocalAtm';
import  languageJson  from "../config/language";
import {
  signOut
}  from "../actions/authactions";


function AppMenu() {
  const dispatch = useDispatch();
  const LogOut = () => {
    dispatch(signOut());
  };

    return (
    <div>
      <div style={{display: 'flex', justifyContent: 'center',backgroundColor:'#1152FD', height: 200}}>
        <img style={{marginTop:'20px',marginBottom:'20px',width:'132px',height:'50px', alignSelf: 'center'}} src={logo} alt="Logo" />
      </div>
      <Divider/>
      <MenuList>
        <MenuItem component={Link} to="/">
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <Typography variant="inherit">{languageJson.dashboard_text}</Typography>
        </MenuItem>
        <MenuItem component={Link} to="/test">
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <Typography variant="inherit">Test</Typography>
        </MenuItem>
        <MenuItem component={Link} to="/addBookings">
          <ListItemIcon>
            <ListIcon />
          </ListItemIcon>
          <Typography variant="inherit">{languageJson.addbookinglable}</Typography>
        </MenuItem>
        <MenuItem component={Link} to="/bookings">
          <ListItemIcon>
            <ListIcon />
          </ListItemIcon>
          <Typography variant="inherit">{languageJson.booking_history}</Typography>
        </MenuItem>
        <MenuItem component={Link} to="/users">
          <ListItemIcon>
            <PeopleIcon />
          </ListItemIcon>
          <Typography variant="inherit">Motoristas</Typography>
        </MenuItem>
        <MenuItem component={Link} to="/WaitingAproved">
          <ListItemIcon>
            <PeopleIcon />
          </ListItemIcon>
          <Typography variant="inherit">Aguardando aprovação</Typography>
        </MenuItem>
        <MenuItem component={Link} to="/riders">
          <ListItemIcon>
            <PeopleIcon />
          </ListItemIcon>
          <Typography variant="inherit">Passageiros</Typography>
        </MenuItem>
        <MenuItem component={Link} to="/LivePreview">
          <ListItemIcon>
            <PeopleIcon />
          </ListItemIcon>
          <Typography variant="inherit">Live Preview</Typography>
        </MenuItem>
        <MenuItem component={Link} to="/cartypes">
          <ListItemIcon>
            <CarIcon />
          </ListItemIcon>
          <Typography variant="inherit">{languageJson.car_type}</Typography>
        </MenuItem>
        <MenuItem component={Link} to="/Earningreports">
          <ListItemIcon>
          <MoneyIcon />
          </ListItemIcon>
          <Typography variant="inherit">{languageJson.earning_reports}</Typography>
        </MenuItem>
        <MenuItem component={Link} to="/driverearning">
          <ListItemIcon>
          <MoneyIcon />
          </ListItemIcon>
          <Typography variant="inherit">{languageJson.driver_earning}</Typography>
        </MenuItem>
        <MenuItem component={Link} to="/promos">
          <ListItemIcon>
            <OfferIcon />
          </ListItemIcon>
          <Typography variant="inherit">{languageJson.promo}</Typography>
        </MenuItem>
        <MenuItem component={Link} to="/referral">
          <ListItemIcon>
            <MoneyIcon />
          </ListItemIcon>
          <Typography variant="inherit">{languageJson.refferal_bonus}</Typography>
        </MenuItem>
        <MenuItem component={Link} to="/notifications">
          <ListItemIcon>
            <NotifyIcon />
          </ListItemIcon>
          <Typography variant="inherit">{languageJson.push_notification_title}</Typography>
        </MenuItem>
        <MenuItem component={Link} to="/settings">
          <ListItemIcon>
            <LocalAtmIcon />
          </ListItemIcon>
          <Typography variant="inherit">{languageJson.settings_title}</Typography>
        </MenuItem>
        <MenuItem onClick={LogOut}>
          <ListItemIcon>
            <ExitIcon />
          </ListItemIcon>
          <Typography variant="inherit" color='error'>{languageJson.logout}</Typography>
        </MenuItem>
      </MenuList>
    </div>
  );
}

export default AppMenu;