import { ISCEService } from 'angular';
import { gettextCatalog as GettextCatalog } from 'angular-gettext';
import { Moment } from 'moment';
import { ConfirmationModal } from './confirmationModal';
import { DeleteConfirmationModal } from './deleteConfirmationModal';
import { HistoryModal } from './historyModal';
import { NotificationModal } from './notificationModal';
import { HelpSelectionModal } from './helpSelectionModal';
import { LanguageService } from 'app/services/languageService';
import { LanguageContext } from 'app/types/language';
import { OverlayService } from './overlay';
import { upperCaseFirst } from 'change-case';
import { Localizable } from 'yti-common-ui/types/localization';
import { AccordionComponent, AccordionGroupComponent, AccordionTranscludeDirective } from './accordion';
import { AccordionChevronComponent } from './accordionChevron';
import { ButtonWithOptionsComponent } from './buttonWithOptions';
import { ClipboardComponent } from './clipboard';
import { ExportComponent } from './export';
import { FloatDirective } from './float';
import { HighlightComponent, HighlightFilter } from './highlight';
import { HistoryComponent } from './history';
import { ParagraphizeComponent, ParagraphizeFilter } from './paragraphize';
import { KeyControlDirective, KeyControlSelectionDirective } from './keyControl';
import { SearchResultsComponent, SearchResultTranscludeDirective } from './searchResults';
import { UsageComponent } from './usage';
import { UsagePanelComponent } from './usagePanel';
import { ContextMenuDirective } from './ngContextMenu';
import { NgIfBodyDirective } from './ngIfBody';

import { componentDeclaration, directiveDeclaration } from 'app/utils/angular';
import { module as mod } from './module';
import { ModelActionMenuComponent } from './modelActionMenu';
export { module } from './module'

mod.component('accordion', componentDeclaration(AccordionComponent));
mod.component('accordionGroup', componentDeclaration(AccordionGroupComponent));
mod.directive('accordionTransclude', AccordionTranscludeDirective);
mod.component('accordionChevron', componentDeclaration(AccordionChevronComponent));
mod.component('buttonWithOptions', componentDeclaration(ButtonWithOptionsComponent));
mod.component('clipboard', componentDeclaration(ClipboardComponent));
mod.component('export', componentDeclaration(ExportComponent));
mod.component('modelActionMenu', componentDeclaration(ModelActionMenuComponent));
mod.directive('float', directiveDeclaration(FloatDirective));
mod.component('highlight', componentDeclaration(HighlightComponent));
mod.filter('highlight', HighlightFilter);
mod.component('paragraphize', componentDeclaration(ParagraphizeComponent));
mod.filter('paragraphize', ParagraphizeFilter);
mod.component('history', componentDeclaration(HistoryComponent));
mod.directive('keyControl', directiveDeclaration(KeyControlDirective));
mod.directive('keyControlSelection', directiveDeclaration(KeyControlSelectionDirective));
mod.component('searchResults', componentDeclaration(SearchResultsComponent));
mod.directive('searchResultTransclude', SearchResultTranscludeDirective);
mod.component('usage', componentDeclaration(UsageComponent));
mod.component('usagePanel', componentDeclaration(UsagePanelComponent));
mod.directive('ngContextMenu', ContextMenuDirective);
mod.directive('ngIfBody', NgIfBodyDirective);

mod.service('overlayService', OverlayService);
mod.service('confirmationModal', ConfirmationModal);
mod.service('deleteConfirmationModal', DeleteConfirmationModal);
mod.service('historyModal', HistoryModal);
mod.service('notificationModal', NotificationModal);
mod.service('helpSelectionModal', HelpSelectionModal);

mod.filter('translateValue', (languageService: LanguageService) => {
  'ngInject';
  return (input: Localizable, context?: LanguageContext) => input ? languageService.translate(input, context) : '';
});

mod.filter('translateLabel', (translateValueFilter: any) => {
  'ngInject';
  return (input: { label: Localizable }, context?: LanguageContext) => input ? translateValueFilter(input.label, context) : '';
});

mod.filter('capitalize', function() {
  'ngInject';
  return function(input: string) {
    return upperCaseFirst(input);
  };
});

mod.filter('trustAsHtml', ($sce: ISCEService) => {
  'ngInject';
  return (text: string) => $sce.trustAsHtml(text);
});

mod.filter('localizedDate', (gettextCatalog: GettextCatalog) => {
  'ngInject';
  return (moment: Moment) => {
    if (moment) {
      return moment.format(gettextCatalog.getString('date format'));
    } else {
      return null;
    }
  };
});
