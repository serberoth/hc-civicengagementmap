import entities from "./entities.js";

import jsdom from "jsdom";
import axios from "axios";

const JSDOM = jsdom.JSDOM;

const features = entities.features;

function isEmpty(str) { return str === undefined || str === null || str.match(/^\s*$/) !== null; }

function escapeForCSV(str) { return `"${str.split('"').join('""')}` }

async function readFeature(uri, debug) {
    // if (uri === undefined || uri === null) { console.error("UNDEFINED OR NULL URI"); return; }
    try {
        const { data } = await axios.get(uri);

        const dom = new JSDOM(data, {
            // runScripts: "dangerously",
            runScripts: "outside-only",
            resources: "usable"
        });
        const { document } = dom.window;

        // const divs = document.querySelectorAll("section#contact > div.container div.info-box");
        const divs = document.querySelectorAll('div.info-box');
        // Pull the entity name from the first info-box div
        const entityName = divs[0].querySelector('h3').textContent;

        // Pull the descriptive text from the second info-box div
        const paragraphs = divs[1].querySelectorAll('p');
        var desc = [];
        for (var i = 0; i < paragraphs.length - 1; ++i) {
            const content = paragraphs[i].textContent;
            if (!isEmpty(content)) {
                desc.push(content);
            }
        }

        // Pull the contact from the third anchor tag in the info-box div
        const mailto = divs[2].querySelector('a');
        const contact = mailto.textContent;

        let entity = {
            uri: uri,
            name: entityName,
            desc: desc,
            contact: contact,
        };

        // if (!!debug) {
        //     console.log('---------- E N T I T Y ----------');
        //     console.log(`Org Name: ${entity.name}  => ${entity.uri}`);
        //     entity.desc.forEach(e => console.log(`Description: ${e}`));
        //     console.log(`Contact: ${entity.contact}`);
        // }
        console.log(`${escapeForCSV(entity.name)},${escapeForCSV(entity.contact)},${entity.desc.map(s => escapeForCSV(s)).join(',')}`);

        return entity;
    } catch (error) {
        throw error;
    }
}

const readFeatures = async() => {
    // Read a single feature to test out the scraping code before we spend time reading them all
    // return [ await readFeature('https://civicengagementmap.haverford.edu/item/healthpoint') ];
    return await Promise.all(features.map(async f => { await readFeature(f.properties.popupcontent, true) }));
}



readFeatures().then(entities => {
    // Write the entities out in comma separated format
    entities.forEach(e => {
        // console.log(e);
        // console.log(`${e.name},${e.contact},${e.desc.join(',')}`);
    });
});
