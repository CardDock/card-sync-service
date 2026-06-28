module.exports = {
  default: {
    require: ['test/features/step_definitions/**/*.ts'],
    paths: ['test/features/**/*.feature'],
    requireModule: ['ts-node/register'],
  },
};
