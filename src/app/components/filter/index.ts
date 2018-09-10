import { TextFilterComponent } from './textFilter';
import { ContentFilterComponent } from './contentFilter';
import { ModelFilterComponent } from './modelFilter';
import { ProfileFilterComponent } from './profileFilter';
import { ExcludedFilterComponent } from './excludedFilter';
import { TypeFilterComponent } from './typeFilter';
import { TypesFilterComponent } from './typesFilter';

import { registerComponent } from 'app/utils/angular';
import { module as mod } from './module';
export { module } from './module';

registerComponent(mod, TextFilterComponent);
registerComponent(mod, ContentFilterComponent);
registerComponent(mod, ModelFilterComponent);
registerComponent(mod, ProfileFilterComponent);
registerComponent(mod, ExcludedFilterComponent);
registerComponent(mod, TypeFilterComponent);
registerComponent(mod, TypesFilterComponent);
