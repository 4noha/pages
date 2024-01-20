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
  document.getElementById("video-container").style.display ="none";
  document.getElementById("controller").style.display ="none";
  document.getElementById("startButton").style.visibility = "hidden";
}

const startConn = async () => {
  document.getElementById("startButton").style.visibility = "hidden";
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
    conn.on('open', ({authzMetadata}) => console.log(authzMetadata));
    conn.on('disconnect', (e) => {
      remoteVideo.srcObject = null;
    });
    conn.on('addstream', (e) => {
      connection.send(`{ "action": "sendmessage", "data": {"cmd": "go"} }`);
      console.log('-> %s', `{ "action": "sendmessage", "data": {"cmd": "go"} }`);
      remoteVideo.srcObject = e.stream;
    });
    music.play();
  } catch(e) {
    console.log(e);
    connection.send(`{ "action": "sendmessage", "data": {"cmd": "disconnect"} }`);
    const chatOutput = document.getElementById("chat-output");
    chatOutput.innerHTML += `<strong>$</strong> <font color="red">Connection Error!!!!!!</font><br />`;
    chatOutput.scrollTop = chatOutput.scrollHeight;
  }
};