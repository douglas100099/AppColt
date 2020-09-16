import React from 'react';
import { Header } from 'react-native-elements';
import { colors } from '../common/theme';
import { 
    StyleSheet,
    View,
    Text,
    TouchableWithoutFeedback,
    Dimensions,
    AsyncStorage
  } from 'react-native';
  var {width} = Dimensions.get('window');
  import * as firebase from 'firebase';
  import  languageJSON  from '../common/language';


export default class DriverIncomePage extends React.Component {
    constructor(props){
        super(props);
        this.state={
            currency:{
                code:'',
                symbol:''
            }
        };
        this._retrieveCurrency();
        
    }

    _retrieveCurrency = async () => {
        try {
          const value = await AsyncStorage.getItem('currency');
          if (value !== null) {
            this.setState({currency:JSON.parse(value)});
          }
        } catch (error) {
            console.log("Asyncstorage issue 3");
        }
    };
  
    componentDidMount(){
        let userUid = firebase.auth().currentUser.uid;
        let ref = firebase.database().ref('bookings/');
        ref.once('value',allBookings=>{
            if(allBookings.val()){
                let data = allBookings.val();
                var myBookingarr = [];
                for(let k in data){  
                    if(data[k].driver == userUid){
                        data[k].bookingKey = k
                        myBookingarr.push(data[k])
                    }
                }

                if(myBookingarr){ 
                    this.setState({myBooking:myBookingarr},()=>{
                       this.eraningCalculation()
                        //console.log('this.state.myBooking ==>',this.state.myBooking)
                    })
                    
                }
            }
        })
    }



    eraningCalculation(){
       
        if(this.state.myBooking){
            
            let today =  new Date();
            let tdTrans = 0;
            let mnTrans = 0;
            let totTrans = 0;
            for(let i=0;i<this.state.myBooking.length;i++){
                const {tripdate,driver_share} = this.state.myBooking[i];
                let tDate = new Date(tripdate);
                if(driver_share != undefined){
                    console.log(driver_share)
                    if(tDate.getDate() === today.getDate() && tDate.getMonth() === today.getMonth()){
                        tdTrans  = tdTrans + driver_share;
                    }          
                    if(tDate.getMonth() === today.getMonth() && tDate.getFullYear() === today.getFullYear()){
                        mnTrans  = mnTrans + driver_share;

                    }
                    
                    totTrans  = totTrans + driver_share;
                   
                }
            }
            this.setState({
                totalEarning:totTrans,
                today:tdTrans,
                thisMothh:mnTrans,
                qtdCorridas: this.state.myBooking.length,

            })
            //console.log('today- '+tdTrans +' monthly- '+ mnTrans + ' Total-'+ totTrans);

        }
    }
    render() {  
        return (
        
            <View style={styles.mainView}>
                <Header
                    backgroundColor={colors.WHITE}
                    leftComponent={{ icon: 'chevron-left', type: 'MaterialIcons', color: colors.BLACK, size: 35, component: TouchableWithoutFeedback, onPress: () => { this.props.navigation.goBack(); } }}
                    centerComponent={<Text style={styles.headerTitleStyle}>Meus ganhos</Text>}
                    containerStyle={styles.headerStyle}
                    innerContainerStyles={{ marginLeft: 10, marginRight: 10 }}
                />
                <View style={styles.bodyContainer}>
                    <View style={styles.todaysIncomeContainer}>
                       <Text style={styles.todayEarningHeaderText}>Hoje</Text>
                       <Text style={styles.todayEarningMoneyText}>R$ {this.state.today?parseFloat(this.state.today).toFixed(2):'0'}</Text>
                    </View>
                    <View style={styles.listContainer2}>
                      <View style={styles.totalEarning}>
                        <Text style={styles.todayEarningHeaderText2}>Corridas hoje</Text>
                        <Text style={styles.todayEarningMoneyText2}>R$ {this.state.thisMothh?parseFloat(this.state.thisMothh).toFixed(2):'0'}</Text>
                      </View>
                      <View style={styles.thismonthEarning}>
                        <Text style={styles.todayEarningHeaderText2}>Corridas no mês</Text>
                        <Text style={styles.todayEarningMoneyText2}>{this.state.qtdCorridas? '' : '0'}</Text>
                      </View>
                    </View>
                    <View style={styles.listContainer}>
                      <View style={styles.totalEarning}>
                        <Text style={styles.todayEarningHeaderText2}>Ganhos esse mês</Text>
                        <Text style={styles.todayEarningMoneyText2}>R$ {this.state.thisMothh?parseFloat(this.state.thisMothh).toFixed(2):'0'}</Text>
                      </View>
                      <View style={styles.thismonthEarning}>
                        <Text style={styles.todayEarningHeaderText2}>Ganhos no total</Text>
                        <Text style={styles.todayEarningMoneyText2}>R$ {this.state.totalEarning?parseFloat(this.state.totalEarning).toFixed(2):'0'}</Text>
                      </View>
                    </View>

               </View>
           </View>
           
        );
      }
    
}
const styles = StyleSheet.create({
    mainView:{ 
        flex:1, 
        backgroundColor: colors.WHITE, 
    } ,
    headerStyle: { 
        backgroundColor: colors.WHITE, 
        borderBottomWidth: 0 
    },
    headerTitleStyle: { 
        color: colors.BLACK,
        fontFamily:'Inter-Bold',
        fontSize: 20
    },
    bodyContainer:{
        flex:1,
        backgroundColor:colors.WHITE,
        flexDirection:'column'
    },
    todaysIncomeContainer:{
        flex:1.5,
        justifyContent:'center',
        alignItems:'center',
        backgroundColor:colors.WHITE,
        elevation: 5,
    },
    listContainer:{
        flex:3,
        backgroundColor:'#fff',
        marginTop:1,
        flexDirection:'row',
        paddingHorizontal:6,
        paddingVertical:6,
        paddingBottom:6,
        justifyContent:'space-between',
        alignItems:'flex-start'
    },
    listContainer2: {
        marginTop:3,
        flexDirection:'row',
        paddingHorizontal:6,
        paddingVertical:6,
        paddingBottom:6,
        justifyContent:'space-between',
        alignItems:'flex-start'   
    },
    todayEarningHeaderText:{
        fontSize:20,
        paddingBottom:5,
        color:colors.BLACK,
    },
    todayEarningMoneyText:{
        fontSize:55,
        fontWeight:'bold',
        color:colors.BLACK 
    },
    totalEarning:{
       height:90,
       width:'49%',
       backgroundColor:colors.WHITE,
       elevation: 5,
       borderRadius:6,
       justifyContent:'center',
       alignItems:'center',
    },
    thismonthEarning:{
        height:90,
        width:'49%',
        backgroundColor:colors.WHITE,
        elevation: 5,
        borderRadius:6,
        justifyContent:'center',
        alignItems:'center',
    },
    todayEarningHeaderText2:{
        fontSize:16,
        paddingBottom:5,
        color:colors.BLACK,
    },
    todayEarningMoneyText2:{
        fontSize:20,
        fontWeight:'bold',
        color:colors.BLACK,
    },
})