(function () {
  const holderElm = document.getElementById('xml');
  const xmlDom = convertToXmlDOM(document.getElementById("code").value);

  xmlLighter(holderElm, xmlDom, {
    inline: true,

    // this is default setting
    useShortTag: false,
    indentSpace: 4,
    removeComment: true,
    nodeLowerCase: false,
    nodeUpperCase: false
  });
}());