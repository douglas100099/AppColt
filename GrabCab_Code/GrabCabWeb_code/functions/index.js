const functions = require('firebase-functions');
const fetch = require("node-fetch");
const admin = require('firebase-admin');

const paypalcheckout = require('./providers/paypal/checkout');
const stripecheckout = require('./providers/stripe/checkout');
const braintreecheckout = require('./providers/braintree/checkout');

admin.initializeApp();

exports.get_providers = functions.https.onRequest((request, response) => {
    response.send([
        {
            name: 'paypal',
            image: 'https://dev.exicube.com/images/paypal-logo.png',
            link: '/paypal_link'
        },
        {
            name: 'stripe',
            image: 'https://dev.exicube.com/images/stripe-logo.png',
            link: '/stripe_link'
        },
        {
            name: 'braintree',
            image: 'https://dev.exicube.com/images/braintree-logo.png',
            link: '/braintree_link'
        }
    ]);
});

exports.paypal_link = functions.https.onRequest(paypalcheckout.render_checkout);

exports.stripe_link = functions.https.onRequest(stripecheckout.render_checkout);
exports.process_stripe_payment = functions.https.onRequest(stripecheckout.process_checkout);

exports.braintree_link = functions.https.onRequest(braintreecheckout.render_checkout);
exports.process_braintree_payment = functions.https.onRequest(braintreecheckout.process_checkout);

exports.success = functions.https.onRequest((request, response) => {
    var amount_line = request.query.amount ? `<h3>Your Payment of <strong>${request.query.amount}</strong> was Successfull</h3>` : '';
    var order_line = request.query.order_id ? `<h5>Order No : ${request.query.order_id}</h5>` : '';
    var transaction_line = request.query.transaction_id ? `<h6>Transaction Ref No : ${request.query.transaction_id}</h6>` : '';
    response.status(200).send(`
        <!DOCTYPE HTML>
        <html>
        <head> 
            <meta name='viewport' content='width=device-width, initial-scale=1.0'> 
            <title>Payment Success</title> 
            <style> 
                body { font-family: Verdana, Geneva, Tahoma, sans-serif; } 
                h3, h6, h4 { margin: 0px; } 
                .container { display: flex; justify-content: center; align-items: center; width: 100%; height: 100%; padding: 60px 0; } 
                .contentDiv { padding: 40px; box-shadow: 0px 0px 12px 0px rgba(0, 0, 0, 0.3); border-radius: 10px; width: 70%; margin: 0px auto; text-align: center; } 
                .contentDiv img { width: 140px; display: block; margin: 0px auto; margin-bottom: 10px; } 
                .contentDiv h3 { font-size: 22px; } 
                .contentDiv h6 { font-size: 13px; margin: 5px 0; } 
                .contentDiv h4 { font-size: 16px; } 
            </style>
        </head>
        <body> 
            <div class='container'>
                <div class='contentDiv'> 
                    <img src='https://cdn.pixabay.com/photo/2012/05/07/02/13/accept-47587_960_720.png' alt='Icon'> 
                    ${amount_line}
                    ${order_line}
                    ${transaction_line}
                    <h4>Thank you for your payment.</h4>
                </div>
            </div>
        </body>
        </html>
    `);
});

exports.cancel = functions.https.onRequest((request, response) => {
    response.send(`
        <!DOCTYPE HTML>
        <html>
        <head> 
            <meta name='viewport' content='width=device-width, initial-scale=1.0'> 
            <title>Payment Cancelled</title> 
            <style> 
                body { font-family: Verdana, Geneva, Tahoma, sans-serif; } 
                .container { display: flex; justify-content: center; align-items: center; width: 100%; height: 100%; padding: 60px 0; } 
                .contentDiv { padding: 40px; box-shadow: 0px 0px 12px 0px rgba(0, 0, 0, 0.3); border-radius: 10px; width: 70%; margin: 0px auto; text-align: center; } 
                .contentDiv img { width: 140px; display: block; margin: 0px auto; margin-bottom: 10px; } 
                h3, h6, h4 { margin: 0px; } .contentDiv h3 { font-size: 22px; } 
                .contentDiv h6 { font-size: 13px; margin: 5px 0; } 
                .contentDiv h4 { font-size: 16px; } 
            </style>
        </head>
        <body> 
            <div class='container'> 
                <div class='contentDiv'> 
                    <img src='https://cdn.pixabay.com/photo/2012/05/07/02/13/cancel-47588_960_720.png' alt='Icon'> 
                    <h3>Your Payment Failed</h3> 
                    <h4>Please try again.</h4>
                </div> 
            </div>
        </body>
        </html>
    `);
});

