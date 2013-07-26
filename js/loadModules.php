<?php
header('Content-Type: application/javascript');
$load_modules = explode(',',$_GET['modules']);

$debug = "
	if(debug.console)
		if(debug.console.watchModules(arguments[0])[this.id])
			debugger;";

if(is_dir('modules') && !empty($_GET['modules'])) {

	chdir('modules');
	$dir = opendir('.');

	echo "var SimulatorModules = {};\n";

	while (($file = readdir($dir)) !== false) {
		$module_name = preg_replace('/(.+?)(\.[^.]*$|$)/','$1',$file);
		if (is_file($file)) {
			// Add debugger script
			echo 'SimulatorModules[\'' . $module_name . '\'] = ' . preg_replace("/(new\s+Module.* {)/","$1 $debug", file_get_contents($file)) . ";\n";
		}
	}
	echo "Simulator.prototype.loadModules=function(){";

	for($i = 0; $i < count($load_modules); $i++) {
		echo "this.addModule('{$load_modules[$i]}',SimulatorModules);";
	}

	echo "delete SimulatorModules;";
	echo "}";
}
?>