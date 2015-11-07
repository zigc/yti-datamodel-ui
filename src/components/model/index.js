const name = 'iow.components.model';
const mod = angular.module(name, []);
module.exports = name;

mod.controller('modelController', require('./modelController'));

mod.directive('modelView', require('./modelView'));
mod.directive('referencesView', require('./referencesView'));
mod.directive('requiresView', require('./requiresView'));
mod.directive('selectionView', require('./selectionView'));
mod.directive('classForm', require('./classForm'));
mod.directive('predicateForm', require('./predicateForm'));
mod.directive('propertyView', require('./propertyView'));

mod.directive('propertyPredicateView', require('./propertyPredicateView'));
mod.factory('searchPredicateModal', require('./searchPredicateModalFactory'));
mod.factory('searchClassModal', require('./searchClassModalFactory'));
mod.factory('searchConceptModal', require('./searchConceptModalFactory'));
mod.factory('searchSchemeModal', require('./searchSchemeModalFactory'));