const getDistance = (lat1, lon1, lat2, lon2) => {
    if ((lat1 === lat2) && (lon1 === lon2)) {
        return 0;
    }
    else {
        var radlat1 = Math.PI * lat1 / 180;
        var radlat2 = Math.PI * lat2 / 180;
        var theta = lon1 - lon2;
        var radtheta = Math.PI * theta / 180;
        var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
        if (dist > 1) {
            dist = 1;
        }
        dist = Math.acos(dist);
        dist = dist * 180 / Math.PI;
        dist = dist * 60 * 1.1515;
        dist = dist * 1.609344;
        return dist;
    }
}

const RequestPushMsg = (token, msg) => {
    fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'accept-encoding': 'gzip, deflate',
            'host': 'exp.host'
        },
        body: JSON.stringify({
            "to": token,
            "title": 'GrabCab Notification',
            "body": msg,
            "data": { "msg": msg, "title": 'GrabCab Notification' },
            "priority": "high",
            "sound": "default",
            "channelId": "messages",
            "_displayInForeground": true
        }),
    }).then((response) => response.json())
        .then((responseJson) => {
            return responseJson
        })
        .catch((error) => { console.log(error) });
    return true;
}

exports.bookingScheduler = functions.pubsub.schedule('every 5 minutes').onRun((context) => {
    admin.database().ref('/bookings').orderByChild("status").equalTo('NEW').once("value", (snapshot) => {
        let bookings = snapshot.val();
        if(bookings){
            for (let key in bookings) {
                let booking = bookings[key];
                booking.key = key;
                let date1 = new Date();
                let date2 = new Date(booking.tripdate);
                let diffTime = date2 - date1;
                let diffMins = diffTime / (1000 * 60);
                let count = 0;
                if (diffMins > 0 && diffMins < 15 && booking.bookLater && !booking.requestedDriver) {
                    admin.database().ref('/users').orderByChild("queue").equalTo(false).once("value", (ddata) => {
                        let drivers = ddata.val();
                        if(drivers){
                            for(let dkey in drivers){
                                let driver = drivers[dkey];
                                driver.key = dkey;
                                if(driver.usertype === 'driver' && driver.approved === true && driver.driverActiveStatus === true && driver.location){
                                    let originalDistance = getDistance(booking.pickup.lat, booking.pickup.lng, driver.location.lat, driver.location.lng);
                                    if (originalDistance <= 10 && driver.carType === booking.carType) {
                                        admin.database().ref("users/" + driver.key + "/waiting_riders_list/" + booking.key).set(booking);
                                        admin.database().ref('bookings/' + booking.key + '/requestedDriver/' + count.toString()).set(driver.key);
                                        count=count+1;
                                        RequestPushMsg(driver.pushToken, 'You Have A New Booking Request');
                                    }                                       
                                }
                            }
                        }
                    });
                }
                if (diffMins < -15) {
                    admin.database().ref("users/" + booking.customer + "/my-booking/" + booking.key).update({
                        status: 'CANCELLED',
                        reason: 'RIDE AUTO CANCELLED. NO RESPONSE'
                    }).then(() => {
                        let requestedDrivers = booking.requestedDriver;
                        if(requestedDrivers && requestedDrivers.length>0){
                            for (let i = 0; i < requestedDrivers.length; i++) {
                                admin.database().ref("users/" + requestedDrivers[i] + "/waiting_riders_list/" + booking.key).remove();
                            }
                            admin.database().ref("bookings/" + booking.key  + "/requestedDriver").remove();
                            admin.database().ref('bookings/' + booking.key).update({
                                status: 'CANCELLED',
                                reason: 'RIDE AUTO CANCELLED. NO RESPONSE'
                            });
                        }
                        return true;
                    }).catch(error=>{
                        console.log(error);
                        return false;
                    })
                }
            }
        }
    });
});