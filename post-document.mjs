function convertDate(str) {
  return str.substring(0,4) + '-' +
         str.substring(4,6) + '-' +
         str.substring(6,11) + ':' +
         str.substring(11,13) + ':' +
         str.substring(13);
}

export function postDocument (document, enpoint, password) {
  console.log(`Note ${document.title}\n`)
}