import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NgbTabChangeEvent, NgbTabset } from '@ng-bootstrap/ng-bootstrap';
import { BehaviorSubject, Subscription } from 'rxjs';
import { ModelAndSelection, SubRoutingHackService } from '../../services/subRoutingHackService';
import { ModelService } from '../../services/modelService';
import { ConfigServiceWrapper, ModelServiceWrapper } from '../../ajs-upgraded-providers';
import { Model } from '../../entities/model';
import { NotificationModal } from '../common/notificationModal';
import { EditingGuard, EditorContainer, View } from './modelControllerService';
import { ConfirmationModal } from '../common/confirmationModal';
import { modalCancelHandler } from '../../utils/angular';
import { LanguageService } from '../../services/languageService';
import { InteractiveHelp } from '../../help/contract';
import { HelpProvider } from '../common/helpProvider';
import { ModelPageHelpService } from '../../help/providers/modelPageHelpService';
import { HelpService } from '../../help/providers/helpService';
import { Config } from '../../entities/config';
import { MessagingService } from '../../services/messaging-service';
import { UserService } from 'yti-common-ui/services/user.service';
import { Url } from '../../entities/uri';

@Component({
  selector: 'app-model-main',
  styleUrls: ['./modelMain.scss'],
  templateUrl: './modelMain.html',
  providers: [
    SubRoutingHackService
  ]
})
export class ModelMainComponent implements OnDestroy, OnInit, EditorContainer, EditingGuard, HelpProvider {
  @ViewChild('tabs') tabs: NgbTabset;

  model?: Model;
  loadingModelPrefix?: string;
  currentModelAndSelection = new BehaviorSubject<ModelAndSelection>(new ModelAndSelection());
  editorContainer: EditorContainer;
  namespacesInUse: Set<string> = new Set<string>();
  helps: InteractiveHelp[];
  private registeredEditingViews: View[] = [];
  private modelService: ModelService;
  private subscriptions: Subscription[] = [];
  config: Config;
  isMessagingEnabled: boolean;
  isLoggedIn: boolean;
  hasSubscription: boolean | undefined = undefined;

  constructor(private subRoutingService: SubRoutingHackService, modelServiceWrapper: ModelServiceWrapper,
              private notificationModal: NotificationModal, private confirmationModal: ConfirmationModal,
              private languageService: LanguageService, private modelPageHelpService: ModelPageHelpService,
              private helpService: HelpService,
              private configServiceWrapper: ConfigServiceWrapper,
              private messagingService: MessagingService,
              private userService: UserService) {
    this.modelService = modelServiceWrapper.modelService;
    this.editorContainer = this;
  }

  ngOnInit(): void {
    this.helpService.registerProvider(this);
    this.subRoutingService.setGuard(this);

    this.isLoggedIn = this.userService.isLoggedIn();

    this.subscriptions.push(this.languageService.language$.subscribe(uiLanguage => {
      this.setHelps();
    }));

    this.subscriptions.push(this.subRoutingService.currentSelection.subscribe(selection => {
      if (selection.modelPrefix) {
        if (this.model && this.model.prefix === selection.modelPrefix) {
          this.loadingModelPrefix = undefined;
          const oldModelAndSelection = this.currentModelAndSelection.getValue();
          const newModelAndSelection = ModelAndSelection.fromModelAndRoute(this.model, selection);
          if (!oldModelAndSelection.equals(newModelAndSelection)) {
            this.currentModelAndSelection.next(newModelAndSelection);
          }
        } else {
          this.loadingModelPrefix = selection.modelPrefix;
          // TODO: Is this "clear while waiting" a good thing to do? Would it be better to hold onto the old one until loading succeeds?
          this.model = undefined;
          if (this.currentModelAndSelection.getValue().model) {
            this.currentModelAndSelection.next(new ModelAndSelection());
          }
          this.modelService.getModelByPrefix(selection.modelPrefix).then(model => {
            if (this.loadingModelPrefix === model.prefix) {
              this.loadingModelPrefix = undefined;
              this.model = model;
              this.getConfigAndSubscription();
              const newestSelection = this.subRoutingService.currentSelection.getValue();
              if (newestSelection.modelPrefix === model.prefix) {
                const oldModelAndSelection = this.currentModelAndSelection.getValue();
                const newModelAndSelection = ModelAndSelection.fromModelAndRoute(model, newestSelection);
                if (!oldModelAndSelection.equals(newModelAndSelection)) {
                  this.currentModelAndSelection.next(newModelAndSelection);
                  this.setHelps();
                }
              } else {
                // Really weird, on the brink of "cannot happen", as this.loadingModelPrefix should match selection subject quite closely.
                console.error('Model "' + model.prefix + '" was loaded according to the plan, but selection does not match: "' + newestSelection.modelPrefix + '"');
              }
            } else {
              // Ignore the result, the selection was changed again before earlier one was fetched.
            }
          }).catch(reason => {
            console.error('Model loading failed: ' + reason);
            this.notificationModal.openModelNotFound();
          });
        }
      } else {
        this.loadingModelPrefix = undefined;
        this.model = undefined;
        if (this.currentModelAndSelection.getValue().model) {
          this.currentModelAndSelection.next(new ModelAndSelection());
        }
      }
    }));
  }

