import { module as mod } from './module';
export { module } from './module'
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
import { ButtonWithOptions } from './buttonWithOptions';
import { ClipboardComponent } from './clipboard';
import { ExportComponent } from './export';
import { FloatDirective } from './float';
import { HighlightComponent, HighlightFilter } from './highlight';
import { HistoryComponent } from './history';
import { ParagraphizeComponent, ParagraphizeFilter } from './paragraphize';
import { KeyControlDirective, KeyControlSelectionDirective } from './keyControl';
import { ModalTemplateComponent } from './modalTemplate';
import { SearchResultsComponent, SearchResultTranscludeDirective } from './searchResults';
import { UsageComponent } from './usage';
import { UsagePanelComponent } from './usagePanel';
import { ContextMenuDirective } from './ngContextMenu';

import { registerComponent, registerDirective, registerFilter } from 'app/utils/angular';
import { NgIfBodyDirective } from './ngIfBody';

registerComponent(mod, AccordionComponent);
registerComponent(mod, AccordionGroupComponent);
registerDirective(mod, AccordionTranscludeDirective);
registerComponent(mod, AccordionChevronComponent);
registerComponent(mod, ButtonWithOptions);
registerComponent(mod, ClipboardComponent);
registerComponent(mod, ExportComponent);
registerDirective(mod, FloatDirective);
registerComponent(mod, HighlightComponent);
registerFilter(mod, HighlightFilter);
registerComponent(mod, ParagraphizeComponent);
registerFilter(mod, ParagraphizeFilter);
registerComponent(mod, HistoryComponent);
registerDirective(mod, KeyControlDirective);
registerDirective(mod, KeyControlSelectionDirective);
registerComponent(mod, ModalTemplateComponent);
registerComponent(mod, SearchResultsComponent);
registerDirective(mod, SearchResultTranscludeDirective);
registerComponent(mod, UsageComponent);
registerComponent(mod, UsagePanelComponent);
registerDirective(mod, ContextMenuDirective);
registerDirective(mod, NgIfBodyDirective);

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
