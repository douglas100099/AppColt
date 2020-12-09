const functions = require('firebase-functions');
const fetch = require("node-fetch");
const admin = require('firebase-admin');

const paypalcheckout = require('./providers/paypal/checkout');
const stripecheckout = require('./providers/stripe/checkout');
const braintreecheckout = require('./providers/braintree/checkout');
const { user } = require('firebase-functions/lib/providers/auth');

global.Headers = fetch.Headers;

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
            "title": 'Colt',
            "body": msg,
            "data": { "msg": msg, "title": 'Colt' },
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

const checkUserAsaas = async (cpf) => {
    var myHeaders = new Headers();
    myHeaders.append("access_token", "d9bbfe4544663b00197cf53b35c3d9f84ae7bf8b85fa09c3aed37a2c65dcea3a");
    //myHeaders.append("Cookie", "AWSALB=DD59xUIYEBepYXNoNytiXuFxbzTP7ffO0wNtGIp9XHLjWQL+dY0zcJd4YboggaWME0K0+E4bVjycoUr53xlP+RCS1eG9Mjqv39RWRPKYauJV5jtCru6VN8JDUkE9; AWSALBCORS=DD59xUIYEBepYXNoNytiXuFxbzTP7ffO0wNtGIp9XHLjWQL+dY0zcJd4YboggaWME0K0+E4bVjycoUr53xlP+RCS1eG9Mjqv39RWRPKYauJV5jtCru6VN8JDUkE9");

    var requestOptions = {
        method: 'GET',
        headers: myHeaders,
        redirect: 'follow'
    };

    return fetch("https://www.asaas.com/api/v3/customers?cpfCnpj=" + cpf, requestOptions)
        .then(response => response.text())
        .then(result => {
            let data = {}
            data = JSON.parse(result)
            return data
        })
        .catch(error => {
            throw new Error("Erro ao verificar se o user asaas existe")
        })
}

const sendRequestPayment = async (customer, dueDate, value, externalReference) => {
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", " application/json");
    myHeaders.append("access_token", "d9bbfe4544663b00197cf53b35c3d9f84ae7bf8b85fa09c3aed37a2c65dcea3a");
    // myHeaders.append("Cookie", "AWSALB=xqREzA9/fNyj+AMH+sRST2COLviwz1Rn7wnVyUCBpVx0ADn0CzFn9qbowYhxVI1EbhU3L1bv7SdMH9ANurzw81ErJmP6Xs74tHLogeN6CaTLR56cz3CqdDw93wMH; AWSALBCORS=xqREzA9/fNyj+AMH+sRST2COLviwz1Rn7wnVyUCBpVx0ADn0CzFn9qbowYhxVI1EbhU3L1bv7SdMH9ANurzw81ErJmP6Xs74tHLogeN6CaTLR56cz3CqdDw93wMH");

    let newBody = {
        'customer': customer,
        'billingType': 'BOLETO',
        'dueDate': dueDate,
        'value': value,
        'description': 'Taxa quinzenal do aplicativo de transporte Colt.',
        'externalReference': externalReference,
        'discount': {
            'value': 5,
            'dueDateLimitDays': 0,
            "type": "PERCENTAGE"
        },
        'fine': {
            'value': 1,
            'type': 'PERCENTAGE'
        },
        'interest': {
            'value': 2,
            'type': 'PERCENTAGE'
        },
        'postalService': false
    }

    var requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: JSON.stringify(newBody),
        redirect: 'follow'
    };

    return fetch("https://www.asaas.com/api/v3/payments", requestOptions)
        .then(response => response.text())
        .then(result => {
            return console.log("COBRANÇA CRIADA >>>> " + result)
        })
        .catch(error => {
            throw new Error("Erro ao enviar boleto")
        })
}

