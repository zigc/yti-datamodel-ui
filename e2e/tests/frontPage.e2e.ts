/// <reference types="protractor" />
/// <reference types="jasmine" />

import { FrontPage } from '../pages/frontPage.po';

describe('Front page', () => {

  let page: FrontPage;

  beforeEach(() => page = FrontPage.navigate());

  it('should have a title', () => {
    expect(page.title).toBe('IOW');
  });

  it('should have a footer', () => {
    expect(page.footer.isPresent()).toBe(true);
  });

});
