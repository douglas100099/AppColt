import { bookingRef} from "../config/firebase";
import { 
    FETCH_DRIVERS_EARNING,
    FETCH_DRIVERS__EARNING_SUCCESS,
    FETCH_DRIVERS__EARNING_FAILED,
} from "./types";

export const fetchDriver =  () => dispatch => {
    dispatch({
      type: FETCH_DRIVERS_EARNING,
      payload: null
    });
    bookingRef.on("value", snapshot => {
      if (snapshot.val()) {
          const mainArr = snapshot.val();
          var monthsName = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
          var renderobj = {};
           Object.keys(mainArr).map(j => {

            if(mainArr[j].status === 'END' && mainArr[j].pagamento.driver_share !== undefined){
              let bdt = new Date(mainArr[j].tripdate);
              let uniqueKey = bdt.getFullYear()+'_'+bdt.getMonth()+'_'+mainArr[j].driver;
              if(renderobj[uniqueKey] && renderobj[uniqueKey].driverShare>0){
                  renderobj[uniqueKey].driverShare = renderobj[uniqueKey].driverShare + mainArr[j].pagamento.driver_share;
              }else{
                  renderobj[uniqueKey]={};
                  renderobj[uniqueKey]['dated'] = mainArr[j].tripdate;
                  renderobj[uniqueKey]['year'] = bdt.getFullYear();
                  renderobj[uniqueKey]['month'] = bdt.getMonth();
                  renderobj[uniqueKey]['monthsName'] = monthsName[bdt.getMonth()];
                  renderobj[uniqueKey]['driverName'] = mainArr[j].driver_name;
                  renderobj[uniqueKey]['driverShare'] = mainArr[j].pagamento.driver_share;
                  renderobj[uniqueKey]['driverVehicleNo'] = mainArr[j].vehicle_number;
                  renderobj[uniqueKey]['driverUId'] = mainArr[j].driver;
                  renderobj[uniqueKey]['uniqueKey'] = uniqueKey; 
              }
            }
            return null;
          });
          if(renderobj){
            const arr = Object.keys(renderobj).map(i => {
              renderobj[i].driverShare = parseFloat(renderobj[i].driverShare).toFixed(2)
             return renderobj[i]
            })
            dispatch({
              type: FETCH_DRIVERS__EARNING_SUCCESS,
              payload: arr
            });
          }
          
      } else {
        dispatch({
          type: FETCH_DRIVERS__EARNING_FAILED,
          payload: "No data available."
        });
      }
    });
  };

  