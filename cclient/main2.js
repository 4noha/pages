const signalingUrl = 'wss://ayame-labo.shiguredo.app/signaling';
let roomId = 'ayame-web-sdk-sample';
let clientId = null;
let videoCodec = null;
let audioCodec = null;
let signalingKey = null;

const options = {};
const remoteVideo = document.querySelector('#remote-video');
let conn;
const music = new Audio('./hatsurichan-fx.mp3');
const disconnect = () => {
  if (conn) {
    conn.disconnect();
  }
  music.pause();
}

const startConn = async () => {
  var element = document.documentElement;
  var bottom = element.scrollHeight - element.clientHeight;
  window.scroll(0, bottom);
  //let setting = structuredClone(data.clientSetting);
  let json = {
    audio: setting.audio,
    video: setting.video,
    iceServers: setting.iceServers,
    clientId: setting.clientId,
    signalingKey: setting.signalingKey,
  };
  try{
    conn = Ayame.connection(setting.uri, setting.hoge, json, true);
    await conn.connect(null);
    conn.on('open', (e) => {});
    conn.on('disconnect', (e) => {
      //remoteVideo.srcObject = null;
    });
    conn.on('addstream', (e) => {
      //connection.send(`{ "action": "sendmessage", "data": {"cmd": "go"} }`);
      //console.log('-> %s', `{ "action": "sendmessage", "data": {"cmd": "go"} }`);
      remoteVideo.srcObject = e.stream;
    });
    //music.play();
  } catch(e) {
    console.log(e);
    //connection.send(`{ "action": "sendmessage", "data": {"cmd": "disconnect"} }`);
    const chatOutput = document.getElementById("chat-output");
    chatOutput.innerHTML += `<strong>$</strong> <font color="red">Connection Error!!!!!!</font><br />`;
    chatOutput.scrollTop = chatOutput.scrollHeight;
  }
};

function getParam(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}