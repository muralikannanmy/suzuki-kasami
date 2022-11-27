const { isMainThread } = require('node:worker_threads');
const { fork } = require('child_process');
const readline = require("readline");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let no_of_sites = 0;
const sites = [];
let currentTokenHolder;
let Q = []; //TOKEN REQUEST QUEUE
let LN = []; //QUEUE MAINTAINED BY THE TOKEN

const init = async (input) => {
    no_of_sites = input;
    if (isMainThread) {
        for (i = 0; i <= no_of_sites - 1; i++) {
            let site = fork('./site.js'); // NEW CHILD PROCESS IS CREATED FOR EACH SITE
            sites.push(site);
            LN.push(0);
            let input = no_of_sites;
            let message = {
                'type': 'site',
                'data': i,
                'no_of_sites': no_of_sites
            }
            let encoded = encodeMessage(message);
            sites[i].send(encoded);
            sites[i].on('message', message => {
                const decoded = decodeMessage(message);
                switch (decoded.type) {
                    case 'broadcast':
                        broadcastRequest(decoded);
                        break;
                    case 'cs_enter':
                        if (Q.length > 0) {
                            Q.shift();
                        }
                        break;
                    case 'cs_exit':
                        if (Q.length > 0) {
                            let currentSiteIndex = parseInt(currentTokenHolder.charAt(1) - 1);
                            LN[currentSiteIndex] = LN[currentSiteIndex] + 1;
                            let nextSite = Q[0];
                            nextSite = nextSite.charAt(1);
                            console.log(`Token is passed from site ${currentTokenHolder} to ${Q[0]}`);
                            passToken(parseInt(nextSite - 1));
                        }
                        break;

                    default:
                        break;
                }
            });
        }
        //TO BROADCAST THE REQUEST
        const broadcastRequest = (message) => {
            sites.forEach((site) => {
                let encoded = encodeMessage(message);
                site.send(encoded);
            });

            if (!currentTokenHolder) {
                passToken(message.data);
            } else {
                Q.push(`S${parseInt(message.data + 1)}`);
                console.log(`Request Queue: ${JSON.stringify(Q)} `);
            }
        }

        //TO PASS THE TOKEN BETWEEN SITES
        const passToken = (site) => {
            let message = {
                'type': 'token',
                'data': LN
            }
            let encoded = encodeMessage(message);
            sites[site].send(encoded);
            currentTokenHolder = `S${parseInt(site + 1)} `;
        }
    }
    setTimeout(() => {
        process.exit();
    }, 60000);
}

const encodeMessage = (obj) => {
    let encoded = Buffer.from(JSON.stringify(obj)).toString('base64');
    return encoded;
}

const decodeMessage = (obj) => {
    let decoded = JSON.parse(Buffer.from(obj, 'base64'));
    return decoded;
}

rl.question('Enter the total no of sites: ', (input) => {
    init(input);
})