# Custom Actions for Sajilo Sewa Chatbot
# This file contains all the custom actions required to handle specific logic, such as validating forms and storing data.

from rasa_sdk import Action, FormValidationAction
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet
import pandas as pd

class ValidateApplySchemeForm(FormValidationAction):
    def name(self) -> str:
        return "validate_apply_scheme_form"

    async def run(self, dispatcher: CollectingDispatcher, tracker, domain):
        # Custom validation for slots in apply_scheme_form
        required_slots = ["scheme_name", "person_name", "contact_number", "gp_name"]
        for slot_name in required_slots:
            if tracker.get_slot(slot_name) is None:
                dispatcher.utter_message(text=f"Please provide your {slot_name.replace('_', ' ')}.")
                return [SlotSet("requested_slot", slot_name)]
        return []

class ActionConfirmApplication(Action):
    def name(self) -> str:
        return "action_confirm_application"

    async def run(self, dispatcher: CollectingDispatcher, tracker, domain):
        # Confirm application details after collecting all required information
        scheme_name = tracker.get_slot("scheme_name")
        person_name = tracker.get_slot("person_name")
        dispatcher.utter_message(
            text=f"Thank you, {person_name}. Your request for the {scheme_name} has been received. We will get back to you shortly."
        )
        return []

class ActionStoreFormData(Action):
    def name(self) -> str:
        return "action_store_form_data"

    async def run(self, dispatcher: CollectingDispatcher, tracker, domain):
        # Collect slot values
        scheme_name = tracker.get_slot("scheme_name")
        person_name = tracker.get_slot("person_name")
        contact_number = tracker.get_slot("contact_number")
        gp_name = tracker.get_slot("gp_name")

        # Store data in a pandas DataFrame
        data = {
            "scheme_name": [scheme_name],
            "person_name": [person_name],
            "contact_number": [contact_number],
            "gp_name": [gp_name],
        }
        df = pd.DataFrame(data)

        # Save DataFrame to a CSV file for persistent storage
        df.to_csv("form_data.csv", mode='a', index=False, header=False)

        dispatcher.utter_message(text="Your details have been recorded successfully.")
        return []

class ActionProvideEmergencyContact(Action):
    def name(self) -> str:
        return "utter_contact_details"

    async def run(self, dispatcher: CollectingDispatcher, tracker, domain):
        # Provide emergency contact details based on contact type
        contact_type = tracker.get_slot("contact_type")
        contact_details = {
            "Medical Assistance": "The medical emergency contact number is 108. You can also reach the local health center at 123-456-7890.",
            "Fire Services": "The fire services contact number is 101.",
            "Police Assistance": "The police emergency contact number is 100.",
            "Disaster Helpline": "The disaster helpline number is 1077."
        }
        response = contact_details.get(contact_type, "I'm sorry, I don't have the contact information for that service.")
        dispatcher.utter_message(text=response)
        return []

# This actions.py file provides the required actions for form validation, storing user data, and responding to specific user queries.