const signalingUrl = 'wss://ayame-labo.shiguredo.app/signaling';
let roomId = 'ayame-web-sdk-sample';
let clientId = null;
let videoCodec = null;
let audioCodec = null;
let signalingKey = null;

const options = {};
const remoteVideo = document.querySelector('#remote-video');
let conn;
const disconnect = () => {
  if (conn) {
    conn.disconnect();
  }
  document.getElementById("video-container").style.visibility = "hidden";
  document.getElementById("controller").style.visibility = "hidden";
  document.getElementById("startButton").style.visibility = "hidden";
}

const startConn = async () => {
  document.getElementById("startButton").style.visibility = "hidden";
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
  } catch(e) {
    console.log(e);
    connection.send(`{ "action": "sendmessage", "data": {"cmd": "disconnect"} }`);
    const chatOutput = document.getElementById("chat-output");
    chatOutput.innerHTML += `<strong>$</strong> <font color="red">Connection Error!!!!!!</font><br />`;
  }
};