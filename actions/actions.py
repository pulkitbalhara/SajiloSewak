import sqlite3
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from typing import Any, Text, Dict, List

class ActionFetchSchemeDetails(Action):

    def name(self) -> Text:
        return "action_fetch_scheme_details"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:

        # Get the selected scheme ID from the slot
        scheme_id = tracker.get_slot("bullet_id")

        # Connect to SQLite database
        connection = sqlite3.connect('data/data.sqlite')
        cursor = connection.cursor()

        # Query the database for scheme details based on scheme_id
        cursor.execute("SELECT scheme_name, details FROM Schemes WHERE scheme_id=?", (scheme_id,))
        result = cursor.fetchone()

        # If a result is found, display it
        if result:
            scheme_name, details = result
            response = f"Here are the details of the scheme:\n{scheme_name}: {details}"
        else:
            response = "Sorry, I couldn't find details for that scheme."

        # Close the database connection
        connection.close()

        # Send the response back to the user
        dispatcher.utter_message(text=response)

        return []

class ActionSubmitApplication(Action):

    def name(self) -> Text:
        return "action_submit_application"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:

        # Get the necessary information from slots
        scheme_id = tracker.get_slot("bullet_id")
        name = tracker.get_slot("name")
        phone_number = tracker.get_slot("phone_number")

        # Connect to SQLite database
        connection = sqlite3.connect('data/data.sqlite')
        cursor = connection.cursor()

        # Insert user application into the database
        cursor.execute("INSERT INTO User_Applications (scheme_selected, name, phone_number) VALUES (?, ?, ?)",
                       (scheme_id, name, phone_number))

        # Commit the transaction and close the connection
        connection.commit()
        connection.close()

        # Confirmation message
        dispatcher.utter_message(
            text=f"Your application for scheme {scheme_id} has been successfully submitted. "
                 f"We will contact you at {phone_number} shortly."
        )

        return []