const createUserAsaas = async (raw) => {
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", " application/json");
    myHeaders.append("access_token", "d9bbfe4544663b00197cf53b35c3d9f84ae7bf8b85fa09c3aed37a2c65dcea3a");
    //myHeaders.append("Cookie", "AWSALB=xqREzA9/fNyj+AMH+sRST2COLviwz1Rn7wnVyUCBpVx0ADn0CzFn9qbowYhxVI1EbhU3L1bv7SdMH9ANurzw81ErJmP6Xs74tHLogeN6CaTLR56cz3CqdDw93wMH; AWSALBCORS=xqREzA9/fNyj+AMH+sRST2COLviwz1Rn7wnVyUCBpVx0ADn0CzFn9qbowYhxVI1EbhU3L1bv7SdMH9ANurzw81ErJmP6Xs74tHLogeN6CaTLR56cz3CqdDw93wMH");

    var requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: JSON.stringify(raw),
        redirect: 'follow'
    };

    return fetch("https://www.asaas.com/api/v3/customers", requestOptions)
        .then(response => response.text())
        .then(result => {
            let data = {}
            data = JSON.parse(result)
            return data
        })
        .catch(error => {
            throw new Error("Erro ao criar usuario Asaas")
        })
}

const checkPaymentAsaas = async (custumer) => {
    var myHeaders = new Headers();
    myHeaders.append("access_token", "d9bbfe4544663b00197cf53b35c3d9f84ae7bf8b85fa09c3aed37a2c65dcea3a");
    //myHeaders.append("Cookie", "AWSALB=8ot6kpPxY2hftKe48q10n7WrdptQn7kvONpHNj3+Lh+BpeccnlOE/SE9lsl0XOKMKAVDqhq7QTXvbp7ogV7O9FARNb6ScQqymhS6VlFWkn81PzeYqp7bTVmUZW96; AWSALBCORS=8ot6kpPxY2hftKe48q10n7WrdptQn7kvONpHNj3+Lh+BpeccnlOE/SE9lsl0XOKMKAVDqhq7QTXvbp7ogV7O9FARNb6ScQqymhS6VlFWkn81PzeYqp7bTVmUZW96");

    var requestOptions = {
        method: 'GET',
        headers: myHeaders,
        redirect: 'follow'
    };

    return fetch("https://www.asaas.com/api/v3/payments?customer=" + custumer, requestOptions)
        .then(response => response.text())
        .then(result => {
            let data = {}
            data = JSON.parse(result)
            return data
        })
        .catch(error => {
            throw new Error("Erro ao verificar status do pagamento")
        })
}

exports.requestPaymentDrivers_1 = functions.region('southamerica-east1').pubsub.schedule('30 19 1 * *').timeZone('America/Sao_Paulo').onRun((context) => {
    //'30 19 15 * *'
    return admin.database().ref('/users').orderByChild("usertype").equalTo('driver').once("value", (data) => {
        let dataUsers = data.val()
        if (dataUsers) {
            for (let key in dataUsers) {
                if (dataUsers[key].saldo) {
                    if (dataUsers[key].saldo <= -5) {
                        checkUserAsaas(dataUsers[key].cpfNum).then((response) => {
                            let newValue = dataUsers[key].saldo * (-1)

                            //Pega a data atual e adiciona +5 pro vencimento do boleto
                            var date = new Date()
                            var dataG = new Date(date)
                            var resulta = dataG.setDate(dataG.getDate() + 5)
                            var resultt = new Date(resulta)
                            let resultToAsaas = resultt.getFullYear() + '-' + (resultt.getMonth() + 1) + '-' + resultt.getDate()

                            if (response.totalCount >= 1) {
                                //user Asaas existe
                                sendRequestPayment(response.data[0].id, resultToAsaas, newValue, key).then(() => {
                                    admin.database().ref('users/' + key + '/').update({
                                        saldo: 0,
                                        payment_waiting: {
                                            create_date: new Date().toLocaleDateString('pt-BR'),
                                            asaas_id: response.data[0].id,
                                            value: newValue,
                                            vencimento_boleto: resultToAsaas
                                        }
                                    })
                                    return null
                                }).catch(error => {
                                    throw new Error("Erro ao Enviar boleto Asaas - Função principal")
                                })
                            }
                            //user n existe no Asaas
                            else {
                                let body = {
                                    'name': dataUsers[key].firstName,
                                    'email': dataUsers[key].email,
                                    'mobilePhone': dataUsers[key].mobile,
                                    'cpfCnpj': dataUsers[key].cpfNum,
                                    'externalReference': key,
                                    'notificationDisabled': false,
                                }

                                //Cria um novo usuario no Asaas
                                createUserAsaas(body).then((response) => {

                                    sendRequestPayment(response.id, resultToAsaas, newValue, key).then(() => {
                                        admin.database().ref('users/' + key + '/').update({
                                            saldo: 0,
                                            payment_waiting: {
                                                create_date: new Date().toLocaleDateString('pt-BR'),
                                                asaas_id: response.id,
                                                value: newValue,
                                                vencimento_boleto: resultToAsaas
                                            }
                                        })
                                        return null
                                    }).catch(error => {
                                        throw new Error("Erro ao criar usuario Asaas - Função principal")
                                    })
                                    return null
                                }).catch(error => {
                                    throw new Error("Erro ao criar usuario Asaas - Função principal")
                                })
                            }
                            return null
                        }).catch(error => {
                            throw new Error("Erro ao checar usuario Asaas - Função principal")
                        })
                    }
                }
            }
        }
    })
})

