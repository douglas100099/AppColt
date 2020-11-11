const templateLib = require('./template');

const paypal_client_id = 'EFfaL1K4gmmpNnyLPzhFtJoNhVP2tf_RU-fG4-QhB1KEYk2vmbFJ6Zpf9Y69lwM4GWoR7etIz3o2RQAI';

module.exports.render_checkout = function (request, response) {
    var amount = request.body.amount;
    var currency = request.body.currency;
    var server_url = request.protocol + "://" + request.get('host');
    response.send(templateLib.getTemplate(server_url, paypal_client_id, amount, currency));
};