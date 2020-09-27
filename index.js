import TridocConnection from './TridocConnection.mjs'
import EnexFile from './EnexFile.mjs'

if(process.argv.length < 5) {
  console.log('usage: enex-import path endpoint password')
  process.exit(1)
}

const tridocConnection = new TridocConnection(process.argv[3],process.argv[4])
const enexFile = new EnexFile(process.argv[2])
enexFile.getDocuments().then(documents => {
  if (documents.length === 0) {
    console.log('no notes with pdfs found')
    process.exit(1)
  }

  console.log(`Found ${documents.length} documents. Proceeding with upload.`)
  function processDocs(docs) {
    const failedDocs = []
    function processDoc(pos) {
      return tridocConnection.postDocument(docs[pos]).catch(e => {
        failedDocs.push(docs[pos])
        console.log(`Failed posting ${docs[pos].title} (${pos+1} of ${docs.length}), error: ${e}`)
      }).then(() => {
        pos++
        if (pos < docs.length) {
          return processDoc(pos)
        } else {
          return `processed ${pos} docs`
        }
      })
    }
    return processDoc(0).then(() => failedDocs)
  }
  processDocs(documents).then(failedDocs => {
    if (failedDocs.length === 0) {
      console.log(`\nSuccessfully uploaded ${documents.length} documents.`)
    } else {
      console.log(`\nFailed uploading ${failedDocs.length} of ${documents.length} documents. Retrying.`)
      return processDocs(failedDocs).then(failedAgain => {
        console.log(`\nFollowing ${failedAgain.length} documents could not be uploaded: \n - ${failedAgain.map(doc => doc.title).join('\n - ')} `)
      })
    }
  })
})