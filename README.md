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

Using the API, you can either grab the status of the GoPro in `jsonp`, or send commands to it. Sending commands will also return the full status of the GoPro. Whatever you decide to do, you must authenticate using the GoPro's password in the `password` HTTP parameter. By default, the server runs on port 8080.

#### Commands

The format of a command request is this:

    http://192.168.1.3:8080/:command/:parameter?password=:password
    
`:command` corresponds to a command, `:parameter` is its parameter, and `:password` is the GoPro's password. Pretty simple stuff.

Below is a list of all the commands and their possible parameter values. Anything not listed below will result in a 404. As of now, an unauthenticated request just returns an empty status object in `jsonp`. Some of the parameters have explanations, and the others should be self-explanatory.

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

In order to grab the status of the GoPro, send a request to gdPi at `/status`, including the password parameter, or send a command, which will return the status in the response body. Status is always returned in a `jsonp` block. The JSON inside of it will look like this:

    {"status": "value", "status": "value", ...}

where `status` is the name of a piece of information, and `value` is its value. Again, it's all pretty straightforward. For the most part, statuses and values match the commands and parameters that set them. The few exceptions and additions are listed below. Some can only possibly have certain predefined values, and those are included. Only string values will be surrounded by quotes; other types will not.

**`batt1`** (type: integer) Battery's remaining charge in percent  

**`batt2`** (type: integer) Battery attachment's remaining charge in percent  

**`fov`** (type: string) Field of view  
`'170'`  
`'127'`  
`'90'`  

**`picres`** (type: string) Resolution of still photos  
`5MP med`  
`7MP med`  
`7MP wide`  
`12MP wide`  

**`secselapsed`** (type: integer) TODO  

**`locating`** (type: boolean) Whether the GoPro is beeping  

**`charging`** (type: boolean) Whether the GoPro is charging  

**`memoryLeft`** (type: float) An estimate of how much memory is left in GB on the GoPro's SD card. This value is based on the GoPro's internal estimate of pictures remaining.  

**`npics`** (type: integer) How many pictures are stored on the GoPro's SD card  

**`minsremaining`** (type: integer) An estimate of how many minutes of video you can shoot with the current settings, based on how much space is left on the GoPro's SD card  

**`nvids`** (type: integer) How many videos are stored on the GoPro's SD card  

**`recording`** (type: boolean) Whether the GoPro is recording  

**`fps`** (type: string) Frames per second of video  
`'12'`  
`'15'`  
`'24'`  
`'25'`  
`'30'`  
`'48'`  
`'50'`  
`'60'`  
`'100'`  
`'120'`  
`'240'`  

[goDog]: https://github.com/FrontRush/goDog
