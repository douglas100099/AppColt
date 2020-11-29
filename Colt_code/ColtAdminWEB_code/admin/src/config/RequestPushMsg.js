
export default function RequestPushMsg(token,msg){
    fetch('https://exp.host/--/api/v2/push/send', {       
        method: 'POST', 
        headers: {
              Accept: 'application/json',  
             'Content-Type': 'application/json', 
             'accept-encoding': 'gzip, deflate',   
             'host': 'exp.host'      
         }, 
       body: JSON.stringify({                 
            "to": token,                        
            "title": 'Teste',                  
            "body": msg,  
            "data": {"msg":msg,"title":'Teste'},          
            "priority": "high",            
            "sound":"default",   
            "channelId": "messages",
            "_displayInForeground": true
         }),        
     }).then((response) => response.json())   
              .then((responseJson) => { 
                  return responseJson
     })
     .catch((error) => { console.log(error) });
}