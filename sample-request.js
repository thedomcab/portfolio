const request = require("request-promise-native");
const Promise = require("promise");
const fs = require('fs');
const format = require("date-format");
const numeral = require("numeral");
const files = fs.readdirSync("./").filter((item) => item.search(/data\.json/i) > -1);
const program = require("commander");
function urlCheck(URL) {
    URL = filterString(URL);
    return /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&\/\/=]*)/.test(URL) ? URL : "";
}
function filterString(str) {
   return str.startsWith("=") ? str.substring(1) : str;
}
function collectTypes(value, previous) {
    return previous.concat([value]);
}
function collect(value, previous) {
    return previous.concat([value]);
}
program.version("0.0.1").option('-r, --repeat <count>', 'number of times to repeat each request', filterString).option("-s, --storefront <url>", "home page url request", urlCheck).option("-l, --listing-product <url>", "product listing page url request", urlCheck).option("-p, --product <url>", "product details page url request", urlCheck).option("-t, --type-custom <type>", "custom page type to request", collectTypes, []).option("-u, --url-custom <url>", "the custom page type url to request", collect, []).option("-n, --name <folder-name>", "folder name for data");

program.parse(process.argv);
let date = new Date();
let end = new Date(date.getTime() + (1000 * 60 * 60 * 24 * 182));
let api_calls = 0;
let data = null;
let repeat = 1;
let folderName = (program.name) ? program.name : ""
let arrays = {"home": [], "product":[], "search":[]};
let responses = {"home":[], "product": [], "search": []};
let jsonData = {"home": {}, "product": {}, "search": {}};
let counter = 0;
let type = '';
let dir = '';
let URLs = [{"type": "home", "URL": "https://www.skis.com"}, {"type": "search", "URL": "https://www.skis.com/skis/100,default,sc.html"}, {"type": "product", "URL":"https://www.skis.com/Rossignol-Sky-7-HD-Skis-with-SPX-12-Konect-Bindings/562276P"}];
let filename = format('yyyy-MM-dd', date) + "-sample-";
let current_calls = format('yyyy_MM_dd', date);
let dataarray = ["loadTime", "TTFB", "render", "firstContentfulPaint",  "SpeedIndex", "LastPaintedHero", "LastInteractive", "docTime", "requestsDoc", "bytesInDoc","fullyLoaded"];
dataarray.push("requestsFull", "bytesIn");
if (program.repeat) {
    repeat = program.repeat;
}
if (program.storefront && program.storefront !== "") {
    URLs[0].URL = program.storefront;
}
if (program.listingProduct && program.listingProduct !== "") {
    URLs[1].URL = program.listingProduct;
}
if (program.product && program.product !== "") {
    URLs[2].URL = program.product;
}


if ((program.typeCustom && !program.urlCustom) || (program.urlCustom && (program.urlCustom.length < program.typeCustom.length))) {
    program.optionMissingArgument(program.optionFor('-u'));
}

if ((program.urlCustom && !program.typeCustom) || (program.typeCustom && (program.typeCustom.length < program.urlCustom.length))) {
    program.optionMissingArgument(program.optionFor('-t'));
}


if (program.urlCustom && program.typeCustom && program.urlCustom.length && program.typeCustom.length  && program.urlCustom.length === program.typeCustom.length) {
    for (var i = 0; i < program.urlCustom.length && i < program.typeCustom.length; i++) {
        let customURL = program.urlCustom[i];
        let customType = program.typeCustom[i];
        for (let j = 0; j < URLs.length; j++) {
            let item = URLs[j];
            if (item.type === customType) {
                item.URL = customURL;
                customType.URL = "";
                customURL = "";
                break;
            }
        }
        if (customURL !== "" && customType !== "") {
            URLs.push({"type": customType, "URL": customURL});
        }
    }
}

let string = " ,Load Time,First Byte,Start Render,First Content Paint,Speed Index,Last Painted Hero,First CPU Idle, Doc Time Complete, Doc Time Request,";
string += "Doc Time Bytes In,Fully Loaded Time,Fully Loaded Requests, Fully Loaded Bytes In\n";
for (let key in arrays) {
    arrays[key].push(string);
}

