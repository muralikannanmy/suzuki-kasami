process.on('message', message => {
    init(message);
});

let siteIndex;
let siteId;
let pid = process.pid;
let RN = [];
let token;

const init = (message) => {
    if (message == 'created') {
        console.log(pid);
    }
    message = decodeMessage(message);

    if (message.type == 'site') {
        RN.length = message.no_of_sites;
        RN.fill(0);
        createPeriodicRequest(message.data);
    }

    if (message.type == 'broadcast') {
        RN[message.data] = RN[message.data] + 1;
        console.log(`RN ${parseInt(siteIndex + 1)} : ${JSON.stringify(RN)}`);
    }

    if (message.type === 'token') {
        console.log(`LN ${JSON.stringify(message.data)}`);
        console.log(`Current Token Holder is ${siteId}`);
        criticalSection();
    }
    setTimeout(() => {
        process.exit();
    }, 60000);
}

//TO CREATE REQUEST IN A PERIODIC INTERVAL
const createPeriodicRequest = (indexOfSite) => {
    siteIndex = indexOfSite;
    siteId = `S${siteIndex + 1}`;
    console.log(`Site ${siteId} is created with pid ${pid}`);
    const interval = Math.floor(Math.random() * (10000 - 5000 + 1)) + 5000;
    setInterval(() => {
        let message = {
            type: 'broadcast',
            data: siteIndex
        }
        let encoded = encodeMessage(message);
        process.send(encoded);
        console.log(`Site S${siteIndex + 1} is requesting to enter CS`);
    }, interval);
}

//TO SIMULATE CRITICAL SECTION
const criticalSection = () => {
    let message = {
        type: 'cs_enter',
        data: siteId,
    }
    let encoded = encodeMessage(message);
    process.send(encoded);
    console.log(`Site ${siteId} has entered the Critical Section`);

    setTimeout(() => {
        let message = {
            type: 'cs_exit',
            data: siteId,
            index: siteIndex,
            ln: RN
        }
        console.log(`Site ${siteId} has exited the Critical Section`);
        let encoded = encodeMessage(message);
        process.send(encoded);
    }, 2000);
}

const encodeMessage = (obj) => {
    let encoded = Buffer.from(JSON.stringify(obj)).toString('base64');
    return encoded;
}

const decodeMessage = (obj) => {
    let decoded = JSON.parse(Buffer.from(obj, 'base64'));
    return decoded;
}