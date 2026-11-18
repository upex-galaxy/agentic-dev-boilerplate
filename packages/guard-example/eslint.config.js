import antfu from '@antfu/eslint-config';

import { BASE_ESLINT_OPTIONS, GUARD_RULES, GUARD_SHAPE } from '../../eslint.config.base.js';

export default antfu({ ...BASE_ESLINT_OPTIONS, typescript: true }, GUARD_RULES, GUARD_SHAPE);
