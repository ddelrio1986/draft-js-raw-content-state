import { EditorState, genKey, convertFromRaw } from 'draft-js';

/**
 * Helper library for manipulating raw contentStates, the intention is to
 * reduce the boilerplate code being generated by the native draft-js API.
 * which makes testing way easier and more enjoyable.
 * Don't forget to call RawContentState with the `new` keyword to set the constructor.
 * @param rawContentState
 * @constructor
 */

// tested
export const RawContentState = function (rawContentState) {
  this.selection = {};
  this.entityMap = {};
  this.blocks = [];
  if (rawContentState) {
    this.blocks = rawContentState.blocks;
    this.entityMap = rawContentState.entityMap;
  }
};

// tested
RawContentState.prototype.addBlock = function (text = '', type = 'unstyled', data = {}) {
  const block = {
    key: genKey(),
    text,
    type,
    depth: 0,
    inlineStyleRanges: [],
    entityRanges: [],
    data,
  };

  this.blocks.push(block);

  return this;
};

// tested
RawContentState.prototype.addEntity = function (entityData = {}, entityOffset, entityLength) {
  const data = entityData.data || {};
  const type = entityData.type || 'DEFAULT_TYPE';
  const mutability = entityData.motability || 'MUTABLE';

  if ((entityOffset !== 0 && !entityOffset) || !entityLength) {
    console.log(
      `Entity will be applied to the whole block because
       no entityOffset or entityLength where provided.`
    );
  }
  const blockLength = this.blocks.length;
  const entityKey = Object.keys(this.entityMap).length;

  // new entity to be added to the entityMap
  const newEntity = { [entityKey]: { data, type, mutability } };

  // new entity to be added to the block
  const entityRange = {
    key: entityKey,
    offset: entityOffset || 0,
    length: entityLength || this.blocks[blockLength - 1].text.length,
  };

  this.entityMap = { ...this.entityMap, ...newEntity };
  this.blocks[blockLength - 1].entityRanges.push(entityRange);

  return this;
};

RawContentState.prototype.anchorKey = function (offset = 0) {
  const length = this.blocks.length;
  if (length) {
    this.selection.anchorKey = this.blocks[length - 1].key;
    this.selection.anchorOffset = offset;
  }

  return this;
};

RawContentState.prototype.focusKey = function (offset = 0) {
  const length = this.blocks.length;
  if (length) {
    this.selection.focusKey = this.blocks[length - 1].key;
    this.selection.focusOffset = offset;
  }

  return this;
};

RawContentState.prototype.collapse = function (offset = 0) {
  const length = this.blocks.length;
  if (length) {
    this.selection = {
      focusKey: this.blocks[length - 1].key,
      anchorKey: this.blocks[length - 1].key,
      focusOffset: offset,
      anchorOffset: offset,
    };
  }

  return this;
};

// tested
RawContentState.prototype.setData = function (data) {
  const length = this.blocks.length;
  if (length) {
    this.blocks[length - 1].data = data;
  }

  return this;
};

//tested
RawContentState.prototype.setDepth = function (depth) {
  const length = this.blocks.length;
  if (length) {
    this.blocks[length - 1].depth = depth;
  }

  return this;
};

// do not test
RawContentState.prototype.log = function () {
  console.log(JSON.stringify(this.selection, null, 2));
  console.log(JSON.stringify(this, null, 2));

  return this;
};

/**
 * Generates a draft-js ContentState
 * ContentState API reference:
 * https://draftjs.org/docs/api-reference-content-state.html#content
 * @returns {ContentState}
 */
// tested
RawContentState.prototype.toContentState = function () {
  return convertFromRaw({ entityMap: this.entityMap, blocks: this.blocks });
};

/**
 * Generates the draft-js EditorState
 * editorState API reference:
 * https://draftjs.org/docs/api-reference-editor-state.html#content
 * @returns {EditorState}
 */
// tested
RawContentState.prototype.toEditorState = function (decorator) {
  const editorState = EditorState.createWithContent(
    this.toContentState({ entityMap: this.entityMap, blocks: this.blocks }),
    decorator
  );
  const selection = editorState.getSelection().merge(this.selection);

  return EditorState.acceptSelection(editorState, selection);
};

export default RawContentState;
