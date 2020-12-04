import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
} from 'react-native';
import {  Icon } from 'react-native-elements';
import { colors } from '../common/theme';

export default class BtnVoltar extends React.Component {
    render() {
        const { style, btnClick } = this.props;
        return (
            <TouchableOpacity style={[styles.button, style]} onPress={btnClick}>
                <Icon
                    name='chevron-left'
                    type='MaterialIcons'
                    color={colors.BLACK}
                    size={35}
                    containerStyle={styles.iconVoltar}
                />
            </TouchableOpacity>
        );
    }
}

const styles = StyleSheet.create({
    button: {
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 50,
        width: 40,
        height: 40,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { x: 0, y: 5 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
    },
    iconVoltar: {
        justifyContent: 'center'
    }
});