exports.requestPaymentDrivers_16 = functions.region('southamerica-east1').pubsub.schedule('30 19 16 * *').timeZone('America/Sao_Paulo').onRun((context) => {
    //'30 19 15 * *'
    return admin.database().ref('/users').orderByChild("usertype").equalTo('driver').once("value", (data) => {
        let dataUsers = data.val()
        if (dataUsers) {
            for (let key in dataUsers) {
                if (dataUsers[key].saldo) {
                    if (dataUsers[key].saldo <= -5) {
                        checkUserAsaas(dataUsers[key].cpfNum).then((response) => {
                            let newValue = dataUsers[key].saldo * (-1)

                            //Pega a data atual e adiciona +5 pro vencimento do boleto
                            var date = new Date()
                            var dataG = new Date(date)
                            var resulta = dataG.setDate(dataG.getDate() + 5)
                            var resultt = new Date(resulta)
                            let resultToAsaas = resultt.getFullYear() + '-' + (resultt.getMonth() + 1) + '-' + resultt.getDate()

                            if (response.totalCount >= 1) {
                                //user Asaas existe
                                sendRequestPayment(response.data[0].id, resultToAsaas, newValue, key).then(() => {
                                    admin.database().ref('users/' + key + '/').update({
                                        saldo: 0,
                                        payment_waiting: {
                                            create_date: new Date().toLocaleDateString('pt-BR'),
                                            asaas_id: response.data[0].id,
                                            value: newValue,
                                            vencimento_boleto: resultToAsaas
                                        }
                                    })
                                    return null
                                }).catch(error => {
                                    throw new Error("Erro ao Enviar boleto Asaas - Função principal")
                                })
                            }
                            //user n existe no Asaas
                            else {
                                let body = {
                                    'name': dataUsers[key].firstName,
                                    'email': dataUsers[key].email,
                                    'mobilePhone': dataUsers[key].mobile,
                                    'cpfCnpj': dataUsers[key].cpfNum,
                                    'externalReference': key,
                                    'notificationDisabled': false,
                                }

                                //Cria um novo usuario no Asaas
                                createUserAsaas(body).then((response) => {

                                    sendRequestPayment(response.id, resultToAsaas, newValue, key).then(() => {
                                        admin.database().ref('users/' + key + '/').update({
                                            saldo: 0,
                                            payment_waiting: {
                                                create_date: new Date().toLocaleDateString('pt-BR'),
                                                asaas_id: response.id,
                                                value: newValue,
                                                vencimento_boleto: resultToAsaas
                                            }
                                        })
                                        return null
                                    }).catch(error => {
                                        throw new Error("Erro ao criar usuario Asaas - Função principal")
                                    })
                                    return null
                                }).catch(error => {
                                    throw new Error("Erro ao criar usuario Asaas - Função principal")
                                })
                            }
                            return null
                        }).catch(error => {
                            throw new Error("Erro ao checar usuario Asaas - Função principal")
                        })
                    }
                }
            }
        }
    })
})

