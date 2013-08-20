## Priority 1 ##

	* Each square has: encounterProbability, zombieStrength, humanStrength, infectChance, spreadChance (8 index array for the virus itself to adjacent squares)
		+ zombieStrength and humanStrength should be directly comparable
		+ subset of humans and zombies that encounter each other fight, infectChance takes effect for every zombie that "wins the fight". Other zombies that 
			win just kill their opponent. Humans that win always kill the zombie
			
	* Do every square for each module at once, as opposed to every module for each square to reduce function calls from 30000n to n


## Priority 2 ##

	* Make resistance kill zombies.

	* Button for toggling mouseover debug in console

	* Add human strongholds in later stages of panic.


## Priority 3 ##
	
	* Make floaty icons/text for when zombies are killed or perhaps for when humans are killed/converted!
		+ Also only show the icons above a threshold of whatever is happening, like LoL healing

	* Button for clicking on a square to debug it

	* Add functionality to genes to affect other adjacent genes

	* Add tutorial function that overlays graphics and removes them on triggers


## Priority 4 ##

	* Adjust population based on latitude (points closer to poles have less area per point)

	* Try to change the __proto__ in the webworker copy to something a bit less ghetto

	* Speed up the generator web worker by not copying a billion element array

	* Add a preview grid to evolution menu so player can see


## Priority 5 ##

	* Make values for defining land color smoothly shift from one data square to the other - i.e. as it moves left 1.00,0.00 0.75,0.25 0.50,0.50 0.25,0.75 for 4x4 texture pixels per data, same for down

	* Fix land being at zero moisture for horse latitudes, no mixing or mixing of identically dry squares or something

	* Combine bars near the poles so that bars are approximately evenly distributed

## Notes ##

	Two styles of zombies, one where humans die and resurrect as zombies, one where humans get infected and turn  
	Burning bodies only effective against former. for example






Stirling's approximation and probability distribution - INTEGRAL OF (2/sqrt(2*pi*100))*e^(-x^2/(2*100)) where 100 is # steps, x is probability of landing on that spot

prob = 1-erf(n/sqrt(2N)) where N is steps and n is where you want to end up going past