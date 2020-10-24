export function VerifyCupom(item, index, estimateFare) {
    var toDay = new Date();
    var promoValidity = item.promo_validity
    var expiryDay = promoValidity.split('/')[0];
    var em = promoValidity.split('/')[1];
    var expiryMonth = em == 12 ? em - 1 : em
    var expiryYear = promoValidity.split('/')[2];
    var fexpDate = expiryMonth + '/' + expiryDay + '/' + expiryYear
    var expDate = new Date(fexpDate)

    console.log("PROMO CODE ---- " + item.promo)

    if (estimateFare > item.min_order) {
        var userAvail = item.user_avail

        //Verifica se a promoção ja foi usada por alguem 
        if (userAvail != undefined) {
            if (toDay > expDate) {
                alert(languageJSON.promo_exp)
            } else if (userAvail.count >= item.promo_usage_limit) {
                alert(languageJSON.promo_limit)
            } else {
                let discounttype = item.promo_discount_type.toUpperCase();

                //Verifica se o tipo de desconto é porcentagem
                if (discounttype == 'PERCENTAGE') {
                    let discount = estimateFare * item.promo_discount_value / 100; //Calculo de desconto
                    if (discount > item.max_promo_discount_value) {
                        let discount = item.max_promo_discount_value; //Atribuir o desconto maximo se o desconto for maior q o limite

                        let data = {}
                        data.discount = discount
                        data.promo_applied = true
                        data.promo_details = { promo_code: item.promoCode ? item.promoCode : '', promo_key: index, promo_name: item.promo_name, discount_type: item.promo_discount_type, promo_discount_value: item.promo_discount_value, max_discount: item.max_promo_discount_value, minimumorder: item.min_order }
                        data.payableAmmount = (estimateFare - discount) < 0 ? 0 : (estimateFare - discount).toFixed(2)
                        data.metodoPagamento = "Dinheiro"

                        return data;
                        
                    } else {
                        let data = {}
                        data.discount = discount
                        data.promo_applied = true
                        data.promo_details = { promo_code: item.promoCode ? item.promoCode : '', promo_key: index, promo_name: item.promo_name, discount_type: item.promo_discount_type, promo_discount_value: item.promo_discount_value, max_discount: item.max_promo_discount_value, minimumorder: item.min_order }
                        data.payableAmmount = (estimateFare - discount) < 0 ? 0 : (estimateFare - discount).toFixed(2)
                        data.metodoPagamento = "Dinheiro"

                        return data
                    }

                    //Desconto tipo Flat
                } else {
                    let discount = estimateFare - item.promo_discount_value;
                    let data = {}
                    data.discount = discount
                    data.promo_applied = true
                    data.promo_details = {promo_code: item.promoCode ? item.promoCode : '', promo_key: index, promo_name: item.promo_name, discount_type: item.promo_discount_type, promo_discount_value: item.promo_discount_value, max_discount: item.max_promo_discount_value, minimumorder: item.min_order }
                    data.payableAmmount = discount < 0 ? 0 : discount.toFixed(2)
                    data.metodoPagamento = "Dinheiro"

                    return data
                }
            }
        } else {
            //Caso a promoção n tenha sido usada por ninguem
            if (toDay > fexpDate) {
                alert(languageJSON.promo_exp)
            } else {
                let discounttype = item.promo_discount_type.toUpperCase();
                if (discounttype == 'PERCENTAGE') {
                    var discount = estimateFare * item.promo_discount_value / 100;
                    if (discount > item.max_promo_discount_value) {
                        let discount = item.max_promo_discount_value;

                        let data = {}
                        data.discount = discount
                        data.promo_applied = true
                        data.promo_details = {promo_code: item.promoCode ? item.promoCode : '', promo_key: index, promo_name: item.promo_name, discount_type: item.promo_discount_type, promo_discount_value: item.promo_discount_value, max_discount: item.max_promo_discount_value, minimumorder: item.min_order }
                        data.payableAmmount = (estimateFare - discount) < 0 ? 0 : (estimateFare - discount).toFixed(2)
                        data.metodoPagamento = "Dinheiro"

                        return data

                    } else {
                        let data = {}
                        data.discount = discount
                        data.promo_applied = true
                        data.promo_details = {promo_code: item.promoCode ? item.promoCode : '', promo_key: index, promo_name: item.promo_name, discount_type: item.promo_discount_type, promo_discount_value: item.promo_discount_value, max_discount: item.max_promo_discount_value, minimumorder: item.min_order }
                        data.payableAmmount = (estimateFare - discount) < 0 ? 0 : (estimateFare - discount).toFixed(2)
                        data.metodoPagamento = "Dinheiro"

                        return dataPromo
                    }
                } else {
                    let discount = estimateFare - item.promo_discount_value;

                    let data = {}
                    data.discount = discount
                    data.promo_applied = true
                    data.promo_details = {promo_code: item.promoCode ? item.promoCode : '', promo_key: index, promo_name: item.promo_name, discount_type: item.promo_discount_type, promo_discount_value: item.promo_discount_value, max_discount: item.max_promo_discount_value, minimumorder: item.min_order }
                    data.payableAmmount = discount < 0 ? 0 : discount.toFixed(2)
                    data.metodoPagamento = "Dinheiro"

                    return data
                }
            }
        }
        //Caso o valor da corrida seja menor que o valor limite da promoção
    } else {
        return languageJSON.promo_eligiblity
    }
}