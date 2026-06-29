import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const appModule = require('../dist/server.cjs');
export default appModule.default || appModule;
