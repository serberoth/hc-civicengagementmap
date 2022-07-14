import entities from "./entities.js";

import jsdom from "jsdom";
import axios from "axios";

const JSDOM = jsdom.JSDOM;

const features = entities.features;



function isEmpty(str) { return str === undefined || str === null || str.match(/^\s*$/) !== null; }

function escapeForCSV(str) { return `"${str.split('"').join('""')}"` }



async function readFeature(uri, debug) {
    try {
        const { data } = await axios.get(uri);

        const dom = new JSDOM(data, {
            runScripts: "outside-only",
            resources: "usable"
        });
        const { document } = dom.window;

        const divs = document.querySelectorAll("section#contact > div.container div.info-box");
        // Pull the entity name from the first info-box div
        let entityName = divs[0].querySelector('h3').textContent;

        // Pull the entity URL from the descriptive content
        let anchor = divs[1].querySelector('p a');
        let entityUri = "";
        if (anchor === undefined || anchor === null) {
            console.error(`MISSING ENTITY URL: ${uri}`);
        } else {
            entityUri = anchor.href;
        }
        // Pull the descriptive text from the second info-box div
        let paragraphs = divs[1].querySelectorAll('p');
        let desc = [];
        for (let i = 0; i < paragraphs.length - 1; ++i) {
            let content = paragraphs[i].textContent;
            if (!isEmpty(content)) {
                desc.push(content);
            }
        }
        desc = desc.join('\n\n');

        // Pull the contact from the third anchor tag in the info-box div
        let mailto = divs[2].querySelector('a');
        let contact = mailto.textContent;

        let entity = {
            name: entityName,
            desc: desc,
            contact: contact,
            uri: entityUri,
        };

        if (!!debug) {
            console.log('---------- E N T I T Y ----------');
            console.log(`Org Name: ${entity.name}  => ${entity.uri}`);
            entity.desc.forEach(e => console.log(`Description: ${e}`));
            console.log(`Contact: ${entity.contact}`);
        }

        return entity;
    } catch (error) {
        throw error;
    }
}

const readFeatures = async() => {
    // Read a single feature to test out the scraping code before we spend time reading them all
    // return [ await readFeature('https://civicengagementmap.haverford.edu/item/healthpoint') ];
    return await Promise.all(features.map(async f => { return await readFeature(f.properties.popupcontent, true); }));
}



readFeatures().then(entities => {
    // Write the entities out in comma separated format
    console.log('Organization,URL,Contact E-mail,Description');
    entities.sort((a, b) => a.name.localeCompare(b.name)).forEach(e => {
        console.log(`${escapeForCSV(e.name)},${escapeForCSV(e.uri)},${escapeForCSV(e.contact)},${escapeForCSV(e.desc)}`);
    });
});
