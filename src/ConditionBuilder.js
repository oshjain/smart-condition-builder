/**
 * Smart Condition Builder
 * -----------------------
 * A reusable, UI-only, vanilla JavaScript condition builder component.
 *
 * Responsibilities:
 * - Build a nested AND / OR condition-builder UI.
 * - Support new/edit/rebuild/reset flows.
 * - Manage condition UI state internally.
 * - Validate incomplete or structurally unsupported conditions.
 * - Return a neutral condition-array format.
 *
 * Non-responsibilities:
 * - Does not apply filters to any table/grid.
 * - Does not save filters.
 * - Does not call APIs.
 * - Does not know about your app's business logic.
 *
 * Neutral Condition Array Format:
 * - Outer array = AND relationship.
 * - Nested array = OR relationship.
 * - Object = single rule.
 *
 * Example:
 *
 * [
 *   { field: "spCode", type: "starts", value: "103266" },
 *   [
 *     { field: "reason", type: "like", value: "ashs" },
 *     { field: "onshorePic", type: "like", value: "has" }
 *   ]
 * ]
 *
 * Meaning:
 *
 * spCode starts with 103266
 * AND
 * (
 *   reason contains ashs
 *   OR
 *   onshorePic contains has
 * )
 *
 * Basic Usage:
 *
 * const conditionBuilder = new ConditionBuilder({
 *   fields: [
 *     { label: "Onshore PIC", field: "onshorePic", type: "string" },
 *     { label: "S/P Code", field: "spCode", type: "string" },
 *     { label: "Aging", field: "aging", type: "number" }
 *   ]
 * });
 *
 * conditionBuilder.build({
 *   target: "#conditionBuilderHost"
 * });
 *
 * const validation = conditionBuilder.validate();
 *
 * if (validation.valid) {
 *   const conditions = conditionBuilder.getConditions();
 *   console.log(conditions);
 * }
 */
class ConditionBuilder {
  /**
   * Default component configuration.
   *
   * All visual styling is handled through Tailwind-compatible class strings.
   */
  static defaults = {
    /**
     * Selector or HTMLElement where the builder will be rendered.
     *
     * Can also be passed later in build({ target }).
     */
    target: null,

    /**
     * Available fields.
     *
     * Supported field shape:
     *
     * {
     *   label: "S/P Code",
     *   field: "spCode",
     *   type: "string",
     *   values: ["Open", "Closed"],       // optional fixed value list
     *   operators: ["=", "!=", "like"]    // optional field-specific operators
     * }
     */
    fields: [],

    /**
     * Supported operators.
     *
     * These are only neutral operator tokens.
     * Your own app decides how to interpret them later.
     */
    applicableClauses: [
      "=",
      "<",
      "<=",
      ">",
      ">=",
      "!=",
      "regex",
      "like",
      "keywords",
      "starts",
      "ends",
      "in"
    ],

    /**
     * Default root group logic.
     */
    defaultRootLogic: "AND",

    behavior: {
      /**
       * When a new builder is opened, start with one empty rule.
       */
      startWithEmptyRule: true,

      /**
       * When user creates a new group, start that group with one empty rule.
       */
      newGroupStartsWithEmptyRule: true,

      /**
       * Automatically select first configured field for new rules.
       */
      autoSelectFirstField: false,

      /**
       * Clear value when field changes.
       */
      clearValueOnFieldChange: true,

      /**
       * Cast numeric/boolean values based on field type when exporting.
       */
      castValues: true,

      /**
       * Close add-menu after clicking Add Condition / Add Group.
       */
      closeMenuAfterAction: true
    },

    limits: {
      /**
       * Maximum nesting depth.
       */
      maxDepth: 4,

      /**
       * Maximum number of children inside a single group.
       */
      maxChildrenPerGroup: 25,

      /**
       * If a group becomes empty after deleting a node, auto-insert one empty rule.
       */
      autoInsertRuleWhenGroupBecomesEmpty: true,

      /**
       * The neutral condition-array format is:
       * outer array = AND, nested array = OR.
       *
       * Some very complex trees, such as an AND group with multiple children
       * inside an OR group, cannot be represented safely in that array format.
       *
       * Keep this true for public-safe output validation.
       */
      strictConditionArrayValidation: true
    },

    labels: {
      and: "AND",
      or: "OR",
      add: "Add",
      addCondition: "Add Condition",
      addAndGroup: "Add AND Group",
      addOrGroup: "Add OR Group",
      fieldPlaceholder: "Select Field",
      operatorPlaceholder: "Select Operator",
      valuePlaceholder: "Value...",
      emptyGroup: "No conditions added",
      moveUp: "Move Up",
      moveDown: "Move Down",
      delete: "Delete"
    },

    icons: {
      plus: "add",
      delete: "close",
      up: "keyboard_arrow_up",
      down: "keyboard_arrow_down"
    },

    /**
     * Google Material Symbols default icon class.
     */
    iconClass: "material-symbols-outlined",

    /**
     * Tailwind classes.
     */
    classNames: {
      root: "w-full rounded-2xl border border-slate-200 bg-white p-4 text-slate-800",
      group: "relative rounded-xl border border-slate-200 bg-slate-50/70 p-3",
      rootGroup: "bg-white",
      groupDepth: ["ml-0", "ml-5", "ml-8", "ml-10", "ml-12"],

      groupHeader: "mb-3 flex flex-wrap items-center gap-2",
      groupChildren: "space-y-3 border-l border-dashed border-slate-300 pl-4",

      logicWrap: "inline-flex overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm",
      logicButton: "px-3 py-1.5 text-xs font-semibold transition",
      logicActiveAnd: "bg-blue-600 text-white",
      logicActiveOr: "bg-slate-700 text-white",
      logicInactive: "bg-white text-slate-600 hover:bg-slate-100",

      addMenuWrapper: "relative inline-flex",
      menu: "absolute left-0 top-9 z-50 w-52 rounded-xl border border-slate-200 bg-white p-1 shadow-xl",
      menuItem: "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100",

      iconButton: "inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50",
      dangerButton: "inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 shadow-sm transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600",

      rule: "flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm",
      select: "h-10 min-w-[170px] rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100",
      input: "h-10 min-w-[170px] rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100",
      empty: "rounded-lg border border-dashed border-slate-300 bg-white p-3 text-sm text-slate-400"
    },

    /**
     * Optional callback fired on every UI/state change.
     *
     * onChange(tree, conditions, builder) {}
     */
    onChange: null
  };

