# node-lin-master
Node.js LIN Master Node

LIN, or Local Interconnect Network, is a serial communication protocol standard in modern automobiles. This project aims to implement LIN in Node.js. 

As of now, Unconditional frames are supported and underlying support for Event Triggered and Sporadic frames is in-progress. Configuration and diagnostic functionality is being researched and will be implemented soon.

In its current state, communication has been successfully tested from a Raspberry Pi through LIN to another bus on the network.

Eventually I will package this up as an installable node module, but for now this is going to contain all the code I write for my personal project that requires LIN. That is, my endeavor to integrate a RPi touch screen and LIN backed components into my 1974 BMW 2002.
