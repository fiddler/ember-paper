/**
 * Maps a rendered <form> element back to its `paper-form` component so that
 * validation children (paper-input / paper-select / paper-autocomplete)
 * rendered inside a form WITHOUT an explicit `parentComponent` can find and
 * register with it (see ValidationMixin#attachToNearestForm).
 *
 * This replaces the pre-Ember-4 ChildMixin view-tree traversal
 * (`nearestOfType`), which relied on parentView APIs removed in Ember 4.
 * DOM ancestry is equivalent for forms: a paper-form renders a real <form>
 * element that wraps its fields.
 */
export default new WeakMap();
