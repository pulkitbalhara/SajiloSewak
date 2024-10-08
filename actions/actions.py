from rasa_sdk import Action
from rasa_sdk.events import SlotSet

class ActionSaveUserData(Action):
    def name(self):
        return "action_save_user_data"

    def run(self, dispatcher, tracker, domain):
        # Retrieve the slot values
        phone_number = tracker.get_slot('phone_number')
        gpu_id = tracker.get_slot('gpu_id')
        name = tracker.get_slot('name')
        location = tracker.get_slot('location')

        # Save data logic (for example, save to a database or a file)
        # Replace this with your actual save function
        #save_to_database(phone_number, gpu_id, name, location)

        # Acknowledge the user
        dispatcher.utter_message(text="Your details have been saved.")
        return []


# This files contains your custom actions which can be used to run
# custom Python code.
#
# See this guide on how to implement these action:
# https://rasa.com/docs/rasa/custom-actions


# This is a simple example for a custom action which utters "Hello World!"

# from typing import Any, Text, Dict, List
#
# from rasa_sdk import Action, Tracker
# from rasa_sdk.executor import CollectingDispatcher
#
#
# class ActionHelloWorld(Action):
#
#     def name(self) -> Text:
#         return "action_hello_world"
#
#     def run(self, dispatcher: CollectingDispatcher,
#             tracker: Tracker,
#             domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
#
#         dispatcher.utter_message(text="Hello World!")
#
#         return []
