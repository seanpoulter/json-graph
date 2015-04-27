# Testing Angular Applications #

This is a walkthrough to setup a Windows environment to perform JavaScript unit testing and end-to-end testing of Angular (or web) applications using Protractor, Karma test runner, and Jasmine (spec).


## Setup ##

### node.js ###
Install node.js from  [Node.js Downloads](https://nodejs.org/download/) ([v0.12.2 x64](http://nodejs.org/dist/v0.12.2/x64/node-v0.12.2-x64.msi)). Verify the installation running `node --version` from the command prompt.

### protractor ###
Install protractor using npm with `npm install -g protractor` from the command prompt. Verify the installation with `protractor --version`.

To build with the optional dependencies, node-gyp (Generate Your Projects) requires [Python v2.x](https://www.python.org/getit/windows) ([v2.7.9](https://www.python.org/ftp/python/2.7.9/python-2.7.9.msi)). If you are installing Python v2.x with an existing Python v3.x installation make sure _Add python.exe to Path_ is disabled.

A compiler is also required, and either the [Windows SDK](https://www.microsoft.com/en-us/download/confirmation.aspx?id=8279) or [VisualStudio for Desktop](https://www.visualstudio.com/downloads/download-visual-studio-vs) are recommended in the [installation instructions](https://github.com/TooTallNate/node-gyp#installation) on the GitHub repo.

Two issues were encountered getting the Windows SDK to work on Windows 7:

  1. If the WinSDK fails to install there may be a conflict with an existing Visual C++ Redistributable. I blanket uninstalled the existing Redistributables to move onto the next issue.

  2. There is a [known issue](https://github.com/node-xmpp/node-expat/issues/57#issuecomment-21547903) that nodejs fails to find the Windows SDK path from the Registry. Specify this with: `call "<Windows SDK Install Path>\bin\Setenv.cmd" /Release /x64`

Rebuild protractor with the optional dependencies and specifying the Python version `npm install -g protractor --python=python2.7` or configure npm to always use it with `npm config set python python2.7`.


### Java ###
Despite having [multiple language bindings](http://www.seleniumhq.org/download/), off the shelf protractor requires Java [to be installed](http://www.oracle.com/technetwork/java/javase/downloads/index.html) ([SDK 8 update 45 x64](http://download.oracle.com/otn-pub/java/jdk/8u45-b14/jdk-8u45-windows-x64.exe)) to use the Selenium webdriver API.


### webdriver-manager ###
webdriver-manager was installed with protractor, but you may want to install or update the binaries. If you're not going to _try_ testing with IE, skip the first command to install it:
```
webdriver-manager --ie install
webdriver-manager update
```

Verify that you can start each browser with `webdriver-manager --(chrome|ie) start`.


### karma ###
To run unit tests, install the Karma test runner and some extra packages to help report code coverage and give us better notifications.

```
npm install -g karma karma-cli karma-jasmine
npm install -g karma-chrome-launcher karma-phantomjs-launcher
npm install -g karma-coverage growly karma-growl-reporter

karma --version
```


### Growl for Windows ###
To receive UI notifications as the Karma task runner completes, install [Growl for Windows](http://www.growlforwindows.com/) ([v2.0.9](http://www.growlforwindows.com/gfw/d.ashx?f=GrowlInstaller.exe)). We'll configure karma to use the karma-growl-reporter to use it below. There are different display styles, with the [Translucent Dark Display](http://softwarebakery.com/frozencow/translucentdark.html) as a favourite.



## Unit Tests with Karma and Jasmine ##

## Configuration ##
Run the following to have Karma help setup your config:
```
karma init karma.conf.js
```

We'll have to [manually configure](https://github.com/karma-runner/karma-coverage#configuration) the file to add code coverage reports. Add values to `preprocessors:` and `reporters:`, and adding a new `coverageReporter:` property.

To enable notifications using Growl, add `'growl'` to the `reporters:` array.

You're now good to go.


## Running Tests ##
Start the Karma test runner:
  ```
  karma start karma.conf.js
  ```

And now you can dive into the TDD/BDD test cycle of:
  1. Write a test that fails.
  2. Make it pass.
  3. Repeat.
  4. Profit.

Check out the [Jasmine docs](http://jasmine.github.io/2.0/introduction.html).



---

### TODO: End-to-End tests with Protractor ###


# TODO: PhantomJS #
For headless (windowless) testing, the JavaScript-based browser [PhantomJS](https://nodejs.org/download/) ([v2.0.0](https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-2.0.0-windows.zip
v2.0.0)) can be used. Since it is not a full-feature browser, it should be used with an inherent degree of risk. PhantomJS has it's own browser automation implementation of webdriver, called GhostDriver, ported to JavaScript. To use it .... TODO.

# TODO: Growl and Pushover #

```

```

----


Why don't we use $log in our angular apps?
