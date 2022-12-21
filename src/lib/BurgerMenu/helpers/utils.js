// @ts-nocheck
import { afterUpdate, onDestroy } from 'svelte';

export const pxToNum = val => parseInt(val.slice(0, -2), 10);

/*
    useEffect(() => {

    }, () => []);
*/
export const useEffect = (cb, deps) => {
	let cleanup;

	function apply() {
		if (cleanup) cleanup();
		cleanup = cb();
	}

	if (deps) {
		let values = [];
		afterUpdate(() => {
			const new_values = deps();
			if (new_values.some((value, i) => value !== values[i])) {
				apply();
				values = new_values;
			}
		});
	} else {
		// no deps = always run
		afterUpdate(apply);
	}

	onDestroy(() => {
		if (cleanup) cleanup();
	});
};

export const styleToString = (style) => {
    return Object.keys(style).reduce((acc, key) => (
        acc + key.split(/(?=[A-Z])/).join('-').toLowerCase() + ':' + style[key] + ';'
    ), '');
};