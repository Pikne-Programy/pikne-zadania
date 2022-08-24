// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html

module.exports = function (config) {
  const isCI = config.browsers[0] === 'FirefoxHeadless'; // inspired by https://github.com/angular/angular-cli/issues/10852#issuecomment-401040641
  console.warn(`CI was${isCI ? '' : ' NOT'} detected.`);
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('karma-firefox-launcher'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    client: {
      jasmine: {
        // you can add configuration options for Jasmine here
        // the possible options are listed at https://jasmine.github.io/api/edge/Configuration.html
        // for example, you can disable the random execution with `random: false`
        // or set a specific seed with `seed: 4321`
      },
      clearContext: false // leave Jasmine Spec Runner output visible in browser
    },
    jasmineHtmlReporter: {
      suppressAll: true // removes the duplicated traces
    },
    coverageReporter: {
      reporters: isCI ? [{ type: 'lcovonly', subdir: '.' }] : [
        { type: 'text' },
        { type: 'text-summary' }
      ]
    },
    reporters: ['progress', 'kjhtml'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_DISABLE,
    browserConsoleLogOptions: { level: "disable" },
    autoWatch: true,
    browsers: ['FirefoxHeadless'],
    singleRun: false,
    restartOnFileChange: true
  });
};
