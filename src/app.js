require('babel-polyfill');
window.jQuery = require('jquery');
require('typeahead.js-browserify').loadjQueryPlugin();

const angular = require('angular');

require('angular-gettext');
require('./vendor/angular-xeditable-0.1.8/js/xeditable');

angular.module('iow-ui', [
  require('angular-route'),
  require('angular-ui-bootstrap'),
  'gettext',
  'xeditable',
  require('./components/common'),
  require('./components/filter'),
  require('./components/form'),
  require('./components/group'),
  require('./components/modal'),
  require('./components/model'),
  require('./components/navigation'),
  require('./services')
])
.config(function mainConfig($routeProvider) {
  $routeProvider
    .when('/', {
      template: require('./components/index.html')
    })
    .when('/groups', {
      template: require('./components/group/group.html'),
      controller: 'groupController',
      controllerAs: 'ctrl',
      resolve: {
        groupId($route) {
          return $route.current.params.urn;
        }
      }
    })
    .when('/models', {
      template: require('./components/model/model.html'),
      controller: 'modelController',
      controllerAs: 'ctrl',
      reloadOnSearch: false,
      resolve: {
        newModel($route) {
          const params = $route.current.params;
          return {label: params.label, prefix: params.prefix, groupId: params.group};
        },
        existingModelId($route) {
          return $route.current.params.urn;
        },
        selected($route) {
          'ngInject';
          for (const type of ['attribute', 'class', 'association']) {
            const id = $route.current.params[type];
            if (id) {
              return {type, id};
            }
          }
        }
      }
    });
})
.run(function onAppRun($rootScope, $q, editableOptions, languageService, userService, gettextCatalog) {
  editableOptions.theme = 'bs3';

  const languageChanged = new Promise(resolve => {
    const deregister = $rootScope.$on('gettextLanguageChanged', () => {
      resolve();
      deregister();
    });
  });

  $q.all([languageChanged, userService.updateLogin()]).then(() => $rootScope.applicationInitialized = true);

  gettextCatalog.debug = true;
  languageService.setLanguage('fi');
})
.controller('AppCtrl', function mainAppCtrl($scope, $location) {

});
