import React from 'react'
import { View, Text , TouchableOpacity , StyleSheet } from 'react-native'

const CustomBtn = ({onPress = () =>{}, btnStyle = {}, btnText }) => {
  return (
    <View>
      <TouchableOpacity onPress={onPress}>
       <Text style={{ ...styles.btnStyle, ...btnStyle}}>{btnText}</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
    btnStyle: {
        backgroundColor: 'white',
        padding: 10,
        borderRadius: 5,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#000',
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
        textAlign: 'center',
        textTransform: 'uppercase',
    }
})

export default CustomBtn