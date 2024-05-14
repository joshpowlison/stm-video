const moduleFunctions = {
	"loadSettings": loadSettings,
	"videoPlay": videoPlay,
	"videoStop": videoStop,
	"videoSetTransitionType": setTransitionType,
	"videoEnableLooping": videoEnableLooping,
	"videoDisableLooping": videoDisableLooping,
	"logAllOptions": logAllOptions,
	"onInput": onInput,
};

module.LoadModule(moduleFunctions);

var items = [];
var clipPath	= 'assets';

var transitionDuration = 0;
var generalTransitionDuration = 0.25;

var isLooping = false;

var main = document.querySelector('main');
var container = document;

var videos = [];
var lastZIndex = 0;

async function setTransitionType(name, event)
{
	if(event === 'cut')
		transitionDuration = 0;
	else
		transitionDuration = generalTransitionDuration;
	
	document.body.className = event;
}

async function createVideoPlayer(videoPath)
{
	var video = document.createElement('video');
	video.width = 1920;
	video.height = 1080;

	video.addEventListener('ended', videoOnEnded);
	video.addEventListener('timeupdate', videoOnTimeUpdate);
	video.className = 'hide';
	video.preload = 'auto';
	video.style.zIndex = lastZIndex; // Makes the latest video appear on top, always
	lastZIndex ++;
	video.loop = isLooping;
	video.autoplay = true;
	video.src = clipPath + '/' + videoPath;

	main.appendChild(video);

	videos.push(video);

	// If the video could not be transparent
	var isBlocking = !/\.(?:webm|avi)$/.test(videoPath);
	if(isBlocking)
	{
		// Set whether or not the video can be seen behind- if it's opaque,
		// add a black background so that it fully blocks the screen
		video.classList.add('video-opaque');
		
		// We only set transitions on blocking videos;
		// transparent ones cover the screen completely
		video.style.transitionDuration = transitionDuration + 's';
	}

	return video;
}

async function videoStop(name, event)
{
	for(var i = 0; i < videos.length; i ++)
		stopClip(videos[i]);
}

async function loadSettings(name, event)
{
	//setLooping(s.loop);
	//setTransition(s.transitionType);
	items = Utility.getAllPaths(module.settings.global.fileStructure.modules.Video[clipPath]);
}

async function stopClip(video)
{
	if(video == null)
		return;
	
	// Ignore all this if we've already hidden this video
	if(video.classList.contains('hide'))
		return;

	// Remove from the list if we need to
	var i = videos.indexOf(video);
	if(i !== -1)
		videos.splice(i,1);
	
	video.classList.add('hide');

	var msWait = transitionDuration * 1000;
	await Utility.wait(msWait);

	// Remove the old clip
	video.remove();
}

async function videoEnableLooping(name, event)
{
	setLooping(true);
}

async function videoDisableLooping(name, event)
{
	setLooping(false);
}

async function videoPlay(name, event)
{
	var videoPath = Utility.getMatchingFileInList(items, event);
	if(videoPath == null)
	{
		module.F('Console.LogError', 'No Video named "' + JSON.stringify(event) + '" found.');
		return;
	}

	// Create a new video, add it onto our list
	createVideoPlayer(videoPath);
}

function videoOnTimeUpdate(event)
{
	// oncanplaythrough proved to be unreliable, sometimes creating
	// flickering between videos when we trusted that it actually
	// COULD play through and wouldn't flicker; but ontimeupdate,
	// and checking the current time to make sure we're past 0,
	// has worked without fail.
	
	// It hasn't progressed at all, meaning it hasn't loaded at all yet- let it continue first
	if(this.currentTime <= 0)
		return;

	// Unhide on time progressing, the clip is ready!
	if(this.classList.contains('hide'))
		this.classList.remove('hide');
	
	// Otherwise, if we have a transition type, transition early for a smoother transition
	var timeLeft = this.duration - this.currentTime;

	// If we're not looping, and we're set to transition out
	if(!this.loop && timeLeft < transitionDuration)
		stopClip(this);
	
	// Update all previous vids
	for(var i = 1; i < videos.length; i ++)
	{
		let video = videos[0];

		// If WE'RE the video that's first... skip this
		if(video === this)
			break;
		
		// Disable looping on all previous videos
		if(video.loop)
			video.loop = false;
		
		// If the previous video is opaque, transition it out
		// WE WILL STOP PREVIOUS CLIPS WHEN LOOPING IS ENABLED.
		// Only the TOPMOST video will loop.
		if(video.classList.contains('video-opaque'))
		{
			// Stop the previous video immediately on cut
			if(transitionDuration === 0)
			{
				stopClip(video);
			}
			// Don't transition out the previous video immediately;
			// allow its transition to end, for smooth transition
			// between clips
			else
			{
				var msWait = Math.round(transitionDuration * 1000);
				setTimeout(() => stopClip(video), msWait);
			}
		}
	}
}

async function onInput(name, event)
{
	var isWithinScene = module.IsGlobalPositionWithinScene(
		event.cursorX,
		event.cursorY
	);

	if(!isWithinScene)
		return;

	// On left clicking, hide the video
	// Backspace or delete pressed
	if(
		(event.keyCode === 8 && event.state === 0)
		|| (event.keyCode === 46 && event.state === 0)
	)
	{
		stopAllVideos();
	}
}

function videoOnEnded(event)
{
	stopClip(event.target);
}

async function logAllOptions(name, event)
{
	var publicLog = '';
	var regexGet = /\/(.+)\.[^.]+$/;
	var trackNames = [];

	// Get clean names for videos, add them in
	for(var i = 0, l = items.length; i < l; i ++)
	{
		var displayName = regexGet.exec(items[i])[1];
		trackNames.push(displayName);
	}

	// Add in all clean animation names as well
	var availableAnimations = module.settings.global.fileStructure.modules.Animation.save.assets;

	var animationNames = Object.keys(availableAnimations);
	for(var i = 0, l = animationNames.length; i < l; i ++)
		trackNames.push(animationNames[i]);

	// Compile them all into one sorted log
	trackNames.sort();
	for(var i = 0, l = trackNames.length; i < l; i ++)
	{
		if(i > 0)
			publicLog += '|';

		publicLog += '"' + trackNames[i] + '"';
	}

	console.log(publicLog);
}

function setLooping(value)
{
	// Set our global setting for this
	isLooping = value;

	// Update JUST last video in the list for looping, if there is one
	var videoToLoop = videos.length - 1;
	if(videoToLoop !== -1)
		videos[videoToLoop].loop = value;
}