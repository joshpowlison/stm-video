import UserPanel from '/shared/userPanel.js';
import Typeforward from "../../shared/typeforward.js";
import {Utility} from "../../shared/utility.js";

export default class ModuleUserPanel extends UserPanel {
	async generate(panel) {
		let moduleFolder = 'Video';
		
		// TODO: Get these paths another way.
		let modulePath = '../../modules/' + moduleFolder;
		
		//let settings = await UserPanel.LoadSettings(panel.name);
		
		let fragment = document.createDocumentFragment();
		
		// TODO: Make this logic shared with something in the video folder
		let items = Utility.getAllPaths(module.globalSettings.fileStructure.userData.Video, [ 'mp4', 'webm', 'avi' ]);
		let l = items.length;
		
		let elementGroup = document.createElement('div');
		elementGroup.className = 'row';
	
		// Create a section for just selecting a video
		let typeforward = await Typeforward.Create(items, elementGroup);
		
		let playButtonEl = document.createElement('button');
		playButtonEl.innerHTML = 'Play';
		playButtonEl.addEventListener('click', () => {
			// TODO: Hoist
			module.F('Video.Play', typeforward.value);
		});
		elementGroup.appendChild(playButtonEl);
	
		fragment.appendChild(elementGroup);
		
		//fragment.appendChild(await UserPanel.CreateSettingsBlock(panel, modulePath + '/settingsInputs.json'));
		
		return fragment;
	}
}