  #config;
  #root = null;
  #tree = null;
  #listeners = new Map();

  #boundClick;
  #boundChange;
  #boundInput;

  /**
   * Create a reusable ConditionBuilder instance.
   *
   * Initialize once, then call build/rebuild repeatedly for new/edit modal flows.
   *
   * @param {Object} config Component configuration.
   *
   * @example
   * const conditionBuilder = new ConditionBuilder({
   *   fields: [
   *     { label: "Name", field: "name", type: "string" },
   *     { label: "Age", field: "age", type: "number" }
   *   ]
   * });
   */
  constructor(config = {}) {
    this.#config = this.#deepMerge(ConditionBuilder.defaults, config);

    this.#config.operators = this.#normalizeOperators(
      this.#config.operators || this.#config.applicableClauses
    );

    this.#boundClick = this.#handleClick.bind(this);
    this.#boundChange = this.#handleChange.bind(this);
    this.#boundInput = this.#handleInput.bind(this);
  }

  /**
   * Build the condition builder UI.
   *
   * This method supports both new and edit flows.
   *
   * @param {Object|Array} options Build options or existing condition array.
   * @param {string|HTMLElement} [options.target] Render target.
   * @param {Array|Object|null} [options.conditions] Existing condition array or internal tree.
   * @returns {ConditionBuilder}
   *
   * @example
   * conditionBuilder.build({
   *   target: "#conditionBuilderHost"
   * });
   *
   * @example
   * conditionBuilder.build({
   *   target: "#conditionBuilderHost",
   *   conditions: savedFilter.conditions
   * });
   *
   * @example
   * // Also supported:
   * conditionBuilder.build(savedFilter.conditions);
   */
  build(options = {}) {
    this.#unbindEvents();

    const normalizedOptions = this.#normalizeBuildOptions(options);

    if (normalizedOptions.target) {
      this.#config.target = normalizedOptions.target;
    }

    this.#root = this.#resolveTarget(this.#config.target);

    if (!this.#root) {
      throw new Error("ConditionBuilder: target is required.");
    }

    this.#root.innerHTML = "";

    this.#tree =
      this.#normalizeIncomingConditions(normalizedOptions.conditions) ||
      this.#createRootTree();

    this.#render();
    this.#bindEvents();

    this.#emit("build", this.getTree(), this.getConditions(), this);

    return this;
  }

  /**
   * Rebuild the condition builder UI.
   *
   * Alias of build(), kept for readability in modal reopen flows.
   *
   * @param {Object|Array} options
   * @returns {ConditionBuilder}
   */
  rebuild(options = {}) {
    return this.build(options);
  }

  /**
   * Reset builder to a fresh default state.
   *
   * @returns {ConditionBuilder}
   *
   * @example
   * conditionBuilder.reset();
   */
  reset() {
    this.#tree = this.#createRootTree();
    this.#render();
    this.#emitChange("reset");

    return this;
  }

  /**
   * Destroy rendered UI and remove event listeners.
   *
   * @returns {ConditionBuilder}
   */
  destroy() {
    this.#unbindEvents();

    if (this.#root) {
      this.#root.innerHTML = "";
    }

    this.#root = null;
    this.#tree = null;

    this.#emit("destroy", this);

    return this;
  }

  /**
   * Return the exact internal condition tree.
   *
   * This is the best format to store if you want perfect edit-mode restoration.
   *
   * @returns {Object|null}
   *
   * @example
   * const tree = conditionBuilder.getTree();
   */
  getTree() {
    return this.#clone(this.#tree);
  }

  /**
   * Load the builder from an internal condition tree.
   *
   * @param {Object} tree
   * @returns {ConditionBuilder}
   *
   * @example
   * conditionBuilder.setTree(savedFilter.tree);
   */
  setTree(tree) {
    this.#tree = this.#normalizeTree(tree) || this.#createRootTree();
    this.#render();
    this.#emitChange("setTree");

    return this;
  }

  /**
   * Return the neutral condition-array format.
   *
   * Format:
   * - Outer array = AND.
   * - Nested array = OR.
   * - Object = rule.
   *
   * @param {Object} options
   * @param {boolean} [options.regexAsRegExp=false] Export regex value as RegExp object.
   * @returns {Array}
   *
   * @example
   * const conditions = conditionBuilder.getConditions();
   */
  getConditions(options = {}) {
    if (!this.#tree) return [];

    return this.#groupToConditionArray(this.#tree, {
      isRoot: true,
      regexAsRegExp: Boolean(options.regexAsRegExp)
    });
  }

  /**
   * Load builder from neutral condition-array format.
   *
   * @param {Array} conditions
   * @returns {ConditionBuilder}
   *
   * @example
   * conditionBuilder.setConditions([
   *   { field: "spCode", type: "starts", value: "103266" },
   *   [
   *     { field: "reason", type: "like", value: "ashs" },
   *     { field: "onshorePic", type: "like", value: "has" }
   *   ]
   * ]);
   */
  setConditions(conditions = []) {
    this.#tree =
      this.#normalizeIncomingConditions(conditions) ||
      this.#createRootTree();

    this.#render();
    this.#emitChange("setConditions");

    return this;
  }

  /**
   * Validate the current builder state.
   *
   * Always call this before saving conditions.
   *
   * @param {Object} options
   * @param {boolean} [options.strictConditionArray] Validate whether tree can safely export to neutral condition-array format.
   * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
   *
   * @example
   * const result = conditionBuilder.validate();
   *
   * if (!result.valid) {
   *   alert(result.errors.join("\\n"));
   *   return;
   * }
   */
  validate(options = {}) {
    const strictConditionArray =
      options.strictConditionArray ??
      this.#config.limits.strictConditionArrayValidation;

    const errors = [];
    const warnings = [];

    const walk = (node, path = "Root", parentLogic = null) => {
      if (!node) {
        errors.push(`${path}: Missing node.`);
        return;
      }

      if (node.type === "group") {
        if (!["AND", "OR"].includes(node.logic)) {
          errors.push(`${path}: Invalid group logic.`);
        }

        if (!Array.isArray(node.children)) {
          errors.push(`${path}: Group children must be an array.`);
          return;
        }

        if (node.children.length === 0) {
          errors.push(`${path}: Group has no conditions.`);
        }

        if (
          strictConditionArray &&
          parentLogic === "OR" &&
          node.logic === "AND" &&
          node.children.length > 1
        ) {
          errors.push(
            `${path}: This AND group is inside an OR group and has multiple conditions. It cannot be safely represented in the condition-array format. Move it outside the OR group or simplify it.`
          );
        }

        node.children.forEach((child, index) => {
          walk(child, `${path} > ${index + 1}`, node.logic);
        });

        return;
      }

      if (node.type === "rule") {
        if (!node.field) {
          errors.push(`${path}: Field is required.`);
        }

        if (!node.operator) {
          errors.push(`${path}: Operator is required.`);
        }

        if (node.field && !this.#getField(node.field)) {
          errors.push(`${path}: Unknown field "${node.field}".`);
        }

        if (node.operator && !this.#getOperator(node.operator)) {
          errors.push(`${path}: Unknown operator "${node.operator}".`);
        }

        if (
          this.#operatorRequiresValue(node.operator) &&
          (node.value === null ||
            node.value === undefined ||
            String(node.value).trim() === "")
        ) {
          errors.push(`${path}: Value is required.`);
        }

        if (node.operator === "regex" && node.value) {
          try {
            new RegExp(String(node.value));
          } catch {
            errors.push(`${path}: Invalid regex pattern.`);
          }
        }

        return;
      }

      errors.push(`${path}: Invalid node type.`);
    };

    walk(this.#tree);

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Subscribe to builder events.
   *
   * Supported events:
   * - build
   * - change
   * - reset
   * - destroy
   *
   * @param {string} eventName
   * @param {Function} callback
   * @returns {ConditionBuilder}
   *
   * @example
   * conditionBuilder.on("change", (tree, conditions) => {
   *   console.log(tree, conditions);
   * });
   */
  on(eventName, callback) {
    if (!this.#listeners.has(eventName)) {
      this.#listeners.set(eventName, new Set());
    }

    this.#listeners.get(eventName).add(callback);

    return this;
  }

  /**
   * Remove an event listener.
   *
   * @param {string} eventName
   * @param {Function} callback
   * @returns {ConditionBuilder}
   */
  off(eventName, callback) {
    if (this.#listeners.has(eventName)) {
      this.#listeners.get(eventName).delete(callback);
    }

    return this;
  }

  /**
   * Replace available fields after initialization.
   *
   * Useful when the same builder instance is reused for different datasets.
   *
   * @param {Array} fields
   * @param {Object} options
   * @param {boolean} [options.reset=false] Reset builder after replacing fields.
   * @returns {ConditionBuilder}
   *
   * @example
   * conditionBuilder.setFields(newFields, { reset: true });
   */
  setFields(fields = [], options = {}) {
    this.#config.fields = Array.isArray(fields) ? fields : [];

    if (options.reset) {
      this.reset();
      return this;
    }

    this.#render();
    this.#emitChange("setFields");

    return this;
  }

  /**
   * Return a safe copy of the current configuration.
   *
   * @returns {Object}
   */
  getConfig() {
    return this.#cloneConfig(this.#config);
  }

  #render() {
    if (!this.#root) return;

    this.#root.innerHTML = "";

    const shell = this.#createElement("div", this.#config.classNames.root);
    shell.dataset.scbRoot = "true";

    shell.appendChild(this.#renderGroup(this.#tree, 0, true));

    this.#root.appendChild(shell);
  }

  #renderGroup(group, depth, isRoot = false) {
    const groupClasses = [
      this.#config.classNames.group,
      isRoot ? this.#config.classNames.rootGroup : "",
      this.#depthClass(depth)
    ]
      .filter(Boolean)
      .join(" ");

    const groupEl = this.#createElement("div", groupClasses);
    groupEl.dataset.scbNodeId = group.id;
    groupEl.dataset.scbNodeType = "group";

    const header = this.#createElement(
      "div",
      this.#config.classNames.groupHeader
    );

    header.appendChild(this.#renderLogicToggle(group));
    header.appendChild(this.#renderAddMenu(group.id));

    if (!isRoot) {
      header.appendChild(
        this.#renderIconButton(
          "move-up",
          group.id,
          this.#config.icons.up,
          this.#config.labels.moveUp
        )
      );

      header.appendChild(
        this.#renderIconButton(
          "move-down",
          group.id,
          this.#config.icons.down,
          this.#config.labels.moveDown
        )
      );

      header.appendChild(
        this.#renderIconButton(
          "delete-node",
          group.id,
          this.#config.icons.delete,
          this.#config.labels.delete,
          true
        )
      );
    }

    groupEl.appendChild(header);

    const childrenWrap = this.#createElement(
      "div",
      this.#config.classNames.groupChildren
    );

    if (!group.children.length) {
      childrenWrap.appendChild(
        this.#createElement(
          "div",
          this.#config.classNames.empty,
          {},
          this.#config.labels.emptyGroup
        )
      );
    } else {
      group.children.forEach((child) => {
        childrenWrap.appendChild(
          child.type === "group"
            ? this.#renderGroup(child, depth + 1, false)
            : this.#renderRule(child)
        );
      });
    }

    groupEl.appendChild(childrenWrap);

    return groupEl;
  }

  #renderLogicToggle(group) {
    const wrap = this.#createElement(
      "div",
      this.#config.classNames.logicWrap
    );

    const andButton = this.#createElement(
      "button",
      [
        this.#config.classNames.logicButton,
        group.logic === "AND"
          ? this.#config.classNames.logicActiveAnd
          : this.#config.classNames.logicInactive
      ].join(" "),
      {
        type: "button",
        "data-scb-action": "set-logic",
        "data-scb-node-id": group.id,
        "data-scb-logic": "AND"
      },
      this.#config.labels.and
    );

    const orButton = this.#createElement(
      "button",
      [
        this.#config.classNames.logicButton,
        group.logic === "OR"
          ? this.#config.classNames.logicActiveOr
          : this.#config.classNames.logicInactive
      ].join(" "),
      {
        type: "button",
        "data-scb-action": "set-logic",
        "data-scb-node-id": group.id,
        "data-scb-logic": "OR"
      },
      this.#config.labels.or
    );

    wrap.appendChild(andButton);
    wrap.appendChild(orButton);

    return wrap;
  }

  #renderAddMenu(groupId) {
    const wrapper = this.#createElement(
      "div",
      this.#config.classNames.addMenuWrapper
    );

    const trigger = this.#createElement(
      "button",
      this.#config.classNames.iconButton,
      {
        type: "button",
        title: this.#config.labels.add,
        "data-scb-action": "toggle-menu",
        "data-scb-node-id": groupId
      }
    );

    trigger.appendChild(this.#icon(this.#config.icons.plus));

    const menu = this.#createElement(
      "div",
      `${this.#config.classNames.menu} hidden`,
      {
        "data-scb-menu-for": groupId
      }
    );

    menu.appendChild(
      this.#renderMenuItem(
        "add-rule",
        groupId,
        this.#config.labels.addCondition,
        this.#config.icons.plus
      )
    );

    menu.appendChild(
      this.#renderMenuItem(
        "add-group",
        groupId,
        this.#config.labels.addAndGroup,
        this.#config.icons.plus,
        { logic: "AND" }
      )
    );

    menu.appendChild(
      this.#renderMenuItem(
        "add-group",
        groupId,
        this.#config.labels.addOrGroup,
        this.#config.icons.plus,
        { logic: "OR" }
      )
    );

    wrapper.appendChild(trigger);
    wrapper.appendChild(menu);

    return wrapper;
  }

  #renderMenuItem(action, nodeId, label, icon, extra = {}) {
    const button = this.#createElement(
      "button",
      this.#config.classNames.menuItem,
      {
        type: "button",
        "data-scb-action": action,
        "data-scb-node-id": nodeId
      }
    );

    Object.entries(extra).forEach(([key, value]) => {
      button.dataset[`scb${this.#capitalize(key)}`] = value;
    });

    button.appendChild(this.#icon(icon));
    button.appendChild(document.createTextNode(label));

    return button;
  }

  #renderRule(rule) {
    const row = this.#createElement("div", this.#config.classNames.rule);
    row.dataset.scbNodeId = rule.id;
    row.dataset.scbNodeType = "rule";

    row.appendChild(
      this.#createSelect({
        nodeId: rule.id,
        bind: "field",
        value: rule.field,
        placeholder: this.#config.labels.fieldPlaceholder,
        options: this.#config.fields.map((field) => ({
          label: field.label,
          value: field.field
        }))
      })
    );

    row.appendChild(
      this.#createSelect({
        nodeId: rule.id,
        bind: "operator",
        value: rule.operator,
        placeholder: this.#config.labels.operatorPlaceholder,
        options: this.#operatorsForField(rule.field)
      })
    );

    row.appendChild(this.#renderValueEditor(rule));

    row.appendChild(
      this.#renderIconButton(
        "move-up",
        rule.id,
        this.#config.icons.up,
        this.#config.labels.moveUp
      )
    );

    row.appendChild(
      this.#renderIconButton(
        "move-down",
        rule.id,
        this.#config.icons.down,
        this.#config.labels.moveDown
      )
    );

    row.appendChild(
      this.#renderIconButton(
        "delete-node",
        rule.id,
        this.#config.icons.delete,
        this.#config.labels.delete,
        true
      )
    );

    return row;
  }

  #renderValueEditor(rule) {
    const field = this.#getField(rule.field);

    if (!this.#operatorRequiresValue(rule.operator)) {
      return this.#createElement("input", "hidden", {
        type: "hidden",
        value: "",
        "data-scb-bind": "value",
        "data-scb-node-id": rule.id
      });
    }

    if (Array.isArray(field?.values)) {
      return this.#createSelect({
        nodeId: rule.id,
        bind: "value",
        value: rule.value,
        placeholder: this.#config.labels.valuePlaceholder,
        options: field.values.map((item) => {
          if (item && typeof item === "object") {
            return {
              label: item.label,
              value: item.value
            };
          }

          return {
            label: String(item),
            value: String(item)
          };
        })
      });
    }

    if (field?.type === "boolean") {
      return this.#createSelect({
        nodeId: rule.id,
        bind: "value",
        value: String(rule.value ?? ""),
        placeholder: this.#config.labels.valuePlaceholder,
        options: [
          { label: "True", value: "true" },
          { label: "False", value: "false" }
        ]
      });
    }

    return this.#createElement(
      "input",
      this.#config.classNames.input,
      {
        type: this.#inputTypeForField(field, rule.operator),
        value: rule.value ?? "",
        placeholder:
          rule.operator === "in"
            ? "Comma separated values"
            : this.#config.labels.valuePlaceholder,
        "data-scb-bind": "value",
        "data-scb-node-id": rule.id
      }
    );
  }

  #renderIconButton(action, nodeId, icon, title, danger = false) {
    const button = this.#createElement(
      "button",
      danger
        ? this.#config.classNames.dangerButton
        : this.#config.classNames.iconButton,
      {
        type: "button",
        title,
        "data-scb-action": action,
        "data-scb-node-id": nodeId
      }
    );

    button.appendChild(this.#icon(icon));

    return button;
  }

  #createSelect({ nodeId, bind, value, placeholder, options }) {
    const select = this.#createElement(
      "select",
      this.#config.classNames.select,
      {
        "data-scb-bind": bind,
        "data-scb-node-id": nodeId
      }
    );

    select.appendChild(
      this.#createElement("option", "", { value: "" }, placeholder)
    );

    options.forEach((option) => {
      const opt = this.#createElement(
        "option",
        "",
        { value: option.value },
        option.label
      );

      if (String(option.value) === String(value ?? "")) {
        opt.selected = true;
      }

      select.appendChild(opt);
    });

    return select;
  }

  #handleClick(event) {
    const actionEl = event.target.closest("[data-scb-action]");

    if (!actionEl || !this.#root?.contains(actionEl)) {
      this.#closeMenus();
      return;
    }

    const action = actionEl.dataset.scbAction;
    const nodeId = actionEl.dataset.scbNodeId;

    if (
      action !== "toggle-menu" &&
      this.#config.behavior.closeMenuAfterAction
    ) {
      this.#closeMenus();
    }

    switch (action) {
      case "toggle-menu":
        this.#toggleMenu(nodeId);
        break;

      case "set-logic":
        this.#setLogic(nodeId, actionEl.dataset.scbLogic);
        break;

      case "add-rule":
        this.#addRule(nodeId);
        break;

      case "add-group":
        this.#addGroup(nodeId, actionEl.dataset.scbLogic || "AND");
        break;

      case "delete-node":
        this.#deleteNode(nodeId);
        break;

      case "move-up":
        this.#moveNode(nodeId, -1);
        break;

      case "move-down":
        this.#moveNode(nodeId, 1);
        break;
    }
  }

  #handleChange(event) {
    const input = event.target.closest("[data-scb-bind]");

    if (!input || !this.#root?.contains(input)) return;

    const nodeInfo = this.#findNode(input.dataset.scbNodeId);

    if (!nodeInfo || nodeInfo.node.type !== "rule") return;

    const rule = nodeInfo.node;
    const bind = input.dataset.scbBind;

    if (bind === "field") {
      rule.field = input.value;

      if (this.#config.behavior.clearValueOnFieldChange) {
        rule.value = "";
      }

      const allowedOperators = this.#operatorsForField(rule.field);
      const currentOperatorStillAllowed = allowedOperators.some(
        (operator) => operator.value === rule.operator
      );

      if (!currentOperatorStillAllowed) {
        rule.operator = allowedOperators[0]?.value || "";
      }

      this.#render();
      this.#emitChange("change");
      return;
    }

    if (bind === "operator") {
      rule.operator = input.value;

      if (!this.#operatorRequiresValue(rule.operator)) {
        rule.value = "";
      }

      this.#render();
      this.#emitChange("change");
      return;
    }

    if (bind === "value") {
      rule.value = input.value;
      this.#emitChange("change");
    }
  }

  #handleInput(event) {
    const input = event.target.closest("[data-scb-bind='value']");

    if (!input || !this.#root?.contains(input)) return;

    const nodeInfo = this.#findNode(input.dataset.scbNodeId);

    if (!nodeInfo || nodeInfo.node.type !== "rule") return;

    nodeInfo.node.value = input.value;
    this.#emitChange("change");
  }

  #setLogic(nodeId, logic) {
    const nodeInfo = this.#findNode(nodeId);

    if (!nodeInfo || nodeInfo.node.type !== "group") return;

    nodeInfo.node.logic = logic === "OR" ? "OR" : "AND";

    this.#render();
    this.#emitChange("change");
  }

  #addRule(groupId) {
    const groupInfo = this.#findNode(groupId);

    if (!groupInfo || groupInfo.node.type !== "group") return;

    if (
      groupInfo.node.children.length >=
      this.#config.limits.maxChildrenPerGroup
    ) {
      return;
    }

    groupInfo.node.children.push(this.#createRule());

    this.#render();
    this.#emitChange("change");
  }

  #addGroup(parentGroupId, logic = "AND") {
    const parentInfo = this.#findNode(parentGroupId);

    if (!parentInfo || parentInfo.node.type !== "group") return;

    const depth = this.#getDepth(parentGroupId);

    if (depth >= this.#config.limits.maxDepth) {
      return;
    }

    if (
      parentInfo.node.children.length >=
      this.#config.limits.maxChildrenPerGroup
    ) {
      return;
    }

    const group = this.#createGroup(logic === "OR" ? "OR" : "AND");

    if (this.#config.behavior.newGroupStartsWithEmptyRule) {
      group.children.push(this.#createRule());
    }

    parentInfo.node.children.push(group);

    this.#render();
    this.#emitChange("change");
  }

  #deleteNode(nodeId) {
    if (!this.#tree || this.#tree.id === nodeId) return;

    const nodeInfo = this.#findNode(nodeId);

    if (!nodeInfo || !nodeInfo.parent) return;

    const index = nodeInfo.parent.children.findIndex(
      (child) => child.id === nodeId
    );

    if (index >= 0) {
      nodeInfo.parent.children.splice(index, 1);
    }

    if (
      this.#config.limits.autoInsertRuleWhenGroupBecomesEmpty &&
      nodeInfo.parent.children.length === 0
    ) {
      nodeInfo.parent.children.push(this.#createRule());
    }

    this.#render();
    this.#emitChange("change");
  }

  #moveNode(nodeId, direction) {
    const nodeInfo = this.#findNode(nodeId);

    if (!nodeInfo || !nodeInfo.parent) return;

    const siblings = nodeInfo.parent.children;
    const oldIndex = siblings.findIndex((child) => child.id === nodeId);
    const newIndex = oldIndex + direction;

    if (oldIndex < 0 || newIndex < 0 || newIndex >= siblings.length) return;

    const [item] = siblings.splice(oldIndex, 1);
    siblings.splice(newIndex, 0, item);

    this.#render();
    this.#emitChange("change");
  }

  #groupToConditionArray(group, context = {}) {
    const isRoot = Boolean(context.isRoot);
    const regexAsRegExp = Boolean(context.regexAsRegExp);

    const items = [];

    group.children.forEach((child) => {
      if (child.type === "rule") {
        const rule = this.#ruleToConditionObject(child, { regexAsRegExp });

        if (rule) {
          items.push(rule);
        }

        return;
      }

      if (child.type === "group") {
        const nested = this.#groupToConditionArray(child, {
          isRoot: false,
          regexAsRegExp
        });

        if (!nested.length) return;

        if (child.logic === "AND") {
          items.push(...nested);
        } else {
          items.push(nested);
        }
      }
    });

    if (group.logic === "OR") {
      return isRoot ? [items] : items;
    }

    return items;
  }

  #ruleToConditionObject(rule, options = {}) {
    if (!rule.field || !rule.operator) return null;

    if (
      this.#operatorRequiresValue(rule.operator) &&
      (rule.value === null ||
        rule.value === undefined ||
        String(rule.value).trim() === "")
    ) {
      return null;
    }

    return {
      field: rule.field,
      type: rule.operator,
      value: this.#parseExportValue(rule, options)
    };
  }

  #parseExportValue(rule, options = {}) {
    const field = this.#getField(rule.field);

    if (rule.operator === "in") {
      const values = Array.isArray(rule.value)
        ? rule.value
        : String(rule.value ?? "")
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);

      return values.map((item) => this.#castValue(item, field));
    }

    if (rule.operator === "regex" && options.regexAsRegExp) {
      try {
        return new RegExp(String(rule.value));
      } catch {
        return String(rule.value ?? "");
      }
    }

    return this.#castValue(rule.value, field);
  }

  #castValue(value, field) {
    if (!this.#config.behavior.castValues || !field) {
      return value;
    }

    if (field.type === "number") {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? value : parsed;
    }

    if (field.type === "boolean") {
      if (String(value).toLowerCase() === "true") return true;
      if (String(value).toLowerCase() === "false") return false;
      return value;
    }

    return value;
  }

  #normalizeBuildOptions(options) {
    if (Array.isArray(options)) {
      return {
        conditions: options
      };
    }

    if (options?.type === "group") {
      return {
        conditions: options
      };
    }

    return options || {};
  }

  #normalizeIncomingConditions(conditions) {
    if (!conditions) return null;

    if (Array.isArray(conditions)) {
      return this.#conditionArrayToTree(conditions);
    }

    if (conditions.type === "group") {
      return this.#normalizeTree(conditions);
    }

    return null;
  }

  #conditionArrayToTree(conditions) {
    const root = this.#createGroup("AND");

    conditions.forEach((item) => {
      if (Array.isArray(item)) {
        const orGroup = this.#createGroup("OR");

        item.forEach((orItem) => {
          if (Array.isArray(orItem)) {
            const nestedOr = this.#createGroup("OR");

            orItem.forEach((nestedItem) => {
              if (!Array.isArray(nestedItem)) {
                nestedOr.children.push(
                  this.#normalizeRuleFromConditionObject(nestedItem)
                );
              }
            });

            orGroup.children.push(nestedOr);
            return;
          }

          orGroup.children.push(
            this.#normalizeRuleFromConditionObject(orItem)
          );
        });

        root.children.push(orGroup);
        return;
      }

      root.children.push(this.#normalizeRuleFromConditionObject(item));
    });

    if (!root.children.length && this.#config.behavior.startWithEmptyRule) {
      root.children.push(this.#createRule());
    }

    return root;
  }

  #normalizeTree(tree) {
    if (!tree || tree.type !== "group") return null;

    const normalized = {
      id: tree.id || this.#uid("grp"),
      type: "group",
      logic: tree.logic === "OR" ? "OR" : "AND",
      children: []
    };

    if (Array.isArray(tree.children)) {
      normalized.children = tree.children
        .map((child) => {
          if (child?.type === "group") {
            return this.#normalizeTree(child);
          }

          return this.#normalizeRule(child);
        })
        .filter(Boolean);
    }

    if (
      !normalized.children.length &&
      this.#config.behavior.startWithEmptyRule
    ) {
      normalized.children.push(this.#createRule());
    }

    return normalized;
  }

  #normalizeRule(rule) {
    if (!rule) return null;

    return {
      id: rule.id || this.#uid("rule"),
      type: "rule",
      field: rule.field || "",
      operator:
        rule.operator ||
        (rule.type && rule.type !== "rule" ? rule.type : "") ||
        this.#defaultOperator(rule.field || ""),
      value: rule.value ?? ""
    };
  }

  #normalizeRuleFromConditionObject(condition) {
    return this.#normalizeRule({
      field: condition?.field || "",
      operator: condition?.type || "",
      value: condition?.value ?? ""
    });
  }

  #createRootTree() {
    const root = this.#createGroup(this.#config.defaultRootLogic);

    if (this.#config.behavior.startWithEmptyRule) {
      root.children.push(this.#createRule());
    }

    return root;
  }

  #createGroup(logic = "AND") {
    return {
      id: this.#uid("grp"),
      type: "group",
      logic: logic === "OR" ? "OR" : "AND",
      children: []
    };
  }

  #createRule() {
    const field = this.#config.behavior.autoSelectFirstField
      ? this.#config.fields[0]?.field || ""
      : "";

    return {
      id: this.#uid("rule"),
      type: "rule",
      field,
      operator: this.#defaultOperator(field),
      value: ""
    };
  }

  #defaultOperator(fieldName = "") {
    const operators = this.#operatorsForField(fieldName);
    return operators[0]?.value || "=";
  }

  #operatorsForField(fieldName) {
    const field = this.#getField(fieldName);

    if (field?.operators?.length) {
      return this.#config.operators.filter((operator) =>
        field.operators.includes(operator.value)
      );
    }

    return this.#config.operators.filter((operator) => {
      if (!field || !operator.types?.length) return true;
      return operator.types.includes(field.type || "string");
    });
  }

  #normalizeOperators(operators = []) {
    const labels = {
      "=": "Equal",
      "!=": "Not Equal",
      "<": "Less Than",
      "<=": "Less Than or Equal",
      ">": "Greater Than",
      ">=": "Greater Than or Equal",
      regex: "Regex",
      like: "Contains",
      keywords: "Keywords",
      starts: "Starts With",
      ends: "Ends With",
      in: "In List"
    };

    const types = {
      "=": ["string", "number", "date", "boolean"],
      "!=": ["string", "number", "date", "boolean"],
      "<": ["number", "date"],
      "<=": ["number", "date"],
      ">": ["number", "date"],
      ">=": ["number", "date"],
      regex: ["string"],
      like: ["string"],
      keywords: ["string"],
      starts: ["string"],
      ends: ["string"],
      in: ["string", "number", "date"]
    };

    return operators.map((operator) => {
      if (typeof operator === "string") {
        return {
          value: operator,
          label: labels[operator] || operator,
          types: types[operator] || []
        };
      }

      return {
        value: operator.value,
        label: operator.label || labels[operator.value] || operator.value,
        types: operator.types || types[operator.value] || []
      };
    });
  }

  #operatorRequiresValue(operator) {
    return !["empty", "notEmpty", "isEmpty", "isNotEmpty"].includes(operator);
  }

  #inputTypeForField(field, operator) {
    if (operator === "regex" || operator === "keywords" || operator === "in") {
      return "text";
    }

    if (field?.type === "number") return "number";
    if (field?.type === "date") return "date";

    return "text";
  }

  #getField(fieldName) {
    return this.#config.fields.find((field) => field.field === fieldName);
  }

  #getOperator(operatorValue) {
    return this.#config.operators.find(
      (operator) => operator.value === operatorValue
    );
  }

  #findNode(nodeId, current = this.#tree, parent = null) {
    if (!current) return null;

    if (current.id === nodeId) {
      return {
        node: current,
        parent
      };
    }

    if (current.type !== "group") return null;

    for (const child of current.children) {
      const found = this.#findNode(nodeId, child, current);

      if (found) return found;
    }

    return null;
  }

  #getDepth(nodeId, current = this.#tree, depth = 0) {
    if (!current) return -1;

    if (current.id === nodeId) return depth;

    if (current.type !== "group") return -1;

    for (const child of current.children) {
      const childDepth = this.#getDepth(nodeId, child, depth + 1);

      if (childDepth >= 0) {
        return childDepth;
      }
    }

    return -1;
  }

  #bindEvents() {
    if (!this.#root) return;

    this.#root.addEventListener("click", this.#boundClick);
    this.#root.addEventListener("change", this.#boundChange);
    this.#root.addEventListener("input", this.#boundInput);
    document.addEventListener("click", this.#outsideClickHandler, true);
  }

  #unbindEvents() {
    if (this.#root) {
      this.#root.removeEventListener("click", this.#boundClick);
      this.#root.removeEventListener("change", this.#boundChange);
      this.#root.removeEventListener("input", this.#boundInput);
    }

    document.removeEventListener("click", this.#outsideClickHandler, true);
  }

  #outsideClickHandler = (event) => {
    if (!this.#root || this.#root.contains(event.target)) return;
    this.#closeMenus();
  };

  #toggleMenu(groupId) {
    if (!this.#root) return;

    const menu = this.#root.querySelector(`[data-scb-menu-for="${groupId}"]`);
    if (!menu) return;

    const wasHidden = menu.classList.contains("hidden");

    this.#closeMenus();

    if (wasHidden) {
      menu.classList.remove("hidden");
    }
  }

  #closeMenus() {
    if (!this.#root) return;

    this.#root.querySelectorAll("[data-scb-menu-for]").forEach((menu) => {
      menu.classList.add("hidden");
    });
  }

  #emitChange(reason = "change") {
    const tree = this.getTree();
    const conditions = this.getConditions();

    if (typeof this.#config.onChange === "function") {
      this.#config.onChange(tree, conditions, this, reason);
    }

    this.#emit("change", tree, conditions, this, reason);

    if (reason !== "change") {
      this.#emit(reason, tree, conditions, this);
    }
  }

  #emit(eventName, ...args) {
    if (!this.#listeners.has(eventName)) return;

    this.#listeners.get(eventName).forEach((callback) => {
      callback(...args);
    });
  }

  #icon(name) {
    return this.#createElement(
      "span",
      `${this.#config.iconClass} text-[18px] leading-none`,
      {},
      name
    );
  }

  #createElement(tag, className = "", attributes = {}, text = "") {
    const el = document.createElement(tag);

    if (className) {
      el.className = className;
    }

    Object.entries(attributes).forEach(([key, value]) => {
      if (value === null || value === undefined) return;
      el.setAttribute(key, value);
    });

    if (text !== null && text !== undefined && text !== "") {
      el.textContent = text;
    }

    return el;
  }

  #resolveTarget(target) {
    const hasHTMLElement =
      typeof HTMLElement !== "undefined" && target instanceof HTMLElement;

    if (hasHTMLElement) {
      return target;
    }

    if (typeof target === "string") {
      return document.querySelector(target);
    }

    return null;
  }

  #depthClass(depth) {
    const classes = this.#config.classNames.groupDepth || [];
    return classes[Math.min(depth, classes.length - 1)] || "";
  }

  #uid(prefix) {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return `${prefix}_${crypto.randomUUID()}`;
    }

    return `${prefix}_${Date.now()}_${Math.random()
      .toString(16)
      .slice(2)}`;
  }

  #capitalize(value) {
    return String(value).charAt(0).toUpperCase() + String(value).slice(1);
  }

  #clone(value) {
    if (value === null || value === undefined) return value;
    return JSON.parse(JSON.stringify(value));
  }

  #cloneConfig(config) {
    const copy = { ...config };
    copy.fields = this.#clone(config.fields);
    copy.operators = this.#clone(config.operators);
    copy.applicableClauses = this.#clone(config.applicableClauses);
    copy.behavior = this.#clone(config.behavior);
    copy.limits = this.#clone(config.limits);
    copy.labels = this.#clone(config.labels);
    copy.icons = this.#clone(config.icons);
    copy.classNames = this.#clone(config.classNames);
    return copy;
  }

  #deepMerge(...sources) {
    const isPlainObject = (value) => {
      if (!value || typeof value !== "object") return false;
      if (Array.isArray(value)) return false;

      const hasHTMLElement =
        typeof HTMLElement !== "undefined" && value instanceof HTMLElement;

      if (hasHTMLElement) return false;

      return Object.prototype.toString.call(value) === "[object Object]";
    };

    const mergeInto = (target, source) => {
      Object.entries(source || {}).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          target[key] = value.map((item) =>
            isPlainObject(item) ? mergeInto({}, item) : item
          );
          return;
        }

        if (isPlainObject(value)) {
          target[key] = mergeInto(
            isPlainObject(target[key]) ? target[key] : {},
            value
          );
          return;
        }

        target[key] = value;
      });

      return target;
    };

    return sources.reduce((acc, source) => mergeInto(acc, source), {});
  }
}

if (typeof window !== "undefined") {
  window.ConditionBuilder = ConditionBuilder;
}