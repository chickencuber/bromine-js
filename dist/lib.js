
const Any = v=>v;

class CustomElt extends HTMLElement{
    constructor() {
        super()
        /**
            * @type {((...args: any[])=>any)[]}
            */
            this.functions = [];
        /**
            * @type {Signal<any>[]}
            */
            this.signals = [];
        /**
            * @type {(()=>void)[]}
            */
            this.cleanups = [];
    }
}

/**
    * @param {CustomElt} elt 
    * @returns {SignalFunction}
    */
    function createSignalFn(elt) {
        return function(d, force = Any) {
            let value = force(d);
            /**
                * @type {Signal<any>}
                */
                const s = (v) => {
                    if(v === undefined) {
                        return value;
                    }
                    const old = value;
                    if(typeof v === "function") {
                        value = force(v(value));
                    } else {
                        value = force(v);
                    }
                    if(Object.is(value, old)) {
                        return;
                    }
                    for(const change of s.onChange) {
                        change(value);
                    }
                } 
            s.onChange = []; 
            s.type = "signal";
            elt.signals.push(s);
            return s;
        }
    }

/**
    * @param {CustomElt} elt 
    * @param {State} state 
    * @returns {DerivedFunction}
    */
    function createDerivedFn(elt, state) {
        return function(fn, listen=[]) {
            const s = state.useSignal(0)
            state.useEffect(() => {
                s(fn())
            }, listen)
            return s;
        }
    }


/**
    * @param {CustomElt} elt 
    * @param {State} state 
    * @returns {EffectFunction}
    */
    function createEffectFn(elt, state) {
        return function(fn, listen=[]) {
            fn()
            for(const l of listen) {
                const d = () => {
                    fn()
                }
                l.onChange.push(d)
                elt.cleanups.push(() => {
                    l.onChange = l.onChange.filter(v=>v!==d)
                })
            }
        }
    }

/**
    * @param {CustomElt} elt 
    * @param {State} state 
    * @returns {ChildFunction}
    */
    function createChildFn(elt, state) {
        return ({recursive=true, watchtext=true}={}) => {
            const h = state.useSignal(Array.from(elt.children));
            const observer = new MutationObserver(() => {
                h(Array.from(elt.children))
            });
            observer.observe(elt, { childList: true, subtree: recursive, characterData: watchtext});
            elt.cleanups.push(()=>observer.disconnect())
            return h;
        }
    }
/**
    * @param {CustomElt} elt 
    * @param {State} state 
    * @returns {StyleFunction}
    */
    function createStyleFn(elt, state) {
        return (style, {force=Any, timeout=50, def=""}={}) => {
            const gets = () => {
                const v = getComputedStyle(elt).getPropertyValue(style);
                if(v === "") return def;
                return v;
            }
            const h = state.useSignal(gets(), force);
            const i = setInterval(() => {
                h(gets()) 
            }, timeout);
            elt.cleanups.push(()=>clearInterval(i))
            return h;
        }
    }

function elt(tag, properties = []) {
    return function(fn) {
        class NE extends CustomElt {
            constructor() {
                super();
                this.attachShadow({ mode: 'open' });
                /**
                    * @type {State}
                    */
                    this.state = {}
                this.props = {}

                this.state.useSignal = createSignalFn(this);
                this.state.useEffect = createEffectFn(this, this.state);
                this.state.useDerived = createDerivedFn(this, this.state);
                this.state.useChildren = createChildFn(this, this.state);
                this.state.useStyle = createStyleFn(this, this.state);
                this.state.onUnmount = (fn)=>this.cleanups.push(fn);

                if(Array.isArray(properties)) {
                    for (const prop of properties) {
                        this.props[prop] = this.state.useSignal(this.getAttribute(prop))
                        this.props[prop].onChange.push((v) => {
                            this.setAttribute(prop, v)
                        })
                    }
                } else {
                    for (const prop of Object.keys(properties)) {
                        this.props[prop] = this.state.useSignal(this.getAttribute(prop), properties[prop])
                        this.props[prop].onChange.push((v) => {
                            this.setAttribute(prop, v)
                        })
                    }
                }
            }
            connectedCallback() {
                this.shadowRoot.append(fn.call(this, {
                    props: this.props, 
                    state: this.state,
                }).toHTML(this));
            }
            disconnectedCallback() {
                for (const cleanup of this.cleanups) {
                    cleanup();
                }
            }
            static get observedAttributes() { 
                if(Array.isArray(properties)) {
                    return properties;
                } else {
                    return Object.keys(properties)
                }
            }
            attributeChangedCallback(name, oldValue, newValue) {
                if(oldValue == newValue) return;
                this.props[name](newValue);
            }
        }
        customElements.define(tag, NE)
    }
}

