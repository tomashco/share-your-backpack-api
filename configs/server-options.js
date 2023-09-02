// Pass --options via CLI arguments in command to enable these options.
module.exports.options = {
  ajv: {
    customOptions: {
      removeAdditional: 'all'
    }
  }
}
