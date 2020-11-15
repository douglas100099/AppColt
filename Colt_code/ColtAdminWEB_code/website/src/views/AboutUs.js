import React from "react";
// nodejs library that concatenates classes
import classNames from "classnames";
// @material-ui/core components
import { makeStyles } from "@material-ui/core/styles";

// @material-ui/icons

// core components
import Header from "components/Header/Header.js";
import Footer from "components/Footer/Footer.js";
import HeaderLinks from "components/Header/HeaderLinks.js";

import styles from "assets/jss/material-kit-react/views/staticPages.js";
import Parallax from "components/Parallax/Parallax";

const dashboardRoutes = [];

const useStyles = makeStyles(styles);

export default function AboutUs(props) {
  const classes = useStyles();
  const { ...rest } = props;
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
      <Parallax small filter image={require("assets/img/header-back.jpg")} />
      <div className={classNames(classes.main, classes.mainRaised)}>
 
        <div className={classes.container}>
            <br/>
            <h2 className={classes.title}>About Us</h2>
            <p className={classes.description}>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Faucibus purus in massa tempor nec feugiat nisl pretium fusce. Lectus proin nibh nisl condimentum id venenatis a condimentum. Amet nisl suscipit adipiscing bibendum est ultricies integer. Aliquam sem fringilla ut morbi tincidunt augue interdum. Malesuada pellentesque elit eget gravida cum sociis natoque. Cras adipiscing enim eu turpis egestas pretium aenean pharetra magna. Interdum velit euismod in pellentesque massa placerat. Dolor morbi non arcu risus quis varius quam quisque id. Dignissim cras tincidunt lobortis feugiat. Arcu ac tortor dignissim convallis aenean et. Suscipit adipiscing bibendum est ultricies integer.</p>
            <p className={classes.description}>Viverra vitae congue eu consequat ac. Volutpat odio facilisis mauris sit amet massa vitae tortor condimentum. Nibh ipsum consequat nisl vel pretium lectus quam id. Massa tempor nec feugiat nisl pretium fusce id. Eleifend mi in nulla posuere sollicitudin aliquam. Purus sit amet volutpat consequat mauris nunc. Id consectetur purus ut faucibus pulvinar elementum integer enim. Ullamcorper morbi tincidunt ornare massa. Placerat orci nulla pellentesque dignissim enim sit amet venenatis. Aenean et tortor at risus viverra adipiscing at. Malesuada fames ac turpis egestas sed tempus urna.</p>
            <br/>
        </div>
        </div>

      <Footer />
    </div>
  );
}
