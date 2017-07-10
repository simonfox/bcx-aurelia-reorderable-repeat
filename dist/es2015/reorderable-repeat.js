var _dec, _dec2, _class, _desc, _value, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4;

function _initDefineProp(target, property, descriptor, context) {
  if (!descriptor) return;
  Object.defineProperty(target, property, {
    enumerable: descriptor.enumerable,
    configurable: descriptor.configurable,
    writable: descriptor.writable,
    value: descriptor.initializer ? descriptor.initializer.call(context) : void 0
  });
}

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) {
  var desc = {};
  Object['ke' + 'ys'](descriptor).forEach(function (key) {
    desc[key] = descriptor[key];
  });
  desc.enumerable = !!desc.enumerable;
  desc.configurable = !!desc.configurable;

  if ('value' in desc || desc.initializer) {
    desc.writable = true;
  }

  desc = decorators.slice().reverse().reduce(function (desc, decorator) {
    return decorator(target, property, desc) || desc;
  }, desc);

  if (context && desc.initializer !== void 0) {
    desc.value = desc.initializer ? desc.initializer.call(context) : void 0;
    desc.initializer = undefined;
  }

  if (desc.initializer === void 0) {
    Object['define' + 'Property'](target, property, desc);
    desc = null;
  }

  return desc;
}

function _initializerWarningHelper(descriptor, context) {
  throw new Error('Decorating class property failed. Please ensure that transform-class-properties is enabled.');
}

import { inject } from 'aurelia-dependency-injection';
import { ObserverLocator, observable, BindingEngine, BindingBehavior, ValueConverter } from 'aurelia-binding';
import { BoundViewFactory, TargetInstruction, ViewSlot, ViewResources, customAttribute, bindable, templateController } from 'aurelia-templating';
import { getItemsSourceExpression, unwrapExpression, isOneTime, updateOneTimeBinding, viewsRequireLifecycle, AbstractRepeater } from 'aurelia-templating-resources';
import { ReorderableRepeatStrategyLocator } from './reorderable-repeat-strategy-locator';
import { DndService } from 'bcx-aurelia-dnd';
import { EventAggregator } from 'aurelia-event-aggregator';
import { TaskQueue } from 'aurelia-task-queue';

let seed = 0;

const classes = function () {
  let cache = {};
  let start = '(?:^|\\s)';
  let end = '(?:\\s|$)';

  function lookupClass(className) {
    let cached = cache[className];
    if (cached) {
      cached.lastIndex = 0;
    } else {
      cache[className] = cached = new RegExp(start + className + end, 'g');
    }
    return cached;
  }

  function addClass(el, className) {
    let current = el.className;
    if (!current.length) {
      el.className = className;
    } else if (!lookupClass(className).test(current)) {
      el.className += ' ' + className;
    }
  }

  function rmClass(el, className) {
    el.className = el.className.replace(lookupClass(className), ' ').trim();
  }
  return { add: addClass, rm: rmClass };
}();

