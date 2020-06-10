# xml-display

Sometimes, you want to display XML files or XML datas within HTML for the debug or testing you XML. This simple library will help you about that.

## Features
- Syntax highlighting
- Collapsible
- Easy to use, easy to configure your custom

## How to use this simple library

Example:
```js
const holderElm = document.getElementById('div'); // element id holder, to be rendering
const xmlString = '.....'; // your xml document string here

xmlLighter(holderElm, xmlString, {
  inline: true,

  // this is default setting
  useShortTag: false,
  indentSpace: 4,
  removeComment: true,
  nodeLowerCase: false,
  nodeUpperCase: false
});
```

## How to test it

1. After clone and install all dependencies, you run command `npm run dev`
2. The browser will opens link `localhost:3000`, click on link with prefix `.html`
3. See you document formatted.
