import fetch from 'node-fetch'
import btoa from 'btoa';

function convertDate(str) {
  return str.substring(0,4) + '-' +
         str.substring(4,6) + '-' +
         str.substring(6,11) + ':' +
         str.substring(11,13) + ':' +
         str.substring(13);
}

export function postDocument (document, endpoint, password) {
  //console.log(`Note ${document.title}\n`)
  return fetch(endpoint+'/doc?date='+encodeURIComponent(convertDate(document.created)), {
        method: 'POST',
        headers: {
            'Authorization': 'Basic ' + btoa('tridoc:'+password),
            'Content-Type': 'application/pdf'
        },
        body: document.pdf.data
    }).then(r => {
      if (r.status >= 400) {
        return r.text().then(j => Promise.reject(j));
      } else {
          return r.headers.get("Location")
      }
    }).then(location => {
      return fetch(endpoint+location+'/title', {
        method: 'PUT',
        headers: {
            'Authorization': 'Basic ' + btoa('tridoc:'+password),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({'title': document.title})
    }).then(r => {
      //console.log(r)
    })
  })
}