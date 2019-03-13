import * as angular from 'angular';
import { animate, auto, ICompileProvider, ILocationProvider, ILogProvider } from 'angular';
import { ITooltipProvider } from 'angular-ui-bootstrap';
import { routeConfig } from './routes';
import { module as commonModule } from './components/common';
import { module as editorModule } from './components/editor';
import { module as visualizationModule } from './components/visualization';
import { module as formModule } from './components/form';
import { module as modelModule } from './components/model';
import { module as navigationModule } from './components/navigation';
import { module as userModule } from './components/user';
import { module as informationModule } from './components/information';
import { module as filterModule } from './components/filter';
import { module as componentsModule } from './components';
import { module as servicesModule } from './services';
import { module as helpModule } from './help';
import { BrowserModule } from '@angular/platform-browser';
import { downgradeComponent, downgradeInjectable, UpgradeModule } from '@angular/upgrade/static';
import { NgModule, NgZone } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { YtiCommonModule } from 'yti-common-ui';
import { AUTHENTICATED_USER_ENDPOINT } from 'yti-common-ui/services/user.service';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import {
  MissingTranslationHandler,
  MissingTranslationHandlerParams,
  TranslateLoader,
  TranslateModule,
  TranslateService
} from '@ngx-translate/core';
import { of } from 'rxjs';
import { availableUILanguages } from './types/language';

import { LoginModalService } from 'yti-common-ui/components/login-modal.component';
import { FooterComponent } from 'yti-common-ui/components/footer.component';
import { LOCALIZER } from 'yti-common-ui/pipes/translate-value.pipe';
import { Localizer as AngularLocalizer } from 'yti-common-ui/types/localization';
import { DefaultAngularLocalizer, LanguageService } from './services/languageService';
import { MenuComponent } from 'yti-common-ui/components/menu.component';
import { AjaxLoadingIndicatorComponent } from 'yti-common-ui/components/ajax-loading-indicator.component';
import { AjaxLoadingIndicatorSmallComponent } from 'yti-common-ui/components/ajax-loading-indicator-small.component';
import { FilterDropdownComponent } from 'yti-common-ui/components/filter-dropdown.component';
import { StatusComponent } from 'yti-common-ui/components/status.component';
import { DropdownComponent } from 'yti-common-ui/components/dropdown.component';
import { UseContextDropdownComponent } from './components/model/use-context-dropdown.component';
import { UseContextInputComponent } from './components/form/use-context-input.component';
import { HttpClientModule } from '@angular/common/http';
import { apiEndpointWithName } from 'app/services/config';
import { ExpandableTextComponent } from 'yti-common-ui/components/expandable-text.component';
import { ModelMainComponent } from './components/model/modelMain';
import {
  confirmationModalProvider,
  locationServiceProvider,
  modelServiceProvider,
  notificationModalProvider,
  routeServiceProvider,
  scopeProvider
} from './ajs-upgraded-providers';
import { ExportDirective, ModelLanguageChooserDirective, ModelPageDirective, ModelViewDirective } from './ajs-upgraded-components';
import IInjectorService = auto.IInjectorService;
import IAnimateProvider = animate.IAnimateProvider;

require('angular-gettext');
require('checklist-model');
require('ngclipboard');

function removeEmptyValues(obj: {}) {

  const result: any = {};

  for (const [key, value] of Object.entries(obj)) {
    if (!!value) {
      result[key] = value;
    }
  }

  return result;
}

export const localizationStrings: { [key: string]: { [key: string]: string } } = {};

for (const language of availableUILanguages) {
  localizationStrings[language] = {
    ...removeEmptyValues(JSON.parse(require(`raw-loader!po-loader?format=mf!../../po/${language}.po`))),
    ...removeEmptyValues(JSON.parse(require(`raw-loader!po-loader?format=mf!yti-common-ui/po/${language}.po`)))
  };
}

Object.freeze(localizationStrings);

export function resolveAuthenticatedUserEndpoint() {
  return apiEndpointWithName('user');
}

export function createTranslateLoader(): TranslateLoader {
  return {
    getTranslation: (lang: string) => {
      return of(localizationStrings[lang])
    }
  };
}

export function createMissingTranslationHandler(): MissingTranslationHandler {
  return {
    handle: (params: MissingTranslationHandlerParams) => {
      if (params.translateService.currentLang === 'en') {
        return params.key;
      } else {
        return '[MISSING]: ' + params.key;
      }
    }
  };
}

export function languageServiceFactory(injector: IInjectorService): LanguageService {
  return injector.get<LanguageService>('languageService');
}

