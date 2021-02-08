// Modules to control application life and create native browser window
const {app, BrowserWindow,Menu,ipcMain,protocol,Buffer} = require('electron');
const appVersion = require('./package.json').version;
const appRepo = require('./package.json').repository;
const os = require('os').platform();
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const { PassThrough } = require('stream')
const {download} = require("electron-dl");
var needstoupdate = true;
function _getDeepLinkUrl(argv){
  for (const arg of argv) {
      const value = arg;
      if (value.indexOf("rhubarbvr") !== -1) {
          return value;
      }
  }

  return null;
}
let  deeplinkingUrl = _getDeepLinkUrl(process.argv);

function createStream (text) {
  const rv = new PassThrough()
  rv.push(text)
  rv.push(null)
  return rv
}
app.setAsDefaultProtocolClient("rhubarbvr");
var Datastore = require('nedb')
  , db = new Datastore({ filename: './db', autoload: true });
 const primaryInstance = app.requestSingleInstanceLock();
 if (!primaryInstance) {
         app.quit();
         return;
 }
 app.on('second-instance', (event, argv, cwd) => {
  const url = _getDeepLinkUrl(argv);
  if (url) {
    logEverywhere(url);

  }
  deeplinkingUrl = argv;
})
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
const fetch = require('node-fetch');
var udateurl = ""
var lockdown = true;
let url = "https://main-pearl.now.sh/Updates.json";
var sender;
 async function Checkforupdate(){
  let settings = { method: "Get" };
  var data = {msg:"Error Loading",
  hasdownloadedonce:false,
  needstoupdate:false,
  lockdown:true,
  deeplinkingUrl:""
};
  await fetch(url, settings)
      .then(res => res.json())
      .then((json) => {
        data.deeplinkingUrl = deeplinkingUrl;
        data.msg = json.msg;
        data.lockdown = json.lockdown;
        lockdown = json.lockdown;
        udateurl = json.url;
        if(db.getAllData()[0]==null){return;};
        data.hasdownloadedonce = true;
        needstoupdate=false;
        if(db.getAllData()[0].versionnumber < json.ver){
          data.needstoupdate = true;
          needstoupdate=true
        } 
      });
    return data;
}
function createWindow () {

  // Create the browser window.
  mainWindow = new BrowserWindow({resizable:false,transparent: true,width: 400, height: 450,frame: false,
webPreferences: {
    nodeIntegration: true
}});
  // and load the index.html of the app.
  mainWindow.loadFile('index.html');
  mainWindow.openDevTools();
  logEverywhere("createWindow# " + deeplinkingUrl)
  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store wifndows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  })
};

app.on('ready', ()=> {
  createWindow();
  console.log('appVersion', appVersion);
  console.log('appRepo', appRepo);
  console.log('os', os);
});

app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})


// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

app.on('open-url', function (event, url) {
  event.preventDefault()
  deeplinkingUrl = url
  logEverywhere("open-url# " + deeplinkingUrl);
  sender.send("sessionid",deeplinkingUrl);
  app.quit();
})

ipcMain.on('GetUpdates', async (event, arg) => {
  var localdata = await Checkforupdate()
  sender = event.sender;
  event.sender.send("UpdateData",localdata);
});

ipcMain.on('start', (event, arg) => {
  var sender = event.sender;
  if(needstoupdate){
 
    sender.send("UpdateProsentage",{prsentage:"0%",text:"StartingUpdate"});
    var onProgress = status => window.webContents.send("UpdateProsentage", {prsentage:`${status}%`,text:`Downloading${status}`});
    download(mainWindow, udateurl, onProgress)
        .then(dl => window.webContents.send("UpdateProsentage", {prsentage:`100%`,text:`Done`}));
  }

});
function logEverywhere(s) {
  console.log(s)
  if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.executeJavaScript(`console.log("${s}")`)
  }
}
