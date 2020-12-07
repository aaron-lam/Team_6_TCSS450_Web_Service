const Pushy = require('pushy');

// Plug in your Secret API Key
const pushyAPI = new Pushy(process.env.PUSHY_API_KEY);

//use to send message to a specific client by the token
function sendMessageToIndividual(token, message) {

  //build the message for Pushy to send
  const data = {
    "type": "msg",
    "message": message,
    "chatid": message.chatid
  };

  // Send push notification via the Send Notifications API
  // https://pushy.me/docs/api/send-notifications
  pushyAPI.sendPushNotification(data, token, {}, function (err, id) {
    // Log errors to console
    if (err) {
      return console.log('Fatal Error', err);
    }

    // Log success
    console.log('Push sent successfully! (ID: ' + id + ')')
  })
}

//add other "sendTypeToIndividual" functions here. Don't forget to export them

//use to send message to a specific client by the token
function sendCreateRoomMessageToIndividual(token, roomName) {

  //build the message for Pushy to send
  const data = {
    "type": "newRoom",
    roomName
  };

  // Send push notification via the Send Notifications API
  // https://pushy.me/docs/api/send-notifications
  pushyAPI.sendPushNotification(data, token, {}, function (err, id) {
    // Log errors to console
    if (err) {
      return console.log('Fatal Error', err);
    }

    // Log success
    console.log('Push sent successfully! (ID: ' + id + ')')
  })
}

module.exports = {
  sendMessageToIndividual,
  sendCreateRoomMessageToIndividual
};
