var util = require('util');
var LINFrame = require('../lin-frame.js');

function LFHeaterBox(resources)
{
    LINFrame.call(this, resources);

    this.protectedIdentifier = this.id.LIN_ID_SIGNAL + 1;
    this.frameType = this.type.LIN_FRAME_UNCONDITIONAL;
    this.isRequestFrame = false;

    this.options =
    {
        fanSpeed: 0,
        heatOn: 0,
        defrostOn: 0
    }
}

util.inherits(LFHeaterBox, LINFrame);

LFHeaterBox.prototype.getResponseData = function()
{
    return [this.options.fanSpeed, this.options.heatOn, this.options.defrostOn];
}

module.exports = LFHeaterBox;