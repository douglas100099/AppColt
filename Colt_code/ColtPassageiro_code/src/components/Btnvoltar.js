import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
} from 'react-native';
import { colors } from '../common/theme';


export default class Btnvoltar extends React.Component {
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
        height: 40
    },
    iconVoltar: {
        justifyContent: 'center'
    }
});
