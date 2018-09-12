import * as jQuery from 'jquery';
import 'angular';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

require('./vendor/modernizr');
require('imports-loader?define=>false!jquery-mousewheel/jquery.mousewheel')(jQuery);

export const done = platformBrowserDynamic().bootstrapModule(AppModule);
