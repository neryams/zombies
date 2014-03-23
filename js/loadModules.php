<?php
error_reporting(-1);
header('Content-Type: application/javascript');
$load_modules = explode(',',$_GET['modules']);

/* Add debug breakpoint to all modules. 
	Also, store the first argument as a local var for use by the value function. */
$inject = '
	if(debugMenu.active)
		if(debugMenu.console.watchModules(arguments[0])[this.id])
			debugger;';


if(is_dir('modules') && !empty($_GET['modules'])) {
	echo "var SimulatorModules = {},exports = {};\n";

	function insert_modules($path, $prepend_name) {
		chdir($path);
		$dir = opendir('.');

		while (($file = readdir($dir)) !== false) {
			$module_name = preg_replace('/(.+?)(\.[^.]*$|$)/','$1',$file);
			if(!empty($prepend_name))
				$module_name = $prepend_name . '.' . $module_name;

			if (is_file($file)) {
				echo file_get_contents($file);
				echo "SimulatorModules['$module_name'] = new Module(exports.type,exports.run,exports.options);\n";
			}
			if (is_dir($file) && $file != '.' && $file != '..') {
				insert_modules($file, $module_name);
			}
		}

		closedir($dir);
		chdir('../');
	}

	insert_modules('modules', '');

	echo "Simulator.prototype.loadModules=function(){";

	for($i = 0; $i < count($load_modules); $i++) {
		echo "this.addModule('{$load_modules[$i]}',SimulatorModules);";
	}

	echo "delete SimulatorModules;";
	echo "}";
}
?>