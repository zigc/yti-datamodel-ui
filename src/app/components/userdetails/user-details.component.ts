import { Component, OnInit, ViewChild } from '@angular/core';
import { UserService } from 'yti-common-ui/services/user.service';
import { NgbTabChangeEvent, NgbTabset } from '@ng-bootstrap/ng-bootstrap';
import { BehaviorSubject } from 'rxjs';
import { MessagingResource } from '../../entities-messaging/messaging-resource';
import { MessagingService } from '../../services/messaging-service';
import { ConfigServiceWrapper, DatamodelLocationServiceWrapper } from '../../ajs-upgraded-providers';
import { Config } from '../../entities/config';

@Component({
  selector: 'app-user-details',
  styleUrls: ['./user-details.component.scss'],
  templateUrl: './user-details.component.html',
})
export class UserDetailsComponent implements OnInit {

  @ViewChild('tabSet') tabSet: NgbTabset;

  APPLICATION_CODELIST = 'codelist';
  APPLICATION_TERMINOLOGY = 'terminology';
  APPLICATION_DATAMODEL = 'datamodel';
  APPLICATION_COMMENTS = 'comments';

  loading = true;

  config: Config;

  messagingResources$ = new BehaviorSubject<Map<string, MessagingResource[]> | null>(null);

  constructor(private userService: UserService,
              private datamodelLocationServiceWrapper: DatamodelLocationServiceWrapper,
              private messagingService: MessagingService,
              private configServiceWrapper: ConfigServiceWrapper) {

    datamodelLocationServiceWrapper.locationService.atUser();
  }

  ngOnInit() {

    this.configServiceWrapper.configService.getConfig()
      .then(config => {
        this.config = config;

        if (this.config.isMessagingEnabled && !this.userService.user.anonymous) {
          this.getUserSubscriptionData();
        } else {
          this.loading = false;
        }
      });
  }

  getUserSubscriptionData() {

    this.loading = true;

    this.messagingService.getMessagingUserData().subscribe(messagingUserData => {
      this.loading = false;

      if (messagingUserData) {
        const resources = new Map<string, MessagingResource[]>();
        const codelistMessagingResources: MessagingResource[] = [];
        const datamodelMessagingResources: MessagingResource[] = [];
        const terminologyMessagingResources: MessagingResource[] = [];
        const commentsMessagingResources: MessagingResource[] = [];

        messagingUserData.resources.forEach(resource => {
          if (resource.application === this.APPLICATION_CODELIST) {
            codelistMessagingResources.push(resource);
          } else if (resource.application === this.APPLICATION_DATAMODEL) {
            datamodelMessagingResources.push(resource);
          } else if (resource.application === this.APPLICATION_TERMINOLOGY) {
            terminologyMessagingResources.push(resource);
          } else if (resource.application === this.APPLICATION_COMMENTS) {
            commentsMessagingResources.push(resource);
          }
        });
        if (codelistMessagingResources.length > 0) {
          resources.set(this.APPLICATION_CODELIST, codelistMessagingResources);
        }
        if (datamodelMessagingResources.length > 0) {
          resources.set(this.APPLICATION_DATAMODEL, datamodelMessagingResources);
        }
        if (terminologyMessagingResources.length > 0) {
          resources.set(this.APPLICATION_TERMINOLOGY, terminologyMessagingResources);
        }
        if (commentsMessagingResources.length > 0) {
          resources.set(this.APPLICATION_COMMENTS, commentsMessagingResources);
        }
        if (resources.size > 0) {
          this.messagingResources = resources;
        } else {
          this.messagingResources = null;
        }
      } else {
        this.messagingResources = null;
      }
    });
  }

  onTabChange(event: NgbTabChangeEvent) {

    if (event.nextId === 'user_details_info_tab') {
      this.getUserSubscriptionData();
    }
  }

  get messagingResources(): Map<string, MessagingResource[]> | null {

    return this.messagingResources$.getValue();
  }

  set messagingResources(value: Map<string, MessagingResource[]> | null) {

    this.messagingResources$.next(value);
  }
}
