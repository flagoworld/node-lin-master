var async = require('async');
var _ = require('lodash');
var SerialPort = require('trivial-port');

// SerialPort.list(function (err, ports) {
//   ports.forEach(function(port) {
//     console.log(port.comName);
//     console.log(port.pnpId);
//     console.log(port.manufacturer);
//   });
// });

var MSEC_SEC = 1000;


function LINMaster(options)
{
    this.options = _.defaults(options,
    {
        serialPort: '/dev/ttyAMA0',
        baudRate: 200,
        breakBytes: 2,
        framePaddingPercent: 1
    });

    this.byteTime = MSEC_SEC / this.options.baudRate * 8;
    this.breakTime = this.byteTime * this.options.breakBytes;
    this.frameBytes = this.options.breakBytes + 1 + 8 + 1; // break + sync + data + checksum
    this.frameTime = this.byteTime * this.frameBytes * (1 + this.options.framePaddingPercent); // spec says to give 40% padding
    this.serialPort = null;
    this.interval = null;
    this.schedule = [];
    this.currentFrame = 0;
    this.lastFrameData = new Buffer(0);
}

LINMaster.prototype.start = function(callback)
{
    var self = this;

    // var parserDelimiter = [];
    //
    // for(var i = 0; i < self.options.breakBytes; ++i)
    // {
    //     parserDelimiter.push(0);
    // }
    //
    this.serialPort = new SerialPort(
    {
        serialPort: self.options.serialPort,
        baudRate: self.options.baudRate,
        // platformOptions:
        // {
        //     vmin: 1,
        //     vtime: 0
        // },
        // parser: function(emitter, buffer) { console.log(buffer.toString('hex')); emitter.emit('data', buffer); }
    });

    this.serialPort.initialize(function(err)
    {
        console.log('INIT ERR: ' + err);
        process.exit();
    });

    this.serialPort.on('data', function(data)
    {
        self.lastFrameData = Buffer.concat([self.lastFrameData, data], self.lastFrameData.length + data.length);
    });

    callback();

    self.interval = setInterval(function()
    {
        var frame = self.schedule[self.currentFrame];
        var data = self.lastFrameData;

        self.lastFrameData = new Buffer(0);

        console.log(frame.getId() + '/R: ' + data.toString('hex'));
        frame.handleResponse(data);

        self.currentFrame += 1;
        if(self.currentFrame >= self.schedule.length)
        {
            self.currentFrame = 0;
        }

        self.processFrame(frame);
    }, self.frameTime);
}

LINMaster.prototype.addFrame = function(frame)
{
    this.schedule.push(frame);
}

LINMaster.prototype.processFrame = function(frame)
{
    var self = this;

    if(!self.schedule.length)
    {
        return;
    }

    var frameSyncByte = 0x55;
    var frameProtectedIdentifier = (function()
    {
        var bits = frame.getId().toString(2);

        bits += bits[0] ^ bits[1] ^ bits[2] ^ bits[4];
        bits += 1 - (bits[1] ^ bits[3] ^ bits[4] ^ bits[5]);

        return parseInt(bits, 2);
    })();

    var frameData = frame.getData();

    var frameBuffer;

    if(frameData)
    {
        frameBuffer = new Buffer(self.options.breakBytes + 3 + frameData.length);

        for(var i = 0; i < frameData.length; ++i)
        {
            var start = self.options.breakBytes + 2 + i;
            frameBuffer.fill(frameData[i], start, start + 1);
        }

        var frameChecksum = (function()
        {
            var sum = frameProtectedIdentifier;

            for(var i = 0; i < frameData.length; ++i)
            {
                sum = (sum + frameData[i]) % 0xff;
            }

            sum = ~sum & 0xff;

            return sum;
        })();

        var start = self.options.breakBytes + 2 + frameData.length;
        frameBuffer.fill(frameChecksum, start, start + 1);
    }else
    {
        frameBuffer = new Buffer(self.options.breakBytes + 2);
    }

    frameBuffer.fill(0, 0, self.options.breakBytes)
    frameBuffer.fill(frameSyncByte, self.options.breakBytes, self.options.breakBytes + 1);
    frameBuffer.fill(frameProtectedIdentifier, self.options.breakBytes + 1, self.options.breakBytes + 2);

    // console.log(frameSyncByte);
    // console.log(frameProtectedIdentifier);
    // console.log(frameData);
    // console.log(frameChecksum);

    self.serialPort.write(frameBuffer, function() {});

    var buf = [];
    for(var i = 0; i < frameBuffer.length; ++i)
    {
        buf.push(frameBuffer[i]);
    }
    console.log('W: ' + buf);
}

module.exports = LINMaster;
