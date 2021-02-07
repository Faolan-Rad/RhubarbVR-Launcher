// Modules to control application life and create native browser window
const {app, BrowserWindow,Menu,ipcMain} = require('electron');
const appVersion = require('./package.json').version;
const appRepo = require('./package.json').repository;
const os = require('os').platform();
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
let  deeplinkingUrl;
var Datastore = require('nedb')
  , db = new Datastore({ filename: './db', autoload: true });
app.setAsDefaultProtocolClient('rhubarbvr');
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
        if(db.getAllData()[0]==null){return;};
        data.hasdownloadedonce = true;
        if(db.getAllData()[0].versionnumber < json.ver){
          data.needstoupdate = true;
          udateurl = json.url;
        }
        data = "" 
      });
    return data;
}
function createWindow () {
  const template = [
    {
      label: 'RhubarbVR',
      submenu: [
          { role: 'close' }
        ]
    }
  ]
  
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu); 
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 400, height: 600,frame: false,
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


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
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
  
});
function logEverywhere(s) {
  console.log(s)
  if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.executeJavaScript(`console.log("${s}")`)
  }
}