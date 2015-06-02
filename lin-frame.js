function LINFrame(resources)
{
    // event handler can be used to emit
    this.resources = resources;

    this.type =
    {
        LIN_FRAME_UNCONDITIONAL: 0,
        LIN_FRAME_EVENT_TRIGGERED: 1,
        LIN_FRAME_SPORADIC: 2
    };

    this.id =
    {
        LIN_ID_SIGNAL: 0x00,
        LIN_ID_DIAGNOSTIC_REQUST: 0x3c,
        LIN_ID_DIAGNOSTIC_RESPONSE: 0x3d,
        LIN_ID_USER_DEFINED: 0x3e,
        LIN_ID_RESERVED: 0x3f
    };

    this.setProtectedIdentifier(this.id.LIN_ID_SIGNAL, 0);
    this.setFrameType(this.type.LIN_FRAME_UNCONDITIONAL);
    this.setIsRequestFrame(false);
}

// if id == LIN_ID_SIGNAL, offset is added to id
LINFrame.prototype.setProtectedIdentifier = function(id, offset)
{
    if(id == this.id.LIN_ID_SIGNAL)
    {
        this.protectedIdentifier = id + offset;
    }else
    {
        this.protectedIdentifier = id;
    }
}

LINFrame.prototype.setFrameType = function(frameType)
{
    this.frameType = frameType;
}

LINFrame.prototype.setIsRequestFrame = function(isRequestFrame)
{
    this.isRequestFrame = isRequestFrame;
}



/* -------------------------------------------------------------- */
/* ------------------- OVERRIDE THESE METHODS ------------------- */
/* -------------------------------------------------------------- */

// Return ARRAY of up to 8 bytes
// getData is only called if this frame is NOT request frame
LINFrame.prototype.getResponseData = function()
{
    return [Math.floor(Math.random() * 10) + 1, Math.floor(Math.random() * 10) + 1, Math.floor(Math.random() * 10) + 1,];
}

// handleResponse is only called if this frame IS request frame
LINFrame.prototype.handleResponse = function(data)
{
    //console.log(this.getId() + '/R: ' + data.toString('hex'));
}


// Handle collisions if options.type == LIN_FRAME_EVENT_TRIGGERED and a collision is detected
// Returns ARRAY of appropriate LINFrames or FALSE if no handler frames should be generated
// Note that in accordance with LIN spec, this method should never return FALSE if it is called
LINFrame.prototype.handleCollisions = function()
{
    return false;
}

module.exports = LINFrame;
