import { LegacyComponent } from 'app/utils/angular';

@LegacyComponent({
  bindings: {
    error: '='
  },
  template: require('./errorPanel.html')
})
export class ErrorPanelComponent {
}
