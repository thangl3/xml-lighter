(function () {
  const holderElm = document.getElementById('xml');
  //const xmlString = document.getElementById("code").value

  const xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      const xmlString = xhr.responseXML;

      xmlLighter(holderElm, xmlString, {
        inline: true,

        // this is default setting
        useShortTag: false,
        indentSpace: 4,
        removeComment: true,
        nodeLowerCase: false,
        nodeUpperCase: false
      });
    }
  };
  xhr.open('GET', '/dist/book.xml');
  xhr.send();
}());