export function localizerFactory(languageService: LanguageService): AngularLocalizer {
  return new DefaultAngularLocalizer(languageService);
}

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    UpgradeModule,
    YtiCommonModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader
      },
      missingTranslationHandler: { provide: MissingTranslationHandler, useFactory: createMissingTranslationHandler }
    }),
    NgbModule.forRoot(),
  ],
  declarations: [
    UseContextDropdownComponent,
    UseContextInputComponent,
    ModelMainComponent,
    ModelPageDirective,
    ModelViewDirective,
    ModelLanguageChooserDirective,
    ExportDirective
  ],
  entryComponents: [
    FooterComponent,
    MenuComponent,
    AjaxLoadingIndicatorComponent,
    AjaxLoadingIndicatorSmallComponent,
    DropdownComponent,
    FilterDropdownComponent,
    ExpandableTextComponent,
    StatusComponent,
    UseContextDropdownComponent,
    UseContextInputComponent,
    ModelMainComponent
  ],
  providers: [
    { provide: AUTHENTICATED_USER_ENDPOINT, useFactory: resolveAuthenticatedUserEndpoint },
    {
      provide: LanguageService,
      useFactory: languageServiceFactory,
      deps: ['$injector']
    },
    {
      provide: LOCALIZER,
      useFactory: localizerFactory,
      deps: [LanguageService]
    },
    scopeProvider,
    routeServiceProvider,
    locationServiceProvider,
    modelServiceProvider,
    notificationModalProvider,
    confirmationModalProvider
  ]
})
export class AppModule {

  constructor(private upgrade: UpgradeModule) {
  }

  ngDoBootstrap() {
    this.upgrade.bootstrap(document.body, ['iow-ui'], { strictDi: true });
  }
}

const mod = angular.module('iow-ui', [
  require('angular-animate'),
  require('angular-messages'),
  require('angular-route'),
  require('ui-bootstrap4'),
  'gettext',
  'checklist-model',
  'ngclipboard',
  commonModule.name,
  editorModule.name,
  visualizationModule.name,
  formModule.name,
  modelModule.name,
  navigationModule.name,
  userModule.name,
  informationModule.name,
  filterModule.name,
  componentsModule.name,
  servicesModule.name,
  helpModule.name
]);

mod.directive('appMenu', downgradeComponent({ component: MenuComponent }));
mod.directive('appFooter', downgradeComponent({
  component: FooterComponent,
  inputs: ['title'],
  outputs: ['informationClick']
}));

mod.directive('ajaxLoadingIndicator', downgradeComponent({ component: AjaxLoadingIndicatorComponent }));
mod.directive('ajaxLoadingIndicatorSmall', downgradeComponent({ component: AjaxLoadingIndicatorSmallComponent }));
mod.directive('appDropdown', downgradeComponent({
  component: DropdownComponent,
  inputs: ['options', 'showNullOption', 'placement']
}));
mod.directive('appExpandableText', downgradeComponent({
  component: ExpandableTextComponent,
  inputs: ['text', 'rows']
}));
mod.directive('appFilterDropdown', downgradeComponent({
  component: FilterDropdownComponent,
  inputs: ['options', 'filterSubject']
}));
mod.directive('appStatus', downgradeComponent({
  component: StatusComponent,
  inputs: ['status']
}));
mod.directive('appUseContextInput', downgradeComponent({
  component: UseContextInputComponent,
  inputs: ['editing', 'modelType']
}));

mod.factory('translateService', downgradeInjectable(TranslateService));
mod.factory('loginModal', downgradeInjectable(LoginModalService));
mod.factory('localizationStrings', () => localizationStrings);
mod.factory('zone', downgradeInjectable(NgZone));

mod.config(routeConfig);

mod.config(($locationProvider: ILocationProvider,
            $logProvider: ILogProvider,
            $compileProvider: ICompileProvider,
            $animateProvider: IAnimateProvider,
            $uibTooltipProvider: ITooltipProvider) => {
  'ngInject';
  $locationProvider.html5Mode(true);
  $logProvider.debugEnabled(false);

  $compileProvider.aHrefSanitizationWhitelist(/^\s*(|blob|https?|mailto):/);

  // enable angular-animate framework when 'ng-animate-enabled' class is added to animated element
  $animateProvider.classNameFilter(/ng-animate-enabled/);

  $uibTooltipProvider.options({ appendToBody: true });
  $uibTooltipProvider.setTriggers({ 'mouseenter': 'mouseleave click' });
});


mod.run((gettextCatalog: any) => {

  gettextCatalog.debug = true;

  for (const language of availableUILanguages) {
    gettextCatalog.setStrings(language, localizationStrings[language]);
  }
});
