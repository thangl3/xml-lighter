(function (global, factory) {
    const xmlFormater = factory();

    function loadXMLDOM (holderElementId, xmlDom, options) {
        options = options || {};

        const xmlHolderElement = document.getElementById(holderElementId);

        if (xmlDom || xmlHolderElement) {
            // If in block of parent has content like `xml` or other... clear all them
            xmlFormater.empty(xmlHolderElement);

            let render = xmlFormater.init(options);
            const container = render(xmlDom.documentElement);

            xmlHolderElement.appendChild(container);
        }
    }

    function loadXMLString (holderElementId, xmlString, options) {
        const xmlDom = xmlFormater.convertToXmlDOM(xmlString);

        loadXMLDOM(holderElementId, xmlDom, options);
    }

    // exports
    if (typeof define === 'function' && define.amd) { // AMD
        define(['loadXMLDOM', 'loadXMLString'], function () {
            return {
                loadXMLDOM,
                loadXMLString
            };
        });
    } else { // for call on browser
        global.loadXMLDOM = loadXMLDOM;
        global.loadXMLString = loadXMLString;
    }


}(window, function () {
    'use strict';

    const constants = {
        // Attribute of a node tag
        switchMorePrefix    : 'more-',
        switchLessPrefix    : 'less-',
        switchMoreAction    : 'show',
        switchLessAction    : 'hide',

        // css class name
        classContainer          : 'xml-display',
        classNodeContainer      : 'xml',
        classInline             : 'inline-flex',
        classNodeName           : 'node-name',
        classNodeValue          : 'node-value',
        classSwitcher           : 'switcher',
        classBracket            : 'bracket',
        classBracketOpen        : 'bracket-open',
        classBracketClose       : 'bracket-close',
        classBracketShortClose  : 'bracket-short-close',
        classEquals             : 'equals',
        classAttributeName      : 'node-attribute-name',
        classAttributeValue     : 'node-attribute-value',

        classDivContainer       : 'node',
        classNodeParent         : 'node-parent',
        classNodeCollapsed      : 'node-collapsed',
        classNodeUncollapse     : 'node-uncollapse',

        classSwitcherCollapsed  : 'collapsed',
        classAddLineCode        : 'line-code',
        classOneLineCode        : 'one-line-code',
        //classLineNumber         : 'line-number'
    };

    const xmlFormater = {
        defaultSettings: {
            containerTag: 'div',
            containerPosition: 'relative', // css position attributes liek that: "relative", "static", "fixed" or "absolute"
            indentSpace: 4,
            pxOfOnceSpace: 6, // each once space (tab) equals 7px
            removeComment: true,
            nodeLowerCase: false,
            nodeUpperCase: false,
            inline: true,
            useShortTag: true,
            //lineNumber: false
        },

        init: function (userSettings) {
            // Override default settings
            Object.assign(this.defaultSettings, userSettings || {});

            const _this = this;
            const settings = _this.defaultSettings;

            // This `id` indentify where the child nodes is?
            // Purpose `select` for toggle...
            let idRender = 1;
            let startWithIndentSpace = 0;

            function createElement(tagName, cssClass, position, isIndent) {
                tagName = tagName || settings.containerTag;

                const containerElement = document.createElement(tagName);

                // set attribute
                if (cssClass !== false) {
                    if (cssClass instanceof Array) {
                        let i, n;
                        for (i = 0; i < (n = cssClass.length); i++) {
                            containerElement.classList.add(cssClass[i]);
                        }
                    } else {
                        containerElement.className = cssClass || constants.classDivContainer;
                    }
                }
                
                if (position != false) {
                    containerElement.style.position = position || settings.containerPosition;
                }

                if (isIndent !== false) {
                    containerElement.style.marginLeft = computedNestingIndent(startWithIndentSpace);
                }

                return containerElement;
            }

            function addClass(element, className) {
                element.classList.add(className);
            }

            function createTextNode(text, cssClass, tag) {
                const childNode = document.createElement(tag || 'span');

                if (cssClass instanceof Array) {
                    let i, n;
                    for (i = 0; i < (n = cssClass.length); i++) {
                        childNode.classList.add(cssClass[i]);
                    }
                } else if (typeof cssClass === 'string') {
                    childNode.className = cssClass;
                }

                childNode.appendChild(document.createTextNode(text || ''));

                return childNode;     
            }

            function generatorAttributesNode(element, attributes) {
                if (attributes) {
                    let i, n, attribute;
                    for (i = 0;  i < (n = attributes.length); i++) {
                        attribute  = attributes.item(i);

                        element.appendChild(createTextNode(' ' + _this.stringify(attribute.nodeName),   constants.classAttributeName));
                        element.appendChild(createTextNode('=',                                         constants.classEquals));
                        element.appendChild(createTextNode('"' + attribute.nodeValue + '"',             constants.classAttributeValue));
                    }
                }
            }

            function computedNestingIndent(indentSpace) {
                return ((indentSpace * settings.pxOfOnceSpace) + 'px');
            }

            // isSwitcherLess:
            //      true: display button `+`
            //      false: display button `-`
            function createSwitcherNode(isSwitcherLess, idRender) {
                let action, prefix, switcherElement;

                if (isSwitcherLess) {
                    action = constants.switchLessAction;
                    prefix = constants.switchLessPrefix;
                    switcherElement = createTextNode('', [
                        constants.classSwitcher,
                        constants.classSwitcherCollapsed
                    ]);
                } else {
                    action = constants.switchMoreAction;
                    prefix = constants.switchMorePrefix;
                    switcherElement = createTextNode('', constants.classSwitcher);
                }

                switcherElement.dataset.action = action;
                switcherElement.dataset.id = idRender;

                switcherElement.onclick  = function () {
                    _this.toggleElement(this);
                }

                switcherElement.id = prefix + idRender;

                return switcherElement;
            }

            function generator(container, xmlRootNode, indentSpace) {
                if (!xmlRootNode || !container) {
                    return false;
                }

                if (indentSpace !== undefined) {
                    startWithIndentSpace = indentSpace;
                }

                // When in the tag no has any data like that <tag></tag> output will be <tag/>
                if (xmlRootNode.childNodes.length === 0 && settings.useShortTag) {
                    const containerLessElement = createElement();

                    containerLessElement.appendChild(createElement('span', constants.classOneLineCode, null, false));

                    // Create a short tag node like that:
                    // <Hello />
                    // Hello attribute="123abc" />
                    containerLessElement.appendChild(createTextNode(
                        '<',
                        [
                            constants.classBracket,
                            constants.classBracketOpen
                        ]
                    ));
                    containerLessElement.appendChild(createTextNode(_this.stringify(xmlRootNode.nodeName), constants.classNodeName));
                    generatorAttributesNode(containerLessElement, xmlRootNode.attributes);
                    containerLessElement.appendChild(createTextNode(' />', [ constants.classBracket, constants.classBracketShortClose ]));

                    addClass(containerLessElement, constants.classNodeUncollapse);

                    container.appendChild(containerLessElement);
                } else {
                    // Do not create shadow and button switcher when the nodes have children and they less than 1
                    //
                    // can not create shadow of a node when view more or less has using inline syntax
                    // can not create button switcher of a node when view more or less has using short tag
                    const canCreateShadowSwitcher = (xmlRootNode.childNodes.length > 1 || (!settings.inline && xmlRootNode.childNodes.length > 0));

                    ///// create shadow of node element
                    // shadow display when user toggle (visible less `xml`) of a node
                    if (canCreateShadowSwitcher) {
                        const containerLessElement = createElement(null, [ constants.classDivContainer, constants.classNodeCollapsed ]);

                        // This will display when user click display `less`
                        containerLessElement.appendChild(createSwitcherNode(true, idRender));

                        // create a node like that:
                        // <Hello attribute="123"></Hello>
                        // <Hello></Hello>
                        containerLessElement.appendChild(
                            createTextNode('<', [ constants.classBracket, constants.classBracketOpen ])
                        );
                        containerLessElement.appendChild(createTextNode(_this.stringify(xmlRootNode.nodeName), constants.classNodeName));
                        generatorAttributesNode(containerLessElement, xmlRootNode.attributes);
                        containerLessElement.appendChild(createTextNode('></', [ constants.classBracket, constants.classBracketClose ]));
                        containerLessElement.appendChild(createTextNode(_this.stringify(xmlRootNode.nodeName), constants.classNodeName));
                        containerLessElement.appendChild(createTextNode('>', constants.classBracket));

                        container.appendChild(containerLessElement);

                        _this.setVisibility(containerLessElement, false);
                    }
                    ///// End generate shadow

                    ///// create all element of xml
                    const containerMoreElement = createElement();

                    addClass(containerMoreElement, constants.classNodeUncollapse);

                    if (canCreateShadowSwitcher) {
                        // This will display when user click display `more`
                        containerMoreElement.appendChild(createSwitcherNode(false, idRender));

                        // add line code
                        containerMoreElement.appendChild(createElement('span', constants.classAddLineCode, 'absolute', false));
                        addClass(containerMoreElement, constants.classNodeParent);
                    }

                    idRender++;

                    // create a node like that:
                    // <Hello attribute="123">
                    // <Hello>
                    containerMoreElement.appendChild(createElement('span', constants.classOneLineCode, false, false));

                    containerMoreElement.appendChild(createTextNode('<', [ constants.classBracket, constants.classBracketOpen ]));
                    containerMoreElement.appendChild(createTextNode(_this.stringify(xmlRootNode.nodeName), constants.classNodeName));
                    generatorAttributesNode(containerMoreElement, xmlRootNode.attributes);
                    containerMoreElement.appendChild(createTextNode('>', constants.classBracket));

                    ///// Loop and continue render if in a node have many node else render only value
                    let i, n, childNode, childNodeValue;
                    let runable = true;

                    // Loop all item and continue run again if they have children in their node
                    for (i = 0; i < (n = xmlRootNode.childNodes.length); i++) {
                        childNode = xmlRootNode.childNodes.item(i);

                        if (settings.removeComment) {
                            runable = (childNode.nodeName !== '#comment' && childNode.nodeName !== '#text')
                        } else {
                            runable = (childNode.nodeName !== '#text')
                        }

                        if (runable) {
                            generator(containerMoreElement, childNode, settings.indentSpace);
                        } else {
                            childNodeValue = childNode.nodeValue;
                        }                 
                    }

                    // set text for a node xml
                    if (childNodeValue) {
                        // check user want to a node is dispay on the line
                        const className = _this.defaultSettings.inline ? constants.classInline : false;
                        const position = _this.defaultSettings.inline ? false : null;
                        const isIndent = _this.defaultSettings.inline ? false : null;

                        const childNodeContainer = createElement(null, className, position, isIndent);
      
                        childNodeContainer.appendChild(createTextNode(childNodeValue, constants.classNodeValue));

                        containerMoreElement.appendChild(childNodeContainer);

                        containerMoreElement.appendChild(createElement('span', constants.classOneLineCode, false, false));
                    }
                    ///// End loop create nesting tag node

                    // Create close tag node like that:
                    // </Hello>
                    containerMoreElement.appendChild(
                        createTextNode('</', [ constants.classBracket, constants.classBracketClose ])
                    );
                    containerMoreElement.appendChild(createTextNode(_this.stringify(xmlRootNode.nodeName), constants.classNodeName));
                    containerMoreElement.appendChild(createTextNode('>', constants.classBracket));

                    container.appendChild(containerMoreElement);
                    ///// End create
                }

                return container;
            }

            // Pure function render xml to browser
            function render(xmlRootNode) {
                let containerNodeElement = createElement('div', false, false, false);
                containerNodeElement.className = constants.classContainer;

                containerNodeElement = generator(containerNodeElement, xmlRootNode, 0);

                //if (!!(!settings.lineNumber)) {
                    return containerNodeElement;
                //}

                // const containerElement = createElement('div',[constants.classContainer, constants.classInline], false, false);

                // const totalLineCode = containerNodeElement.querySelectorAll('.' + constants.classOneLineCode).length || 0;
                // const lineNumberContainer = createElement('div', constants.classLineNumber, false, false);

                // for (let i = 1; i <= totalLineCode; i++) {
                //     lineNumberContainer.appendChild(createElement('span', false, false, false));
                // }

                // containerElement.appendChild(lineNumberContainer);

                // containerElement.appendChild(lineNumberContainer);
                // containerElement.appendChild(containerNodeElement);

                // return containerElement;
            }

            return render;
        },

        empty: function(element) {
            while (element && element.firstChild) {
                element.removeChild(element.firstChild);
            }
                
            return element;
        },

        convertToXmlDOM: function (xmlString) {
            let xmlDom = null;
            xmlString = this.trim(xmlString);

            if (window.ActiveXObject) {
                xmlDom = new ActiveXObject('Microsoft.XMLDOM').loadXML(xmlString);
            } else if (DOMParser) {
                xmlDom = new DOMParser().parseFromString(xmlString, 'application/xml');
            }
            
            return xmlDom;
        },

        addEventListener: function (element, listener, callback) {
            element.addEventListener(listener, callback);
        },

        removeEventListener: function (element, listener) {
            element.removeEventListener(element);
        },

        // trim space when api return xml
        trim: function (text) {
            return (text || '').replace(/^(\s|\u00A0)+|(\s|\u00A0)+$/g, '');
        },

        // Format text with user or default settings
        stringify: function (text) {
            text = text || '';

            if (this.defaultSettings.nodeUpperCase) {
                return text.toUpperCase();
            } else if (this.defaultSettings.nodeLowerCase) {
                return text.toLowerCase();
            }

            return text;
        },

        setVisibility(element, visible) {
            element.style.display = visible ? 'block' : 'none';
        },

        toggleElement: function (element) {
            let elementToShow, elementToHide;

            // get action of user's click
            let action = element.dataset.action;
            let id = element.dataset.id;

            if (action === constants.switchMoreAction) {
                elementToHide = document.getElementById(constants.switchMorePrefix + id);
                elementToShow = document.getElementById(constants.switchLessPrefix + id);
            } else if (action === constants.switchLessAction) {
                elementToShow = document.getElementById(constants.switchMorePrefix + id);
                elementToHide = document.getElementById(constants.switchLessPrefix + id);
            }

            this.setVisibility(elementToHide.parentNode, false);
            this.setVisibility(elementToShow.parentNode, true);
        }
    }

    return xmlFormater;
}));