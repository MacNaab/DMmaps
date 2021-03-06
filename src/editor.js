const { remote, ipcRenderer} = require('electron');
const {app} = require('electron').remote;
const { Menu, MenuItem} = remote;
const { dialog, getCurrentWindow, BrowserWindow, screen } = require('electron').remote
const fs = require('fs');
const { renderer } = require('./renderer');
window.$ = window.jQuery = require('jquery');
const Split = require('split.js');
const customTitlebar = require('custom-electron-titlebar');
const Mousetrap = require('mousetrap');
const jscolor = require('./colorpicker/jscolor');
var glob = require("glob")

const {
    EDITOR_MEASUREMENTSETTINGS,
    TITLEBAR_OPENWINDOW,
    TITLEBAR_OPEN_GENERATOR_WINDOW,
    TITLEBAR_SAVEPROJECT,
    TITLEBAR_SAVEASPROJECT,
    EDITOR_SETPACK,
    EDITOR_CHECKBROKEN,
    UPDATE_THEME,
    UPDATE_BROKENLINKS,
}  = require('../utils/constants');
var i18n = new(require('../translations/i18n'))

window.addEventListener('DOMContentLoaded', () => {
    const titlebar = new customTitlebar.Titlebar({
        backgroundColor: customTitlebar.Color.fromHex('#1a1918'),
        overflow: "hidden",
        titleHorizontalAlignment: "left"
    });
    var menu = new Menu();
    titlebar.updateMenu(menu);
    titlebar.updateTitle(i18n.__('Options'));
    //getversion();
})

/** ------------------- Localization ------------------- */

document.getElementById("them0").innerText = i18n.__("Themes:");
document.getElementById("them1").innerText = i18n.__("Hue slider tokens:");
document.getElementById("them2").innerText = i18n.__("Primary button color:");
document.getElementById("them3").innerText = i18n.__("Primary hover color:");
document.getElementById("them4").innerText = i18n.__("Secondary button color:");
document.getElementById("them5").innerText = i18n.__("Secondary hover color:");
document.getElementById("them6").innerText = i18n.__("Reset");

document.getElementById("file0").innerText = i18n.__("File Management:");
document.getElementById("file1").innerText = i18n.__("Pack Images:");
document.getElementById("file2").innerText = i18n.__("This is will make all images linked anywhere in the project be stored directly in the .dmdb file.");
document.getElementById("file3").innerText = i18n.__("Please be aware, this will make the project take longer to save and be larger, but there will be no broken links.");
document.getElementById("file4").innerText = i18n.__("Broken Links");
document.getElementById("file5").innerText = i18n.__("If you have broken links you can select the option below to search for the folder where you think they might be, it will be searched for the missing files.");
document.getElementById("brokenlinksinfodisplay").innerText = i18n.__("Load a project to check for missing files.");
document.getElementById("packbtn").innerText = i18n.__("Missing");
document.getElementById("myfileslabel").innerText = i18n.__("Select a folder to search for images.");

document.getElementById("meas0").innerText = i18n.__("Measurement tools:");
document.getElementById("meas1").innerText = i18n.__("To change the measurement distance, activate calibration mode.");
document.getElementById("meas2").innerText = i18n.__("Calibration");
document.getElementById("meas3").innerText = i18n.__("Current measurement type:");
document.getElementById("meas4").innerText = i18n.__("Miles");
document.getElementById("meas5").innerText = i18n.__("Kilometers");
document.getElementById("meas6").innerText = i18n.__("Meters");
document.getElementById("meas7").innerText = i18n.__("Select a distance using the measurement mode, then type the distance here, and select the corrosponding measurement type.");
document.getElementById("meas8").innerText = i18n.__("Distance:");
document.getElementById("meas9").innerText = i18n.__("Miles");
document.getElementById("meas10").innerText = i18n.__("Kilometers");
document.getElementById("meas11").innerText = i18n.__("Meters");
document.getElementById("meas12").innerText = i18n.__("Confirm Calibration.");


/** -------------------- Variables --------------------- */

const primarywindow = remote.getGlobal ('textwindow');

