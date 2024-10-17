from typing import Any, Text, Dict, List
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher

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

        # Fetch the response from the domain file dynamically
        response_template = domain["responses"]["utter_details_submitted"][0]["text"]
        
        # Customize the response with slot values
        response = response_template.format(
            scheme_name=scheme_name,
            phone_number=phone_number,
            GPU_location=GPU_location
        )

        # Send the customized response back to the user
        dispatcher.utter_message(text=response)

        # No slot clearing after submission
        return []