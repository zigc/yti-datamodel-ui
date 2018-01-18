import * as jQuery from 'jquery';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

import 'font-awesome/scss/font-awesome.scss';
import './styles/styles.scss';

require('./vendor/modernizr');
require('imports-loader?define=>false!jquery-mousewheel/jquery.mousewheel')(jQuery);

export const done = platformBrowserDynamic().bootstrapModule(AppModule);
