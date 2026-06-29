module.exports = {
  default: {
    require: ['tests/bdd/step_definitions/**/*.ts'],
    paths: ['tests/bdd/features/**/*.feature'],
    requireModule: ['ts-node/register'],
  },
};