var hueshift = document.getElementById("hueSelection");
var primarycolor = document.getElementById("primarycolor");
var primaryhighlight = document.getElementById("primaryhighlight");
var secondarycolor = document.getElementById("secondarycolor");
var secondaryhighlight = document.getElementById("secondaryhighlight");
var styles = document.getElementById("styles");
var brokenlinkoutput = document.getElementById("brokenlinksinfodisplay");
var browsebrokenlinkslabel = document.getElementById("myfileslabel");
var browsebrokenlinks = document.getElementById("myfiles");
var brokenlinkscontainer = document.getElementById("brokenlinkscontainer");
var brokenlinkslist = document.getElementById("drawinglist");

var currentbrokenimageUrls = [];
var currentbrokenimagefiles = [];

browsebrokenlinks.style.opacity = 0;

/** ----------------- Broken Links ------------------------- */

ipcRenderer.on(UPDATE_BROKENLINKS, (event, brokenimageUrls) => {
    if (brokenimageUrls.length > 0)
    {
        currentbrokenimageUrls = brokenimageUrls;
        currentbrokenimagefiles = [];
        for(var i in currentbrokenimageUrls)
        {
            currentbrokenimagefiles.push(currentbrokenimageUrls[i].replace(/^.*[\\\/]/, ''));
        }

        var newhtml = '';
        for(var i = 0; i < currentbrokenimagefiles.length; i++)
        {
            newhtml = newhtml + '<li >' + currentbrokenimagefiles[i] + '</li>';
        }
      
        brokenlinkslist.innerHTML = newhtml;

        brokenlinkoutput.innerText = i18n.__("Found ") + brokenimageUrls.length + i18n.__(" broken links.");
        brokenlinkscontainer.style.display = "block";
    }
    else
    {
        currentbrokenimageUrls = [];
        currentbrokenimagefiles = [];
        brokenlinkoutput.innerText = i18n.__("Found ") + i18n.__("No") + i18n.__(" broken links.");
        brokenlinkscontainer.style.display = "none";
    }
})

browsebrokenlinks.onchange = function(event) {
    var fileList = browsebrokenlinks.files;
    var foundfiles = [];
    for(var i in fileList)
    {
        if (fileList[i].path != undefined)
        {
            var filename = fileList[i].path.replace(/^.*[\\\/]/, '');
            //console.log(fileList[i].path.replace(/^.*[\\\/]/, ''));
            if (currentbrokenimagefiles.indexOf(filename) != -1)
            {
                var replacementpath = {
                    old: currentbrokenimageUrls[currentbrokenimagefiles.indexOf(filename)],
                    new: fileList[i].path
                }
                foundfiles.push(replacementpath);
            }
        }
        if (foundfiles.length >= currentbrokenimagefiles.length)
        {
            break;
        }
    }

    if (foundfiles.length > 0)
    {
        ipcRenderer.send(UPDATE_BROKENLINKS, foundfiles);
    }
 }

/** ---------------------- Themes -------------------------- */

/*
var pullfiles=function(){ 
    // love the query selector
    var fileInput = document.querySelector("#myfiles");
    var files = fileInput.files;
    // cache files.length 
    var fl = files.length;
    var i = 0;

    while ( i < fl) {
        // localize file var in the loop
        var file = files[i];
        console.log(file);
        i++;
    }    
}

// set the input element onchange to call pullfiles
document.querySelector("#myfiles").onchange=pullfiles;
*/
//console.log(styles.innerText);

ipcRenderer.send(UPDATE_THEME);

function saveSettings()
{
    //console.log(document.getElementById("primarycolor").toRGBString())
    var settings = {
        hueshift: parseFloat(hueshift.value),
        primarycolor: primarycolor.value,
        primaryhighlight: primaryhighlight.value,
        secondarycolor: secondarycolor.value,
        secondaryhighlight: secondaryhighlight.value
    }
    ipcRenderer.send(UPDATE_THEME, settings);
    /*
    fs.writeFile( '/themesettings.json' , JSON.stringify(settings, null, 2), (err) => {
        if(err){
            console.log("An error ocurred creating the file "+ err.message)
            return;
        }
        loadSettings();
        
     });
     */
}
ipcRenderer.on(UPDATE_THEME, (event, data) => {
    loadSettings(data);
})

