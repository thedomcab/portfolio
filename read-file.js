const fs = require('fs');
const format = require("date-format");
const files = fs.readdirSync("./").filter((item) => item.search(/data\.json/i) > -1);
let date = new Date();
let end = new Date(date.getTime() + (1000 * 60 * 60 * 24 * 182));
let current_calls = format('yyyy_MM_dd', date);
let api_calls = 1;

let data = null;
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
    api_calls++;
});
let values = (!data) ? {"data":{"api_calls":{}}} : data;
values.data.api_calls[current_calls] = api_calls;
fs.writeFileSync('data.json',JSON.stringify(values));

