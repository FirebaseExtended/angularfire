# Contributing | AngularFire

Thank you for contributing to the Firebase community!

 - [Have a usage question?](#question)
 - [Think you found a bug?](#issue)
 - [Have a feature request?](#feature)
 - [Want to submit a pull request?](#submit)
 - [Need to get set up locally?](#local-setup)


## <a name="question"></a>Have a usage question?

We get lots of those and we love helping you, but GitHub is not the best place for them. Issues
which just ask about usage will be closed. Here are some resources to get help:

- Start with the [quickstart](/docs/quickstart.md)
- Go through the [guide](/docs/guide/README.md)
- Read the full [API reference](/docs/reference.md)
- Try out some [examples](/README.md#examples)

If the official documentation doesn't help, try asking a question on the
[AngularFire Google Group](https://groups.google.com/forum/#!forum/firebase-angular) or one of our
other [official support channels](https://firebase.google.com/support/).

**Please avoid double posting across multiple channels!**


## <a name="issue"></a>Think you found a bug?

Yeah, we're definitely not perfect!

Search through [old issues](https://github.com/firebase/angularfire/issues) before submitting a new
issue as your question may have already been answered.

If your issue appears to be a bug, and hasn't been reported,
[open a new issue](https://github.com/firebase/angularfire/issues/new). Please use the provided bug
report template and include a minimal repro.

If you are up to the challenge, [submit a pull request](#submit) with a fix!


## <a name="feature"></a>Have a feature request?

Great, we love hearing how we can improve our products! After making sure someone hasn't already
requested the feature in the [existing issues](https://github.com/firebase/angularfire/issues), go
ahead and [open a new issue](https://github.com/firebase/angularfire/issues/new). Feel free to remove
the bug report template and instead provide an explanation of your feature request. Provide code
samples if applicable. Try to think about what it will allow you to do that you can't do today? How
will it make current workarounds straightforward? What potential bugs and edge cases does it help to
avoid?


## <a name="submit"></a>Want to submit a pull request?

Sweet, we'd love to accept your contribution! [Open a new pull request](https://github.com/firebase/angularfire/pull/new/master)
and fill out the provided form.

**If you want to implement a new feature, please open an issue with a proposal first so that we can
figure out if the feature makes sense and how it will work.**

Make sure your changes pass our linter and the tests all pass on your local machine. We've hooked
up this repo with continuous integration to double check those things for you.

Most non-trivial changes should include some extra test coverage. If you aren't sure how to add
tests, feel free to submit regardless and ask us for some advice.

Finally, you will need to sign our [Contributor License Agreement](https://cla.developers.google.com/about/google-individual)
before we can accept your pull request.


## <a name="local-setup"></a>Need to get set up locally?

If you'd like to contribute to AngularFire, you'll need to do the following to get your environment
set up.

### Install Dependencies

```bash
$ git clone https://github.com/firebase/angularfire.git
$ cd angularfire            # go to the angularfire directory
$ npm install -g grunt-cli  # globally install grunt task runner
$ npm install               # install local npm build / test dependencies
$ grunt install             # install Selenium server for end-to-end tests
```

### Create a Firebase Project

1. Create a Firebase project [here](https://console.firebase.google.com).
2. Set the `ANGULARFIRE_TEST_DB_URL` environment variable to your project's database URL:

```bash
$ export ANGULARFIRE_TEST_DB_URL="https://<YOUR-DATABASE-NAME>.firebaseio.com"
```

3. Update the entire `config` variable in [`tests/initialize.js`](/tests/initialize.js) to
correspond to your Firebase project. You can find your `apiKey` and `databaseUrl` by clicking the
**Web Setup** button at `https://console.firebase.google.com/project/<projectId>/authentication/users`.

### Download a Service Account JSON File

1. Follow the instructions [here](https://firebase.google.com/docs/server/setup#add_firebase_to_your_app)
on how to create a service account for your project and furnish a private key.
2. Copy the credentials JSON file to `tests/key.json`.

### Lint, Build, and Test

```bash
$ grunt            # lint, build, and test

$ grunt build      # lint and build

$ grunt test       # run unit and e2e tests
$ grunt test:unit  # run unit tests
$ grunt test:e2e   # run e2e tests (via Protractor)

$ grunt watch      # lint, build, and test whenever source files change
```

The output files - `angularfire.js` and `angularfire.min.js` - are written to the `/dist/` directory.
