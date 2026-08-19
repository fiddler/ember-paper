/* eslint-disable ember/no-settled-after-test-helper, prettier/prettier, qunit/no-assert-logical-expression, qunit/require-expect */
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, settled, click, findAll, triggerKeyEvent, waitUntil } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | paper-menu', function(hooks) {
  setupRenderingTest(hooks);

  test('opens on click', async function(assert) {
    assert.expect(1);
    await render(hbs`
      <PaperMenu as |menu|>
        <menu.trigger>
          <PaperButton @iconButton={{true}}>
            {{paper-icon "local_phone"}}
          </PaperButton>
        </menu.trigger>
        <menu.content @width={{4}} as |content|>
          <content.menu-item>
            <span id="menu-item">Test</span>
          </content.menu-item>
        </menu.content>
      </PaperMenu>
    `);

    await settled();
    await click('.ember-basic-dropdown-trigger');
    await settled();
    assert.dom('.md-open-menu-container').exists({ count: 1 });
    await settled();

  });

  test('opens with all items disabled', async function(assert) {
    assert.expect(1);
    await render(hbs`
      <PaperMenu as |menu|>
        <menu.trigger>
          <PaperButton @iconButton={{true}}>
            {{paper-icon "local_phone"}}
          </PaperButton>
        </menu.trigger>
        <menu.content @width={{4}} as |content|>
          <content.menu-item @disabled={{true}}>
            <span id="menu-item">Test</span>
          </content.menu-item>
        </menu.content>
      </PaperMenu>
    `);

    await settled();
    await click('.ember-basic-dropdown-trigger');
    await settled();
    assert.dom('.md-open-menu-container').exists({ count: 1 });
    await settled();

  });

  test('backdrop removed if menu closed', async function(assert) {
    assert.expect(2);
    await render(hbs`
      <PaperMenu as |menu|>
        <menu.trigger>
          <PaperButton @iconButton={{true}}>
            {{paper-icon "local_phone"}}
          </PaperButton>
        </menu.trigger>
        <menu.content @width={{4}} as |content|>
            <content.menu-item>
              <span id="menu-item">Test</span>
            </content.menu-item>
        </menu.content>
      </PaperMenu>
    `);

    await settled();
    await click('.ember-basic-dropdown-trigger');
    await settled();
    assert.dom('.md-open-menu-container').exists({ count: 1 });
    await click('.ember-basic-dropdown-trigger');
    await settled();
    assert.dom('.md-backdrop').doesNotExist();

  });

  test('backdrop removed if backdrop clicked', async function(assert) {
    assert.expect(2);
    await render(hbs`
      <PaperMenu as |menu|>
        <menu.trigger>
          <PaperButton @iconButton={{true}}>
            {{paper-icon "local_phone"}}
          </PaperButton>
        </menu.trigger>
        <menu.content @width={{4}} as |content|>
          <content.menu-item>
            <span id="menu-item">Test</span>
          </content.menu-item>
        </menu.content>
      </PaperMenu>
    `);

    await settled();
    await click('.ember-basic-dropdown-trigger');
    await settled();
    assert.dom('.md-open-menu-container').exists({ count: 1 });
    await click('md-backdrop');
    await settled();
    assert.dom('.md-backdrop').doesNotExist();

  });

  test('leave animation clone is inert and always removed', async function(assert) {
    assert.expect(3);
    await render(hbs`
      <PaperMenu as |menu|>
        <menu.trigger>
          <PaperButton @iconButton={{true}}>
            {{paper-icon "local_phone"}}
          </PaperButton>
        </menu.trigger>
        <menu.content @width={{4}} as |content|>
          <content.menu-item>
            <span id="menu-item">Test</span>
          </content.menu-item>
        </menu.content>
      </PaperMenu>
    `);

    await settled();
    await click('.ember-basic-dropdown-trigger');
    await settled();
    assert.dom('.md-open-menu-container').exists({ count: 1 });

    await click('.ember-basic-dropdown-trigger');

    // While it fades out the clone still covers the menu's box, so it must not
    // take clicks — otherwise it swallows every click over that area.
    let clone = document.querySelector('[id$="--clone"]');
    assert.ok(
      !clone || window.getComputedStyle(clone).pointerEvents === 'none',
      'leave-animation clone does not capture pointer events'
    );

    // Firefox resolves the clone's style only after `md-leave` is added, so no
    // transition runs and `transitionend` never fires. The clone must still go.
    await waitUntil(() => !document.querySelector('[id$="--clone"]'), { timeout: 2000 });
    assert.dom('[id$="--clone"]').doesNotExist();
  });

  test('keydown changes focused element', async function(assert) {
    assert.expect(3);

    this.openSomething = () => {};

    await render(hbs`
      <PaperMenu as |menu|>
        <menu.trigger>
          <PaperButton @iconButton={{true}}>
            {{paper-icon "local_phone"}}
          </PaperButton>
        </menu.trigger>
        <menu.content @width={{4}} as |content|>
            <content.menu-item @onClick={{this.openSomething}}>
              <span id="menu-item">Test</span>
            </content.menu-item>
            <content.menu-item @onClick={{this.openSomething}}>
              <span id="menu-item2">Test 2</span>
            </content.menu-item>
        </menu.content>
      </PaperMenu>
    `);

    await settled();
    await click('.ember-basic-dropdown-trigger');
    await settled();

    let selectors = findAll('md-menu-item');
    assert.dom(selectors[0].firstElementChild).hasClass('md-focused');

    let menu = findAll('md-menu-content');
    await triggerKeyEvent(menu[0].firstElementChild, 'keydown', 40);

    await settled();

    let first = selectors[0].firstElementChild;
    let second = selectors[1].firstElementChild;

    assert.ok(second.classList.contains('md-focused') && !first.classList.contains('md-focused'), 'focus has changed to second item');

    await triggerKeyEvent(selectors[1].firstElementChild, 'keydown', 38);

    await settled();

    first = selectors[0].firstElementChild;
    second = selectors[1].firstElementChild;

    assert.ok(!second.classList.contains('md-focused') && first.classList.contains('md-focused'), 'focus has changed to first item');
  });

  test('md-menu doesn\'t have a tabindex attribute', async function(assert) {
    await render(hbs`
      <PaperMenu as |menu|>
        <menu.trigger>
          <PaperButton @iconButton={{true}}>
            {{paper-icon "local_phone"}}
          </PaperButton>
        </menu.trigger>
        <menu.content @width={{4}} as |content|>
            <content.menu-item @onClick={{this.openSomething}}>
              <span id="menu-item">Test</span>
            </content.menu-item>
            <content.menu-item @onClick={{this.openSomething}}>
              <span id="menu-item2">Test 2</span>
            </content.menu-item>
        </menu.content>
      </PaperMenu>
    `);
    assert.dom('md-menu').hasAttribute('tabindex', '-1');
  });
});
