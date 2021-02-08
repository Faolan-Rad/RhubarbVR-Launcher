// Modules to control application life and create native browser window
const {app, BrowserWindow,Menu,ipcMain,protocol,Buffer, session} = require('electron');
const appVersion = require('./package.json').version;
const appRepo = require('./package.json').repository;
const os = require('os').platform();
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const { PassThrough } = require('stream')
const request = require('request');
const fs = require('fs')
var needstoupdate = true;
var vernumbar = 0;
const Store = require('electron-store');
const rhubarbfolder = app.getPath('userData');
const store = new Store();

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
        vernumbar = json.ver
        data.deeplinkingUrl = deeplinkingUrl;
        data.msg = json.msg;
        data.lockdown = json.lockdown;
        lockdown = json.lockdown;
        udateurl = json.url;
        if(store.get('ver') == null){return;};
        data.hasdownloadedonce = true;
        needstoupdate=false;
        if(store.get('ver') < json.ver){
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
    if (!fs.existsSync(rhubarbfolder+"\\data")){
      fs.mkdirSync(rhubarbfolder+"\\data");
    }
    download(udateurl,rhubarbfolder+"\\data\\Update",(error,msg)=>{
    if(error){ sender.send("UpdateProsentage",{prsentage:"0%",text:"error"+error});return;}
    extractupdate(sender,
  () => {
    fs.unlinkSync(rhubarbfolder+"\\data\\Update");
    store.set('ver',vernumbar);
    openrhubarb(arg,sender);
  })

    },sender);
  }else{
    openrhubarb(arg,sender);
  }

});
function logEverywhere(s) {
  console.log(s)
  if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.executeJavaScript(`console.log("${s}")`)
  }
}
const download = (url, filename, callback,sender) => {
  console.log(filename)

  const file = fs.createWriteStream(filename);
  let receivedBytes = 0
  var totalBytes = 0;

  // Send request to the given URL
  request.get(url)
  .on('response', (response) => {
      if (response.statusCode !== 200) {
          return callback('Response status was ' + response.statusCode);
      }
      totalBytes = response.headers['content-length'];
  })
  .on('data', (chunk) => {
      receivedBytes += chunk.length;
      var persent = Math.round((receivedBytes/totalBytes)*100);
      if(mainWindow){
        sender.send("UpdateProsentage",{prsentage:`${persent}%`,text:`Downloading:${persent}%`});
      }
  })
  .pipe(file)
  .on('error', (err) => {
    //fs.unlink(filename);
    sender = null;
    return callback(err.message,null);
  });

  file.on('finish', () => {
      file.close(callback);
      return callback(null,true)
  });

  file.on('error', (err) => {
      fs.unlink(filename);
      return callback(err.message,null);
  });
}

const onezip = require('onezip');
const to = rhubarbfolder + '\\Game';
const from = rhubarbfolder+"\\data\\Update";
function extractupdate(sender,ree){
let extract = onezip.extract(from, to);

extract.on('file', (name) => {
    console.log(name);
});

extract.on('start', (percent) => {
    console.log('extracting started');
    sender.send("UpdateProsentage",{prsentage:`${0}%`,text:`Extract Started`});
});

extract.on('progress', (percent) => {
    sender.send("UpdateProsentage",{prsentage:`${percent}%`,text:`Extracting:${percent}%`});

});

extract.on('error', (error) => {
    console.error(error);
    sender.send("UpdateProsentage",{prsentage:`${0}%`,text:`Error`+error});
});

extract.on('end', ree);
}

const { execFile } = require('child_process');
function openrhubarb(arg,sender){
  sender.send("UpdateProsentage",{prsentage:"100%",text:"StartingRhubarbVR"})
  var exe = rhubarbfolder+"\\Game\\RhubarbVR.exe"
  var args = [];
  if(arg == "ScreenNoHMD"){
    args.push("-NOHMD");
  }
  if(arg == "VR"){
    args.push("-RhubarbStartVR");
  }
  var sessionid = "";
  if(deeplinkingUrl != null){
    var start = deeplinkingUrl.indexOf('session=')
    var end = deeplinkingUrl.indexOf(' ',start);
    if(start != -1){
    if(end==-1){
      sessionid = deeplinkingUrl.substring(start,end);
    }else{
      sessionid = deeplinkingUrl.substring(start,deeplinkingUrl.length - start);
    }
    args.push("-session "+sessionid)
    }
  }
  execFile(exe, args, function(err, data) {
    if(err) {
      sender.send("UpdateProsentage",{prsentage:`${0}%`,text:`Error`+err});
    } 
    else 
    console.log(data.toString());                     
    app.quit();
  }); 
}


