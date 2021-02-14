import React from 'react';
import {
    View,
    TouchableOpacity,
    Text,
    StyleSheet,
    Dimensions,

} from 'react-native';
import { Pulse, Wander } from 'react-native-animated-spinkit'
import LocationDrop from '../../assets/svg/LocationDrop';
import LocationUser from '../../assets/svg/LocationUser';
import LocationWaypoint from '../../assets/svg/LocationWaypoint';
import ColtEconomicoCar from '../../assets/svg/ColtEconomicoCar';
import ColtConfortCar from '../../assets/svg/ColtConfortCar';
import { colors } from '../common/theme';
var { width, height } = Dimensions.get('window');


const COLT_ECONOMICO = "Colt econômico"
const COLT_CONFORT = "Colt confort"

const BottomSheetComponent = ({ region, waypoint, payment, carType, customStyle }) => {
    return (
        <View
            style={[styles.container, { ...customStyle }]}
        >
            <TouchableOpacity style={{ width: 65, alignSelf: 'center', height: 6, backgroundColor: colors.GREY1, borderRadius: 50 }} />
            <View style={styles.viewQueueBooking}>
                <Wander
                    size={40}
                    color={colors.DEEPBLUE}
                />
                <Text style={{ textAlign: 'center', paddingHorizontal: 5, fontFamily: 'Inter-ExtraBold', fontSize: 15, color: colors.DEEPBLUE }}> Estamos conectando você ao motorista. </Text>
            </View>
            <View>
                <View style={{ marginTop: 15 }}>

                    <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center' }}>
                        <LocationUser
                            width={20}
                            height={20}
                        />
                        <Text style={{ marginLeft: 5 }}>{region ? region.whereText.split(',')[0] + region.whereText.split(',')[1] : null}</Text>
                    </View>

                    {waypoint ?
                        <View>
                            <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center' }}>
                                <LocationWaypoint
                                    width={20}
                                    height={20}
                                />
                                <Text style={{ marginLeft: 5 }}>{waypoint.add}</Text>
                            </View>
                        </View>
                        :
                        null}

                    <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center' }}>
                        <LocationDrop
                            width={22}
                            height={22}
                        />
                        <Text style={{ marginLeft: 5 }}>{region ? region.droptext.split(',')[0] + region.droptext.split(',')[1] : null}</Text>
                    </View>


                    {
                        payment ?
                            payment.payment_mode === 'Dinheiro' ?
                                <View style={{ alignSelf: 'center', flexDirection: 'column', alignItems: 'center' }}>
                                    <Text style={{ marginTop: 15, fontFamily: 'Inter-Bold', opacity: .5, fontSize: 17 }}>
                                        Método pagamento
                                </Text>
                                    <Text style={{ paddingTop: 5, fontFamily: 'Inter-SemiBold', color: colors.GREEN.light, fontSize: 15 }}>
                                        {payment.payment_mode}
                                    </Text>
                                </View>
                                :
                                <View style={{ alignSelf: 'center', flexDirection: 'column', alignItems: 'center' }}>
                                    <Text style={{ marginTop: 15, fontFamily: 'Inter-Bold', opacity: .5, fontSize: 17 }}>
                                        Método pagamento
                                </Text>
                                    <Text style={{ paddingTop: 5, fontFamily: 'Inter-SemiBold', color: colors.DEEP_SKY, fontSize: 15 }}>
                                        {payment.payment_mode}
                                    </Text>
                                </View>

                            : null
                    }

                    <View style={{ alignSelf: 'center' }}>
                        {
                            carType ?
                                carType === COLT_ECONOMICO ?
                                    <View style={{ flexDirection: 'row' }}>
                                        <ColtEconomicoCar
                                            width={120}
                                            height={90}
                                        />
                                        <Text style={{ marginLeft: 10, fontFamily: 'Inter-Bold' }}>
                                            {COLT_ECONOMICO}
                                        </Text>
                                    </View>
                                    :
                                    <View style={{ flexDirection: 'column', alignItems: 'center' }}>
                                        <ColtConfortCar
                                            width={120}
                                            height={90}
                                        />
                                        <Text style={{ marginLeft: 10, fontFamily: 'Inter-Bold' }}>
                                            {COLT_CONFORT}
                                        </Text>
                                    </View>
                                : null
                        }
                    </View>
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        padding: 16,
        height: height * 0.50,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowOffset: { x: 1, y: 1 },
        shadowRadius: 10,
    },
    viewQueueBooking: {
        backgroundColor: colors.transparent,
        height: 45,
        width: '100%',
        alignSelf: 'center',
        borderRadius: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { x: 0, y: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
})

export default BottomSheetComponent;