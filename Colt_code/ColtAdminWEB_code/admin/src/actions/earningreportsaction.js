import {bookingRef} from "../config/firebase";
import { 
    FETCH_BOOKING_DISCOUNT,
    FETCH_BOOKING__DISCOUNT_SUCCESS,
    FETCH_BOOKING__DISCOUNT_FAILED,
} from "./types";

export const fetchEarningreports =  () => dispatch => {
    dispatch({
      type: FETCH_BOOKING_DISCOUNT,
      payload: null
    });
    bookingRef.on("value", snapshot => {
      if (snapshot.val()) {
          const mainArr = snapshot.val();
          var monthsName = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
          var renderobj = {};
           Object.keys(mainArr).map(j => {
            if(mainArr[j].status === 'END' && mainArr[j].pagamento.discount_amount !== undefined &&  mainArr[j].pagamento.driver_share !== undefined &&  mainArr[j].pagamento.customer_paid !== undefined && mainArr[j].pagamento.convenience_fees !== undefined && mainArr[j].pagamento.trip_cost !== undefined){
             
              let bdt = new Date(mainArr[j].tripdate);
              let uniqueKey = bdt.getFullYear()+'_'+bdt.getMonth();
              if(renderobj[uniqueKey]){
                  renderobj[uniqueKey].discountAmount = parseFloat(renderobj[uniqueKey].discountAmount) + parseFloat(mainArr[j].pagamento.discount_amount);
                  renderobj[uniqueKey].driverShare = parseFloat(renderobj[uniqueKey].driverShare) + parseFloat(mainArr[j].pagamento.driver_share);
                  renderobj[uniqueKey].customerPaid = parseFloat(renderobj[uniqueKey].customerPaid) + parseFloat(mainArr[j].pagamento.customer_paid);
                  renderobj[uniqueKey].convenienceFee = parseFloat(renderobj[uniqueKey].convenienceFee) + parseFloat(mainArr[j].pagamento.convenience_fees);
                  renderobj[uniqueKey].tripCost = parseFloat(renderobj[uniqueKey].tripCost) + parseFloat(mainArr[j].pagamento.trip_cost);
                  
              }else{
                  renderobj[uniqueKey]={};
                  renderobj[uniqueKey]['dated'] = mainArr[j].tripdate;
                  renderobj[uniqueKey]['year'] = bdt.getFullYear();
                  renderobj[uniqueKey]['month'] = bdt.getMonth();
                  renderobj[uniqueKey]['monthsName'] = monthsName[bdt.getMonth()];
                  renderobj[uniqueKey]['discountAmount'] = parseFloat(mainArr[j].pagamento.discount_amount);
                  renderobj[uniqueKey]['driverShare'] = parseFloat(mainArr[j].pagamento.driver_share);
                  renderobj[uniqueKey]['customerPaid'] = parseFloat(mainArr[j].pagamento.customer_paid);
                  renderobj[uniqueKey]['convenienceFee'] = parseFloat(mainArr[j].pagamento.convenience_fees); 
                  renderobj[uniqueKey]['uniqueKey'] = uniqueKey; 
                  renderobj[uniqueKey]['tripCost'] = parseFloat(mainArr[j].pagamento.trip_cost);
                  renderobj[uniqueKey]['driverName'] = mainArr[j].driver_name;
                  
              }
            }
            return null;
          });
          if(renderobj){
            const arr = Object.keys(renderobj).map(i => {
              renderobj[i].myEarning = parseFloat(renderobj[i].customerPaid - renderobj[i].driverShare).toFixed(2);
              renderobj[i].customerPaid = parseFloat(renderobj[i].customerPaid).toFixed(2);
              renderobj[i].rideCost =  parseFloat(renderobj[i].tripCost - renderobj[i].convenienceFee).toFixed(2);
              renderobj[i].driverShare = parseFloat(renderobj[i].driverShare).toFixed(2);
              return renderobj[i]
            })
            dispatch({
              type: FETCH_BOOKING__DISCOUNT_SUCCESS,
              payload: arr
            });
          }
          
      } else {
        dispatch({
          type: FETCH_BOOKING__DISCOUNT_FAILED,
          payload: "No data available."
        });
      }
    });
  };

  