function loadSettings(data)
{
    var importeddata = data;
    hueshift.value = importeddata.hueshift;
    primarycolor.jscolor.fromString(importeddata.primarycolor);
    primaryhighlight.jscolor.fromString(importeddata.primaryhighlight);
    secondarycolor.jscolor.fromString(importeddata.secondarycolor);
    secondaryhighlight.jscolor.fromString(importeddata.secondaryhighlight);

    styles.innerText = ":root{ --node-token-hue: hue-rotate( "+ hueshift.value +"deg); --node-token-saturate: saturate(250%); --node-token-brightness: brightness(85%); --main-button-color: "+ primarycolor.value+ "; --main-button-highlight: " + primaryhighlight.value + "; --neg-button-color: " + secondarycolor.value + "; --neg-button-highlight: "+ secondaryhighlight.value + ";}";
}

function valuesChanged()
{
    saveSettings();
}

function resetThemes()
{
    var settings = {
        hueshift: 348,
        primarycolor: "#E6A255",
        primaryhighlight: "#f5a64c",
        secondarycolor: "#e05840",
        secondaryhighlight: "#f75c41"
    }
    ipcRenderer.send(UPDATE_THEME, settings);
}

/** --------------------- File management -------------------- */

function setPack()
{
    ipcRenderer.send(EDITOR_SETPACK);
}

/** ---------------------- Measurements -------------------- */

Mousetrap.bind(['command+w', 'ctrl+w', 'f3'], function() {
    ipcRenderer.send(TITLEBAR_OPENWINDOW); 
    return false;
});

Mousetrap.bind(['f5'], function() {
    ipcRenderer.send(TITLEBAR_OPEN_GENERATOR_WINDOW); 
    return false;
});

  /**Had unwanted results, removed. */
Mousetrap.bind(['pageup', 'pagedown'], function(){
    return false;
})
  
  Mousetrap.bind(['command+s', 'ctrl+s'], function() {
    ipcRenderer.send(TITLEBAR_SAVEPROJECT);
    return false;
});
  
  Mousetrap.bind(['command+shift+s', 'ctrl+shift+s'], function() {
    ipcRenderer.send(TITLEBAR_SAVEASPROJECT);
    return false;
});
  

function displaycalibrationtools() {
    document.getElementById("calibration-tools").classList.toggle("displayhiddenoptions");
}

function confirmCalibration()
{
    var measurementtype = document.getElementById("calibrationtype").selectedIndex;
    var calibratedlength = parseFloat(document.getElementById("distance").value);
    if (calibratedlength == 0){calibratedlength = 1;}
    var measurementdata = {
        type: measurementtype,
        length: calibratedlength
    }
    displaycalibrationtools();
    primarywindow.webContents.send (EDITOR_MEASUREMENTSETTINGS, measurementdata);
    //send scale and scale type to render
}

function currenttypechanged()
{
    var measurementtype = parseFloat(document.getElementById("currenttype").value);
    var measurementdata = {
        type: measurementtype
    }
    primarywindow.webContents.send (EDITOR_MEASUREMENTSETTINGS, measurementdata);
}

ipcRenderer.send(EDITOR_MEASUREMENTSETTINGS);

ipcRenderer.on(EDITOR_MEASUREMENTSETTINGS, (event, message) => {
    if (message.currentdistancetype != null)
    {
        console.log("test");
        document.getElementById("currenttype").selectedIndex = message.currentdistancetype;
        document.getElementById("calibrationtype").selectedIndex = message.currentdistancetype;
    }
    
    if (message.icons != null)
    {
        files = message.icons;
        initializeicons();
    }

    if (message.packtrue != null)
    {
        document.getElementById("packbtn").innerText = message.packtrue? i18n.__("Disable Image Packing") : i18n.__("Enable Image Packing");        
        if (message.packtrue)
        {
            brokenlinkscontainer.style.display = "none";
        }
    }
})