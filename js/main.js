import { MenuHandler } from './menuHandler.js';

const view = document.getElementById('view');
const menu = new MenuHandler(view);
menu.init();