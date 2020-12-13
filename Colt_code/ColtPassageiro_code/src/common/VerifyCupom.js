import languageJSON from '../common/language';


export function VerifyCupom(item, estimateFare) {
    var toDay = new Date();
    var promoValidity = item.promo_validity
    var expiryDay = promoValidity.split('/')[0];
    var em = promoValidity.split('/')[1];
    var expiryMonth = em == 12 ? em - 1 : em
    var expiryYear = promoValidity.split('/')[2];
    var fexpDate = expiryDay + '/' + expiryMonth + '/' + expiryYear
    var expDate = new Date(fexpDate)
    var dataPromo = {}
    dataPromo.values = []

    var userAvail = item.user_avail ? item.user_avail.details : false

    //Verifica se a promoção ja foi usada por alguem 
    if (userAvail != false) {

        if (toDay > expDate) {
            return (languageJSON.promo_exp)
        } else if (userAvail.count >= item.promo_usage_limit) {
            return (languageJSON.promo_limit)
        }
        else {
            let discounttype = item.promo_discount_type.toUpperCase();
            for (let key = 0; key < estimateFare.length; key++) {
                //Verifica se o tipo de desconto é porcentagem
                if (discounttype == 'PERCENTAGE') {

                    let discount = estimateFare[key] * item.promo_discount_value / 100; //Calculo de desconto
                    if (discount > item.max_promo_discount_value) {
                        let discount = item.max_promo_discount_value; //Atribuir o desconto maximo se o desconto for maior q o limite

                        dataPromo.discount = discount
                        dataPromo.promo_applied = true
                        dataPromo.promo_details = { promo_code: item.promoCode ? item.promoCode : '', promo_key: item.promoKey, promo_name: item.promo_name, discount_type: item.promo_discount_type, promo_discount_value: item.promo_discount_value, max_discount: item.max_promo_discount_value, minimumorder: item.min_order }
                        let payableAmmount = (estimateFare[key] - discount) < 0 ? 0 : (estimateFare[key] - discount).toFixed(2)
                        dataPromo.values.push(payableAmmount)
                        dataPromo.metodoPagamento = "Dinheiro"
                    } 
                    else {
                        dataPromo.discount = discount
                        dataPromo.promo_applied = true
                        dataPromo.promo_details = { promo_code: item.promoCode ? item.promoCode : '', promo_key: item.promoKey, promo_name: item.promo_name, discount_type: item.promo_discount_type, promo_discount_value: item.promo_discount_value, max_discount: item.max_promo_discount_value, minimumorder: item.min_order }
                        let payableAmmount = (estimateFare[key] - discount) < 0 ? 0 : (estimateFare[key] - discount).toFixed(2)
                        dataPromo.values.push(payableAmmount)
                        dataPromo.metodoPagamento = "Dinheiro"
                    }
                } 
                //Desconto tipo Flat
                else {
                    let discount = estimateFare[key] - item.promo_discount_value;
                    dataPromo.discount = discount
                    dataPromo.promo_applied = true
                    dataPromo.promo_details = { promo_code: item.promoCode ? item.promoCode : '', promo_key: item.promoKey, promo_name: item.promo_name, discount_type: item.promo_discount_type, promo_discount_value: item.promo_discount_value, max_discount: item.max_promo_discount_value, minimumorder: item.min_order }
                    let payableAmmount = discount < 0 ? 0 : discount.toFixed(2)
                    dataPromo.values.push(payableAmmount)
                    dataPromo.metodoPagamento = "Dinheiro"
                }
            }
            return dataPromo
        }
    }
    //Caso a promoção n tenha sido usada por ninguem
    else {
        if (toDay > expDate) {
            return (languageJSON.promo_exp)
        } else {
            let discounttype = item.promo_discount_type.toUpperCase();

            for (let key = 0; key < estimateFare.length; key++) {

                if (discounttype == 'PERCENTAGE') {
                    var discount = estimateFare[key] * item.promo_discount_value / 100;
                    if (discount > item.max_promo_discount_value) {
                        let discount = item.max_promo_discount_value;

                        dataPromo.discount = discount
                        dataPromo.promo_applied = true
                        dataPromo.promo_details = { promo_code: item.promoCode ? item.promoCode : '', promo_key: item.promoKey, promo_name: item.promo_name, discount_type: item.promo_discount_type, promo_discount_value: item.promo_discount_value, max_discount: item.max_promo_discount_value, minimumorder: item.min_order }
                        let payableAmmount = (estimateFare[key] - discount) < 0 ? 0 : (estimateFare[key] - discount).toFixed(2)
                        dataPromo.values.push(payableAmmount)
                        dataPromo.metodoPagamento = "Dinheiro"

                    } 
                    else {
                        dataPromo.discount = discount
                        dataPromo.promo_applied = true
                        dataPromo.promo_details = { promo_code: item.promoCode ? item.promoCode : '', promo_key: item.promoKey, promo_name: item.promo_name, discount_type: item.promo_discount_type, promo_discount_value: item.promo_discount_value, max_discount: item.max_promo_discount_value, minimumorder: item.min_order }
                        let payableAmmount = (estimateFare[key] - discount) < 0 ? 0 : (estimateFare[key] - discount).toFixed(2)
                        dataPromo.values.push(payableAmmount)
                        dataPromo.metodoPagamento = "Dinheiro"
                    }
                } 
                else {
                    let discount = estimateFare[key] - item.promo_discount_value;

                    dataPromo.discount = discount
                    dataPromo.promo_applied = true
                    dataPromo.promo_details = { promo_code: item.promoCode ? item.promoCode : '', promo_key: item.promoKey, promo_name: item.promo_name, discount_type: item.promo_discount_type, promo_discount_value: item.promo_discount_value, max_discount: item.max_promo_discount_value, minimumorder: item.min_order }
                    let payableAmmount = discount < 0 ? 0 : discount.toFixed(2)
                    dataPromo.values.push(payableAmmount)

                    dataPromo.metodoPagamento = "Dinheiro"
                }
            }
            return dataPromo
        }
    }
}


