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

import logo from '../assets/img/sidemenu_logo.jpg';
import PersonOutlineIcon from '@material-ui/icons/PersonOutline';
import ExitIcon from '@material-ui/icons/ExitToApp';
import HomeIcon from '@material-ui/icons/Home';
import ListAltIcon from '@material-ui/icons/ListAlt';

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
      <div style={{display: 'flex', justifyContent: 'center',backgroundColor:'#444444'}}>
        <img style={{marginTop:'20px',marginBottom:'20px',width:'120px',height:'120px'}} src={logo} alt="Logo" />
      </div>
      <Divider/>
      <MenuList>
        <MenuItem component={Link} to="/">
            <ListItemIcon>
              <HomeIcon />
            </ListItemIcon>
            <Typography variant="inherit">{languageJson.home}</Typography>
        </MenuItem>
        <MenuItem component={Link} to="/booking-history">
          <ListItemIcon>
            <ListAltIcon />
          </ListItemIcon>
          <Typography variant="inherit">{languageJson.booking_history}</Typography>
        </MenuItem>
        <MenuItem component={Link} to="/my-profile">
          <ListItemIcon>
            <PersonOutlineIcon />
          </ListItemIcon>
          <Typography variant="inherit">{languageJson.profile}</Typography>
        </MenuItem>
        <MenuItem onClick={LogOut}>
          <ListItemIcon>
            <ExitIcon />
          </ListItemIcon>
          <Typography variant="inherit">{languageJson.logout}</Typography>
        </MenuItem>
      </MenuList>
    </div>
  );
}

export default AppMenu;