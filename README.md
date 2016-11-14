# Audio Analysis [![Build Status](https://travis-ci.org/watson-developer-cloud/audio-analysis.svg?branch=master)](https://travis-ci.org/watson-developer-cloud/audio-analysis)

This application is a **Starter Kit** (SK) that is designed to get you up and running quickly with a common industry pattern, and to provide information about best practices around Watson services. The **Audio Analysis** application was created to highlight the combination of the [Speech to Text][speech_to_text] (STT) and [AlchemyLanguage][alchemy_language] services as an [Audio Analysis](#about-the-audio-analysis-pattern) tool. This application can serve as the basis for your own applications that follow that pattern.

![Demo](http://g.recordit.co/I5NZgI4lvY.gif
)

[Demo](https://audio-analysis-starter-kit.mybluemix.net/).

**Note**: This sample application only works on desktop computer
systems, and then only in the Firefox and Chrome web browsers.

## Table of Contents
  - [How this app works](#how-this-app-works)
  - [Getting Started](#getting-started)
  - [About the Audio Analysis pattern](#about-the-audio-analysis-pattern)
    - [When to use this pattern](#when-to-use-this-pattern)
    - [Best practices](#best-practices)
    - [Reference information](#reference-information)
      - [Speech to Text](#speech-to-text)
      - [AlchemyLanguage](#alchemylanguage)
  - [User interface in this sample application](#user-interface-in-this-sample-application)
  - [Troubleshooting](#troubleshooting)

### How this app works
The Audio Analysis application extracts concepts from YouTube videos.

To begin, select or specify a YouTube video. As the video streams, the [Speech to Text][speech_to_text] service transcribes its audio track. That text is then piped to the [AlchemyLanguage][alchemy_language] service for analysis, it extracts concepts from the transcription with an associated score.

### Getting started

1. Clone the repository into your computer.

  ```none
  git clone https://github.com/watson-developer-cloud/audio-analysis.git
  ```

1. [Sign up][sign_up] in Bluemix or use an existing account.

1. If it is not already installed on your system, download and install the [Cloud-foundry CLI][cloud_foundry] tool.

1. Edit the `manifest.yml` file in the folder that contains your code and replace `audio-analysis-starter-kit` with a unique name for your application. The name that you specify determines the application's URL, such as `application-name.mybluemix.net`. The relevant portion of the `manifest.yml` file looks like the following:

    ```yml
    applications:
    - services:
      - speech-to-text-service
      - alchemy-language-service
      name: application-name
      command: npm start
      path: .
      memory: 512M
    ```

1. Connect to Bluemix:

  ```none
  cf api https://api.ng.bluemix.net
  cf login
  ```

1. Create and retrieve service keys to access the [AlchemyLanguage][alchemy_language] service:

  ```none
  cf create-service alchemy_api free alchemy-language-service
  cf create-service-key alchemy-language-service myKey
  cf service-key alchemy-language-service myKey
  ```

1. Create and retrieve service keys to access the [Speech to Text][speech_to_text] service:

  ```none
  cf create-service speech_to_text standard speech-to-text-service
  cf create-service-key speech-to-text-service myKey
  cf service-key speech-to-text-service myKey
  ```

1. Create a `.env` file in the root directory of your clone of the project repository by copying the sample `.env.example` file using the following command:

  ```none
  cp .env.example .env
  ```
  You will update the `.env` with the information you retrieved in steps 6 and 7.

  The `.env` file will look something like the following:

  ```none
  ALCHEMY_LANGUAGE_API_KEY=
  SPEECH_TO_TEXT_USERNAME=
  SPEECH_TO_TEXT_PASSWORD=
  ```

1. Install the dependencies you application need:

  ```none
  npm install
  ```

1. Start the application locally:

  ```none
  npm start
  ```

1. Open a browser and go to: [http://localhost:3000/](http://localhost:3000/)

1. Push the application to Bluemix:

  ```none
  cf push
  ```

After completing the steps above, you are ready to test your application. Start a browser and enter the URL of your application.

            <your application name>.mybluemix.net

See the [User interface in this sample application](#user-interface-in-the-sample-application) section for information about modifying the existing user interface to support other video sources.

### About the Audio Analysis pattern

First, make sure you read the [Reference Information](#reference-information) to understand the services that are involved in this pattern.

#### Using the Speech To Text and the AlchemyLanguage services

When a quality audio signal contains terms found in the current source of concepts in AlchemyLanguage, the combination of Speech To Text and AlchemyLanguage can be used to analyze the audio source to build summaries, indices, and to provide recommendations for additional related content. Though the Speech-To-Text service supports several languages, the AlchemyLanguage service currently only supports English.

The Audio Analysis app uses the node.js Speech-To-Text JavaScript SDK, which is a client-side library for audio transcriptions from the Speech To Text service. It also uses the `concepts` feature from AlchemyLanguage to extract concepts.

#### When to use this pattern

* You need to analyze or index content contained within speech.
* You want to make content recommendations based on speech.

#### Best practices

* The quality of the audio source determines the quality of the transcript, which affects the quality of extracted concepts and recommendations.
* The quality and confidence of the extracted concepts increases with the amount of transcribed text.

#### Reference information
The following links provide more information about the AlchemyLanguage and Speech to Text services, including tutorials on using those services:

##### AlchemyLanguage

* [API documentation](http://www.ibm.com/watson/developercloud/doc/alchemylanguage/): Get an in-depth understanding of the AlchemyLanguage service
* [API explorer](https://watson-api-explorer.mybluemix.net/apis/alchemy-language-v1): Try out the REST API

##### Speech To Text

* [API documentation](http://www.ibm.com/watson/developercloud/doc/speech-to-text/): Get an in-depth understanding of the Speech To Text service
* [API reference](http://www.ibm.com/watson/developercloud/speech-to-text/api/v1/): SDK code examples and reference
* [API Explorer](https://watson-api-explorer.mybluemix.net/apis/speech-to-text-v1): Try out the API

### User interface in this sample application

The user interface that this sample application provides is intended as an example, and is not proposed as the user interface for your applications. However, if you want to use this user interface, you will want to modify the following files:

* `src/views/index.ejs` - Lists the YouTube videos and footer values that are shown on the demo application's landing page. These items are defined using string values that are set in the CSS for the application.
* `src/views/videoplay.js` - Maps YouTube video URLs to API calls and initiates streaming. You will want to expand or modify this if you want to use another video source or player.
* `src/index.js` - Supports multiple types of YouTube URLs. You will want to expand or modify this if you want to use another video source or player.

### Troubleshooting

When troubleshooting your Bluemix app, the most useful source of information is the execution logs. To see them, run:

  ```sh
  $ cf logs <application-name> --recent
  ```

### Open Source @ IBM
  Find more open source projects on the [IBM GitHub Page](http://ibm.github.io/)

### License

  This sample code is licensed under the Apache 2.0 license. Full license text is available in [LICENSE](LICENSE).

### Contributing

  See [CONTRIBUTING](CONTRIBUTING.md).


[cloud_foundry]: https://github.com/cloudfoundry/cli
[sign_up]:https://console.ng.bluemix.net/registration/
[speech_to_text]: http://www.ibm.com/watson/developercloud/speech-to-text.html
[alchemy_language]: http://www.ibm.com/watson/developercloud/alchemy-language.html
