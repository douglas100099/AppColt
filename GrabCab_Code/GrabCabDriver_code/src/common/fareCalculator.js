export function farehelper(distance,time,rateDetails){
    let ratePerKm = rateDetails.rate_per_kilometer; // 1,13
    let ratePerHour = rateDetails.rate_per_hour; // 16,8
    let tarifabase = rateDetails.tafira_base;
    let ratePerSecond = ratePerHour/3600; // 0,004666666666666667
    let minFare =  rateDetails.min_fare; // 6,50
    let DistanceInKM = parseFloat(distance/1000).toFixed(2); // 9,22
    let estimateRateForKM =parseFloat(DistanceInKM*ratePerKm).toFixed(2)*1; // 10,41
    let estimateRateForhour = parseFloat(time*ratePerSecond).toFixed(2); // 0,0736

    console.log(estimateRateForKM + "ESTIMATE RATE KM")
    console.log(estimateRateForhour + "ESTIMATE RATE HOUR")
    console.log(tarifabase + "TARIFA BASE")

    let total = (parseFloat(estimateRateForKM) + parseFloat(estimateRateForhour)) + parseFloat( tarifabase) > minFare ? (parseFloat(estimateRateForKM)+parseFloat(estimateRateForhour) + parseFloat( tarifabase) ) : minFare;

    console.log('--- FARE CALCULATOR ---')
    console.log('Rate por KM ' + ratePerKm)
    console.log('Rate por HORA ' + ratePerHour)
    console.log('Rate por SEGUNDOS ' + ratePerSecond)
    console.log('Valor Minimo ' + minFare)
    console.log('Distancia em KM ' + DistanceInKM)
    console.log('Preço estimado por KM ' + estimateRateForKM)
    console.log('Preço estimado por Hora ' + estimateRateForhour)
    console.log('VALOR TOTAL ' + total)
    console.log('-------------------------------')

    if( distance >= 50000 ){
        total = total + ( total * 0.10 )
    }

    let convenienceFee = (total*rateDetails.convenience_fees/100);
    

    let grandtotal = parseFloat(total)+parseFloat(convenienceFee);
    let calculateData = {
        distaceRate:estimateRateForKM,
        timeRate:estimateRateForhour,
        totalCost:total,
        grandTotal:grandtotal > 0 ? grandtotal : 0,
        convenience_fees:convenienceFee}   
    return calculateData
}
