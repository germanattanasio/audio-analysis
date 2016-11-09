# Watson Hands On Labs - Audio Analysis

This lab was originally created as a part of the World Developer Conference in Nov 2016.

During this lab, you will use the AlchemyAPI and Speech-to-Text services to build an application that transcribes audio from YouTube videos in real time, and then applies NLP services to annotate the transcription using AlchemyLanguage. The finished application will display the real-time annotation and the associated concepts that have been identified in the transcribed text as a user-provided YouTube video plays.

So let’s get started. The first thing to do is to build out the shell of our application in Bluemix.

## Creating a [IBM Bluemix][bluemix] Account

  1. Go to https://bluemix.net/
  2. Create a Bluemix account if required.
  3. Log in with your IBM ID (the ID used to create your Bluemix account) 

**Note:** The confirmation email from Bluemix mail take up to 1 hour.

## Deploy this sample application in Bluemix

  1. Clone the repository into your computer.
  2. [Sign up][sign_up] in Bluemix or use an existing account.
  3. If it is not already installed on your system, download and install the [Cloud-foundry CLI][cloud_foundry] tool.
  4. Edit the `manifest.yml` file in the folder that contains your code and replace `audio-analysis-starter-kit` with a unique name for your application. The name that you specify determines the application's URL, such as `application-name.mybluemix.net`. The relevant portion of the `manifest.yml` file looks like the following:

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

  6. Connect to Bluemix by running the following commands in a terminal window:

  ```sh
  cf api https://api.ng.bluemix.net
  cf login -u <your-Bluemix-ID> -p <your-Bluemix-password>
  ```

  7. Create an instance of the Speech to Text in Bluemix by running the following command:

  ```sh
  cf create-service speech_to_text standard speech-to-text-service
  ```

  8. Create the [AlchemyLanguage][alchemy_language] service:

  ```sh
  cf create-service alchemy_api free alchemylanguage-service
  ```

  9. Push the updated application live by running the following command:

  ```sh
  cf push
  ```
  

Right now, our app is interesting, but we can add more functionality into it to make it much more useful.

## Modify the existing application

  1. It's time to edit our source code and add one more of the Watson services into the app.

  2. Open the `app.js` file.

  3. Uncomment from line 57 to line 63 and comment line 66. The final method should look like:

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

  4. Save the file.

  We've added AlchemyLanguage, but we need to update our application to reflect these changes.

## Deploy

  1. The last step in order to complete our application is to deploy our changes to Bluemix. To do this, we need to push our new code to the application. 

  2. Push the updated application live by running the following command:

  ```sh
  cf push
  ```

## Test

To test out our application, go back to the "Success!" page and click on the "View App" button again.

You will see the finished application, which utilizes the Speech to Text and AlchemyLanguage capabilities to provide a useful tool for users to transcribe Videos and identify concepts on them.


# Congratulations

You have completed the Personalized Recommendations Lab! :bowtie:

[sign_up]: https://bluemix.net/registration
[bluemix]: https://console.ng.bluemix.net/
[wdc_services]: http://www.ibm.com/watson/developercloud/services-catalog.html
[alchemy_language]: http://www.ibm.com/watson/developercloud/doc/alchemylanguage
[cloud_foundry]: https://github.com/cloudfoundry/cli
