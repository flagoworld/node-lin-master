var LINMaster = require('./lin-master');
var LINFrame = require('./lin-frame');

var LFHeaterBox = require('./frames/heater-box');

var frames =
{
    heaterBox: new LFHeaterBox({})
}

var master = new LINMaster({});

master.addFrame(frames.heaterBox);

master.start();

console.log('Started');


// TODO: Start express server and create HTML page for editing LFHeaterBox options (fanSpeed, heatOn, defrostOn)