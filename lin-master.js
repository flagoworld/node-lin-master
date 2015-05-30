var async = require('async');
var _ = require('lodash');
var SerialPort = require('serialport');

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
        baudrate: 200,
        break_bytes: 2
    });

    this.byte_time = MSEC_SEC / this.options.baudrate * 8;
    this.break_time = this.byte_time * this.options.break_bytes;
    this.frame_bytes = this.options.break_bytes + 1 + 8 + 1; // break + sync + data + checksum
    this.frame_time = this.byte_time * this.frame_bytes * 1.4; // spec says to give 40% padding
    this.serialPort = null;
    this.interval = null;
    this.schedule = [];
    this.currentFrame = 0;
}

LINMaster.prototype.start = function(callback)
{
    var self = this;

    // var parserDelimiter = [];
    //
    // for(var i = 0; i < self.options.break_bytes; ++i)
    // {
    //     parserDelimiter.push(0);
    // }
    //
    this.serialPort = new SerialPort.SerialPort(this.options.serialPort,
    {
        baudrate: self.options.baudrate,
        platformOptions:
        {
            vmin: 1,
            vtime: 0
        },
        // parser: function(emitter, buffer) { console.log(buffer.toString('hex')); emitter.emit('data', buffer); }
    });

    this.serialPort.on('open', function()
    {
        callback();

        self.interval = setInterval(function()
        {
            self.nextFrame();
        }, self.frame_time);
    });

    this.serialPort.on('data', function(data)
    {
        self.respond(data);
    });
}

LINMaster.prototype.addFrame = function(frame)
{
    this.schedule.push(frame);
}

LINMaster.prototype.nextFrame = function()
{
    var self = this;

    if(!self.schedule.length)
    {
        return;
    }

    var frame = self.schedule[self.currentFrame];

    self.currentFrame += 1;
    if(self.currentFrame >= self.schedule.length)
    {
        self.currentFrame = 0;
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
        frameBuffer = new Buffer(self.options.break_bytes + 3 + frameData.length);

        for(var i = 0; i < frameData.length; ++i)
        {
            var start = self.options.break_bytes + 2 + i;
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

        var start = self.options.break_bytes + 2 + frameData.length;
        frameBuffer.fill(frameChecksum, start, start + 1);
    }else
    {
        frameBuffer = new Buffer(self.options.break_bytes + 2);
    }

    frameBuffer.fill(0, 0, self.options.break_bytes)
    frameBuffer.fill(frameSyncByte, self.options.break_bytes, self.options.break_bytes + 1);
    frameBuffer.fill(frameProtectedIdentifier, self.options.break_bytes + 1, self.options.break_bytes + 2);

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

LINMaster.prototype.respond = function(data)
{
    var frame = this.schedule[this.currentFrame];

    frame.handleResponse(data);
}

module.exports = LINMaster;
