const fs = require('fs');
let arrays = {"home":[], "product":[], "search":[]};
let values = ["_loadTime", "_TTFB", "_render", "_firstContentfulPaint",  "_SpeedIndex", "_LastPaintedHero", "_LastInteractive", "_docTime", "_requestsDoc", "_bytesInDoc","_fullyLoaded"];
values.push("_requestsFull", "_bytesIn");
let header = "";
let string = ",Load Time,First Byte,Start Render,First Content Paint,Speed Index,Last Painted Hero,First CPU Idle, Doc Time Complete, Doc Time Request,";
string += "Doc Time Bytes In,Fully Loaded Time,Fully Loaded Requests, Fully Loaded Bytes In\n";
header += string;
string = header;
for (let key in arrays) {
    arrays[key].push(string);
}
const dir = fs.readdirSync("./").filter(item => fs.lstatSync(item).isDirectory());
let lengths = {};
dir.forEach(function(directory, i){
    let files = fs.readdirSync(directory);
    if (!lengths[directory]) {
        lengths[directory] = (files.length * 2) + 1;
    }
    files.forEach(function(file, j){
        let readFile = directory + "/" + file;
        fs.readFile(readFile, 'utf8', (err, data) => {
            if (err) {
                throw err;
            }
            let json = JSON.parse(data).log;
            let median = "Median,";
            let third = "Third,";
            let medianarrays = {};
            for (let key in json.pages) {
                let currentarray = json.pages[key];
                if (Number(key) === 2) {
                    third += createString(currentarray);
                }
                for (let k = 0; k < values.length; k++) {
                    let currentkey = values[k];
                    let currentdata = currentarray[currentkey];
                    if (!currentdata) {
                        currentdata = 0;
                    }
                    if (!medianarrays[currentkey]) {
                        medianarrays[currentkey] = [];
                    }
                    medianarrays[currentkey].push(currentdata);
                }
            }
            median += createString(medianarrays);
            arrays[directory].push(median);
            arrays[directory].push(third);
            checkItems(directory);
        });
    });
});
function createString(array) {
    let string = "";
    for (let k = 0; k < values.length; k++) {
        let currentkey = values[k];
        let currentdata = array[currentkey];
        if (Array.isArray(currentdata)) {
            currentdata.sort();
            currentdata = (currentdata.length % 2 === 1) ? currentdata[Math.floor(currentdata.length / 2)] : ((currentdata[(currentdata.length / 2) - 1] + currentdata[(currentdata.length / 2)]) / 2);
        }
        if (!currentdata) {
            currentdata = "-";
        }
        if (currentdata !== '-' && currentkey.search(/bytesin|request/i) < 0) {
            currentdata = (currentdata / 1000).toFixed(3) + " sec";
        } else if (currentdata !== "-" && currentkey.search(/bytesin/i) > -1) {
            currentdata = (currentdata / 1024).toFixed(0) + " KB";
        }
        string += (currentdata + ",");
    }
    string = string.slice(0, -1);
    string += "\n";
    return string;
}
function checkItems(type) {
    let check = arrays[type].length === lengths[type];
    if (check) {
        let string = arrays[type].join("");
        let file = type + "-sample.csv";
        fs.writeFile(file, string, (err) => {
            if (err) {
                throw err;
            }
            console.warn('Saved File: ', file);
        });
    }
    
}

