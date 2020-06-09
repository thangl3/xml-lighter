(function () {
  const xml = convertToXmlDOM(document.getElementById("code").value);

  renderXmlDOM('xml', xml, {
    inline: true,

    // this is default setting
    useShortTag: false,
    indentSpace: 4,
    removeComment: true,
    nodeLowerCase: false,
    nodeUpperCase: false
  });
}());