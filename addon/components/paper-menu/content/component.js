/* eslint-disable ember/classic-decorator-no-classic-methods, ember/no-classic-components, ember/no-computed-properties-in-native-classes, prettier/prettier */
import Component from '@ember/component';
import template from './template';

import { action, computed } from '@ember/object';
import { computeTimeout, nextTick } from 'ember-css-transitions/utils/transition-utils';

import { tagName, layout } from '@ember-decorators/component';

import { ESCAPE, LEFT_ARROW, UP_ARROW, RIGHT_ARROW, DOWN_ARROW } from 'ember-paper/utils/key-constants';

import { getOwner } from '@ember/application';
import ebdGetParent from 'ember-paper/utils/ebd-get-parent';

function waitForAnimations(element, callback) {
  let computedStyle = window.getComputedStyle(element);
  if (computedStyle.transitionDuration && computedStyle.transitionDuration !== '0s') {
    let eventCallback = function() {
      element.removeEventListener('transitionend', eventCallback);
      callback();
    };
    element.addEventListener('transitionend', eventCallback);
  } else if (computedStyle.animationName !== 'none' && computedStyle.animationPlayState === 'running') {
    let eventCallback = function() {
      element.removeEventListener('animationend', eventCallback);
      callback();
    };
    element.addEventListener('animationend', eventCallback);
  } else {
    callback();
  }
}

@tagName('')
@layout(template)
class PaperMenuContent extends Component {

  isActive = false;

  @computed('otherStyles', 'isActive')
  get customStyles() {
    if (this.isActive) {
      return {};
    } else {
      return this.otherStyles;
    }
  }

  @computed('destination')
  get destinationElement() {
    return document.getElementById(this.destination);
  }

  @action
  async animateIn() {
    await nextTick();
    // The menu can be torn down inside the `nextTick` gap, and setting a
    // property on a destroyed component throws.
    if (this.isDestroyed || this.isDestroying) {
      return;
    }
    this.set('isActive', true);
  }

  @action
  async animateOut(element) {
    let parentElement = this.renderInPlace ? element.parentElement.parentElement : element.parentElement;

    // workaround for https://github.com/adopted-ember-addons/ember-paper/issues/1151. See also https://github.com/emberjs/ember.js/issues/18795.
    // & https://github.com/adopted-ember-addons/ember-paper/issues/1166
    if (!parentElement) {
      parentElement = ebdGetParent(getOwner(this));
    }

    let clone = element.cloneNode(true);
    clone.id = `${clone.id}--clone`;
    // The clone only exists to play the leave animation. It keeps `md-clickable`
    // (and so `pointer-events: auto`) from the original, which made an invisible
    // copy of the menu swallow every click over its box until the animation ended.
    clone.style.pointerEvents = 'none';
    parentElement.appendChild(clone);

    await nextTick();

    if (!this.isDestroyed) {
      this.set('isActive', false);
      clone.classList.add('md-leave');
      let fallbackTimer;
      let removeClone = function() {
        clearTimeout(fallbackTimer);
        if (clone.parentElement === parentElement) {
          clone.classList.remove('md-active');
          parentElement.removeChild(clone);
        }
      };
      // `transitionend` never fires when the browser resolves the clone's style
      // for the first time only after `md-leave` was added: there is no starting
      // opacity to interpolate from, so no transition runs and the clone would
      // stay in the DOM for the rest of the session. Firefox does this reliably.
      let timeout = computeTimeout(clone);
      if (!isFinite(timeout) || timeout < 0) {
        timeout = 0;
      }
      fallbackTimer = setTimeout(removeClone, timeout + 50);
      waitForAnimations(clone, removeClone);
    } else {
      parentElement.removeChild(clone);
    }
  }

  @action
  focusItem(element) {
    let focusTarget = element.querySelector('.md-menu-focus-target');

    // default to first non disabled item
    if (!focusTarget) {
      let menuItem = element.querySelector('md-menu-item:not([disabled])');
      focusTarget = menuItem && menuItem.firstElementChild;
    }

    if (focusTarget) {
      focusTarget.focus();
    }
  }

  @action
  handleKeyDown(ev) {
    switch (ev.which) {
      case ESCAPE:
        this.dropdown.actions.close();
        break;
      case LEFT_ARROW:
      case UP_ARROW:
        ev.preventDefault();
        this.focusMenuItem(ev, -1);
        break;
      case RIGHT_ARROW:
      case DOWN_ARROW:
        ev.preventDefault();
        this.focusMenuItem(ev, 1);
        break;
    }
  }

  focusMenuItem(e, direction) {
    let focusTarget = e.target.closest('md-menu-item');

    do {
      if (direction > 0) {
        focusTarget = focusTarget.nextElementSibling;
      } else {
        focusTarget = focusTarget.previousElementSibling;
      }
    } while (focusTarget && !isFocusable(focusTarget));

    focusTarget = focusTarget && focusTarget.firstElementChild;

    if (focusTarget) {
      focusTarget.focus();
    }
  }
}

function isFocusable(el) {
  // is a menu-item, doesn't have tabindex -1 and is not disabled
  return el && el.tagName === 'MD-MENU-ITEM' && el.getAttribute('tabindex') !== -1 && el.getAttribute('disabled') === null;
}

export default PaperMenuContent;