exports.verifyDriversPayment_6 = functions.region('southamerica-east1').pubsub.schedule('00 21 6 * *').timeZone('America/Sao_Paulo').onRun((context) => {

    return admin.database().ref('/users').orderByChild("usertype").equalTo('driver').once("value", (data) => {
        let dataUsers = data.val()
        if (dataUsers) {
            for (let key in dataUsers) {
                if (dataUsers[key].payment_waiting) {
                    checkPaymentAsaas(dataUsers[key].payment_waiting.asaas_id).then((response) => {

                        if (response.totalCount >= 1) {
                            if (response.data[0].status !== 'RECEIVED' || response.data[0].status !== 'CONFIRMED') {

                                //Bloqueia o motorista 
                                admin.database().ref('users/' + key + '/').update({
                                    blocked_by_payment: {
                                        date_blocked: new Date().toLocaleDateString('pt-BR'),
                                        reason: 'Pagamento não confirmado 5 dias após a emissão do boleto.',
                                        id_asaas: response.data[0].customer
                                    }
                                })
                            } else {
                                return admin.database().ref('users/' + key + '/' + payment_waiting + '/').remove()
                            }
                        }
                        return true
                    }).catch(error => {
                        throw new Error("Erro ao verificar pagamento motorista - Principal")
                    })
                }
            }
        }
    })
})

exports.verifyDriversPayment_21 = functions.region('southamerica-east1').pubsub.schedule('00 21 21 * *').timeZone('America/Sao_Paulo').onRun((context) => {

    return admin.database().ref('/users').orderByChild("usertype").equalTo('driver').once("value", (data) => {
        let dataUsers = data.val()
        if (dataUsers) {
            for (let key in dataUsers) {
                if (dataUsers[key].payment_waiting) {
                    checkPaymentAsaas(dataUsers[key].payment_waiting.asaas_id).then((response) => {

                        if (response.totalCount >= 1) {
                            if (response.data[0].status !== 'RECEIVED' || response.data[0].status !== 'CONFIRMED') {

                                //Bloqueia o motorista 
                                admin.database().ref('users/' + key + '/').update({
                                    blocked_by_payment: {
                                        date_blocked: new Date().toLocaleDateString('pt-BR'),
                                        reason: 'Pagamento não confirmado 5 dias após a emissão do boleto.',
                                        id_asaas: response.data[0].customer
                                    }
                                })
                            } else {
                                return admin.database().ref('users/' + key + '/' + payment_waiting + '/').remove()
                            }
                        }
                        return true
                    }).catch(error => {
                        throw new Error("Erro ao verificar pagamento motorista - Principal")
                    })
                }
            }
        }
    })
})

