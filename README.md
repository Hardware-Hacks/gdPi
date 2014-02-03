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

**`power`** (type: boolean) Turn the GoPro on or off.  
`true`: turns the GoPro on  
`false`: turns it off  

**`record`** (type: boolean) Start or stop recording.  
`true`: start recording  
`false`: stop recording

**`preview`** (type: boolean) We're not quite sure what this does. It doesn't enable or disable the preview.  
`true`: ?  
`false`: ?

**`mode`** (type: string) Change the GoPro's mode.  
`video`  
`photo`  
`burst`  
`timer`  
`settings`  

**`orientation`** (type: string) Change the orientation of the picture.  
`up`: right side up  
`down`: upside down  

**`vidres`** (type: string) Change the recorded video resolution.  
`WVGA`  
`720p`  
`960p`  
`1080p`  
`1440p`  
`2.7K`  
`2.7KCin`: 2.7K Cinematic  
`4K`  
`4KCin`: 4K Cinematic 

**`fov`** (type: string) Change the field of view. Doesn't work on GoPro Hero 3+.  
`wide`  
`medium`  
`narrow`  

**`picres`** (type: string) Change the still photo resolution.  
`11mp-wide`  
`8mp-medium`  
`5mp-wide`  
`5mp-medium`  

**`timer`** (type: float) Change the timer length in seconds.  
`0.5`  
`1`  
`2`  
`5`  
`10`  
`30`  
`60`  

**`locate`** (type: boolean) Beep incessantly in order to find a GoPro.  
`true`: start beeping  
`false`: stop beeping

**`bipvol`** (type: integer) Change the volume of the GoPro's beep in percentage.  
`0`  
`70`  
`100`  

#### Status

[goDog]: https://github.com/FrontRush/goDog