function html(literalarr, ...args) {
    return new HTMLString(literalarr, args)
}


class HTMLString {
    constructor(literalarr, args) {
        /**
            * @type {string[]}
            */
            this.literalarr = literalarr
        /**
            * @type {any[]}
            */
            this.args = args
    }
    /**
        * @returns {string}
        * @param {CustomElt} element 
        */
        getString(element, t) {
            switch (typeof t) {
                case "string":
                case "number":
                case "bigint":
                case "boolean":
                    return t.toString();
                case "undefined":
                    return "undefined";
                case "function":
                    if(t.type === "signal") {
                        return `__signal__${element.signals.indexOf(t)}__` 
                    } else {
                        element.functions.push(t)
                        return `"this.celt.functions[${element.functions.length-1}](event)"` 
                    }
                default:
                    throw new Error("unexpected type in html literal")
            }
        }
    /**
        * @param {CustomElt} element 
        */
        toHTML(element) {
            let str = "";
            for(const lit of this.literalarr) {
                str += lit;
                if(this.args.length > 0) {
                    const t = this.args.shift();
                    str += this.getString(element, t)
                }
            }
            const voidElements = [
                "area","base","br","col","embed","hr","img","input","link","meta",
                "source","track","wbr"
            ];
            str = str
                .replaceAll("<>", "<br-data-fragment>")
                .replaceAll("</>", "</br-data-fragment>")
                .replaceAll("< />", "<br-data-fragment/>")
                .replaceAll(/<([a-zA-Z0-9-_]+)([^>]*)\/>/g, (match, tag, attrs) => {
                    if(voidElements.includes(tag.toLowerCase())) return match;
                    return `<${tag}${attrs}></${tag}>`;
                });
            const temp = document.createElement("div");
            temp.innerHTML = str;
            if(temp.children.length > 1) {
                console.warn("any other children in the element will be ignored, consider using `<>…</>`")
            }
            return this.crawl(element, temp.children[0]);
        }
    /**
        * @param {CustomElt} element 
        * @param {HTMLElement} p 
        */
        crawl(element, p) {
            p.celt = element;
            const re = /__signal__(\d+)__/;
            const re2 = /__signal__\d+__/;
            for (const attr of p.attributes) {
                const match = re.exec(attr.value);
                if(match) {
                    const idx = parseInt(match[1])
                    if(element.signals[idx]){
                        const split = attr.value.split(re2).filter(v=>v !== "");
                        if(split.length > 2) {
                            //TASK(20260401-123729-782-n6-564): make it support more than one attribute in one signal
                            console.warn("attributes dont currently support more than one signal")
                        }
                        function set(v) {
                            if(split.length === 0) {
                                p.setAttribute(attr.name, v)
                            } else if(split.length === 1) {
                                p.setAttribute(attr.name, split[0]+v)
                            } else {
                                p.setAttribute(attr.name, split.join(v))
                            }
                        }
                        element.signals[idx].onChange.push((v)=>{
                            set(v)
                        })
                        set(element.signals[idx]());
                        if(split.length === 0) { //only a signal as the attribute, no other text mixed in
                                const observer = new MutationObserver((mutations) => {
                                    for (const m of mutations) {
                                        const newValue = m.target.getAttribute(m.attributeName);
                                        if(Object.is(newValue, element.signals[idx]())) {
                                            return;
                                        }
                                        element.signals[idx](newValue)
                                    }
                                });
                            element.cleanups.push(() => observer.disconnect())
                            observer.observe(p, {
                                attributes: true,
                                attributeFilter: [attr.name]
                            });
                        }
                    }
                }
            }
            for(const t of Array.from(p.childNodes)) {
                if(t.nodeType === Node.TEXT_NODE) {
                    let current = t;
                    let match;

                    while ((match = re.exec(current.textContent)) !== null) {
                        const start = match.index;

                        const afterMatch = current.splitText(start);

                        const rest = afterMatch.splitText(match[0].length);

                        const idx = parseInt(match[1]);
                        if (element.signals[idx]) {
                            const textNode = afterMatch;
                            element.signals[idx].onChange.push((v) => {
                                textNode.textContent = v;
                            });

                            textNode.textContent = element.signals[idx]();
                        }

                        current = rest;
                    }
                } else if (t.nodeType === Node.ELEMENT_NODE){
                    this.crawl(element, t)
                }
            }
            return p;
        }
}

elt("br-data-fragment")(function() {
    return html`<slot></slot>`
})
elt("br-if", {
    value: v=>v=="false"?false: Boolean(v), 
})(function({
    props: {value},
    state,
}) {
    const slot = state.useDerived(()=>value()?"then":"else", [value])
    return html`<slot name="${slot}"></slot>`
})
