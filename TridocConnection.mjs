import fetch from 'node-fetch'
import btoa from 'btoa';

function convertDate(str) {
  return str.substring(0, 4) + '-' +
    str.substring(4, 6) + '-' +
    str.substring(6, 11) + ':' +
    str.substring(11, 13) + ':' +
    str.substring(13);
}

export default class TridocConnection {
  constructor(endpoint, password) {
    this.endpoint = endpoint
    this.password = password
  }

  postDocument(document) {
    const connection = this

    return postPdf().then(setTitle).then(setContentAsComment).then(addTags)

    function postPdf() {
      return fetch(connection.endpoint + '/doc?date=' + encodeURIComponent(convertDate(document.created)), {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa('tridoc:' + connection.password),
          'Content-Type': 'application/pdf'
        },
        body: document.pdf.data
      }).then(r => {
        if (r.status >= 400) {
          return r.text().then(j => Promise.reject(j));
        } else {
          return r.headers.get("Location")
        }
      })
    }

    function setContentAsComment(location) {
      return fetch(connection.endpoint + location + '/comment', {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa('tridoc:' + connection.password),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 'text': document.content })
      }).then(r => {
        if (r.status >= 400) {
          return r.text().then(j => Promise.reject(j))
        } else {
          return location
        }
      })
    }

    function setTitle(location) {
      return fetch(connection.endpoint + location + '/title', {
        method: 'PUT',
        headers: {
          'Authorization': 'Basic ' + btoa('tridoc:' + connection.password),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 'title': document.title })
      }).then(r => {
        if (r.status >= 400) {
          return r.text().then(j => Promise.reject(j))
        } else {
          return location
        }
      })
    }

    function addTags(location) {
      return Promise.all(document.tags.map(addTag)).then(() => location)

      function createTag(label) {
        return fetch(connection.endpoint + '/tag', {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + btoa('tridoc:' + connection.password),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ label })
        }).then(r => {
          if (r.status >= 400) {
            return r.text().then(j => Promise.reject(j))
          } else {
            return location
          }
        })
      }

      function assignTag(label) {
        return fetch(connection.endpoint + location + '/tag', {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + btoa('tridoc:' + connection.password),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ label })
        }).then(r => {
          if (r.status >= 400) {
            return r.text().then(j => Promise.reject(j))
          } else {
            return location
          }
        })
      }

      function addTag(label) {
        return createTag(label).catch(e => console.log('DEBUG: ' + e)).then(() => assignTag(label))
      }
    }

  }
}