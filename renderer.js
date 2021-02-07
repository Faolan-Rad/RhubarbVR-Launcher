// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const {ipcRenderer} = require("electron");
ipcRenderer.send("GetUpdates");
ipcRenderer.on('UpdateData', (event, arg) => {
  console.log(arg);
});
ipcRenderer.on('sessionid', (event, arg) => {
	console.log(arg);
  });

  
//const customTitlebar = require('custom-electron-titlebar');
//
//new customTitlebar.Titlebar({
//	backgroundColor: customTitlebar.Color.fromHex('#444')
//});
