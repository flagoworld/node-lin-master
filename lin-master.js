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
        break_bits: 13,
        response_time: 20,
    });

    this.bit_time = MSEC_SEC / this.options.baudrate;
    this.break_time = this.bit_time * this.options.break_bits
    this.frame_time = this.bit_time * (this.options.break_bits + this.options.response_time + (8 * 11)); // without break bits, there are max 11 octets in a frame
    this.serialPort = null;
    this.interval = null;
    this.schedule = [];
    this.currentFrame = 0;
}

LINMaster.prototype.start = function(callback)
{
    var self = this;

    this.serialPort = new SerialPort.SerialPort(this.options.serialPort,
    {
        baudrate: self.options.baudrate
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
        frameBuffer = new Buffer(3 + frameData.length);

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

        for(var i = 0; i < frameData.length; ++i)
        {
            frameBuffer.fill(frameData[i], 2 + i);
        }

        frameBuffer.fill(frameChecksum, 2 + frameData.length);
    }else
    {
        frameBuffer = new Buffer(2);
    }

    frameBuffer.fill(frameSyncByte, 0);
    frameBuffer.fill(frameProtectedIdentifier, 1);

    // console.log(frameSyncByte);
    // console.log(frameProtectedIdentifier);
    // console.log(frameData);
    // console.log(frameChecksum);
    console.log('W: ' + frameBuffer.toString('hex'));

    async.series(
    [
        // BREAK
        function(cb)
        {
            self.serialPort.set({brk:false}, function()
            {
                setTimeout(function()
                {
                    self.serialPort.set({brk:false}, function() {cb();});
                }, self.break_time);
            });
        },

        // PACKET
        function(cb)
        {
            self.serialPort.write(frameBuffer, function() {cb();});
        }
    ], function() {});
}

LINMaster.prototype.respond = function(data)
{
    var frame = this.schedule[0];

    frame.handleResponse(data);
}

module.exports = LINMaster;
