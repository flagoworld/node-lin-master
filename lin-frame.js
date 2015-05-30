function LINFrame() {}

LINFrame.prototype.getId = function()
{
    return 0x3b;
}

// Return array of up to 8 bytes, or null to request data from a slave
LINFrame.prototype.getData = function()
{
    return [0, 1, 2, 3, 4, 5, 6, 7];
    return null;
}

LINFrame.prototype.handleResponse = function(data)
{
    //console.log(this.getId() + '/R: ' + data.toString('hex'));
}

module.exports = LINFrame;
