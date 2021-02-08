// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
var needsupdate = false;
function updateloadingtext(e){
  document.getElementById('LoadingText').innerHTML = e;
}
function screen(){
  document.getElementById('myProgress').style.visibility = "visible";
  updateloadingtext("StartingScreen");
  document.getElementById('ButtonHolder').style.visibility = "hidden";
  startRhubarbVR("screen");

}
function ScreenNoHMD(){
  document.getElementById('myProgress').style.visibility = "visible";
  updateloadingtext("StartingScreenNoHMD");
  document.getElementById('ButtonHolder').style.visibility = "hidden";
  startRhubarbVR("ScreenNoHMD");

}
function VR(){
  document.getElementById('myProgress').style.visibility = "visible";
  updateloadingtext("StartingVR");
  document.getElementById('ButtonHolder').style.visibility = "hidden";
  startRhubarbVR("VR");
}

const {ipcRenderer} = require("electron");
ipcRenderer.send("GetUpdates");
ipcRenderer.on('UpdateData', (event, arg) => {
  console.log(arg);
  document.getElementById('news').innerHTML = arg.msg;
  needsupdate = arg.needstoupdate||!arg.hasdownloadedonce;
});
ipcRenderer.on('UpdateProsentage', (event, arg) => {
  document.getElementById('myBar').style.width = arg.prsentage;
  updateloadingtext(arg.text);
  if(arg.lockdown){
    document.getElementById('ButtonHolder').style.visibility = "hidden";
  }
});
  document.getElementById('Screen').onclick = screen;
  document.getElementById('ScreenNoHMD').onclick = ScreenNoHMD;
  document.getElementById('VRbutton').onclick = VR;

  function startRhubarbVR(mode){
    if(needsupdate){
      updateloadingtext("FetchingUpdate");
    }
    ipcRenderer.send("start",mode);
  }