function checkArray() {
    let checked = Number(repeat) === ((arrays[type].length - 1) / 2);
    clear = true;
    if (checked) {
        checkItems();
    }
}
function updateString(data) {
    if (data && data.median) {
        let currentView = null;
        
        let string = "";
        for (var key in data.median) {
            currentView = data.median[key];
            if (key === "firstView") {
                string = "First View Run (";
            } else if (key === "repeatView") {
                string = "Repeat View Run (";
            } 
            if (currentView && currentView.run) {
                string += data.median[key].run;
            } 
            if (key === 'firstView' || key === 'repeatView') {
                string += "),";
            }
            for (var i = 0; i < dataarray.length; i++) {
                let currentdata = "-";
                let currentkey = dataarray[i];
                if (currentView[currentkey]) {
                    currentdata = currentView[currentkey];
                }
                if (currentkey.search(/bytesin|request/i) < 0 && currentdata !== '-') {
                    console.warn("seconds: ", currentdata);
                    currentdata = numeral(currentdata / 1000).format("0.000") + 's';
                } else if (currentkey.search(/bytesin/i) > -1 && currentdata !== '-') {
                    console.warn("bytes: ", currentdata);
                    currentdata = '"' + numeral(currentdata / 1024).format("0,0")  + " KB" + '"';
                } else {
                    console.warn("request/no data: ", currentdata);
                }
                console.warn('current data: ', currentdata);
                string += (currentdata + ",");
            }
            string = string.slice(0, -1);
            string += "\n";
            arrays[type].push(string);
        }
        
        var topObjects = {};
        var innerObjects = {};
        for (var i in data.median) {
            let current = data.median[i];
            topObjects[i] = {};
            innerObjects[i] = {};
            for (j in current) {
                let next = current[j];
                if (typeof next !== 'object') {
                    topObjects[i][j] = next;
                } else {
                    innerObjects[i][j] = next;
                }
            }
        }
        for (var i in data.median) {
            let sample = dir + '/' + i.toLowerCase() + "-data.json";
            let sampleObject = dir + '/' + i.toLowerCase() + "-objects-data.json";
            let innerId = "objects-" + i.toLowerCase();
            let topId = "values-" + i.toLowerCase();

            if (!jsonData[type][innerId]) {
                jsonData[type][innerId] = [];
            }
            if (!jsonData[type][topId]) {
                jsonData[type][topId] = [];
            }
            jsonData[type][innerId].push(innerObjects[i]);
            jsonData[type][topId].push(topObjects[i]);
            let objects = JSON.stringify({"median":jsonData[type][innerId]});
            let values = JSON.stringify({"median": jsonData[type][topId]});
            
            fs.writeFileSync(sample, values);
            console.warn('Saved File: ', sample);
            fs.writeFileSync(sampleObject, objects);
            console.warn('Saved File: ', sampleObject);
        }
        checkArray();
    }
}
function delay(ms) {
   return new Promise(resolove => setTimeout(resolove, ms));
}
async function execute() {
    let URL = "";
    let topitem
    do {
        if (counter >= repeat && URLs.length) {
            counter = 0;
        }
        if ((counter === 0 || counter >= repeat) && URLs.length) {
            topitem = URLs.shift();
            URL = topitem.URL;
            type = topitem.type;
        } 
        if (URL !== "" && type !== "") {
            let testURL = 'http://www.webpagetest.org/runtest.php?f=json&url=' + URL + '&k=A.9a7741cd22e0b72a386f107ff5090279';
            let response = await request(testURL);
            api_calls++;
            let jsonURL = (JSON.parse(response) && JSON.parse(response).data && JSON.parse(response).data.jsonUrl) ? JSON.parse(response).data.jsonUrl : '';
            if (jsonURL !== '') {
               responses[type].push(JSON.parse(response));
               let jsonResponse = JSON.stringify({"response": responses[type]});
               dir = filename + type;
               let file = dir +  "/response.json";
               if (!fs.existsSync(dir)) {
                   fs.mkdirSync(dir);
               }
               fs.writeFileSync(file, jsonResponse);
               console.warn("Saved File: ", file);
               let data = null;
               response = await request(jsonURL);
               data = JSON.parse(response).data;

               while (data && data.statusCode) {
                    let status = data.statusText;
                    let waiting = status.search(/waiting\s+behind\s+\d+\s+other\s+test/i) > -1;
                    let intervals = (status.match(/\d+/g)) ? status.match(/\d+/g).reduce((total, number) => {return Number(total) + Number(number)}) : 50;
                    intervals = (waiting) ? intervals * 8200 : 180000;
                    let time = format("hh:mm:ss.SSS", new Date());
                    console.warn(status);
                    console.warn(intervals);
                    console.warn(time);
                    await delay(intervals);
                    console.warn('timeout done');
                    response = await request(jsonURL);
                    data = JSON.parse(response).data;
                    console.warn('---------------check----------------------');
               } 
               updateString(data);
            }
        }
        counter++;
    } while (counter < repeat || URLs.length);
    console.warn('end of execute');
    let values = (!data) ? {"data":{"api_calls":{}}} : data;
    values.data.api_calls[current_calls] = api_calls;
    fs.writeFileSync('data.json',JSON.stringify(values));
}
files.forEach(function(file, j){
    let output = fs.readFileSync(file, 'utf8');
    data = JSON.parse(output);
    if (data && data.data && data.data.api_calls) {
        let updated = {};
        for (let key in data.data.api_calls) {
            let apidate = new Date(key.replace(/_/g, '-'));
            if (apidate.getTime() < end.getTime()) {
                updated[key] = data.data.api_calls[key];
            }
        }
        data.data.api_calls = updated;
    }
    api_calls = (data && data.data && data.data.api_calls && data.data.api_calls[current_calls]) ? data.data.api_calls[current_calls] : api_calls;
});
execute();
console.warn('Continuer after execute');
function checkItems() {
    let string = arrays[type].join('');
    let file = filename + type + "/data.csv";
    fs.writeFileSync(file, string);
    console.warn('Saved File: ', file);
}

