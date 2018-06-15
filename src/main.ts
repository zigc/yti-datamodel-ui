import * as jQuery from 'jquery';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

import '@fortawesome/fontawesome-free-webfonts/scss/fontawesome.scss';
import '@fortawesome/fontawesome-free-webfonts/scss/fa-solid.scss';

import './styles/styles.scss';

require('./vendor/modernizr');
require('imports-loader?define=>false!jquery-mousewheel/jquery.mousewheel')(jQuery);

export const done = platformBrowserDynamic().bootstrapModule(AppModule);
