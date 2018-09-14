import { TextFilterComponent } from './textFilter';
import { ContentFilterComponent } from './contentFilter';
import { ModelFilterComponent } from './modelFilter';
import { ProfileFilterComponent } from './profileFilter';
import { ExcludedFilterComponent } from './excludedFilter';
import { TypeFilterComponent } from './typeFilter';
import { TypesFilterComponent } from './typesFilter';

import { componentDeclaration } from 'app/utils/angular';
import { module as mod } from './module';
export { module } from './module';

mod.component('textFilter', componentDeclaration(TextFilterComponent));
mod.component('contentFilter', componentDeclaration(ContentFilterComponent));
mod.component('modelFilter', componentDeclaration(ModelFilterComponent));
mod.component('profileFilter', componentDeclaration(ProfileFilterComponent));
mod.component('excludedFilter', componentDeclaration(ExcludedFilterComponent));
mod.component('typeFilter', componentDeclaration(TypeFilterComponent));
mod.component('typesFilter', componentDeclaration(TypesFilterComponent));
