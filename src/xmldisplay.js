(function (global, factory) {
    const xmlFormater = factory();

    function loadXMLDOM (holderElementId, xmlDom, options) {
        options = options || {};

        const xmlHolderElement = document.getElementById(holderElementId);

        if (xmlDom || xmlHolderElement) {
            // If in block of parent has content like `xml` or other... clear all them
            xmlFormater.empty(xmlHolderElement);

            const container = document.createElement('div');
            container.className = 'xml-formatter';

            let render = xmlFormater.init(options);
            render(container, xmlDom.documentElement, 0);

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
        classInline             : 'inline-flex',
        classNodeName           : 'node-name',
        classNodeValue          : 'node-value',
        classSwitcher           : 'switcher',
        classBracket            : 'bracket',
        classAttributeName      : 'node-attribute-name',
        classAttributeValue     : 'node-attribute-value',
        classDivContainer       : 'node',
        classAddLineCode        : 'line-code',
        classSwitcherCollapsed  : 'collapsed',
        classBackgroundCollapse : 'background-collapsed'
    };

    const xmlFormater = {
        defaultSettings: {
            containerTag: 'div',
            containerPosition: 'relative', // css position attributes liek that: "relative", "static", "fixed" or "absolute"
            indentSpace: 4,
            pxOfOnceSpace: 7, // each once space (tab) equals 7px
            removeComment: true,
            nodeLowerCase: false,
            nodeUpperCase: false,
            inline: true,
            useShortTag: true
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

            function createContainer(tagName, cssClass, position, isIndent) {
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
                
                if (position !== false) {
                    containerElement.style.position = position || settings.containerPosition;
                }

                if (isIndent !== false) {
                    containerElement.style.left = computedNestingIndent(startWithIndentSpace);
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
                        element.appendChild(createTextNode('=',                                         constants.classBracket));
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

            function render(xmlHolderElement, xmlRootNode, indentSpace) {
                if (!xmlRootNode || !xmlHolderElement) {
                    return false;
                }

                if (indentSpace !== undefined) {
                    startWithIndentSpace = indentSpace;
                }

                // When in the tag no has any data like that <tag></tag> output will be <tag/>
                if (xmlRootNode.childNodes.length === 0 && settings.useShortTag) {
                    const containerLessElement = createContainer();

                    // Create a short tag node like that:
                    // <Hello />
                    // Hello attribute="123abc" />
                    containerLessElement.appendChild(createTextNode('<', constants.classBracket));
                    containerLessElement.appendChild(createTextNode(_this.stringify(xmlRootNode.nodeName), constants.classNodeName));
                    generatorAttributesNode(containerLessElement, xmlRootNode.attributes);
                    containerLessElement.appendChild(createTextNode(' />'));

                    xmlHolderElement.appendChild(containerLessElement);
                } else {
                    ///// create shadow of node element
                    const containerLessElement = createContainer(null, [ constants.classDivContainer ]);

                    // Disable view more or less for node has using inline syntax and have children are less than or equals 1
                    if (xmlRootNode.childNodes.length > 1 || !settings.inline) {
                        // This will display when user click display `less`
                        containerLessElement.appendChild(createSwitcherNode(true, idRender));

                        addClass(containerLessElement, constants.classBackgroundCollapse);
                    }

                    // create a node like that:
                    // <Hello attribute="123">world</Hello>
                    // <Hello>world</Hello>
                    // <Hello></Hello>
                    containerLessElement.appendChild(createTextNode('<', constants.classBracket));
                    containerLessElement.appendChild(createTextNode(_this.stringify(xmlRootNode.nodeName), constants.classNodeName));
                    generatorAttributesNode(containerLessElement, xmlRootNode.attributes);
                    containerLessElement.appendChild(createTextNode('></', constants.classBracket));
                    containerLessElement.appendChild(createTextNode(_this.stringify(xmlRootNode.nodeName), constants.classNodeName));
                    containerLessElement.appendChild(createTextNode('>', constants.classBracket));

                    xmlHolderElement.appendChild(containerLessElement);

                    _this.setVisibility(containerLessElement, false);
                    ///// End generate shadow

                    const containerMoreElement = createContainer();

                    // Disable view more or less for node has using short tag and have children are less than or equals 1
                    if (xmlRootNode.childNodes.length > 1 || !settings.inline) {
                        // This will display when user click display `more`
                        containerMoreElement.appendChild(createSwitcherNode(false, idRender));

                        addClass(containerMoreElement, constants.classAddLineCode);
                    }

                    idRender++;

                    // create a node like that:
                    // <Hello attribute="123">
                    // <Hello>
                    containerMoreElement.appendChild(createTextNode('<', constants.classBracket));
                    containerMoreElement.appendChild(createTextNode(_this.stringify(xmlRootNode.nodeName), constants.classNodeName));
                    generatorAttributesNode(containerMoreElement, xmlRootNode.attributes);
                    containerMoreElement.appendChild(createTextNode('>', constants.classBracket));

                    ///// Loop and continue render if in a node have many node else render only value
                    let i, n, childNode, childNodeValue;
                    let runable = true;

                    for (i = 0; i < (n = xmlRootNode.childNodes.length); i++) {
                        childNode = xmlRootNode.childNodes.item(i);

                        if (settings.removeComment) {
                            runable = (childNode.nodeName !== '#comment' && childNode.nodeName !== '#text')
                        } else {
                            runable = (childNode.nodeName !== '#text')
                        }

                        if (runable) {
                            render(containerMoreElement, childNode, settings.indentSpace);
                        } else {
                            childNodeValue = childNode.nodeValue;
                        }                 
                    }

                    // set text for a node xml
                    if (childNodeValue) {
                        // check user want to a node is dispay on the line
                        const className = _this.defaultSettings.inline ? constants.classInline : false;
                        const position = _this.defaultSettings.inline ? false : null;

                        const childNodeContainer = createContainer(null, className, position);
      
                        childNodeContainer.appendChild(createTextNode(childNodeValue, constants.classNodeValue));

                        containerMoreElement.appendChild(childNodeContainer);
                    }
                    ///// End loop create nesting tag node

                    // Create close tag node like that:
                    // </Hello>
                    containerMoreElement.appendChild(createTextNode('</', constants.classBracket));
                    containerMoreElement.appendChild(createTextNode(_this.stringify(xmlRootNode.nodeName), constants.classNodeName));
                    containerMoreElement.appendChild(createTextNode('>', constants.classBracket));

                    xmlHolderElement.appendChild(containerMoreElement);
                }
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
