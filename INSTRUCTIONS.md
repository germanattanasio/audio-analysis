# Watson Hands On Labs - Audio Analysis

During this lab, you will use the [AlchemyLanguage][alchemy_language] and [Speech to Text][speech_to_text] services to build an application that transcribes audio from YouTube videos in real time, and then applies NLP services to annotate the transcription using AlchemyLanguage. The finished application will display the real-time annotation and the associated concepts that have been identified in the transcribed text as a user-provided YouTube video plays.

![Demo](http://g.recordit.co/I5NZgI4lvY.gif)

So let’s get started. The first thing to do is to build out the shell of our application in Bluemix.

## Creating a [IBM Bluemix][bluemix] Account

  1. Go to https://bluemix.net/
  2. Create a Bluemix account if required.
  3. Log in with your IBM ID (the ID used to create your Bluemix account) 

**Note:** The confirmation email from Bluemix mail take up to 1 hour.

## Deploy this sample application in Bluemix

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

1. Connect to Bluemix by running the following commands in a terminal window:

  ```none
  cf api https://api.ng.bluemix.net
  cf login
  ```

1. Create and retrieve service keys to access the [AlchemyLanguage][alchemy_language] service by running the following command:

  ```none
  cf create-service alchemy_api free alchemy-language-service
  cf create-service-key alchemy-language-service myKey
  cf service-key alchemy-language-service myKey
  ```

1. Create and retrieve service keys to access the [Speech to Text][speech_to_text] service by running the following command:

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
    
1. Push the updated application live by running the following command:

  ```none
  cf push
  ```
  

Right now, our app is interesting, but we can add more functionality into it to make it much more useful.

## Modify the existing application

1. It's time to edit our source code and add one more of the Watson services into the app.

1. Open the `app.js` file.

1. Uncomment from line 57 to line 63 and comment line 66. The final method should look like:

  ```js
  app.post('/api/concepts', function(req, res, next) {
     alchemyLanguage.concepts(req.body, function(err, result) {
       if (err)
         next(err);
       else
         res.json(result);
     });
  });
  ```

  The code above will connect the app to the [Alchemy Language][alchemy_language] service.

  We've added AlchemyLanguage, but we need to update our application to reflect these changes. :rocket:

1. Install the dependencies you application need:

  ```none
  npm install
  ```

1. Start the application locally:

  ```none
  npm start
  ```

1. Test your application by going to: [http://localhost:3000/](http://localhost:3000/)



## Deploying your application to Bluemix    

1. Push the updated application live by running the following command:

  ```none
  cf push
  ```

## Test

After completing the steps above, you are ready to test your application. Start a browser and enter the URL of your application.

                  <application-name>.mybluemix.net

You can also find your application name when you click on your application in Bluemix.



# Congratulations

You have completed the Audio Analysis Lab! :bowtie:

 ![Congratulations](http://i.giphy.com/ENagATV1Gr9eg.gif)

[sign_up]: https://bluemix.net/registration
[bluemix]: https://console.ng.bluemix.net/
[wdc_services]: http://www.ibm.com/watson/developercloud/services-catalog.html
[speech_to_text]: http://www.ibm.com/watson/developercloud/doc/speech-to-text
[alchemy_language]: http://www.ibm.com/watson/developercloud/doc/alchemylanguage
[cloud_foundry]: https://github.com/cloudfoundry/cli

