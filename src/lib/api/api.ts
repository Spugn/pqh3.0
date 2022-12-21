import _data from './data.min.json';
import type { Data } from './api.d';

import character from './character.api';
import constants from './constants.api';
import equipment from './equipment.api';
import inventory from './inventory.api';
import project from './project.api';
import quest from './quest.api';
import recipe from './recipe.api';
import user from './user.api';

const data : Data = _data;

export {
    data,
    character,
    constants,
    equipment,
    inventory,
    project,
    quest,
    recipe,
    user,
};