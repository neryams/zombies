## Priority 1 ##
			
	* Change DataPoints to have a datapointset class that uses arraybuffers DataView in the datapoints and provides get/write functions.

## Priority 2 ##



## Priority 3 ##
	
	* Do every square for each module at once, as opposed to every module for each square to reduce function calls from 30000n to n

	* Button for toggling mouseover debug in console

	* Add human strongholds in later stages of panic.

## Priority 4 ##

	* Make floaty icons/text for when zombies are killed or perhaps for when humans are killed/converted!
		+ Also only show the icons above a threshold of whatever is happening, like LoL healing

	* Button for clicking on a square to debug it

	* Add functionality to genes to affect other adjacent genes

	* Add tutorial function that overlays graphics and removes them on triggers

	* Adjust population based on latitude (points closer to poles have less area per point)

	* Add a preview grid to evolution menu so player can see


## Priority 5 ##

	* Make values for defining land color smoothly shift from one data square to the other - i.e. as it moves left 1.00,0.00 0.75,0.25 0.50,0.50 0.25,0.75 for 4x4 texture pixels per data, same for down

	* Fix land being at zero moisture for horse latitudes, no mixing or mixing of identically dry squares or something

	* Combine bars near the poles so that bars are approximately evenly distributed

## Notes ##

	Two styles of zombies, one where humans die and resurrect as zombies, one where humans get infected and turn  
	Burning bodies only effective against former. for example

	For multiplayer:
		Humans play a dwarf fortress style game where they get attacked by waves of zombies (controlled by a real player)!