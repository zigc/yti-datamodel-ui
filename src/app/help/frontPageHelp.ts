import { InteractiveHelp } from './contract';

// function createNewModel(type: KnownModelType, gettextCatalog: gettextCatalog): StoryLine {
//   return {
//     title: `Guide through creating new ${type}`,
//     description: `Guide through creating new ${type} description`,
//     items: () => [
//       selectGroup,
//       ...(type === 'profile' ? GroupPage.createNewProfileItems(gettextCatalog) : GroupPage.createNewLibraryItems(gettextCatalog)),
//       GroupPage.finishedCreateNewModelNotification(type)
//     ]
//   };
// }

// FIXME TODO
export class FrontPageHelpService {

  // /* @ngInject */
  // constructor(private $uibModalStack: IModalStackService, private $location: ILocationService, private gettextCatalog: gettextCatalog) {
  // }

  // private returnToFrontPage() {
  //   this.$uibModalStack.dismissAll();
  //   this.$location.url('/');
  // }

  getHelps(): InteractiveHelp[] {
    return [
      // createHelpWithDefaultHandler(createNewModel('library', this.gettextCatalog), this.returnToFrontPage.bind(this)),
      // createHelpWithDefaultHandler(createNewModel('profile', this.gettextCatalog), this.returnToFrontPage.bind(this))
    ];
  }
}
