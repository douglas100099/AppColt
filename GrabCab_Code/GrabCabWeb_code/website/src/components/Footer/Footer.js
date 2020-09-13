/*eslint-disable*/
import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { List, ListItem } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import styles from "assets/jss/material-kit-react/components/footerStyle.js";

const useStyles = makeStyles(styles);

export default function Footer(props) {
  const classes = useStyles();
  const { whiteFont } = props;
  const footerClasses = classNames({
    [classes.footer]: true,
    [classes.footerWhiteFont]: whiteFont
  });
  const aClasses = classNames({
    [classes.a]: true,
    [classes.footerWhiteFont]: whiteFont
  });
  return (
    <footer className={footerClasses}>
      <div className={classes.container}>
        <div className={classes.left}>
          <List className={classes.list}>
            <ListItem className={classes.inlineBlock}>
              <a
                href="/"
                className={classes.block}
              >
                Home
              </a>
            </ListItem>
            <ListItem className={classes.inlineBlock}>
              <a
                href="/booking-history"
                className={classes.block}
              >
                My Account
              </a>
            </ListItem>
            <ListItem className={classes.inlineBlock}>
              <a
                href="/about-us"
                className={classes.block}
              >
                About Us
              </a>
            </ListItem>
            <ListItem className={classes.inlineBlock}>
              <a
                href="/privacy-policy"
                className={classes.block}
              >
                Privacy Policy
              </a>
            </ListItem>
          </List>
        </div>
        <div className={classes.right}>
          &copy; {1900 + new Date().getYear() + " "} 
          <a
            href="https://exicube.com"
            className={aClasses}
            target="_blank"
          >
            Exicube
          </a>
        </div>
      </div>
    </footer>
  );
}

Footer.propTypes = {
  whiteFont: PropTypes.bool
};
