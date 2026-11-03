import html from '../public/index.html';
import css from '../public/styles.css';
import js from '../public/app.js';
import profileStore from '../public/profile-store.js';
import theme from '../public/theme.js';
import {companyLogoAssets} from './logo-assets.mjs';
import {handle} from './app.mjs';
const assets={...companyLogoAssets,'/theme.js':{body:theme,type:'text/javascript; charset=utf-8'},'/index.html':{body:html,type:'text/html; charset=utf-8'},'/styles.css':{body:css,type:'text/css; charset=utf-8'},'/app.js':{body:js,type:'text/javascript; charset=utf-8'},'/profile-store.js':{body:profileStore,type:'text/javascript; charset=utf-8'}};
export default {fetch:(request,env)=>handle(request,env,assets)};
