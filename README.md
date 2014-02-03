# gdPi

## What the heck *is* this thing?

gdPi is an intermediate Node.js server made for Raspberry Pi for handling communication between a GoPro Hero 3+ and a desktop computer running the [goDog] web interface. The GoPro's API is undocumented and obscure, so we opened it up, using the hard work of other open source APIs, as well as some original reverse engineering.

## What you get

+ A simple REST API
+ Control and monitor your GoPro Hero 3+ while connected to your home's Wi-Fi
+ Control multiple GoPros with [goDog]
+ View the GoPro's preview video stream

## How to use it

First, [set up a Raspberry Pi with two Wi-Fi adapters](http://www.processthings.com/post/66023171876/how-to-connect-your-raspberry-pi-to-two-wi-fi-networks). Then, clone this repository onto the Raspberry Pi, and install its dependencies with NPM. Start the server by running `node app.js`. Make sure your GoPro's Wi-Fi is on, and that the Raspberry Pi is connected to it on one of its interfaces. Optionally, install [goDog] on a desktop computer, and go from there. Or, you can use...

### The API

Using the API, you can either grab the status of the GoPro in `jsonp`, or send commands to it. Sending commands will also return the full status of the GoPro. Whatever you decide to do, you must authenticate using the GoPro's password in the `password` HTTP parameter. By default, the server runs on port 8080. The format of a command request is this:

    http://192.168.1.3:8080/:command/:parameter?password=:password
    
Above, `:command` corresponds to a command, `:parameter` is its parameter, and `:password` is the GoPro's password. Pretty simple stuff.

#### Commands

**`power`**: Turn the GoPro on or off.  
parameter: boolean  
`true`: turns the GoPro on  
`false`: turns it off  

**`record`**: Start or stop recording.  
parameter: boolean  
`true`: start recording  
`false`: stop recording

**`preview`**: We're not quite sure. It doesn't enable or disable the preview.  
parameter: boolean  
`true`: ?  
`false`: ?

**`mode`**: Change the GoPro's mode.  
parameter: string  
`video`: Change to video mode  
`photo`: Change to photo mode  
`burst`: Change to burst mode  
`timer`: Change to timer mode  
`settings`: Change to settings mode  

**`record`**: Start or stop recording.  
parameter: boolean  
`true`: start recording  
`false`: stop recording

**`record`**: Start or stop recording.  
parameter: boolean  
`true`: start recording  
`false`: stop recording

**`record`**: Start or stop recording.  
parameter: boolean  
`true`: start recording  
`false`: stop recording

**`record`**: Start or stop recording.  
parameter: boolean  
`true`: start recording  
`false`: stop recording

**`record`**: Start or stop recording.  
parameter: boolean  
`true`: start recording  
`false`: stop recording

**`record`**: Start or stop recording.  
parameter: boolean  
`true`: start recording  
`false`: stop recording

**`record`**: Start or stop recording.  
parameter: boolean  
`true`: start recording  
`false`: stop recording

#### Status

[goDog]: https://github.com/FrontRush/goDog