exports.manageMoney = functions.region('southamerica-east1').database.ref('bookings/{bookingsId}/pagamento/manageMoney').onCreate((snap, context) => {
    const bookingId = context.params.bookingsId;
    admin.database().ref('bookings/' + bookingId).on("value", (data) => {
        let dataBooking = data.val();
        let paymentMode = dataBooking.pagamento.payment_mode

        if (dataBooking.status === 'END' && dataBooking.pagamento.payment_status === 'PAID') {
            let driverShare = parseFloat(dataBooking.pagamento.trip_cost) - parseFloat(dataBooking.pagamento.convenience_fees)

            if (paymentMode === 'Dinheiro') {
                admin.database().ref('users/' + dataBooking.driver + '/ganhos/' + bookingId + '/').update({
                    data: new Date().toString(),
                    ganho: driverShare,
                    hora: new Date().toLocaleTimeString('pt-BR'),
                    taxa: dataBooking.pagamento.convenience_fees,
                }).then(() => {
                    admin.database().ref('users/' + dataBooking.driver + '/').once('value', driverData => {
                        let saldoDriver = driverData.val().saldo
                        if (saldoDriver) {
                            let newSaldo = saldoDriver - dataBooking.pagamento.convenience_fees

                            //Atualiza negativando o saldo do motorista no banco com a taxa da corrida atual
                            admin.database().ref('users/' + dataBooking.driver + '/').update({
                                saldo: newSaldo
                            })
                        }
                        else {
                            let newSaldo = -dataBooking.pagamento.convenience_fees
                            admin.database().ref('users/' + dataBooking.driver + '/').update({
                                saldo: newSaldo
                            })
                        }
                    })
                    return true
                }).catch(error => {
                    throw new Error("Erro executar função Dinheiro")
                })
            }
            else if (paymentMode === 'Carteira') {
                admin.database().ref('users/' + dataBooking.driver + '/ganhos/' + bookingId + '/').update({
                    data: new Date().toString(),
                    ganho: driverShare,
                    hora: new Date().toLocaleTimeString('pt-BR'),
                    taxa: dataBooking.pagamento.convenience_fees,
                }).then(() => {
                    admin.database().ref('users/' + dataBooking.driver + '/').once('value', driverData => {
                        let saldoDriver = driverData.val().saldo
                        if (saldoDriver) {
                            let newValue = driverShare + saldoDriver

                            //ATUALIZA O SALDO DO MOTORISTA
                            admin.database().ref('users/' + dataBooking.driver + '/').update({
                                saldo: newValue
                            })
                        }
                        else {
                            //ATUALIZA O SALDO DO MOTORISTA
                            admin.database().ref('users/' + dataBooking.driver + '/').update({
                                saldo: driverShare
                            })
                        }
                    })
                    return true
                }).catch(error => {
                    throw new Error("Erro executar função Carteira")
                })
            }
            else if (paymentMode === 'Dinheiro/Carteira') {
                admin.database().ref('users/' + dataBooking.driver + '/ganhos/' + bookingId + '/').update({
                    data: new Date().toString(),
                    ganho: driverShare,
                    hora: new Date().toLocaleTimeString('pt-BR'),
                    taxa: dataBooking.pagamento.convenience_fees,
                }).then(() => {
                    admin.database().ref('users/' + dataBooking.driver + '/').once('value', driverData => {
                        let saldoDriver = driverData.val().saldo

                        if (dataBooking.pagamento.usedWalletMoney >= dataBooking.pagamento.convenience_fees) {
                            if (saldoDriver) {
                                let newSaldo = saldoDriver + (dataBooking.pagamento.usedWalletMoney - dataBooking.pagamento.convenience_fees)
                                admin.database().ref('users/' + dataBooking.driver + '/').update({
                                    saldo: newSaldo
                                })
                            }
                            else {
                                admin.database().ref('users/' + dataBooking.driver + '/').update({
                                    saldo: dataBooking.pagamento.usedWalletMoney - dataBooking.pagamento.convenience_fees
                                })
                            }
                        } else {
                            if (saldoDriver) {
                                let newSaldo = saldoDriver + (dataBooking.pagamento.usedWalletMoney - dataBooking.pagamento.convenience_fees)

                                admin.database().ref('users/' + dataBooking.driver + '/').update({
                                    saldo: newSaldo
                                })
                            }
                            else {
                                admin.database().ref('users/' + dataBooking.driver + '/').update({
                                    saldo: dataBooking.pagamento.usedWalletMoney - dataBooking.pagamento.convenience_fees
                                })
                            }
                        }
                    })
                    return true
                }).catch(error => {
                    throw new Error("Erro executar função Dinheiro/Carteira")
                })
            }
        }
    })
})

