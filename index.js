var LINMaster = require('./lin-master');
var LINFrame = require('./lin-frame');

var master = new LINMaster({});
master.start(function()
{
    master.addFrame(new LINFrame());
});