export let ReorderableRepeat = (_dec = customAttribute('reorderable-repeat'), _dec2 = inject(EventAggregator, TaskQueue, BindingEngine, DndService, BoundViewFactory, TargetInstruction, ViewSlot, ViewResources, ObserverLocator, ReorderableRepeatStrategyLocator), _dec(_class = templateController(_class = _dec2(_class = (_class2 = class ReorderableRepeat extends AbstractRepeater {
  constructor(ea, taskQueue, bindingEngine, dndService, viewFactory, instruction, viewSlot, viewResources, observerLocator, strategyLocator) {
    super({
      local: 'item',
      viewsRequireLifecycle: viewsRequireLifecycle(viewFactory)
    });

    _initDefineProp(this, 'items', _descriptor, this);

    _initDefineProp(this, 'local', _descriptor2, this);

    _initDefineProp(this, 'intention', _descriptor3, this);

    _initDefineProp(this, 'patchedItems', _descriptor4, this);

    this.type = 'reorder-' + seed;
    seed += 1;

    this.ea = ea;
    this.taskQueue = taskQueue;
    this.bindingEngine = bindingEngine;
    this.dndService = dndService;
    this.viewFactory = viewFactory;
    this.instruction = instruction;
    this.viewSlot = viewSlot;
    this.lookupFunctions = viewResources.lookupFunctions;
    this.observerLocator = observerLocator;
    this.strategyLocator = strategyLocator;
    this.ignoreMutation = false;
    this.sourceExpression = getItemsSourceExpression(this.instruction, 'reorderable-repeat.for');
    if (this.sourceExpression instanceof BindingBehavior) {
      throw new Error('BindingBehavior is not supported in reorderable-repeat');
    }
    if (this.sourceExpression instanceof ValueConverter) {
      throw new Error('ValueConverter is not supported in reorderable-repeat');
    }
    if (isOneTime(this.sourceExpression)) {
      throw new Error('oneTime binding is not supported in reorderable-repeat');
    }
    this.viewsRequireLifecycle = viewsRequireLifecycle(viewFactory);
  }

  call(context, changes) {
    this[context](this.items, changes);
  }

  bind(bindingContext, overrideContext) {
    this.scope = { bindingContext, overrideContext };
    this.matcherBinding = this._captureAndRemoveMatcherBinding();
    this._subsribers = [this.bindingEngine.collectionObserver(this.items).subscribe(this._itemsMutated.bind(this)), this.ea.subscribe('dnd:willStart', () => {
      this.intention = null;
      this.views().forEach(v => classes.rm(v.firstChild, 'reorderable-repeat-dragging-me'));
    }), this.ea.subscribe('dnd:didEnd', () => {
      this.views().forEach(v => classes.rm(v.firstChild, 'reorderable-repeat-dragging-me'));

      if (!this.intention) return;
      const { fromIndex, toIndex } = this.intention;
      this.intention = null;

      if (fromIndex === toIndex) return;

      const item = this.items[fromIndex];
      this.items.splice(fromIndex, 1);
      this.items.splice(toIndex, 0, item);

      const afterReordering = this._reorderableAfterReorderingFunc();
      if (afterReordering) afterReordering(this.items);
    })];
    this.patchedItems = [...this.items];
    this.patchedItemsChanged();
  }

  unbind() {
    this.scope = null;
    this.items = null;
    this.matcherBinding = null;
    this.viewSlot.removeAll(true);
    this._subsribers.forEach(s => s.dispose());
  }

  intentionChanged(newIntention) {
    if (newIntention) {
      const { fromIndex, toIndex } = newIntention;
      let patched = [...this.items];
      const item = this.items[fromIndex];
      patched.splice(fromIndex, 1);
      patched.splice(toIndex, 0, item);
      this.patchedItems = patched;
    }
  }

  itemsChanged() {
    if (!this.scope) {
      return;
    }

    if (this.intention === null) {
      this.patchedItems = [...this.items];
    } else {
      this.intention = null;
    }
  }

  _itemsMutated() {
    if (this.intention === null) {
      this.patchedItems = [...this.items];
    } else {
      this.intention = null;
    }
  }

  patchedItemsChanged() {
    if (!this.scope) {
      return;
    }

    this.strategy = this.strategyLocator.getStrategy(this.patchedItems);
    if (!this.strategy) {
      throw new Error(`Value for '${this.sourceExpression}' is non-repeatable`);
    }

    this.strategy.instanceChanged(this, this.patchedItems);
  }

  _captureAndRemoveMatcherBinding() {
    if (this.viewFactory.viewFactory) {
      const instructions = this.viewFactory.viewFactory.instructions;
      const instructionIds = Object.keys(instructions);
      for (let i = 0; i < instructionIds.length; i++) {
        const expressions = instructions[instructionIds[i]].expressions;
        if (expressions) {
          for (let ii = 0; i < expressions.length; i++) {
            if (expressions[ii].targetProperty === 'matcher') {
              const matcherBinding = expressions[ii];
              expressions.splice(ii, 1);
              return matcherBinding;
            }
          }
        }
      }
    }

    return undefined;
  }

  viewCount() {
    return this.viewSlot.children.length;
  }
  views() {
    return this.viewSlot.children;
  }
  view(index) {
    return this.viewSlot.children[index];
  }
  matcher() {
    return this.matcherBinding ? this.matcherBinding.sourceExpression.evaluate(this.scope, this.matcherBinding.lookupFunctions) : null;
  }

  addView(bindingContext, overrideContext) {
    let view = this.viewFactory.create();
    window.ttview = view;
    view.bind(bindingContext, overrideContext);
    this.viewSlot.add(view);
    window.ttview = view;
    this._registerDnd(view);
  }

  insertView(index, bindingContext, overrideContext) {
    let view = this.viewFactory.create();
    view.bind(bindingContext, overrideContext);
    this.viewSlot.insert(index, view);
    this._registerDnd(view);
  }

  moveView(sourceIndex, targetIndex) {
    this.viewSlot.move(sourceIndex, targetIndex);
  }

  removeAllViews(returnToCache, skipAnimation) {
    this.views().forEach(view => this._unRegisterDnd(view));
    return this.viewSlot.removeAll(returnToCache, skipAnimation);
  }

  removeViews(viewsToRemove, returnToCache, skipAnimation) {
    viewsToRemove.forEach(view => this._unRegisterDnd(view));
    return this.viewSlot.removeMany(viewsToRemove, returnToCache, skipAnimation);
  }

  removeView(index, returnToCache, skipAnimation) {
    this._unRegisterDnd(this.view(index));
    return this.viewSlot.removeAt(index, returnToCache, skipAnimation);
  }

  updateBindings(view) {
    this._unRegisterDnd(view);

    let j = view.bindings.length;
    while (j--) {
      updateOneTimeBinding(view.bindings[j]);
    }
    j = view.controllers.length;
    while (j--) {
      let k = view.controllers[j].boundProperties.length;
      while (k--) {
        let binding = view.controllers[j].boundProperties[k].binding;
        updateOneTimeBinding(binding);
      }
    }

    this._registerDnd(view);
  }

  _additionalAttribute(view, attribute) {
    return view && view.firstChild && view.firstChild.au && view.firstChild.au[attribute] ? view.firstChild.au[attribute].instruction.attributes[attribute] : undefined;
  }

  _reorderableDirection(view) {
    let attr = this._additionalAttribute(view, 'reorderable-direction');
    if (attr && attr.sourceExpression) {
      attr = attr.sourceExpression.evaluate(this.scope);
    }

    if (typeof attr === 'string') {
      return attr.toLowerCase() || 'down';
    }
    return 'down';
  }

  _dndHandlerSelector(view) {
    let attr = this._additionalAttribute(view, 'reorderable-dnd-handler-selector');
    if (attr && attr.sourceExpression) {
      attr = attr.sourceExpression.evaluate(this.scope);
    }

    if (typeof attr === 'string') {
      return attr;
    }
  }

  _dndPreviewFunc(view) {
    const func = this._additionalAttribute(view, 'reorderable-dnd-preview');

    if (!func) {
      return null;
    } else if (typeof func === 'string') {
      let funcCall = this.scope.overrideContext.bindingContext[func];

      if (typeof funcCall === 'function') {
        return funcCall.bind(this.scope.overrideContext.bindingContext);
      }
      throw new Error("'reorderable-dnd-preview' must be a function or evaluate to one");
    } else if (func.sourceExpression) {
      return (item, scope) => {
        return func.sourceExpression.evaluate(scope);
      };
    } else {
      throw new Error("'reorderable-dnd-preview' must be a function or evaluate to one");
    }
  }

  _reorderableAfterReorderingFunc() {
    const func = this._additionalAttribute(this.view(0), 'reorderable-after-reordering');

    if (!func) {
      return null;
    } else if (typeof func === 'string') {
      let funcCall = this.scope.overrideContext.bindingContext[func];

      if (typeof funcCall === 'function') {
        return funcCall.bind(this.scope.overrideContext.bindingContext);
      }
      throw new Error("'reorderable-after-reordering' must be a function or evaluate to one");
    } else if (func.sourceExpression) {
      return () => func.sourceExpression.evaluate(this.scope);
    } else {
      throw new Error("'reorderable-after-reordering' must be a function or evaluate to one");
    }
  }

  _dndHover(location, item, direction) {
    const { mouseEndAt, targetElementRect } = location;
    const x = mouseEndAt.x - targetElementRect.x;
    const y = mouseEndAt.y - targetElementRect.y;

    let inLeastHalf;

    if (direction === 'left') {
      inLeastHalf = x > targetElementRect.width / 2;
    } else if (direction === 'right') {
      inLeastHalf = x < targetElementRect.width / 2;
    } else if (direction === 'up') {
      inLeastHalf = y > targetElementRect.height / 2;
    } else {
        inLeastHalf = y < targetElementRect.height / 2;
      }

    if (inLeastHalf) {
      this._updateIntention(item, true);
    } else {
      this._updateIntention(item, false);
    }
  }

  _registerDnd(view) {
    const { local } = this;
    const el = view.firstChild;
    const item = view.bindingContext[local];
    const handlerSelector = this._dndHandlerSelector(view);
    let handler;
    if (handlerSelector) {
      handler = view.firstChild.querySelector(handlerSelector);
    }
    const direction = this._reorderableDirection(view);
    const _previewFunc = this._dndPreviewFunc(view);

    this.dndService.addSource({
      dndModel: () => ({ type: this.type, item }),
      dndPreview: _previewFunc && (model => _previewFunc(model.item, view)),
      dndElement: el
    }, handler && { handler });

    this.dndService.addTarget({
      dndElement: el,
      dndCanDrop: model => {
        const canDrop = model.type === this.type && model.item !== item;

        if (model.type === this.type && !canDrop) {
          this.taskQueue.queueMicroTask(() => {
            classes.add(el, 'reorderable-repeat-dragging-me');
          });
        }
        return canDrop;
      },
      dndHover: location => {
        this._dndHover(location, item, direction);
      },
      dndDrop() {}
    });
  }

  _unRegisterDnd(view) {
    classes.rm(view.firstChild, 'reorderable-repeat-dragging-me');
    this.dndService.removeSource(view.firstChild);
    this.dndService.removeTarget(view.firstChild);
  }

  _updateIntention(target, beforeTarget) {
    const { isProcessing, model } = this.dndService;
    if (!isProcessing) return;
    if (model.type !== this.type) return;

    const { patchedItems } = this;
    const targetIndex = patchedItems.indexOf(target);
    if (targetIndex < 0) return;

    let originalIndex;
    let currentIndex;
    let nextIndex;
    if (this.intention) {
      originalIndex = this.intention.fromIndex;
      currentIndex = this.intention.toIndex;
    } else {
      originalIndex = patchedItems.indexOf(model.item);
      if (originalIndex < 0) return;
      currentIndex = originalIndex;
    }

    if (currentIndex < targetIndex) {
      if (beforeTarget) {
        nextIndex = targetIndex - 1;
      } else {
        nextIndex = targetIndex;
      }
    } else {
        if (beforeTarget) {
          nextIndex = targetIndex;
        } else {
          nextIndex = targetIndex + 1;
        }
      }

    if (!this.intention || this.intention.fromIndex !== originalIndex || this.intention.toIndex !== nextIndex) {
      this.intention = {
        fromIndex: originalIndex,
        toIndex: nextIndex
      };
    }
  }

}, (_descriptor = _applyDecoratedDescriptor(_class2.prototype, 'items', [bindable], {
  enumerable: true,
  initializer: null
}), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, 'local', [bindable], {
  enumerable: true,
  initializer: null
}), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, 'intention', [observable], {
  enumerable: true,
  initializer: function () {
    return null;
  }
}), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, 'patchedItems', [observable], {
  enumerable: true,
  initializer: null
})), _class2)) || _class) || _class) || _class);