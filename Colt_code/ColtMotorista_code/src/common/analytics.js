import * as Analytics from 'expo-firebase-analytics';

// REGISTRA O ONLINE DO MOTORISTA
export async function DriverOffline(id, screen) {
    await Analytics.logEvent('driver_offline', {
        name: id,
        screen: screen,
        date: new Date().toLocaleString('pt-BR')
    });
}

// REGISTRA O OFFLINE DO MOTORISTA
export async function DriverOnline(id, screen) {
    await Analytics.logEvent('driver_online', {
        name: id,
        screen: screen,
        date: new Date().toLocaleString('pt-BR')
    });
}

// REGISTRA A CORRIDA ACEITA POR ELE
export async function DriverBookingAccept(id, idbooking, screen){
    await Analytics.logEvent('driver_booking_accept', {
        name: id,
        bookingId: idbooking,
        screen: screen,
        date: new Date().toLocaleString('pt-BR')
    });
}

// REGISTRA A CORRIDA NEGADA POR ELE
export async function DriverBookingReject(id, idbooking, screen){
    await Analytics.logEvent('driver_booking_reject', {
        name: id,
        bookingId: idbooking,
        screen: screen,
        date: new Date().toLocaleString('pt-BR')
    });
}