exports.finalCalcBooking = functions.region('southamerica-east1').database.ref('bookings/{bookingsId}/pagamento/finalCalcBooking').onCreate((snap, context) => {
    const bookingId = context.params.bookingsId;
    admin.database().ref('bookings/' + bookingId).on("value", (data) => {
        let dataBooking = data.val();
        let paymentMode = dataBooking.pagamento.payment_mode

        if (dataBooking.status === 'END' && dataBooking.pagamento.payment_status === 'IN_PROGRESS') {
            admin.database().ref('users/' + dataBooking.customer).once("value", (userData) => {
                let walletBalance = userData.val().walletBalance

                if (paymentMode === 'Carteira' || paymentMode === 'Dinheiro/Carteira') {
                    //Caso o passageiro tenha mais dinheiro na carteira do q o valor final da corrida
                    if (walletBalance >= dataBooking.pagamento.customer_paid) {
                        let newValue = parseFloat(walletBalance) - parseFloat(dataBooking.pagamento.customer_paid)
                        admin.database().ref('bookings/' + bookingId + '/pagamento').update({
                            usedWalletMoney: dataBooking.pagamento.customer_paid,
                            cashPaymentAmount: 0,
                            payment_mode: paymentMode === 'Carteira' ? 'Carteira' : 'Dinheiro/Carteira',
                            payment_status: 'PAID'
                        })
                            .then(() => {
                                admin.database().ref('users/' + dataBooking.customer + '/my-booking/' + bookingId + '/pagamento').update({
                                    usedWalletMoney: dataBooking.pagamento.customer_paid,
                                    cashPaymentAmount: 0,
                                    payment_mode: paymentMode === 'Carteira' ? 'Carteira' : 'Dinheiro/Carteira',
                                    payment_status: 'PAID'
                                })
                                    .then(() => {
                                        admin.database().ref('users/' + dataBooking.driver + '/my_bookings/' + bookingId + '/pagamento').update({
                                            usedWalletMoney: dataBooking.pagamento.customer_paid,
                                            cashPaymentAmount: 0,
                                            payment_mode: paymentMode === 'Carteira' ? 'Carteira' : 'Dinheiro/Carteira',
                                            payment_status: 'PAID'
                                        }).then(() => {
                                            //ATUALIZA A CARTEIRA DO PASSAGEIRO RERTIRANDO O VALOR USADO 
                                            admin.database().ref('users/' + dataBooking.customer + '/').update({
                                                walletBalance: newValue
                                            }).then(() => {
                                                admin.database().ref('users/' + dataBooking.customer + '/walletHistory').push({
                                                    amount: dataBooking.pagamento.customer_paid,
                                                    date: new Date().toLocaleDateString('pt-BR'),
                                                    booking_ref: bookingId,
                                                })
                                                return true
                                            }).catch(error => {
                                                throw new Error("Erro atualizar carteira Passageiro")
                                            })
                                            return true
                                        }).catch(error => {
                                            throw new Error("Erro atualizar carteira Passageiro")
                                        })
                                        return true
                                    }).catch(error => {
                                        throw new Error("Erro atualizar corrida do Motorista")
                                    })
                                return true
                            }).catch(error => {
                                throw new Error("Erro atualizar corrida do passageiro")
                            })
                    }
                    //Caso o passageiro tenha menos dinheiro na carteira, ele pagará o restante em dinheiro
                    else if (walletBalance < dataBooking.pagamento.customer_paid) {
                        let newValue = (dataBooking.pagamento.customer_paid) - (walletBalance)

                        admin.database().ref('bookings/' + bookingId + '/pagamento').update({
                            usedWalletMoney: walletBalance,
                            cashPaymentAmount: newValue,
                            observacao: 'Recalculado/Din+Card',
                            payment_status: 'PAID'
                        })
                            .then(() => {
                                admin.database().ref('users/' + dataBooking.customer + '/my-booking/' + bookingId + '/pagamento').update({
                                    usedWalletMoney: walletBalance,
                                    cashPaymentAmount: newValue,
                                    observacao: 'Recalculado/Din+Card',
                                    payment_status: 'PAID'
                                })
                                    .then(() => {
                                        admin.database().ref('users/' + dataBooking.driver + '/my_bookings/' + bookingId + '/pagamento').update({
                                            usedWalletMoney: walletBalance,
                                            cashPaymentAmount: newValue,
                                            observacao: 'Recalculado/Din+Card',
                                            payment_status: 'PAID'
                                        }).then(() => {

                                            //ATUALIZA A CARTEIRA DO PASSAGEIRO RERTIRANDO O VALOR USADO 
                                            admin.database().ref('users/' + dataBooking.customer + '/').update({
                                                walletBalance: 0
                                            }).then(() => {
                                                admin.database().ref('users/' + dataBooking.customer + '/walletHistory').push({
                                                    amount: walletBalance,
                                                    date: new Date().toLocaleDateString('pt-BR'),
                                                    booking_ref: bookingId,
                                                })
                                                return true
                                            }).catch(error => {
                                                throw new Error("Erro atualizar carteira Passageiro")
                                            })
                                            return true
                                        }).catch(error => {
                                            throw new Error("Erro atualizar carteira Passageiro")
                                        })
                                        return true
                                    }).catch(error => {
                                        throw new Error("Erro atualizar corrida do Motorista")
                                    })
                                return true
                            }).catch(error => {
                                throw new Error("Erro atualizar corrida do passageiro")
                            })
                    }
                } else if (paymentMode === 'Dinheiro') {
                    admin.database().ref('bookings/' + bookingId + '/pagamento').update({
                        payment_status: 'PAID'
                    })
                        .then(() => {
                            admin.database().ref('users/' + dataBooking.customer + '/my-booking/' + bookingId + '/pagamento').update({
                                payment_status: 'PAID'
                            })
                                .then(() => {
                                    admin.database().ref('users/' + dataBooking.driver + '/my_bookings/' + bookingId + '/pagamento').update({
                                        payment_status: 'PAID'
                                    })
                                    return true
                                })
                                .catch(error => {
                                    throw new Error("Erro atualizar STATUS PAID USANDO DINHEIRO - my_bookings")
                                })
                            return true
                        })
                        .catch(error => {
                            throw new Error("Erro atualizar STATUS PAID USANDO DINHEIRO - my-booking")
                        })
                }
            })
        }
    })
})

