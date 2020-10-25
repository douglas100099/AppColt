import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
} from 'react-native';
import { colors } from '../common/theme';
import Modal from 'react-native-modal';


export default class AlertModal extends React.Component {
    render() {
        const { text, isModalVisible } = this.props;
        return (
            <View style={{ flex: 1 }}>
                <Modal isVisible={isModalVisible}>
                    <View style={{ flex: 1 }}>
                        <Text>{text}</Text>
                    </View>
                </Modal>
            </View>
        );
    }
}

//style for this component
const styles = StyleSheet.create({
});