  ngOnDestroy(): void {
    this.helpService.unregisterProvider(this);
    this.subRoutingService.unsetGuard(this);
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  onTabChange(event: NgbTabChangeEvent) {
    const editing = this.editingViews();
    if (editing.length) {
      event.preventDefault();
      this.confirmationModal.openEditInProgress().then(() => {
        editing.forEach(view => view.cancelEditing());
        this.tabs.select(event.nextId);
      }, modalCancelHandler);
    }
  }

  onModelUpdated(model: Model) {
    if (model.prefix === (this.model && this.model!.prefix)) {
      this.model = model;
      this.currentModelAndSelection.next(this.currentModelAndSelection.value.copyWithUpdatedModel(model));
    } else {
      console.error('Got model updated alert for model "' + model.prefix + '" although current model is "' + this.model ? this.model!.prefix : 'undefined' + '"');
    }
  }

  onModelDeleted(model: Model) {
    this.subRoutingService.navigateToRoot();
  }

  onSubSelection(selection: { resourceCurie?: string, propertyId?: string }) {
    if (this.model) {
      this.subRoutingService.navigateTo(this.model.prefix, selection.resourceCurie, selection.propertyId);
    }
  }

  getConfigAndSubscription() {
    this.configServiceWrapper.configService.getConfig().then(config => {
      this.config = config;
      this.isMessagingEnabled = config.isMessagingEnabled;
      if (this.isMessagingEnabled && this.userService.isLoggedIn()) {
        this.getSubscription();
      }
    });
  }

  changeHasSubscription(enabled: boolean) {
    this.hasSubscription = enabled;
  }

  getSubscription() {
    if (this.model && this.hasSubscription === undefined && this.model.namespace) {
      const uri: string = this.stripHashTagFromEndOfUrl(this.model.namespace);
      this.messagingService.getSubscription(uri).subscribe(resource => {
        if (resource) {
          this.hasSubscription = true;
        } else {
          this.hasSubscription = false;
        }
      });
    } else {
      this.hasSubscription = false;
    }
  }

  stripHashTagFromEndOfUrl(url: Url): string {

    const uri = url.toString();

    if (uri.endsWith('#')) {
      return uri.substr(0, uri.length - 1);
    }
    return uri.toString();
  }

  // TODO: Getting these from ModelPageComponent makes no sense, except for the historical reasons. Maybe the
  //       classes and predicates should also be ModelMainComponent's responsibility.
  onNamespacesChange(namespacesInUse: Set<string>) {
    this.namespacesInUse = namespacesInUse;
  }

  registerView(view: View): void {
    this.registeredEditingViews.push(view);
  }

  deregisterView(view: View): void {
    const index: number = this.registeredEditingViews.indexOf(view);
    if (index >= 0) {
      this.registeredEditingViews.splice(index, 1);
    } else {
      console.error('Deregistering unknown editing view. Ignoring.');
    }
  }

  editingViews(): View[] {
    return this.registeredEditingViews.filter(view => view.isEditing())
  }

  attemptRouteChange(delay: () => void, proceed: () => void): void {
    const editing = this.editingViews();
    if (editing.length) {
      delay();
      this.confirmationModal.openEditInProgress().then(() => {
        editing.forEach(view => view.cancelEditing());
        proceed();
      }, modalCancelHandler);
    }
  }

  private setHelps() {
    this.helps = this.model ? this.modelPageHelpService.getHelps(this.model.normalizedType, this.model.prefix, this.languageService.UILanguage) : [];
  }
}
