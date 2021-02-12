import React from 'react';
import { Header, Icon } from 'react-native-elements';
import { colors } from '../common/theme';
import {
    StyleSheet,
    View,
    Text,
    Dimensions,
    Platform,
} from 'react-native';
import BtnVoltar from '../components/BtnVoltar';
var { width, height } = Dimensions.get('window');
import * as firebase from 'firebase';
import { ScrollView } from 'react-native-gesture-handler';

export default class AboutPage extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            open: false,
        }
    }

    componentDidMount() {
        const about = firebase.database().ref('About_Us/');
        about.once('value', aboutData => {
            if (aboutData.val()) {
                let data = aboutData.val()
                this.setState({ data: data })
            }
        })
    }

    press() {
        this.state.open ? setTimeout(() => { this.setState({ open: false }) }, 100) :
            this.setState({
                open: true,
            });
    }

    goBack = () => {
        this.props.navigation.goBack()
    }

    render() {
        return (
            <View style={styles.mainView}>
                <View style={styles.viewHeader}>
                    <BtnVoltar style={{ backgroundColor: colors.WHITE, marginLeft: 10, marginBottom: 5 }} btnClick={this.goBack} />
                </View>
                <ScrollView style={{ backgroundColor: colors.WHITE }}>
                    <View style={{ marginTop: 20 }}>
                        <Text style={{ paddingEnd: 20, paddingStart: 20, fontFamily: 'Inter-Medium', textAlign: 'center', fontSize: 17 }}>
                            {this.state.data ? this.state.data.contents : null}
                        </Text>
                    </View>
                    <View style={{ marginTop: 25, marginLeft: 20 }}>
                        <Text style={{ fontFamily: 'Inter-Bold', fontSize: 20 }}> Email </Text>
                        <Text style={{ fontFamily: 'Inter-Medium', fontSize: 17 }}> {this.state.data ? this.state.data.email : null} </Text>
                    </View>
                    <View style={{ marginTop: 25, marginLeft: 20 }}>
                        <Text style={{ fontFamily: 'Inter-Bold', fontSize: 20 }}> Contato </Text>
                        <Text style={{ fontFamily: 'Inter-Medium', fontSize: 17 }}> {this.state.data ? this.state.data.phone : null} </Text>
                    </View>
                </ScrollView>
                <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'center', position: 'absolute', bottom: Platform.OS == 'ios' ? 30 : 10 }}>
                    <Text style={{ fontSize: 20, fontFamily: 'Inter-Bold', }}> Colt  </Text>
                    <Icon
                        name='car'
                        type='material-community'
                        color={colors.BLACK}
                        size={20}

                    />
                </View>
            </View>
        );
    }

}
const styles = StyleSheet.create({
    mainView: {
        flex: 1,
    },
    viewHeader: {
        backgroundColor: colors.WHITE,
        height: 90,
        justifyContent: 'flex-end'
    },
    viewTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 10,
        justifyContent: 'center',
        marginBottom: 15,
        alignItems: 'center'
    },
    btnVoltar: {
        backgroundColor: colors.WHITE,
        width: 40,
        height: 40,

        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { x: 0, y: 5 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
    }
})