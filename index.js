import { default as sax } from 'sax';
import { createReadStream } from 'fs';
import { parse } from 'path';
import atob from 'atob';
import { postDocument } from './post-document.mjs';


/**
 * to process the parsed xml we use contexts that match
 * the XML Elements we're interested.
 * 
 * A context may have the following functions: 
 * - open: invoked when the context is opened, i.e. when the opening tag is parsed
 * - close: invoked when the closing tag is parsed
 * - text, cdata: invoked when a text/cdata section is parsed
 * 
 * A context may also have an property tags mapping element-names to contexts. When 
 * a respective opening tag is encountered the context is set to tags[tagName] till
 * the element is closed.
 */
const rootContext = {
  tags: {
    note: {
      open: function() {
        this.value = {
          pdfs: [],
          tags: []
        }
      },
      tags: {
        title: {
          text: function (value) {
            rootContext.tags.note.value.title = value
          }
        },
        created: {
          text: function (value) {
            rootContext.tags.note.value.created = value
          }
        },
        tag: {
          text: function (value) {
            rootContext.tags.note.value.tags.push(value)
          }
        },
        resource: {
          open: function() {
            this.value = {}
          },
          tags: {
            data: {
              text: function (value) {
                rootContext.tags.note.tags.resource.value.data = atob(value)
              }
            },
            mime: {
              text: function (value) {
                rootContext.tags.note.tags.resource.value.mime = value
              }
            },
            'file-name': {
              text: function (value) {
                rootContext.tags.note.tags.resource.value.fileName = value
              }
            }
          },
          close: function () {
            if (this.value.mime === 'application/pdf') {
              rootContext.tags.note.value.pdfs.push({
                fileName: this.value.fileName,
                data: this.value.data
              })
            }
          }
        },
        content: {
          cdata: function (value) {
            rootContext.tags.note.value.content = value
          }
        },
      },
      close: function () {
        this.value.pdfs.forEach(pdf => {
          const {pdfs, ...document} = this.value
          document.pdf = pdf
          if (pdfs.length > 1) {
            document.title += ' - ' + pdf.fileName
          }
          postDocument(document)
        })
      }
    }
  }
}

let currentContextTag = null
let currentContext = null
const contextStack = []

function setContext(c) {
  contextStack.push({
    contex: currentContext,
    tag: currentContextTag
  })
  currentContext = c
}

function resetContext() {
  const stackEntry = contextStack.pop()
  currentContext = stackEntry.contex
  currentContextTag = stackEntry.tag
}

setContext(rootContext)

const parser = sax.parser(true)
const saxStream = sax.createStream(true, {})

saxStream.on("error", function (e) {
  console.error("error!", e)
})

saxStream.on("opentag", function (node) {
  if (currentContext && currentContext.tags) {
    if (currentContext.tags[node.name]) {
      setContext(currentContext.tags[node.name])
      if (currentContext.open) currentContext.open(node)
      currentContextTag = node.name
    }
  }
})

saxStream.on("text", function (value) {
  if (currentContext && currentContext.text) {
    currentContext.text(value)
  }
})

saxStream.on("cdata", function (value) {
  if (currentContext && currentContext.cdata) {
    currentContext.cdata(value)
  }
})

saxStream.on("closetag", function (tagName) {
  if (currentContextTag === tagName) {
    if (currentContext.close) currentContext.close()
    resetContext()
  }
  //console.log('closed tag '+ tagName)
})

if(process.argv.length < 3) {
  console.log('usage: enex-import path')
  process.exit(1)
}

createReadStream(process.argv[2])
  .pipe(saxStream)