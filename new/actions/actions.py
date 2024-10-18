from typing import Any, Text, Dict, List
from rasa_sdk import Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.forms import FormValidationAction
from rasa_sdk import Action

class ValidateSchemeApplyForm(FormValidationAction):
    def name(self) -> Text:
        return "validate_scheme_apply_form"
    

    async def validate_phone_number(
        self,
        value: Text,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> Dict[Text, Any]:
        # Check if the phone number is a valid 10-digit number
        if value.isdigit() and len(value) == 10:
            return {"phone_number": value}
        else:
            dispatcher.utter_message(text="Please enter a valid 10-digit phone number.")
            return {"phone_number": None}  # Will trigger re-prompting of the slot

    async def validate_GPU_location(
        self,
        value: Text,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> Dict[Text, Any]:
        # Check if the GPU location is a non-empty string
        if len(value) > 0 and len(value) < 50:  # Example condition to avoid overly long strings
            return {"GPU_location": value}
        else:
            dispatcher.utter_message(text="Please provide a valid GPU location.")
            return {"GPU_location": None}  # Will trigger re-prompting of the slot
        

class ActionSubmitSchemeForm(Action):

    def name(self) -> Text:
        return "action_submit_scheme_form"

    async def run(
        self, 
        dispatcher: CollectingDispatcher, 
        tracker: Tracker, 
        domain: Dict[Text, Any]
    ) -> List[Dict[Text, Any]]:
        # Fetch the values from the slots
        scheme_name = tracker.get_slot("scheme_name")
        phone_number = tracker.get_slot("phone_number")
        GPU_location = tracker.get_slot("GPU_location")

        # Dynamically create the response
        response = f"Your application for the {scheme_name} scheme with contact number {phone_number} from {GPU_location} is successfully submitted. We will connect with you shortly."

        # Send the customized response back to the user
        dispatcher.utter_message(text=response)

        # No slot clearing after submission
        return []