exports.cancelSearchDriver = functions.region('southamerica-east1').database.ref('bookings/{bookingsId}').onCreate((snap, context) => {
    setTimeout(() => {
        admin.database().ref('bookings/' + context.params.bookingsId).once("value", (data) => {
            let dataBooking = data.val();
            if (dataBooking.status === 'NEW') {
                admin.database().ref('users/' + dataBooking.customer + '/my-booking/' + context.params.bookingsId).update({ status: 'TIMEOUT' })
                return admin.database().ref('bookings/' + context.params.bookingsId).update({ status: 'TIMEOUT' })
            } else {
                return false
            }
        })
    }, 300000)
})

exports.removeCancelValue = functions.region('southamerica-east1').database.ref('bookings/{bookingsId}/pagamento/cancelRate').onCreate((snap, context) => {
    admin.database().ref('bookings/' + context.params.bookingsId).on("value", (data) => {
        let dataBooking = data.val();
        if (dataBooking.status === 'END' && dataBooking.pagamento.payment_status === 'PAID') {
            return admin.database().ref('users/' + dataBooking.customer + '/cancell_details/').remove()
        }
        else if (dataBooking.status === 'CANCELLED') {
            return false
        }
    })
})

exports.addDetailsToPromo = functions.region('southamerica-east1').database.ref('bookings/{bookingsId}/pagamento/usedDiscount').onCreate((snap, context) => {
    return admin.database().ref('bookings/' + context.params.bookingsId).on("value", (data) => {
        let dataBooking = data.val();

        if (dataBooking.status === 'END' && dataBooking.pagamento.payment_status === 'PAID') {
            return admin.database().ref('offers/' + dataBooking.pagamento.promoKey).once("value", dataOffer => {
                let offerData = dataOffer.val()

                console.log("OFFERS >> " + offerData)

                let user_avail = offerData.user_avail;

                console.log("USER AVAIL >> " + user_avail)

                if (user_avail) {
                    return admin.database().ref('offers/' + dataBooking.pagamento.promoKey + '/user_avail/details').push({
                        userId: dataBooking.customer
                    })
                    .then(() => {
                        return admin.database().ref('offers/' + dataBooking.pagamento.promoKey + '/user_avail/').update({ count: user_avail.count + 1 })
                    })
                    .catch(error => {
                        return error
                    })
                } else {
                    return admin.database().ref('offers/' + dataBooking.pagamento.promoKey + '/user_avail/details').push({
                        userId: dataBooking.customer
                    })
                    .then(() => {
                        return admin.database().ref('offers/' + dataBooking.pagamento.promoKey + '/user_avail/').update({ count: 1 })
                    })
                    .catch(error => {
                        return error
                    })
                }
            })
        }
        else if (dataBooking.status === 'CANCELLED') {
            return false
        }
    })
})

