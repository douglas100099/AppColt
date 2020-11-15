import React, { Component } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Dimensions, Image, AsyncStorage, Platform } from 'react-native';
import { Icon } from 'react-native-elements'
import { colors } from '../common/theme';
var { width, height } = Dimensions.get('window');

import { color } from 'react-native-reanimated';

export default class RegisterCPF extends Component {
    

    constructor(props) {
        super(props);
        this.state = {
        }
    }

    render() {
        return (
            <View style={styles.mainViewStyle}>
                <Text> TESTE AQUI OH </Text>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    mainViewStyle:{
        flex: 1
    }
})