(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, (global.ConnectorInside = global.ConnectorInside || {}, global.ConnectorInside.svelte = factory()));
})(this, (function () { 'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function append_styles(target, style_sheet_id, styles) {
        const append_styles_to = get_root_for_style(target);
        if (!append_styles_to.getElementById(style_sheet_id)) {
            const style = element('style');
            style.id = style_sheet_id;
            style.textContent = styles;
            append_stylesheet(append_styles_to, style);
        }
    }
    function get_root_for_style(node) {
        if (!node)
            return document;
        const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
        if (root && root.host) {
            return root;
        }
        return node.ownerDocument;
    }
    function append_empty_stylesheet(node) {
        const style_element = element('style');
        append_stylesheet(get_root_for_style(node), style_element);
        return style_element.sheet;
    }
    function append_stylesheet(node, style) {
        append(node.head || node, style);
        return style.sheet;
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.wholeText !== data)
            text.data = data;
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    // unfortunately this can't be a constant as that wouldn't be tree-shakeable
    // so we cache the result instead
    let crossorigin;
    function is_crossorigin() {
        if (crossorigin === undefined) {
            crossorigin = false;
            try {
                if (typeof window !== 'undefined' && window.parent) {
                    void window.parent.document;
                }
            }
            catch (error) {
                crossorigin = true;
            }
        }
        return crossorigin;
    }
    function add_resize_listener(node, fn) {
        const computed_style = getComputedStyle(node);
        if (computed_style.position === 'static') {
            node.style.position = 'relative';
        }
        const iframe = element('iframe');
        iframe.setAttribute('style', 'display: block; position: absolute; top: 0; left: 0; width: 100%; height: 100%; ' +
            'overflow: hidden; border: 0; opacity: 0; pointer-events: none; z-index: -1;');
        iframe.setAttribute('aria-hidden', 'true');
        iframe.tabIndex = -1;
        const crossorigin = is_crossorigin();
        let unsubscribe;
        if (crossorigin) {
            iframe.src = "data:text/html,<script>onresize=function(){parent.postMessage(0,'*')}</script>";
            unsubscribe = listen(window, 'message', (event) => {
                if (event.source === iframe.contentWindow)
                    fn();
            });
        }
        else {
            iframe.src = 'about:blank';
            iframe.onload = () => {
                unsubscribe = listen(iframe.contentWindow, 'resize', fn);
            };
        }
        append(node, iframe);
        return () => {
            if (crossorigin) {
                unsubscribe();
            }
            else if (unsubscribe && iframe.contentWindow) {
                unsubscribe();
            }
            detach(iframe);
        };
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    // we need to store the information for multiple documents because a Svelte application could also contain iframes
    // https://github.com/sveltejs/svelte/issues/3624
    const managed_styles = new Map();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_style_information(doc, node) {
        const info = { stylesheet: append_empty_stylesheet(node), rules: {} };
        managed_styles.set(doc, info);
        return info;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = get_root_for_style(node);
        const { stylesheet, rules } = managed_styles.get(doc) || create_style_information(doc, node);
        if (!rules[name]) {
            rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            managed_styles.forEach(info => {
                const { ownerNode } = info.stylesheet;
                // there is no ownerNode if it runs on jsdom.
                if (ownerNode)
                    detach(ownerNode);
            });
            managed_styles.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail, { cancelable = false } = {}) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail, { cancelable });
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
                return !event.defaultPrevented;
            }
            return true;
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }
    const null_transition = { duration: 0 };
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = (program.b - t);
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program || pending_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }

    var MessageType;
    (function (MessageType) {
        MessageType["Call"] = "call";
        MessageType["Reply"] = "reply";
        MessageType["Syn"] = "syn";
        MessageType["SynAck"] = "synAck";
        MessageType["Ack"] = "ack";
    })(MessageType || (MessageType = {}));
    var Resolution;
    (function (Resolution) {
        Resolution["Fulfilled"] = "fulfilled";
        Resolution["Rejected"] = "rejected";
    })(Resolution || (Resolution = {}));
    var ErrorCode;
    (function (ErrorCode) {
        ErrorCode["ConnectionDestroyed"] = "ConnectionDestroyed";
        ErrorCode["ConnectionTimeout"] = "ConnectionTimeout";
        ErrorCode["NoIframeSrc"] = "NoIframeSrc";
    })(ErrorCode || (ErrorCode = {}));
    var NativeErrorName;
    (function (NativeErrorName) {
        NativeErrorName["DataCloneError"] = "DataCloneError";
    })(NativeErrorName || (NativeErrorName = {}));
    var NativeEventType;
    (function (NativeEventType) {
        NativeEventType["Message"] = "message";
    })(NativeEventType || (NativeEventType = {}));

    var createDestructor = (localName, log) => {
        const callbacks = [];
        let destroyed = false;
        return {
            destroy(error) {
                if (!destroyed) {
                    destroyed = true;
                    log(`${localName}: Destroying connection`);
                    callbacks.forEach((callback) => {
                        callback(error);
                    });
                }
            },
            onDestroy(callback) {
                destroyed ? callback() : callbacks.push(callback);
            },
        };
    };

    var createLogger = (debug) => {
        /**
         * Logs a message if debug is enabled.
         */
        return (...args) => {
            if (debug) {
                console.log('[Penpal]', ...args); // eslint-disable-line no-console
            }
        };
    };

    const DEFAULT_PORT_BY_PROTOCOL = {
        'http:': '80',
        'https:': '443',
    };
    const URL_REGEX = /^(https?:)?\/\/([^/:]+)?(:(\d+))?/;
    const opaqueOriginSchemes = ['file:', 'data:'];
    /**
     * Converts a src value into an origin.
     */
    var getOriginFromSrc = (src) => {
        if (src && opaqueOriginSchemes.find((scheme) => src.startsWith(scheme))) {
            // The origin of the child document is an opaque origin and its
            // serialization is "null"
            // https://html.spec.whatwg.org/multipage/origin.html#origin
            return 'null';
        }
        // Note that if src is undefined, then srcdoc is being used instead of src
        // and we can follow this same logic below to get the origin of the parent,
        // which is the origin that we will need to use.
        const location = document.location;
        const regexResult = URL_REGEX.exec(src);
        let protocol;
        let hostname;
        let port;
        if (regexResult) {
            // It's an absolute URL. Use the parsed info.
            // regexResult[1] will be undefined if the URL starts with //
            protocol = regexResult[1] ? regexResult[1] : location.protocol;
            hostname = regexResult[2];
            port = regexResult[4];
        }
        else {
            // It's a relative path. Use the current location's info.
            protocol = location.protocol;
            hostname = location.hostname;
            port = location.port;
        }
        // If the port is the default for the protocol, we don't want to add it to the origin string
        // or it won't match the message's event.origin.
        const portSuffix = port && port !== DEFAULT_PORT_BY_PROTOCOL[protocol] ? `:${port}` : '';
        return `${protocol}//${hostname}${portSuffix}`;
    };

    /**
     * Converts an error object into a plain object.
     */
    const serializeError = ({ name, message, stack, }) => ({
        name,
        message,
        stack,
    });
    /**
     * Converts a plain object into an error object.
     */
    const deserializeError = (obj) => {
        const deserializedError = new Error();
        // @ts-ignore
        Object.keys(obj).forEach((key) => (deserializedError[key] = obj[key]));
        return deserializedError;
    };

    /**
     * Listens for "call" messages coming from the remote, executes the corresponding method, and
     * responds with the return value.
     */
    var connectCallReceiver = (info, serializedMethods, log) => {
        const { localName, local, remote, originForSending, originForReceiving, } = info;
        let destroyed = false;
        const handleMessageEvent = (event) => {
            if (event.source !== remote || event.data.penpal !== MessageType.Call) {
                return;
            }
            if (originForReceiving !== '*' && event.origin !== originForReceiving) {
                log(`${localName} received message from origin ${event.origin} which did not match expected origin ${originForReceiving}`);
                return;
            }
            const callMessage = event.data;
            const { methodName, args, id } = callMessage;
            log(`${localName}: Received ${methodName}() call`);
            const createPromiseHandler = (resolution) => {
                return (returnValue) => {
                    log(`${localName}: Sending ${methodName}() reply`);
                    if (destroyed) {
                        // It's possible to throw an error here, but it would need to be thrown asynchronously
                        // and would only be catchable using window.onerror. This is because the consumer
                        // is merely returning a value from their method and not calling any function
                        // that they could wrap in a try-catch. Even if the consumer were to catch the error,
                        // the value of doing so is questionable. Instead, we'll just log a message.
                        log(`${localName}: Unable to send ${methodName}() reply due to destroyed connection`);
                        return;
                    }
                    const message = {
                        penpal: MessageType.Reply,
                        id,
                        resolution,
                        returnValue,
                    };
                    if (resolution === Resolution.Rejected &&
                        returnValue instanceof Error) {
                        message.returnValue = serializeError(returnValue);
                        message.returnValueIsError = true;
                    }
                    try {
                        remote.postMessage(message, originForSending);
                    }
                    catch (err) {
                        // If a consumer attempts to send an object that's not cloneable (e.g., window),
                        // we want to ensure the receiver's promise gets rejected.
                        if (err.name === NativeErrorName.DataCloneError) {
                            const errorReplyMessage = {
                                penpal: MessageType.Reply,
                                id,
                                resolution: Resolution.Rejected,
                                returnValue: serializeError(err),
                                returnValueIsError: true,
                            };
                            remote.postMessage(errorReplyMessage, originForSending);
                        }
                        throw err;
                    }
                };
            };
            new Promise((resolve) => resolve(serializedMethods[methodName].apply(serializedMethods, args))).then(createPromiseHandler(Resolution.Fulfilled), createPromiseHandler(Resolution.Rejected));
        };
        local.addEventListener(NativeEventType.Message, handleMessageEvent);
        return () => {
            destroyed = true;
            local.removeEventListener(NativeEventType.Message, handleMessageEvent);
        };
    };

    let id = 0;
    /**
     * @return {number} A unique ID (not universally unique)
     */
    var generateId = () => ++id;

    const KEY_PATH_DELIMITER = '.';
    const keyPathToSegments = (keyPath) => keyPath ? keyPath.split(KEY_PATH_DELIMITER) : [];
    const segmentsToKeyPath = (segments) => segments.join(KEY_PATH_DELIMITER);
    const createKeyPath = (key, prefix) => {
        const segments = keyPathToSegments(prefix || '');
        segments.push(key);
        return segmentsToKeyPath(segments);
    };
    /**
     * Given a `keyPath`, set it to be `value` on `subject`, creating any intermediate
     * objects along the way.
     *
     * @param {Object} subject The object on which to set value.
     * @param {string} keyPath The key path at which to set value.
     * @param {Object} value The value to store at the given key path.
     * @returns {Object} Updated subject.
     */
    const setAtKeyPath = (subject, keyPath, value) => {
        const segments = keyPathToSegments(keyPath);
        segments.reduce((prevSubject, key, idx) => {
            if (typeof prevSubject[key] === 'undefined') {
                prevSubject[key] = {};
            }
            if (idx === segments.length - 1) {
                prevSubject[key] = value;
            }
            return prevSubject[key];
        }, subject);
        return subject;
    };
    /**
     * Given a dictionary of (nested) keys to function, flatten them to a map
     * from key path to function.
     *
     * @param {Object} methods The (potentially nested) object to serialize.
     * @param {string} prefix A string with which to prefix entries. Typically not intended to be used by consumers.
     * @returns {Object} An map from key path in `methods` to functions.
     */
    const serializeMethods = (methods, prefix) => {
        const flattenedMethods = {};
        Object.keys(methods).forEach((key) => {
            const value = methods[key];
            const keyPath = createKeyPath(key, prefix);
            if (typeof value === 'object') {
                // Recurse into any nested children.
                Object.assign(flattenedMethods, serializeMethods(value, keyPath));
            }
            if (typeof value === 'function') {
                // If we've found a method, expose it.
                flattenedMethods[keyPath] = value;
            }
        });
        return flattenedMethods;
    };
    /**
     * Given a map of key paths to functions, unpack the key paths to an object.
     *
     * @param {Object} flattenedMethods A map of key paths to functions to unpack.
     * @returns {Object} A (potentially nested) map of functions.
     */
    const deserializeMethods = (flattenedMethods) => {
        const methods = {};
        for (const keyPath in flattenedMethods) {
            setAtKeyPath(methods, keyPath, flattenedMethods[keyPath]);
        }
        return methods;
    };

    /**
     * Augments an object with methods that match those defined by the remote. When these methods are
     * called, a "call" message will be sent to the remote, the remote's corresponding method will be
     * executed, and the method's return value will be returned via a message.
     * @param {Object} callSender Sender object that should be augmented with methods.
     * @param {Object} info Information about the local and remote windows.
     * @param {Array} methodKeyPaths Key paths of methods available to be called on the remote.
     * @param {Promise} destructionPromise A promise resolved when destroy() is called on the penpal
     * connection.
     * @returns {Object} The call sender object with methods that may be called.
     */
    var connectCallSender = (callSender, info, methodKeyPaths, destroyConnection, log) => {
        const { localName, local, remote, originForSending, originForReceiving, } = info;
        let destroyed = false;
        log(`${localName}: Connecting call sender`);
        const createMethodProxy = (methodName) => {
            return (...args) => {
                log(`${localName}: Sending ${methodName}() call`);
                // This handles the case where the iframe has been removed from the DOM
                // (and therefore its window closed), the consumer has not yet
                // called destroy(), and the user calls a method exposed by
                // the remote. We detect the iframe has been removed and force
                // a destroy() immediately so that the consumer sees the error saying
                // the connection has been destroyed. We wrap this check in a try catch
                // because Edge throws an "Object expected" error when accessing
                // contentWindow.closed on a contentWindow from an iframe that's been
                // removed from the DOM.
                let iframeRemoved;
                try {
                    if (remote.closed) {
                        iframeRemoved = true;
                    }
                }
                catch (e) {
                    iframeRemoved = true;
                }
                if (iframeRemoved) {
                    destroyConnection();
                }
                if (destroyed) {
                    const error = new Error(`Unable to send ${methodName}() call due ` + `to destroyed connection`);
                    error.code = ErrorCode.ConnectionDestroyed;
                    throw error;
                }
                return new Promise((resolve, reject) => {
                    const id = generateId();
                    const handleMessageEvent = (event) => {
                        if (event.source !== remote ||
                            event.data.penpal !== MessageType.Reply ||
                            event.data.id !== id) {
                            return;
                        }
                        if (originForReceiving !== '*' &&
                            event.origin !== originForReceiving) {
                            log(`${localName} received message from origin ${event.origin} which did not match expected origin ${originForReceiving}`);
                            return;
                        }
                        const replyMessage = event.data;
                        log(`${localName}: Received ${methodName}() reply`);
                        local.removeEventListener(NativeEventType.Message, handleMessageEvent);
                        let returnValue = replyMessage.returnValue;
                        if (replyMessage.returnValueIsError) {
                            returnValue = deserializeError(returnValue);
                        }
                        (replyMessage.resolution === Resolution.Fulfilled ? resolve : reject)(returnValue);
                    };
                    local.addEventListener(NativeEventType.Message, handleMessageEvent);
                    const callMessage = {
                        penpal: MessageType.Call,
                        id,
                        methodName,
                        args,
                    };
                    remote.postMessage(callMessage, originForSending);
                });
            };
        };
        // Wrap each method in a proxy which sends it to the corresponding receiver.
        const flattenedMethods = methodKeyPaths.reduce((api, name) => {
            api[name] = createMethodProxy(name);
            return api;
        }, {});
        // Unpack the structure of the provided methods object onto the CallSender, exposing
        // the methods in the same shape they were provided.
        Object.assign(callSender, deserializeMethods(flattenedMethods));
        return () => {
            destroyed = true;
        };
    };

    /**
     * Handles an ACK handshake message.
     */
    var handleAckMessageFactory = (serializedMethods, childOrigin, originForSending, destructor, log) => {
        const { destroy, onDestroy } = destructor;
        let destroyCallReceiver;
        let receiverMethodNames;
        // We resolve the promise with the call sender. If the child reconnects
        // (for example, after refreshing or navigating to another page that
        // uses Penpal, we'll update the call sender with methods that match the
        // latest provided by the child.
        const callSender = {};
        return (event) => {
            if (childOrigin !== '*' && event.origin !== childOrigin) {
                log(`Parent: Handshake - Received ACK message from origin ${event.origin} which did not match expected origin ${childOrigin}`);
                return;
            }
            log('Parent: Handshake - Received ACK');
            const info = {
                localName: 'Parent',
                local: window,
                remote: event.source,
                originForSending: originForSending,
                originForReceiving: childOrigin,
            };
            // If the child reconnected, we need to destroy the prior call receiver
            // before setting up a new one.
            if (destroyCallReceiver) {
                destroyCallReceiver();
            }
            destroyCallReceiver = connectCallReceiver(info, serializedMethods, log);
            onDestroy(destroyCallReceiver);
            // If the child reconnected, we need to remove the methods from the
            // previous call receiver off the sender.
            if (receiverMethodNames) {
                receiverMethodNames.forEach((receiverMethodName) => {
                    delete callSender[receiverMethodName];
                });
            }
            receiverMethodNames = event.data.methodNames;
            const destroyCallSender = connectCallSender(callSender, info, receiverMethodNames, destroy, log);
            onDestroy(destroyCallSender);
            return callSender;
        };
    };

    /**
     * Handles a SYN handshake message.
     */
    var handleSynMessageFactory = (log, serializedMethods, childOrigin, originForSending) => {
        return (event) => {
            if (childOrigin !== '*' && event.origin !== childOrigin) {
                log(`Parent: Handshake - Received SYN message from origin ${event.origin} which did not match expected origin ${childOrigin}`);
                return;
            }
            log('Parent: Handshake - Received SYN, responding with SYN-ACK');
            const synAckMessage = {
                penpal: MessageType.SynAck,
                methodNames: Object.keys(serializedMethods),
            };
            event.source.postMessage(synAckMessage, originForSending);
        };
    };

    const CHECK_IFRAME_IN_DOC_INTERVAL = 60000;
    /**
     * Monitors for iframe removal and destroys connection if iframe
     * is found to have been removed from DOM. This is to prevent memory
     * leaks when the iframe is removed from the document and the consumer
     * hasn't called destroy(). Without this, event listeners attached to
     * the window would stick around and since the event handlers have a
     * reference to the iframe in their closures, the iframe would stick
     * around too.
     */
    var monitorIframeRemoval = (iframe, destructor) => {
        const { destroy, onDestroy } = destructor;
        const checkIframeInDocIntervalId = setInterval(() => {
            if (!iframe.isConnected) {
                clearInterval(checkIframeInDocIntervalId);
                destroy();
            }
        }, CHECK_IFRAME_IN_DOC_INTERVAL);
        onDestroy(() => {
            clearInterval(checkIframeInDocIntervalId);
        });
    };

    /**
     * Starts a timeout and calls the callback with an error
     * if the timeout completes before the stop function is called.
     */
    var startConnectionTimeout = (timeout, callback) => {
        let timeoutId;
        if (timeout !== undefined) {
            timeoutId = window.setTimeout(() => {
                const error = new Error(`Connection timed out after ${timeout}ms`);
                error.code = ErrorCode.ConnectionTimeout;
                callback(error);
            }, timeout);
        }
        return () => {
            clearTimeout(timeoutId);
        };
    };

    var validateIframeHasSrcOrSrcDoc = (iframe) => {
        if (!iframe.src && !iframe.srcdoc) {
            const error = new Error('Iframe must have src or srcdoc property defined.');
            error.code = ErrorCode.NoIframeSrc;
            throw error;
        }
    };

    /**
     * Attempts to establish communication with an iframe.
     */
    var connectToChild = (options) => {
        let { iframe, methods = {}, childOrigin, timeout, debug = false } = options;
        const log = createLogger(debug);
        const destructor = createDestructor('Parent', log);
        const { onDestroy, destroy } = destructor;
        if (!childOrigin) {
            validateIframeHasSrcOrSrcDoc(iframe);
            childOrigin = getOriginFromSrc(iframe.src);
        }
        // If event.origin is "null", the remote protocol is file: or data: and we
        // must post messages with "*" as targetOrigin when sending messages.
        // https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage#Using_window.postMessage_in_extensions
        const originForSending = childOrigin === 'null' ? '*' : childOrigin;
        const serializedMethods = serializeMethods(methods);
        const handleSynMessage = handleSynMessageFactory(log, serializedMethods, childOrigin, originForSending);
        const handleAckMessage = handleAckMessageFactory(serializedMethods, childOrigin, originForSending, destructor, log);
        const promise = new Promise((resolve, reject) => {
            const stopConnectionTimeout = startConnectionTimeout(timeout, destroy);
            const handleMessage = (event) => {
                if (event.source !== iframe.contentWindow || !event.data) {
                    return;
                }
                if (event.data.penpal === MessageType.Syn) {
                    handleSynMessage(event);
                    return;
                }
                if (event.data.penpal === MessageType.Ack) {
                    const callSender = handleAckMessage(event);
                    if (callSender) {
                        stopConnectionTimeout();
                        resolve(callSender);
                    }
                    return;
                }
            };
            window.addEventListener(NativeEventType.Message, handleMessage);
            log('Parent: Awaiting handshake');
            monitorIframeRemoval(iframe, destructor);
            onDestroy((error) => {
                window.removeEventListener(NativeEventType.Message, handleMessage);
                if (error) {
                    reject(error);
                }
            });
        });
        return {
            promise,
            destroy() {
                // Don't allow consumer to pass an error into destroy.
                destroy();
            },
        };
    };

    /* src\lib\components\WalletSelectorIcons.svelte generated by Svelte v3.50.1 */

    function add_css$2(target) {
    	append_styles(target, "svelte-boxns1", "button.svelte-boxns1{cursor:pointer;flex:0 0 auto;position:relative;opacity:0.8;height:100%;display:flex;align-items:center;justify-content:center}button.svelte-boxns1{color:inherit;background:none;border:none;margin:0;padding:0;font-size:1em;cursor:pointer}.img-container.svelte-boxns1{margin:calc(var(--spacing) / 2);width:1.6em;height:1.6em;position:relative}svg.svelte-boxns1{width:100%;height:100%;top:0;bottom:0;left:0;right:0;position:absolute}");
    }

    // (12:2) {#if icon === 'close'}
    function create_if_block_3(ctx) {
    	let div;
    	let div_transition;
    	let current;

    	return {
    		c() {
    			div = element("div");
    			div.innerHTML = `<svg v-if="icon === &#39;close&#39;" xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" viewBox="0 0 24 24" fill="currentColor" class="svelte-boxns1"><rect fill="none" height="24" width="24"></rect><path d="M3,3v18h18V3H3z M17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41L8.41,7L12,10.59L15.59,7L17,8.41L13.41,12 L17,15.59z"></path></svg>`;
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, fade, { delay: 100, duration: 100 }, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, fade, { delay: 100, duration: 100 }, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			if (detaching && div_transition) div_transition.end();
    		}
    	};
    }

    // (26:2) {#if icon === 'launch'}
    function create_if_block_2(ctx) {
    	let div;
    	let div_transition;
    	let current;

    	return {
    		c() {
    			div = element("div");
    			div.innerHTML = `<svg v-else-if="icon === &#39;launch&#39;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="svelte-boxns1"><path d="M0 0h24v24H0z" fill="none"></path><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"></path></svg>`;
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, fade, { delay: 100, duration: 100 }, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, fade, { delay: 100, duration: 100 }, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			if (detaching && div_transition) div_transition.end();
    		}
    	};
    }

    // (39:2) {#if icon === 'plug'}
    function create_if_block_1(ctx) {
    	let div;
    	let div_transition;
    	let current;

    	return {
    		c() {
    			div = element("div");
    			div.innerHTML = `<svg v-else-if="icon === &#39;plug&#39;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="svelte-boxns1"><path d="M0 0h24v24H0z" fill="none"></path><path d="M16.01 7L16 3h-2v4h-4V3H8v4h-.01C7 6.99 6 7.99 6 8.99v5.49L9.5 18v3h5v-3l3.5-3.51v-5.5c0-1-1-2-1.99-1.99z"></path></svg>`;
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, fade, { delay: 100, duration: 100 }, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, fade, { delay: 100, duration: 100 }, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			if (detaching && div_transition) div_transition.end();
    		}
    	};
    }

    // (52:2) {#if icon === 'unplug'}
    function create_if_block$1(ctx) {
    	let div;
    	let div_transition;
    	let current;

    	return {
    		c() {
    			div = element("div");
    			div.innerHTML = `<svg v-else-if="icon === &#39;unplug&#39;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="svelte-boxns1"><path d="M0 0h24v24H0V0z" fill="none"></path><path d="M18 14.49V9c0-1-1.01-2.01-2-2V3h-2v4h-4V3H8v2.48l9.51 9.5.49-.49zm-1.76 1.77L7.2 7.2l-.01.01L3.98 4 2.71 5.25l3.36 3.36C6.04 8.74 6 8.87 6 9v5.48L9.5 18v3h5v-3l.48-.48L19.45 22l1.26-1.28-4.47-4.46z"></path></svg>`;
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, fade, { delay: 100, duration: 100 }, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, fade, { delay: 100, duration: 100 }, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			if (detaching && div_transition) div_transition.end();
    		}
    	};
    }

    function create_fragment$2(ctx) {
    	let button;
    	let div;
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*icon*/ ctx[0] === 'close' && create_if_block_3();
    	let if_block1 = /*icon*/ ctx[0] === 'launch' && create_if_block_2();
    	let if_block2 = /*icon*/ ctx[0] === 'plug' && create_if_block_1();
    	let if_block3 = /*icon*/ ctx[0] === 'unplug' && create_if_block$1();
    	const default_slot_template = /*#slots*/ ctx[3].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

    	return {
    		c() {
    			button = element("button");
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			if (if_block2) if_block2.c();
    			t2 = space();
    			if (if_block3) if_block3.c();
    			t3 = space();
    			if (default_slot) default_slot.c();
    			attr(div, "class", "img-container svelte-boxns1");
    			attr(button, "class", "svelte-boxns1");
    		},
    		m(target, anchor) {
    			insert(target, button, anchor);
    			append(button, div);
    			if (if_block0) if_block0.m(div, null);
    			append(div, t0);
    			if (if_block1) if_block1.m(div, null);
    			append(div, t1);
    			if (if_block2) if_block2.m(div, null);
    			append(div, t2);
    			if (if_block3) if_block3.m(div, null);
    			append(button, t3);

    			if (default_slot) {
    				default_slot.m(button, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen(button, "keypress", /*keypress_handler*/ ctx[4]),
    					listen(button, "click", /*click_handler*/ ctx[5])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (/*icon*/ ctx[0] === 'close') {
    				if (if_block0) {
    					if (dirty & /*icon*/ 1) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_3();
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div, t0);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*icon*/ ctx[0] === 'launch') {
    				if (if_block1) {
    					if (dirty & /*icon*/ 1) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_2();
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div, t1);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (/*icon*/ ctx[0] === 'plug') {
    				if (if_block2) {
    					if (dirty & /*icon*/ 1) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_1();
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(div, t2);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if (/*icon*/ ctx[0] === 'unplug') {
    				if (if_block3) {
    					if (dirty & /*icon*/ 1) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block$1();
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(div, null);
    				}
    			} else if (if_block3) {
    				group_outros();

    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
    				});

    				check_outros();
    			}

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 4)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[2],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[2])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[2], dirty, null),
    						null
    					);
    				}
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			transition_in(if_block3);
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			transition_out(if_block3);
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(button);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	let { icon } = $$props;
    	const dispatch = createEventDispatcher();
    	const keypress_handler = () => dispatch('click', 'detail value');
    	const click_handler = () => dispatch('click', 'detail value');

    	$$self.$$set = $$props => {
    		if ('icon' in $$props) $$invalidate(0, icon = $$props.icon);
    		if ('$$scope' in $$props) $$invalidate(2, $$scope = $$props.$$scope);
    	};

    	return [icon, dispatch, $$scope, slots, keypress_handler, click_handler];
    }

    class WalletSelectorIcons extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$1, create_fragment$2, safe_not_equal, { icon: 0 }, add_css$2);
    	}
    }

    /* src\lib\assets\Logo.svelte generated by Svelte v3.50.1 */

    function add_css$1(target) {
    	append_styles(target, "svelte-1es2uhx", "svg.svelte-1es2uhx{width:auto;height:2em;display:block}");
    }

    function create_fragment$1(ctx) {
    	let div;

    	return {
    		c() {
    			div = element("div");
    			div.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1440 1440" width="100" height="100" class="svelte-1es2uhx"><defs></defs><defs><path id="a" d="M258 1321c9-304 6-917 0-1191 52-161 1082-280 1083 330 1 609-618 545-701 538-2 67-2 208 0 422-222 56-349 23-382-99z"></path><path id="c" d="M1122 560c-107 223-284 293-529 209l-38 79c-1 2-4 2-5-1l-99-287c-1-5 1-11 6-13l273-106c3-1 6 2 5 5l-36 75c70 126 211 139 423 39z"></path><path id="d" d="M451 447c107-223 284-292 529-209l38-78c1-3 5-2 5 0l99 288c1 5-1 10-6 12L843 567c-3 1-6-3-5-6l37-75c-71-126-212-139-424-39z"></path><radialGradient id="b" cx="992.3" cy="174.2" r="1312.8" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#69ed66"></stop><stop offset="100%" stop-color="#279c19"></stop></radialGradient></defs><use fill="url(#b)" xlink:href="#a"></use><use fill="#fff" xlink:href="#c"></use><use fill="#fff" xlink:href="#d"></use></svg>`;
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    class Logo extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, null, create_fragment$1, safe_not_equal, {}, add_css$1);
    	}
    }

    /* src\lib\ConnectorInside.svelte generated by Svelte v3.50.1 */

    const { window: window_1 } = globals;

    function add_css(target) {
    	append_styles(target, "svelte-12a3ajw", "div.svelte-12a3ajw{--spacing:1em}.connector-container.svelte-12a3ajw{padding:1.618em}div.svelte-12a3ajw{--background:#161616}.top.svelte-12a3ajw{display:flex;justify-content:space-between;align-items:center}iframe.svelte-12a3ajw{border:none;width:100%;height:100%}.iframe.svelte-12a3ajw{display:flex;height:100%;min-height:500px}.logo.svelte-12a3ajw{flex:0 0 auto;position:relative;opacity:1;height:100%;display:flex;align-items:center;justify-content:center;padding:calc(var(--spacing) / 2)}.url.svelte-12a3ajw{padding:var(--spacing);padding-right:0;flex:1 1 0;min-width:0;outline:none;background-color:var(--background)}.green-line.svelte-12a3ajw{border-bottom:4px solid #0eff02;margin-left:var(--spacing);flex:1;position:relative;top:-8px}.actions.svelte-12a3ajw{display:flex}.actions.svelte-12a3ajw:last-child{padding-right:calc(var(--spacing) / 2)}.action.dim.svelte-12a3ajw{opacity:0.9;color:#e0f7fa}.connected.svelte-12a3ajw{color:greenyellow;text-shadow:1px 1px 3px black}.disconnected.svelte-12a3ajw{color:#e0f7fa;text-shadow:1px 1px 3px black}.url-input-container.svelte-12a3ajw{display:flex;flex-direction:column;width:100%}input.svelte-12a3ajw{flex:1 1 0;color:whitesmoke;background:none;border:none;margin:0;padding:0;font-size:0.95em;min-width:15ch}");
    }

    // (120:3) {#if wallet?.address || inputUrl}
    function create_if_block(ctx) {
    	let div;
    	let iconbutton;
    	let div_class_value;
    	let div_transition;
    	let current;
    	iconbutton = new WalletSelectorIcons({ props: { icon: /*popupIcon*/ ctx[11] } });
    	iconbutton.$on("keypress", /*togglePopup*/ ctx[14]);
    	iconbutton.$on("click", /*togglePopup*/ ctx[14]);

    	return {
    		c() {
    			div = element("div");
    			create_component(iconbutton.$$.fragment);
    			attr(div, "class", div_class_value = "" + (null_to_empty(!/*wallet*/ ctx[0]?.keepPopup ? 'action dim' : 'action') + " svelte-12a3ajw"));
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			mount_component(iconbutton, div, null);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const iconbutton_changes = {};
    			if (dirty & /*popupIcon*/ 2048) iconbutton_changes.icon = /*popupIcon*/ ctx[11];
    			iconbutton.$set(iconbutton_changes);

    			if (!current || dirty & /*wallet*/ 1 && div_class_value !== (div_class_value = "" + (null_to_empty(!/*wallet*/ ctx[0]?.keepPopup ? 'action dim' : 'action') + " svelte-12a3ajw"))) {
    				attr(div, "class", div_class_value);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(iconbutton.$$.fragment, local);

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, fade, { delay: 100, duration: 100 }, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o(local) {
    			transition_out(iconbutton.$$.fragment, local);
    			if (!div_transition) div_transition = create_bidirectional_transition(div, fade, { delay: 100, duration: 100 }, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			destroy_component(iconbutton);
    			if (detaching && div_transition) div_transition.end();
    		}
    	};
    }

    // (136:4) <IconButton       icon={connectionIcon}       on:keypress={() => {        wallet?.address ? disconnect() : connect();       }}       on:click={() => {        wallet?.address ? disconnect() : connect();       }}       >
    function create_default_slot(ctx) {
    	let span;

    	let t_value = (/*data*/ ctx[9].loading || !/*src*/ ctx[7]
    	? 'Loading...'
    	: 'Load') + "";

    	let t;
    	let span_class_value;

    	return {
    		c() {
    			span = element("span");
    			t = text(t_value);

    			attr(span, "class", span_class_value = "" + (null_to_empty((/*wallet*/ ctx[0]?.address)
    			? ' connected '
    			: ' disconnected ') + " svelte-12a3ajw"));
    		},
    		m(target, anchor) {
    			insert(target, span, anchor);
    			append(span, t);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*data, src*/ 640 && t_value !== (t_value = (/*data*/ ctx[9].loading || !/*src*/ ctx[7]
    			? 'Loading...'
    			: 'Load') + "")) set_data(t, t_value);

    			if (dirty & /*wallet*/ 1 && span_class_value !== (span_class_value = "" + (null_to_empty((/*wallet*/ ctx[0]?.address)
    			? ' connected '
    			: ' disconnected ') + " svelte-12a3ajw"))) {
    				attr(span, "class", span_class_value);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(span);
    		}
    	};
    }

    function create_fragment(ctx) {
    	let div6;
    	let div4;
    	let a;
    	let div0;
    	let logo;
    	let t0;
    	let div1;
    	let input;
    	let t1;
    	let span;
    	let t2;
    	let div3;
    	let t3;
    	let div2;
    	let iconbutton;
    	let div2_class_value;
    	let div4_resize_listener;
    	let t4;
    	let div5;
    	let iframe_1;
    	let iframe_1_src_value;
    	let div5_resize_listener;
    	let current;
    	let mounted;
    	let dispose;
    	logo = new Logo({});
    	let if_block = (/*wallet*/ ctx[0]?.address || /*inputUrl*/ ctx[1]) && create_if_block(ctx);

    	iconbutton = new WalletSelectorIcons({
    			props: {
    				icon: /*connectionIcon*/ ctx[10],
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			}
    		});

    	iconbutton.$on("keypress", /*keypress_handler*/ ctx[22]);
    	iconbutton.$on("click", /*click_handler*/ ctx[23]);

    	return {
    		c() {
    			div6 = element("div");
    			div4 = element("div");
    			a = element("a");
    			div0 = element("div");
    			create_component(logo.$$.fragment);
    			t0 = space();
    			div1 = element("div");
    			input = element("input");
    			t1 = space();
    			span = element("span");
    			t2 = space();
    			div3 = element("div");
    			if (if_block) if_block.c();
    			t3 = space();
    			div2 = element("div");
    			create_component(iconbutton.$$.fragment);
    			t4 = space();
    			div5 = element("div");
    			iframe_1 = element("iframe");
    			attr(div0, "class", "actions logo svelte-12a3ajw");
    			attr(a, "href", "https://PeerPiper.io");
    			attr(a, "target", "_blank");
    			attr(a, "rel", "noreferrer");
    			attr(input, "class", "url svelte-12a3ajw");
    			attr(input, "placeholder", placeholder);
    			attr(span, "class", "green-line svelte-12a3ajw");
    			attr(div1, "class", "url-input-container svelte-12a3ajw");

    			attr(div2, "class", div2_class_value = "" + (null_to_empty((/*data*/ ctx[9]?.loading)
    			? 'action dim'
    			: /*wallet*/ ctx[0]?.address
    				? ' connected '
    				: ' disconnected ') + " svelte-12a3ajw"));

    			attr(div3, "class", "actions svelte-12a3ajw");
    			attr(div4, "class", "top svelte-12a3ajw");
    			set_style(div4, "--topOffsetHeight", /*topOffsetHeight*/ ctx[2]);
    			add_render_callback(() => /*div4_elementresize_handler*/ ctx[24].call(div4));
    			attr(iframe_1, "title", "Web Wallet");
    			if (!src_url_equal(iframe_1.src, iframe_1_src_value = /*src*/ ctx[7])) attr(iframe_1, "src", iframe_1_src_value);
    			attr(iframe_1, "allow", "clipboard-read 'self' 'src'; clipboard-write 'self' 'src';");
    			attr(iframe_1, "class", "svelte-12a3ajw");
    			attr(div5, "class", "iframe svelte-12a3ajw");
    			set_style(div5, "height", "calc(" + /*iframeParentHeight*/ ctx[4] + "px + 18px)");
    			add_render_callback(() => /*div5_elementresize_handler*/ ctx[26].call(div5));
    			attr(div6, "class", "connector-container svelte-12a3ajw");
    		},
    		m(target, anchor) {
    			insert(target, div6, anchor);
    			append(div6, div4);
    			append(div4, a);
    			append(a, div0);
    			mount_component(logo, div0, null);
    			append(div4, t0);
    			append(div4, div1);
    			append(div1, input);
    			set_input_value(input, /*inputUrl*/ ctx[1]);
    			append(div1, t1);
    			append(div1, span);
    			append(div4, t2);
    			append(div4, div3);
    			if (if_block) if_block.m(div3, null);
    			append(div3, t3);
    			append(div3, div2);
    			mount_component(iconbutton, div2, null);
    			div4_resize_listener = add_resize_listener(div4, /*div4_elementresize_handler*/ ctx[24].bind(div4));
    			append(div6, t4);
    			append(div6, div5);
    			append(div5, iframe_1);
    			/*iframe_1_binding*/ ctx[25](iframe_1);
    			div5_resize_listener = add_resize_listener(div5, /*div5_elementresize_handler*/ ctx[26].bind(div5));
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen(window_1, "keydown", /*handleKeydown*/ ctx[15]),
    					listen(input, "focus", /*focus_handler*/ ctx[19]),
    					listen(input, "blur", /*blur_handler*/ ctx[20]),
    					listen(input, "input", /*input_input_handler*/ ctx[21])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*inputUrl*/ 2 && input.value !== /*inputUrl*/ ctx[1]) {
    				set_input_value(input, /*inputUrl*/ ctx[1]);
    			}

    			if (/*wallet*/ ctx[0]?.address || /*inputUrl*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*wallet, inputUrl*/ 3) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div3, t3);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			const iconbutton_changes = {};
    			if (dirty & /*connectionIcon*/ 1024) iconbutton_changes.icon = /*connectionIcon*/ ctx[10];

    			if (dirty & /*$$scope, wallet, data, src*/ 536871553) {
    				iconbutton_changes.$$scope = { dirty, ctx };
    			}

    			iconbutton.$set(iconbutton_changes);

    			if (!current || dirty & /*data, wallet*/ 513 && div2_class_value !== (div2_class_value = "" + (null_to_empty((/*data*/ ctx[9]?.loading)
    			? 'action dim'
    			: /*wallet*/ ctx[0]?.address
    				? ' connected '
    				: ' disconnected ') + " svelte-12a3ajw"))) {
    				attr(div2, "class", div2_class_value);
    			}

    			if (!current || dirty & /*topOffsetHeight*/ 4) {
    				set_style(div4, "--topOffsetHeight", /*topOffsetHeight*/ ctx[2]);
    			}

    			if (!current || dirty & /*src*/ 128 && !src_url_equal(iframe_1.src, iframe_1_src_value = /*src*/ ctx[7])) {
    				attr(iframe_1, "src", iframe_1_src_value);
    			}

    			if (!current || dirty & /*iframeParentHeight*/ 16) {
    				set_style(div5, "height", "calc(" + /*iframeParentHeight*/ ctx[4] + "px + 18px)");
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(logo.$$.fragment, local);
    			transition_in(if_block);
    			transition_in(iconbutton.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(logo.$$.fragment, local);
    			transition_out(if_block);
    			transition_out(iconbutton.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div6);
    			destroy_component(logo);
    			if (if_block) if_block.d();
    			destroy_component(iconbutton);
    			div4_resize_listener();
    			/*iframe_1_binding*/ ctx[25](null);
    			div5_resize_listener();
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    let placeholder = 'Enter Wallet Url';

    function instance($$self, $$props, $$invalidate) {
    	let popupIcon;
    	let connectionIcon;
    	let { wallet = null } = $$props;
    	let { inputUrl = 'https://peerpiper.github.io/iframe-wallet-sdk/' } = $$props;
    	let { topOffsetHeight = 0 } = $$props;
    	let { topOffsetWidth = 0 } = $$props;
    	let { iframeParentHeight = 0 } = $$props;
    	let { iframeParentWidth = 0 } = $$props;
    	let iframeOffsetWidth;
    	let { show } = $$props;
    	let { hide } = $$props;
    	const dispatch = createEventDispatcher();
    	let src;
    	let iframe;
    	let focused;

    	const data = {
    		loading: true, // load right away
    		
    	};

    	// cache user's preferred wallet URL to their browser
    	onMount(async () => {
    		connect();
    	});

    	async function handleIframeLoad() {
    		// console.log('Iframe loaded');
    		$$invalidate(9, data.loading = false, data);

    		let pending;

    		const connection = connectToChild({
    			// The iframe to which a connection should be made.
    			iframe,
    			// Methods the parent is exposing to the child.
    			methods: {
    				setIframeParentHeight(height) {
    					$$invalidate(4, iframeParentHeight = height);
    				},
    				setIframeParentWidth(width) {
    					// console.log('Rx width', width);
    					$$invalidate(16, iframeParentWidth = width);
    				},
    				show() {
    					show();
    				},
    				hide() {
    					console.log('hiding', { hide });
    					hide();
    				},
    				// walletReady gets called from wallet-sdk when
    				// connectionsReady is called which is called when
    				// loadedKeys is fired
    				// which only happens when the keys are loaded
    				walletReady() {
    					$$invalidate(0, wallet = pending); // when using svelte bind:wallet
    					dispatch('walletReady', { wallet }); // when using vanilla JS

    					// overwrite any other arweave wallets on the window object
    					// @ts-ignore
    					window.arweaveWallet = wallet.arweaveWalletAPI;

    					if (wallet) {
    						// hack: await 250 milliseconds
    						setTimeout(
    							() => {
    								hide();
    							},
    							250
    						);
    					}

    					return true;
    				}
    			}
    		});

    		pending = await connection.promise;
    		show();
    	}

    	const connect = () => {
    		if (src === inputUrl) return;
    		$$invalidate(7, src = '');
    		$$invalidate(7, src = inputUrl);
    		$$invalidate(9, data.loading = true, data);
    		dispatch('inputUrl', inputUrl); // when using vanilla JS
    	};

    	const disconnect = () => wallet.disconnect();
    	const togglePopup = () => window.open(inputUrl);

    	function handleKeydown(event) {
    		if (event.key === 'Enter' && focused) connect();
    	}

    	const focus_handler = () => $$invalidate(8, focused = true);
    	const blur_handler = () => $$invalidate(8, focused = false);

    	function input_input_handler() {
    		inputUrl = this.value;
    		$$invalidate(1, inputUrl);
    	}

    	const keypress_handler = () => {
    		(wallet?.address) ? disconnect() : connect();
    	};

    	const click_handler = () => {
    		(wallet?.address) ? disconnect() : connect();
    	};

    	function div4_elementresize_handler() {
    		topOffsetHeight = this.offsetHeight;
    		topOffsetWidth = this.offsetWidth;
    		$$invalidate(2, topOffsetHeight);
    		$$invalidate(3, topOffsetWidth);
    	}

    	function iframe_1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			iframe = $$value;
    			$$invalidate(6, iframe);
    		});
    	}

    	function div5_elementresize_handler() {
    		iframeOffsetWidth = this.offsetWidth;
    		$$invalidate(5, iframeOffsetWidth);
    	}

    	$$self.$$set = $$props => {
    		if ('wallet' in $$props) $$invalidate(0, wallet = $$props.wallet);
    		if ('inputUrl' in $$props) $$invalidate(1, inputUrl = $$props.inputUrl);
    		if ('topOffsetHeight' in $$props) $$invalidate(2, topOffsetHeight = $$props.topOffsetHeight);
    		if ('topOffsetWidth' in $$props) $$invalidate(3, topOffsetWidth = $$props.topOffsetWidth);
    		if ('iframeParentHeight' in $$props) $$invalidate(4, iframeParentHeight = $$props.iframeParentHeight);
    		if ('iframeParentWidth' in $$props) $$invalidate(16, iframeParentWidth = $$props.iframeParentWidth);
    		if ('show' in $$props) $$invalidate(17, show = $$props.show);
    		if ('hide' in $$props) $$invalidate(18, hide = $$props.hide);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*iframe*/ 64) {
    			iframe && iframe.addEventListener('load', handleIframeLoad);
    		}

    		if ($$self.$$.dirty & /*wallet*/ 1) {
    			$$invalidate(11, popupIcon = (wallet?.keepPopup) ? 'close' : 'launch');
    		}

    		if ($$self.$$.dirty & /*wallet*/ 1) {
    			$$invalidate(10, connectionIcon = (wallet?.address) ? 'unplug' : 'plug');
    		}

    		if ($$self.$$.dirty & /*iframeOffsetWidth, wallet*/ 33) {
    			iframeOffsetWidth && wallet && wallet?.setWidth(iframeOffsetWidth);
    		}
    	};

    	return [
    		wallet,
    		inputUrl,
    		topOffsetHeight,
    		topOffsetWidth,
    		iframeParentHeight,
    		iframeOffsetWidth,
    		iframe,
    		src,
    		focused,
    		data,
    		connectionIcon,
    		popupIcon,
    		connect,
    		disconnect,
    		togglePopup,
    		handleKeydown,
    		iframeParentWidth,
    		show,
    		hide,
    		focus_handler,
    		blur_handler,
    		input_input_handler,
    		keypress_handler,
    		click_handler,
    		div4_elementresize_handler,
    		iframe_1_binding,
    		div5_elementresize_handler
    	];
    }

    class ConnectorInside extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(
    			this,
    			options,
    			instance,
    			create_fragment,
    			safe_not_equal,
    			{
    				wallet: 0,
    				inputUrl: 1,
    				topOffsetHeight: 2,
    				topOffsetWidth: 3,
    				iframeParentHeight: 4,
    				iframeParentWidth: 16,
    				show: 17,
    				hide: 18
    			},
    			add_css
    		);
    	}
    }

    return ConnectorInside;

}));