exports.timerIgnoreBooking = functions.region('southamerica-east1').database.ref('bookings/{bookingsId}/requestedDriver/').onCreate((snap, context) => {
    const bookingId = context.params.bookingsId;
    const requested = snap.val()

    setTimeout(() => {
        admin.database().ref('bookings/' + bookingId).once("value", (data) => {
            let dataBooking = data.val()
            if (dataBooking) {
                if (requested === dataBooking['requestedDriver'] && dataBooking.status === 'NEW') {

                    admin.database().ref("users/" + requested + "/waiting_riders_list/" + bookingId).remove();
                    admin.database().ref("bookings/" + bookingId + "/requestedDriver").remove();

                    admin.database().ref("users/" + requested + "/in_reject_progress").update({
                        punido: false
                    });
                    admin.database().ref("users/" + requested).update({
                        driverActiveStatus: false,
                        queue: false
                    });

                    let arrayRejected = []
                    if (data.rejectedDrivers) {
                        for (let key in data.rejectedDrivers) {
                            data.rejectedDrivers[key]
                            arrayRejected.push(data.rejectedDrivers[key])
                        }
                        arrayRejected.push(requested)
                        admin.database().ref('bookings/' + bookingId).update({
                            rejectedDrivers: arrayRejected
                        })
                    } else {
                        arrayRejected.push(requested)
                        admin.database().ref('bookings/' + bookingId).update({
                            rejectedDrivers: arrayRejected
                        })
                    }

                    admin.database().ref('bookings/' + bookingId).update({ status: 'REJECTED' })
                }
            }
        })
    }, 15000)
})

/*exports.bookingScheduler = functions.pubsub.schedule('every 5 minutes').onRun((context) => {
    admin.database().ref('/bookings').orderByChild("status").equalTo('NEW').once("value", (snapshot) => {
        let bookings = snapshot.val();
        if (bookings) {
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
                        if (drivers) {
                            for (let dkey in drivers) {
                                let driver = drivers[dkey];
                                driver.key = dkey;
                                if (driver.usertype === 'driver' && driver.approved === true && driver.driverActiveStatus === true && driver.location) {
                                    let originalDistance = getDistance(booking.pickup.lat, booking.pickup.lng, driver.location.lat, driver.location.lng);
                                    if (originalDistance <= 10 && driver.carType === booking.carType) {
                                        admin.database().ref("users/" + driver.key + "/waiting_riders_list/" + booking.key).set(booking);
                                        admin.database().ref('bookings/' + booking.key + '/requestedDriver/' + count.toString()).set(driver.key);
                                        count = count + 1;
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
                        if (requestedDrivers && requestedDrivers.length > 0) {
                            for (let i = 0; i < requestedDrivers.length; i++) {
                                admin.database().ref("users/" + requestedDrivers[i] + "/waiting_riders_list/" + booking.key).remove();
                            }
                            admin.database().ref("bookings/" + booking.key + "/requestedDriver").remove();
                            admin.database().ref('bookings/' + booking.key).update({
                                status: 'CANCELLED',
                                reason: 'RIDE AUTO CANCELLED. NO RESPONSE'
                            });
                        }
                        return true;
                    }).catch(error => {
                        console.log(error);
                        return false;
                    })
                }
            }
        }
    });
});*/