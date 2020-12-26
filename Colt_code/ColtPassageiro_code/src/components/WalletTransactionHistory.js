import React from 'react';
import { View, Text, Dimensions, FlatList, StyleSheet, AsyncStorage } from 'react-native';
import { Icon } from 'react-native-elements'
import { colors } from '../common/theme';
const devWidth = Dimensions.get("window").width;
import * as firebase from 'firebase';
import languageJSON from '../common/language';
import dateStyle from '../common/dateStyle';
import { Platform } from 'react-native';

export default class WTransactionHistory extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            data: [],
            settings: {
                code: '',
                symbol: '',
                cash: false,
                wallet: false
            }
        }
    };


    _retrieveSettings = async () => {
        try {
            const value = await AsyncStorage.getItem('settings');
            if (value !== null) {
                this.setState({ settings: JSON.parse(value) });
            }
        } catch (error) {
            console.log("Asyncstorage issue 31");
        }
    };

    componentDidMount() {
        var mS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
        const root = firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/walletHistory');
        root.on('value', walletData => {
            if (walletData.val()) {
                let wdata = walletData.val()
                var wallHis = []
                for (key in wdata) {
                    wdata[key].walletKey = key
                    let d = wdata[key].date;
                    let tDate = new Date(d);
                    wdata[key].date = tDate.toLocaleString(dateStyle);
                    wallHis.push(wdata[key])
                }
                if (wallHis) {
                    this.setState({ data: wallHis.reverse() }, (res) => {

                    });
                }
            }
        })
        this._retrieveSettings();
    }

    newData = ({ item }) => {
        return (
            <View style={styles.container}>
                <View style={styles.divCompView}>
                    <View style={styles.containsView}>
                        <View style={styles.statusStyle}>
                            {item.type == 'Debit' ?
                                <View style={styles.drimageHolder}>
                                    <Icon
                                        iconStyle={styles.debiticonPositionStyle}
                                        name='remove'
                                        type='MaterialIcons'
                                        size={25}
                                        color='#fff'
                                    />
                                </View> :
                                <View style={styles.crimageHolder}>
                                    <Icon
                                        iconStyle={styles.crediticonPositionStyle}
                                        name='add'
                                        type='MaterialIcons'
                                        size={25}
                                        color='#fff'
                                    />
                                </View>
                            }
                            <View style={styles.statusView}>
                                {item.type == 'Debit' ?
                                    <View>
                                        <Text style={styles.historyamounttextStyle}>Você usou {this.state.settings.symbol + parseFloat(item.amount).toFixed(2)}</Text>
                                        {Platform.OS == 'ios' ?
                                            <Text style={styles.textStyle2}> {(item.date)}</Text>
                                            :
                                            <Text style={styles.textStyle2}> {new Date(item.date).getDay()}</Text>
                                        }

                                    </View>
                                    :
                                    <View>
                                        <Text style={styles.historyamounttextStyle}>Você depositou {this.state.settings.symbol + parseFloat(item.amount).toFixed(2)}</Text>
                                        <Text style={styles.textStyle2}> {new Date(item.date).toLocaleDateString('pt-BR') + ' - ' + new Date(item.date).getHours() + ':' + new Date(item.date).getMinutes() + 'h'}</Text>
                                    </View>
                                }
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        )
    }
    render() {
        return (
            <View style={{ flex: 1 }}>
                <FlatList
                    keyExtractor={(item, index) => index.toString()}
                    data={this.state.data}
                    renderItem={this.newData}
                />
            </View>
        );
    }
};
const styles = StyleSheet.create({
    myHeader: {
        marginTop: 0,
    },
    container: {
        flex: 1,
    },
    divCompView: {
        height: 80,
        marginLeft: 10,
        marginRight: 10,
        marginTop: 10,
        backgroundColor: '#ECECEC',
        flexDirection: 'row',
        flex: 1,
        borderRadius: 6,
    },
    drimageHolder: {
        height: 40,
        width: 40,
        borderRadius: 40 / 2,
        marginLeft: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.REDCLEAN,
        padding: 3
    },
    crimageHolder: {
        height: 40,
        width: 40,
        borderRadius: 40 / 2,
        marginLeft: 5,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.GREEN.light,
        padding: 3
    },
    containsView: {
        justifyContent: 'center',
        marginLeft: 10,
    },

    statusStyle: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center'
    },
    statusView: {
        marginLeft: 10

    },
    textStyle: {
        fontSize: 14,
        fontFamily: 'Roboto-Regular',
        fontWeight: '500',
        color: '#979696'
    },
    historyamounttextStyle: {
        fontSize: 16,
        fontFamily: 'Roboto-Regular',
        fontWeight: '500'
    },
    textStyle2: {
        fontSize: 14,
        fontFamily: 'Roboto-Regular',
        color: '#979696'
    },
    textColor: {
        color: colors.GREY.iconPrimary,
        alignSelf: 'center',
        fontSize: 12,
        fontFamily: 'Roboto-Regular',
        paddingLeft: 5
    },
    textFormat: {
        flex: 1,
        width: devWidth - 100
    },
    cabLogoStyle: {
        width: 25,
        height: 28,
        flex: 1
    },
    clockIconStyle: {
        flexDirection: 'row',
        marginTop: 8
    },
    debiticonPositionStyle: {
        alignSelf: 'flex-start',
    },
    crediticonPositionStyle: {
        alignSelf: 'flex-start',
    }
});