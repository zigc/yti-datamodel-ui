import * as angular from 'angular';

// TODO: Remove angular-sanitize when front page is upgraded to Angular X.
export const module = angular.module('iow.components', ['iow.services', require('angular-sanitize')]);
