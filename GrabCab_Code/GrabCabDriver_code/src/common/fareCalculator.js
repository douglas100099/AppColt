export function farehelper(distance,time,rateDetails){
    let ratePerKm = rateDetails.rate_per_kilometer;
    let ratePerHour = rateDetails.rate_per_hour;
    let ratePerSecond = ratePerHour/3600;
    let minFare =  rateDetails.min_fare;
    let DistanceInKM = parseFloat(distance/1000).toFixed(2);
    let estimateRateForKM =parseFloat(DistanceInKM*ratePerKm).toFixed(2)*1;
    let estimateRateForhour = parseFloat(time*ratePerSecond).toFixed(2);
    let total = (parseFloat(estimateRateForKM)+parseFloat(estimateRateForhour))>minFare?(parseFloat(estimateRateForKM)+parseFloat(estimateRateForhour)):minFare;

    if( distance >= 50000 ){
        total = total + ( total * 0.10 )
    }

    let convenienceFee = (total*rateDetails.convenience_fees/100);
    

    let grandtotal = parseFloat(total)+parseFloat(convenienceFee);
    let calculateData = {
        distaceRate:estimateRateForKM,
        timeRate:estimateRateForhour,
        totalCost:total,grandTotal:grandtotal,
        convenience_fees:convenienceFee}
        
    return calculateData
}
