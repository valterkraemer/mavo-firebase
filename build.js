const babel = require("@babel/core");
const UglifyJS = require('uglify-js')
const {
  promisify
} = require('util')
const fs = require('fs')

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const files = [
  //'./src/firebase.js',
  './src/mavo-firebase.js'
]

run()
  .catch(err => {
    console.error(err)
  })

async function run() {
  const results = await Promise.all(files.map(async file => {
    const result = await readFile(file, 'utf8')

    return babel.transformAsync(result, {
      filename: file
    })
  }))

  // console.log('min', results[1].code)

  const obj = {}
  files.forEach((file, index) => {
    obj[file] = results[index].code
  })

  const min = UglifyJS.minify(obj, {
    sourceMap: true
  })

  await Promise.all([
    writeFile('./mavo-firebase.js', min.code),
    writeFile('./mavo-firebase.js.map', min.map)
  ])
}
