const babel = require("@babel/core");
const UglifyJS = require('uglify-js')
const {
  promisify
} = require('util')
const fs = require('fs')

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const FILE_PATH = './src/mavo-firebase.js'

run()
  .catch(err => {
    console.error(err)
  })

async function run() {
  const result = await readFile(FILE_PATH, 'utf8')

  const es5 = await babel.transformAsync(result, {
    filename: FILE_PATH
  })

  const min = UglifyJS.minify({
    [FILE_PATH]: es5.code
  }, {
    sourceMap: true
  })

  await Promise.all([
    writeFile('./mavo-firebase.js', min.code),
    writeFile('./mavo-firebase.js.map', min.map)
  ])
}
